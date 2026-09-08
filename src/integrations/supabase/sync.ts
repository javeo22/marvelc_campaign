"use client";

import { campaignDefinition } from "@/domain/content";
import { replayCampaign } from "@/domain/reducer";
import type { CampaignEvent, CampaignPhase, CampaignSave, CampaignSnapshot, PlayMode } from "@/domain/types";
import { checksumSync } from "@/storage/checksum";
import { CURRENT_SAVE_SCHEMA_VERSION, migrateSave } from "@/storage/migrations";
import { getSupabasePublicConfig, requireSupabaseBrowserClient } from "./client";

export type SupabaseSyncStatus =
  | { enabled: false; configured: boolean; missing: string[]; reason: "feature_flag_disabled" }
  | { enabled: true; configured: false; missing: string[]; reason: "missing_public_config" }
  | { enabled: true; configured: true; missing: []; reason: "ready" };

export interface CloudSaveSummary {
  saveId: string;
  name: string;
  playMode: PlayMode;
  updatedAt: string;
  cloudUpdatedAt: string;
  currentIssueNumber: number | null;
  phase: CampaignPhase;
  intel: number;
  network: number;
  sequence: number;
  completionPercent: number;
}

interface CloudSaveRow {
  save_id: string;
  user_id: string;
  name: string;
  schema_version: string;
  campaign_id: string;
  definition_version: string;
  play_mode: PlayMode;
  device_id: string;
  sequence: number;
  snapshot: CampaignSnapshot;
  checksum: string;
  created_at: string;
  updated_at: string;
  cloud_updated_at: string;
}

interface CloudEventRow {
  save_id: string;
  user_id: string;
  sequence: number;
  event_id: string;
  client_mutation_id: string | null;
  event: CampaignEvent;
  occurred_at: string;
}

function completionPercent(snapshot: CampaignSnapshot) {
  const advanced = new Set(snapshot.issueResults.filter((record) => record.advancedCampaign).map((record) => record.issueNumber));
  return Math.round((advanced.size / 15) * 100);
}

export function getSupabaseSyncStatus(): SupabaseSyncStatus {
  const config = getSupabasePublicConfig();
  if (!config.cloudSyncEnabled) {
    return { enabled: false, configured: config.configured, missing: config.missing, reason: "feature_flag_disabled" };
  }
  if (!config.configured) return { enabled: true, configured: false, missing: config.missing, reason: "missing_public_config" };
  return { enabled: true, configured: true, missing: [], reason: "ready" };
}

function requireCloudSyncReady() {
  const status = getSupabaseSyncStatus();
  if (!status.enabled) throw new Error("Cloud sync is disabled for this build. Local saves remain on this device.");
  if (!status.configured) throw new Error(`Cloud sync is missing public configuration: ${status.missing.join(", ")}.`);
}

async function currentUserId(): Promise<string> {
  requireCloudSyncReady();
  const supabase = requireSupabaseBrowserClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) throw new Error(error.message);
  if (!data.user) throw new Error("Sign in before syncing saves.");
  return data.user.id;
}

function saveToCloudRow(save: CampaignSave, userId: string): CloudSaveRow {
  return {
    save_id: save.saveId,
    user_id: userId,
    name: save.name,
    schema_version: save.schemaVersion,
    campaign_id: save.campaignId,
    definition_version: save.definitionVersion,
    play_mode: save.playMode,
    device_id: save.deviceId,
    sequence: save.sequence,
    snapshot: save.snapshot,
    checksum: save.checksum,
    created_at: save.createdAt,
    updated_at: save.updatedAt,
    cloud_updated_at: new Date().toISOString()
  };
}

function eventToCloudRow(saveId: string, userId: string, event: CampaignEvent): CloudEventRow {
  return {
    save_id: saveId,
    user_id: userId,
    sequence: event.sequence,
    event_id: event.eventId,
    client_mutation_id: event.clientMutationId ?? null,
    event,
    occurred_at: event.occurredAt
  };
}

export function cloudSaveSummaryFromRow(row: CloudSaveRow): CloudSaveSummary {
  return {
    saveId: row.save_id,
    name: row.name,
    playMode: row.play_mode,
    updatedAt: row.updated_at,
    cloudUpdatedAt: row.cloud_updated_at,
    currentIssueNumber: row.snapshot.currentIssueNumber,
    phase: row.snapshot.phase,
    intel: row.snapshot.intel,
    network: row.snapshot.network,
    sequence: row.sequence,
    completionPercent: completionPercent(row.snapshot)
  };
}

export function campaignSaveFromCloudRows(saveRow: CloudSaveRow, eventRows: CloudEventRow[]): CampaignSave {
  const events = eventRows.map((row) => row.event).sort((a, b) => a.sequence - b.sequence);
  if (events.length === 0) throw new Error("Cloud save is missing its event journal.");
  const latestEvent = events.at(-1);
  if (latestEvent && latestEvent.sequence !== saveRow.sequence) {
    throw new Error("Cloud save snapshot does not match its event journal sequence.");
  }
  const replay = replayCampaign(campaignDefinition, events, saveRow.play_mode);
  if (!replay.ok) throw new Error(replay.error.message);
  const candidate: CampaignSave = {
    schemaVersion: saveRow.schema_version || CURRENT_SAVE_SCHEMA_VERSION,
    saveId: saveRow.save_id,
    name: saveRow.name,
    campaignId: "core-protocol",
    definitionVersion: saveRow.definition_version,
    playMode: saveRow.play_mode,
    createdAt: saveRow.created_at,
    updatedAt: saveRow.updated_at,
    deviceId: saveRow.device_id,
    sequence: replay.value.sequence,
    snapshot: replay.value,
    checksum: checksumSync({ snapshot: replay.value, events }),
    events
  };
  const migrated = migrateSave(campaignDefinition, candidate);
  if (!migrated.ok) throw new Error(migrated.reason);
  return {
    ...migrated.save,
    name: candidate.name,
    checksum: checksumSync({ snapshot: migrated.save.snapshot, events: migrated.save.events })
  };
}

export async function listCloudCampaignSaves(): Promise<CloudSaveSummary[]> {
  requireCloudSyncReady();
  const supabase = requireSupabaseBrowserClient();
  const { data, error } = await supabase
    .from("core_protocol_saves")
    .select("save_id,user_id,name,schema_version,campaign_id,definition_version,play_mode,device_id,sequence,snapshot,checksum,created_at,updated_at,cloud_updated_at")
    .order("cloud_updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return ((data ?? []) as CloudSaveRow[]).map(cloudSaveSummaryFromRow);
}

export async function pushCampaignSave(save: CampaignSave): Promise<void> {
  const userId = await currentUserId();
  const supabase = requireSupabaseBrowserClient();
  const { data: remoteSave, error: remoteSaveError } = await supabase
    .from("core_protocol_saves")
    .select("save_id")
    .eq("save_id", save.saveId)
    .maybeSingle();
  if (remoteSaveError) throw new Error(remoteSaveError.message);

  let existingEvents: Array<{ sequence: number; event_id: string }> = [];
  if (remoteSave) {
    const { data, error } = await supabase
      .from("core_protocol_events")
      .select("sequence,event_id")
      .eq("save_id", save.saveId);
    if (error) throw new Error(error.message);
    existingEvents = (data ?? []) as Array<{ sequence: number; event_id: string }>;
  }

  const remoteEventIdsBySequence = new Map(existingEvents.map((row) => [row.sequence, row.event_id]));
  for (const event of save.events) {
    const remoteEventId = remoteEventIdsBySequence.get(event.sequence);
    if (remoteEventId && remoteEventId !== event.eventId) {
      throw new Error(`Cloud conflict at event sequence ${event.sequence}. Download or export both copies before choosing a branch.`);
    }
  }

  const saveRow = saveToCloudRow(save, userId);
  const { error: saveError } = await supabase.from("core_protocol_saves").upsert(saveRow, { onConflict: "save_id" });
  if (saveError) throw new Error(saveError.message);

  const uploadedSequences = new Set(existingEvents.map((row) => row.sequence));
  const missingEvents = save.events.filter((event) => !uploadedSequences.has(event.sequence));
  if (missingEvents.length === 0) return;

  const { error: eventError } = await supabase
    .from("core_protocol_events")
    .upsert(missingEvents.map((event) => eventToCloudRow(save.saveId, userId, event)), {
      ignoreDuplicates: true,
      onConflict: "save_id,sequence"
    });
  if (eventError) throw new Error(eventError.message);
}

export async function pullCampaignSave(saveId: string): Promise<CampaignSave> {
  await currentUserId();
  const supabase = requireSupabaseBrowserClient();
  const { data: saveRow, error: saveError } = await supabase
    .from("core_protocol_saves")
    .select("save_id,user_id,name,schema_version,campaign_id,definition_version,play_mode,device_id,sequence,snapshot,checksum,created_at,updated_at,cloud_updated_at")
    .eq("save_id", saveId)
    .maybeSingle();
  if (saveError) throw new Error(saveError.message);
  if (!saveRow) throw new Error("Cloud save not found for this account.");

  const { data: eventRows, error: eventsError } = await supabase
    .from("core_protocol_events")
    .select("save_id,user_id,sequence,event_id,client_mutation_id,event,occurred_at")
    .eq("save_id", saveId)
    .order("sequence", { ascending: true });
  if (eventsError) throw new Error(eventsError.message);

  return campaignSaveFromCloudRows(saveRow as CloudSaveRow, (eventRows ?? []) as CloudEventRow[]);
}

export function enqueueCampaignSavePush(save: CampaignSave): void {
  const status = getSupabaseSyncStatus();
  if (!status.enabled || !status.configured) return;
  void pushCampaignSave(save).catch(() => {
    // Local IndexedDB remains authoritative; the Account screen exposes manual retry.
  });
}
