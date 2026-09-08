"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { ComicHeader, ComicPanel, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { createLocalSave, saveSettings } from "@/storage/indexeddb";
import type { PlayMode } from "@/domain/types";

export function NewCampaignForm({ onboarding = false }: { onboarding?: boolean }) {
  const router = useRouter();
  const [name, setName] = useState("Core Protocol");
  const [playMode, setPlayMode] = useState<PlayMode>("fail-forward");
  const [physicalCardLanguage, setPhysicalCardLanguage] = useState<"en" | "es" | "both">("both");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await saveSettings({
        uiLanguage: "en",
        physicalCardLanguage,
        theme: "system",
        reducedMotion: false,
        cardImageMode: "off",
        keepAwakeDuringPlay: false,
        analyticsConsent: false,
        largeControls: true,
        soundEffects: false
      });
      const save = await createLocalSave({ name, playMode });
      router.push(`/campaigns/${save.saveId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setBusy(false);
    }
  };

  return (
    <>
      <ComicHeader
        eyebrow={onboarding ? "First run" : "New save"}
        title={onboarding ? "Open the dossier" : "Create campaign"}
        subtitle="Fail-forward is recommended. Canon Mode keeps the current issue after a loss, while keeping loss consequences."
      />
      {error ? <ErrorPanel title="Could not create save"><p>{error}</p></ErrorPanel> : null}
      <ComicPanel>
        <form className="form-stack" onSubmit={(event) => void submit(event)}>
          <label>
            Save name
            <input value={name} maxLength={80} onChange={(event) => setName(event.target.value)} />
          </label>
          <fieldset className="form-stack">
            <legend>Play mode</legend>
            <div className="segmented">
              <label><input type="radio" name="mode" checked={playMode === "fail-forward"} onChange={() => setPlayMode("fail-forward")} /> Fail-forward</label>
              <label><input type="radio" name="mode" checked={playMode === "canon"} onChange={() => setPlayMode("canon")} /> Canon Mode beta</label>
            </div>
          </fieldset>
          <fieldset className="form-stack">
            <legend>Physical card names</legend>
            <div className="segmented">
              <label><input type="radio" name="cardLanguage" checked={physicalCardLanguage === "both"} onChange={() => setPhysicalCardLanguage("both")} /> English + Spanish</label>
              <label><input type="radio" name="cardLanguage" checked={physicalCardLanguage === "es"} onChange={() => setPhysicalCardLanguage("es")} /> Spanish</label>
              <label><input type="radio" name="cardLanguage" checked={physicalCardLanguage === "en"} onChange={() => setPhysicalCardLanguage("en")} /> English</label>
            </div>
          </fieldset>
          <div className="status-banner">
            Card images are off. Remote image mode is blocked until the legal launch checklist is complete.
          </div>
          <button type="submit" disabled={busy}><Play aria-hidden="true" /> {busy ? "Creating..." : "Create local campaign"}</button>
        </form>
      </ComicPanel>
    </>
  );
}
