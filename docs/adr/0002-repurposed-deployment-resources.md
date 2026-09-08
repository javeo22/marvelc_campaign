# ADR 0002: Repurposed deployment resources

Status: Accepted

## Context

The deployment should use the existing `therapy` Vercel project and the existing `pokecomp` Supabase project because both are no longer used for their original applications. The app remains local-first: IndexedDB is authoritative, cloud sync is optional, and the complete core experience must work offline without an account.

## Decision

- GitHub remote: `https://github.com/javeo22/marvelc_campaign.git`.
- Vercel project: repurpose the former `therapy` project, renamed to `marvelc-campaign`, for the Next.js production deployment.
- Supabase project: repurpose `pokecomp` (`sutslbmqsjczlfnsmgxt`) with namespaced `core_protocol_*` tables only.
- Cloud sync remains disabled unless `NEXT_PUBLIC_CLOUD_SYNC_ENABLED=true`.
- Public card-image mode remains `off` until `legal/CARD_IMAGE_LAUNCH_CHECKLIST.md` is completed and signed.

## Consequences

The production app can ship with local saves, export/import, metadata search, and a prepared Supabase schema without requiring authentication. Future sync work can attach authenticated Supabase clients to the existing namespaced tables without rewriting local persistence.
