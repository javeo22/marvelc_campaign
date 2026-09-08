import type { CampaignDefinition, CampaignSnapshot, EndingResult, IssueResult } from "./types";

export function resolveEnding(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  issue15Result: IssueResult
): EndingResult {
  const secretEpilogueEarned =
    definition.heroes.every((hero) => snapshot.masteries.includes(hero.id)) &&
    snapshot.intel >= Number(definition.secretEpilogue.criteria.minimumIntel ?? 15) &&
    snapshot.flags.includes("clean-shutdown");

  if (issue15Result !== "win") {
    return { status: "resolved", endingId: "ghost-in-the-grid", secretEpilogueEarned };
  }
  if (snapshot.network >= 7) {
    return { status: "resolved", endingId: "pyrrhic-shutdown", secretEpilogueEarned };
  }
  if (snapshot.network >= 4) {
    return { status: "resolved", endingId: "machine-broken", secretEpilogueEarned };
  }
  if (snapshot.network <= 3 && snapshot.masteries.length >= 4) {
    return { status: "resolved", endingId: "avengers-assemble", secretEpilogueEarned };
  }
  return {
    status: "needs_author_decision",
    reason: definition.unresolvedEndingState.reason
  };
}
