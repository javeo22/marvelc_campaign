"use client";

import Link from "next/link";
import { AlertTriangle, Sparkles } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { resolveEnding } from "@/domain/ending-resolver";
import { useCampaignSave } from "./useCampaignSave";

export function FinaleView({ saveId }: { saveId: string }) {
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  if (loading) return <ComicPanel><p>Loading finale...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load finale"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save) return <EmptyState title="Save not found"><p>Open a valid local campaign save.</p></EmptyState>;

  const issue15 = save.snapshot.issueResults.find((record) => record.issueNumber === 15 && record.advancedCampaign);
  const computed = issue15 ? resolveEnding(campaignDefinition, save.snapshot, issue15.result) : null;
  const ending = save.snapshot.finalEndingId
    ? campaignDefinition.endings.find((candidate) => candidate.id === save.snapshot.finalEndingId)
    : null;

  return (
    <>
      <ComicHeader
        eyebrow="Finale"
        title="Epilogue"
        subtitle="Defined endings resolve from Issue 15 result, Network, Masteries, and CLEAN SHUTDOWN."
      />
      {!issue15 ? (
        <EmptyState title="Finale not reached">
          <p>Complete Issue 15 before resolving the campaign ending.</p>
          <Link className="button" href={`/campaigns/${saveId}`}>Return to dashboard</Link>
        </EmptyState>
      ) : null}
      {computed?.status === "needs_author_decision" ? (
        <ErrorPanel title="Campaign author decision required">
          <p>{computed.reason}</p>
          <p>
            Exact criteria: Issue 15 win, Network {save.snapshot.network}, and {save.snapshot.masteries.length} Mastery star(s).
          </p>
          <p>The save remains complete. No fallback ending has been invented.</p>
        </ErrorPanel>
      ) : null}
      {ending ? (
        <ComicPanel>
          <span className="caption-box">Ending</span>
          <h2>{ending.title}</h2>
          <p style={{ fontFamily: "var(--font-narrative)" }}>{ending.text}</p>
        </ComicPanel>
      ) : null}
      {save.snapshot.secretEpilogueEarned ? (
        <ComicPanel>
          <span className="caption-box">Secret epilogue</span>
          <h2>{campaignDefinition.secretEpilogue.title}</h2>
          <p>{campaignDefinition.secretEpilogue.text}</p>
        </ComicPanel>
      ) : null}
      <ComicPanel>
        <span className="caption-box">Mirror Protocol</span>
        <p>Starting Mirror Protocol clears Scars, Intel, Network, flags, setup state, and Field Assets for post-campaign rows while preserving story history.</p>
        <div className="chip-row">
          <button type="button" onClick={() => void append([{ type: "MIRROR_STARTED", payload: {} }])}>
            <Sparkles aria-hidden="true" /> Start Mirror Protocol
          </button>
          <Link className="button" href={`/campaigns/${saveId}/mirror`}>Open mirror table</Link>
          {computed?.status === "needs_author_decision" ? <span className="chip"><AlertTriangle aria-hidden="true" /> Author branch preserved</span> : null}
        </div>
      </ComicPanel>
    </>
  );
}
