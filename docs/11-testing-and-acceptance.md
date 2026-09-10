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
- any main-story campaign aspect is legal, repeated aspects do not block play, and only wins add optional Aspect Passport stamps;
- first Mirror fourth aspect when three distinct story aspects are stamped;
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
