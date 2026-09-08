# AGENTS.md — implementation contract

You are building **Core Protocol Companion**, a noncommercial fan companion for a physical Marvel Champions campaign. Follow this file as an authoritative instruction set.

## 1. Read order

Read these before changing code:

1. `README.md`
2. `docs/00-executive-brief.md`
3. `docs/01-product-requirements.md`
4. `docs/02-information-architecture-and-user-flows.md`
5. `docs/03-functional-specification.md`
6. `docs/04-domain-model-and-campaign-engine.md`
7. `docs/05-content-localization-and-card-reference.md`
8. `docs/06-comic-design-system.md`
9. `docs/07-technical-architecture.md`
10. `docs/08-data-api-and-marvelcdb.md`
11. `docs/09-card-images-rights-and-fan-project.md`
12. `docs/10-security-privacy-offline-and-sync.md`
13. `docs/11-testing-and-acceptance.md`
14. `docs/12-delivery-backlog.md`
15. `docs/13-source-traceability-and-open-decisions.md`
16. `docs/14-screen-and-component-contracts.md`
17. `docs/15-build-deployment-and-operations.md`
18. `docs/16-code-agent-execution-plan.md`

Then inspect the JSON Schemas, `types/domain.ts`, and the seed data.

## 2. Source authority

- `data/core-protocol.v1.1.json` is the executable campaign content source of truth.
- The source files in `source-materials/` settle wording disputes.
- Do not “improve,” rebalance, translate, or reconcile authored campaign content without an explicit content change request.
- The current official game rules govern normal card timing. This application does not adjudicate every card interaction.
- Preserve the undefined finale branch as `needs_author_decision`.

## 3. Product boundaries

Build a companion, not a simulator.

The app may:

- guide issue setup in the authored order;
- show narrative and continuity consequences;
- track campaign state, optional objectives, Masteries, Scars, Intel, Network, Field Assets, Interludes, Final Preparation, and mirrors;
- offer optional counters for round, hit points, threat, villain stage, and issue-specific progress;
- search bilingual card metadata and open external card/deck pages;
- export/import the user’s own progress.

The app must not:

- reproduce a complete playable card pool offline;
- automate the encounter deck, player deck, card draw, payments, attacks, boosts, or legal timing;
- generate replacement cards or print sheets;
- store, proxy, optimize, download, export, or service-worker-cache official card-image binaries;
- use official Marvel logos or imitate the official card frame as the app shell;
- require authentication for local play.

## 4. Architecture rules

- Use a Next.js App Router project with strict TypeScript.
- Use the Node.js runtime for route handlers unless a measured requirement justifies Edge.
- Default to Server Components. Mark only genuinely interactive leaves as `'use client'`.
- Keep `src/domain/**` free of React, browser globals, network calls, and time-dependent implicit behavior.
- Validate campaign content and imported saves with generated Zod validators or JSON Schema validators at runtime.
- Store local state in IndexedDB in a transaction that appends the event and writes the derived snapshot atomically.
- Every reducer must be deterministic and replayable from events.
- Use route handlers for MarvelCDB metadata normalization. Do not fetch the full corpus repeatedly from client components.
- Honor upstream cache headers and revalidate stale metadata courteously.
- Keep cloud sync behind `NEXT_PUBLIC_CLOUD_SYNC_ENABLED`.
- Keep card images behind both build-time and runtime kill switches.

## 5. Required repository layout

```text
src/
  app/
    (shell)/
    campaigns/
    cards/
    decks/
    rules/
    settings/
    api/
  components/
    comic/
    campaign/
    play/
  content/
    core-protocol.v1.1.json
  domain/
    reducer.ts
    selectors.ts
    invariants.ts
    ending-resolver.ts
    setup-plan.ts
    types.ts
  storage/
    indexeddb.ts
    export-import.ts
    migrations.ts
  integrations/
    marvelcdb/
    supabase/
  i18n/
  styles/
  test/
public/
  original-ui-only/
```

Do not place card art under `public/`.

## 6. Build order

1. Scaffold, linting, strict TypeScript, test runners, and CI.
2. Copy and validate content seed and schemas.
3. Implement pure reducer, selectors, setup-plan composer, ending resolver, and exhaustive tests.
4. Implement IndexedDB repository, migrations, autosave, event replay, undo-as-compensation, export, and import.
5. Build app shell and comic design primitives.
6. Build onboarding, campaign dashboard, issue preparation, table mode, and debrief.
7. Build Interludes, finale, Mirror Protocol, passport, completion grid, deck log, and rules log.
8. Add bilingual card metadata search with fixture-backed adapter tests.
9. Add installable/offline PWA behavior.
10. Add optional cloud sync only after local mode is complete.
11. Run all quality and rights gates.

## 7. Required scripts

The generated repository must expose equivalent scripts:

```json
{
  "dev": "next dev",
  "build": "next build",
  "start": "next start",
  "lint": "eslint .",
  "typecheck": "tsc --noEmit",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:e2e": "playwright test",
  "test:a11y": "playwright test --grep @a11y",
  "validate:content": "tsx scripts/validate-content.ts",
  "validate:images": "tsx scripts/assert-no-card-images.ts"
}
```

## 8. State-change policy

- Append events; never mutate history in place.
- Active-session Undo appends a compensating event and references the reverted event ID.
- Reducers award flags and first Masteries idempotently.
- A debrief may backfill an objective or Mastery the user forgot to record, but it must not award twice.
- A manual correction requires an explicit reason and remains visible in the activity log.
- Imported content never bypasses schema validation or migration.

## 9. UI quality policy

- Mobile-first, usable one-handed beside a play area.
- Minimum touch target 44 px; table mode targets 52 px where practical.
- No essential information conveyed by color alone.
- All motion obeys `prefers-reduced-motion`.
- Comic styling is concentrated in frames, captions, texture, and transitions; rules text and controls remain calm and legible.
- Do not rotate body copy or use novelty display fonts for paragraphs.
- Confirm destructive actions and provide a visible Undo path.

## 10. Definition of done

A feature is done only when:

- reducer and selector tests pass;
- content is schema-valid;
- keyboard, screen reader, touch, narrow phone, foldable/tablet, and landscape behavior are checked;
- offline behavior is verified where applicable;
- error, loading, empty, stale, and recovery states exist;
- no card image is bundled or cached;
- source traceability is preserved;
- Playwright evidence confirms the main path works without console errors.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
