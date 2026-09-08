"use client";

import { campaignDefinition } from "@/domain/content";
import type { CampaignSave, UiSettings } from "@/domain/types";
import { importEnvelopeSchema, validateUiSettings } from "@/domain/validation";
import { checksum } from "./checksum";
import { exportRepositoryState, getCampaignSave, openCoreDb, saveSettings } from "./indexeddb";
import { migrateSave } from "./migrations";

const MAX_IMPORT_BYTES = 3_000_000;

export interface ExportEnvelope {
  manifest: {
    app: "core-protocol-companion";
    schemaVersion: string;
    exportedAt: string;
    contentVersion: string;
  };
  saves: CampaignSave[];
  settings?: UiSettings;
  deckLogs: unknown[];
  rulesLogs: unknown[];
  checksum: string;
}

function rejectDangerousKeys(key: string, value: unknown) {
  if (key === "__proto__" || key === "constructor" || key === "prototype") {
    throw new Error("Import contains a forbidden object key.");
  }
  return value;
}

export async function buildExportEnvelope(saveId?: string): Promise<ExportEnvelope> {
  const exportedAt = new Date().toISOString();
  const state = await exportRepositoryState();
  const saves = saveId ? [await getCampaignSave(saveId)].filter((save): save is CampaignSave => Boolean(save)) : state.saves;
  const unsigned = {
    manifest: {
      app: "core-protocol-companion" as const,
      schemaVersion: "1.0.0",
      exportedAt,
      contentVersion: campaignDefinition.version
    },
    saves,
    settings: state.settings,
    deckLogs: state.deckLogs,
    rulesLogs: state.rulesLogs
  };
  return { ...unsigned, checksum: await checksum(unsigned) };
}

export async function exportJson(saveId?: string): Promise<string> {
  return JSON.stringify(await buildExportEnvelope(saveId), null, 2);
}

export async function parseImportJson(text: string): Promise<ExportEnvelope> {
  if (new TextEncoder().encode(text).byteLength > MAX_IMPORT_BYTES) {
    throw new Error("Import is larger than the 3 MB safety limit.");
  }
  const parsed = JSON.parse(text, rejectDangerousKeys) as unknown;
  const envelope = importEnvelopeSchema.parse(parsed);
  const unsigned = {
    manifest: envelope.manifest,
    saves: envelope.saves,
    settings: envelope.settings,
    deckLogs: envelope.deckLogs,
    rulesLogs: envelope.rulesLogs
  };
  if (envelope.checksum && envelope.checksum !== (await checksum(unsigned))) {
    throw new Error("Import checksum does not match its contents.");
  }
  return envelope as ExportEnvelope;
}

export async function importEnvelope(envelope: ExportEnvelope) {
  const db = await openCoreDb();
  const migrated: CampaignSave[] = [];
  const actions: string[] = [];
  for (const rawSave of envelope.saves) {
    const migration = migrateSave(campaignDefinition, rawSave);
    if (!migration.ok) {
      throw new Error(migration.reason);
    }
    migrated.push({
      ...migration.save,
      checksum: await checksum({ snapshot: migration.save.snapshot, events: migration.save.events })
    });
    actions.push(...migration.actions);
  }

  const tx = db.transaction(["campaign_saves", "campaign_events", "migration_backups"], "readwrite");
  await tx.objectStore("migration_backups").put({
    id: `import-${Date.now()}`,
    createdAt: new Date().toISOString(),
    payload: envelope
  });
  for (const save of migrated) {
    const { events, ...saveRecord } = save;
    await tx.objectStore("campaign_saves").put(saveRecord);
    for (const event of events) {
      await tx.objectStore("campaign_events").put({ saveId: save.saveId, event });
    }
  }
  await tx.done;

  if (envelope.settings) {
    const settings = validateUiSettings(envelope.settings);
    if (settings.ok) await saveSettings(settings.value);
  }

  return { importedSaveCount: migrated.length, actions };
}
