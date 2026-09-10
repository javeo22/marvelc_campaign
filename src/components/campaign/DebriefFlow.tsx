"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, CheckCircle2, RadioTower, Shield, ShieldAlert, Sparkles } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { replayCampaign } from "@/domain/reducer";
import { selectDebriefPreview, selectUnlockedAssets } from "@/domain/selectors";
import type { CampaignSnapshot, IssueDefinition, IssueResult } from "@/domain/types";
import { useCampaignSave } from "./useCampaignSave";

const resultLabels: Array<{ value: IssueResult; label: string }> = [
  { value: "win", label: "Win" },
  { value: "hero_defeat", label: "Hero defeated" },
  { value: "main_scheme_loss", label: "Main scheme completed" },
  { value: "other_loss", label: "Other loss" },
  { value: "abandoned", label: "Abandoned" }
];

function NetworkConsequence({
  snapshotBefore,
  networkAfter,
  scarAfter,
  issue,
  result
}: {
  snapshotBefore: CampaignSnapshot;
  networkAfter: number;
  scarAfter: number;
  issue: IssueDefinition;
  result: IssueResult;
}) {
  const active = campaignDefinition.networkAdaptations.filter((adaptation) => adaptation.threshold <= networkAfter);
  const newlyActive = active.filter((adaptation) => adaptation.threshold > snapshotBefore.network);
  const next = campaignDefinition.networkAdaptations.find((adaptation) => adaptation.threshold > networkAfter);

  return (
    <div className="consequence-explanation">
      <div className="consequence-explanation__lead">
        <RadioTower aria-hidden="true" />
        <span>
          <strong>Network {snapshotBefore.network} → {networkAfter}</strong>
          <small>Ultron learns from every Avengers failure. Reached penalties are cumulative.</small>
        </span>
      </div>
      {result === "hero_defeat" ? <p><strong>Why +1?</strong> The hero was defeated.</p> : null}
      {result === "main_scheme_loss" ? <p><strong>Why +2?</strong> The main scheme completed.</p> : null}
      {newlyActive.map((adaptation) => (
        <div className="adaptation-reveal" key={adaptation.id} role="status">
          <span>New adaptation unlocked</span>
          <strong>{adaptation.name.en}</strong>
          <p>{adaptation.effect.en}</p>
        </div>
      ))}
      <div>
        <strong>Current Network effects</strong>
        {active.length === 0 ? <p>None.</p> : (
          <ul>
            {active.map((adaptation) => <li key={adaptation.id}><strong>{adaptation.name.en}:</strong> {adaptation.effect.en}</li>)}
          </ul>
        )}
      </div>
      {next ? (
        <p><strong>Next at Network {next.threshold}: {next.name.en}.</strong> {next.effect.en}</p>
      ) : <p><strong>All Network adaptations are active.</strong></p>}
      {result === "hero_defeat" ? (
        <div className="consequence-explanation__lead consequence-explanation__lead--scar">
          <Shield aria-hidden="true" />
          <span>
            <strong>{issue.heroName.en} Scar {snapshotBefore.scars[issue.heroId] ?? 0} → {scarAfter}</strong>
            <small>Next time this hero begins an issue, lower the starting HP dial by {scarAfter}. Maximum HP is unchanged. A win with this hero removes 1 Scar.</small>
          </span>
        </div>
      ) : null}
    </div>
  );
}

function RecordedResult({
  saveId,
  issue,
  result,
  before,
  after
}: {
  saveId: string;
  issue: IssueDefinition;
  result: IssueResult;
  before: CampaignSnapshot;
  after: CampaignSnapshot;
}) {
  const loss = result !== "win";
  const nextIssue = after.currentIssueNumber;
  const nextHref = after.phase === "interlude"
    ? `/campaigns/${saveId}`
    : after.phase === "complete"
      ? `/campaigns/${saveId}/finale`
      : nextIssue
        ? `/campaigns/${saveId}/issue/${nextIssue}/prepare`
        : `/campaigns/${saveId}`;
  const nextLabel = after.playMode === "canon" && loss && nextIssue === issue.number
    ? "Replay issue"
    : after.phase === "complete"
      ? "View finale"
      : nextIssue
        ? `Prepare Issue ${String(nextIssue).padStart(2, "0")}`
        : "Continue campaign";
  const newFlags = after.flags.filter((flag) => !before.flags.includes(flag));
  const newMasteries = after.masteries.filter((heroId) => !before.masteries.includes(heroId));
  const newAssets = selectUnlockedAssets(campaignDefinition, after).filter(
    (asset) => !selectUnlockedAssets(campaignDefinition, before).some((prior) => prior.id === asset.id)
  );
  const newAdaptations = campaignDefinition.networkAdaptations.filter(
    (adaptation) => adaptation.threshold > before.network && adaptation.threshold <= after.network
  );

  return (
    <>
      <ComicHeader
        eyebrow="Result recorded"
        title={result === "win" ? "Victory" : "Defeat"}
        subtitle={result === "win" ? issue.outcomes.win.en : issue.outcomes.loss.en}
      />
      <div className="result-review-grid">
        <ComicPanel className="result-review" data-result={loss ? "loss" : "win"}>
          <span className="caption-box">{result === "hero_defeat" ? "Hero defeated" : result === "main_scheme_loss" ? "Scheme complete" : result === "win" ? "Issue won" : "Issue ended"}</span>
          <h2>{issue.title.en}</h2>
          <div className="dense-grid">
            <span><strong>Intel</strong><br />{before.intel} → {after.intel}</span>
            <span><strong>Network</strong><br />{before.network} → {after.network}</span>
            <span><strong>{issue.heroName.en} Scars</strong><br />{before.scars[issue.heroId] ?? 0} → {after.scars[issue.heroId] ?? 0}</span>
          </div>
        </ComicPanel>
        {loss ? (
          <ComicPanel>
            <NetworkConsequence
              snapshotBefore={before}
              networkAfter={after.network}
              scarAfter={after.scars[issue.heroId] ?? 0}
              issue={issue}
              result={result}
            />
          </ComicPanel>
        ) : null}
      </div>
      <ComicPanel className="campaign-changes" aria-labelledby="campaign-changes-title">
        <span className="caption-box">After-action report</span>
        <h2 id="campaign-changes-title">What changed?</h2>
        <div className="campaign-change-list">
          {after.intel !== before.intel ? (
            <div><Sparkles aria-hidden="true" /><span><strong>Intel {before.intel} → {after.intel}</strong><small>{after.intel - before.intel > 0 ? `Gained ${after.intel - before.intel} this game.` : `Adjusted by ${after.intel - before.intel}.`}</small></span></div>
          ) : null}
          {newFlags.map((flagId) => {
            const flagIssue = campaignDefinition.issues.find((candidate) => candidate.objective.flagId === flagId);
            return <div key={flagId}><CheckCircle2 aria-hidden="true" /><span><strong>Objective secured</strong><small>{flagIssue?.objective.flag ?? flagId}</small></span></div>;
          })}
          {newMasteries.map((heroId) => {
            const hero = campaignDefinition.heroes.find((candidate) => candidate.id === heroId);
            return <div key={heroId}><Shield aria-hidden="true" /><span><strong>First Mastery recorded</strong><small>{hero?.name.en ?? heroId}</small></span></div>;
          })}
          {newAssets.length > 0 ? (
            <div><Sparkles aria-hidden="true" /><span><strong>Field Assets unlocked</strong><small>{newAssets.map((asset) => asset.name.en).join(" · ")}</small></span></div>
          ) : null}
          {newAdaptations.map((adaptation) => (
            <div key={adaptation.id}><RadioTower aria-hidden="true" /><span><strong>Network adaptation activated</strong><small>{adaptation.name.en}: {adaptation.effect.en}</small></span></div>
          ))}
          {after.scars[issue.heroId] !== before.scars[issue.heroId] ? (
            <div><ShieldAlert aria-hidden="true" /><span><strong>{issue.heroName.en} Scar {before.scars[issue.heroId] ?? 0} → {after.scars[issue.heroId] ?? 0}</strong><small>{(after.scars[issue.heroId] ?? 0) > (before.scars[issue.heroId] ?? 0) ? "Lower this hero’s starting HP by the new Scar total next game." : "A campaign win removed one Scar."}</small></span></div>
          ) : null}
          {after.intel === before.intel && newFlags.length === 0 && newMasteries.length === 0 && newAssets.length === 0 && newAdaptations.length === 0 && after.scars[issue.heroId] === before.scars[issue.heroId] ? (
            <p className="small">No persistent campaign tracks changed this game.</p>
          ) : null}
        </div>
      </ComicPanel>
      <div className="result-actions">
        <Link className="button" href={nextHref}><ArrowRight aria-hidden="true" /> {nextLabel}</Link>
        <Link className="button button--secondary" href={`/campaigns/${saveId}`}>Return to campaign</Link>
      </div>
    </>
  );
}

export function DebriefFlow({ saveId }: { saveId: string }) {
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  const [result, setResult] = useState<IssueResult>("win");
  const [objectiveCompleted, setObjectiveCompleted] = useState(false);
  const [masteryEarned, setMasteryEarned] = useState(false);
  const [ackOtherLoss, setAckOtherLoss] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [committed, setCommitted] = useState<{
    issue: IssueDefinition;
    result: IssueResult;
    before: CampaignSnapshot;
    after: CampaignSnapshot;
  } | null>(null);

  const preview = useMemo(() => {
    if (!save?.snapshot.activeSession) return null;
    return selectDebriefPreview(campaignDefinition, save.snapshot, result, objectiveCompleted, masteryEarned);
  }, [save, result, objectiveCompleted, masteryEarned]);

  if (loading) return <ComicPanel><p>Loading debrief...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load debrief"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (committed) {
    return <RecordedResult saveId={saveId} issue={committed.issue} result={committed.result} before={committed.before} after={committed.after} />;
  }
  if (!save?.snapshot.activeSession || !preview) {
    return <EmptyState title="No active debrief"><p>Start or resume an issue before recording a result.</p></EmptyState>;
  }

  const issue = preview.issue;
  const objectiveAlready = preview.priorObjective;
  const masteryAlready = preview.priorMastery;
  const commitDisabled = busy || (result === "other_loss" && !ackOtherLoss);
  const previewIsLoss = result === "hero_defeat" || result === "main_scheme_loss";

  const commit = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const snapshotBefore = save.snapshot;
      const issueStarted = [...save.events].reverse().find((event) => event.type === "ISSUE_STARTED" && event.payload.issueNumber === issue.number);
      const replayedBefore = issueStarted
        ? replayCampaign(campaignDefinition, save.events.filter((event) => event.sequence < issueStarted.sequence), save.playMode)
        : null;
      const gameStartSnapshot = replayedBefore?.ok ? replayedBefore.value : snapshotBefore;
      const committedResult = result;
      const descriptors = [
        ...(!issue.objective.winGated && objectiveCompleted && !objectiveAlready
          ? [{ type: "OBJECTIVE_COMPLETED" as const, payload: { issueNumber: issue.number, flagId: issue.objective.flagId } }]
          : []),
        ...(masteryEarned && !masteryAlready
          ? [{ type: "MASTERY_EARNED" as const, payload: { heroId: issue.heroId } }]
          : []),
        {
          type: "ISSUE_COMPLETED" as const,
          payload: {
            issueNumber: issue.number,
            result,
            objectiveCompleted,
            masteryEarned: false,
            notes: notes.trim()
          }
        }
      ];
      const next = await append(descriptors);
      setCommitted({ issue, result: committedResult, before: gameStartSnapshot, after: next.snapshot });
      setBusy(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <>
      <ComicHeader
        eyebrow="Debrief"
        title={issue.title.en}
        subtitle="Preview every campaign consequence before committing the append-only result event."
      />
      {actionError ? <ErrorPanel title="Commit failed"><p>{actionError}</p></ErrorPanel> : null}
      <div className="split-grid">
        <ComicPanel>
          <form className="form-stack">
            <fieldset className="form-stack">
              <legend>How did the issue end?</legend>
              <div className="segmented">
                {resultLabels.map((option) => (
                  <label key={option.value}>
                    <input
                      type="radio"
                      name="result"
                      checked={result === option.value}
                      onChange={() => setResult(option.value)}
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </fieldset>
            <label>
              <input
                type="checkbox"
                checked={objectiveAlready || objectiveCompleted}
                disabled={objectiveAlready}
                onChange={(event) => setObjectiveCompleted(event.target.checked)}
              />
              Objective {objectiveAlready ? "already recorded" : issue.objective.winGated ? "completed with win" : "completed"}
            </label>
            <label>
              <input
                type="checkbox"
                checked={masteryAlready || masteryEarned}
                disabled={masteryAlready}
                onChange={(event) => setMasteryEarned(event.target.checked)}
              />
              Hero Mastery {masteryAlready ? "already recorded" : "earned"}
            </label>
            {result === "other_loss" ? (
              <label>
                <input type="checkbox" checked={ackOtherLoss} onChange={(event) => setAckOtherLoss(event.target.checked)} />
                I reviewed this source-undefined loss and am recording no automatic track change.
              </label>
            ) : null}
            <label>
              Notes
              <textarea value={notes} maxLength={2000} onChange={(event) => setNotes(event.target.value)} />
            </label>
          </form>
        </ComicPanel>
        <aside className="form-stack" aria-label="Consequence preview">
          <ComicPanel>
            <span className="caption-box">Preview</span>
            <div className="dense-grid">
              <span><strong>Intel</strong><br />{preview.intelBefore} → {preview.intelAfter}</span>
              <span><strong>Network</strong><br />{preview.networkBefore} → {preview.networkAfter}</span>
              <span><strong>Scars</strong><br />{preview.scarBefore} → {preview.scarAfter}</span>
              <span><strong>Next</strong><br />{preview.nextIssueNumber ? `Issue ${preview.nextIssueNumber}` : "Finale"}</span>
            </div>
            <ul>
              <li>Win Intel: +{preview.winAward}</li>
              <li>Objective Intel: +{preview.objectiveAward}{preview.priorObjective ? " (prior event)" : ""}</li>
              <li>Mastery Intel: +{preview.masteryAward}{preview.priorMastery ? " (prior event)" : ""}</li>
              <li>Network delta: +{preview.networkDelta}</li>
            </ul>
            {previewIsLoss ? (
              <NetworkConsequence
                snapshotBefore={save.snapshot}
                networkAfter={preview.networkAfter}
                scarAfter={preview.scarAfter}
                issue={issue}
                result={result}
              />
            ) : null}
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Narrative</span>
            <p>{result === "win" ? issue.outcomes.win.en : issue.outcomes.loss.en}</p>
          </ComicPanel>
          <button type="button" disabled={commitDisabled} onClick={() => void commit()}>
            {result === "win" ? <CheckCircle2 aria-hidden="true" /> : <ShieldAlert aria-hidden="true" />}
            Commit {(!issue.objective.winGated && objectiveCompleted && !objectiveAlready ? 1 : 0) + (masteryEarned && !masteryAlready ? 1 : 0) + 1} event(s)
          </button>
        </aside>
      </div>
    </>
  );
}
