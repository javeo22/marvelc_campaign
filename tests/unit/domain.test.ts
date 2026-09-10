import { describe, expect, it } from "vitest";
import { FixedClock, IncrementingIdFactory, createEvent } from "@/domain/commands";
import { campaignDefinition } from "@/domain/content";
import { resolveEnding } from "@/domain/ending-resolver";
import { createInitialSnapshot, reduceCampaign, replayCampaign } from "@/domain/reducer";
import {
  canSelectStoryAspect,
  canSelectMirrorAspect,
  selectActRecoveryPreview,
  selectActiveNetworkAdaptations,
  selectAspectPassport,
  selectEndgameProtocolAvailable,
  selectFinalPreparationPoints,
  selectFinalPreparationRemaining,
  selectNormalFieldAssetLimit,
  selectPerfectCore,
  selectUnlockedAssets,
  validateFieldAssetSelection
} from "@/domain/selectors";
import type { Aspect, CampaignEvent, CampaignEventType, CampaignSnapshot, IssueResult, PlayMode } from "@/domain/types";

function harness(playMode: PlayMode = "fail-forward") {
  const clock = new FixedClock("2026-09-08T12:00:00.000Z");
  const ids = new IncrementingIdFactory();
  let state = createInitialSnapshot(campaignDefinition, playMode);
  const events: CampaignEvent[] = [];

  const dispatch = <TPayload extends Record<string, unknown>>(type: CampaignEventType, payload: TPayload) => {
    const event = createEvent(type, state.sequence + 1, payload, { clock, ids, deviceId: "test-device" });
    const result = reduceCampaign(campaignDefinition, state, event);
    expect(result.ok, result.ok ? "" : result.error.message).toBe(true);
    if (result.ok) {
      state = result.value;
      events.push(event);
    }
    return event;
  };

  dispatch("CAMPAIGN_CREATED", { playMode });

  const startIssue = (aspect?: Aspect, selectedFieldAssetIds: string[] = []) => {
    const issue = campaignDefinition.issues.find((candidate) => candidate.number === state.currentIssueNumber)!;
    dispatch("ISSUE_STARTED", {
      issueNumber: issue.number,
      aspect: aspect ?? issue.recommendedAspect,
      selectedFieldAssetIds
    });
    return issue;
  };

  const completeIssue = (result: IssueResult = "win", options: { objective?: boolean; mastery?: boolean } = {}) => {
    const issueNumber = state.activeSession?.issueNumber;
    if (!issueNumber) throw new Error("No issue session");
    dispatch("ISSUE_COMPLETED", {
      issueNumber,
      result,
      objectiveCompleted: options.objective ?? result === "win",
      masteryEarned: options.mastery ?? false
    });
    if (state.phase === "interlude") {
      const interlude = campaignDefinition.interludes.find((item) => !state.interludeChoices[item.id])!;
      dispatch("INTERLUDE_CHOICE_MADE", { interludeId: interlude.id, choiceId: interlude.choices[0].id });
      dispatch("ACT_RECOVERY_APPLIED", { actId: interlude.actRecovery.actId });
    }
  };

  return {
    get state() {
      return state;
    },
    events,
    dispatch,
    startIssue,
    completeIssue
  };
}

function snapshotWith(overrides: Partial<CampaignSnapshot>) {
  return { ...createInitialSnapshot(campaignDefinition, "fail-forward"), ...overrides };
}

describe("campaign reducer core deltas", () => {
  it("applies each result's Intel, Network, and Scar delta", () => {
    const cases: Array<[IssueResult, { intel: number; network: number; scar: number; currentIssue: number | null }]> = [
      ["win", { intel: 1, network: 0, scar: 0, currentIssue: 2 }],
      ["hero_defeat", { intel: 0, network: 1, scar: 1, currentIssue: 2 }],
      ["main_scheme_loss", { intel: 0, network: 2, scar: 0, currentIssue: 2 }],
      ["other_loss", { intel: 0, network: 0, scar: 0, currentIssue: 2 }],
      ["abandoned", { intel: 0, network: 0, scar: 0, currentIssue: 2 }]
    ];

    for (const [result, expected] of cases) {
      const run = harness();
      run.startIssue("protection");
      run.completeIssue(result, { objective: false });
      expect(run.state.intel).toBe(expected.intel);
      expect(run.state.network).toBe(expected.network);
      expect(run.state.scars["spider-man"]).toBe(expected.scar);
      expect(run.state.currentIssueNumber).toBe(expected.currentIssue);
    }
  });

  it("keeps Scar values within floor and ceiling and removes one on a win", () => {
    const run = harness();
    run.startIssue("protection");
    run.completeIssue("hero_defeat", { objective: false });
    run.startIssue("justice");
    run.completeIssue("hero_defeat", { objective: false });
    expect(run.state.scars["captain-marvel"]).toBe(1);

    const capped = snapshotWith({ scars: { ...createInitialSnapshot(campaignDefinition).scars, "spider-man": 2 } });
    const event = createEvent(
      "MANUAL_CORRECTION",
      1,
      { reason: "test cap", scarHeroId: "spider-man", scarValue: 5 },
      { clock: new FixedClock(), ids: new IncrementingIdFactory() }
    );
    const cappedResult = reduceCampaign(campaignDefinition, capped, event);
    expect(cappedResult.ok && cappedResult.value.scars["spider-man"]).toBe(2);

    const winRun = harness();
    winRun.dispatch("MANUAL_CORRECTION", { reason: "fixture scar", scarHeroId: "spider-man", scarValue: 2 });
    winRun.startIssue("protection");
    winRun.completeIssue("win", { objective: false });
    expect(winRun.state.scars["spider-man"]).toBe(1);
  });

  it("persists an immediate objective and first Mastery after a later loss", () => {
    const run = harness();
    run.startIssue("protection");
    run.completeIssue("win", { objective: false });
    run.startIssue("leadership");
    run.completeIssue("win", { objective: false });
    run.startIssue("aggression");
    run.dispatch("COUNTER_CHANGED", { counterId: "drone-sample", value: 4 });
    run.dispatch("OBJECTIVE_COMPLETED", { issueNumber: 3, flagId: "drone-sample" });
    run.dispatch("MASTERY_EARNED", { heroId: "she-hulk" });
    run.completeIssue("hero_defeat", { objective: false });

    expect(run.state.flags).toContain("drone-sample");
    expect(run.state.masteries).toContain("she-hulk");
    expect(run.state.intel).toBe(4);
    expect(run.state.network).toBe(1);
    expect(run.state.scars["she-hulk"]).toBe(1);
    expect(run.state.currentIssueNumber).toBe(4);
  });

  it("awards first Mastery idempotently", () => {
    const run = harness();
    run.startIssue("protection");
    run.dispatch("MASTERY_EARNED", { heroId: "spider-man" });
    const afterFirst = run.state.intel;
    run.dispatch("MASTERY_EARNED", { heroId: "spider-man" });
    expect(run.state.intel).toBe(afterFirst);
    expect(run.state.masteries).toEqual(["spider-man"]);
  });

  it("keeps optional physical-table dials in typed session fields and makes corrections replayable", () => {
    const run = harness();
    run.startIssue("protection");
    run.dispatch("COUNTER_CHANGED", { counterId: "heroHp", value: 9 });
    run.dispatch("COUNTER_CHANGED", { counterId: "villainHp", value: 13 });
    run.dispatch("COUNTER_CHANGED", { counterId: "mainSchemeThreat", value: 4 });
    run.dispatch("COUNTER_CHANGED", { counterId: "villainStageIndex", value: 1 });
    run.dispatch("MANUAL_CORRECTION", {
      reason: "Undo table counter change",
      counterId: "heroHp",
      counterValue: 10
    });

    expect(run.state.activeSession).toMatchObject({
      heroHp: 10,
      villainHp: 13,
      mainSchemeThreat: 4,
      villainStage: "II"
    });
    expect(run.state.activeSession?.objectiveCounters).not.toHaveProperty("heroHp");

    const replayed = replayCampaign(campaignDefinition, run.events, "fail-forward");
    expect(replayed.ok).toBe(true);
    if (replayed.ok) expect(replayed.value).toEqual(run.state);
  });
});

describe("selectors for assets and adaptations", () => {
  it("unlocks both Field Assets at each Intel threshold", () => {
    const thresholds = [0, 3, 6, 9, 12, 15];
    const counts = thresholds.map((intel) => selectUnlockedAssets(campaignDefinition, snapshotWith({ intel })).length);
    expect(counts).toEqual([0, 2, 4, 6, 8, 9]);
  });

  it("enforces Field Asset limits at Network 5 versus 6", () => {
    const network5 = snapshotWith({ intel: 12, network: 5 });
    const network6 = snapshotWith({ intel: 12, network: 6 });
    expect(selectNormalFieldAssetLimit(campaignDefinition, network5)).toBe(1);
    expect(selectNormalFieldAssetLimit(campaignDefinition, network6)).toBe(2);
    expect(validateFieldAssetSelection(campaignDefinition, network5, 8, ["emergency-reserve", "field-medic"]).ok).toBe(false);
    expect(validateFieldAssetSelection(campaignDefinition, network6, 8, ["emergency-reserve", "field-medic"]).ok).toBe(true);
  });

  it("handles Endgame Protocol legality and special slot", () => {
    const issue15 = snapshotWith({ intel: 15, network: 6, currentIssueNumber: 15 });
    expect(selectEndgameProtocolAvailable(campaignDefinition, issue15, 15)).toBe(true);
    expect(
      validateFieldAssetSelection(campaignDefinition, issue15, 15, [
        "emergency-reserve",
        "field-medic",
        "endgame-protocol"
      ]).ok
    ).toBe(true);
    expect(validateFieldAssetSelection(campaignDefinition, issue15, 14, ["endgame-protocol"]).ok).toBe(false);
  });

  it("selects cumulative Network thresholds and Strike the Core suppression", () => {
    expect(selectActiveNetworkAdaptations(campaignDefinition, snapshotWith({ network: 10 }), 14).active.map((item) => item.id)).toEqual([
      "early-warning",
      "reinforced-chassis",
      "prepared-ambush",
      "predictive-model",
      "recursive-backup"
    ]);
    const issue15 = snapshotWith({
      network: 10,
      currentIssueNumber: 15,
      interludeChoices: { "act-2-assault": "strike-the-core" }
    });
    expect(selectActiveNetworkAdaptations(campaignDefinition, issue15, 15, 1).suppressed?.id).toBe("recursive-backup");
    expect(selectActiveNetworkAdaptations(campaignDefinition, issue15, 15, 2).suppressed).toBeNull();
  });
});

describe("Aspect Passport, Recovery, Final Preparation, Mirror, and endings", () => {
  it("allows any campaign aspect in the main story and stamps only winning aspects", () => {
    const run = harness();
    expect(canSelectStoryAspect(campaignDefinition, run.state, 1, "aggression").ok).toBe(true);
    run.startIssue("aggression");
    run.completeIssue("hero_defeat", { objective: false });
    expect(run.state.usedAspects["spider-man"]).toEqual([]);

    for (let issueNumber = 2; issueNumber <= 5; issueNumber += 1) {
      run.startIssue("protection");
      run.completeIssue("win", { objective: false });
    }
    run.startIssue("aggression");
    run.completeIssue("win", { objective: false });
    expect(run.state.usedAspects["spider-man"]).toEqual(["aggression"]);
    expect(canSelectStoryAspect(campaignDefinition, run.state, 6, "aggression").ok).toBe(true);
    expect(canSelectMirrorAspect(campaignDefinition, run.state, 1, "protection").ok).toBe(true);
  });

  it("tracks all five heroes through the recommended Aspect Passport route", () => {
    const run = harness();
    for (let issueNumber = 1; issueNumber <= 15; issueNumber += 1) {
      const issue = campaignDefinition.issues[issueNumber - 1]!;
      run.startIssue(issue.recommendedAspect);
      run.completeIssue("win", { objective: true, mastery: issueNumber <= 5 });
    }
    const passport = selectAspectPassport(campaignDefinition, run.state);
    for (const row of passport) {
      expect(row.storyAspects).toEqual(row.hero.recommendedAspectRoute.mainStory);
      expect(row.firstMirrorRequired).toBe(row.hero.recommendedAspectRoute.firstMirror);
    }
  });

  it("enforces the first Mirror fourth aspect and keeps story tracks isolated", () => {
    const run = harness();
    for (let issueNumber = 1; issueNumber <= 15; issueNumber += 1) {
      const issue = campaignDefinition.issues[issueNumber - 1]!;
      run.startIssue(issue.recommendedAspect);
      run.completeIssue("win", { objective: true });
    }
    const intelBeforeMirror = run.state.intel;
    run.dispatch("MIRROR_STARTED", {});
    expect(run.state.intel).toBe(0);
    expect(run.state.network).toBe(0);
    expect(run.state.flags).toEqual([]);
    expect(canSelectMirrorAspect(campaignDefinition, run.state, 1, "protection").ok).toBe(false);
    expect(canSelectMirrorAspect(campaignDefinition, run.state, 1, "aggression").ok).toBe(true);
    run.dispatch("MIRROR_COMPLETED", { mirrorNumber: 1, aspect: "aggression", result: "win" });
    expect(run.state.mirrorResults).toHaveLength(1);
    expect(intelBeforeMirror).toBeGreaterThan(0);
    expect(run.state.intel).toBe(0);
  });

  it("calculates both Act Recovery conditions independently, together, floor, and one-time guard", () => {
    const baseScars = createInitialSnapshot(campaignDefinition).scars;
    const both = snapshotWith({
      sequence: 0,
      network: 1,
      scars: baseScars,
      flags: ["bomb-defused", "masters-broken", "drone-sample"],
      issueResults: [
        { attemptId: "1", issueNumber: 1, result: "win", aspect: "protection", completedAt: "x", objectiveCompleted: true, masteryEarned: false, advancedCampaign: true, intelAfter: 0, networkAfter: 0, heroScarsAfter: 0 },
        { attemptId: "2", issueNumber: 2, result: "hero_defeat", aspect: "leadership", completedAt: "x", objectiveCompleted: true, masteryEarned: false, advancedCampaign: true, intelAfter: 0, networkAfter: 1, heroScarsAfter: 1 }
      ]
    });
    const preview = selectActRecoveryPreview(campaignDefinition, both, "act-1");
    expect(preview.objectiveReduction).toBe(1);
    expect(preview.lowWinReduction).toBe(1);
    expect(preview.networkAfter).toBe(0);

    const event = createEvent("ACT_RECOVERY_APPLIED", 1, { actId: "act-1" }, { clock: new FixedClock(), ids: new IncrementingIdFactory() });
    const result = reduceCampaign(campaignDefinition, both, event);
    expect(result.ok && result.value.network).toBe(0);
    if (result.ok) {
      const second = createEvent("ACT_RECOVERY_APPLIED", 2, { actId: "act-1" }, { clock: new FixedClock(), ids: new IncrementingIdFactory() });
      expect(reduceCampaign(campaignDefinition, result.value, second).ok).toBe(false);
    }

    expect(selectActRecoveryPreview(campaignDefinition, snapshotWith({ network: 5, flags: ["bomb-defused", "masters-broken", "drone-sample"] }), "act-1").objectiveReduction).toBe(1);
    expect(
      selectActRecoveryPreview(
        campaignDefinition,
        snapshotWith({
          network: 5,
          issueResults: [
            { attemptId: "1", issueNumber: 1, result: "win", aspect: "protection", completedAt: "x", objectiveCompleted: false, masteryEarned: false, advancedCampaign: true, intelAfter: 0, networkAfter: 0, heroScarsAfter: 0 }
          ]
        }),
        "act-1"
      ).lowWinReduction
    ).toBe(1);
  });

  it("calculates Final Preparation points, repeat spends, and overspend rejection", () => {
    const run = harness();
    for (let issueNumber = 1; issueNumber <= 14; issueNumber += 1) {
      const issue = campaignDefinition.issues[issueNumber - 1]!;
      run.startIssue(issue.recommendedAspect);
      run.completeIssue("win", { objective: true });
    }
    expect(run.state.currentIssueNumber).toBe(15);
    expect(selectFinalPreparationPoints(campaignDefinition, run.state)).toBe(4);
    for (let index = 0; index < 4; index += 1) {
      run.dispatch("FINAL_PREP_SPENT", { optionId: "remove-threat" });
    }
    expect(selectFinalPreparationRemaining(campaignDefinition, run.state)).toBe(0);
    const event = createEvent("FINAL_PREP_SPENT", run.state.sequence + 1, { optionId: "remove-threat" }, { clock: new FixedClock(), ids: new IncrementingIdFactory() });
    expect(reduceCampaign(campaignDefinition, run.state, event).ok).toBe(false);
  });

  it("resolves all defined endings plus the source-undefined branch", () => {
    expect(resolveEnding(campaignDefinition, snapshotWith({ network: 0, masteries: ["a", "b", "c", "d"] }), "win")).toMatchObject({
      status: "resolved",
      endingId: "avengers-assemble"
    });
    expect(resolveEnding(campaignDefinition, snapshotWith({ network: 4 }), "win")).toMatchObject({
      status: "resolved",
      endingId: "machine-broken"
    });
    expect(resolveEnding(campaignDefinition, snapshotWith({ network: 7 }), "win")).toMatchObject({
      status: "resolved",
      endingId: "pyrrhic-shutdown"
    });
    expect(resolveEnding(campaignDefinition, snapshotWith({ network: 0 }), "hero_defeat")).toMatchObject({
      status: "resolved",
      endingId: "ghost-in-the-grid"
    });
    expect(resolveEnding(campaignDefinition, snapshotWith({ network: 3, masteries: ["spider-man"] }), "win")).toMatchObject({
      status: "needs_author_decision"
    });
  });

  it("evaluates THE INITIATIVE independently of the visible ending", () => {
    const positive = resolveEnding(
      campaignDefinition,
      snapshotWith({
        network: 2,
        intel: 15,
        flags: ["clean-shutdown"],
        masteries: ["spider-man", "captain-marvel", "she-hulk", "iron-man", "black-panther"]
      }),
      "win"
    );
    expect(positive.status === "resolved" && positive.secretEpilogueEarned).toBe(true);
    const negative = resolveEnding(campaignDefinition, snapshotWith({ network: 2, intel: 14, flags: ["clean-shutdown"] }), "win");
    expect(negative.status === "resolved" && negative.secretEpilogueEarned).toBe(false);
  });

  it("recognizes Perfect Core only after the official grid, passport, and Masteries are complete", () => {
    const perfect = snapshotWith({
      usedAspects: Object.fromEntries(
        campaignDefinition.heroes.map((hero) => [hero.id, hero.recommendedAspectRoute.mainStory])
      ) as CampaignSnapshot["usedAspects"],
      masteries: campaignDefinition.heroes.map((hero) => hero.id),
      issueResults: campaignDefinition.issues.map((issue) => ({
        attemptId: `story-${issue.number}`,
        issueNumber: issue.number,
        result: "win" as const,
        aspect: issue.recommendedAspect,
        completedAt: "x",
        objectiveCompleted: true,
        masteryEarned: true,
        advancedCampaign: true,
        intelAfter: 0,
        networkAfter: 0,
        heroScarsAfter: 0
      })),
      mirrorResults: campaignDefinition.mirrorProtocol.rows.map((row) => ({
        mirrorNumber: row.number,
        result: "win" as const,
        aspect: campaignDefinition.heroes.find((hero) => hero.id === row.heroId)!.recommendedAspectRoute.firstMirror,
        completedAt: "x"
      }))
    });
    expect(selectPerfectCore(campaignDefinition, perfect)).toBe(true);
    expect(selectPerfectCore(campaignDefinition, { ...perfect, mirrorResults: perfect.mirrorResults.slice(0, -1) })).toBe(false);
  });
});

describe("mode, replay, and sequencing behavior", () => {
  it("Canon Mode retries retain loss consequences and do not advance", () => {
    const run = harness("canon");
    run.startIssue("protection");
    run.completeIssue("hero_defeat", { objective: false });
    expect(run.state.currentIssueNumber).toBe(1);
    expect(run.state.network).toBe(1);
    expect(run.state.scars["spider-man"]).toBe(1);
    expect(run.state.usedAspects["spider-man"]).toEqual([]);
    run.startIssue("justice");
    run.completeIssue("win", { objective: false });
    expect(run.state.currentIssueNumber).toBe(2);
    expect(run.state.usedAspects["spider-man"]).toEqual(["justice"]);
  });

  it("fail-forward losses advance without stamping the optional Aspect Passport", () => {
    const run = harness("fail-forward");
    run.startIssue("protection");
    run.completeIssue("hero_defeat", { objective: false });
    expect(run.state.currentIssueNumber).toBe(2);
    expect(run.state.usedAspects["spider-man"]).toEqual([]);
  });

  it("replays to the same canonical snapshot", () => {
    const run = harness();
    run.startIssue("protection");
    run.dispatch("OBJECTIVE_COMPLETED", { issueNumber: 1, flagId: "bomb-defused" });
    run.completeIssue("win", { objective: false });
    const replay = replayCampaign(campaignDefinition, run.events, "fail-forward");
    expect(replay.ok && replay.value).toEqual(run.state);
  });

  it("deduplicates repeated client mutation IDs during replay", () => {
    const clock = new FixedClock();
    const ids = new IncrementingIdFactory();
    const create = createEvent("CAMPAIGN_CREATED", 1, { playMode: "fail-forward" }, { clock, ids, clientMutationId: "same-create" });
    const objective1 = createEvent("OBJECTIVE_COMPLETED", 2, { issueNumber: 1, flagId: "bomb-defused" }, { clock, ids, clientMutationId: "same-objective" });
    const objective2 = createEvent("OBJECTIVE_COMPLETED", 3, { issueNumber: 1, flagId: "bomb-defused" }, { clock, ids, clientMutationId: "same-objective" });
    const replay = replayCampaign(campaignDefinition, [create, objective1, objective2], "fail-forward");
    expect(replay.ok && replay.value.intel).toBe(1);
    expect(replay.ok && replay.value.flags).toEqual(["bomb-defused"]);
  });

  it("rejects out-of-order events", () => {
    const state = createInitialSnapshot(campaignDefinition);
    const event = createEvent("CAMPAIGN_CREATED", 2, { playMode: "fail-forward" }, { clock: new FixedClock(), ids: new IncrementingIdFactory() });
    const result = reduceCampaign(campaignDefinition, state, event);
    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.error.code).toBe("OUT_OF_ORDER_EVENT");
  });
});
