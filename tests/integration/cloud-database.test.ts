// @vitest-environment node
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { listSaves, readSave, writeSave, type CloudDatabase, type SqlConnection } from "@/integrations/cloud/database";
import { fixtureSave, progressed } from "../fixtures/cloud-save";
const pg = new PGlite();
function connection(db: Pick<PGlite, "query">): SqlConnection {
  return { async query<T>(sql: string, values?: unknown[]) { return db.query<T>(sql, values); } };
}
const db: CloudDatabase = { ...connection(pg), transaction: (work) => pg.transaction((tx) => work(connection(tx))) };
beforeAll(async () => { await pg.exec(fs.readFileSync("database/002_oauth_cloud_saves.sql", "utf8")); }, 20000);
beforeEach(async () => { await pg.exec("TRUNCATE companion_cloud_saves"); });
afterAll(async () => { await pg.close(); });
describe("PostgreSQL cloud save transactions", () => {
  it("creates, lists, restores, and appends a save", async () => {
    const save = fixtureSave();
    expect(await writeSave(db, "github:a", save, null)).toMatchObject({ revision: 1 });
    expect(await listSaves(db, "github:a")).toHaveLength(1);
    expect((await readSave(db, "github:a", save.saveId)).save).toEqual(save);
    expect(await writeSave(db, "github:a", progressed(save), 1)).toMatchObject({ revision: 2 });
    expect((await readSave(db, "github:a", save.saveId)).save.sequence).toBe(2);
  });
  it("isolates users even when save IDs are identical", async () => {
    const save = fixtureSave();
    await writeSave(db, "github:a", save, null);
    expect(await listSaves(db, "github:b")).toEqual([]);
    await expect(readSave(db, "github:b", save.saveId)).rejects.toMatchObject({ status: 404 });
    await writeSave(db, "github:b", { ...save, name: "Other user" }, null);
    expect((await readSave(db, "github:a", save.saveId)).save.name).toBe(save.name);
  });
  it("rejects stale revisions, first-write races, and older journals without changing data", async () => {
    const save = fixtureSave();
    await writeSave(db, "github:a", save, null);
    await expect(writeSave(db, "github:a", progressed(save), null)).rejects.toMatchObject({ status: 409 });
    await writeSave(db, "github:a", progressed(save), 1);
    await expect(writeSave(db, "github:a", save, 1)).rejects.toMatchObject({ status: 409 });
    await expect(writeSave(db, "github:a", save, 2)).rejects.toMatchObject({ status: 409 });
    expect((await readSave(db, "github:a", save.saveId)).revision).toBe(2);
  });
  it("rejects divergent histories and rewritten events", async () => {
    const save = progressed();
    await writeSave(db, "github:a", save, null);
    await expect(writeSave(db, "github:a", progressed(fixtureSave(), "event-next", "aggression"), 1)).rejects.toMatchObject({ status: 409 });
    expect((await readSave(db, "github:a", save.saveId)).save).toEqual(save);
  });
  it("serializes concurrent writes so only one device advances the revision", async () => {
    const save = fixtureSave();
    await writeSave(db, "github:a", save, null);
    const results = await Promise.allSettled([writeSave(db, "github:a", progressed(save), 1), writeSave(db, "github:a", progressed(save, "other-device"), 1)]);
    expect(results.filter((result) => result.status === "fulfilled")).toHaveLength(1);
    expect((await readSave(db, "github:a", save.saveId)).revision).toBe(2);
  });
});
