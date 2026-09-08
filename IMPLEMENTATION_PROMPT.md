# Ready-to-paste code-agent prompt

Build the application specified in this repository as a production-quality, mobile-first Next.js App Router PWA.

Read `AGENTS.md` and every file in `docs/` before coding. Treat `data/core-protocol.v1.1.json` as immutable authored content and validate it against the included schema. Implement the campaign engine as pure deterministic TypeScript first, with exhaustive tests for Intel, Network, Scars, objectives, Masteries, aspect passport, Field Asset limits, Interludes, Act Recovery, Final Preparation, Mirror Protocol, and finale resolution. Preserve the explicit `needs_author_decision` finale branch.

Use IndexedDB as authoritative local persistence; the complete core experience must work without an account or network. Store an append-only event journal and an atomically updated derived snapshot. Include autosave, reload recovery, compensating Undo, schema-version migrations, JSON export/import, and multiple local saves. Keep optional Supabase sync behind a disabled feature flag.

Create an original comic-book aesthetic using `design/tokens.json`: inked panels, caption boxes, subtle halftone textures, offset shadows, restrained motion, and highly legible controls. Do not copy Marvel logos, card frames, or licensed art. Meet WCAG 2.2 AA and support reduced motion, keyboard input, screen readers, phone portrait, phone landscape, foldable/tablet, and desktop.

Build these flows: onboarding; campaign dashboard; issue preparation wizard; table mode; debrief; Interlude decisions; act recovery; finale and epilogue; hero passport; completion grid; Mirror Protocol; bilingual card search; deck log; rules log; settings; export/import; and install/offline state.

Integrate MarvelCDB only through the adapter contract in `docs/08-data-api-and-marvelcdb.md`. Use English and Spanish public metadata endpoints with cache revalidation and local fallback. Card images must remain OFF by default. Never place image binaries in the repo, optimize/proxy them, cache them in the PWA, or include them in exports. Implement the remote-image UI only behind the two kill switches and show a metadata-only fallback. Do not enable images in the production configuration until `legal/CARD_IMAGE_LAUNCH_CHECKLIST.md` is signed off.

Use strict TypeScript, semantic HTML, Server Components by default, small client islands, Vitest, Testing Library, Playwright, automated accessibility checks, and CI that runs lint, typecheck, unit tests, content validation, production build, end-to-end smoke tests, and the no-card-images assertion. Document selected dependency versions and architectural decisions in the generated repo.

Do not stop at scaffolding. Complete the vertical slice from new campaign through Issue 1 debrief first, then finish all source-defined content and acceptance criteria. Where the specification marks an open decision, implement the safe fallback and surface it clearly rather than inventing behavior.
