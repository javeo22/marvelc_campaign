"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, Layers3, Play } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import cardReferenceJson from "@/content/card-reference.bilingual.json";
import { campaignDefinition } from "@/domain/content";
import { composeSetupPlan } from "@/domain/setup-plan";
import {
  getIssue,
  selectEndgameProtocolAvailable,
  selectFinalPreparationPoints,
  selectNormalFieldAssetLimit,
  selectUnlockedAssets,
  validateFieldAssetSelection
} from "@/domain/selectors";
import type { Aspect, CardReferenceIndex, CardReferenceRecord, IssueDefinition } from "@/domain/types";
import { AdaptationStack, FieldAssetSummary, IssueCover, ScarChip, ScarGuide } from "./CampaignBits";
import { formatAspectLabel } from "./display-labels";
import { RemoteCardPreview } from "./RemoteCardPreview";
import { useCampaignSave } from "./useCampaignSave";

const cardReference = cardReferenceJson as CardReferenceIndex;

function exactCard(name: string, setName?: string): CardReferenceRecord | null {
  return cardReference.records.find((record) => record.name_en === name && (!setName || record.set_en === setName)) ?? null;
}

function setCards(setName: string): CardReferenceRecord[] {
  return cardReference.records.filter((record) => record.category === "Encounter" && record.set_en === setName);
}

function VisualCard({
  record,
  fallbackName,
  orientation
}: {
  record: CardReferenceRecord | null;
  fallbackName: string;
  orientation?: "portrait" | "landscape";
}) {
  if (!record) {
    return (
      <div className="visual-card visual-card--missing">
        <Layers3 aria-hidden="true" />
        <strong>{fallbackName}</strong>
        <small>Use the named physical card.</small>
      </div>
    );
  }
  return (
    <div className="visual-card">
      <RemoteCardPreview
        code={record.marvelcdb_code}
        name={`${record.name_en} · ${record.name_es}`}
        pack={record.pack_en}
        collectorNumber={record.collector_number}
        orientation={orientation}
      />
      <div className="visual-card__label">
        <strong>{record.name_en}</strong>
        <span>{record.name_es}</span>
        <small>{record.pack_en} #{record.collector_number}</small>
      </div>
    </div>
  );
}

function SetGallery({ title, subtitle, cards }: { title: string; subtitle: string; cards: CardReferenceRecord[] }) {
  return (
    <details className="setup-set">
      <summary>
        <span className="setup-set__stack" aria-hidden="true"><Layers3 /></span>
        <span><strong>{title}</strong><small>{subtitle} · {cards.length} named cards</small></span>
      </summary>
      <div className="visual-card-grid">
        {cards.map((card) => <VisualCard key={card.record_id} record={card} fallbackName={card.name_en} />)}
      </div>
    </details>
  );
}

function VisualSetup({ issue }: { issue: IssueDefinition }) {
  const hero = exactCard(issue.heroName.en);
  const villains = issue.villainStages.map((stage) => exactCard(`${issue.villainName.en} (${stage})`, issue.villainName.en));
  const villainSet = setCards(issue.villainName.en);
  const mainScheme = villainSet.find((card) => !card.name_en.startsWith(`${issue.villainName.en} (`)) ?? null;
  const encounterSets = issue.encounterSets.map((setId) => {
    const setName = setId === "standard" ? "Standard" : "Expert";
    const label = setId === "standard" ? "Standard · Normal" : "Expert · Experto";
    return { id: setId, label, cards: setCards(setName) };
  });
  const modularCards = setCards(issue.modularSetName.en);
  const setAsideNames = Array.from(new Set(
    issue.setupActions.filter((action) => action.kind === "set_aside" && action.cardAnchorName).map((action) => action.cardAnchorName!)
  ));
  const revealActions = issue.setupActions.filter((action) => action.kind === "reveal_card" && action.cardAnchorName);
  const specialReferenceNames = issue.cardAnchorNames.filter((name) =>
    name !== issue.heroName.en &&
    name !== issue.modularSetName.en &&
    !name.startsWith(`${issue.villainName.en} (`) &&
    !setAsideNames.includes(name)
  );

  return (
    <ComicPanel className="visual-setup-panel">
      <span className="caption-box">Visual setup</span>
      <p className="small">Use this table map to identify the physical cards, then confirm the authored checklist below.</p>
      <div className="setup-diagram" aria-label={`Visual setup for ${issue.title.en}`}>
        <section className="setup-zone setup-zone--player" data-step="1">
          <span className="setup-zone__eyebrow">Player area</span>
          <VisualCard record={hero} fallbackName={issue.heroName.en} />
        </section>
        <span className="setup-flow-arrow" aria-hidden="true"><ArrowRight /></span>
        <section className="setup-zone setup-zone--villain" data-step="2">
          <span className="setup-zone__eyebrow">Villain area</span>
          <div className="visual-card-grid visual-card-grid--stages">
            {villains.map((card, index) => (
              <VisualCard key={issue.villainStages[index]} record={card} fallbackName={`${issue.villainName.en} (${issue.villainStages[index]})`} />
            ))}
            <VisualCard record={mainScheme} fallbackName={`${issue.villainName.en} main scheme`} orientation="landscape" />
          </div>
        </section>
        <span className="setup-flow-arrow" aria-hidden="true"><ArrowRight /></span>
        <section className="setup-zone setup-zone--encounter" data-step="3">
          <span className="setup-zone__eyebrow">Encounter deck</span>
          <div className="form-stack">
            {encounterSets.map((set) => <SetGallery key={set.id} title={set.label} subtitle="Required encounter set" cards={set.cards} />)}
            <SetGallery
              title={`${issue.modularSetName.en} · ${issue.modularSetName.es ?? "English source name"}`}
              subtitle="Required modular set"
              cards={modularCards}
            />
          </div>
        </section>
        {setAsideNames.length > 0 ? (
          <section className="setup-zone setup-zone--aside" data-step="4">
            <span className="setup-zone__eyebrow">Set aside</span>
            <div className="visual-card-grid visual-card-grid--aside">
              {setAsideNames.map((name) => <VisualCard key={name} record={exactCard(name, issue.modularSetName.en)} fallbackName={name} />)}
            </div>
            {revealActions.map((action) => <p className="setup-callout" key={action.id}>{action.text}</p>)}
          </section>
        ) : null}
        {specialReferenceNames.length > 0 ? (
          <section className="setup-zone setup-zone--references" data-step={setAsideNames.length > 0 ? "5" : "4"}>
            <span className="setup-zone__eyebrow">Special references</span>
            <div className="visual-card-grid">
              {specialReferenceNames.map((name) => <VisualCard key={name} record={exactCard(name)} fallbackName={name} />)}
            </div>
            <p className="setup-callout">Keep these named cards easy to identify for this issue’s special setup or continuity instructions.</p>
          </section>
        ) : null}
      </div>
    </ComicPanel>
  );
}

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
        subtitle={`${issue.heroName.en} vs ${issue.villainName.en} · ${issue.tierId} · ${issue.modularSetName.en}`}
      />
      {actionError ? <ErrorPanel title="Preparation blocked"><p>{actionError}</p></ErrorPanel> : null}
      <div className="form-stack preparation-intro">
        <IssueCover issue={issue} />
        <ComicPanel>
          <span className="caption-box">Previously</span>
          <p className="narrative-copy">{issue.narrative.previously.en}</p>
        </ComicPanel>
        <ComicPanel>
          <span className="caption-box">1 · Choose your deck</span>
          <fieldset className="form-stack">
            <legend className="sr-only">Choose aspect</legend>
            <p><strong>Required hero:</strong> {issue.heroName.en}{issue.heroName.es ? ` · ${issue.heroName.es}` : ""}</p>
            <p><strong>Recommended aspect:</strong> {formatAspectLabel(issue.recommendedAspect)}</p>
            <div className="segmented">
              {campaignDefinition.aspects.map((candidate) => (
                <label key={candidate}>
                  <input
                    type="radio"
                    name="aspect"
                    checked={aspect === candidate}
                    onChange={() => setAspect(candidate)}
                  />
                  {formatAspectLabel(candidate)}
                  {candidate === issue.recommendedAspect ? " · Recommended" : ""}
                </label>
              ))}
            </div>
            <p className="setup-callout"><strong>Any campaign aspect is legal.</strong> Build the deck you think best fits this hero and mission. Winning with a new aspect advances the optional Aspect Passport.</p>
            {save.playMode === "canon" ? (
              <p className="small">Canon Mode records failed retries. The passport stamps only the aspect used for a win.</p>
            ) : null}
          </fieldset>
        </ComicPanel>
        <VisualSetup issue={issue} />
      </div>
      <div className="split-grid preparation-actions">
        <div className="form-stack">
          <ComicPanel>
            <span className="caption-box">Checklist · authored order</span>
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
                          const checked = event.target.checked;
                          setConfirmed((current) => {
                            const next = new Set(current);
                            if (checked) next.add(action.id);
                            else next.delete(action.id);
                            return next;
                          });
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
            {issue.objective.completionNote.en ? <p>{issue.objective.completionNote.en}</p> : null}
            <p className="setup-callout"><strong>Why it matters:</strong> {issue.objective.winGated ? "This objective is finalized during debrief and requires a win." : "+1 Intel when recorded. It remains earned even if you later lose this issue."}</p>
          </ComicPanel>
          <ComicPanel>
            <span className="caption-box">Scars</span>
            <p>{issue.heroName.en}</p>
            <ScarChip count={snapshot.scars[issue.heroId] ?? 0} />
            <ScarGuide heroName={issue.heroName.en} count={snapshot.scars[issue.heroId] ?? 0} />
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
            <span className="caption-box">Campaign modifiers</span>
            <AdaptationStack definition={campaignDefinition} snapshot={snapshot} issueNumber={issueNumber} />
            {snapshot.network === 0 ? <p className="setup-callout"><strong>Network onboarding:</strong> No adaptations are active. Network rises when an issue ends in hero defeat or main-scheme completion.</p> : null}
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
