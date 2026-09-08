# 07 — Technical architecture

## Chosen architecture

A Next.js App Router application provides a static/offline-capable shell plus small server boundaries for external metadata and optional sync. The core product is local-first; the server is an enhancement, not a dependency.

## Layer diagram

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
