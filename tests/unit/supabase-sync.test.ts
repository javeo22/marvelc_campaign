import { describe, expect, it } from "vitest";
import { createEvent, FixedClock, IncrementingIdFactory } from "@/domain/commands";
import { campaignDefinition } from "@/domain/content";
import { createInitialSnapshot, reduceCampaign } from "@/domain/reducer";
import { campaignSaveFromCloudRows, cloudSaveSummaryFromRow } from "@/integrations/supabase/sync";
import { checksumSync } from "@/storage/checksum";

function sampleCloudSaveRow() {
  const clock = new FixedClock("2026-09-08T12:00:00.000Z");
  const ids = new IncrementingIdFactory();
  const event = createEvent("CAMPAIGN_CREATED", 1, { playMode: "fail-forward" }, { clock, ids, deviceId: "device-a" });
  const initial = createInitialSnapshot(campaignDefinition, "fail-forward");
  const replay = reduceCampaign(campaignDefinition, initial, event);
  if (!replay.ok) throw new Error(replay.error.message);
  return {
    saveRow: {
      save_id: "save-test",
      user_id: "user-test",
      name: "Cloud Campaign",
      schema_version: "1.0.0",
      campaign_id: "core-protocol",
      definition_version: campaignDefinition.version,
      play_mode: "fail-forward" as const,
      device_id: "device-a",
      sequence: replay.value.sequence,
      snapshot: replay.value,
      checksum: checksumSync({ snapshot: replay.value, events: [event] }),
      created_at: event.occurredAt,
      updated_at: event.occurredAt,
      cloud_updated_at: "2026-09-08T12:05:00.000Z"
    },
    eventRows: [
      {
        save_id: "save-test",
        user_id: "user-test",
        sequence: event.sequence,
        event_id: event.eventId,
        client_mutation_id: event.clientMutationId ?? null,
        event,
        occurred_at: event.occurredAt
      }
    ]
  };
}

describe("Supabase sync row mapping", () => {
  it("summarizes a cloud save from the derived snapshot", () => {
    const { saveRow } = sampleCloudSaveRow();
    expect(cloudSaveSummaryFromRow(saveRow)).toMatchObject({
      saveId: "save-test",
      name: "Cloud Campaign",
      phase: "new",
      intel: 0,
      network: 0,
      sequence: 1
    });
  });

  it("hydrates and replays cloud events before returning a local save", () => {
    const { saveRow, eventRows } = sampleCloudSaveRow();
    const save = campaignSaveFromCloudRows(saveRow, eventRows);
    expect(save.name).toBe("Cloud Campaign");
    expect(save.sequence).toBe(1);
    expect(save.events).toHaveLength(1);
    expect(save.checksum).toBe(checksumSync({ snapshot: save.snapshot, events: save.events }));
  });

  it("rejects a cloud save without its append-only journal", () => {
    const { saveRow } = sampleCloudSaveRow();
    expect(() => campaignSaveFromCloudRows(saveRow, [])).toThrow(/event journal/);
  });
});
