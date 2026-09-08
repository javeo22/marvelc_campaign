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
