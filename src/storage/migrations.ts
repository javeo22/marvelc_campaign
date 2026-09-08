import { replayCampaign } from "@/domain/reducer";
import type { CampaignDefinition, CampaignEvent, CampaignSave, CampaignSnapshot, PlayMode } from "@/domain/types";

export const CURRENT_SAVE_SCHEMA_VERSION = "1.0.0";

export type MigrationResult =
  | { ok: true; save: CampaignSave; actions: string[] }
  | { ok: false; readOnly: true; reason: string; original: unknown };

export function hasUnknownEvent(events: CampaignEvent[]): string | null {
  const known = new Set([
    "CAMPAIGN_CREATED",
    "ISSUE_PREPARATION_STARTED",
    "ASPECT_SELECTED",
    "FIELD_ASSET_EQUIPPED",
    "ISSUE_STARTED",
    "ROUND_CHANGED",
    "COUNTER_CHANGED",
    "CHECKLIST_CHANGED",
    "FIELD_ASSET_USED",
    "OBJECTIVE_COMPLETED",
    "MASTERY_EARNED",
    "NOTE_ADDED",
    "ISSUE_COMPLETED",
    "INTERLUDE_CHOICE_MADE",
    "ACT_RECOVERY_APPLIED",
    "FINAL_PREP_SPENT",
    "MIRROR_STARTED",
    "MIRROR_COMPLETED",
    "SAVE_IMPORTED",
    "MANUAL_CORRECTION"
  ]);
  return events.find((event) => !known.has(event.type))?.type ?? null;
}

function ensureSnapshotExtensions(snapshot: CampaignSnapshot, playMode: PlayMode): CampaignSnapshot {
  return {
    ...snapshot,
    sequence: snapshot.sequence ?? 0,
    playMode: snapshot.playMode ?? playMode,
    preparation: snapshot.preparation ?? null,
    finalPreparationSpends: snapshot.finalPreparationSpends ?? [],
    appliedRecoveries: snapshot.appliedRecoveries ?? [],
    manualCorrections: snapshot.manualCorrections ?? []
  };
}

export function migrateSave(definition: CampaignDefinition, input: CampaignSave): MigrationResult {
  const unknown = hasUnknownEvent(input.events);
  if (unknown) {
    return {
      ok: false,
      readOnly: true,
      reason: `Unknown event type ${unknown}; save must be opened read-only until a migration exists.`,
      original: input
    };
  }

  const actions: string[] = [];
  let save = input;
  if (save.schemaVersion !== CURRENT_SAVE_SCHEMA_VERSION) {
    actions.push(`schemaVersion ${save.schemaVersion} -> ${CURRENT_SAVE_SCHEMA_VERSION}`);
    save = { ...save, schemaVersion: CURRENT_SAVE_SCHEMA_VERSION };
  }

  const replay = replayCampaign(definition, save.events, save.playMode);
  if (!replay.ok) {
    return { ok: false, readOnly: true, reason: replay.error.message, original: input };
  }

  return {
    ok: true,
    save: {
      ...save,
      sequence: replay.value.sequence,
      snapshot: ensureSnapshotExtensions(replay.value, save.playMode)
    },
    actions
  };
}
