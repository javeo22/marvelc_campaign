import { Pool } from "pg";
import type { CampaignSave } from "@/domain/types";
import { CloudError, journalIsPrefix, summarizeSave, validateCloudSave } from "./saves";

export interface SqlConnection {
  query<T>(sql: string, values?: unknown[]): Promise<{ rows: T[] }>;
}
export interface CloudDatabase extends SqlConnection {
  transaction<T>(work: (connection: SqlConnection) => Promise<T>): Promise<T>;
}
let pool: Pool | undefined;
export function cloudDatabase(): CloudDatabase {
  if (!process.env.DATABASE_URL) throw new CloudError(503, "Cloud storage is not configured.");
  pool ??= new Pool({ connectionString: process.env.DATABASE_URL, max: 2, connectionTimeoutMillis: 10000, idleTimeoutMillis: 10000 });
  const current = pool;
  return {
    async query<T>(sql: string, values?: unknown[]) { const result = await current.query(sql, values); return { rows: result.rows as T[] }; },
    async transaction<T>(work: (connection: SqlConnection) => Promise<T>) {
      const client = await current.connect();
      try {
        await client.query("BEGIN");
        const result = await work({ async query<R>(sql: string, values?: unknown[]) { const result = await client.query(sql, values); return { rows: result.rows as R[] }; } });
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK");
        throw error;
      } finally { client.release(); }
    }
  };
}
interface SaveRow { save: CampaignSave; revision: number; updated_at: Date | string }
const updatedAt = (row: SaveRow) => new Date(row.updated_at).toISOString();
export async function listSaves(db: CloudDatabase, ownerId: string) {
  const result = await db.query<SaveRow>("SELECT save, revision, updated_at FROM companion_cloud_saves WHERE owner_id = $1 ORDER BY updated_at DESC LIMIT 100", [ownerId]);
  return result.rows.map((row) => summarizeSave(row.save, row.revision, updatedAt(row)));
}
export async function readSave(db: CloudDatabase, ownerId: string, saveId: string) {
  const result = await db.query<SaveRow>("SELECT save, revision, updated_at FROM companion_cloud_saves WHERE owner_id = $1 AND save_id = $2", [ownerId, saveId]);
  const row = result.rows[0];
  if (!row) throw new CloudError(404, "Cloud save not found for this account.");
  return { save: validateCloudSave(row.save), revision: row.revision, cloudUpdatedAt: updatedAt(row) };
}
export async function writeSave(db: CloudDatabase, ownerId: string, save: CampaignSave, expectedRevision: number | null) {
  return db.transaction(async (tx) => {
    // Locks existing AND first writes. Concurrent devices cannot create two branches.
    await tx.query("SELECT pg_advisory_xact_lock(hashtextextended($1, 0))", [`${ownerId}:${save.saveId}`]);
    const result = await tx.query<SaveRow>("SELECT save, revision, updated_at FROM companion_cloud_saves WHERE owner_id = $1 AND save_id = $2 FOR UPDATE", [ownerId, save.saveId]);
    const prior = result.rows[0];
    if ((prior?.revision ?? null) !== expectedRevision) throw new CloudError(409, "Cloud copy changed on another device. Sync again before uploading.");
    if (prior && !journalIsPrefix(prior.save, save)) throw new CloudError(409, "Both devices have different progress. Export both copies before choosing a branch; neither copy was overwritten.");
    const revision = (prior?.revision ?? 0) + 1;
    const written = await tx.query<SaveRow>(`INSERT INTO companion_cloud_saves (owner_id, save_id, revision, save)
      VALUES ($1, $2, $3, $4::jsonb)
      ON CONFLICT (owner_id, save_id) DO UPDATE SET revision = EXCLUDED.revision, save = EXCLUDED.save, updated_at = now()
      RETURNING save, revision, updated_at`, [ownerId, save.saveId, revision, JSON.stringify(save)]);
    return { revision, cloudUpdatedAt: updatedAt(written.rows[0]) };
  });
}
