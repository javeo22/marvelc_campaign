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
