"use client";

import Link from "next/link";
import { Minus, Plus, RotateCcw, Save, Swords } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { canObjectiveBeRecordedNow, trackerCheckIds } from "@/domain/objective-machine";
import { getIssue, selectActiveNetworkAdaptations } from "@/domain/selectors";
import type { CampaignEvent } from "@/domain/types";
import { useCampaignSave } from "@/components/campaign/useCampaignSave";

function latestUndoDescriptor(events: CampaignEvent[]) {
  const last = [...events]
    .reverse()
    .find((event) => ["COUNTER_CHANGED", "CHECKLIST_CHANGED", "FIELD_ASSET_USED"].includes(event.type));
  if (!last) return null;
  const earlier = events.filter((event) => event.sequence < last.sequence);
  if (last.type === "COUNTER_CHANGED") {
    const counterId = typeof last.payload.counterId === "string" ? last.payload.counterId : null;
    if (!counterId) return null;
    const previous = [...earlier]
      .reverse()
      .find((event) => event.type === "COUNTER_CHANGED" && event.payload.counterId === counterId)?.payload.value;
    return {
      type: "MANUAL_CORRECTION" as const,
      payload: {
        reason: "Undo table counter change",
        summary: `Undo counter ${counterId}`,
        revertsEventId: last.eventId,
        counterId,
        counterValue: typeof previous === "number" ? previous : 0
      }
    };
  }
  if (last.type === "CHECKLIST_CHANGED") {
    const checkId = typeof last.payload.checkId === "string" ? last.payload.checkId : null;
    if (!checkId) return null;
    const previous = [...earlier]
      .reverse()
      .find((event) => event.type === "CHECKLIST_CHANGED" && event.payload.checkId === checkId)?.payload.value;
    return {
      type: "MANUAL_CORRECTION" as const,
      payload: {
        reason: "Undo table checklist change",
        summary: `Undo checklist ${checkId}`,
        revertsEventId: last.eventId,
        checkId,
        checkValue: typeof previous === "boolean" ? previous : false
      }
    };
  }
  const assetId = typeof last.payload.assetId === "string" ? last.payload.assetId : null;
  if (!assetId) return null;
  const previous = [...earlier]
    .reverse()
    .find((event) => event.type === "FIELD_ASSET_USED" && event.payload.assetId === assetId)?.payload.used;
  return {
    type: "MANUAL_CORRECTION" as const,
    payload: {
      reason: "Undo Field Asset state",
      summary: `Undo Field Asset ${assetId}`,
      revertsEventId: last.eventId,
      assetId,
      assetUsed: typeof previous === "boolean" ? previous : false
    }
  };
}

export function TableMode({ saveId }: { saveId: string }) {
  const { save, loading, error, reload, append } = useCampaignSave(saveId);

  if (loading) return <ComicPanel><p>Restoring table session...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not restore session"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save?.snapshot.activeSession) {
    return (
      <EmptyState title="No active fight">
        <Link className="button" href={`/campaigns/${saveId}`}>Open campaign dashboard</Link>
      </EmptyState>
    );
  }

  const session = save.snapshot.activeSession;
  const issue = getIssue(campaignDefinition, session.issueNumber);
  const tracker = issue.objective.tracker;
  const checks = trackerCheckIds(tracker);
  const adaptations = selectActiveNetworkAdaptations(campaignDefinition, save.snapshot, issue.number, session.round);
  const undoDescriptor = latestUndoDescriptor(save.events);
  const canRecordObjective = canObjectiveBeRecordedNow(issue, save.snapshot);
  const masteryEarned = save.snapshot.masteries.includes(issue.heroId) || session.masteryEarnedThisSession;

  const counterId = "counterId" in tracker ? tracker.counterId : null;
  const counterValue = counterId ? session.objectiveCounters[counterId] ?? 0 : 0;
  const counterTarget = "target" in tracker ? tracker.target : null;
  const counterLabel = "label" in tracker ? tracker.label : "Objective";

  return (
    <>
      <ComicHeader
        eyebrow="Table mode"
        title={issue.title.en}
        subtitle="Manual table companion. Physical cards and official timing remain authoritative."
      />
      <div className="table-command-bar" aria-label="Table commands">
        <button type="button" onClick={() => void append([{ type: "ROUND_CHANGED", payload: { delta: 1 } }])}>
          <Plus aria-hidden="true" /> Round
        </button>
        <button type="button" disabled={!undoDescriptor} onClick={() => undoDescriptor && void append([undoDescriptor])}>
          <RotateCcw aria-hidden="true" /> Undo
        </button>
        <Link className="button" href={`/campaigns/${saveId}/debrief`}>
          <Swords aria-hidden="true" /> End Game
        </Link>
        <Link className="button" href={`/campaigns/${saveId}`}>
          <Save aria-hidden="true" /> Exit
        </Link>
      </div>

      <div className="table-surface">
        <div className="form-stack">
          <ComicPanel>
            <span className="caption-box">Objective</span>
            <h2>{issue.objective.flag}</h2>
            <p>{issue.objective.description.en}</p>
            {"deadline" in tracker ? <p className="small">Deadline: {tracker.deadline}</p> : null}
            {"deadlineRound" in tracker ? <p className="small">Deadline: end of round {tracker.deadlineRound}</p> : null}
            {counterId ? (
              <div className="form-stack">
                <label id={`${counterId}-label`}>{counterLabel}{counterTarget ? ` target ${counterTarget}` : ""}</label>
                <div className="counter-control" aria-labelledby={`${counterId}-label`}>
                  <button
                    type="button"
                    aria-label={`Decrease ${counterLabel} counter to ${Math.max(0, counterValue - 1)}`}
                    onClick={() => void append([{ type: "COUNTER_CHANGED", payload: { counterId, value: Math.max(0, counterValue - 1) } }])}
                  >
                    <Minus aria-hidden="true" />
                  </button>
                  <output>{counterValue}</output>
                  <button
                    type="button"
                    aria-label={`Increase ${counterLabel} counter to ${counterValue + 1}`}
                    onClick={() => void append([{ type: "COUNTER_CHANGED", payload: { counterId, value: counterValue + 1 } }])}
                  >
                    <Plus aria-hidden="true" />
                  </button>
                </div>
                {"incrementHint" in tracker && tracker.incrementHint ? <p className="small">{tracker.incrementHint}</p> : null}
              </div>
            ) : null}
            {checks.length ? (
              <div className="form-stack">
                {checks.map((check) => (
                  <label key={check.id}>
                    <input
                      type="checkbox"
                      checked={Boolean(session.objectiveChecks[check.id])}
                      onChange={(event) =>
                        void append([{ type: "CHECKLIST_CHANGED", payload: { checkId: check.id, value: event.target.checked } }])
                      }
                    />
                    {check.label}
                  </label>
                ))}
              </div>
            ) : null}
            {tracker.kind === "win_end_state" ? (
              <p className="small">This objective is checked during debrief and only matters with a win.</p>
            ) : null}
            <button
              type="button"
              disabled={!canRecordObjective}
              onClick={() => void append([{ type: "OBJECTIVE_COMPLETED", payload: { issueNumber: issue.number, flagId: issue.objective.flagId } }])}
            >
              Record objective now
            </button>
          </ComicPanel>

          <ComicPanel>
            <span className="caption-box">Hero Mastery</span>
            <h2>{issue.heroName.en}</h2>
            <p>{campaignDefinition.heroes.find((hero) => hero.id === issue.heroId)?.mastery.condition.en}</p>
            <button
              type="button"
              disabled={masteryEarned}
              onClick={() => void append([{ type: "MASTERY_EARNED", payload: { heroId: issue.heroId } }])}
            >
              {masteryEarned ? "Mastery recorded" : "Earn Mastery"}
            </button>
          </ComicPanel>

          <ComicPanel>
            <span className="caption-box">Session note</span>
            <form
              className="form-stack"
              onSubmit={(event) => {
                event.preventDefault();
                const form = new FormData(event.currentTarget);
                const text = String(form.get("note") ?? "").trim();
                event.currentTarget.reset();
                if (text) void append([{ type: "NOTE_ADDED", payload: { text } }]);
              }}
            >
              <textarea name="note" maxLength={2000} aria-label="Session note" />
              <button type="submit">Add note</button>
            </form>
          </ComicPanel>
        </div>

        <aside className="form-stack" aria-label="Table reminders">
          <ComicPanel>
            <span className="caption-box">Round</span>
            <div className="counter-control">
              <button type="button" aria-label={`Decrease round to ${Math.max(1, session.round - 1)}`} onClick={() => void append([{ type: "ROUND_CHANGED", payload: { delta: -1 } }])}><Minus aria-hidden="true" /></button>
              <output>{session.round}</output>
              <button type="button" aria-label={`Increase round to ${session.round + 1}`} onClick={() => void append([{ type: "ROUND_CHANGED", payload: { delta: 1 } }])}><Plus aria-hidden="true" /></button>
            </div>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Field Assets</span>
            {session.selectedFieldAssetIds.length === 0 ? <p className="small">No Field Assets equipped.</p> : null}
            {session.selectedFieldAssetIds.map((assetId) => {
              const asset = campaignDefinition.fieldAssets.assets.find((candidate) => candidate.id === assetId);
              const used = session.usedFieldAssetIds.includes(assetId);
              return (
                <div className="embedded-frame" key={assetId}>
                  <strong>{asset?.name.en ?? assetId}</strong>
                  <p>{asset?.effect.en}</p>
                  <button type="button" onClick={() => void append([{ type: "FIELD_ASSET_USED", payload: { assetId, used: !used } }])}>
                    {used ? "Mark ready" : "Use once"}
                  </button>
                </div>
              );
            })}
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Network</span>
            {adaptations.active.length === 0 ? <p className="small">No active adaptations.</p> : null}
            <ul>
              {adaptations.active.map((adaptation) => (
                <li key={adaptation.id}>
                  <strong>{adaptation.name.en}</strong>
                  {adaptations.suppressed?.id === adaptation.id ? " · suppressed through round 1" : ""}
                  <br />
                  <span className="small">{adaptation.effect.en}</span>
                </li>
              ))}
            </ul>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Notes</span>
            {session.notes.length === 0 ? <p className="small">No notes yet.</p> : null}
            <ol>
              {session.notes.map((note, index) => <li key={`${index}-${note}`}>{note}</li>)}
            </ol>
          </ComicPanel>
        </aside>
      </div>
    </>
  );
}
