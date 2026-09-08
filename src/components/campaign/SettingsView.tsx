"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CloudOff, FileJson, ImageOff, Info } from "lucide-react";
import { ComicHeader, ComicPanel, ErrorPanel } from "@/components/comic/ComicPrimitives";
import type { UiSettings } from "@/domain/types";
import { getSupabaseSyncStatus } from "@/integrations/supabase/sync";
import { getSettings, saveSettings } from "@/storage/indexeddb";

export function SettingsView() {
  const [settings, setSettings] = useState<UiSettings | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSettings().then(setSettings).catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (!settings) {
    return (
      <>
        <ComicHeader eyebrow="Settings" title="Local preferences" subtitle="Loading preferences from this device." />
        {error ? <ErrorPanel title="Settings unavailable"><p>{error}</p></ErrorPanel> : <ComicPanel><p>Loading settings...</p></ComicPanel>}
      </>
    );
  }

  const update = async (next: UiSettings) => {
    const saved = await saveSettings(next);
    setSettings(saved);
    setStatus("Preferences saved locally. Card images remain off.");
  };
  const syncStatus = getSupabaseSyncStatus();

  return (
    <>
      <ComicHeader eyebrow="Settings" title="Local preferences" subtitle="No account, analytics, sync, or card-image requests are enabled by default." />
      {status ? <div className="status-banner" role="status">{status}</div> : null}
      <div className="split-grid">
        <ComicPanel>
          <form className="form-stack">
            <label>Interface language<select value={settings.uiLanguage} onChange={(event) => void update({ ...settings, uiLanguage: event.target.value as "en" | "es" })}><option value="en">English</option><option value="es">Spanish UI</option></select></label>
            <label>Physical card names<select value={settings.physicalCardLanguage} onChange={(event) => void update({ ...settings, physicalCardLanguage: event.target.value as "en" | "es" | "both" })}><option value="both">English + Spanish</option><option value="en">English</option><option value="es">Spanish</option></select></label>
            <label>Theme<select value={settings.theme} onChange={(event) => void update({ ...settings, theme: event.target.value as UiSettings["theme"] })}><option value="system">System</option><option value="comic-light">Comic light</option><option value="comic-dark">Comic dark</option></select></label>
            <label><input type="checkbox" checked={settings.reducedMotion} onChange={(event) => void update({ ...settings, reducedMotion: event.target.checked })} /> Reduced motion</label>
            <label><input type="checkbox" checked={settings.largeControls} onChange={(event) => void update({ ...settings, largeControls: event.target.checked })} /> Large table controls</label>
            <label><input type="checkbox" checked={settings.keepAwakeDuringPlay} onChange={(event) => void update({ ...settings, keepAwakeDuringPlay: event.target.checked })} /> Keep screen awake during play when supported</label>
          </form>
        </ComicPanel>
        <aside className="form-stack">
          <ComicPanel>
            <span className="caption-box"><ImageOff aria-hidden="true" /> Rights gate</span>
            <h2>Card images off</h2>
            <p>Remote card imagery requires both kill switches and the signed launch checklist. Production configuration stays metadata-only.</p>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box"><CloudOff aria-hidden="true" /> Cloud sync</span>
            <h2>{syncStatus.enabled ? "Flag enabled" : "Disabled"}</h2>
            <p>
              Supabase is linked for deployment, but local IndexedDB remains authoritative.
              {syncStatus.enabled ? " Auth configuration is still required before cloud writes are exposed." : " Turn on the feature flag only after auth and conflict handling are verified."}
            </p>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box"><FileJson aria-hidden="true" /> Data</span>
            <div className="chip-row">
              <Link className="button" href="/settings/backup"><FileJson aria-hidden="true" /> Export / Import</Link>
              <Link className="button" href="/settings/about"><Info aria-hidden="true" /> Fan notice</Link>
            </div>
          </ComicPanel>
        </aside>
      </div>
    </>
  );
}
