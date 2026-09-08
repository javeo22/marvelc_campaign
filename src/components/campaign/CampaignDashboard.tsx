"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, CheckCircle2, FileJson, RotateCcw } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { getIssue, selectNextTransition } from "@/domain/selectors";
import { AdaptationStack, CampaignMeters, FieldAssetSummary, HeroScarTile, IssueCover } from "./CampaignBits";
import { formatIdLabel } from "./display-labels";
import { useCampaignSave } from "./useCampaignSave";

export function CampaignDashboard({ saveId }: { saveId: string }) {
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  const cardImageNotice =
    process.env.NEXT_PUBLIC_CARD_IMAGE_MODE === "remote"
      ? "Remote card previews are enabled for this build."
      : "External metadata is optional and card images are off.";

  if (loading) return <ComicPanel><p>Loading campaign save...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not open save"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save) {
    return (
      <EmptyState title="Save not found">
        <Link className="button" href="/">Return to library</Link>
      </EmptyState>
    );
  }

  const snapshot = save.snapshot;
  const issue = snapshot.currentIssueNumber ? getIssue(campaignDefinition, snapshot.currentIssueNumber) : null;
  const transition = selectNextTransition(campaignDefinition, snapshot);
  const pendingInterlude =
    snapshot.phase === "interlude"
      ? campaignDefinition.interludes.find((interlude) => !snapshot.interludeChoices[interlude.id])
      : null;
  const lastResults = save.events.slice(-6).reverse();

  const primaryHref =
    snapshot.activeSession
      ? `/campaigns/${saveId}/play`
      : pendingInterlude
        ? `/campaigns/${saveId}/interlude/${pendingInterlude.id}`
        : transition.kind === "finale"
          ? `/campaigns/${saveId}/finale`
          : issue
            ? `/campaigns/${saveId}/issue/${issue.number}/prepare`
            : `/campaigns/${saveId}/mirror`;

  return (
    <>
      <ComicHeader
        eyebrow={save.playMode === "canon" ? "Canon Mode beta" : "Fail-forward"}
        title={save.name}
        subtitle={`Local event journal is authoritative. ${cardImageNotice}`}
        actions={<Link className="button" href={primaryHref}><ArrowRight aria-hidden="true" /> Continue</Link>}
      />

      <div className="panel-grid">
        <div className="form-stack">
          {issue ? (
            <IssueCover
              issue={issue}
              action={<Link className="button" href={primaryHref}><BookOpen aria-hidden="true" /> {snapshot.activeSession ? "Resume fight" : pendingInterlude ? "Choose Interlude" : "Prepare Issue"}</Link>}
            />
          ) : (
            <ComicPanel>
              <span className="caption-box">Campaign complete</span>
              <h2>Finale ready</h2>
              <p>Resolve the ending or continue into Mirror Protocol.</p>
              <div className="chip-row">
                <Link className="button" href={`/campaigns/${saveId}/finale`}>Finale</Link>
                <Link className="button" href={`/campaigns/${saveId}/mirror`}>Mirror Protocol</Link>
              </div>
            </ComicPanel>
          )}
          <ComicPanel>
            <CampaignMeters definition={campaignDefinition} snapshot={snapshot} />
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Hero scars</span>
            <div className="scar-tile-grid" style={{ marginTop: "0.25rem" }}>
              {campaignDefinition.heroes.map((hero) => (
                <HeroScarTile
                  count={snapshot.scars[hero.id] ?? 0}
                  heroName={hero.name.en}
                  key={hero.id}
                  maximum={hero.scarMaximum}
                />
              ))}
            </div>
          </ComicPanel>
        </div>
        <aside className="form-stack" aria-label="Campaign side panel">
          {issue ? <ComicPanel><AdaptationStack definition={campaignDefinition} snapshot={snapshot} issueNumber={issue.number} /></ComicPanel> : null}
          {issue ? <ComicPanel><FieldAssetSummary definition={campaignDefinition} snapshot={snapshot} issueNumber={issue.number} /></ComicPanel> : null}
          <ComicPanel>
            <span className="caption-box">Journey</span>
            <div className="chip-row" style={{ marginTop: "0.75rem" }}>
              <Link className="button" href={`/campaigns/${saveId}/passport`}><CheckCircle2 aria-hidden="true" /> Passport</Link>
              <Link className="button" href={`/campaigns/${saveId}/journey`}><RotateCcw aria-hidden="true" /> Grid</Link>
              <Link className="button" href={`/settings/backup?saveId=${saveId}`}><FileJson aria-hidden="true" /> Backup</Link>
            </div>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Activity</span>
            {lastResults.length === 0 ? <p className="small">No events recorded.</p> : null}
            <ol>
              {lastResults.map((event) => (
                <li key={`${event.sequence}-${event.eventId}`}>
                  <strong>{formatIdLabel(event.type)}</strong>
                  <br />
                  <span className="small">Sequence {event.sequence}</span>
                </li>
              ))}
            </ol>
          </ComicPanel>
          {snapshot.phase === "complete" ? (
            <ComicPanel>
              <span className="caption-box">Mirror Protocol</span>
              <p>Reset campaign-only tracks for the post-campaign hunt while preserving the story record.</p>
              <button type="button" onClick={() => void append([{ type: "MIRROR_STARTED", payload: {} }])}>Start Mirror Protocol</button>
            </ComicPanel>
          ) : null}
        </aside>
      </div>
    </>
  );
}
