"use client";
import { canonicalJson } from "@/storage/checksum";
import {
  getCampaignSave, getCloudLink, listCloudLinks, replaceCampaignSaveFromCloud, setCloudLink,
  type CloudLink
} from "@/storage/indexeddb";
import { cloudFeatureEnabled, getCloudStatus, getCurrentAccount, pullCampaignSave, pushCampaignSave, SyncRequestError } from "./client";
import { journalIsPrefix } from "./saves";

export const CLOUD_SYNC_EVENT = "core-protocol:cloud-sync-status";
export interface SyncNotice { message: string; error: boolean }
export function notifySync(notice: SyncNotice) {
  window.dispatchEvent(new CustomEvent(CLOUD_SYNC_EVENT, { detail: notice }));
}
async function remoteOrNull(saveId: string, ownerId: string) {
  try { return await pullCampaignSave(saveId, ownerId); }
  catch (error) { if (error instanceof SyncRequestError && error.status === 404) return null; throw error; }
}

// Explicit upload enables sync for this save and this account on this device.
export async function enableSaveSync(saveId: string) {
  const account = await getCurrentAccount();
  if (!account) throw new Error("Sign in before syncing saves.");
  const priorLink = await getCloudLink(saveId);
  if (priorLink && priorLink.ownerId !== account.id) throw new Error("This save is linked to another account. Export a backup and duplicate it before syncing to a different account.");
  const local = await getCampaignSave(saveId);
  if (!local) throw new Error("Local save not found.");
  const remote = await remoteOrNull(saveId, account.id);
  if (remote && !journalIsPrefix(remote.save, local)) throw new Error("Cloud progress differs or is newer. Download it or export both copies before choosing a branch.");
  const written = await pushCampaignSave(local, remote?.revision ?? null, account.id);
  await setCloudLink({ saveId, ownerId: account.id, revision: written.revision, name: local.name });
}
export async function downloadSave(saveId: string) {
  const account = await getCurrentAccount();
  if (!account) throw new Error("Sign in before downloading saves.");
  const link = await getCloudLink(saveId);
  if (link && link.ownerId !== account.id) throw new Error("This device's copy belongs to another account. Export and duplicate it first.");
  const local = await getCampaignSave(saveId);
  const remote = await pullCampaignSave(saveId, account.id);
  await replaceCampaignSaveFromCloud(remote.save, local ? { checksum: local.checksum, name: local.name } : undefined);
  await setCloudLink({ saveId, ownerId: account.id, revision: remote.revision, name: remote.save.name });
}
async function syncOne(link: CloudLink) {
  const local = await getCampaignSave(link.saveId);
  if (!local) return; // Deleting a device copy does not delete its cloud backup.
  const remote = await remoteOrNull(link.saveId, link.ownerId);
  if (!remote) {
    const written = await pushCampaignSave(local, null, link.ownerId);
    await setCloudLink({ ...link, revision: written.revision, name: local.name });
    return;
  }
  const localBeforeRemote = journalIsPrefix(local, remote.save);
  const remoteBeforeLocal = journalIsPrefix(remote.save, local);
  if (!localBeforeRemote && !remoteBeforeLocal) throw new Error(`"${local.name}" has different progress on two devices. Export both copies, then choose a version in Account. Neither copy was overwritten.`);
  const localRenamed = local.name !== link.name;
  const remoteRenamed = remote.save.name !== link.name;
  if (localRenamed && remoteRenamed && local.name !== remote.save.name) throw new Error(`"${local.name}" was renamed on both devices. Choose a copy in Account.`);
  const name = localRenamed ? local.name : remote.save.name;
  let next = localBeforeRemote ? { ...remote.save, name } : { ...local, name };
  let revision = remote.revision;
  if (canonicalJson(next) !== canonicalJson(remote.save)) {
    const written = await pushCampaignSave(next, remote.revision, link.ownerId);
    revision = written.revision;
  }
  if (next.checksum !== local.checksum || next.name !== local.name) {
    // Compare again INSIDE the IndexedDB transaction so a late pull never drops new taps.
    next = await replaceCampaignSaveFromCloud(next, { checksum: local.checksum, name: local.name });
  }
  await setCloudLink({ ...link, revision, name: next.name });
}
let running: Promise<void> | null = null;
export function synchronizeLinkedSaves(): Promise<void> {
  if (!cloudFeatureEnabled() || !navigator.onLine) return Promise.resolve();
  if (running) return running;
  running = (async () => {
    const links = await listCloudLinks();
    if (!links.length) return;
    const status = await getCloudStatus();
    if (!status.enabled || !status.configured) return;
    const account = await getCurrentAccount();
    if (!account) return;
    const failures: string[] = [];
    for (const link of links.filter((link) => link.ownerId === account.id)) {
      try { await syncOne(link); }
      catch (error) { failures.push(error instanceof Error ? error.message : "Sync failed. Local progress is safe."); }
    }
    if (failures.length) notifySync({ message: failures.join(" "), error: true });
    else notifySync({ message: "Linked campaign saves are synced.", error: false });
  })().catch((error) => {
    notifySync({ message: error instanceof Error ? error.message : "Cloud sync unavailable. Local saves are safe.", error: true });
  }).finally(() => { running = null; });
  return running;
}
