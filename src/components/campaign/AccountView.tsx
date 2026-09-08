"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Cloud, CloudOff, Download, KeyRound, LogIn, LogOut, RefreshCw, ShieldCheck, Upload, UserRound } from "lucide-react";
import { CaptionBox, ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import type { AccountSession } from "@/integrations/supabase/auth";
import { getCurrentAccount, signInWithUsername, signOutAccount, subscribeToAccount } from "@/integrations/supabase/auth";
import {
  getSupabaseSyncStatus,
  listCloudCampaignSaves,
  pullCampaignSave,
  pushCampaignSave,
  type CloudSaveSummary
} from "@/integrations/supabase/sync";
import {
  getCampaignSave,
  listCampaignSaves,
  replaceCampaignSaveFromCloud,
  type SaveSummary
} from "@/storage/indexeddb";
import { formatPhaseLabel } from "./display-labels";

type BusyAction = "sign-in" | "sign-out" | "refresh" | `upload:${string}` | `download:${string}` | null;

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function AccountView() {
  const syncStatus = useMemo(() => getSupabaseSyncStatus(), []);
  const [account, setAccount] = useState<AccountSession | null>(null);
  const [username, setUsername] = useState("javier");
  const [password, setPassword] = useState("");
  const [localSaves, setLocalSaves] = useState<SaveSummary[]>([]);
  const [cloudSaves, setCloudSaves] = useState<CloudSaveSummary[]>([]);
  const [busy, setBusy] = useState<BusyAction>("refresh");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadLocal = useCallback(async () => {
    setLocalSaves(await listCampaignSaves());
  }, []);

  const loadCloud = useCallback(async (nextAccount: AccountSession | null) => {
    if (!nextAccount || !syncStatus.enabled || !syncStatus.configured) {
      setCloudSaves([]);
      return;
    }
    setCloudSaves(await listCloudCampaignSaves());
  }, [syncStatus.configured, syncStatus.enabled]);

  const refresh = useCallback(async (nextAccount: AccountSession | null) => {
    setBusy("refresh");
    setError(null);
    try {
      await loadLocal();
      if (nextAccount && syncStatus.enabled && syncStatus.configured) {
        setCloudSaves(await listCloudCampaignSaves());
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  }, [loadLocal, syncStatus.configured, syncStatus.enabled]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      if (!syncStatus.enabled || !syncStatus.configured) {
        try {
          await loadLocal();
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : String(err));
        } finally {
          if (!cancelled) setBusy(null);
        }
        return;
      }
      try {
        const current = await getCurrentAccount();
        if (cancelled) return;
        setAccount(current);
        await refresh(current);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : String(err));
        if (!cancelled) setBusy(null);
      }
    };
    void boot();
    const unsubscribe =
      syncStatus.enabled && syncStatus.configured
        ? subscribeToAccount((next) => {
            setAccount(next);
            void refresh(next);
          })
        : undefined;
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, [loadLocal, refresh, syncStatus.configured, syncStatus.enabled]);

  const submitLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy("sign-in");
    setError(null);
    setStatus(null);
    try {
      const next = await signInWithUsername(username, password);
      setAccount(next);
      setPassword("");
      await refresh(next);
      setStatus(`Signed in as ${next.username}. Local saves can now sync with this account.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const signOut = async () => {
    setBusy("sign-out");
    setError(null);
    setStatus(null);
    try {
      await signOutAccount();
      setAccount(null);
      setCloudSaves([]);
      setStatus("Signed out. Local saves are still available on this device.");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const uploadSave = async (saveId: string) => {
    setBusy(`upload:${saveId}`);
    setError(null);
    setStatus(null);
    try {
      const save = await getCampaignSave(saveId);
      if (!save) throw new Error("Local save not found.");
      await pushCampaignSave(save);
      await loadCloud(account);
      setStatus(`Uploaded "${save.name}" to ${account?.username ?? "your account"}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const downloadSave = async (save: CloudSaveSummary) => {
    const localMatch = localSaves.some((localSave) => localSave.saveId === save.saveId);
    if (localMatch && !confirm(`Replace the local copy of "${save.name}" with the cloud version? A rollback copy will be kept locally.`)) return;
    setBusy(`download:${save.saveId}`);
    setError(null);
    setStatus(null);
    try {
      const pulled = await pullCampaignSave(save.saveId);
      await replaceCampaignSaveFromCloud(pulled);
      await loadLocal();
      setStatus(`Downloaded "${pulled.name}" to this device.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const disabledReason = !syncStatus.enabled
    ? "Cloud sync is disabled for this build."
    : !syncStatus.configured
      ? "Cloud sync is missing a Supabase public browser key."
      : null;

  return (
    <>
      <ComicHeader
        eyebrow="Account"
        title="Signed-in saves"
        subtitle="Local IndexedDB is still the offline working copy. Sign in to upload saves to Supabase and download them on another device."
      />
      {status ? <div className="status-banner" role="status">{status}</div> : null}
      {error ? <ErrorPanel title="Account action failed"><p>{error}</p></ErrorPanel> : null}
      {disabledReason ? (
        <ErrorPanel title="Cloud sync unavailable">
          <p>{disabledReason} Local campaign saves still work on this device, and JSON export/import remains available.</p>
        </ErrorPanel>
      ) : null}
      <div className="account-grid">
        <ComicPanel>
          <CaptionBox><UserRound aria-hidden="true" /> Identity</CaptionBox>
          {account ? (
            <div className="form-stack">
              <div className="account-state">
                <span className="icon-badge" data-tone="intel"><ShieldCheck aria-hidden="true" /></span>
                <div>
                  <h2>{account.username}</h2>
                  <p className="meta">Authenticated with Supabase Auth. Passwords are never stored in this repository.</p>
                </div>
              </div>
              <button type="button" disabled={busy === "sign-out"} onClick={() => void signOut()}>
                <LogOut aria-hidden="true" /> Sign out
              </button>
            </div>
          ) : (
            <form className="form-stack" onSubmit={(event) => void submitLogin(event)}>
              <label htmlFor="account-username">Username</label>
              <input
                id="account-username"
                autoComplete="username"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                disabled={Boolean(disabledReason) || busy === "sign-in"}
              />
              <label htmlFor="account-password">Password</label>
              <input
                id="account-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                disabled={Boolean(disabledReason) || busy === "sign-in"}
              />
              <button type="submit" disabled={Boolean(disabledReason) || busy === "sign-in"}>
                <LogIn aria-hidden="true" /> Sign in
              </button>
              <p className="meta">The requested account username is prefilled. Saves stay local until you upload them or autosync catches the next local change.</p>
            </form>
          )}
        </ComicPanel>

        <ComicPanel>
          <CaptionBox>{account ? <Cloud aria-hidden="true" /> : <CloudOff aria-hidden="true" />} Sync status</CaptionBox>
          <h2>{account ? "Account ready" : "Device-only until sign-in"}</h2>
          <p>
            {account
              ? "New local campaign changes are pushed opportunistically. Use the controls below to force upload or download."
              : "Existing campaigns are saved in this browser profile. Sign in here on each device to move saves through Supabase."}
          </p>
          <button type="button" disabled={busy === "refresh"} onClick={() => void refresh(account)}>
            <RefreshCw aria-hidden="true" /> Refresh lists
          </button>
        </ComicPanel>
      </div>

      <div className="split-grid account-sync-panels" aria-busy={busy !== null}>
        <ComicPanel>
          <CaptionBox><Upload aria-hidden="true" /> This device</CaptionBox>
          <h2>Local saves</h2>
          {localSaves.length === 0 ? (
            <EmptyState title="No local saves">
              <p>Create a campaign first, then return here to upload it to your account.</p>
            </EmptyState>
          ) : (
            <div className="sync-save-list">
              {localSaves.map((save) => (
                <article className="sync-save-row" key={save.saveId}>
                  <div className="sync-save-row__main">
                    <h3>{save.name}</h3>
                    <p className="meta">
                      {formatPhaseLabel(save.phase)} · Issue {save.currentIssueNumber ?? "Complete"} · Intel {save.intel} · Network {save.network} · {save.completionPercent}%
                    </p>
                    <p className="small">Updated {formatDate(save.updatedAt)}</p>
                  </div>
                  <button type="button" disabled={!account || busy === `upload:${save.saveId}`} onClick={() => void uploadSave(save.saveId)}>
                    <Upload aria-hidden="true" /> Upload
                  </button>
                </article>
              ))}
            </div>
          )}
        </ComicPanel>

        <ComicPanel>
          <CaptionBox><Download aria-hidden="true" /> Supabase</CaptionBox>
          <h2>Account saves</h2>
          {!account ? (
            <EmptyState title="Sign in to list cloud saves">
              <p>Cloud rows are protected by Supabase row-level security and only appear for the signed-in user.</p>
            </EmptyState>
          ) : cloudSaves.length === 0 ? (
            <EmptyState title="No account saves yet">
              <p>Upload a local campaign to make it available on another signed-in device.</p>
            </EmptyState>
          ) : (
            <div className="sync-save-list">
              {cloudSaves.map((save) => (
                <article className="sync-save-row" key={save.saveId}>
                  <div className="sync-save-row__main">
                    <h3>{save.name}</h3>
                    <p className="meta">
                      {formatPhaseLabel(save.phase)} · Issue {save.currentIssueNumber ?? "Complete"} · Intel {save.intel} · Network {save.network} · Sequence {save.sequence}
                    </p>
                    <p className="small">Cloud updated {formatDate(save.cloudUpdatedAt)}</p>
                  </div>
                  <button type="button" disabled={busy === `download:${save.saveId}`} onClick={() => void downloadSave(save)}>
                    <Download aria-hidden="true" /> Download
                  </button>
                </article>
              ))}
            </div>
          )}
        </ComicPanel>
      </div>
      <ComicPanel>
        <CaptionBox><KeyRound aria-hidden="true" /> Account boundary</CaptionBox>
        <p>
          This is username/password login backed by Supabase Auth. The app maps the username to an internal auth email, but it never stores or exports the password. JSON backups remain available for portable manual backups.
        </p>
      </ComicPanel>
    </>
  );
}
