import nextEnv from "@next/env";
import fs from "node:fs";
import { Pool } from "pg";
import { cloudConfigStatus } from "../src/integrations/cloud/config";
nextEnv.loadEnvConfig(process.cwd());
const migrate = process.argv.includes("--migrate");
const status = cloudConfigStatus();
if (!process.env.DATABASE_URL || (!migrate && (!status.enabled || !status.configured))) {
  console.error("Cloud configuration is incomplete. Follow docs/CLOUD_SYNC_SETUP.md; enter credentials securely, never in chat.");
  process.exit(1);
}
const pool = new Pool({ connectionString: process.env.DATABASE_URL, max: 1, connectionTimeoutMillis: 10000 });
try {
  if (migrate) {
    await pool.query(fs.readFileSync("database/002_oauth_cloud_saves.sql", "utf8"));
    console.log("Cloud save table migration completed.");
  } else {
    await pool.query("SELECT owner_id, save_id, revision, save, updated_at FROM companion_cloud_saves LIMIT 0");
    console.log("Cloud configuration and database table verified. Real provider sign-in and a two-device round trip must still be tested.");
  }
} catch {
  console.error("Database operation failed. Check the secure connection URL, access, and table migration. Credentials were not printed.");
  process.exitCode = 1;
} finally { await pool.end(); }
