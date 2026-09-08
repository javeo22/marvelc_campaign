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
