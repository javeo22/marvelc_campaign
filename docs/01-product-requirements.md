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
