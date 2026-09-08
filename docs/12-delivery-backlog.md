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
