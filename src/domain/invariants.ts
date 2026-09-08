import type { CampaignDefinition, CampaignSnapshot } from "./types";
import { err, ok, type Result } from "./result";

export function assertInvariants(definition: CampaignDefinition, snapshot: CampaignSnapshot): Result<CampaignSnapshot> {
  if (snapshot.intel < definition.progression.intel.minimum) {
    return err("INVALID_EVENT", "Intel cannot fall below zero.");
  }
  if (snapshot.network < definition.progression.network.minimum) {
    return err("INVALID_EVENT", "Network cannot fall below zero.");
  }

  const heroIds = new Set(definition.heroes.map((hero) => hero.id));
  for (const [heroId, scars] of Object.entries(snapshot.scars)) {
    if (!heroIds.has(heroId) || scars < 0 || scars > definition.progression.scars.maximumPerHero) {
      return err("INVALID_EVENT", `Scar value for ${heroId} is outside the campaign limit.`);
    }
  }

  if (new Set(snapshot.flags).size !== snapshot.flags.length) {
    return err("DUPLICATE_REWARD", "A campaign flag was awarded more than once.");
  }
  if (new Set(snapshot.masteries).size !== snapshot.masteries.length) {
    return err("DUPLICATE_REWARD", "A hero Mastery was awarded more than once.");
  }
  for (const [heroId, aspects] of Object.entries(snapshot.usedAspects)) {
    if (!heroIds.has(heroId) || new Set(aspects).size !== aspects.length || aspects.length > 3) {
      return err("ILLEGAL_ASPECT", `Main-story Aspect Passport is invalid for ${heroId}.`);
    }
  }

  if (snapshot.currentIssueNumber !== null && (snapshot.currentIssueNumber < 1 || snapshot.currentIssueNumber > 15)) {
    return err("INVALID_PHASE", "Current story issue must be between 1 and 15.");
  }
  return ok(snapshot);
}
