"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Copy, Download, Play, Plus, Trash2 } from "lucide-react";
import { EmptyState, ErrorPanel, ComicHeader, ComicPanel } from "@/components/comic/ComicPrimitives";
import { deleteCampaignSave, duplicateCampaignSave, listCampaignSaves, type SaveSummary } from "@/storage/indexeddb";
import { formatPhaseLabel } from "./display-labels";

export function CampaignLibrary() {
  const [saves, setSaves] = useState<SaveSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imageModeCopy =
    process.env.NEXT_PUBLIC_CARD_IMAGE_MODE === "remote"
      ? "Remote card previews are enabled."
      : "Metadata-only mode is active.";

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      setSaves(await listCampaignSaves());
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    const boot = async () => {
      try {
        const next = await listCampaignSaves();
        if (active) setSaves(next);
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (active) setLoading(false);
      }
    };
    void boot();
    return () => {
      active = false;
    };
  }, []);

  const remove = async (save: SaveSummary) => {
    if (!confirm(`Delete "${save.name}" from this device? Export first if you need a backup.`)) return;
    await deleteCampaignSave(save.saveId);
    await load();
  };

  return (
    <>
      <ComicHeader
        eyebrow="Fan companion"
        title="Core Protocol"
        subtitle={`A local-first campaign journal for physical table play. ${imageModeCopy}`}
        actions={<Link className="button" href="/campaigns/new"><Plus aria-hidden="true" /> New Campaign</Link>}
      />
      {error ? <ErrorPanel title="Local storage unavailable"><p>{error}</p><button type="button" onClick={load}>Retry</button></ErrorPanel> : null}
      {loading ? <ComicPanel><p>Loading local saves...</p></ComicPanel> : null}
      {!loading && saves.length === 0 ? (
        <EmptyState title="No campaigns on this device">
          <p>Create a save to start Issue 1 without an account or network.</p>
          <Link className="button" href="/onboarding"><Play aria-hidden="true" /> Start onboarding</Link>
        </EmptyState>
      ) : null}
      <div className="panel-grid">
        {saves.map((save) => (
          <article className="comic-panel" key={save.saveId}>
            <span className="caption-box">{formatPhaseLabel(save.phase)}</span>
            <h2>{save.name}</h2>
            <p className="meta">
              Issue {save.currentIssueNumber ?? "Complete"} · Intel {save.intel} · Network {save.network} · {save.completionPercent}%
            </p>
            <div className="chip-row">
              <Link className="button" href={`/campaigns/${save.saveId}`}><Play aria-hidden="true" /> Open</Link>
              <Link className="button" href={`/settings/backup?saveId=${save.saveId}`}><Download aria-hidden="true" /> Export</Link>
              <button type="button" onClick={() => void duplicateCampaignSave(save.saveId).then(() => load())}><Copy aria-hidden="true" /> Duplicate</button>
              <button type="button" onClick={() => void remove(save)}><Trash2 aria-hidden="true" /> Delete</button>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
