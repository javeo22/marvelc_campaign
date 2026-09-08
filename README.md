# Core Protocol Companion — code-agent build pack

**Status:** implementation-ready specification for a polished, mobile-first fan companion.

This pack converts the authored **Core Protocol v1.1** campaign, its Quickplay Companion, and the journey tracker into a deterministic product specification. It is designed so a coding agent can scaffold and build the app without reverse-engineering campaign rules from prose.

The intended product is a **table companion**, not a digital replacement for Marvel Champions. It guides setup, presents narrative, tracks campaign-only state, offers optional live counters, records outcomes, and provides bilingual card identification for a player using Spanish physical cards while discussing the game in English.

## Start here

For a single polished review document, open `Core_Protocol_Companion_Web_App_Build_Spec.docx`. For implementation, use the repository-native artifacts below.

1. Read `AGENTS.md` and follow its non-negotiable constraints.
2. Read `docs/00-executive-brief.md` through `docs/16-code-agent-execution-plan.md` in order.
3. Treat `data/core-protocol.v1.1.json` as the executable content source of truth.
4. Validate content with the JSON Schemas before writing UI code.
5. Implement the pure campaign reducer before building issue screens.
6. Keep card images disabled until the launch checklist in `legal/CARD_IMAGE_LAUNCH_CHECKLIST.md` is complete.
7. Run every acceptance gate in `docs/11-testing-and-acceptance.md` and `qa/CONTENT_VALIDATION_CHECKLIST.md`.

## Recommended implementation baseline

- Next.js App Router with TypeScript.
- Server Components by default; small client boundaries for table interactions.
- A pure TypeScript campaign engine with no React dependency.
- IndexedDB as the authoritative local store; no account required.
- Optional Supabase/PostgreSQL event sync behind a feature flag.
- Installable PWA with campaign content available offline.
- MarvelCDB adapter for card metadata and optional externally hosted images.
- Vitest for reducers and contracts; Testing Library for components; Playwright for end-to-end and offline flows.

Exact dependency versions are deliberately not pinned in this documentation. The code agent must select current stable releases, commit a lockfile, and record the chosen versions in the generated repository.

## Non-negotiable product boundaries

- **True solo only for this campaign.** Do not imply multiplayer support that the source does not define.
- **No full rules engine.** The app may guide and track; the physical game remains authoritative.
- **No card-image binaries in the repository, build, service-worker cache, export, or database.**
- **No copied Marvel logo, official card frame, or licensed character art in the original UI.**
- **No invented Spanish campaign narrative.** Use English narrative fallback until an approved translation exists.
- **No guessed finale.** A win at Network 0–3 with fewer than four Mastery stars is unresolved in the source and must return `needs_author_decision`.
- **No silent campaign corrections.** Proposed balance or wording changes live outside the source seed until explicitly approved.

## Pack map

| Path | Purpose |
|---|---|
| `Core_Protocol_Companion_Web_App_Build_Spec.docx` | Polished stakeholder and code-agent review document with linked contents |
| `MASTER_BUILD_SPEC.md` | Canonical editable master specification assembled from the numbered documents |
| `AGENTS.md` | Exact operating instructions for a code agent |
| `IMPLEMENTATION_PROMPT.md` | Ready-to-paste implementation prompt |
| `docs/` | Product, UX, screen contracts, engine, architecture, rights, operations, QA, and execution specifications |
| `data/core-protocol.v1.1.json` | Complete campaign definition: 15 issues, progression, endings, and 20 mirrors |
| `data/card-reference.bilingual.*` | 359-row bilingual reference exported from the journey tracker |
| `data/core-protocol-card-anchors.json` | Cards referenced by setup and Mastery content |
| `schemas/` | JSON contracts for content, saves, card reference, and settings |
| `types/domain.ts` | TypeScript domain interfaces |
| `api/openapi.yaml` | Optional server/API contract; intentionally excludes image binaries |
| `database/001_initial_schema.sql` | Optional Supabase/PostgreSQL cloud-sync schema with RLS |
| `design/` | Comic design tokens and responsive wireframes |
| `examples/` | Valid event-sourced sample save |
| `legal/` | Fan notice, card-image launch gate, and takedown template |
| `qa/` | Source/content validation checklist and final validation report |
| `source-materials/` | The authored source files included for traceability |

## Source-derived campaign inventory

- 15 sequential story issues: five Standard, five Veteran bridge, five Expert.
- Five required Core heroes, three Core villains, and all five Core modular sets.
- Intel, Network, Scars, five Hero Masteries, nine Field Assets, and five cumulative Network Adaptations.
- Two consequential Interlude choices and two Act Recovery calculations.
- Final Preparation, four defined endings, one explicit unresolved ending state, and one secret epilogue.
- 20 Mirror Protocol games completing all official Standard/Expert hero-villain pairings.
- 35 games for the complete journey.

## Build completion contract

The app is ready for release only when it can be installed, started with no account, used offline through a complete issue, restored after browser termination, exported/imported without state loss, and verified against all campaign reducer tests. Card art is a separate launch gate and may remain off while every other feature ships.
