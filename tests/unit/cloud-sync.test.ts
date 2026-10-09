import "fake-indexeddb/auto";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { synchronizeLinkedSaves, enableSaveSync, downloadSave } from "@/integrations/cloud/sync";
import { createLocalSave, getCampaignSave, getCloudLink, listCloudLinks, openCoreDb, resetLocalDatabaseForTests, setCloudLink } from "@/storage/indexeddb";
import { fixtureSave, progressed } from "../fixtures/cloud-save";
import { SyncRequestError } from "@/integrations/cloud/client";
const mocks = vi.hoisted(() => ({ account: vi.fn(), pull: vi.fn(), push: vi.fn() }));
vi.mock("@/integrations/cloud/client", () => ({
  cloudFeatureEnabled: () => true, getCloudStatus: async () => ({ enabled: true, configured: true }),
  getCurrentAccount: mocks.account, pullCampaignSave: mocks.pull, pushCampaignSave: mocks.push,
  SyncRequestError: class extends Error { constructor(public status: number, message: string) { super(message); } }
}));
async function deviceSave(save = fixtureSave()) {
  const db = await openCoreDb();
  const { events, ...record } = save;
  await db.put("campaign_saves", record);
  for (const event of events) await db.put("campaign_events", { saveId: save.saveId, event });
}
beforeEach(async () => {
  await resetLocalDatabaseForTests(); vi.clearAllMocks();
  mocks.account.mockResolvedValue({ id: "github:owner", username: "Player" });
  mocks.pull.mockResolvedValue({ save: fixtureSave(), revision: 1 });
  mocks.push.mockResolvedValue({ revision: 2 });
});
afterEach(() => vi.restoreAllMocks());
describe("Offline-first client sync", () => {
  it("requires explicit upload before local progress is linked", async () => {
    await createLocalSave({ name: "Local only", playMode: "fail-forward" });
    await synchronizeLinkedSaves();
    expect(mocks.push).not.toHaveBeenCalled();
    expect(await listCloudLinks()).toEqual([]);
    await deviceSave();
    await enableSaveSync("save-test");
    expect((await getCloudLink("save-test"))?.ownerId).toBe("github:owner");
  });
  it("pulls newer compatible progress and retains the prior device copy", async () => {
    await deviceSave(); await setCloudLink({ saveId: "save-test", ownerId: "github:owner", revision: 1, name: "Cloud Campaign" });
    mocks.pull.mockResolvedValue({ save: progressed(), revision: 2 });
    await synchronizeLinkedSaves();
    expect((await getCampaignSave("save-test"))?.sequence).toBe(2);
    expect(await (await openCoreDb()).getAll("migration_backups")).toHaveLength(1);
    expect(mocks.push).not.toHaveBeenCalled();
  });
  it("pushes offline changes on the next sync", async () => {
    await deviceSave(progressed()); await setCloudLink({ saveId: "save-test", ownerId: "github:owner", revision: 1, name: "Cloud Campaign" });
    await synchronizeLinkedSaves();
    expect(mocks.push).toHaveBeenCalledWith(progressed(), 1, "github:owner");
    expect((await getCloudLink("save-test"))?.revision).toBe(2);
  });
  it("keeps both divergent branches and announces the conflict", async () => {
    await deviceSave(progressed()); await setCloudLink({ saveId: "save-test", ownerId: "github:owner", revision: 1, name: "Cloud Campaign" });
    mocks.pull.mockResolvedValue({ save: progressed(fixtureSave(), "other-device", "aggression"), revision: 2 });
    const notices: string[] = [];
    const listen = (event: Event) => notices.push((event as CustomEvent).detail.message);
    window.addEventListener("core-protocol:cloud-sync-status", listen);
    try { await synchronizeLinkedSaves(); } finally { window.removeEventListener("core-protocol:cloud-sync-status", listen); }
    expect((await getCampaignSave("save-test"))?.events[1].eventId).toBe("event-next");
    expect(mocks.push).not.toHaveBeenCalled(); expect(notices.join(" ")).toContain("Neither copy was overwritten");
  });
  it("never automatically uploads one account's linked save into another account", async () => {
    await deviceSave(); await setCloudLink({ saveId: "save-test", ownerId: "google:other", revision: 1, name: "Cloud Campaign" });
    await synchronizeLinkedSaves(); expect(mocks.pull).not.toHaveBeenCalled();
    await expect(enableSaveSync("save-test")).rejects.toThrow(/another account/);
    await expect(downloadSave("save-test")).rejects.toThrow(/another account/);
  });
  it("keeps local changes on a network failure and retries later", async () => {
    await deviceSave(progressed()); await setCloudLink({ saveId: "save-test", ownerId: "github:owner", revision: 1, name: "Cloud Campaign" });
    mocks.pull.mockRejectedValueOnce(new SyncRequestError(503, "Unavailable"));
    await synchronizeLinkedSaves(); expect((await getCampaignSave("save-test"))?.sequence).toBe(2);
    await synchronizeLinkedSaves(); expect(mocks.push).toHaveBeenCalledWith(progressed(), 1, "github:owner");
  });
  it("does not overwrite a local tap made while a cloud pull is in flight", async () => {
    await deviceSave(); await setCloudLink({ saveId: "save-test", ownerId: "github:owner", revision: 1, name: "Cloud Campaign" });
    mocks.pull.mockImplementationOnce(async () => { await deviceSave(progressed(fixtureSave(), "local-tap")); return { save: progressed(fixtureSave(), "cloud-tap"), revision: 2 }; });
    await synchronizeLinkedSaves();
    expect((await getCampaignSave("save-test"))?.events[1].eventId).toBe("local-tap");
  });
});
