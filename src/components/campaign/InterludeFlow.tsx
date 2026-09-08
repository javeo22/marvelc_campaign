"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { selectActRecoveryPreview } from "@/domain/selectors";
import { useCampaignSave } from "./useCampaignSave";

export function InterludeFlow({ saveId, interludeId }: { saveId: string; interludeId: string }) {
  const router = useRouter();
  const { save, loading, error, reload, append } = useCampaignSave(saveId);
  const [choiceId, setChoiceId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const interlude = campaignDefinition.interludes.find((item) => item.id === interludeId);

  if (loading) return <ComicPanel><p>Loading Interlude...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load Interlude"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save || !interlude) return <EmptyState title="Interlude not found"><p>Return to the dashboard for the next campaign step.</p></EmptyState>;
  const preview = selectActRecoveryPreview(campaignDefinition, save.snapshot, interlude.actRecovery.actId);
  const alreadyChosen = save.snapshot.interludeChoices[interlude.id];

  const commit = async () => {
    if (!choiceId) return;
    setBusy(true);
    setActionError(null);
    try {
      await append([
        { type: "INTERLUDE_CHOICE_MADE", payload: { interludeId: interlude.id, choiceId } },
        { type: "ACT_RECOVERY_APPLIED", payload: { actId: interlude.actRecovery.actId } }
      ]);
      router.push(`/campaigns/${saveId}`);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <>
      <ComicHeader
        eyebrow="Interlude"
        title={interlude.title.en}
        subtitle={interlude.prompt.en}
      />
      {actionError ? <ErrorPanel title="Interlude blocked"><p>{actionError}</p></ErrorPanel> : null}
      {alreadyChosen ? <ErrorPanel title="Already chosen"><p>This Interlude is locked to {alreadyChosen}.</p></ErrorPanel> : null}
      <div className="split-grid">
        <ComicPanel>
          <fieldset className="form-stack" disabled={Boolean(alreadyChosen)}>
            <legend>Choose one branch</legend>
            <div className="segmented">
              {interlude.choices.map((choice) => (
                <label key={choice.id}>
                  <input
                    type="radio"
                    name="interlude"
                    checked={choiceId === choice.id}
                    onChange={() => setChoiceId(choice.id)}
                  />
                  {choice.name.en}
                </label>
              ))}
            </div>
          </fieldset>
          {interlude.choices.map((choice) => (
            <section className="embedded-frame" style={{ marginTop: "1rem" }} key={choice.id}>
              <h2>{choice.name.en}</h2>
              <ul>
                {choice.effects.map((effect) => (
                  <li key={`${choice.id}-${effect.issue}`}>Issue {effect.issue}: {effect.effect}</li>
                ))}
              </ul>
            </section>
          ))}
        </ComicPanel>
        <aside className="form-stack">
          <ComicPanel>
            <span className="caption-box">Act Recovery</span>
            <p>Objectives in act: {preview.objectiveCount}. Wins in act: {preview.wonIssueCount}.</p>
            <ul>
              <li>Objective reduction: -{preview.objectiveReduction}</li>
              <li>Low-win reduction: -{preview.lowWinReduction}</li>
              <li>Network: {preview.networkBefore} → {preview.networkAfter}</li>
            </ul>
            <p className="small">Recovery can be applied once and floors Network at zero.</p>
          </ComicPanel>
          <button type="button" disabled={!choiceId || busy || Boolean(alreadyChosen)} onClick={() => void commit()}>
            <CheckCircle2 aria-hidden="true" /> Commit choice and Recovery
          </button>
        </aside>
      </div>
    </>
  );
}
