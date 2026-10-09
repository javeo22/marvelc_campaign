# Cross-device saves on Vercel

The app uses Auth.js / NextAuth for GitHub or Google sign-in and PostgreSQL for cloud saves. Supabase is no longer a runtime dependency. IndexedDB remains the offline working copy. Existing device saves and JSON backups remain available. Current-definition saves can be uploaded directly; unsupported content versions are rejected without replacing local data.

## Recommended deployment

Keep the existing Vercel project and Spaceship domain. Create a **Neon Free** PostgreSQL project, ideally in the region closest to the Vercel functions. A standard PostgreSQL server also works; the adapter uses `pg`, not a Neon-specific API.

1. In Neon, create a project and database. Use the SQL editor to run [002_oauth_cloud_saves.sql](../database/002_oauth_cloud_saves.sql). Do **not** run the old Supabase migration against this database.
2. Obtain the database's **pooled** connection URL. Retain TLS verification; use `sslmode=verify-full` in production. Store it as `DATABASE_URL` in Vercel's server environment variables. Never use a `NEXT_PUBLIC_` name for it.
3. Register a GitHub OAuth app in GitHub Settings → Developer settings → OAuth Apps. Set the homepage to your stable production origin and the authorization callback URL to `https://YOUR-DOMAIN/api/auth/callback/github`. Store its client ID as `AUTH_GITHUB_ID` and secret as `AUTH_GITHUB_SECRET` in Vercel. Registration is separate from any GitHub token used by the development environment.
4. Set `NEXTAUTH_URL` to that same production origin, and set `NEXTAUTH_SECRET` to a securely generated random value of at least 32 characters. Generate it with a password manager or `openssl rand -base64 32`; enter it directly into secure settings. Keep the same secret across redeployments. Do not put these values in Git or chat.
5. Set `NEXT_PUBLIC_CLOUD_SYNC_ENABLED=true` and redeploy the app. This public flag is compiled into the browser bundle, so changing only runtime configuration is insufficient.
6. Remove obsolete `NEXT_PUBLIC_SUPABASE_*` bindings from Vercel once the replacement deployment is active. Keep images/analytics disabled unless independently configured.
7. Open `/account`, sign in, and **Enable sync** for a campaign. On a second device, use the **same provider/account** and **Download** the save once. Both device copies then sync on edits, reconnection, focus, and every 30 seconds while visible. Saves not explicitly linked remain device-only.

Google is also supported. Configure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` instead of, or alongside, GitHub and register `https://YOUR-DOMAIN/api/auth/callback/google` as the authorized redirect URI in Google Cloud Console. For a Google OAuth app in Testing, add the intended accounts as test users. The two providers have separate identities; matching email addresses do not link their saves.

Use separate OAuth registrations, databases, and secrets for preview/testing. A stable preview origin is easier than arbitrary per-commit domains. For local development use `NEXTAUTH_URL=http://localhost:3000` and a separate callback registration. No credentials are required for local-only development with the flag disabled.

## Verify production

- `/api/cloud/status` returns `{enabled:true,configured:true,providers:[...]}` without exposing credentials. This proves variable presence/format, **not** database connectivity or successful OAuth.
- Without sign-in, `/api/cloud/saves` returns 401 when configured, or 503 while disabled/unconfigured. Private responses use `Cache-Control: private, no-store` and are excluded from the service worker.
- Sign in, upload, sign in on a second device, download, make an offline campaign change, reconnect, and verify the other device receives the same sequence and progress. Try two accounts to verify each sees only its own saves.
- For a database readiness check in a securely configured local/cloud machine: `npm run cloud:check`. It checks the table and required configuration without printing credentials. `npm run cloud:migrate` applies only the new idempotent table migration when needed.

## Data and conflict behavior

The server derives ownership exclusively from the signed session's immutable provider subject (`github:<id>` or `google:<id>`). No client owner ID is accepted. JWT sessions use signed/encrypted HTTP-only cookies; OAuth passwords and provider tokens are not stored in the database or exposed to client sessions.

Every update uses a locked PostgreSQL transaction, a revision precondition, and a full journal-prefix comparison. Regressions, edited old events, and conflicting histories are rejected with 409. Snapshots are replayed and checksummed before storage. Saves are bounded to 3 MB / 20,000 events per request. Campaign notes sync; display preferences, deck logs, and personal rules logs remain device-local.

Offline edits remain in IndexedDB and retry on reconnection. A cloud pull checks the current local checksum and name inside the write transaction so a tap during a network request cannot be silently replaced. Downloads keep the previous device copy in the existing rollback store. Download a portable JSON backup before intentionally replacing a branch.

For divergent progress, export both versions. To keep the device branch separately, duplicate it in the campaign library and enable sync for the duplicate. The app never automatically merges conflicting campaign decisions. **Stop syncing** removes the link on that device; deleting a local save does not delete its retained cloud copy.

If the old Supabase project was deleted, provider login cannot recover data stored only there. Device copies and exported backups can be uploaded to the new database. Keep the domain/origin unchanged to retain the same browser's IndexedDB; moving to a different hostname requires export/import.

## Development validation

The production build, lint, strict type check, 65 unit/integration tests, and 30 browser checks passed during implementation. Browser cross-device tests use authenticated API fixtures; PostgreSQL transaction tests use PGlite. OAuth protocol checks verified encrypted sessions, rejection of unauthenticated/invalid sessions, CSRF, and the GitHub authorization redirect with test-only configuration. Real provider login, an external PostgreSQL connection, and a deployed two-device round trip remain unverified.

The production dependency audit reports zero vulnerabilities after updating Next.js to 16.4.0 and applying compatible transitive fixes. The full audit still reports five high advisories in the development-only ESLint → fast-glob → micromatch → braces chain. Its suggested automatic fix downgrades eslint-config-next to 14.x; that breaking downgrade was not applied.

If the IndexedDB upgrade waits for another tab, close other tabs of the old app and reload. Do not clear browser storage.

## Rollback

Disable `NEXT_PUBLIC_CLOUD_SYNC_ENABLED` and redeploy to return to local-only play. The new database remains intact. A rollback to the old Supabase application does not automatically migrate these saves to Supabase; keep portable JSON exports. No deployment, external database migration, or real OAuth sign-in is considered verified until performed with the actual provider configuration.
