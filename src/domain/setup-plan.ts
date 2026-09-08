import type {
  CampaignDefinition,
  CampaignSnapshot,
  ComposedSetupAction,
  ComposedSetupPlan,
  SetupAction,
  SetupActionCondition,
  SetupActionPhaseId
} from "./types";
import { getIssue, selectActiveNetworkAdaptations, selectFinalPreparationPoints } from "./selectors";

function conditionApplies(condition: SetupActionCondition, snapshot: CampaignSnapshot): boolean {
  switch (condition.kind) {
    case "always":
      return true;
    case "flag_present":
      return snapshot.flags.includes(condition.flagId);
    case "flag_absent":
      return !snapshot.flags.includes(condition.flagId);
    case "interlude_choice":
      return snapshot.interludeChoices[condition.interludeId] === condition.choiceId;
    case "intel_at_least":
      return snapshot.intel >= condition.value;
    default:
      return false;
  }
}

function because(condition: SetupActionCondition): string {
  switch (condition.kind) {
    case "always":
      return "Always part of this issue.";
    case "flag_present":
      return `Included because ${condition.flagId} is marked.`;
    case "flag_absent":
      return `Included because ${condition.flagId} is not marked.`;
    case "interlude_choice":
      return `Included by ${condition.choiceId} from ${condition.interludeId}.`;
    case "intel_at_least":
      return `Included because Intel is at least ${condition.value}.`;
  }
}

function composeAction(action: SetupAction, sourceText: string, generated = false): ComposedSetupAction {
  return {
    ...action,
    includedBecause: because(action.condition),
    sourceText,
    completed: false,
    generated
  };
}

function generatedAction(
  id: string,
  phase: SetupActionPhaseId,
  text: string,
  kind: string,
  includedBecause: string
): ComposedSetupAction {
  return {
    id,
    phase,
    kind,
    actor: "player",
    text,
    sourceStep: 0,
    condition: { kind: "always" },
    appBehavior: "generated",
    sourceText: "Generated global campaign setup action.",
    includedBecause,
    completed: false,
    generated: true
  };
}

export function composeSetupPlan(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  issueNumber: number
): ComposedSetupPlan {
  const issue = getIssue(definition, issueNumber);
  const phaseById = new Map(definition.setupActionPhases.map((phase) => [phase.id, phase]));
  const actions: ComposedSetupAction[] = [];
  const inGameReminders: ComposedSetupAction[] = [];

  for (const action of issue.setupActions) {
    if (!conditionApplies(action.condition, snapshot)) continue;
    const composed = composeAction(action, issue.setupSteps[action.sourceStep - 1] ?? "");
    if (action.phase === "in-game-reminder" || action.appBehavior === "persistent_reminder") {
      inGameReminders.push(composed);
    } else {
      actions.push(composed);
    }
  }

  actions.push(
    generatedAction(
      "global-normal-scenario-setup",
      "normal-scenario-setup",
      "Complete the physical scenario's normal setup exactly as printed by the game.",
      "physical_normal_setup",
      "Inserted between issue pre-setup and campaign continuity by the global setup order."
    )
  );
  actions.push(
    generatedAction(
      "global-opening-hand",
      "opening-hand",
      "Draw your opening hand and resolve mulligan decisions before any Prepared Ambush encounter card.",
      "opening_hand",
      "Inserted by the global setup order."
    )
  );

  const adaptations = selectActiveNetworkAdaptations(definition, snapshot, issueNumber, 1);
  for (const adaptation of adaptations.active) {
    const phase: SetupActionPhaseId = adaptation.id === "prepared-ambush" ? "opening-hand" : "network-and-final-prep";
    const generated = generatedAction(
      `network-${adaptation.id}`,
      phase,
      adaptation.effect.en,
      "network_adaptation",
      `Network ${snapshot.network} activates ${adaptation.name.en} at threshold ${adaptation.threshold}.`
    );
    if (adaptations.suppressed?.id === adaptation.id) {
      generated.includedBecause = `${generated.includedBecause} Strike the Core suppresses it through round 1.`;
    }
    actions.push(generated);
  }

  if (issueNumber === 15) {
    const points = selectFinalPreparationPoints(definition, snapshot);
    actions.push(
      generatedAction(
        "final-preparation-points",
        "network-and-final-prep",
        `Final Preparation available: ${points} point${points === 1 ? "" : "s"}. Spend after all setup effects.`,
        "final_preparation_summary",
        "Calculated from the four Act III source flags."
      )
    );
  }

  const grouped = definition.setupActionPhases
    .filter((phase) => phase.id !== "in-game-reminder")
    .map((phase) => ({
      phaseId: phase.id,
      label: phase.label,
      order: phase.order,
      actions: actions
        .filter((action) => action.phase === phase.id)
        .sort((a, b) => a.sourceStep - b.sourceStep || a.id.localeCompare(b.id))
    }))
    .filter((group) => group.actions.length > 0)
    .sort((a, b) => a.order - b.order);

  for (const reminder of inGameReminders) {
    const phase = phaseById.get("in-game-reminder");
    reminder.includedBecause = phase ? `${reminder.includedBecause} ${phase.description}` : reminder.includedBecause;
  }

  return {
    issueNumber,
    groups: grouped,
    inGameReminders,
    sourceVerbatimSteps: issue.setupSteps
  };
}
