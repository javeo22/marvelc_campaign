import { createEvent, FixedClock, IncrementingIdFactory } from "@/domain/commands";
import { campaignDefinition } from "@/domain/content";
import { replayCampaign } from "@/domain/reducer";
import type { CampaignEvent, CampaignSave } from "@/domain/types";
import { checksumSync } from "@/storage/checksum";
export function fixtureSave(events?: CampaignEvent[]): CampaignSave {
  const clock = new FixedClock("2026-09-08T12:00:00.000Z");
  const ids = new IncrementingIdFactory();
  const journal = events ?? [createEvent("CAMPAIGN_CREATED", 1, { playMode: "fail-forward" }, { clock, ids, deviceId: "device-a" })];
  const replay = replayCampaign(campaignDefinition, journal, "fail-forward");
  if (!replay.ok) throw new Error(replay.error.message);
  return {
    schemaVersion: "1.0.0", saveId: "save-test", name: "Cloud Campaign", campaignId: "core-protocol", definitionVersion: campaignDefinition.version,
    playMode: "fail-forward", createdAt: clock.now(), updatedAt: clock.now(), deviceId: "device-a",
    sequence: journal.length, snapshot: replay.value, events: journal, checksum: checksumSync({ snapshot: replay.value, events: journal })
  };
}
export function progressed(save = fixtureSave(), id = "event-next", aspect = "protection") {
  return fixtureSave([...save.events, {
    eventId: id, sequence: save.sequence + 1, type: "ISSUE_STARTED", occurredAt: "2026-09-08T12:01:00.000Z", deviceId: "device-a",
    payload: { issueNumber: 1, aspect, selectedFieldAssetIds: [] }, clientMutationId: `${id}-mutation`
  }]);
}
