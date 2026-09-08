# ADR 0002: Repurposed deployment resources

Status: Accepted

## Context

The deployment should use the existing `therapy` Vercel project and the existing `pokecomp` Supabase project because both are no longer used for their original applications. The app remains local-first: IndexedDB is authoritative, cloud sync is optional, and the complete core experience must work offline without an account.

## Decision

- GitHub remote: `https://github.com/javeo22/marvelc_campaign.git`.
- Vercel project: repurpose the former `therapy` project, renamed to `marvelc-campaign`, for the Next.js production deployment.
- Vercel SSO deployment protection is disabled for this public noncommercial PWA; Git fork protection remains enabled.
- The stale `therapy-snowy.vercel.app` alias was removed; the production alias is `https://marvelc-campaign.vercel.app`.
- Supabase project: repurpose `pokecomp` (`sutslbmqsjczlfnsmgxt`) with namespaced `core_protocol_*` tables only.
- Cloud sync remains disabled unless `NEXT_PUBLIC_CLOUD_SYNC_ENABLED=true` and a valid public Supabase browser key is configured.
- Username/password login uses Supabase Auth; the UI maps usernames to internal `@core-protocol.invalid` auth emails and never stores passwords in source, exports, or IndexedDB.
- Public card-image mode remains `off` until `legal/CARD_IMAGE_LAUNCH_CHECKLIST.md` is completed and signed.

## Consequences

The production app can ship with local saves, export/import, metadata search, and a prepared Supabase schema without requiring authentication. The account screen can upload and download saves once Vercel production has a valid `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` or `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the requested `javier` Supabase Auth user exists. The local CLI state available during implementation did not include a Supabase access token, the cached pooler URL failed password authentication, and the local publishable key was rejected by Supabase Auth, so the user must provide a valid admin path or create that auth user in the dashboard.
