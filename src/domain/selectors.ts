import type {
  Aspect,
  CampaignDefinition,
  CampaignSnapshot,
  FieldAssetDefinition,
  HeroDefinition,
  IssueDefinition,
  IssueResult,
  NetworkAdaptation
} from "./types";
import { err, ok, type Result } from "./result";

export function getIssue(definition: CampaignDefinition, issueNumber: number): IssueDefinition {
  const issue = definition.issues.find((candidate) => candidate.number === issueNumber);
  if (!issue) throw new Error(`Unknown issue ${issueNumber}`);
  return issue;
}

export function getHero(definition: CampaignDefinition, heroId: string): HeroDefinition {
  const hero = definition.heroes.find((candidate) => candidate.id === heroId);
  if (!hero) throw new Error(`Unknown hero ${heroId}`);
  return hero;
}

export function getCurrentIssue(definition: CampaignDefinition, snapshot: CampaignSnapshot): IssueDefinition | null {
  return snapshot.currentIssueNumber ? getIssue(definition, snapshot.currentIssueNumber) : null;
}

export function getIssueFlagIdBySourceFlag(definition: CampaignDefinition, sourceFlag: string): string | null {
  return definition.issues.find((issue) => issue.objective.flag === sourceFlag)?.objective.flagId ?? null;
}

export function selectStoryCompletionPercent(snapshot: CampaignSnapshot): number {
  const advancedIssues = new Set(snapshot.issueResults.filter((result) => result.advancedCampaign).map((result) => result.issueNumber));
  return Math.round((advancedIssues.size / 15) * 100);
}

export function selectUnlockedAssets(definition: CampaignDefinition, snapshot: CampaignSnapshot): FieldAssetDefinition[] {
  return definition.fieldAssets.assets.filter((asset) => snapshot.intel >= asset.unlockIntel);
}

export function selectNormalFieldAssetLimit(definition: CampaignDefinition, snapshot: CampaignSnapshot): number {
  const rule = definition.fieldAssets.selectionRule;
  return snapshot.network >= rule.networkAtLeast ? rule.elevatedLimit : rule.defaultLimit;
}

export function selectEndgameProtocolAvailable(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  issueNumber: number
): boolean {
  return issueNumber === 15 && snapshot.intel >= 15 && definition.fieldAssets.assets.some((asset) => asset.id === "endgame-protocol");
}

export function validateFieldAssetSelection(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  issueNumber: number,
  assetIds: string[]
): Result<string[]> {
  const unique = Array.from(new Set(assetIds));
  if (unique.length !== assetIds.length) {
    return err("INVALID_EVENT", "Field Asset selections must be unique.");
  }

  const allAssets = new Map(definition.fieldAssets.assets.map((asset) => [asset.id, asset]));
  const unlocked = new Set(selectUnlockedAssets(definition, snapshot).map((asset) => asset.id));
  const normalIds: string[] = [];

  for (const assetId of unique) {
    const asset = allAssets.get(assetId);
    if (!asset || !unlocked.has(assetId)) {
      return err("ASSET_LOCKED", `Field Asset ${assetId} is not unlocked.`);
    }
    if (asset.special === "issue-15-only") {
      if (asset.id !== "endgame-protocol" || !selectEndgameProtocolAvailable(definition, snapshot, issueNumber)) {
        return err("ASSET_LOCKED", "Endgame Protocol is legal only in Issue 15 at 15+ Intel.");
      }
    } else {
      normalIds.push(assetId);
    }
  }

  const limit = selectNormalFieldAssetLimit(definition, snapshot);
  if (normalIds.length > limit) {
    return err("ASSET_LIMIT_EXCEEDED", `Only ${limit} normal Field Asset slot(s) are available.`);
  }

  return ok(unique);
}

export function selectActiveNetworkAdaptations(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  issueNumber: number,
  round = snapshot.activeSession?.round ?? 1
): { active: NetworkAdaptation[]; suppressed: NetworkAdaptation | null; visible: NetworkAdaptation[] } {
  const active = definition.networkAdaptations
    .filter((adaptation) => adaptation.threshold <= snapshot.network)
    .sort((a, b) => a.threshold - b.threshold);
  const strikeTheCore =
    issueNumber === 15 && snapshot.interludeChoices["act-2-assault"] === "strike-the-core" && round <= 1;
  if (!strikeTheCore || active.length === 0) {
    return { active, suppressed: null, visible: active };
  }
  const suppressed = active[active.length - 1] ?? null;
  return {
    active,
    suppressed,
    visible: active.filter((adaptation) => adaptation.id !== suppressed?.id)
  };
}

export function canSelectStoryAspect(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  issueNumber: number,
  aspect: Aspect
): Result<true> {
  const issue = getIssue(definition, issueNumber);
  if (!definition.aspects.includes(aspect)) {
    return err("ILLEGAL_ASPECT", `${aspect} is not a campaign aspect.`);
  }
  const used = snapshot.usedAspects[issue.heroId] ?? [];
  if (used.includes(aspect)) {
    return err("ILLEGAL_ASPECT", `${issue.heroName.en} already used ${aspect} in the main story.`);
  }
  return ok(true);
}

export function selectFirstMirrorAspect(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  heroId: string
): Aspect {
  const hero = getHero(definition, heroId);
  const used = new Set(snapshot.usedAspects[heroId] ?? []);
  return (definition.aspects.find((aspect) => !used.has(aspect)) ?? hero.recommendedAspectRoute.firstMirror) as Aspect;
}

export function canSelectMirrorAspect(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  mirrorNumber: number,
  aspect: Aspect
): Result<true> {
  const mirror = definition.mirrorProtocol.rows.find((row) => row.number === mirrorNumber);
  if (!mirror) return err("INVALID_EVENT", `Unknown Mirror Protocol row ${mirrorNumber}.`);
  if (!definition.aspects.includes(aspect)) return err("ILLEGAL_ASPECT", `${aspect} is not a campaign aspect.`);

  const heroAlreadyMirrored = snapshot.mirrorResults.some((result) => {
    const row = definition.mirrorProtocol.rows.find((candidate) => candidate.number === result.mirrorNumber);
    return row?.heroId === mirror.heroId;
  });
  if (!heroAlreadyMirrored) {
    const required = selectFirstMirrorAspect(definition, snapshot, mirror.heroId);
    if (aspect !== required) {
      return err("ILLEGAL_ASPECT", `The first Mirror game for ${mirror.heroName.en} must use ${required}.`);
    }
  }
  return ok(true);
}

export function selectAspectPassport(definition: CampaignDefinition, snapshot: CampaignSnapshot) {
  return definition.heroes.map((hero) => {
    const storyAspects = snapshot.usedAspects[hero.id] ?? [];
    const mirrorAspects = snapshot.mirrorResults
      .filter((result) => definition.mirrorProtocol.rows.find((row) => row.number === result.mirrorNumber)?.heroId === hero.id)
      .map((result) => result.aspect);
    const allStamped = Array.from(new Set([...storyAspects, ...mirrorAspects])) as Aspect[];
    return {
      hero,
      storyAspects,
      mirrorAspects,
      allStamped,
      firstMirrorRequired: selectFirstMirrorAspect(definition, snapshot, hero.id),
      scars: snapshot.scars[hero.id] ?? 0,
      masteryEarned: snapshot.masteries.includes(hero.id),
      appearances: definition.issues.filter((issue) => issue.heroId === hero.id)
    };
  });
}

export function selectFinalPreparationPoints(definition: CampaignDefinition, snapshot: CampaignSnapshot): number {
  return definition.finalPreparation.sourceFlags.reduce((total, sourceFlag) => {
    const flagId = getIssueFlagIdBySourceFlag(definition, sourceFlag);
    return total + (flagId && snapshot.flags.includes(flagId) ? definition.finalPreparation.pointsPerFlag : 0);
  }, 0);
}

export function selectFinalPreparationRemaining(definition: CampaignDefinition, snapshot: CampaignSnapshot): number {
  return selectFinalPreparationPoints(definition, snapshot) - snapshot.finalPreparationSpends.length;
}

export function selectActRecoveryPreview(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  actId: "act-1" | "act-2"
) {
  const act = definition.acts.find((candidate) => candidate.id === actId);
  const interlude = definition.interludes.find((candidate) => candidate.actRecovery.actId === actId);
  if (!act || !interlude) throw new Error(`Unknown recovery act ${actId}`);
  const [firstIssue, lastIssue] = act.issueRange;
  const actIssues = definition.issues.filter((issue) => issue.number >= firstIssue && issue.number <= lastIssue);
  const objectiveCount = actIssues.filter((issue) => snapshot.flags.includes(issue.objective.flagId)).length;
  const wonIssueNumbers = new Set(
    snapshot.issueResults
      .filter((result) => result.issueNumber >= firstIssue && result.issueNumber <= lastIssue && result.result === "win")
      .map((result) => result.issueNumber)
  );
  const objectiveReduction =
    objectiveCount >= interlude.actRecovery.objectiveThreshold ? interlude.actRecovery.networkReductionEach : 0;
  const lowWinReduction =
    wonIssueNumbers.size <= interlude.actRecovery.lowWinThreshold ? interlude.actRecovery.networkReductionEach : 0;
  const totalReduction = objectiveReduction + lowWinReduction;
  return {
    act,
    interlude,
    objectiveCount,
    wonIssueCount: wonIssueNumbers.size,
    objectiveReduction,
    lowWinReduction,
    totalReduction,
    networkBefore: snapshot.network,
    networkAfter: Math.max(interlude.actRecovery.minimumNetwork, snapshot.network - totalReduction),
    alreadyApplied: snapshot.appliedRecoveries.includes(actId)
  };
}

export function selectNextTransition(definition: CampaignDefinition, snapshot: CampaignSnapshot) {
  if (snapshot.phase === "interlude") {
    const pending = definition.interludes.find((interlude) => !snapshot.interludeChoices[interlude.id]);
    if (pending) return { kind: "interlude" as const, interludeId: pending.id };
  }
  if (snapshot.currentIssueNumber) {
    return { kind: "issue" as const, issueNumber: snapshot.currentIssueNumber };
  }
  if (snapshot.finalEndingId || snapshot.phase === "complete") {
    return { kind: "finale" as const };
  }
  return { kind: "library" as const };
}

export function selectCompletionGrid(definition: CampaignDefinition, snapshot: CampaignSnapshot) {
  const pairs = new Map<string, { heroId: string; villainId: string; standard: boolean; expert: boolean }>();
  for (const issue of definition.issues) {
    const key = `${issue.heroId}:${issue.villainId}`;
    if (!pairs.has(key)) pairs.set(key, { heroId: issue.heroId, villainId: issue.villainId, standard: false, expert: false });
    const winningResult = snapshot.issueResults.some(
      (result) => result.issueNumber === issue.number && result.result === "win"
    );
    if (winningResult && issue.tierId === "standard") pairs.get(key)!.standard = true;
    if (winningResult && issue.tierId === "expert") pairs.get(key)!.expert = true;
  }
  for (const result of snapshot.mirrorResults) {
    const row = definition.mirrorProtocol.rows.find((candidate) => candidate.number === result.mirrorNumber);
    if (!row || result.result !== "win") continue;
    const key = `${row.heroId}:${row.villainId}`;
    if (!pairs.has(key)) pairs.set(key, { heroId: row.heroId, villainId: row.villainId, standard: false, expert: false });
    pairs.get(key)![row.mode] = true;
  }
  return Array.from(pairs.values()).sort((a, b) => `${a.heroId}:${a.villainId}`.localeCompare(`${b.heroId}:${b.villainId}`));
}

export function selectPerfectCore(definition: CampaignDefinition, snapshot: CampaignSnapshot): boolean {
  const grid = selectCompletionGrid(definition, snapshot);
  const allOfficialClears = grid.length === 15 && grid.every((row) => row.standard && row.expert);
  const passportComplete = definition.heroes.every((hero) => {
    const stamped = new Set([
      ...(snapshot.usedAspects[hero.id] ?? []),
      ...snapshot.mirrorResults
        .filter((result) => definition.mirrorProtocol.rows.find((row) => row.number === result.mirrorNumber)?.heroId === hero.id)
        .map((result) => result.aspect)
    ]);
    return definition.aspects.every((aspect) => stamped.has(aspect));
  });
  return allOfficialClears && passportComplete && definition.heroes.every((hero) => snapshot.masteries.includes(hero.id));
}

export function selectDebriefPreview(
  definition: CampaignDefinition,
  snapshot: CampaignSnapshot,
  result: IssueResult,
  objectiveCompleted: boolean,
  masteryEarned: boolean
) {
  if (!snapshot.activeSession) throw new Error("No active session for debrief preview.");
  const issue = getIssue(definition, snapshot.activeSession.issueNumber);
  const priorObjective = snapshot.flags.includes(issue.objective.flagId) || snapshot.activeSession.objectiveCompleted;
  const priorMastery = snapshot.masteries.includes(issue.heroId) || snapshot.activeSession.masteryEarnedThisSession;
  const objectiveAward =
    objectiveCompleted && !priorObjective && (!issue.objective.winGated || result === "win")
      ? definition.progression.intel.deltas.optionalObjective
      : 0;
  const masteryAward = masteryEarned && !priorMastery ? definition.progression.intel.deltas.firstHeroMastery : 0;
  const winAward = result === "win" ? definition.progression.intel.deltas.issueWin : 0;
  const networkDelta =
    result === "hero_defeat"
      ? definition.progression.network.deltas.heroDefeat
      : result === "main_scheme_loss"
        ? definition.progression.network.deltas.mainSchemeLoss
        : 0;
  const currentScars = snapshot.scars[issue.heroId] ?? 0;
  const scarAfter =
    result === "win"
      ? Math.max(0, currentScars - 1)
      : result === "hero_defeat"
        ? Math.min(definition.progression.scars.maximumPerHero, currentScars + 1)
        : currentScars;

  return {
    issue,
    priorObjective,
    priorMastery,
    objectiveAward,
    masteryAward,
    winAward,
    networkDelta,
    intelBefore: snapshot.intel,
    intelAfter: snapshot.intel + objectiveAward + masteryAward + winAward,
    networkBefore: snapshot.network,
    networkAfter: snapshot.network + networkDelta,
    scarBefore: currentScars,
    scarAfter,
    nextIssueNumber:
      result === "win" || snapshot.playMode === "fail-forward"
        ? issue.number < 15
          ? issue.number + 1
          : null
        : issue.number
  };
}
