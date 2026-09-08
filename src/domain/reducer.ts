import { resolveEnding } from "./ending-resolver";
import { assertInvariants } from "./invariants";
import { initialObjectiveState } from "./objective-machine";
import { err, ok, type DomainError, type Result } from "./result";
import {
  canSelectMirrorAspect,
  canSelectStoryAspect,
  getIssue,
  selectActRecoveryPreview,
  selectFinalPreparationRemaining,
  validateFieldAssetSelection
} from "./selectors";
import type {
  Aspect,
  CampaignDefinition,
  CampaignEvent,
  CampaignSnapshot,
  FinalPreparationDefinition,
  IssueResult,
  PlayMode
} from "./types";

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createInitialSnapshot(
  definition: CampaignDefinition,
  playMode: PlayMode = "fail-forward"
): CampaignSnapshot {
  const scars = Object.fromEntries(definition.heroes.map((hero) => [hero.id, definition.progression.scars.initialPerHero]));
  const usedAspects = Object.fromEntries(definition.heroes.map((hero) => [hero.id, [] as Aspect[]]));
  return {
    sequence: 0,
    playMode,
    phase: "new",
    currentIssueNumber: 1,
    intel: definition.progression.intel.initial,
    network: definition.progression.network.initial,
    scars,
    flags: [],
    masteries: [],
    usedAspects,
    interludeChoices: {},
    activeSession: null,
    preparation: null,
    issueResults: [],
    mirrorResults: [],
    finalPreparationSpends: [],
    appliedRecoveries: [],
    manualCorrections: [],
    finalEndingId: null,
    secretEpilogueEarned: false
  };
}

function stringPayload(event: CampaignEvent, key: string): string | null {
  const value = event.payload[key];
  return typeof value === "string" ? value : null;
}

function numberPayload(event: CampaignEvent, key: string): number | null {
  const value = event.payload[key];
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function booleanPayload(event: CampaignEvent, key: string): boolean | null {
  const value = event.payload[key];
  return typeof value === "boolean" ? value : null;
}

function stringArrayPayload(event: CampaignEvent, key: string): string[] {
  const value = event.payload[key];
  return Array.isArray(value) && value.every((item) => typeof item === "string") ? value : [];
}

function requireIssuePayload(event: CampaignEvent): Result<number> {
  const issueNumber = numberPayload(event, "issueNumber");
  return issueNumber ? ok(issueNumber) : err("INVALID_EVENT", `${event.type} requires an issueNumber.`);
}

function addFlag(state: CampaignSnapshot, flagId: string, intelDelta: number): boolean {
  if (state.flags.includes(flagId)) return false;
  state.flags.push(flagId);
  state.intel += intelDelta;
  return true;
}

function addMastery(state: CampaignSnapshot, heroId: string, intelDelta: number): boolean {
  if (state.masteries.includes(heroId)) return false;
  state.masteries.push(heroId);
  state.intel += intelDelta;
  return true;
}

function commitStoryAspect(state: CampaignSnapshot, heroId: string, aspect: Aspect) {
  const used = state.usedAspects[heroId] ?? [];
  if (!used.includes(aspect)) {
    state.usedAspects[heroId] = [...used, aspect];
  }
}

function setSequence<T extends CampaignSnapshot>(state: T, event: CampaignEvent): T {
  state.sequence = event.sequence;
  return state;
}

function finalPreparationOptionIsValid(definition: CampaignDefinition, optionId: string): optionId is FinalPreparationDefinition["spendOptions"][number]["id"] {
  return definition.finalPreparation.spendOptions.some((option) => option.id === optionId);
}

export function reduceCampaign(
  definition: CampaignDefinition,
  previous: CampaignSnapshot,
  event: CampaignEvent
): Result<CampaignSnapshot> {
  if (event.sequence !== previous.sequence + 1) {
    return err("OUT_OF_ORDER_EVENT", `Expected event sequence ${previous.sequence + 1}, received ${event.sequence}.`, {
      expected: previous.sequence + 1,
      received: event.sequence
    });
  }

  const state = clone(previous);
  const warnings: DomainError[] = [];

  switch (event.type) {
    case "CAMPAIGN_CREATED": {
      if (previous.sequence !== 0) return err("INVALID_PHASE", "Campaign can only be created once.");
      const playMode = stringPayload(event, "playMode");
      if (playMode !== "fail-forward" && playMode !== "canon") {
        return err("INVALID_EVENT", "CAMPAIGN_CREATED requires playMode fail-forward or canon.");
      }
      const created = createInitialSnapshot(definition, playMode);
      return ok(setSequence(created, event));
    }

    case "ISSUE_PREPARATION_STARTED": {
      const issueNumberResult = requireIssuePayload(event);
      if (!issueNumberResult.ok) return issueNumberResult;
      const issueNumber = issueNumberResult.value;
      if (state.currentIssueNumber !== issueNumber) {
        return err("INVALID_PHASE", `Issue ${issueNumber} is not the current story issue.`);
      }
      state.phase = "preparing";
      state.preparation = {
        issueNumber,
        aspect: null,
        selectedFieldAssetIds: [],
        setupStepIds: []
      };
      break;
    }

    case "ASPECT_SELECTED": {
      const issueNumberResult = requireIssuePayload(event);
      if (!issueNumberResult.ok) return issueNumberResult;
      const issueNumber = issueNumberResult.value;
      const aspect = stringPayload(event, "aspect") as Aspect | null;
      if (!aspect) return err("INVALID_EVENT", "ASPECT_SELECTED requires an aspect.");
      const aspectResult = canSelectStoryAspect(definition, state, issueNumber, aspect);
      if (!aspectResult.ok) return aspectResult;
      if (state.phase !== "preparing" || state.preparation?.issueNumber !== issueNumber) {
        state.phase = "preparing";
        state.preparation = { issueNumber, aspect: null, selectedFieldAssetIds: [], setupStepIds: [] };
      }
      state.preparation.aspect = aspect;
      break;
    }

    case "FIELD_ASSET_EQUIPPED": {
      const issueNumberResult = requireIssuePayload(event);
      if (!issueNumberResult.ok) return issueNumberResult;
      const issueNumber = issueNumberResult.value;
      const assetIds = stringArrayPayload(event, "assetIds");
      const selection = validateFieldAssetSelection(definition, state, issueNumber, assetIds);
      if (!selection.ok) return selection;
      if (state.phase !== "preparing" || state.preparation?.issueNumber !== issueNumber) {
        state.phase = "preparing";
        state.preparation = { issueNumber, aspect: null, selectedFieldAssetIds: [], setupStepIds: [] };
      }
      state.preparation.selectedFieldAssetIds = selection.value;
      break;
    }

    case "FINAL_PREP_SPENT": {
      const optionId = stringPayload(event, "optionId");
      if (state.currentIssueNumber !== 15 || !optionId || !finalPreparationOptionIsValid(definition, optionId)) {
        return err("INVALID_PHASE", "Final Preparation can only be spent during Issue 15 setup.");
      }
      if (selectFinalPreparationRemaining(definition, state) <= 0) {
        return err("FINAL_PREP_OVESPEND", "Final Preparation cannot be spent beyond earned points.");
      }
      state.finalPreparationSpends.push({ eventId: event.eventId, optionId, spentAt: event.occurredAt });
      break;
    }

    case "ISSUE_STARTED": {
      const issueNumberResult = requireIssuePayload(event);
      if (!issueNumberResult.ok) return issueNumberResult;
      const issueNumber = issueNumberResult.value;
      if (state.currentIssueNumber !== issueNumber) {
        return err("INVALID_PHASE", `Issue ${issueNumber} is not the current story issue.`);
      }
      const issue = getIssue(definition, issueNumber);
      const aspect = (stringPayload(event, "aspect") ?? state.preparation?.aspect) as Aspect | null;
      if (!aspect) return err("INVALID_EVENT", "ISSUE_STARTED requires an aspect.");
      const aspectResult = canSelectStoryAspect(definition, state, issueNumber, aspect);
      if (!aspectResult.ok) return aspectResult;
      const selectedFieldAssetIds =
        stringArrayPayload(event, "selectedFieldAssetIds").length > 0
          ? stringArrayPayload(event, "selectedFieldAssetIds")
          : state.preparation?.selectedFieldAssetIds ?? [];
      const selection = validateFieldAssetSelection(definition, state, issueNumber, selectedFieldAssetIds);
      if (!selection.ok) return selection;
      const objectiveState = initialObjectiveState(issue.objective.tracker);
      state.phase = "in-progress";
      state.preparation = null;
      state.activeSession = {
        issueNumber,
        startedAt: event.occurredAt,
        aspect,
        selectedFieldAssetIds: selection.value,
        usedFieldAssetIds: [],
        round: 1,
        villainStage: issue.villainStages[0],
        objectiveCounters: objectiveState.objectiveCounters,
        objectiveChecks: objectiveState.objectiveChecks,
        distinctObjectiveNames: objectiveState.distinctObjectiveNames,
        objectiveCompleted: false,
        masteryEarnedThisSession: false,
        notes: [],
        undoCursor: event.sequence
      };
      break;
    }

    case "ROUND_CHANGED": {
      if (!state.activeSession) return err("INVALID_PHASE", "No active session is available for round changes.");
      const value = numberPayload(event, "value");
      const delta = numberPayload(event, "delta");
      state.activeSession.round = Math.max(1, value ?? state.activeSession.round + (delta ?? 0));
      break;
    }

    case "COUNTER_CHANGED": {
      if (!state.activeSession) return err("INVALID_PHASE", "No active session is available for counter changes.");
      const counterId = stringPayload(event, "counterId");
      const value = numberPayload(event, "value");
      if (!counterId || value === null || value < 0) return err("INVALID_EVENT", "COUNTER_CHANGED requires a non-negative value.");
      state.activeSession.objectiveCounters[counterId] = value;
      break;
    }

    case "CHECKLIST_CHANGED": {
      if (!state.activeSession) return err("INVALID_PHASE", "No active session is available for checklist changes.");
      const checkId = stringPayload(event, "checkId");
      const value = booleanPayload(event, "value");
      if (!checkId || value === null) return err("INVALID_EVENT", "CHECKLIST_CHANGED requires a checkId and boolean value.");
      state.activeSession.objectiveChecks[checkId] = value;
      break;
    }

    case "FIELD_ASSET_USED": {
      if (!state.activeSession) return err("INVALID_PHASE", "No active session is available for Field Asset use.");
      const assetId = stringPayload(event, "assetId");
      const used = booleanPayload(event, "used") ?? true;
      if (!assetId || !state.activeSession.selectedFieldAssetIds.includes(assetId)) {
        return err("ASSET_LOCKED", "Only equipped Field Assets can be marked used.");
      }
      const usedSet = new Set(state.activeSession.usedFieldAssetIds);
      if (used) usedSet.add(assetId);
      else usedSet.delete(assetId);
      state.activeSession.usedFieldAssetIds = Array.from(usedSet);
      break;
    }

    case "OBJECTIVE_COMPLETED": {
      const issueNumberResult = requireIssuePayload(event);
      if (!issueNumberResult.ok) return issueNumberResult;
      const issue = getIssue(definition, issueNumberResult.value);
      if (issue.objective.winGated) {
        return err("INVALID_EVENT", "Win-gated objectives can only be finalized during debrief.");
      }
      if (!addFlag(state, issue.objective.flagId, definition.progression.intel.deltas.optionalObjective)) {
        warnings.push({ code: "DUPLICATE_REWARD", message: `${issue.objective.flag} was already recorded.`, event });
      }
      if (state.activeSession?.issueNumber === issue.number) {
        state.activeSession.objectiveCompleted = true;
      }
      break;
    }

    case "MASTERY_EARNED": {
      const heroId = stringPayload(event, "heroId");
      if (!heroId || !definition.heroes.some((hero) => hero.id === heroId)) {
        return err("INVALID_EVENT", "MASTERY_EARNED requires a known heroId.");
      }
      if (!addMastery(state, heroId, definition.progression.intel.deltas.firstHeroMastery)) {
        warnings.push({ code: "DUPLICATE_REWARD", message: `${heroId} Mastery was already recorded.`, event });
      }
      const activeIssue = state.activeSession ? getIssue(definition, state.activeSession.issueNumber) : null;
      if (activeIssue?.heroId === heroId && state.activeSession) {
        state.activeSession.masteryEarnedThisSession = true;
      }
      break;
    }

    case "NOTE_ADDED": {
      if (!state.activeSession) return err("INVALID_PHASE", "No active session is available for notes.");
      const text = stringPayload(event, "text");
      if (!text || text.length > 2000) return err("INVALID_EVENT", "NOTE_ADDED requires text no longer than 2000 characters.");
      state.activeSession.notes.push(text);
      break;
    }

    case "ISSUE_COMPLETED": {
      if (!state.activeSession) return err("INVALID_PHASE", "No active issue session is available to complete.");
      const issueNumber = numberPayload(event, "issueNumber");
      const result = stringPayload(event, "result") as IssueResult | null;
      if (!issueNumber || state.activeSession.issueNumber !== issueNumber || !result) {
        return err("INVALID_EVENT", "ISSUE_COMPLETED requires the active issue number and result.");
      }
      const issue = getIssue(definition, issueNumber);
      const objectiveCompleted = booleanPayload(event, "objectiveCompleted") ?? state.activeSession.objectiveCompleted;
      const masteryEarned = booleanPayload(event, "masteryEarned") ?? state.activeSession.masteryEarnedThisSession;
      const attemptId = stringPayload(event, "attemptId") ?? event.eventId;
      const notes = stringPayload(event, "notes") ?? undefined;

      if (objectiveCompleted && (!issue.objective.winGated || result === "win")) {
        addFlag(state, issue.objective.flagId, definition.progression.intel.deltas.optionalObjective);
      }
      if (masteryEarned) {
        addMastery(state, issue.heroId, definition.progression.intel.deltas.firstHeroMastery);
      }
      if (result === "win") {
        state.intel += definition.progression.intel.deltas.issueWin;
        state.scars[issue.heroId] = Math.max(0, (state.scars[issue.heroId] ?? 0) + definition.progression.scars.onHeroWin);
      } else if (result === "hero_defeat") {
        state.network += definition.progression.network.deltas.heroDefeat;
        state.scars[issue.heroId] = Math.min(
          definition.progression.scars.maximumPerHero,
          (state.scars[issue.heroId] ?? 0) + definition.progression.scars.onHeroDefeat
        );
      } else if (result === "main_scheme_loss") {
        state.network += definition.progression.network.deltas.mainSchemeLoss;
      }

      const advancedCampaign = result === "win" || state.playMode === "fail-forward";
      if (advancedCampaign) {
        commitStoryAspect(state, issue.heroId, state.activeSession.aspect);
      }

      const record = {
        attemptId,
        issueNumber,
        result,
        aspect: state.activeSession.aspect,
        completedAt: event.occurredAt,
        objectiveCompleted: state.flags.includes(issue.objective.flagId),
        masteryEarned: state.masteries.includes(issue.heroId),
        advancedCampaign,
        intelAfter: state.intel,
        networkAfter: state.network,
        heroScarsAfter: state.scars[issue.heroId] ?? 0,
        ...(notes ? { notes } : {})
      };
      state.issueResults.push(record);
      state.activeSession = null;
      state.preparation = null;

      if (issueNumber === 15 && advancedCampaign) {
        const ending = resolveEnding(definition, state, result);
        state.phase = "complete";
        state.currentIssueNumber = null;
        if (ending.status === "resolved") {
          state.finalEndingId = ending.endingId;
          state.secretEpilogueEarned = ending.secretEpilogueEarned;
        } else {
          state.finalEndingId = null;
          state.secretEpilogueEarned = false;
          warnings.push({ code: "UNRESOLVED_ENDING", message: ending.reason, event });
        }
      } else if (advancedCampaign) {
        state.currentIssueNumber = issueNumber + 1;
        state.phase = issueNumber === 5 || issueNumber === 10 ? "interlude" : "new";
      } else {
        state.currentIssueNumber = issueNumber;
        state.phase = "new";
      }
      break;
    }

    case "INTERLUDE_CHOICE_MADE": {
      const interludeId = stringPayload(event, "interludeId");
      const choiceId = stringPayload(event, "choiceId");
      const interlude = definition.interludes.find((candidate) => candidate.id === interludeId);
      if (!interlude || !choiceId || !interlude.choices.some((choice) => choice.id === choiceId)) {
        return err("INVALID_EVENT", "Unknown Interlude choice.");
      }
      if (state.interludeChoices[interlude.id]) {
        return err("INVALID_EVENT", "An Interlude accepts exactly one choice.");
      }
      const afterIssueAdvanced = state.issueResults.some(
        (result) => result.issueNumber === interlude.afterIssue && result.advancedCampaign
      );
      if (!afterIssueAdvanced) return err("INVALID_PHASE", "Interlude is not available yet.");
      state.interludeChoices[interlude.id] = choiceId;
      state.phase = "interlude";
      break;
    }

    case "ACT_RECOVERY_APPLIED": {
      const actId = stringPayload(event, "actId") as "act-1" | "act-2" | null;
      if (actId !== "act-1" && actId !== "act-2") {
        return err("INVALID_EVENT", "ACT_RECOVERY_APPLIED requires act-1 or act-2.");
      }
      if (state.appliedRecoveries.includes(actId)) {
        return err("RECOVERY_ALREADY_APPLIED", `Recovery for ${actId} has already been applied.`);
      }
      const preview = selectActRecoveryPreview(definition, state, actId);
      state.network = preview.networkAfter;
      state.appliedRecoveries.push(actId);
      state.phase = "new";
      state.currentIssueNumber = preview.interlude.afterIssue + 1;
      break;
    }

    case "MIRROR_STARTED": {
      state.phase = "mirror";
      state.currentIssueNumber = null;
      state.intel = definition.progression.intel.initial;
      state.network = definition.progression.network.initial;
      state.scars = Object.fromEntries(definition.heroes.map((hero) => [hero.id, definition.progression.scars.initialPerHero]));
      state.flags = [];
      state.activeSession = null;
      state.preparation = null;
      state.finalPreparationSpends = [];
      state.appliedRecoveries = [];
      break;
    }

    case "MIRROR_COMPLETED": {
      const mirrorNumber = numberPayload(event, "mirrorNumber");
      const result = stringPayload(event, "result") as IssueResult | null;
      const aspect = stringPayload(event, "aspect") as Aspect | null;
      if (!mirrorNumber || !result || !aspect) {
        return err("INVALID_EVENT", "MIRROR_COMPLETED requires mirrorNumber, result, and aspect.");
      }
      if (state.phase !== "mirror") return err("INVALID_PHASE", "Mirror Protocol must be started before mirror results.");
      if (state.mirrorResults.some((record) => record.mirrorNumber === mirrorNumber)) {
        return err("INVALID_EVENT", `Mirror ${mirrorNumber} already has a result.`);
      }
      const aspectResult = canSelectMirrorAspect(definition, state, mirrorNumber, aspect);
      if (!aspectResult.ok) return aspectResult;
      const notes = stringPayload(event, "notes") ?? undefined;
      state.mirrorResults.push({
        mirrorNumber,
        result,
        aspect,
        completedAt: event.occurredAt,
        ...(notes ? { notes } : {})
      });
      break;
    }

    case "MANUAL_CORRECTION": {
      const reason = stringPayload(event, "reason");
      if (!reason) return err("INVALID_EVENT", "Manual corrections require a reason.");
      const deltaIntel = numberPayload(event, "deltaIntel") ?? 0;
      const deltaNetwork = numberPayload(event, "deltaNetwork") ?? 0;
      state.intel = Math.max(0, state.intel + deltaIntel);
      state.network = Math.max(0, state.network + deltaNetwork);
      const addFlagId = stringPayload(event, "addFlagId");
      const removeFlagId = stringPayload(event, "removeFlagId");
      if (addFlagId && !state.flags.includes(addFlagId)) state.flags.push(addFlagId);
      if (removeFlagId) state.flags = state.flags.filter((flag) => flag !== removeFlagId);
      const scarHeroId = stringPayload(event, "scarHeroId");
      const scarValue = numberPayload(event, "scarValue");
      if (scarHeroId && scarValue !== null) {
        state.scars[scarHeroId] = Math.max(0, Math.min(definition.progression.scars.maximumPerHero, scarValue));
      }
      if (state.activeSession) {
        const counterId = stringPayload(event, "counterId");
        const counterValue = numberPayload(event, "counterValue");
        if (counterId && counterValue !== null) state.activeSession.objectiveCounters[counterId] = Math.max(0, counterValue);
        const checkId = stringPayload(event, "checkId");
        const checkValue = booleanPayload(event, "checkValue");
        if (checkId && checkValue !== null) state.activeSession.objectiveChecks[checkId] = checkValue;
        const assetId = stringPayload(event, "assetId");
        const assetUsed = booleanPayload(event, "assetUsed");
        if (assetId && assetUsed !== null) {
          const used = new Set(state.activeSession.usedFieldAssetIds);
          if (assetUsed) used.add(assetId);
          else used.delete(assetId);
          state.activeSession.usedFieldAssetIds = Array.from(used);
        }
      }
      state.manualCorrections.push({
        eventId: event.eventId,
        reason,
        occurredAt: event.occurredAt,
        summary: stringPayload(event, "summary") ?? reason,
        revertsEventId: stringPayload(event, "revertsEventId") ?? undefined
      });
      break;
    }

    case "SAVE_IMPORTED": {
      break;
    }

    default:
      return err("UNKNOWN_EVENT", `Unknown event type ${(event as CampaignEvent).type}.`);
  }

  setSequence(state, event);
  const invariantResult = assertInvariants(definition, state);
  if (!invariantResult.ok) return invariantResult;
  return ok(invariantResult.value, warnings);
}

export function replayCampaign(
  definition: CampaignDefinition,
  events: CampaignEvent[],
  playMode: PlayMode = "fail-forward"
): Result<CampaignSnapshot> {
  let state = createInitialSnapshot(definition, playMode);
  const seenMutationIds = new Set<string>();
  const warnings: DomainError[] = [];

  for (const event of events) {
    if (event.clientMutationId && seenMutationIds.has(event.clientMutationId)) {
      state = { ...state, sequence: Math.max(state.sequence, event.sequence) };
      warnings.push({ code: "DUPLICATE_REWARD", message: `Duplicate client mutation ignored: ${event.clientMutationId}`, event });
      continue;
    }
    if (event.clientMutationId) seenMutationIds.add(event.clientMutationId);
    const result = reduceCampaign(definition, state, event);
    if (!result.ok) return result;
    state = result.value;
    if (result.warnings) warnings.push(...result.warnings);
  }

  return ok(state, warnings);
}
