"use client";

import { useState } from "react";
import { CheckCircle2, Play } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { canSelectMirrorAspect, selectFirstMirrorAspect } from "@/domain/selectors";
import type { Aspect, IssueResult } from "@/domain/types";
import { ASPECTS, ISSUE_RESULTS } from "@/domain/types";
import { formatAspectLabel, formatIdLabel, formatResultLabel } from "./display-labels";
import { useCampaignSave } from "./useCampaignSave";

export function MirrorView({ saveId }: { saveId: string }) {
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  const [aspectByRow, setAspectByRow] = useState<Record<number, Aspect>>({});
  const [resultByRow, setResultByRow] = useState<Record<number, IssueResult>>({});
  const [actionError, setActionError] = useState<string | null>(null);

  if (loading) return <ComicPanel><p>Loading Mirror Protocol...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load mirrors"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save) return <EmptyState title="Save not found"><p>Open a valid local campaign save.</p></EmptyState>;

  const startMirror = async () => {
    setActionError(null);
    try {
      await append([{ type: "MIRROR_STARTED", payload: {} }]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  const completeMirror = async (mirrorNumber: number) => {
    setActionError(null);
    const row = campaignDefinition.mirrorProtocol.rows.find((candidate) => candidate.number === mirrorNumber);
    if (!row) return;
    const aspect = aspectByRow[mirrorNumber] ?? selectFirstMirrorAspect(campaignDefinition, save.snapshot, row.heroId);
    const result = resultByRow[mirrorNumber] ?? "win";
    const legal = canSelectMirrorAspect(campaignDefinition, save.snapshot, mirrorNumber, aspect);
    if (!legal.ok) {
      setActionError(legal.error.message);
      return;
    }
    try {
      await append([{ type: "MIRROR_COMPLETED", payload: { mirrorNumber, aspect, result } }]);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
    }
  };

  return (
    <>
      <ComicHeader
        eyebrow="Mirror Protocol"
        title="Post-campaign rows"
        subtitle="Starting Mirror Protocol resets campaign-only tracks but keeps story history and aspect records for first-mirror enforcement."
        actions={save.snapshot.phase !== "mirror" ? <button type="button" onClick={() => void startMirror()}><Play aria-hidden="true" /> Start mirrors</button> : null}
      />
      {actionError ? <ErrorPanel title="Mirror action blocked"><p>{actionError}</p></ErrorPanel> : null}
      <div className="form-stack">
        {campaignDefinition.mirrorProtocol.rows.map((row) => {
          const completed = save.snapshot.mirrorResults.find((record) => record.mirrorNumber === row.number);
          const required = selectFirstMirrorAspect(campaignDefinition, save.snapshot, row.heroId);
          const selectedAspect = aspectByRow[row.number] ?? required;
          return (
            <ComicPanel key={row.id}>
              <span className="caption-box">Mirror {row.number}</span>
              <h2>{row.heroName.en} vs {row.villainName.en}</h2>
              <p>{formatIdLabel(row.mode)} · {row.modularSetName.en}</p>
              {completed ? (
                <p><CheckCircle2 aria-hidden="true" /> Completed as {formatAspectLabel(completed.aspect)} with {formatResultLabel(completed.result)}</p>
              ) : (
                <div className="dense-grid">
                  <label>
                    Aspect
                    <select value={selectedAspect} disabled={save.snapshot.phase !== "mirror"} onChange={(event) => setAspectByRow((current) => ({ ...current, [row.number]: event.target.value as Aspect }))}>
                      {ASPECTS.map((aspect) => <option value={aspect} key={aspect}>{formatAspectLabel(aspect)}{aspect === required ? " · First Mirror" : ""}</option>)}
                    </select>
                  </label>
                  <label>
                    Result
                    <select value={resultByRow[row.number] ?? "win"} disabled={save.snapshot.phase !== "mirror"} onChange={(event) => setResultByRow((current) => ({ ...current, [row.number]: event.target.value as IssueResult }))}>
                      {ISSUE_RESULTS.map((result) => <option value={result} key={result}>{formatResultLabel(result)}</option>)}
                    </select>
                  </label>
                  <button type="button" disabled={save.snapshot.phase !== "mirror"} onClick={() => void completeMirror(row.number)}>Record mirror</button>
                </div>
              )}
            </ComicPanel>
          );
        })}
      </div>
    </>
  );
}
