"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Play } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { composeSetupPlan } from "@/domain/setup-plan";
import {
  canSelectStoryAspect,
  getIssue,
  selectEndgameProtocolAvailable,
  selectFinalPreparationPoints,
  selectNormalFieldAssetLimit,
  selectUnlockedAssets,
  validateFieldAssetSelection
} from "@/domain/selectors";
import type { Aspect } from "@/domain/types";
import { AdaptationStack, FieldAssetSummary, IssueCover, ScarChip } from "./CampaignBits";
import { formatAspectLabel } from "./display-labels";
import { useCampaignSave } from "./useCampaignSave";

export function IssuePreparation({ saveId, issueNumber }: { saveId: string; issueNumber: number }) {
  const router = useRouter();
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  const issue = getIssue(campaignDefinition, issueNumber);
  const [aspect, setAspect] = useState<Aspect>(issue.recommendedAspect);
  const [selectedAssets, setSelectedAssets] = useState<string[]>([]);
  const [confirmed, setConfirmed] = useState<Set<string>>(new Set());
  const [finalPrepSelections, setFinalPrepSelections] = useState<string[]>([]);
  const [actionError, setActionError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const plan = useMemo(() => (save ? composeSetupPlan(campaignDefinition, save.snapshot, issueNumber) : null), [save, issueNumber]);

  if (loading) return <ComicPanel><p>Loading preparation...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load save"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save) return <EmptyState title="Save not found"><p>Return to the library and choose a valid local save.</p></EmptyState>;
  if (save.snapshot.currentIssueNumber !== issueNumber) {
    return <ErrorPanel title="Issue is not current"><p>This save is currently on Issue {save.snapshot.currentIssueNumber ?? "complete"}.</p></ErrorPanel>;
  }

  const snapshot = save.snapshot;
  const availableAssets = selectUnlockedAssets(campaignDefinition, snapshot).filter((asset) => asset.special !== "issue-15-only" || issueNumber === 15);
  const normalLimit = selectNormalFieldAssetLimit(campaignDefinition, snapshot);
  const endgameAvailable = selectEndgameProtocolAvailable(campaignDefinition, snapshot, issueNumber);
  const requiredActionIds = plan?.groups.flatMap((group) => group.actions.map((action) => action.id)) ?? [];
  const allConfirmed = requiredActionIds.every((id) => confirmed.has(id));
  const finalPrepPoints = selectFinalPreparationPoints(campaignDefinition, snapshot);

  const toggleAsset = (assetId: string) => {
    setActionError(null);
    const next = selectedAssets.includes(assetId)
      ? selectedAssets.filter((id) => id !== assetId)
      : [...selectedAssets, assetId];
    const result = validateFieldAssetSelection(campaignDefinition, snapshot, issueNumber, next);
    if (!result.ok) {
      setActionError(result.error.message);
      return;
    }
    setSelectedAssets(result.value);
  };

  const startIssue = async () => {
    setBusy(true);
    setActionError(null);
    try {
      const descriptors = [
        { type: "ISSUE_PREPARATION_STARTED" as const, payload: { issueNumber } },
        { type: "ASPECT_SELECTED" as const, payload: { issueNumber, aspect } },
        ...(selectedAssets.length > 0
          ? [{ type: "FIELD_ASSET_EQUIPPED" as const, payload: { issueNumber, assetIds: selectedAssets } }]
          : []),
        ...finalPrepSelections.map((optionId) => ({ type: "FINAL_PREP_SPENT" as const, payload: { optionId } })),
        { type: "ISSUE_STARTED" as const, payload: { issueNumber, aspect, selectedFieldAssetIds: selectedAssets } }
      ];
      await append(descriptors);
      router.push(`/campaigns/${saveId}/play`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <>
      <ComicHeader
        eyebrow="Prepare"
        title={`Issue ${String(issue.number).padStart(2, "0")}`}
        subtitle="Confirm the physical setup in source order. The app records only campaign selections when you start the issue."
      />
      {actionError ? <ErrorPanel title="Preparation blocked"><p>{actionError}</p></ErrorPanel> : null}
      <div className="split-grid">
        <div className="form-stack">
          <IssueCover issue={issue} />
          <ComicPanel>
            <span className="caption-box">Aspect Passport</span>
            <fieldset className="form-stack">
              <legend className="sr-only">Choose aspect</legend>
              <div className="segmented">
                {campaignDefinition.aspects.map((candidate) => {
                  const legal = canSelectStoryAspect(campaignDefinition, snapshot, issueNumber, candidate);
                  return (
                    <label key={candidate} aria-disabled={!legal.ok}>
                      <input
                        type="radio"
                        name="aspect"
                        checked={aspect === candidate}
                        disabled={!legal.ok}
                        onChange={() => setAspect(candidate)}
                      />
                      {formatAspectLabel(candidate)}
                      {candidate === issue.recommendedAspect ? " · Recommended" : ""}
                    </label>
                  );
                })}
              </div>
              {save.playMode === "canon" ? (
                <p className="small">Canon Mode records failed retries but stamps the story passport only when this issue is committed.</p>
              ) : null}
            </fieldset>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Setup sequence</span>
            {plan?.groups.map((group) => (
              <section key={group.phaseId} className="form-stack" style={{ marginTop: "1rem" }}>
                <h2>{group.label}</h2>
                <ol className="step-list">
                  {group.actions.map((action) => (
                    <li key={action.id}>
                      <input
                        aria-label={`Confirm ${action.text}`}
                        type="checkbox"
                        checked={confirmed.has(action.id)}
                        onChange={(event) => {
                          const next = new Set(confirmed);
                          if (event.target.checked) next.add(action.id);
                          else next.delete(action.id);
                          setConfirmed(next);
                        }}
                      />
                      <span>
                        <strong>{action.generated ? "Global" : "Player"}</strong>
                        <br />
                        {action.text}
                        <br />
                        <span className="small">{action.includedBecause}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </section>
            ))}
          </ComicPanel>
        </div>

        <aside className="form-stack" aria-label="Preparation details">
          <ComicPanel>
            <span className="caption-box">Objective</span>
            <h2>{issue.objective.flag}</h2>
            <p>{issue.objective.description.en}</p>
            <p className="small">{issue.objective.winGated ? "Debrief only; requires a win." : "Can be recorded during play after confirmation."}</p>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Scars</span>
            <p>{issue.heroName.en}</p>
            <ScarChip count={snapshot.scars[issue.heroId] ?? 0} />
          </ComicPanel>
          <ComicPanel>
            <FieldAssetSummary definition={campaignDefinition} snapshot={snapshot} issueNumber={issueNumber} />
            <fieldset className="form-stack" style={{ marginTop: "1rem" }}>
              <legend>Equip Field Assets</legend>
              {availableAssets.length === 0 ? <p className="small">No unlocked assets yet.</p> : null}
              {availableAssets.map((asset) => (
                <label key={asset.id}>
                  <input
                    type="checkbox"
                    checked={selectedAssets.includes(asset.id)}
                    disabled={asset.id === "endgame-protocol" && !endgameAvailable}
                    onChange={() => toggleAsset(asset.id)}
                  />
                  {asset.name.en} · Intel {asset.unlockIntel}
                </label>
              ))}
              <span className="small">Normal slot limit: {normalLimit}. Endgame Protocol does not consume a normal slot.</span>
            </fieldset>
          </ComicPanel>
          {issueNumber === 15 ? (
            <ComicPanel>
              <span className="caption-box">Final Preparation</span>
              <p>{finalPrepPoints} point{finalPrepPoints === 1 ? "" : "s"} from Act III flags. Repeated options are allowed.</p>
              <div className="form-stack">
                {campaignDefinition.finalPreparation.spendOptions.map((option) => (
                  <button
                    type="button"
                    key={option.id}
                    disabled={finalPrepSelections.length >= finalPrepPoints}
                    onClick={() => setFinalPrepSelections((current) => [...current, option.id])}
                  >
                    <Check aria-hidden="true" /> Spend: {option.effect}
                  </button>
                ))}
                <p className="small">Selected spends: {finalPrepSelections.length}/{finalPrepPoints}</p>
              </div>
            </ComicPanel>
          ) : null}
          <ComicPanel>
            <AdaptationStack definition={campaignDefinition} snapshot={snapshot} issueNumber={issueNumber} />
          </ComicPanel>
          {plan?.inGameReminders.length ? (
            <ComicPanel>
              <span className="caption-box">Pinned reminders</span>
              <ul>
                {plan.inGameReminders.map((reminder) => <li key={reminder.id}>{reminder.text}</li>)}
              </ul>
            </ComicPanel>
          ) : null}
          <button type="button" disabled={!allConfirmed || busy} onClick={() => void startIssue()}>
            <Play aria-hidden="true" /> {busy ? "Starting..." : "Start issue"}
          </button>
        </aside>
      </div>
    </>
  );
}
