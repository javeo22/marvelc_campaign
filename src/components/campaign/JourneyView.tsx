"use client";

import Link from "next/link";
import { CheckCircle2, Circle, Flag, Grid3X3, Sparkles } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { selectCompletionGrid, selectPerfectCore } from "@/domain/selectors";
import { useCampaignSave } from "./useCampaignSave";

export function JourneyView({ saveId }: { saveId: string }) {
  const { save, loading, error, reload } = useCampaignSave(saveId);
  if (loading) return <ComicPanel><p>Loading journey...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load journey"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save) return <EmptyState title="Save not found"><p>Open a valid local campaign save.</p></EmptyState>;

  const grid = selectCompletionGrid(campaignDefinition, save.snapshot);
  const advanced = new Set(save.snapshot.issueResults.filter((record) => record.advancedCampaign).map((record) => record.issueNumber));

  return (
    <>
      <ComicHeader
        eyebrow="Journey"
        title="Completion grid"
        subtitle="Official Standard and Expert clears stay distinct from Veteran bridge games and Mirror Protocol rows."
        actions={<Link className="button" href={`/campaigns/${saveId}/passport`}>Hero passport</Link>}
      />
      <div className="dense-grid">
        <ComicPanel>
          <span className="caption-box"><Grid3X3 aria-hidden="true" /> Story</span>
          <h2>{advanced.size}/15 issues</h2>
          <p>Mirror rows: {save.snapshot.mirrorResults.length}/20. Total journey target: {campaignDefinition.mirrorProtocol.totalJourneyGames} games.</p>
        </ComicPanel>
        <ComicPanel>
          <span className="caption-box"><Flag aria-hidden="true" /> Flags</span>
          <h2>{save.snapshot.flags.length}/15 objectives</h2>
          <p>{save.snapshot.flags.length ? save.snapshot.flags.join(", ") : "No objective flags recorded yet."}</p>
        </ComicPanel>
        <ComicPanel>
          <span className="caption-box"><Sparkles aria-hidden="true" /> Perfect Core</span>
          <h2>{selectPerfectCore(campaignDefinition, save.snapshot) ? "Earned" : "Incomplete"}</h2>
          <p>Requires all Standard/Expert pair clears, all heroes with four aspects, and all five Masteries.</p>
        </ComicPanel>
      </div>
      <ComicPanel>
        <span className="caption-box">Official clear matrix</span>
        <div className="clear-grid" style={{ marginTop: "1rem" }}>
          {grid.map((row) => (
            <div className="clear-row" key={`${row.heroId}-${row.villainId}`}>
              <strong>{row.heroId} vs {row.villainId}</strong>
              <span data-clear={row.standard}>{row.standard ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />} Standard</span>
              <span data-clear={row.expert}>{row.expert ? <CheckCircle2 aria-hidden="true" /> : <Circle aria-hidden="true" />} Expert</span>
            </div>
          ))}
        </div>
      </ComicPanel>
    </>
  );
}
