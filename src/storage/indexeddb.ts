"use client";

import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import { BrowserClock, BrowserIdFactory, createEvent } from "@/domain/commands";
import { campaignDefinition } from "@/domain/content";
import { createInitialSnapshot, reduceCampaign } from "@/domain/reducer";
import type {
  CampaignEvent,
  CampaignEventType,
  CampaignSave,
  CampaignSnapshot,
  PlayMode,
  UiSettings
} from "@/domain/types";
import { checksumSync } from "./checksum";
import { CURRENT_SAVE_SCHEMA_VERSION } from "./migrations";

const DB_NAME = "core-protocol-companion";
const DB_VERSION = 1;

export interface SaveSummary {
  saveId: string;
  name: string;
  playMode: PlayMode;
  updatedAt: string;
  currentIssueNumber: number | null;
  phase: string;
  intel: number;
  network: number;
  completionPercent: number;
}

export interface DeckLogRecord {
  id: string;
  heroId: string;
  heroName: string;
  aspect: string;
  scenario: string;
  difficulty: string;
  result: string;
  version: string;
  notes: string;
  marvelcdbUrl?: string;
  updatedAt: string;
}

export interface RulesLogRecord {
  id: string;
  topic: string;
  ruling: string;
  bilingualExample: string;
  status: "personal" | "verified";
  source: string;
  notes: string;
  updatedAt: string;
}

interface CoreProtocolDb extends DBSchema {
  campaign_saves: {
    key: string;
    value: Omit<CampaignSave, "events">;
  };
  campaign_events: {
    key: [string, number];
    value: { saveId: string; event: CampaignEvent };
    indexes: { bySaveId: string; byClientMutationId: string };
  };
  settings: {
    key: string;
    value: UiSettings & { id: "default" };
  };
  deck_logs: {
    key: string;
    value: DeckLogRecord;
  };
  rules_logs: {
    key: string;
    value: RulesLogRecord;
  };
  metadata_cache: {
    key: string;
    value: { key: string; value: unknown; updatedAt: string; expiresAt: string };
  };
  migration_backups: {
    key: string;
    value: { id: string; createdAt: string; payload: unknown };
  };
}

const defaultSettings: UiSettings & { id: "default" } = {
  id: "default",
  uiLanguage: "en",
  physicalCardLanguage: "both",
  theme: "system",
  reducedMotion: false,
  cardImageMode: "off",
  keepAwakeDuringPlay: false,
  analyticsConsent: false,
  largeControls: true,
  soundEffects: false
};

let dbPromise: Promise<IDBPDatabase<CoreProtocolDb>> | null = null;

export function isIndexedDBAvailable(): boolean {
  return typeof indexedDB !== "undefined";
}

export function openCoreDb() {
  if (!isIndexedDBAvailable()) {
    throw new Error("IndexedDB is unavailable in this browser.");
  }
  dbPromise ??= openDB<CoreProtocolDb>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains("campaign_saves")) {
        db.createObjectStore("campaign_saves", { keyPath: "saveId" });
      }
      if (!db.objectStoreNames.contains("campaign_events")) {
        const events = db.createObjectStore("campaign_events", { keyPath: ["saveId", "event.sequence"] });
        events.createIndex("bySaveId", "saveId");
        events.createIndex("byClientMutationId", "event.clientMutationId");
      }
      if (!db.objectStoreNames.contains("settings")) db.createObjectStore("settings", { keyPath: "id" });
      if (!db.objectStoreNames.contains("deck_logs")) db.createObjectStore("deck_logs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("rules_logs")) db.createObjectStore("rules_logs", { keyPath: "id" });
      if (!db.objectStoreNames.contains("metadata_cache")) db.createObjectStore("metadata_cache", { keyPath: "key" });
      if (!db.objectStoreNames.contains("migration_backups")) db.createObjectStore("migration_backups", { keyPath: "id" });
    }
  });
  return dbPromise;
}

export async function resetLocalDatabaseForTests() {
  if (dbPromise) {
    const db = await dbPromise;
    db.close();
  }
  dbPromise = null;
  if (isIndexedDBAvailable()) {
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.deleteDatabase(DB_NAME);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
      request.onblocked = () => resolve();
    });
  }
}

async function eventsForSave(db: IDBPDatabase<CoreProtocolDb>, saveId: string): Promise<CampaignEvent[]> {
  const rows = await db.getAllFromIndex("campaign_events", "bySaveId", saveId);
  return rows.map((row) => row.event).sort((a, b) => a.sequence - b.sequence);
}

function completionPercent(snapshot: CampaignSnapshot) {
  const advanced = new Set(snapshot.issueResults.filter((record) => record.advancedCampaign).map((record) => record.issueNumber));
  return Math.round((advanced.size / 15) * 100);
}

function toSaveRecord(save: CampaignSave): Omit<CampaignSave, "events"> {
  return {
    schemaVersion: save.schemaVersion,
    saveId: save.saveId,
    name: save.name,
    campaignId: save.campaignId,
    definitionVersion: save.definitionVersion,
    playMode: save.playMode,
    createdAt: save.createdAt,
    updatedAt: save.updatedAt,
    deviceId: save.deviceId,
    sequence: save.sequence,
    snapshot: save.snapshot,
    checksum: save.checksum
  };
}

export async function getSettings(): Promise<UiSettings> {
  const db = await openCoreDb();
  const settings = await db.get("settings", "default");
  if (settings) return settings;
  await db.put("settings", defaultSettings);
  return defaultSettings;
}

export async function saveSettings(settings: UiSettings): Promise<UiSettings> {
  const db = await openCoreDb();
  const next = { ...settings, id: "default" as const, cardImageMode: "off" as const };
  await db.put("settings", next);
  return next;
}

export async function createLocalSave(options: { name: string; playMode: PlayMode; deviceId?: string }): Promise<CampaignSave> {
  const db = await openCoreDb();
  const clock = new BrowserClock();
  const ids = new BrowserIdFactory();
  const saveId = ids.next("save");
  const deviceId = options.deviceId ?? ids.next("device");
  const event = createEvent(
    "CAMPAIGN_CREATED",
    1,
    { playMode: options.playMode },
    { clock, ids, deviceId }
  );
  const initial = createInitialSnapshot(campaignDefinition, options.playMode);
  const reduced = reduceCampaign(campaignDefinition, initial, event);
  if (!reduced.ok) throw new Error(reduced.error.message);
  const digest = checksumSync({ snapshot: reduced.value, events: [event] });
  const save: CampaignSave = {
    schemaVersion: CURRENT_SAVE_SCHEMA_VERSION,
    saveId,
    name: options.name.trim() || "Core Protocol",
    campaignId: "core-protocol",
    definitionVersion: campaignDefinition.version,
    playMode: options.playMode,
    createdAt: event.occurredAt,
    updatedAt: event.occurredAt,
    deviceId,
    sequence: reduced.value.sequence,
    snapshot: reduced.value,
    checksum: digest,
    events: [event]
  };
  const saveRecord = toSaveRecord(save);
  const tx = db.transaction(["campaign_saves", "campaign_events"], "readwrite");
  await tx.objectStore("campaign_saves").put(saveRecord);
  await tx.objectStore("campaign_events").put({ saveId, event });
  await tx.done;
  return save;
}

export async function listCampaignSaves(): Promise<SaveSummary[]> {
  const db = await openCoreDb();
  const saves = await db.getAll("campaign_saves");
  return saves
    .map((save) => ({
      saveId: save.saveId,
      name: save.name,
      playMode: save.playMode,
      updatedAt: save.updatedAt,
      currentIssueNumber: save.snapshot.currentIssueNumber,
      phase: save.snapshot.phase,
      intel: save.snapshot.intel,
      network: save.snapshot.network,
      completionPercent: completionPercent(save.snapshot)
    }))
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getCampaignSave(saveId: string): Promise<CampaignSave | null> {
  const db = await openCoreDb();
  const save = await db.get("campaign_saves", saveId);
  if (!save) return null;
  const events = await eventsForSave(db, saveId);
  return { ...save, events };
}

export interface EventDescriptor<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  type: CampaignEventType;
  payload: TPayload;
  clientMutationId?: string;
}

export async function appendCampaignEvents(
  saveId: string,
  descriptors: EventDescriptor[],
  options: { deviceId?: string } = {}
): Promise<CampaignSave> {
  const db = await openCoreDb();
  const clock = new BrowserClock();
  const ids = new BrowserIdFactory();
  const tx = db.transaction(["campaign_saves", "campaign_events"], "readwrite");
  const saveRecord = await tx.objectStore("campaign_saves").get(saveId);
  if (!saveRecord) throw new Error("Save not found.");
  let snapshot = saveRecord.snapshot;
  const existingEvents = await tx.objectStore("campaign_events").index("bySaveId").getAll(saveId);
  const existingMutationIds = new Set(existingEvents.map((row) => row.event.clientMutationId).filter(Boolean));
  const newEvents: CampaignEvent[] = [];

  for (const descriptor of descriptors) {
    if (descriptor.clientMutationId && existingMutationIds.has(descriptor.clientMutationId)) continue;
    const event = createEvent(descriptor.type, snapshot.sequence + 1, descriptor.payload, {
      clock,
      ids,
      deviceId: options.deviceId ?? saveRecord.deviceId,
      clientMutationId: descriptor.clientMutationId
    });
    const reduced = reduceCampaign(campaignDefinition, snapshot, event);
    if (!reduced.ok) {
      tx.abort();
      throw new Error(reduced.error.message);
    }
    snapshot = reduced.value;
    newEvents.push(event);
    if (event.clientMutationId) existingMutationIds.add(event.clientMutationId);
  }

  const allEvents = [...existingEvents.map((row) => row.event), ...newEvents].sort((a, b) => a.sequence - b.sequence);
  const updatedAt = clock.now();
  const digest = checksumSync({ snapshot, events: allEvents });
  const nextSaveRecord = {
    ...saveRecord,
    updatedAt,
    sequence: snapshot.sequence,
    snapshot,
    checksum: digest
  };
  for (const event of newEvents) {
    await tx.objectStore("campaign_events").put({ saveId, event });
  }
  await tx.objectStore("campaign_saves").put(nextSaveRecord);
  await tx.done;
  return { ...nextSaveRecord, events: allEvents };
}

export async function renameCampaignSave(saveId: string, name: string) {
  const db = await openCoreDb();
  const save = await db.get("campaign_saves", saveId);
  if (!save) throw new Error("Save not found.");
  await db.put("campaign_saves", { ...save, name: name.trim() || save.name, updatedAt: new Date().toISOString() });
}

export async function deleteCampaignSave(saveId: string) {
  const db = await openCoreDb();
  const events = await eventsForSave(db, saveId);
  const tx = db.transaction(["campaign_saves", "campaign_events", "migration_backups"], "readwrite");
  const save = await tx.objectStore("campaign_saves").get(saveId);
  if (save) {
    await tx.objectStore("migration_backups").put({
      id: `deleted-${saveId}-${Date.now()}`,
      createdAt: new Date().toISOString(),
      payload: { ...save, events }
    });
  }
  await tx.objectStore("campaign_saves").delete(saveId);
  for (const event of events) {
    await tx.objectStore("campaign_events").delete([saveId, event.sequence]);
  }
  await tx.done;
}

export async function duplicateCampaignSave(saveId: string): Promise<CampaignSave> {
  const source = await getCampaignSave(saveId);
  if (!source) throw new Error("Save not found.");
  const db = await openCoreDb();
  const ids = new BrowserIdFactory();
  const newSaveId = ids.next("save");
  const now = new Date().toISOString();
  const events = source.events.map((event) => ({
    ...event,
    deviceId: source.deviceId
  }));
  const snapshot = JSON.parse(JSON.stringify(source.snapshot)) as CampaignSnapshot;
  const digest = checksumSync({ snapshot, events });
  const duplicate: CampaignSave = {
    ...source,
    saveId: newSaveId,
    name: `${source.name} Copy`,
    createdAt: now,
    updatedAt: now,
    sequence: snapshot.sequence,
    snapshot,
    checksum: digest,
    events
  };
  const saveRecord = toSaveRecord(duplicate);
  const tx = db.transaction(["campaign_saves", "campaign_events"], "readwrite");
  await tx.objectStore("campaign_saves").put(saveRecord);
  for (const event of events) {
    await tx.objectStore("campaign_events").put({ saveId: newSaveId, event });
  }
  await tx.done;
  return duplicate;
}

export async function upsertDeckLog(record: Omit<DeckLogRecord, "id" | "updatedAt"> & { id?: string }) {
  const db = await openCoreDb();
  const id = record.id ?? new BrowserIdFactory().next("deck");
  const next = { ...record, id, updatedAt: new Date().toISOString() };
  await db.put("deck_logs", next);
  return next;
}

export async function listDeckLogs() {
  const db = await openCoreDb();
  return (await db.getAll("deck_logs")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function upsertRulesLog(record: Omit<RulesLogRecord, "id" | "updatedAt"> & { id?: string }) {
  const db = await openCoreDb();
  const id = record.id ?? new BrowserIdFactory().next("rule");
  const next = { ...record, id, updatedAt: new Date().toISOString() };
  await db.put("rules_logs", next);
  return next;
}

export async function listRulesLogs() {
  const db = await openCoreDb();
  return (await db.getAll("rules_logs")).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function exportRepositoryState() {
  const db = await openCoreDb();
  const saves = await Promise.all((await db.getAllKeys("campaign_saves")).map((key) => getCampaignSave(String(key))));
  return {
    saves: saves.filter((save): save is CampaignSave => Boolean(save)),
    settings: await getSettings(),
    deckLogs: await listDeckLogs(),
    rulesLogs: await listRulesLogs()
  };
}
