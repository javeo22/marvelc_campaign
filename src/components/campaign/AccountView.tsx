"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Cloud, Download, LogIn, LogOut, RefreshCw, ShieldCheck, Upload } from "lucide-react";
import { CaptionBox, ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { getCloudStatus, getCurrentAccount, listCloudCampaignSaves, pullCampaignSave, signInAccount, signOutAccount, type AccountSession, type CloudSaveSummary } from "@/integrations/cloud/client";
import type { CloudConfigStatus, LoginProvider } from "@/integrations/cloud/config";
import { downloadSave, enableSaveSync, synchronizeLinkedSaves } from "@/integrations/cloud/sync";
import { listCampaignSaves, listCloudLinks, unlinkCloudSave, type CloudLink, type SaveSummary } from "@/storage/indexeddb";
import { formatPhaseLabel } from "./display-labels";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));
}
export function AccountView() {
  const [config, setConfig] = useState<CloudConfigStatus | null>(null);
  const [account, setAccount] = useState<AccountSession | null>(null);
  const [localSaves, setLocalSaves] = useState<SaveSummary[]>([]);
  const [cloudSaves, setCloudSaves] = useState<CloudSaveSummary[]>([]);
  const [links, setLinks] = useState<CloudLink[]>([]);
  const [busy, setBusy] = useState(true);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLocalSaves(await listCampaignSaves());
    setLinks(await listCloudLinks());
    const nextConfig = await getCloudStatus();
    setConfig(nextConfig);
    const current = nextConfig.enabled && nextConfig.configured ? await getCurrentAccount() : null;
    setAccount(current);
    setCloudSaves(current ? await listCloudCampaignSaves() : []);
  }, []);
  const run = useCallback(async (work: () => Promise<void>) => {
    setBusy(true); setError(null);
    try { await work(); }
    catch (error) { setError(error instanceof Error ? error.message : "Account action failed. Local saves are safe."); }
    finally { setBusy(false); }
  }, []);
  useEffect(() => {
    let active = true;
    async function boot() {
      try {
        await refresh();
        if (active && new URLSearchParams(window.location.search).has("error")) {
          setError("Sign-in could not be completed. Try again using the same provider you use on your other devices.");
        }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : "Account unavailable. Local saves are safe."); }
      finally { if (active) setBusy(false); }
    }
    void boot();
    return () => { active = false; };
  }, [refresh]);
  async function login(provider: LoginProvider) { await run(async () => { await signInAccount(provider); }); }
  async function upload(saveId: string) {
    await run(async () => { await enableSaveSync(saveId); await refresh(); setStatus("Campaign uploaded. Future changes to this save sync automatically while online."); });
  }
  async function download(save: CloudSaveSummary) {
    if (localSaves.some((local) => local.saveId === save.saveId) && !confirm(`Replace the device copy of "${save.name}" with the cloud version? A rollback copy will be kept. Export first to keep a portable backup.`)) return;
    await run(async () => { await downloadSave(save.saveId); await refresh(); setStatus(`"${save.name}" is available on this device and linked for automatic sync.`); });
  }
  async function exportCloud(save: CloudSaveSummary) {
    await run(async () => {
      const result = await pullCampaignSave(save.saveId);
      const blob = new Blob([JSON.stringify({ manifest: { app: "core-protocol-companion", schemaVersion: "1.0.0", exportedAt: new Date().toISOString(), contentVersion: result.save.definitionVersion }, saves: [result.save], deckLogs: [], rulesLogs: [] }, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a"); anchor.href = url; anchor.download = `cloud-${save.saveId}.json`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    });
  }
  return (
    <>
      <ComicHeader eyebrow="Account" title="Saved across devices" subtitle="Keep playing offline. Sign in with the same account on each device to sync your campaign progress." />
      {status ? <div className="status-banner" role="status">{status}</div> : null}
      {error ? <ErrorPanel title="Account action failed"><p>{error}</p></ErrorPanel> : null}
      {config && (!config.enabled || !config.configured) ? <ComicPanel><h2>Local saves are available</h2><p>Cloud sign-in is currently unavailable. You can keep playing and use <Link href="/settings/backup">Export / Import</Link> for backups.</p></ComicPanel> : null}
      <div className="account-grid">
        <ComicPanel>
          <CaptionBox><ShieldCheck aria-hidden="true" /> Your account</CaptionBox>
          {account ? <div className="form-stack">
            <h2>{account.username}</h2>
            <p>Use this same sign-in provider on your other devices. Google and GitHub accounts have separate saves.</p>
            <button disabled={busy} onClick={() => void run(async () => { await signOutAccount(); setAccount(null); setCloudSaves([]); setStatus("Signed out. Device saves remain available."); })}><LogOut aria-hidden="true" /> Sign out</button>
          </div> : <div className="form-stack">
            <h2>Sign in to sync</h2>
            <p>Choose an account you can use on all your devices. Your password stays with your sign-in provider.</p>
            {(config?.providers.length ? config.providers : ["github" as const]).map((provider) => <button key={provider} disabled={busy || !config?.enabled || !config.configured} onClick={() => void login(provider)}><LogIn aria-hidden="true" /> Continue with {provider === "github" ? "GitHub" : "Google"}</button>)}
          </div>}
        </ComicPanel>
        <ComicPanel>
          <CaptionBox><Cloud aria-hidden="true" /> Sync status</CaptionBox>
          <h2>{account ? "Choose saves to sync" : "Play on this device"}</h2>
          <p>Upload a save once to enable automatic sync. On another device, sign in and download it once. Linked saves sync when you return to the app, reconnect, and make changes.</p>
          <p>Different progress on two devices stays separate until you choose a copy. Campaign notes sync with the save; preferences and personal deck/rules logs stay on this device.</p>
          <button disabled={busy} onClick={() => void run(async () => { await synchronizeLinkedSaves(); await refresh(); setStatus("Save lists refreshed."); })}><RefreshCw aria-hidden="true" /> Sync and refresh</button>
        </ComicPanel>
      </div>
      <div className="split-grid account-sync-panels" aria-busy={busy}>
        <ComicPanel>
          <CaptionBox><Upload aria-hidden="true" /> This device</CaptionBox><h2>Local saves</h2>
          {!localSaves.length ? <EmptyState title="No local saves"><p>Create a campaign first, then return to enable sync.</p></EmptyState> : <div className="sync-save-list">
            {localSaves.map((save) => {
              const link = links.find((link) => link.saveId === save.saveId);
              const linked = link?.ownerId === account?.id;
              return <article className="sync-save-row" key={save.saveId}>
                <div className="sync-save-row__main"><h3>{save.name}</h3><p className="meta">{formatPhaseLabel(save.phase)} · Issue {save.currentIssueNumber ?? "Complete"} · Intel {save.intel} · Network {save.network}</p><p className="small">{linked ? "Automatic sync enabled" : link ? "Linked to another account" : "Device only"} · Updated {formatDate(save.updatedAt)}</p></div>
                <button disabled={!account || busy || Boolean(link && !linked)} onClick={() => void upload(save.saveId)}><Upload aria-hidden="true" /> {linked ? "Upload now" : "Enable sync"}</button>
                {linked ? <button disabled={busy} onClick={() => void run(async () => { await unlinkCloudSave(save.saveId); await refresh(); setStatus("Automatic sync stopped on this device. The cloud copy is retained."); })}>Stop syncing</button> : null}
              </article>;
            })}
          </div>}
        </ComicPanel>
        <ComicPanel>
          <CaptionBox><Download aria-hidden="true" /> Your cloud saves</CaptionBox><h2>Account saves</h2>
          {!account ? <EmptyState title="Sign in to list cloud saves"><p>Only saves belonging to your signed-in account appear here.</p></EmptyState> : !cloudSaves.length ? <EmptyState title="No account saves yet"><p>Enable sync for a device save to make it available elsewhere.</p></EmptyState> : <div className="sync-save-list">{cloudSaves.map((save) => <article className="sync-save-row" key={save.saveId}>
            <div className="sync-save-row__main"><h3>{save.name}</h3><p className="meta">{formatPhaseLabel(save.phase)} · Issue {save.currentIssueNumber ?? "Complete"} · Sequence {save.sequence}</p><p className="small">Cloud updated {formatDate(save.cloudUpdatedAt)}</p></div>
            <button disabled={busy} onClick={() => void download(save)}><Download aria-hidden="true" /> Download</button>
            <button disabled={busy} onClick={() => void exportCloud(save)}>Export cloud backup</button>
          </article>)}</div>}
        </ComicPanel>
      </div>
      <ComicPanel><h2>Keep both copies when progress differs</h2><p>Export the device copy from <Link href="/settings/backup">Backups</Link> and the cloud copy above. To keep a device branch separately, duplicate it from the campaign library and enable sync for the duplicate. Downloading a cloud copy keeps a local rollback backup. Removing a device save does not delete its cloud copy.</p></ComicPanel>
    </>
  );
}
