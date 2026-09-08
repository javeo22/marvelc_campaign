import type { Aspect, CampaignPhase, IssueResult } from "@/domain/types";

const aspectLabels = {
  aggression: "Aggression",
  justice: "Justice",
  leadership: "Leadership",
  protection: "Protection"
} satisfies Record<Aspect, string>;

const phaseLabels = {
  new: "New",
  preparing: "Preparing",
  "in-progress": "In Progress",
  debrief: "Debrief",
  interlude: "Interlude",
  complete: "Complete",
  mirror: "Mirror Protocol"
} satisfies Record<CampaignPhase, string>;

const resultLabels = {
  win: "Win",
  hero_defeat: "Hero Defeat",
  main_scheme_loss: "Main Scheme Loss",
  other_loss: "Other Loss",
  abandoned: "Abandoned"
} satisfies Record<IssueResult, string>;

const specialWords: Record<string, string> = {
  id: "ID",
  modok: "M.O.D.O.K.",
  shield: "S.H.I.E.L.D.",
  ultron: "Ultron"
};

export function formatAspectLabel(aspect: Aspect | string) {
  return aspect in aspectLabels ? aspectLabels[aspect as Aspect] : formatIdLabel(aspect);
}

export function formatPhaseLabel(phase: CampaignPhase | string) {
  return phase in phaseLabels ? phaseLabels[phase as CampaignPhase] : formatIdLabel(phase);
}

export function formatResultLabel(result: IssueResult | string) {
  return result in resultLabels ? resultLabels[result as IssueResult] : formatIdLabel(result);
}

export function formatIdLabel(id: string) {
  return id
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((word) => {
      const normalized = word.toLowerCase();
      return specialWords[normalized] ?? normalized.charAt(0).toUpperCase() + normalized.slice(1);
    })
    .join(" ");
}
