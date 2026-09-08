"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ShieldAlert } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { selectDebriefPreview } from "@/domain/selectors";
import type { IssueResult } from "@/domain/types";
import { useCampaignSave } from "./useCampaignSave";

const resultLabels: Array<{ value: IssueResult; label: string }> = [
  { value: "win", label: "Win" },
  { value: "hero_defeat", label: "Hero defeated" },
  { value: "main_scheme_loss", label: "Main scheme completed" },
  { value: "other_loss", label: "Other loss" },
  { value: "abandoned", label: "Abandoned" }
];

export function DebriefFlow({ saveId }: { saveId: string }) {
  const router = useRouter();
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  const [result, setResult] = useState<IssueResult>("win");
  const [objectiveCompleted, setObjectiveCompleted] = useState(false);
  const [masteryEarned, setMasteryEarned] = useState(false);
  const [ackOtherLoss, setAckOtherLoss] = useState(false);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const preview = useMemo(() => {
    if (!save?.snapshot.activeSession) return null;
    return selectDebriefPreview(campaignDefinition, save.snapshot, result, objectiveCompleted, masteryEarned);
  }, [save, result, objectiveCompleted, masteryEarned]);

  if (loading) return <ComicPanel><p>Loading debrief...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load debrief"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save?.snapshot.activeSession || !preview) {
    return <EmptyState title="No active debrief"><p>Start or resume an issue before recording a result.</p></EmptyState>;
  }

  const issue = preview.issue;
  const objectiveAlready = preview.priorObjective;
  const masteryAlready = preview.priorMastery;
  const commitDisabled = busy || (result === "other_loss" && !ackOtherLoss);

  const commit = async () => {
    setBusy(true);
    setActionError(null);
    try {
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
      if (next.snapshot.phase === "interlude") {
        const interlude = campaignDefinition.interludes.find((item) => !next.snapshot.interludeChoices[item.id]);
        router.push(interlude ? `/campaigns/${saveId}/interlude/${interlude.id}` : `/campaigns/${saveId}`);
      } else if (next.snapshot.phase === "complete") {
        router.push(`/campaigns/${saveId}/finale`);
      } else {
        router.push(`/campaigns/${saveId}`);
      }
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
              <legend>Result</legend>
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
