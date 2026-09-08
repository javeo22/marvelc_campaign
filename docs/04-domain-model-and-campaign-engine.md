# 04 — Domain model and campaign engine

## Architectural rule

The campaign engine is a pure TypeScript package. It receives a validated definition, a prior snapshot, and one event; it returns a new snapshot or a typed invariant error. It has no React, IndexedDB, network, locale formatting, or implicit current time.

## Aggregate model

```text
CampaignDefinition (immutable, versioned)
  ├── progression rules
  ├── issue definitions
  ├── interludes and finale
  ├── mirror definitions
  └── content/localization

CampaignSave (mutable user aggregate)
  ├── append-only CampaignEvent[]
  └── CampaignSnapshot (derived cache)
        ├── phase/current issue
        ├── Intel/Network/Scars
        ├── flags/Masteries/aspects
        ├── active session
        ├── issue and mirror records
        └── ending/epilogue
```

The event journal is authoritative. The snapshot is a performance cache that must be reproducible.

## Core invariants

1. Intel and Network never fall below zero.
2. A hero has zero to two Scars.
3. A flag and Mastery are awarded at most once.
4. A main-story hero cannot commit the same aspect twice across three appearances.
5. The first mirror for a hero uses the remaining fourth aspect.
6. A Field Asset must be unlocked and within the current limit.
7. Endgame Protocol is legal only in Issue 15 at 15+ Intel.
8. An Act Recovery is applied at most once per Act.
9. An Interlude accepts exactly one choice.
10. Final Preparation cannot be spent before Issue 15 setup or beyond earned points.
11. A story issue cannot be completed unless it is the current issue, except an explicit developer migration tool.
12. Canon Mode does not advance after a loss.
13. Mirror results do not alter story Intel, Network, Scars, or flags.
14. `needs_author_decision` is a valid finale result and not an application error.

## Setup-plan contract

`composeSetupPlan(definition, snapshot, issueNumber)` returns ordered, presentation-ready groups. It uses `issue.setupActions`; it must not parse `setupSteps`. Include an action when its structured condition is true, insert the two global physical-game actions, and move all `in-game-reminder` items into the live session. The returned plan retains `sourceStep` and source-verbatim `setupSteps` so a parity test and diagnostics view can trace every instruction.

```ts
interface ComposedSetupPlan {
  issueNumber: number;
  groups: Array<{ phaseId: SetupActionPhaseId; actions: ComposedSetupAction[] }>;
  inGameReminders: ComposedSetupAction[];
  sourceVerbatimSteps: string[];
}
```

## Reducer contract

```ts
function reduceCampaign(
  definition: CampaignDefinition,
  previous: CampaignSnapshot,
  event: CampaignEvent,
): Result<CampaignSnapshot, DomainError>
```

Reject out-of-order sequence numbers and impossible state transitions before persistence.

## Reward events and idempotence

Objectives and Masteries can be recorded mid-game. Their reducers award Intel immediately and idempotently.

```ts
OBJECTIVE_COMPLETED(issueNumber, flag):
  assert objective is not win-gated
  if flag already exists: no-op with duplicate marker
  else add flag and intel += 1

MASTERY_EARNED(heroId):
  if heroId already in masteries: no-op with duplicate marker
  else add heroId and intel += 1
```

At debrief, the app may emit missing award events before `ISSUE_COMPLETED`. A transaction can contain multiple events, but they retain individual sequence numbers.

## Issue completion transition

```ts
function completeIssue(state, issue, result) {
  let intelDelta = 0;
  let networkDelta = 0;
  let scarDelta = 0;

  if (result === 'win') {
    intelDelta += 1;
    scarDelta = state.scars[issue.heroId] > 0 ? -1 : 0;
  }
  if (result === 'hero_defeat') {
    networkDelta += 1;
    scarDelta = state.scars[issue.heroId] < 2 ? +1 : 0;
  }
  if (result === 'main_scheme_loss') networkDelta += 2;

  // objective/mastery awards are separate idempotent events
  // other_loss requires an explicit zero/manual decision
  // abandoned defaults to no campaign delta

  return applyDeltasAndRecordAttempt(...);
}
```

## Canon Mode retries

A loss appends an attempt and its consequences but leaves `currentIssueNumber` unchanged. A later win advances. The story appearance records only one committed aspect stamp for the issue. Changing aspect between attempts requires a warning and stores attempt-level aspects for history.

## Act Recovery

```ts
objectiveReduction = objectivesInAct >= 3 ? 1 : 0;
lowWinReduction = wonStoryIssuesInAct <= 2 ? 1 : 0;
networkAfter = Math.max(0, networkBefore - objectiveReduction - lowWinReduction);
```

The recovery event stores counts and both reduction components. Never infer it later from mutable presentation fields.

## Field Asset selectors

```ts
unlockedAssets = assets.filter(a => state.intel >= a.unlockIntel);
normalLimit = state.network >= 6 ? 2 : 1;
endgameExtra = issue.number === 15 && state.intel >= 15 ? ['endgame-protocol'] : [];
```

The extra Endgame Protocol does not consume a normal slot.

## Network selectors

```ts
active = adaptations.filter(a => a.threshold <= state.network);
if (issue.number === 15 && interludeChoice === 'strike-the-core' && round <= 1) {
  suppress adaptation with highest threshold from active;
}
```

Ties are impossible in the current source. Future definitions must specify priority if equal thresholds are introduced.

## Objective state machine

Objective UI is manual but consistent:

- `available` — game started, not completed or missed;
- `progressing` — counter/checklist has partial progress;
- `eligible` — win-gated conditions appear satisfied but await debrief;
- `completed` — flag and Intel committed;
- `missed` — deadline passed before completion;
- `corrected` — player explicitly changed an earlier manual judgment.

A deadline tap may change `available` to `missed`; a correction appends a compensating event.

## Ending resolver

```ts
if (issue15Result !== 'win') return resolved('ghost-in-the-grid');
if (network >= 7) return resolved('pyrrhic-shutdown');
if (network >= 4) return resolved('machine-broken');
if (network <= 3 && masteryCount >= 4) return resolved('avengers-assemble');
return needsAuthorDecision(UNDEFINED_LOW_NETWORK_LOW_MASTERY);
```

Evaluate THE INITIATIVE after this result:

```ts
allFiveMasteries && intel >= 15 && flags.has('CLEAN SHUTDOWN')
```

## Persistence transaction

For each action:

1. validate input and current invariant;
2. construct event(s) with client mutation IDs;
3. fold events into the next snapshot in memory;
4. open one IndexedDB transaction;
5. append events and write snapshot/checksum;
6. commit;
7. update UI;
8. enqueue optional sync.

A failed transaction leaves both journal and snapshot unchanged.

## Migrations

- Campaign definition migrations transform authored content references, never user history silently.
- Save schema migrations are pure, versioned functions with fixtures.
- Import always retains the original file and reports migration actions.
- Unknown event types make a save read-only until a compatible migration exists.
