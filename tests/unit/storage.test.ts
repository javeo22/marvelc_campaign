import "fake-indexeddb/auto";
import { beforeEach, describe, expect, it } from "vitest";
import { parseImportJson } from "@/storage/export-import";
import {
  appendCampaignEvents,
  createLocalSave,
  exportRepositoryState,
  getCampaignSave,
  listCampaignSaves,
  resetLocalDatabaseForTests
} from "@/storage/indexeddb";

describe("IndexedDB save repository", () => {
  beforeEach(async () => {
    await resetLocalDatabaseForTests();
  });

  it("creates multiple local saves and appends event plus snapshot atomically", async () => {
    const save = await createLocalSave({ name: "Core Protocol", playMode: "fail-forward", deviceId: "device-a" });
    await createLocalSave({ name: "Canon Copy", playMode: "canon", deviceId: "device-a" });
    expect(await listCampaignSaves()).toHaveLength(2);

    const next = await appendCampaignEvents(save.saveId, [
      { type: "ISSUE_STARTED", payload: { issueNumber: 1, aspect: "protection", selectedFieldAssetIds: [] } },
      { type: "COUNTER_CHANGED", payload: { counterId: "round", value: 2 } }
    ]);
    expect(next.sequence).toBe(3);
    expect(next.snapshot.activeSession?.issueNumber).toBe(1);
    expect(next.events).toHaveLength(3);

    const restored = await getCampaignSave(save.saveId);
    expect(restored?.snapshot).toEqual(next.snapshot);
    expect(restored?.checksum).toBe(next.checksum);
  });

  it("deduplicates client mutation IDs before appending", async () => {
    const save = await createLocalSave({ name: "Core Protocol", playMode: "fail-forward" });
    const next = await appendCampaignEvents(save.saveId, [
      {
        type: "OBJECTIVE_COMPLETED",
        payload: { issueNumber: 1, flagId: "bomb-defused" },
        clientMutationId: "objective-once"
      },
      {
        type: "OBJECTIVE_COMPLETED",
        payload: { issueNumber: 1, flagId: "bomb-defused" },
        clientMutationId: "objective-once"
      }
    ]);
    expect(next.snapshot.intel).toBe(1);
    expect(next.events.filter((event) => event.clientMutationId === "objective-once")).toHaveLength(1);
  });

  it("exports repository state without metadata caches or images", async () => {
    await createLocalSave({ name: "Core Protocol", playMode: "fail-forward" });
    const exported = await exportRepositoryState();
    expect(exported.saves).toHaveLength(1);
    expect(JSON.stringify(exported)).not.toMatch(/\.(png|jpg|jpeg|webp|avif)/i);
  });

  it("rejects oversized import text before parsing", async () => {
    await expect(parseImportJson(" ".repeat(3_000_001))).rejects.toThrow(/larger than/);
  });

  it("rejects prototype pollution keys in import JSON", async () => {
    await expect(parseImportJson('{"__proto__":{},"manifest":{"app":"core-protocol-companion","schemaVersion":"1","exportedAt":"x","contentVersion":"1"},"saves":[],"deckLogs":[],"rulesLogs":[]}')).rejects.toThrow(/forbidden/);
  });
});
