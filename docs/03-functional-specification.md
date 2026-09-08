# 03 — Functional specification

## 3.1 Campaign library

The home screen lists local saves with current issue, phase, last-played date, Intel, Network, and completion percent. Actions are Open, Duplicate, Export, Rename, and Delete. Delete requires typing the save name or a two-step confirmation and offers a short-lived local Undo when technically possible.

A new save initializes from the campaign definition, not from a copied mutable template. Definition version and save schema version are recorded separately.


## 3.2 Issue setup-plan composer

For every issue, treat `setupSteps` as the source-verbatim parity field and `setupActions` as its executable UI decomposition. The composer filters structured actions by flags, Interlude choices, and Intel; orders them by `setupActionPhases`; inserts the global normal-scenario-setup and opening-hand actions; then separates `in-game-reminder` actions into a persistent table-mode panel. Never infer conditions by parsing prose at runtime. Golden tests must prove that each structured action points to a valid source step and that concatenated actions do not contradict the verbatim setup text.

## 3.3 Dashboard selectors

The dashboard is derived from state through selectors rather than stored duplication:

- current issue and next required transition;
- current hero and Scar penalty;
- Intel total, next unlock threshold, and unlocked assets;
- Network total, active adaptations, and next threshold;
- act wins/objectives for possible Recovery;
- Mastery count and remaining conditions;
- Final Preparation preview after Issue 14;
- completion counts: story, official Standard, official Expert, mirrors, aspects.

## 3.4 Aspect Passport

Rules:

- Each hero appears exactly three times in the story and must use three distinct aspects.
- The first Mirror game with that hero must use the fourth unused aspect.
- Basic cards may be reused freely and are not an aspect choice.
- Recommended routes are suggestions, not additional rules.
- Canon Mode retries do not consume another aspect; they reuse or may change the aspect for that same issue, but only the final committed clear/attempt record should determine the story appearance. The UI must warn before changing aspects between retries because the source does not explicitly discuss this edge case.

The passport screen shows four aspect stamps per hero, Scars, Mastery, main-story appearances, and first-Mirror completion.

## 3.5 Field Assets

- Unlock both assets at each Intel threshold.
- Show one equipment slot at Network 0–5 and two at Network 6+.
- Assets are once per game and reset at `ISSUE_STARTED`.
- They are references outside the physical play area and are never treated as upgrades/supports.
- Endgame Protocol appears only for Issue 15 and 15+ Intel. Its free extra slot must not displace other equipped assets.
- Table mode records use state but does not adjudicate whether the timing window was legal.

## 3.6 Network Adaptations

Every adaptation at or below current Network is active. The setup planner orders them according to the campaign’s global sequence. Predictive Model and Recursive Backup remain visible as in-game reminders after setup.

For Issue 15 with **Strike the Core**, suppress exactly the highest active adaptation through the end of round 1. Store both the suppressed adaptation ID and expiry. At round 2, the UI marks it active. If no adaptation is active, the choice suppresses nothing and must not invent a benefit.

## 3.7 Scars

- Hero defeat: add one Scar to that hero, maximum two.
- Hero win: remove one Scar from that hero, minimum zero.
- Each Scar lowers the starting identity dial by one at setup only.
- Maximum hit points do not change.
- Mirror Protocol resets all Scars before its first game.

Preparation displays a worked starting-dial reminder but does not need to know the hero’s printed hit-point value.

## 3.8 Objectives

Tracker controls are generated from each issue’s `objective.tracker` configuration.

- Boolean or compound check.
- Numeric counter with target.
- Distinct-name counter.
- Deadline tied to villain stage.
- Deadline tied to end of round.
- End-game board-state check.
- Win-gated end-state.

Non-win-gated objectives are committed immediately when the player confirms completion. They add their flag and one Intel and survive a later loss. Issue 13 and Issue 15 explicitly require a win and are finalized in debrief only.

Deadline trackers remain manual. For example, the player taps “Villain advanced to stage II”; the app may then mark an incomplete objective as missed, but it must offer correction because the app cannot observe the physical game.

## 3.9 Hero Mastery

Show the assigned signature achievement whenever that hero plays. “Earn Mastery” is unavailable if previously earned. On first confirmation:

- add the hero ID to global Masteries;
- add one Intel;
- append the event immediately;
- preserve it after any later result.

The debrief asks only as a backstop and performs an idempotent award.

## 3.10 Live counters

Optional counters improve convenience without creating a simulator:

- round number;
- hero current HP;
- villain stage and optional HP;
- main-scheme threat;
- issue-specific objective counters/checklists;
- Field Asset use;
- short notes and timestamps.

No counter is authoritative over the physical board. Every control can be hidden except source-required objective tracking.

## 3.11 Debrief calculation

Display a preview before commit. Consequences are applied once:

| Result | Intel | Network | Scar |
|---|---:|---:|---:|
| Win | +1 | 0 | Remove 1 from current hero |
| Hero defeated | 0 | +1 | Add 1 to current hero, max 2 |
| Main scheme completed | 0 | +2 | No automatic Scar |
| Other loss | 0 | Manual review | No automatic Scar |
| Abandoned | 0 | 0 by default | No automatic Scar |

Objective and first Mastery Intel may already have been awarded during play. The preview shows them as prior events, not new debrief deltas.

## 3.12 Act Recovery

After Issue 5 and Issue 10:

- reduce Network by one if at least three optional objectives were completed in that Act;
- reduce Network by one additional if two or fewer issues were won in that Act;
- apply both if eligible;
- floor Network at zero;
- append one Recovery event containing each component and before/after values.

Canon Mode counts completed issue records for the Act, not failed retry attempts, for the win total. Loss consequences from retries remain in Network. This is an implementation interpretation required for deterministic tracking and must be listed in the UI’s Canon Mode help.

## 3.13 Finale

Final Preparation points equal the number of four specific flags. Each point is spent after all setup effects. Repeated options are allowed. The app stores each spend separately and prevents overspending.

Ending resolver outputs one of:

- `avengers-assemble`;
- `machine-broken`;
- `pyrrhic-shutdown`;
- `ghost-in-the-grid`;
- `needs_author_decision`.

Then evaluate THE INITIATIVE independently.

## 3.14 Mirror Protocol

Starting Mirror Protocol creates a reset event or a new linked mode state that clears campaign-only tracks as authored: Scars, Intel, Network, flags, campaign setup, and Field Assets. The story history remains visible but no longer affects mirror games.

Each mirror row records result, aspect, date, notes, and official clear. The first game for each hero enforces the missing fourth aspect. Later mirrors permit any legal deck. A Perfect Core badge requires all 30 official Standard/Expert pairing clears, all heroes with all four aspects, and all five Masteries.

## 3.15 Card reference

Bundled search fields:

- English/Spanish pack;
- collector number;
- English/Spanish card name;
- category;
- English/Spanish set;
- source URLs;
- optional verified MarvelCDB code.

Normalize case, punctuation, whitespace, and diacritics for search, while displaying official source spelling. Collector number alone is not a global key because different packs reuse numbers.

## 3.16 Deck and rules logs

Deck log mirrors the journey tracker fields and supports linking a deck to a campaign attempt. Rules log stores personal/verified status; a personal note must never be visually presented as an official ruling.

## 3.17 Backup and restore

Export contains:

- manifest and schema versions;
- campaign saves and event journals;
- user settings excluding secrets;
- deck and rules logs;
- optional checksums.

It excludes bundled campaign data, MarvelCDB corpus caches, card text caches, and all images. Import validates before writing and creates a rollback snapshot.
