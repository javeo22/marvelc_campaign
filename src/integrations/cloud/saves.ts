import { z } from "zod";
import { campaignDefinition } from "@/domain/content";
import { replayCampaign } from "@/domain/reducer";
import type { CampaignEvent, CampaignSave } from "@/domain/types";
import { canonicalJson, checksumSync } from "@/storage/checksum";
import { CURRENT_SAVE_SCHEMA_VERSION, hasUnknownEvent } from "@/storage/migrations";

export class CloudError extends Error {
  constructor(public status: number, message: string) { super(message); }
}
const identifier = z.string().min(1).max(160).regex(/^[a-zA-Z0-9_-]+$/);
export const saveIdSchema = identifier;
const envelope = z.object({
  schemaVersion: z.literal(CURRENT_SAVE_SCHEMA_VERSION),
  saveId: identifier,
  name: z.string().trim().min(1).max(200),
  campaignId: z.literal("core-protocol"),
  definitionVersion: z.string().min(1).max(40),
  playMode: z.enum(["fail-forward", "canon"]),
  createdAt: z.iso.datetime(), updatedAt: z.iso.datetime(), deviceId: identifier,
  sequence: z.number().int().positive().max(20000),
  snapshot: z.unknown(), checksum: z.string().min(1).max(100),
  events: z.array(z.object({
    eventId: identifier, sequence: z.number().int().positive(), type: z.string().min(1).max(80),
    occurredAt: z.iso.datetime(), payload: z.record(z.string(), z.unknown()),
    deviceId: identifier.optional(), clientMutationId: identifier.optional()
  }).strict()).min(1).max(20000)
}).strict();

export function validateCloudSave(input: unknown): CampaignSave {
  const parsed = envelope.safeParse(input);
  if (!parsed.success) throw new CloudError(400, "Save format is invalid. Export a backup before retrying.");
  const save = parsed.data;
  if (save.definitionVersion !== campaignDefinition.version) throw new CloudError(400, "Campaign definition version is unsupported. Update this device before syncing.");
  const events = save.events as CampaignEvent[];
  if (events[0].type !== "CAMPAIGN_CREATED" || hasUnknownEvent(events) || events.length !== save.sequence) {
    throw new CloudError(400, "Save event journal is invalid.");
  }
  const ids = new Set<string>();
  const mutations = new Set<string>();
  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1 || ids.has(event.eventId) || (event.clientMutationId && mutations.has(event.clientMutationId))) {
      throw new CloudError(400, "Save event journal has gaps or duplicate events.");
    }
    if (index > 0 && event.type === "CAMPAIGN_CREATED") throw new CloudError(400, "Campaign creation cannot be repeated.");
    ids.add(event.eventId);
    if (event.clientMutationId) mutations.add(event.clientMutationId);
  }
  try {
    const replay = replayCampaign(campaignDefinition, events, save.playMode);
    if (!replay.ok || canonicalJson(replay.value) !== canonicalJson(save.snapshot) || save.checksum !== checksumSync({ snapshot: replay.value, events })) {
      throw new CloudError(400, "Save snapshot or checksum does not match its event journal.");
    }
    return { ...save, snapshot: replay.value, events };
  } catch (error) {
    if (error instanceof CloudError) throw error;
    throw new CloudError(400, "Save events cannot be replayed.");
  }
}

export function journalIsPrefix(prefix: CampaignSave, longer: CampaignSave): boolean {
  return prefix.playMode === longer.playMode && prefix.createdAt === longer.createdAt &&
    prefix.events.length <= longer.events.length &&
    prefix.events.every((event, index) => canonicalJson(event) === canonicalJson(longer.events[index]));
}

export function summarizeSave(save: CampaignSave, revision: number, cloudUpdatedAt: string) {
  const advanced = new Set(save.snapshot.issueResults.filter((result) => result.advancedCampaign).map((result) => result.issueNumber));
  return {
    saveId: save.saveId, name: save.name, playMode: save.playMode, updatedAt: save.updatedAt, cloudUpdatedAt,
    currentIssueNumber: save.snapshot.currentIssueNumber, phase: save.snapshot.phase,
    intel: save.snapshot.intel, network: save.snapshot.network, sequence: save.sequence,
    completionPercent: Math.round(advanced.size / 15 * 100), revision
  };
}
export type CloudSaveSummary = ReturnType<typeof summarizeSave>;
