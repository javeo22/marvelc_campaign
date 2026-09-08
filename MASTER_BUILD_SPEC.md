---
title: "Core Protocol Companion"
subtitle: "Interactive Web App Build Specification"
author: "Fan-project product and engineering handoff"
date: "7 September 2026"
lang: en-US
---

![Original abstract cover — no licensed character or card art](docx-assets/core-protocol-cover.png){width=7.1in}

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```

# Handoff status

**Specification status:** implementation-ready  
**Campaign source:** Core Protocol v1.1 — Balanced playtest edition  
**Product form:** mobile-first, local-first, installable table companion  
**Campaign format:** true solo  
**Source inventory:** 15 story issues + 20 Mirror Protocol games = 35 games  
**Card reference:** 359 bilingual English/Spanish records  
**Validation:** automated JSON, cross-reference, source-hash, and rights-boundary checks  
**Card imagery:** metadata-only by default; remote display remains a separate rights launch gate

> **Build instruction.** Start with `AGENTS.md`, run `python scripts/validate_pack.py`, implement the pure campaign engine before screens, and never infer campaign behavior by parsing prose at runtime.

## What this handoff contains

This specification translates the campaign, Quickplay Companion, and journey tracker into product requirements, deterministic state transitions, UI contracts, technical architecture, data schemas, legal/rights controls, acceptance tests, deployment procedures, and a phased code-agent execution plan. The original source files remain packaged for traceability.

## Product decision summary

| Decision | Locked behavior |
|---|---|
| Companion boundary | Guides and records physical play; does not simulate decks, encounter resolution, attacks, boosts, payments, or card legality. |
| Persistence | IndexedDB event journal plus derived snapshot; account-free local play is complete. |
| Story progression | Fail-forward is recommended; Canon Mode is optional and deterministic. |
| Setup instructions | Structured `setupActions` with explicit phases and conditions; `setupSteps` retained only for parity and diagnostics. |
| Images | No official image binaries in repository, build, cache, database, backups, or exports. Remote images can be rendered only after the signed launch gate. |
| Localization | English campaign narrative is authoritative; bilingual English/Spanish card identity is bundled; missing Spanish narrative is labeled, never invented. |
| Undefined source branch | Issue 15 win at Network 0–3 with fewer than four Masteries returns `needs_author_decision`. |
| Deployment | Vercel-ready Next.js App Router; Node route handlers; optional Supabase sync behind a feature flag. |

```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 00 — Executive brief

## Product vision

**Core Protocol Companion** turns a carefully authored paper campaign into a polished, installable web companion for actual table play. It should feel like opening a modern comic issue: the previous chapter, the mission briefing, a precise setup sequence, the fight dashboard, and the debrief all form one continuous experience.

The product’s value is not rules automation. Its value is reducing cognitive overhead while preserving physical play. It remembers every persistent consequence, makes the correct next setup obvious, and gives the player confidence that nothing from the campaign log was missed.

## Primary user context

The first user plays true solo, owns Spanish physical products, speaks about the game in English, and wants to explore heroes, aspects, villains, and difficulty progressively. The UI therefore needs two separate language preferences:

- **Interface/narrative language**, initially English.
- **Physical-card naming language**, English, Spanish, or both.

The source contains English campaign narrative and bilingual names for relevant Core heroes, villains, modular sets, and signature cards. It does not contain a full Spanish campaign translation.

## Product promise

At any moment the app answers four questions:

1. What do I set up next, and in what exact order?
2. What from earlier issues changes this game?
3. What campaign-specific details do I need to track while playing?
4. What changed when the game ended?

## Product principles

- **Table first.** Large controls, low glare, immediate actions, minimal typing.
- **Source faithful.** Campaign prose and mechanics are data, not hard-coded guesses.
- **Manual game authority.** The player confirms physical events; the app does not pretend to know the board.
- **Deterministic continuity.** The same event journal always produces the same campaign state.
- **Offline by default.** Campaign play never depends on MarvelCDB, login, or a server.
- **Bilingual identification.** English conversation and Spanish physical cards coexist naturally.
- **Comic energy, rules clarity.** Visual character without sacrificing accessibility.
- **Rights-aware.** The fan-project posture is supported by technical limits, not only a disclaimer.

## MVP definition

The first complete release includes:

- multiple local campaign saves;
- fail-forward and optional Canon Mode;
- all 15 story issues and 20 Mirror Protocol games;
- guided preparation and setup sequencing;
- persistent campaign engine and live table tracker;
- debrief with automatic consequences;
- Interludes, Act Recovery, Final Preparation, endings, and secret epilogue;
- hero passport, completion matrix, deck log, rules log, and session notes;
- bilingual card-name search from the 359-row tracker export;
- optional MarvelCDB metadata enhancement;
- installable PWA, offline content, autosave, and JSON backup/restore;
- a metadata-only card display that remains fully useful with images disabled.

## Deliberately deferred

- Account creation and cloud sync.
- MarvelCDB OAuth deck editing.
- Additional fan or official campaigns.
- Multiplayer campaign variants.
- Full Spanish campaign narrative.
- Social sharing, public profiles, leaderboards, or analytics.
- Any full Marvel Champions rules or card simulation.

## Success criteria

The app succeeds when a player can complete the campaign without touching the paper tracker, while still needing the physical game. A successful play session begins offline, survives app suspension or browser termination, clearly records optional achievements at the correct time, and produces an auditable debrief with no duplicate rewards.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 01 — Product requirements

## Users and jobs

### Primary player

A true-solo player who wants a guided campaign with strong continuity, accurate setup, and a satisfying progress record.

**Jobs to be done**

- Resume the campaign without reconstructing previous outcomes.
- Identify Spanish physical cards from English instructions.
- Know which hero, villain stages, encounter sets, modular set, and aspect apply.
- See all persistent modifiers before drawing an opening hand.
- Track only the issue-specific details that matter.
- Close the game with correct rewards, penalties, scars, flags, and next steps.

### Future content editor

A maintainer adding a translation, correcting source data, or importing another campaign without rewriting UI logic.

### Future signed-in player

A player who chooses cloud backup and multi-device sync while retaining local-first behavior.

## Functional requirements

### Campaign lifecycle

| ID | Requirement | Acceptance summary |
|---|---|---|
| PRD-CAM-001 | Create multiple named local saves | Creating a save requires no account and initializes all tracks exactly from the definition. |
| PRD-CAM-002 | Support fail-forward and Canon Mode | Fail-forward advances after a loss; Canon Mode keeps the current issue until a win while retaining loss consequences. |
| PRD-CAM-003 | Resume deterministically | Reloading, reinstall recovery from export, or event replay yields the same snapshot. |
| PRD-CAM-004 | Preserve authored issue order | The main story exposes Issues 1–15 sequentially except an explicit developer/debug override. |
| PRD-CAM-005 | Complete Mirror Protocol | All 20 mirror rows, first-mirror aspect rules, and 35-game completion totals are represented. |

### Issue preparation

| ID | Requirement | Acceptance summary |
|---|---|---|
| PRD-PREP-001 | Show required loadout | Hero, bilingual name, villain, modular set, tier, stages, Standard/Expert encounter sets, and recommended aspect are visible above the fold. |
| PRD-PREP-002 | Validate Aspect Passport | A repeated main-story aspect is blocked; the first mirror uses the fourth aspect; recommended route can be changed to another legal aspect. |
| PRD-PREP-003 | Compose setup in authored order | Pre-setup, normal setup, issue/continuity, Network/Final Preparation, opening hand, and Prepared Ambush are distinct steps. |
| PRD-PREP-004 | Select legal Field Assets | Only unlocked assets are selectable; limit is one normally, two at Network 6+; Endgame Protocol exception is handled. |
| PRD-PREP-005 | Explain persistent modifiers | Every active Network adaptation, Scar, prior flag, Interlude effect, and finale preparation is shown with its source. |

### Table mode

| ID | Requirement | Acceptance summary |
|---|---|---|
| PRD-LIVE-001 | Start a durable session | Starting play writes an event and survives reload before any further interaction. |
| PRD-LIVE-002 | Present issue-specific tracker | Counter, checklist, deadline, round, stage, threat, and board-state controls are data-driven by the issue definition. |
| PRD-LIVE-003 | Record objective immediately | Non-win-gated objectives can be committed mid-game and persist after a later loss. |
| PRD-LIVE-004 | Record first Mastery immediately | The first completion awards exactly one Intel and persists after a later loss. |
| PRD-LIVE-005 | Track Field Asset use | Equipped assets show ready/used state; reset occurs only when a new game starts. |
| PRD-LIVE-006 | Provide safe Undo | Counter/checklist mistakes can be reversed by a compensating event without deleting history. |
| PRD-LIVE-007 | Minimize typing | The normal path uses taps and confirmations; freeform notes are optional. |

### Debrief and campaign consequences

| ID | Requirement | Acceptance summary |
|---|---|---|
| PRD-END-001 | Distinguish loss cause | Hero defeat adds +1 Network and a Scar; main-scheme loss adds +2 Network; other/abandoned results require explicit review. |
| PRD-END-002 | Award win and remove Scar | A win adds +1 Intel and removes one Scar from the winning hero, minimum zero. |
| PRD-END-003 | Avoid duplicate rewards | A previously recorded objective or Mastery is not awarded again during debrief. |
| PRD-END-004 | Apply Act Recovery once | Recovery appears after Issues 5 and 10, calculates both conditions, and cannot be double-applied. |
| PRD-END-005 | Resolve finale safely | Defined ending criteria resolve; undefined low-Network/low-Mastery win returns `needs_author_decision`. |
| PRD-END-006 | Evaluate secret epilogue | All five Masteries + 15 Intel + CLEAN SHUTDOWN marks THE INITIATIVE. |

### Reference and logs

| ID | Requirement | Acceptance summary |
|---|---|---|
| PRD-REF-001 | Search bilingual names | Search is accent-insensitive and matches English or Spanish names and set labels. |
| PRD-REF-002 | Degrade without MarvelCDB | The bundled name/index data remains searchable offline with no external API. |
| PRD-REF-003 | Record deck experiments | Deck log stores hero, bilingual identity, aspect, scenario, difficulty, result, version, notes, and optional MarvelCDB URL. |
| PRD-REF-004 | Record rules notes | Rules log stores topic, practical ruling, bilingual example, status, source, and notes. |
| PRD-REF-005 | Export and import | A versioned JSON backup contains user-created state and logs, never card images. |

## Non-functional requirements

| ID | Requirement | Target |
|---|---|---|
| NFR-001 | Offline resilience | Campaign content, saves, setup, play, debrief, logs, and export work offline. |
| NFR-002 | Accessibility | WCAG 2.2 AA; semantic landmarks; visible focus; screen-reader labels; reduced motion; no color-only meaning. |
| NFR-003 | Touch usability | 44 px minimum controls; 52 px preferred in table mode; no hover-only functions. |
| NFR-004 | Performance | App shell is interactive promptly on a mid-range mobile device; session actions feel immediate and do not wait on network. |
| NFR-005 | Data durability | Each persistent action is transactional; interrupted writes recover to the previous valid sequence. |
| NFR-006 | Privacy | No telemetry by default; no account required; data export/delete available locally. |
| NFR-007 | Security | Imported JSON is schema-validated, size-limited, migrated, and rendered as text rather than HTML. |
| NFR-008 | Maintainability | Pure domain engine, schema-first content, fixture-backed integrations, and source traceability. |
| NFR-009 | Rights controls | Card image mode defaults off; no image binary is bundled, proxied, cached, exported, or persisted. |

## Out of scope

- Full Marvel Champions card rules or timing validation.
- Replacing physical player or encounter cards.
- Encounter-deck manipulation, automatic boosts, damage calculations, deck shuffling, payments, or legal-target determination.
- Custom card creation.
- Competitive rankings, public campaign data, or social network features.
- Commercialization, advertising, subscriptions, or gated card imagery.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 02 — Information architecture and user flows

## Navigation model

![Primary campaign lifecycle](docx-assets/campaign-flow.png){width=6.65in}

The app uses a compact bottom navigation on phones and a rail on larger screens.

- **Campaign** — current issue, tracks, resume, progress.
- **Play** — active session; hidden/disabled when no game is active.
- **Reference** — cards, deck log, rules log.
- **Journey** — hero passport, flags, completion grid, Mirror Protocol.
- **Settings** — language, display, backups, image mode, legal notice.

## Route map

```text
/
/onboarding
/campaigns
/campaigns/new
/campaigns/[saveId]
/campaigns/[saveId]/issue/[issueNumber]/prepare
/campaigns/[saveId]/issue/[issueNumber]/play
/campaigns/[saveId]/issue/[issueNumber]/debrief
/campaigns/[saveId]/interlude/[interludeId]
/campaigns/[saveId]/finale
/campaigns/[saveId]/journey
/campaigns/[saveId]/passport
/campaigns/[saveId]/mirror
/reference/cards
/reference/decks
/reference/rules
/settings
/settings/backup
/settings/about
```

## First-run flow

1. **Splash panel** — original Core Protocol wordmark, fan notice, Continue.
2. **Play mode** — Fail-forward recommended or Canon Mode.
3. **Languages** — UI/narrative and physical card names separately.
4. **Display** — comic light/dark/system, reduced motion, large table controls.
5. **Card images** — metadata-only default; remote images unavailable until launch gate is enabled.
6. **Save name** — default “Core Protocol.”
7. **Campaign opens** — Issue 1 panel and a short “how this companion works” overlay.

## Campaign dashboard

Above the fold:

- Issue number, title, hero portrait placeholder or permitted card thumbnail, villain, tier, aspect.
- Primary action: **Prepare Issue**, **Resume Fight**, **Finish Debrief**, or **Choose Interlude**.
- Intel and Network meters with next threshold.
- Current hero Scar chips.
- Active Network Adaptations.
- Unlocked Field Asset count.

Below:

- act progress strip;
- objective flags and Masteries;
- recent activity;
- quick links to passport, completion grid, decks, rules, and backup.

## Preparation wizard

### Panel 1 — Cast and loadout

Show hero/villain/modular/tier, villain stages, encounter sets, bilingual names, card-reference links, and recommended aspect.

### Panel 2 — Aspect Passport

Show all four aspects with used, recommended, legal, and reserved-for-first-mirror states. A user may choose a different legal aspect than the recommended route.

### Panel 3 — Field Assets

Show only unlocked assets. Display one slot normally or two slots at Network 6+. Explain the Issue 15 Endgame Protocol exception.

### Panel 4 — Setup sequence

Render a vertical sequence with explicit checkpoints:

1. Issue pre-setup and set-aside actions.
2. Physical game’s normal setup.
3. Campaign setup, continuity flags, and Interlude effects.
4. Network adaptations and Final Preparation.
5. Opening hand and mulligan.
6. Prepared Ambush, when active.

The player confirms each physical step. The app never marks a card effect as resolved without a tap.

### Panel 5 — Mission objective

Show the objective, tracker behavior, timing, flag reward, and whether it persists after a loss or explicitly requires a win.

### Panel 6 — Ready

Summarize selected aspect, starting Scar penalty, Field Assets, extra encounter cards, Tough/status modifications, threat changes, and optional counter presets. **Start Issue** commits the preparation selections atomically.

## Table mode

The default layout is a calm dashboard inside an energetic comic frame:

- persistent header: Issue, round, offline/save status, quick exit;
- objective panel: counter/checklist/deadline plus “Record objective now”;
- hero panel: optional HP and Scar reminder;
- villain/main scheme panel: optional stage, HP, and threat;
- Field Assets: large ready/used cards;
- Mastery panel: condition and “Earned” action if not already unlocked;
- quick note and activity/Undo drawer;
- **End Game** button protected from accidental taps.

A “minimal table view” hides optional HP/villain controls and leaves only campaign-required tracking.

## Debrief flow

1. Choose **Win**, **Hero defeated**, **Main scheme completed**, **Other loss**, or **Abandoned**.
2. Confirm objective status. If it was already recorded, show locked earned state.
3. Confirm newly earned Mastery, with idempotent check.
4. Preview all deltas before saving:
   - Intel change and unlocks;
   - Network change and newly active adaptations;
   - Scar change;
   - flag and aspect record;
   - official matchup clear when applicable.
5. Commit debrief as one transaction.
6. Read the appropriate authored result narrative.
7. Move to Interlude/Recovery/finale/next issue according to source state.

## Interlude and recovery flow

The choice is presented as two opposing full-width comic panels. Each panel clearly shows the future help and future cost. The player confirms the choice, then sees an Act Recovery calculation with both conditions shown independently. One action commits choice and recovery events in source order.

## Finale flow

Before Issue 15, show Final Preparation points derived from four named flags. During setup, each spend is recorded against one of three authored options. After the debrief, resolve an ending. If the source’s undefined branch occurs, show a neutral “Campaign author decision required” panel with the exact criteria and preserve the completed save.

## Error and recovery states

- **Interrupted write:** reopen last valid event sequence; offer retry.
- **Invalid import:** identify schema/migration errors without partially importing.
- **Definition version mismatch:** migrate a copy; retain original backup.
- **MarvelCDB unavailable:** use bundled bilingual reference and hide remote imagery.
- **Remote image fails:** replace with metadata panel, never broken-image chrome.
- **Storage quota:** prompt export, then allow cleanup; never silently discard a save.
- **Cloud conflict:** retain both branches until deterministic merge or user choice.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


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



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


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

![Append-only event and snapshot integrity model](docx-assets/event-integrity.png){width=5.3in}

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



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 05 — Content, localization, and card reference

## Source content policy

The campaign DOCX is the authority for narrative and full setup wording. The Quickplay Companion supplies condensed table guidance and the recommended aspect route. The journey tracker supplies the bilingual card index, extended collection reference, and log fields.

The app bundles the campaign’s original fan-authored text and machine-readable rules. It does not bundle full official card text or images.

## Language model

Use two independent settings:

```ts
uiLanguage: 'en' | 'es'
physicalCardLanguage: 'en' | 'es' | 'both'
```

Current content availability:

| Content | English | Spanish |
|---|---:|---:|
| App chrome | Required | Required |
| Campaign narrative | Source available | Not in source |
| Campaign setup/objectives | Source available | Not in source |
| Hero/villain/modular names | Source available | Source available |
| Signature card names | Source available | Source available |
| 359-row collection card names | Source available | Source available |

Spanish UI may therefore display English campaign paragraphs with a compact **English source text** badge until an approved translation is added. Never silently machine-translate stored campaign content and present it as authored.

## Name display

Examples:

- English: `Under Attack`
- Spanish physical: `Civiles en peligro`
- Both: `Under Attack · Civiles en peligro`

Preserve the tracker’s official/localized spelling, even when it is not a literal translation. Search normalizes accents and punctuation but display does not.

## Stable identity rules

Do not key cards by collector number alone. Use:

```text
(pack or pack_code, collector_number, side/code)
```

The export includes a local `record_id` and optional MarvelCDB code. Core codes are derived from the documented pattern and are marked for API fixture verification.

## Campaign issue matrix

| # | Issue | Hero | Villain | Modular | Tier | Recommended aspect | Flag |
|---:|---|---|---|---|---|---|---|
| 01 | The Break-In | Spider-Man | Rhino | Bomb Scare | Standard | Protection | BOMB DEFUSED |
| 02 | Sound Money | Captain Marvel | Klaw | Masters of Evil | Standard | Leadership | MASTERS BROKEN |
| 03 | Machine In The Static | She-Hulk | Ultron | Under Attack | Standard | Aggression | DRONE SAMPLE |
| 04 | Mind Over Metal | Iron Man | Rhino | The Doomsday Chair | Standard | Justice | M.O.D.O.K. PROFILED |
| 05 | The Vibranium Trail | Black Panther | Klaw | Legions of Hydra | Standard | Justice | HYDRA LEDGER |
| 06 | Echo Chamber | Spider-Man | Klaw | Under Attack | Veteran | Justice | SONIC KEY |
| 07 | City Of Drones | Captain Marvel | Ultron | Bomb Scare | Veteran | Aggression | EVACUATION COMPLETE |
| 08 | Hard Case | She-Hulk | Rhino | Legions of Hydra | Veteran | Leadership | RHINO CONFESSION |
| 09 | Counterfrequency | Iron Man | Klaw | Masters of Evil | Veteran | Aggression | FIREWALL STABLE |
| 10 | The Vibranium Protocol | Black Panther | Ultron | The Doomsday Chair | Veteran | Aggression | VIBRANIUM SECURED |
| 11 | Hostile Witness | She-Hulk | Klaw | The Doomsday Chair | Expert | Justice | WITNESS PROTECTED |
| 12 | Siege Protocol | Black Panther | Rhino | Bomb Scare | Expert | Protection | EMBASSY SECURED |
| 13 | Terminal Velocity | Captain Marvel | Rhino | Under Attack | Expert | Justice | SKYLINE HELD |
| 14 | The Last Neighborhood | Spider-Man | Ultron | Masters of Evil | Expert | Leadership | CITY SAVED |
| 15 | The Ultron Directive | Iron Man | Ultron | Legions of Hydra | Expert | Leadership | CLEAN SHUTDOWN |

## Card-data layers

1. **Bundled local reference** — names, pack, number, category, set, and source links from the tracker. Required offline.
2. **MarvelCDB normalized metadata** — optional live/cached enhancement.
3. **External image reference** — optional and separately gated; never required for functionality.
4. **User-provided image base** — optional private configuration for a user who has a lawful local source. Never synchronized by default.

## Search behavior

- Unicode normalize and remove combining diacritics for index terms.
- Tokenize hyphens, apostrophes, periods, and exclamation marks.
- Rank exact English/Spanish name, prefix, set, then fuzzy token match.
- Accept common punctuation variants such as `MODOK` and `M.O.D.O.K.`.
- Show pack and collector number to disambiguate duplicate characters.
- Allow filtering by owned pack, category, set, language, and campaign relevance.

## Content editing workflow

1. Modify a versioned source/translation file.
2. Update campaign definition or bilingual reference.
3. Run schema validation and source checklist.
4. Generate a human-readable diff focused on issue setup, objectives, rewards, and endings.
5. Bump content version separately from application version.
6. Add a migration only when identifiers or behavioral semantics change.

## Full Spanish translation extension

Add `translations/core-protocol.es.json` keyed by stable content IDs. Require translator attribution and reviewer approval. Missing keys fall back to English. A translation may not change thresholds, flags, timing, or objectives.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 06 — Comic-book design system

## Creative direction

The interface should evoke a premium comic issue without copying Marvel’s brand system. The visual language comes from original inked borders, panel rhythm, paper texture, halftone fields, caption boxes, speed-line accents, and offset shadows. Official card imagery, when separately enabled, appears as referenced game material inside the app—not as the app’s identity.

The design has two layers:

- **Expressive shell:** covers, issue cards, act transitions, result reveals, achievement moments.
- **Quiet play surface:** setup checklists, counters, rules reminders, and forms.

## Core palette

Use `design/tokens.json` as the machine-readable source.

- Ink: near-black.
- Navy: primary structural panels.
- Crimson: danger, villain pressure, destructive actions.
- Gold: Intel, unlocks, focus.
- Warm paper: background.
- Muted sky: informational surfaces.
- Green: confirmed success.

Never rely on color alone. Pair every state with iconography, labels, shape, and text.

## Typography

- Display: comic-inspired open font only for short titles and badges.
- UI: highly legible sans serif.
- Narrative: sturdy slab/serif for “Previously…” and result prose.
- Mono: IDs, debug panels, and import diagnostics.

Do not use display lettering for paragraph text, labels below 14 px, or long all-caps strings. Respect user font scaling.

## Signature components

### Issue Cover

Large issue number, title, hero/villain text, act color band, and one primary action. Use original abstract line work when card images are disabled.

### Caption Box

Gold rectangular label with ink border for `PREVIOUSLY`, `OBJECTIVE`, `CONTINUITY`, and `DEBRIEF`.

### Comic Panel

3 px ink border, small corner radius, 4 px offset shadow, warm paper surface. Interactive panels visibly depress by reducing the shadow offset rather than using a large scale animation.

### Track Meter

Segmented Intel/Network meter with threshold markers, current numeric value, next unlock/adaptation, and text alternative.

### Scar Chip

Torn-edge or diagonal badge labeled `SCAR 1/2`. Never show only a red mark.

### Field Asset Tile

Original campaign-reference layout, not an official card frame. Shows unlock tier, effect, ready/used state, and once-per-game label.

### Setup Stepper

Numbered vertical panels grouped by setup phase. Each checkbox includes who performs the action: **App**, **Player**, or **Physical game**.

### Counter Control

Large minus/value/plus row, optional direct edit, haptic feedback where available, and Undo toast. Clamp only where the source defines a bound.

### Speech Bubble Help

Use sparingly for contextual help. Never put essential rules only in a speech bubble or tooltip.

### Result Splash

`VICTORY`, `HERO DEFEATED`, or `SCHEME COMPLETE` may use a brief impact animation, immediately followed by calm consequence review.

## Texture implementation

Prefer CSS gradients and SVG patterns generated by the application:

```css
.halftone {
  background-image: radial-gradient(currentColor 0.7px, transparent 0.8px);
  background-size: 6px 6px;
  opacity: 0.08;
}
```

Keep decorative layers `aria-hidden`, pointer-events none, low contrast, and excluded from print/export. Do not ship copied comic panels or trademarked logos.

## Motion

- Standard panel transition: roughly 200 ms.
- Counter feedback: brief and non-blocking.
- Act transition: optional page-turn/speed-line effect.
- Reduced motion: remove transforms, shakes, parallax, confetti, and page turns; use opacity changes only.
- Never delay a critical action for animation.

## Responsive behavior

### Phone portrait

Single column; sticky bottom action; compact campaign tracks; cards as horizontal metadata rows unless user opens a preview.

### Phone landscape / foldable tabletop

Two-column play view: objective and assets on the left, counters and notes on the right. Avoid content in hinge/fold unsafe area.

### Tablet

Three zones: persistent campaign rail, central play panel, secondary reference drawer. Suitable for keeping open beside the board.

### Desktop

Centered max-width content with side activity log. Do not stretch paragraphs across the full viewport.

## Accessibility details

- 4.5:1 minimum text contrast; 3:1 for large display text and UI boundaries where applicable.
- Visible focus ring not hidden by ink borders.
- Status announcements through polite live regions.
- Counter buttons have explicit names: “Increase Drone Rescue counter to 4.”
- Decorative punctuation and onomatopoeia hidden from screen readers.
- Every card thumbnail has concise alt text: name, pack, collector number—not full card text.
- Dark mode remains warm and avoids pure white text on pure black.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 07 — Technical architecture

## Chosen architecture

A Next.js App Router application provides a static/offline-capable shell plus small server boundaries for external metadata and optional sync. The core product is local-first; the server is an enhancement, not a dependency.

## Layer diagram

![Recommended application architecture](docx-assets/architecture.png){width=6.7in}

```text
UI / App Router
  ├── Server-rendered shell and content
  └── Client islands: counters, forms, IndexedDB, install/offline status
          ↓
Application services
  ├── prepareIssue
  ├── startSession
  ├── completeObjective
  ├── completeIssue
  ├── applyRecovery
  └── export/import
          ↓
Pure domain
  ├── reducer
  ├── invariants
  ├── selectors
  ├── setup plan composer
  └── ending resolver
          ↓
Ports
  ├── SaveRepository
  ├── CardCatalog
  ├── SyncAdapter
  └── Clock/IdFactory
          ↓
Adapters
  ├── IndexedDB
  ├── MarvelCDB route handlers
  └── optional Supabase
```

## Next.js conventions

- App Router only.
- Server Components by default.
- Client components cannot be async and must receive serializable props.
- Await modern async request APIs such as `params`, `searchParams`, `cookies()`, and `headers()` where the selected Next.js version requires it.
- Use Route Handlers for `/api/cards/**` and optional sync.
- Default Route Handlers to Node.js runtime.
- Add `error.tsx`, `not-found.tsx`, and global error handling.
- If the selected Next.js release uses `proxy.ts` rather than `middleware.ts`, follow that convention; do not add either unless authentication/routing needs it.
- Use `next/image` for original UI imagery. For externally hosted card imagery, use `next/image` with `unoptimized` and the direct upstream URL so the application does not create an optimization cache or proxy; keep it disabled until the rights gate passes.
- Configure remote hosts narrowly, not with wildcards.

## Suggested repository structure

```text
src/app/
  layout.tsx
  manifest.ts
  (shell)/campaigns/...
  reference/cards/...
  api/health/route.ts
  api/cards/search/route.ts
  api/cards/[code]/route.ts
src/domain/
  reducer.ts
  commands.ts
  selectors.ts
  invariants.ts
  ending-resolver.ts
  setup-plan.ts
  objective-machine.ts
src/application/
  campaign-service.ts
  import-service.ts
src/storage/
  db.ts
  save-repository.ts
  migrations/
src/integrations/marvelcdb/
  client.ts
  normalize.ts
  cache.ts
  fixtures/
src/content/
  core-protocol.v1.1.json
src/components/comic/
src/components/campaign/
src/components/play/
src/i18n/
src/styles/
scripts/
tests/
```

## Local persistence

Use IndexedDB through a small repository abstraction. Suggested stores:

- `campaign_saves` — metadata and latest validated snapshot;
- `campaign_events` — compound key `[saveId, sequence]`;
- `deck_logs`;
- `rules_logs`;
- `settings`;
- `metadata_cache` — normalized MarvelCDB JSON only, not images;
- `migration_backups` — bounded temporary copies.

Write event and snapshot in the same transaction. Compute a checksum over canonical JSON to detect corruption. Keep at least one prior snapshot for recovery.

## PWA and offline

Precache only:

- application shell;
- original UI assets;
- campaign definition and Schemas;
- bundled bilingual card-name index;
- localization strings.

Never precache remote card images, MarvelCDB card text corpus, or deck pages. Use a network-first strategy with bounded metadata cache for API responses and a metadata-only fallback.

Provide:

- install prompt only after meaningful engagement;
- offline badge;
- update-available banner with save-safe reload;
- keep-awake option using the Screen Wake Lock API with graceful fallback;
- storage persistence request where supported.

## State management

The event/snapshot repository is the source of truth. A lightweight client store may hold the currently open snapshot and ephemeral view state. Do not keep a second independent campaign rules implementation in UI state.

## Error model

Use typed domain errors:

- `INVALID_PHASE`
- `ILLEGAL_ASPECT`
- `ASSET_LOCKED`
- `ASSET_LIMIT_EXCEEDED`
- `DUPLICATE_REWARD`
- `RECOVERY_ALREADY_APPLIED`
- `FINAL_PREP_OVESPEND`
- `OUT_OF_ORDER_EVENT`
- `CONTENT_VERSION_MISMATCH`
- `UNRESOLVED_ENDING`

Present user-facing recovery actions; log technical detail locally only with consent for external diagnostics.

## Observability

No analytics by default. Development builds may expose a local diagnostics panel: app version, content version, save schema, latest sequence, storage state, service-worker version, API freshness, and image kill-switch state. Never log card/deck content or user notes to a remote service without consent.

## Deployment

Target Vercel-compatible output, while keeping the app portable. The local-only core can be statically rendered except for route handlers. Environment variables determine optional metadata, images, sync, diagnostics, and beta indexing. Production build must succeed with all secrets absent and images disabled.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 08 — Data, API, and MarvelCDB integration

## Integration posture

MarvelCDB is an optional external metadata service. Its official API page states that the API is intended for deckbuilders, card databases, tournament managers, and other tools complementary to playing Marvel Champions. It exposes public endpoints, asks clients to respect HTTP caching, and provides permissive CORS for public responses. The English and Spanish sites each expose the API.

This is technical permission to query a public service, not a copyright license for all content or images. The application therefore separates metadata, copyrighted card text, and external image display.

Research references, reviewed 2026-09-07:

- `https://marvelcdb.com/api/`
- `https://marvelcdb.com/api/doc`
- `https://es.marvelcdb.com/api/`
- `https://github.com/zzorba/marvelsdb-json-data`

## Public endpoints used

```text
GET {base}/api/public/card/{card_code}.json
GET {base}/api/public/cards/{pack_code}.json
GET {base}/api/public/cards/
GET {base}/api/public/decklist/{decklist_id}.json   (optional)
GET {base}/api/public/faq/{card_code}.json          (optional)
```

Prefer per-card or per-pack requests for the Core Protocol screen. Do not download the full corpus on each request.

## Locale hosts

```text
English: https://marvelcdb.com
Spanish: https://es.marvelcdb.com
```

The adapter accepts a configured base URL rather than constructing locale subdomains internally. This supports testing and future mirrors.

## Adapter interface

```ts
interface CardCatalog {
  search(query: CardSearchQuery): Promise<CardSearchResult>;
  getCard(code: string, locale: 'en' | 'es'): Promise<CardDetail | null>;
  getPublicDecklist?(id: number): Promise<PublicDecklist | null>;
}
```

Normalize only fields the UI needs. Preserve raw JSON in short-lived server cache for debugging but do not expose unknown HTML.

## Normalized image handling

The API may return `imagesrc`, `backimagesrc`, or linked-side image fields. The adapter:

1. accepts only `https` or same-host relative paths;
2. resolves relative paths against the configured MarvelCDB host;
3. checks the exact host allowlist;
4. returns an external URL only when both image flags are enabled;
5. marks `mayCache: false`;
6. never fetches the binary server-side;
7. handles missing alter-ego/back images without deriving an undocumented path.

Do not hardcode `/bundles/cards/{code}.png` as the sole strategy. Use API fields and fixture tests.

### Code-suffix cases already identified

The upstream JSON uses suffixed codes for identity sides (`01001a`/`01001b`, and equivalent pairs for the other Core heroes) and four resource variants for Wakanda Forever! (`01043a` through `01043d`). The bundled card index records these as a primary code plus alternate codes. Other generated Core codes remain candidates until fixture verification; never strip or invent a suffix during image lookup.

## Caching

- Honor upstream `Cache-Control`, `ETag`, and `Last-Modified` when present.
- Set a conservative application freshness window, then revalidate.
- Identify requests with a descriptive User-Agent and project contact.
- Deduplicate concurrent requests.
- Use exponential backoff for transient failures; do not retry an obvious not-found indefinitely.
- Cap normalized metadata storage and expose “last updated” status.
- Cache authenticated data nowhere until OAuth is explicitly designed.

## Fixture-first implementation

Before enabling external metadata:

1. Capture one English and one Spanish Core pack response in development.
2. Store small redacted test fixtures containing representative hero, villain, side scheme, double-sided card, missing-image, and accented-name cases.
3. Verify every entry in `data/core-protocol-card-anchors.json` against fixtures or a controlled validation script.
4. Update `match_status` to verified in generated app data.
5. Keep live API tests out of normal CI; use contract fixtures.

Do not commit the entire upstream card corpus solely for tests.

## Search merge

The bundled tracker index is the base. Merge optional MarvelCDB data by verified code:

```text
local name/pack/collector record
  + verified MarvelCDB code
  + localized live metadata
  + optional external image URL
```

If code resolution is uncertain, display the local record and no image. Never use fuzzy matching alone to select a card image silently.

## API surface

`api/openapi.yaml` defines:

- health/status;
- normalized card search;
- normalized card lookup;
- optional public decklist lookup;
- optional event sync.

There is intentionally no image-proxy endpoint.

## Rate and failure behavior

- A setup screen may prefetch only its small list of anchored cards.
- Search waits for a short debounce and cancels stale queries.
- On rate limit or outage, show local results instantly and a non-blocking “live details unavailable” notice.
- Never prevent issue setup or debrief because MarvelCDB is unavailable.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 09 — Card images, rights, and fan-project controls

## Important conclusion

Do not describe MarvelCDB as a “fair use database,” and do not treat noncommercial status as automatic permission. MarvelCDB’s API page explicitly notes that card texts are copyrighted by Fantasy Flight Games. The U.S. Copyright Office explains that fair use is fact-specific, balances four factors, and has no fixed safe percentage. A public fan project can reduce risk through purpose, context, amount, market impact, and operational restraint, but only a qualified lawyer or the relevant rights holders can provide project-specific assurance.

This document is product risk guidance, not legal advice.

## Design precedent versus license

Fantasy Flight Games has officially run Marvel Champions custom-campaign contests that invited fans to create campaigns using existing content and campaign logs. That is useful design precedent. The contest guidance and rules do not amount to a general license to redistribute card images or official content in an unrelated web application.

References reviewed 2026-09-07:

- MarvelCDB API: `https://marvelcdb.com/api/`
- FFG campaign contest: `https://www.fantasyflightgames.com/en/news/2024/11/1/a-clash-of-campaigns/`
- U.S. Copyright Office fair-use overview: `https://www.copyright.gov/fair-use/more-info.html`

## Required technical posture

![Card-metadata and optional remote-image rights gate](docx-assets/rights-gate.png){width=6.7in}

### Repository and build

- Store no official card-image binary in Git, Git LFS, `public/`, test snapshots, storybook fixtures, database seeds, or deployment artifacts.
- Store only card identifiers, metadata, and external URLs.
- Add a CI script that scans extensions, MIME signatures, and generated manifests.
- Keep images off by default in `.env.example` and production preview environments.

### Runtime

- Render externally hosted card images only in the context of setup/reference, not as a downloadable gallery.
- Use direct remote URLs; do not proxy through the application or an optimizer cache.
- Do not include images in service-worker runtime caching.
- Use modest display dimensions and lazy loading.
- Provide metadata-only fallback at equal functional quality.
- Add a global kill switch that stops all image requests without a redeploy where feasible.
- Do not expose image download, zoom-to-original, bulk export, print sheet, or offline pack features.

### Product presentation

- State that the project is unofficial, noncommercial, and requires the physical game.
- Attribute Marvel Champions, Marvel characters, card art, and marks to their respective owners without implying endorsement.
- Use an original app logo and original UI textures.
- Avoid placing “Marvel” or the official game logo as the dominant app brand.
- Include a visible rights/contact page and a documented takedown workflow.
- Do not run advertising, subscriptions, sponsorship gates, or donations tied to card imagery without a new legal review.

## Launch gate

Before public card images are enabled:

1. Review current MarvelCDB terms and contact the operator with the project description, domains, request volume, caching behavior, and intended image presentation.
2. Request written confirmation about hotlinking or other acceptable image use.
3. Review FFG/Asmodee and Marvel/Disney fan-content or trademark guidance that applies at launch.
4. Obtain qualified legal review appropriate to hosting jurisdiction and expected audience.
5. Record the decision, date, scope, and conditions in the repository.
6. Verify kill switches and no-cache behavior in production.

If any step is unresolved, ship metadata-only mode. The companion remains complete without images.

## Suggested fan notice

Use the fuller version in `legal/FAN_PROJECT_NOTICE.md`. Keep the notice factual and avoid claiming that the project’s use is legally “fair use” as a settled conclusion.

## Takedown handling

- Publish one contact address.
- Acknowledge reports and capture the specific URL/material.
- Disable remote images globally first if a credible issue is raised.
- Preserve logs needed to understand the report, without republishing the material.
- Remove or change disputed use promptly where appropriate.
- Document the resolution in a private operations log.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 10 — Security, privacy, offline behavior, and sync

## Privacy baseline

- No account required.
- No telemetry, advertising identifiers, or third-party analytics by default.
- Campaign notes and logs remain on the device unless the user explicitly enables sync.
- Settings disclose which external requests occur: app host, optional MarvelCDB metadata/images, optional Supabase, optional diagnostics.
- Provide export and delete controls without contacting support.

IndexedDB is not encrypted storage. Do not claim encryption at rest. Avoid collecting sensitive personal data; the campaign does not need it.

## Threat model

Primary risks:

- malformed or oversized imported backup;
- stored XSS through notes or external metadata;
- supply-chain compromise;
- cross-user access in optional cloud sync;
- event sequence conflicts or replay;
- storage corruption/quota exhaustion;
- unapproved external card-image requests;
- secrets accidentally exposed to the client.

## Input handling

- Treat campaign notes, deck names, imported logs, and MarvelCDB text as plain text.
- Never render source HTML with `dangerouslySetInnerHTML`.
- Limit field lengths and backup size before parsing.
- Validate every import with schema and semantic invariants.
- Strip prototype-pollution keys and reject unknown dangerous structures.
- Validate external URLs and restrict protocols to `https` except local development.
- Do not import executable content, CSS, SVG, or image data from backups.

## Browser security

Set a restrictive Content Security Policy. When images are disabled, `img-src` should include only self/data for original assets. When remote mode is enabled, add only exact approved MarvelCDB hosts. Keep `connect-src` limited to the app, metadata hosts, and optional Supabase.

Use standard protections:

- `frame-ancestors 'none'` unless embedding is explicitly required;
- `base-uri 'self'`;
- `form-action 'self'`;
- secure, same-site cookies if auth is added;
- no secrets in `NEXT_PUBLIC_*` variables;
- dependency and lockfile scanning in CI.

## Offline behavior

Offline-capable:

- all campaign content and narrative;
- create/open saves;
- setup, play, debrief, Interludes, finale, mirrors;
- bilingual bundled card search;
- deck/rules logs;
- backup export/import.

Online-only enhancements:

- live MarvelCDB metadata and external images;
- public decklist import;
- cloud sync;
- remote diagnostics.

The UI must state which layer is unavailable without implying data loss.

## Local backups

- Auto-export reminders may be offered but never nag during active play.
- Include a content/save manifest and checksum.
- Exports are plain JSON so users retain control.
- Optional future encrypted backups require a passphrase and established browser cryptography; do not invent custom encryption.

## Cloud sync model

Cloud sync is event-based and opt-in.

- Authenticate with Supabase Auth or equivalent.
- RLS limits saves/logs to the owner.
- Events are append-only and idempotent by `clientMutationId`.
- The client sends its base sequence and new events.
- Server rejects gaps/conflicts with 409.
- Non-conflicting events may merge by canonical sequence.
- Conflicting decisions—such as two Interlude choices—require branch selection; never last-write-wins silently.
- Save a local copy before replacing state from cloud.

## Service worker update safety

- Never activate a new worker in the middle of a transaction.
- Notify when an update is ready.
- Flush current IndexedDB writes before reload.
- Run save migrations after app update and keep rollback backup.
- Exclude remote card images from cache storage and cache manifests.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 11 — Testing and acceptance

## Test pyramid

### Domain unit tests

Use table-driven tests with no browser or database.

Required cases:

- each result’s Intel/Network/Scar delta;
- Scar floor/ceiling and removal on win;
- objective persists after loss;
- first Mastery adds one Intel; duplicate adds zero;
- all five Intel unlock thresholds;
- Field Asset limit at Network 5 versus 6;
- Endgame Protocol legality and extra slot;
- cumulative Network thresholds 2/4/6/8/10;
- Strike the Core suppresses only the highest adaptation through round 1;
- both Act Recovery conditions independently and together;
- Recovery floor at zero and one-time application;
- Aspect Passport for all five heroes;
- first Mirror fourth aspect;
- Final Preparation 0–4 points, repeated spend options, overspend rejection;
- all four defined endings;
- undefined low-Network/low-Mastery win returns `needs_author_decision`;
- THE INITIATIVE positive and negative criteria;
- Canon Mode retries retain loss consequences and do not advance;
- fail-forward losses advance;
- event replay equals stored snapshot;
- duplicate client mutation is idempotent;
- out-of-order event rejected.

### Content tests

- JSON Schema validation.
- Exactly 15 issues and 20 mirror rows.
- Every issue number, hero, villain, modular set, tier, aspect route, and flag matches a golden fixture.
- Setup bullet order matches source extraction.
- All card anchors resolve uniquely.
- No undefined IDs.
- No Spanish narrative falsely marked as source translated.

### Storage tests

- Atomic event + snapshot transaction.
- Browser termination simulation between actions.
- Quota error leaves prior valid state.
- Migration from each historical schema fixture.
- Export/import round trip preserves canonical JSON state.
- Invalid/oversized import writes nothing.

### Integration tests

- MarvelCDB English and Spanish fixture normalization.
- Relative image URL handling.
- missing `imagesrc` fallback.
- cache hit, stale revalidation, 304, timeout, rate limit, and outage.
- images disabled returns no external URL and causes no image request.
- optional sync idempotence and conflict responses.

### Component tests

- setup stepper state and keyboard operation;
- counter accessible names and bounds;
- Field Asset ready/used state;
- objective record confirmation;
- debrief preview and duplicate reward display;
- bilingual name modes;
- reduced-motion variants;
- error/empty/offline states.

## End-to-end scenarios

### E2E-01 — First issue, offline

Create a fail-forward save, choose Spanish physical names, select Spider-Man Protection, prepare Issue 1, complete setup, start play, record BOMB DEFUSED, end with a win, verify Intel and result narrative, terminate/reopen, and confirm state.

### E2E-02 — Objective survives loss

In Issue 3, reach four Drone Samples, commit the flag/Mastery, then lose by hero defeat. Verify objective and Mastery remain, Network +1, She-Hulk Scar +1, no win Intel, and next issue available in fail-forward.

### E2E-03 — Network 6 safety valve

Reach Network 6, verify Prepared Ambush appears after opening hand and two Field Asset slots are available. Confirm no third normal asset can be selected.

### E2E-04 — Both Act Recovery components

Complete an Act with at least three objectives and two or fewer wins. Verify Network decreases by two to a minimum of zero and cannot be applied twice.

### E2E-05 — Issue 15 Strike the Core

With multiple adaptations active, verify only the highest is suppressed for round 1, returns in round 2, Final Preparation cannot overspend, and Endgame Protocol occupies its special slot.

### E2E-06 — Undefined finale branch

Win Issue 15 with Network 0–3 and fewer than four Masteries. Verify the save completes, no wrong narrative is shown, and an author-decision panel appears.

### E2E-07 — Mirror aspect rule

Start Mirror Protocol, verify campaign tracks reset, select each hero’s fourth aspect for first mirror, and reject a used aspect.

### E2E-08 — API outage

Block MarvelCDB requests. Verify issue setup, local card search, and debrief remain complete; thumbnails become metadata panels.

### E2E-09 — No image leakage

Run with images off and inspect requests, Cache Storage, IndexedDB, build output, and export. No official card-image URL or binary may appear.

### E2E-10 — Accessibility

Complete onboarding, preparation, live objective counter, and debrief using keyboard and screen-reader landmarks. Run automated axe checks and manual reduced-motion review.

## Performance and resilience acceptance

- No campaign action waits for a network call.
- Counter tap updates immediately and persists without noticeable lag.
- App reopens to the correct active session after forced close.
- Long narrative does not cause layout shifts once rendered.
- Card-search typing remains responsive with 359 bundled records and a future larger collection.
- Service-worker update cannot erase or downgrade a save.

## Release gates

- Lint, strict typecheck, unit tests, content validation, production build, E2E smoke, and accessibility checks pass.
- Source checklist signed.
- No-card-image scanner passes.
- Fan notice and contact are present.
- Card-image mode remains off unless the separate legal/permission gate is signed.
- No unresolved severity-one defect in save durability, reducer correctness, import, or setup ordering.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 12 — Delivery backlog

The backlog is ordered by dependency and risk, not calendar estimates.

## Epic 0 — Repository and quality foundation

- Scaffold App Router, strict TypeScript, linting, formatting, Vitest, Playwright, and CI.
- Record dependency decisions and runtime requirements.
- Add content/schema validation and no-card-image scanner.
- Copy design tokens and source definition into the app.
- Create ADR templates and contributor guidance.

**Exit:** clean production build and failing placeholder tests for every core domain rule.

## Epic 1 — Campaign engine

- Implement types, invariant errors, event reducer, selectors, command layer, setup-plan composer, objective state machine, ending resolver, and Mirror logic.
- Build golden tests covering every source threshold and issue rule.
- Create deterministic IDs/clock ports for tests.

**Exit:** full campaign can be simulated in tests from creation to finale and through all mirrors.

## Epic 2 — Local data durability

- IndexedDB schema and repository.
- Atomic event/snapshot transactions.
- autosave/recovery;
- migrations;
- export/import;
- multiple saves;
- compensating Undo;
- quota/corruption recovery.

**Exit:** save survives reload, forced close, migration fixtures, and export/import round trip.

## Epic 3 — Comic UI primitives and shell

- App shell, navigation, theme, typography, panel, caption, meter, badges, controls, dialog, toast, offline/update status.
- Accessibility and responsive baselines.
- Original abstract issue-art treatment for image-off mode.

**Exit:** component gallery passes keyboard, contrast, touch, and reduced-motion review.

## Epic 4 — Vertical slice: Issue 1

- Onboarding and save creation.
- Dashboard.
- Aspect and Field Asset preparation.
- setup stepper;
- table mode;
- objective/Mastery actions;
- debrief;
- result narrative;
- persistence and offline install.

**Exit:** E2E-01 and no-network flow pass.

## Epic 5 — Full story systems

- All tracker types.
- Scars, thresholds, adaptations, assets.
- Issues 2–15 from data.
- Interludes and Recovery.
- Final Preparation.
- finale and epilogue.
- Canon Mode retries.

**Exit:** all domain and story E2E cases pass, including undefined finale branch.

## Epic 6 — Journey and reference

- Hero Passport.
- objective flags and Masteries.
- official completion matrix.
- Mirror Protocol.
- deck log and rules log.
- bundled bilingual card search.

**Exit:** 35-game completion logic and tracker parity pass.

## Epic 7 — MarvelCDB metadata

- English/Spanish fixture capture.
- card-anchor reconciliation.
- route handlers and normalization.
- caching/revalidation.
- search merge and outage fallback.
- public decklist link/import if retained.

**Exit:** metadata works without changing core behavior and all external failures degrade cleanly.

## Epic 8 — Optional external images

This epic is blocked by `legal/CARD_IMAGE_LAUNCH_CHECKLIST.md`.

- remote URL validation;
- direct unoptimized display;
- kill switches;
- no-cache tests;
- metadata fallback;
- operations contact/takedown controls.

**Exit:** rights gate signed and E2E-09 passes. Otherwise close epic as intentionally disabled.

## Epic 9 — Optional cloud sync

- Auth.
- SQL migration and RLS.
- event push/pull.
- conflict handling.
- offline queue.
- account export/delete.

**Exit:** local-only mode remains first-class and conflict tests prove no silent data loss.

## Post-MVP candidates

- Approved Spanish campaign translation.
- Campaign definition editor and validation UI.
- Importable campaign packs with explicit license metadata.
- Additional owned collection support and deck legality hints.
- Session analytics stored locally.
- Shareable progress card generated only from original UI elements and user data.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 13 — Source traceability and open decisions

## Source files

| Source | Used for |
|---|---|
| `Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx` | Full campaign premise, rules, progression, narrative, setup, objectives, endings, mirrors, optional modes, and campaign log |
| `Core_Protocol_v1.1_Quickplay_Companion(1).docx` | Condensed setup reference and recommended aspect route |
| `Core_Protocol_v1.1_Quickplay_Companion(1).pdf` | Visual/print companion reference and page-level QA |
| `marvel_champions_journey_tracker_v2_core_protocol(1).xlsx` | Bilingual 359-row card index, collection model, progress/deck/rules fields, and spreadsheet formula cross-check |

## Rule traceability

| Domain rule | Source location |
|---|---|
| 15 story + 20 mirrors | Campaign Dossier → Campaign Structure; Mirror Protocol |
| Setup order | Campaign Dossier → Core Loop → Setup Order |
| Aspect Passport | Campaign Dossier → Deckbuilding → Aspect Passport; Quickplay recommended route |
| Intel/Network/Scars | Persistent State → Campaign Tracks |
| Act Recovery | Campaign Tracks and both Interludes |
| Adaptations | Difficulty Pressure → Network Adaptations |
| Field Assets | Campaign Rewards → Field Assets |
| Masteries | Hero Development → Hero Mastery |
| Issue content | Issue 01 through Issue 15 tables |
| Final Preparation | Act III → Final Preparation |
| Endings | Finale → Campaign Endings |
| Mirror rows | Post-Campaign → Mirror Protocol |
| Bilingual names | Reference → English ↔ Spanish; tracker Card Reference sheet |

## Source-derived versus product design

### Source-derived

- campaign content, order, thresholds, flags, choices, consequences, endings, and mirrors;
- true-solo format and Core Set requirement;
- recommended aspect route;
- bilingual official/localized card names present in source;
- tracker/log field inventory.

### Product design added for implementation

- event-sourced save model;
- IndexedDB/local-first architecture;
- optional Supabase sync;
- page routes and navigation;
- live optional HP/threat counters;
- PWA/offline behavior;
- comic design tokens and component system;
- MarvelCDB adapter, cache strategy, and rights kill switches;
- accessibility, security, testing, and CI requirements.

These additions must not alter the authored campaign rules.

## Open decision OD-001 — Undefined ending branch

**Source state:** The finale says a win with Network 0–3 earns **Avengers Assemble** only with at least four Mastery stars. It defines **Machine Broken** for Network 4–6 and **Pyrrhic Shutdown** for 7+, but no ending for Network 0–3 with zero to three Masteries.

**Safe implementation:** `resolveEnding()` returns `needs_author_decision`, displays the criteria, and preserves completion. Do not fall through to Machine Broken or Avengers Assemble.

**Author decision needed:** add a fallback ending or broaden an existing criterion in a future campaign content version.

## Open decision OD-002 — Full Spanish narrative

The source includes bilingual names but not a complete Spanish narrative/setup translation. English fallback is required. A future translation needs an approved source, attribution, review, and a content-only version bump.

## Open decision OD-003 — Public card imagery

Public API availability and noncommercial intent do not settle image rights. Production images remain disabled until the launch checklist is complete. Metadata-only mode is the release-safe default.

## Open decision OD-004 — Canon Mode aspect changes on retries

The source defines replay-until-win but does not state whether aspect choice may change between retries. Proposed safe UX: allow changing with a warning; record every attempt; stamp the main-story Aspect Passport from the winning/committed issue result. This should be approved or changed before Canon Mode leaves beta.

## Open decision OD-005 — “Other loss” consequences

The source quantifies hero defeat and main-scheme completion only. For a card-specific loss or abandoned game, default to no automatic track change and require explicit review. Do not map it silently to main-scheme loss.

## Open decision OD-006 — Issue 11 trigger semantics

The authored text says “The first time Defense Network leaves play.” The companion should reproduce that phrase and ask the player to confirm the trigger. It should not reinterpret why or how the side scheme left play.

## Open decision OD-007 — Future Rise of Red Skull scope

The tracker includes Core Set and The Rise of Red Skull, but Core Protocol itself requires only the Core Set. The architecture supports more packs and campaigns; the MVP must not invent Rise of Red Skull campaign content.

## Content change protocol

Every source-level change requires:

1. decision ID and rationale;
2. updated authored document or approved amendment;
3. campaign definition diff;
4. golden test update;
5. content version bump;
6. save migration assessment;
7. Quickplay and tracker parity review.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 14 — Screen and component contracts

This document defines the UI handoff at a level suitable for direct implementation. It complements the information architecture and design system; it does not replace the campaign reducer or duplicate source-derived rules.

## 14.1 Route contract

| Route | Rendering boundary | Required data | Primary action | Required failure states |
|---|---|---|---|---|
| `/` | Server shell + client save list | Local save summaries | Open or create campaign | IndexedDB unavailable, corrupt summary, empty library |
| `/campaigns/new` | Server content + client form | Campaign manifest, modes | Create local save | Definition invalid, storage denied |
| `/campaigns/[saveId]` | Server shell + client snapshot | Valid save + definition | Continue required transition | Save missing, migration required, read-only unknown event |
| `/campaigns/[saveId]/issues/[issueNumber]/prepare` | Server issue content + client plan state | Definition, snapshot, composed setup plan | Confirm setup and start issue | Stale snapshot, illegal issue, missing content reference |
| `/campaigns/[saveId]/play` | Client table surface inside server shell | Active session, reminders, selectors | Update table state / enter debrief | No active session, recovered autosave, write failure |
| `/campaigns/[saveId]/debrief` | Server issue content + client transaction form | Active session and computed consequence preview | Commit result | Already committed, sequence conflict, unresolved input |
| `/campaigns/[saveId]/interlude/[interludeId]` | Server content + client choice | Eligible Interlude and Recovery preview | Commit one choice and Recovery | Not eligible, already chosen, sequence conflict |
| `/campaigns/[saveId]/finale` | Server content + client ending state | Issue 15 result, Network, Intel, Masteries, flags | Resolve ending / acknowledge author gap | `needs_author_decision`, invalid finale history |
| `/campaigns/[saveId]/mirror` | Server table + client filters | Story history, Mirror rows, passport | Start or record a mirror | First-Mirror aspect violation, duplicate record |
| `/campaigns/[saveId]/passport` | Server layout + client filters | Aspect, Scar, Mastery selectors | Inspect hero completion | No special empty state |
| `/cards` | Server shell + client search | Bundled bilingual index, optional API adapter | Find a physical card | Upstream offline, ambiguous match, metadata-only fallback |
| `/decks` | Client log | Local deck records | Add/edit deck log | Invalid external URL, storage failure |
| `/rules` | Client log | Local rules notes | Add/edit note | Personal note not verified, source unavailable |
| `/settings` | Server shell + client preferences | UI settings schema | Save preferences / export data | Unsupported setting migration, export failure |

Dynamic route parameters use the modern asynchronous App Router conventions. Route pages must validate identifiers before loading user state and use `notFound()` only for genuinely absent resources, not for storage or migration failures.

## 14.2 Screen-state rule

Every route implements these states explicitly:

1. **Loading** — stable skeleton preserving final layout dimensions.
2. **Ready** — primary task is obvious without scrolling on a typical phone.
3. **Empty** — explains the next useful action; never a blank panel.
4. **Recoverable error** — retains valid local data and offers Retry, Export, or Open read-only as appropriate.
5. **Fatal content error** — identifies the content path/schema failure and blocks campaign mutation.
6. **Offline** — labels stale remote metadata while keeping campaign play fully functional.
7. **Read-only compatibility mode** — unknown future event or unsupported save version; permit inspection/export, prevent writes.

## 14.3 App shell

### `AppFrame`

Responsibilities:

- safe-area insets and maximum content width;
- global skip link and landmark order;
- responsive bottom navigation on phone, side rail on tablet/desktop;
- offline, migration, and pending-write status;
- no character art or official logo in the shell.

The shell cannot own campaign values. Intel, Network, and current issue are selectors passed from the route boundary.

### `ComicHeader`

Props:

```ts
interface ComicHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  issueNumber?: number;
  tone?: 'neutral' | 'intel' | 'network' | 'danger' | 'success';
  actions?: React.ReactNode;
}
```

The visual angle, halftone, or offset shadow is decorative. DOM reading order remains eyebrow → title → subtitle → actions.

## 14.4 Campaign components

### `IssueCover`

Shows issue number, title, Act, hero, villain, modular set, tier, and recommended aspect. The default cover uses original abstract line work. An external card image is never required for layout integrity.

Required variants: locked, available, in progress, completed win, completed loss, retry required, mirror.

### `TrackMeter`

```ts
interface TrackMeterProps {
  label: string;
  value: number;
  thresholds: Array<{ value: number; label: string }>;
  nextThreshold?: number;
  tone: 'intel' | 'network';
  describedBy?: string;
}
```

The meter must expose the numeric value and threshold text to assistive technology. Color and fill position are redundant cues.

### `AspectPassportGrid`

Inputs are derived passport rows. The component never decides legality. Each hero row shows the four aspects, three story appearances, first-Mirror requirement, Scars, and Mastery. Illegal selections return a reducer error and are announced in a live region.

### `FieldAssetSelector`

Inputs:

- unlocked asset list;
- normal slot limit selector;
- equipped and used IDs;
- optional Endgame Protocol extra slot;
- source effect text.

Disabled assets explain why: insufficient Intel, wrong issue, slot full, or already used. The component does not evaluate timing windows.

### `AdaptationStack`

Displays every active cumulative Network Adaptation in threshold order. A temporarily suppressed adaptation remains visible with its reason and expiry. In-game reminders are pinned in table mode.

### `ScarChip`

Shows 0–2 scars and the resulting starting-dial adjustment. Never states that maximum hit points changed. The chip is read-only outside explicit correction tooling.

## 14.5 Preparation components

### `SetupStepper`

Consumes `ComposedSetupPlan`, not raw prose. It renders groups by phase order and sends only completion UI events; confirmation state is ephemeral until `ISSUE_STARTED` unless the product chooses to persist preparation progress.

Required behavior:

- retain `sourceStep`, `sourceText`, and `includedBecause` in the diagnostics drawer;
- generated global steps are visually distinguished from issue-authored steps;
- conditional steps show the triggering flag, choice, Intel threshold, or Network rule in plain language;
- persistent reminders are copied into the live session, not marked complete;
- a user may return to previous steps without losing selections;
- “Start issue” is disabled until every required confirm/interactive step is resolved.

### `ObjectiveBrief`

Shows objective, flag reward, tracker controls to be enabled, whether a win is required, and when Intel is recorded. It must not imply that the app can observe the physical game.

## 14.6 Table-mode components

### `TableCommandBar`

Large controls for round, note, undo, display lock, and debrief. The main controls target at least 52 px. The bar remains reachable with one hand and does not cover objective content.

### `ObjectiveTracker`

Use a discriminated component map keyed by `tracker.kind`. Do not create a generic free-form tracker for source objectives.

| Kind | UI | Commit rule |
|---|---|---|
| `check` | One checkbox | Immediate when confirmed |
| `compound_check` | Multiple required checks | Immediate after all confirmed |
| `counter` | Stepper with target | Immediate at target confirmation |
| `compound_counter` | Checklist plus counter | Immediate when both satisfied |
| `distinct_counter` | Named-entry chips plus count | Immediate after target distinct names |
| `deadline_check` | Check plus deadline action | Missed after deadline action unless corrected |
| `round_deadline` | Check plus round boundary | Missed after deadline round unless corrected |
| `end_state` | Board-state checks | Finalize in debrief when game ends |
| `win_end_state` | Win plus checks/metric | Debrief only |

The app records player confirmation, not inferred legality.

### `CounterControl`

Plus/minus buttons, direct numeric edit, minimum zero, optional target. Repeated changes may be coalesced in local UI, but the persisted event must preserve the final semantic change and remain undoable.

### `ExternalCardImage`

```ts
interface ExternalCardImageProps {
  mode: 'off' | 'remote';
  src: string | null;
  alt: string;
  attribution?: string | null;
  unavailableReason?: string | null;
}
```

Rules:

- render a text/metadata card when mode is `off`, URL is absent, request fails, or mapping is uncertain;
- use a direct allowlisted upstream URL only after the rights launch gate is complete;
- never use an application image proxy, optimizer cache, download button, lightbox gallery, or offline cache;
- preserve layout dimensions so image failure does not move controls.

## 14.7 Debrief components

### `ConsequencePreview`

Shows prior mid-game awards separately from new debrief deltas. It lists current and resulting Intel, Network, Scars, flags, Masteries, current issue, next transition, and any Act Recovery eligibility. The preview is pure selector output.

### `CommitResultDialog`

Requires a result and any win-gated objective decision. “Other loss” requires explicit zero-consequence acknowledgement or a manual correction reason. The commit button shows the number of append-only events to be written.

After a successful transaction, the app presents a result splash and one clear next action. A network/sync failure does not roll back a committed local result.

## 14.8 Reference results

`BilingualCardResult` displays:

- primary name according to physical-card language;
- secondary English/Spanish name;
- pack and set in both languages where available;
- collector number and category;
- match confidence/status;
- external source action;
- optional image area governed by `ExternalCardImage`.

Ambiguous results show all candidates and require player selection. Fuzzy matching may rank but may not auto-select an image.

## 14.9 Dialogs, sheets, and confirmations

Use modal dialogs for destructive or irreversible commits; use bottom sheets for reference/help on phone. Focus returns to the triggering control. Escape/back closes non-destructive surfaces. A debrief commit, save deletion, import replacement, manual correction, and Mirror reset all require confirmation.

## 14.10 Copy contract

- “Record” means append to campaign history.
- “Confirm” means the player attests to a physical-board fact.
- “Complete” is reserved for objectives, issues, and checklists.
- “Use” marks a once-per-game Field Asset spent; it never claims legal timing.
- “Official clear” appears only for Standard or Expert, never Veteran.
- Unknown or source-undefined behavior is named plainly; do not conceal it behind a generic error.

## 14.11 Component acceptance evidence

For each signature component, the code agent supplies:

- Storybook or an equivalent isolated example for every variant;
- keyboard and screen-reader checks;
- phone portrait, phone landscape/foldable, tablet, and desktop screenshots;
- reduced-motion rendering;
- loading, empty, error, offline, and high-content-length states;
- component tests asserting semantic names and state, not CSS class names.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 15 — Build, deployment, and operations runbook

This runbook defines how a code agent turns the specification into a reproducible public fan-project deployment without weakening the local-first or rights boundaries.

## 15.1 Environment classes

| Environment | Purpose | Data | Indexing | Card images | Cloud sync |
|---|---|---|---|---|---|
| Local | Development and reducer tests | Fixtures/local IndexedDB | N/A | Off | Off by default |
| Preview | Pull-request review and E2E | Disposable browser data | `noindex` | Off | Separate test project or off |
| Staging | Release-candidate verification | Seeded QA accounts if sync enabled | `noindex` | Off unless signed gate is being tested | Feature flag |
| Production | Public fan companion | User-local; optional user-owned sync | Allowed after notice review | Off by default; remote only after gate | Optional |

Never use production credentials in preview builds. Do not expose a service-role key to the browser.

## 15.2 Configuration contract

The generated repository must document and validate every environment variable at startup. Unknown variables may be ignored; invalid required values fail the build or disable only the dependent optional feature.

Critical defaults:

```dotenv
NEXT_PUBLIC_CARD_IMAGE_MODE="off"
CARD_IMAGES_ENABLED="false"
NEXT_PUBLIC_CLOUD_SYNC_ENABLED="false"
NEXT_PUBLIC_ANALYTICS_ENABLED="false"
NEXT_PUBLIC_BETA_NOINDEX="true"
```

Remote imagery requires both the public mode and server kill switch. Either switch being off produces metadata-only cards. The application must not infer permission from the presence of a URL.

## 15.3 Continuous integration

Every pull request runs, in this order:

1. dependency lockfile integrity and package audit;
2. format check;
3. ESLint;
4. strict TypeScript check;
5. JSON Schema and source-content validation;
6. no-card-image binary and no-image-proxy assertions;
7. reducer, selector, migration, and adapter unit tests;
8. component tests;
9. production build;
10. Playwright critical paths in a production-like server;
11. accessibility scan and keyboard path;
12. offline/PWA tests;
13. preview deployment and visual smoke test.

No generated snapshot, test fixture, or build cache may contain official card-image binaries.

## 15.4 Branch and release policy

- `main` is deployable.
- Feature branches require a preview and passing checks.
- Campaign content changes use a dedicated pull request that includes source traceability, schema validation, and reducer impact review.
- Save-schema changes require a forward migration and fixture from the previous supported version.
- Definition versions and application versions are independent.
- Tag public releases using semantic versioning; record the campaign definition version in release notes.

## 15.5 Vercel deployment contract

Recommended project settings:

- Framework preset: Next.js.
- Node.js runtime for route handlers and metadata adapters.
- preview environment variables isolated from production;
- deployment protection on staging if it contains sync test accounts;
- automatic preview deployments for pull requests;
- production deployment only from `main` or an explicit release workflow.

The code agent records chosen stable dependency versions and the runtime version in the repository. Do not pin versions in this specification as a substitute for a lockfile.

## 15.6 Security headers

At minimum:

```text
Content-Security-Policy:
  default-src 'self';
  base-uri 'self';
  object-src 'none';
  frame-ancestors 'none';
  form-action 'self';
  script-src 'self' 'wasm-unsafe-eval';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data:;
  connect-src 'self';
Referrer-Policy: strict-origin-when-cross-origin
X-Content-Type-Options: nosniff
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()
Cross-Origin-Opener-Policy: same-origin
```

Adjust the CSP to the actual Next.js production requirements. If authorized remote card imagery is enabled, add only the reviewed allowlist to `img-src`; do not loosen `default-src`. If MarvelCDB metadata is fetched server-side, its host does not belong in browser `connect-src`.

## 15.7 PWA release checks

- The manifest names the fan project without official logos.
- Icons and splash assets are original.
- Campaign definition, shell, fonts, and original UI assets work offline.
- Remote metadata uses bounded stale fallback.
- Card images and full remote card text are excluded from precache and runtime cache.
- An update does not replace an active table session without user acknowledgement.
- Browser termination and relaunch restore the last committed local transaction.

## 15.8 Database migration policy

Cloud sync is optional and may be omitted from the first release. When enabled:

- apply SQL migrations through a reviewed migration workflow;
- test row-level security with two different accounts;
- verify append-only event permissions;
- never accept a client-provided `user_id` as authorization;
- use idempotent `client_mutation_id` values for retries;
- keep a snapshot checksum and reconstruct from events during integrity checks;
- back up database metadata according to the hosting plan, while recognizing that local exports remain the user’s portable backup.

## 15.9 Release candidate checklist

A release candidate must demonstrate:

- a clean install and no-account campaign creation;
- Issue 1 preparation, table mode, result commit, and relaunch restore;
- Issue 6 conditional continuity setup from the sample save;
- Act Recovery with both reductions;
- Issue 15 all four authored endings plus `needs_author_decision`;
- first-Mirror fourth-aspect enforcement;
- export/import round trip with matching event and snapshot checksums;
- MarvelCDB outage with usable bilingual fallback;
- no image binary, proxy route, service-worker cache entry, or export leak;
- no console errors in critical paths;
- keyboard and screen-reader completion of the primary flow.

## 15.10 Rollback

Application rollback:

1. promote the previous verified deployment;
2. preserve local save compatibility;
3. disable optional integrations with feature flags first;
4. publish a short incident note if users may have seen failed writes or incorrect campaign calculations.

Content rollback:

- never point a save silently at an older incompatible definition;
- ship a new definition patch or migration mapping;
- retain the original definition version for existing saves where possible.

Database rollback:

- prefer forward-fix migrations;
- do not drop event data during emergency rollback;
- disable cloud writes while preserving local operation and export.

## 15.11 Takedown and rights incident

On a credible image/content complaint:

1. set `CARD_IMAGES_ENABLED=false` immediately;
2. confirm metadata-only pages still function;
3. disable affected URLs or all remote images without waiting for an application release when configuration permits;
4. preserve only operational request records;
5. use `legal/TAKEDOWN_REQUEST_TEMPLATE.md`;
6. review the requested material before any re-enable decision.

The fan notice, noncommercial status, and attribution are risk-reduction measures, not substitutes for permission.

## 15.12 Observability and privacy

Default telemetry is off. When the user opts in, collect only operational events such as route performance, unhandled errors, migration failures, and anonymous feature health. Do not collect deck contents, narrative notes, campaign logs, card searches, email, IP-derived location, or exported save data as analytics payloads.

Error reports scrub:

- notes and free text;
- save IDs and device IDs;
- external deck URLs;
- access tokens;
- full IndexedDB snapshots;
- card-image URLs if they contain unexpected query data.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# 16 — Code-agent execution plan

This is the final handoff sequence. A code agent should work in small verified increments and may not reinterpret campaign rules to simplify implementation.

## 16.1 Required output repository

The implementation result contains:

- a production Next.js App Router application;
- strict TypeScript and a committed lockfile;
- the validated campaign seed and generated runtime validators;
- a pure domain engine with exhaustive tests;
- an IndexedDB event/snapshot repository and migrations;
- the comic component system and responsive screens;
- an installable local-first PWA;
- bilingual card metadata search with fixtures and graceful outage behavior;
- optional cloud sync behind a feature flag;
- legal notices, privacy statement, and card-image kill switches;
- CI, E2E evidence, and deployment documentation.

## 16.2 Phase 0 — Establish trust boundaries

Deliverables:

- scaffold repository and exact scripts from `AGENTS.md`;
- copy schemas and seed data without editing source-derived wording;
- implement environment validation;
- add a CI check proving there are no card images under source, public, cache, fixtures, or build artifacts;
- write a short architecture decision record confirming companion-not-simulator scope.

Exit criteria: clean production build, all supplied schemas parse, `scripts/validate_pack.py` equivalent passes, and metadata-only UI runs with network disabled.

## 16.3 Phase 1 — Domain engine

Implement in this order:

1. types and runtime validation;
2. initial snapshot factory;
3. reducer result/error type;
4. sequence and transition guards;
5. Intel, Network, Scars, flags, Masteries;
6. Aspect Passport;
7. Field Asset and adaptation selectors;
8. setup-plan composer;
9. issue completion and Canon Mode;
10. Interludes and Act Recovery;
11. Final Preparation and endings;
12. Mirror Protocol.

Exit criteria: every invariant and E2E domain scenario in `docs/11-testing-and-acceptance.md` is covered by deterministic unit tests. Replaying the same ordered events always produces byte-equivalent canonical snapshots.

## 16.4 Phase 2 — Local durability

Deliverables:

- IndexedDB stores for saves, events, snapshots, settings, deck logs, rules logs, and migrations;
- one atomic append-and-snapshot transaction;
- checksums and replay integrity verification;
- crash/relaunch restore;
- compensating-event Undo;
- export/import envelope with preflight validation and rollback copy;
- read-only mode for unknown events.

Exit criteria: Playwright kills/reloads the browser during realistic use and confirms no committed event is lost or duplicated.

## 16.5 Phase 3 — Design system and shell

Build tokens first, then primitives, then routes. Use original shapes and textures only. Do not begin with a collection of page-specific CSS.

Required primitives:

- AppFrame, ComicHeader, CaptionBox, ComicPanel;
- IssueCover, TrackMeter, ScarChip;
- Button, IconButton, SegmentedControl, Stepper, Checkbox, Dialog, BottomSheet, Toast;
- status banner, empty state, skeleton, error panel;
- typography, focus ring, reduced motion, high-contrast treatment.

Exit criteria: isolated states and responsive evidence satisfy `docs/14-screen-and-component-contracts.md`.

## 16.6 Phase 4 — Vertical slice

Implement one complete Issue 1 path before generalizing:

1. create save;
2. dashboard;
3. choose aspect;
4. choose available Field Asset if any;
5. composed setup plan;
6. table objective with villain-stage deadline;
7. optional Mastery confirmation;
8. debrief for every result type;
9. autosave/relaunch;
10. export/import.

Do not hardcode Issue 1 logic in React. The screen must be generated from the same content and reducer APIs used later.

Exit criteria: the slice works offline, on a narrow phone, by keyboard, and after browser restart.

## 16.7 Phase 5 — Complete story systems

Add all tracker renderers, all setup-action conditions, conditional continuity, in-game reminders, Interludes, both Recovery calculations, issue 15 Final Preparation, authored ending resolver, unresolved branch, and secret epilogue.

Use golden fixtures for Issues 6, 8, 10, 11, 14, and 15 because they exercise continuity, conditional setup, persistent triggers, and finale behavior.

Exit criteria: each of 15 issues has a preparation snapshot, objective interaction test, win/loss debrief, and source-step parity test.

## 16.8 Phase 6 — Journey, reference, and logs

Deliverables:

- Aspect Passport and completion grid;
- 20-row Mirror Protocol;
- official Standard/Expert clear tracking distinct from Veteran;
- Perfect Core calculation;
- bilingual card search over 359 bundled records;
- card-anchor diagnostics;
- deck and rules logs;
- external source links with safe URL handling.

Exit criteria: every hero-villain pairing shows both Standard and Expert completion opportunities across story plus mirrors.

## 16.9 Phase 7 — MarvelCDB adapter

Implement fixture-first. Normalize metadata, locale fallback, source freshness, suffix-sensitive codes, and errors. Do not make remote availability a prerequisite for campaign play.

Card images remain disabled. Build the remote-image presentation behind both kill switches, but do not enable it in production until every item in `legal/CARD_IMAGE_LAUNCH_CHECKLIST.md` is signed.

Exit criteria: cached/stale/fallback/ambiguous/not-found/rate-failure tests pass, and no image request occurs when either switch is off.

## 16.10 Phase 8 — PWA, optional sync, release

- Add service worker and manifest without card-image caching.
- Test update safety during an active session.
- Add optional auth/sync only after all local flows are complete.
- Run security headers, RLS, accessibility, performance, import abuse, and offline checks.
- Deploy preview, staging, then production using `docs/15-build-deployment-and-operations.md`.

Exit criteria: every release gate passes and evidence is attached to the release pull request.

## 16.11 Mandatory implementation evidence

The code agent returns:

- repository tree and chosen dependency versions;
- test summary by layer;
- content validation output;
- critical reducer coverage report;
- Playwright screenshots for phone, foldable landscape, tablet, and desktop;
- accessibility findings and fixes;
- offline and relaunch evidence;
- export/import checksum evidence;
- rights/image-gate status;
- deployment URL and rollback instructions;
- open decisions that remain source-author dependent.

## 16.12 Stop conditions

The code agent must stop mutation and report a blocking decision when:

- source wording conflicts across authoritative files and affects state;
- a finale input lands in the authored undefined branch;
- a card anchor is ambiguous but an image would otherwise be selected;
- imported history contains an unknown event;
- a requested feature would turn the companion into a full game simulator;
- a rights request asks to enable images without completing the launch gate;
- a save migration cannot preserve user history deterministically.

It may continue in metadata-only, read-only, or local-only mode when those safer modes preserve the user’s data and the campaign’s authored behavior.

## 16.13 Recommended first code-agent prompt

Use `IMPLEMENTATION_PROMPT.md` verbatim. Require the agent to read `AGENTS.md`, run the pack validator, and implement only Phases 0–2 plus the Issue 1 vertical slice in its first milestone. This keeps reviewable boundaries and prevents UI work from concealing an incorrect campaign engine.



```{=openxml}
<w:p><w:r><w:br w:type="page"/></w:r></w:p>
```


# Appendix A — Campaign content matrix


The matrix below is generated from `data/core-protocol.v1.1.json`; it is a review aid, not a parallel content source.


| # | Act | Issue | Hero | Villain | Modular set | Tier | Suggested aspect | Objective flag | Setup actions |

|---:|---|---|---|---|---|---|---|---|---:|

| 1 | act-1 | THE BREAK-IN | Spider-Man | Rhino | Bomb Scare | Standard | Protection | `BOMB DEFUSED` | 4 |

| 2 | act-1 | SOUND MONEY | Captain Marvel | Klaw | Masters of Evil | Standard | Leadership | `MASTERS BROKEN` | 4 |

| 3 | act-1 | MACHINE IN THE STATIC | She-Hulk | Ultron | Under Attack | Standard | Aggression | `DRONE SAMPLE` | 3 |

| 4 | act-1 | MIND OVER METAL | Iron Man | Rhino | The Doomsday Chair | Standard | Justice | `M.O.D.O.K. PROFILED` | 6 |

| 5 | act-1 | THE VIBRANIUM TRAIL | Black Panther | Klaw | Legions of Hydra | Standard | Justice | `HYDRA LEDGER` | 4 |

| 6 | act-2 | ECHO CHAMBER | Spider-Man | Klaw | Under Attack | Veteran | Justice | `SONIC KEY` | 4 |

| 7 | act-2 | CITY OF DRONES | Captain Marvel | Ultron | Bomb Scare | Veteran | Aggression | `EVACUATION COMPLETE` | 6 |

| 8 | act-2 | HARD CASE | She-Hulk | Rhino | Legions of Hydra | Veteran | Leadership | `RHINO CONFESSION` | 7 |

| 9 | act-2 | COUNTERFREQUENCY | Iron Man | Klaw | Masters of Evil | Veteran | Aggression | `FIREWALL STABLE` | 6 |

| 10 | act-2 | THE VIBRANIUM PROTOCOL | Black Panther | Ultron | The Doomsday Chair | Veteran | Aggression | `VIBRANIUM SECURED` | 9 |

| 11 | act-3 | HOSTILE WITNESS | She-Hulk | Klaw | The Doomsday Chair | Expert | Justice | `WITNESS PROTECTED` | 4 |

| 12 | act-3 | SIEGE PROTOCOL | Black Panther | Rhino | Bomb Scare | Expert | Protection | `EMBASSY SECURED` | 4 |

| 13 | act-3 | TERMINAL VELOCITY | Captain Marvel | Rhino | Under Attack | Expert | Justice | `SKYLINE HELD` | 4 |

| 14 | act-3 | THE LAST NEIGHBORHOOD | Spider-Man | Ultron | Masters of Evil | Expert | Leadership | `CITY SAVED` | 9 |

| 15 | act-3 | THE ULTRON DIRECTIVE | Iron Man | Ultron | Legions of Hydra | Expert | Leadership | `CLEAN SHUTDOWN` | 9 |


## A.1 Progression constants


| System | Source-derived rule |

|---|---|

| Intel | Start 0; +1 per issue win; +1 per objective; +1 for each hero’s first Mastery; unlocks at 3, 6, 9, 12, 15. |

| Network | Start 0; +1 for hero defeat; +2 for main-scheme loss; adaptations are cumulative. |

| Scars | 0–2 per hero; defeat adds 1; hero win removes 1; each Scar lowers the starting identity dial, not maximum HP. |

| Recording | Non-win-gated objectives and first Masteries are recorded immediately and persist after later loss. |


## A.2 Network Adaptations


| Network | Adaptation | Effect |

|---:|---|---|

| 2+ | **Early Warning** | After standard setup, place 1 additional threat on the main scheme. |

| 4+ | **Reinforced Chassis** | After standard setup, give the villain a Tough status card. |

| 6+ | **Prepared Ambush** | After drawing and resolving your opening hand and mulligan, deal yourself 1 facedown encounter card. |

| 8+ | **Predictive Model** | The first time the villain activates in the game, it gets +1 ATK if attacking or +1 SCH if scheming for that activation. |

| 10+ | **Recursive Backup** | After the villain advances to its next stage, give it a Tough status card if it does not already have one. |


## A.3 Field Assets


| Intel | Asset | Effect | Special |

|---:|---|---|---|

| 3+ | **Emergency Reserve** | Once per game, when you pay the cost of a card, reduce that cost by 1. | Normal slot rules |

| 3+ | **Field Medic** | Once per game, heal 2 damage from your identity. | Normal slot rules |

| 6+ | **S.H.I.E.L.D. Recon** | Once per game, before encounter cards are dealt in the villain phase, look at the top 2 cards of the encounter deck and return them in either order. | Normal slot rules |

| 6+ | **Damage Control** | Once per game, after you defeat a side scheme, remove 2 threat from the main scheme. | Normal slot rules |

| 9+ | **Countermeasure Suite** | Once per game, after a boost card is turned faceup, treat 1 printed boost icon on that card as blank for that activation. Do not cancel boost-star text. | Normal slot rules |

| 9+ | **Reactive Reflex** | Once per game, after your hero defends against an attack, ready your hero. | Normal slot rules |

| 12+ | **Stark-Wakanda Interface** | Once per game, reduce the cost of an upgrade or support you play by 2, to a minimum of 0. | Normal slot rules |

| 12+ | **Avengers Emergency Channel** | Once per game, after your hero uses a basic ATK or THW, ready that hero and deal 1 damage to it. | Normal slot rules |

| 15+ | **Endgame Protocol** | Issue 15 only. Interrupt: When a treachery is revealed, cancel its “When Revealed” effects. Do not cancel Surge. Once per game. | issue-15-only |


## A.4 Hero Masteries and aspect routes


| Hero | Main-story recommended route | First Mirror | Mastery signature | Mastery condition |

|---|---|---|---|---|

| Spider-Man | Protection → Justice → Leadership | Aggression | **BACKFLIP** | Prevent 4 or more damage from a single attack using Backflip. |

| Captain Marvel | Leadership → Aggression → Justice | Protection | **ENERGY CHANNEL** | Deal the full 10 damage with Energy Channel. |

| She-Hulk | Aggression → Leadership → Justice | Protection | **GAMMA SLAM** | Deal 10 or more damage with a single Gamma Slam. |

| Iron Man | Justice → Aggression → Leadership | Protection | **SUPERSONIC PUNCH** | Deal 8 damage with Supersonic Punch while Aerial and control at least 5 TECH upgrades. |

| Black Panther | Justice → Aggression → Protection | Leadership | **WAKANDA FOREVER!** | Resolve all four different Black Panther upgrade Special abilities from the same Wakanda Forever! event. |


## A.5 Setup-action inventory


The executable campaign seed contains **83 structured setup actions** mapped to every authored setup step.


| Dimension | Value | Count |

|---|---|---:|

| Phase | `campaign-continuity` | 30 |

| Phase | `in-game-reminder` | 18 |

| Phase | `issue-pre-setup` | 31 |

| Phase | `network-and-final-prep` | 4 |

| UI behavior | `confirm` | 58 |

| UI behavior | `generated` | 2 |

| UI behavior | `initialize_tracker` | 3 |

| UI behavior | `interactive` | 2 |

| UI behavior | `persistent_reminder` | 18 |

| Action kind | `apply_network` | 1 |

| Action kind | `configure_scenario` | 15 |

| Action kind | `deal_damage` | 2 |

| Action kind | `deal_encounter_card` | 3 |

| Action kind | `equip_special_asset` | 1 |

| Action kind | `give_status` | 4 |

| Action kind | `initialize_counter` | 3 |

| Action kind | `inspect_top_encounter` | 1 |

| Action kind | `modify_threat` | 6 |

| Action kind | `resolve_printed_ability` | 4 |

| Action kind | `reveal_and_engage` | 1 |

| Action kind | `reveal_card` | 18 |

| Action kind | `search_and_reveal` | 2 |

| Action kind | `set_aside` | 16 |

| Action kind | `shuffle_searched_cards` | 1 |

| Action kind | `spend_final_preparation` | 1 |

| Action kind | `suppress_network_adaptation` | 1 |

| Action kind | `track_counter` | 3 |


# Appendix B — Mirror Protocol matrix


| # | Hero | Villain | Modular set | Official mode |

|---:|---|---|---|---|

| 1 | Spider-Man | Rhino | Bomb Scare | Expert |

| 2 | Spider-Man | Klaw | Under Attack | Standard |

| 3 | Spider-Man | Klaw | Under Attack | Expert |

| 4 | Spider-Man | Ultron | Masters of Evil | Standard |

| 5 | Captain Marvel | Klaw | Masters of Evil | Expert |

| 6 | Captain Marvel | Ultron | Bomb Scare | Standard |

| 7 | Captain Marvel | Ultron | Bomb Scare | Expert |

| 8 | Captain Marvel | Rhino | Under Attack | Standard |

| 9 | She-Hulk | Ultron | Under Attack | Expert |

| 10 | She-Hulk | Rhino | Legions of Hydra | Standard |

| 11 | She-Hulk | Rhino | Legions of Hydra | Expert |

| 12 | She-Hulk | Klaw | The Doomsday Chair | Standard |

| 13 | Iron Man | Rhino | The Doomsday Chair | Expert |

| 14 | Iron Man | Klaw | Masters of Evil | Standard |

| 15 | Iron Man | Klaw | Masters of Evil | Expert |

| 16 | Iron Man | Ultron | Legions of Hydra | Standard |

| 17 | Black Panther | Klaw | Legions of Hydra | Expert |

| 18 | Black Panther | Ultron | The Doomsday Chair | Standard |

| 19 | Black Panther | Ultron | The Doomsday Chair | Expert |

| 20 | Black Panther | Rhino | Bomb Scare | Standard |


# Appendix C — Executable contract inventory


| Artifact | Contract |

|---|---|

| `data/core-protocol.v1.1.json` | Immutable campaign definition with all 15 issues, progression systems, endings, and 20 mirrors. |

| `schemas/campaign-definition.schema.json` | Strict nested validation for the campaign definition. |

| `schemas/campaign-save.schema.json` | Versioned save, snapshot, event, live-session, and result contract. |

| `types/domain.ts` | Strict TypeScript handoff types, including setup-plan output. |

| `api/openapi.yaml` | Normalized metadata and optional sync API; no image-proxy endpoint. |

| `database/001_initial_schema.sql` | Optional PostgreSQL/Supabase append-only event schema with RLS. |

| `data/card-reference.bilingual.json/.csv` | 359 bilingual card identity records. |

| `data/core-protocol-card-anchors.json` | 25 campaign-critical physical-card anchors and verified suffix-sensitive mappings. |

| `design/tokens.json` | Comic-book visual tokens without official branding. |

| `examples/sample-save.issue-06.json` | Schema-valid event-sourced fixture exercising loss, rewards, recovery, and conditional continuity. |

| `scripts/validate_pack.py` | Offline automated content and rights-boundary validator. |


# Appendix D — Source integrity


| Source | Bytes | SHA-256 |

|---|---:|---|

| `Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx` | 72,014 | `f6a313e0a8d791bc1f70ac045e150360f1d5dc51eecb74a9d33e1b56f6f4f35a` |

| `Core_Protocol_v1.1_Quickplay_Companion(1).docx` | 48,501 | `51ccf3d601aae781eed369dec76c2af27e2bdd694e2bb8bd7ce6c96589e4fbfa` |

| `Core_Protocol_v1.1_Quickplay_Companion(1).pdf` | 249,459 | `3e3a69aa091f9a9e5123a44ee9f5301c38597a520912ad7df235d63b5b06af7e` |

| `marvel_champions_journey_tracker_v2_core_protocol(1).xlsx` | 44,727 | `e0c0f5b9cf317b10d769d09bab2db65a6bf5bc7e08e6ba111a7afa2947811a1d` |


# Appendix E — Implementation handoff checklist

- [ ] Read `AGENTS.md` and all numbered documents.
- [ ] Run `python scripts/validate_pack.py` before copying content.
- [ ] Scaffold current stable Next.js App Router and commit the lockfile.
- [ ] Generate runtime validators from the packaged schemas.
- [ ] Implement reducer, selectors, setup composer, and ending resolver before UI routes.
- [ ] Implement atomic IndexedDB event + snapshot persistence.
- [ ] Complete the Issue 1 offline vertical slice.
- [ ] Add the remaining 14 story issues through generic content-driven renderers.
- [ ] Add Mirror Protocol, passport, card reference, deck log, and rules log.
- [ ] Test source parity, all endings, the undefined branch, and image-off behavior.
- [ ] Keep card images off until the separate launch checklist is signed.
- [ ] Ship metadata-only mode even if image approval remains unresolved.

**End of specification.**
