"use client";

import { Award, Scale, ShieldCheck, Swords, UsersRound } from "lucide-react";
import { ComicHeader, ComicPanel, EmptyState, ErrorPanel } from "@/components/comic/ComicPrimitives";
import { campaignDefinition } from "@/domain/content";
import { selectAspectPassport } from "@/domain/selectors";
import { ASPECTS, type Aspect } from "@/domain/types";
import { ScarChip } from "./CampaignBits";
import { useCampaignSave } from "./useCampaignSave";

const aspectIcons = {
  aggression: Swords,
  justice: Scale,
  leadership: UsersRound,
  protection: ShieldCheck
} satisfies Record<Aspect, typeof Swords>;

export function PassportView({ saveId }: { saveId: string }) {
  const { save, loading, error, reload } = useCampaignSave(saveId);
  if (loading) return <ComicPanel><p>Loading passport...</p></ComicPanel>;
  if (error) return <ErrorPanel title="Could not load passport"><p>{error}</p><button type="button" onClick={() => void reload()}>Retry</button></ErrorPanel>;
  if (!save) return <EmptyState title="Save not found"><p>Open a valid local campaign save.</p></EmptyState>;

  const rows = selectAspectPassport(campaignDefinition, save.snapshot);
  return (
    <>
      <ComicHeader
        eyebrow="Hero passport"
        title="Aspect stamps"
        subtitle="Each story hero appearance uses a distinct aspect. The first Mirror game uses the fourth unused aspect."
      />
      <div className="form-stack">
        {rows.map((row) => (
          <ComicPanel className="passport-card" key={row.hero.id}>
            <div className="passport-card__header">
              <div className="hero-seal" aria-hidden="true">
                {row.hero.name.en.split(" ").map((part) => part[0]).join("").slice(0, 2)}
              </div>
              <div>
                <h2>{row.hero.name.en}</h2>
                <p className="small">Story route: {row.appearances.map((issue) => `Issue ${issue.number} ${issue.recommendedAspect}`).join(" · ")}</p>
              </div>
              <ScarChip count={row.scars} />
              <span className="mastery-badge" data-earned={row.masteryEarned}>
                <Award aria-hidden="true" />
                {row.masteryEarned ? "Mastery earned" : "Mastery open"}
              </span>
            </div>
            <div className="stamp-grid">
              {ASPECTS.map((aspect) => {
                const stamped = row.allStamped.includes(aspect);
                const firstMirror = row.firstMirrorRequired === aspect && !row.mirrorAspects.length;
                const Icon = aspectIcons[aspect];
                return (
                  <span
                    className="passport-stamp"
                    data-aspect={aspect}
                    data-status={stamped ? "stamped" : firstMirror ? "mirror" : "open"}
                    key={aspect}
                    aria-label={`${aspect}: ${stamped ? "stamped" : firstMirror ? "first Mirror required" : "open"}`}
                  >
                    <Icon aria-hidden="true" />
                    <strong>{aspect}</strong>
                    <small>{stamped ? "Stamped" : firstMirror ? "Mirror" : "Open"}</small>
                  </span>
                );
              })}
            </div>
          </ComicPanel>
        ))}
      </div>
    </>
  );
}
