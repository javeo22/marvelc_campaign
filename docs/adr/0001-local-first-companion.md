# ADR 0001: Local-First Companion, Not Simulator

## Status

Accepted.

## Context

Core Protocol Companion supports physical table play for a noncommercial fan campaign. The authored campaign definition is the source of truth for campaign-only state, while the official physical game remains authoritative for card timing and board resolution.

## Decision

The app stores append-only campaign events locally in IndexedDB and derives snapshots through a deterministic TypeScript reducer. It does not automate decks, boosts, attacks, payments, encounter resolution, or any full playable card pool. MarvelCDB is used only as an optional metadata source through route handlers, and card images remain disabled by default behind build-time and runtime switches.

The production security headers keep strict object, frame, form, worker, image, and connect controls. The static CSP allows inline scripts because Next.js App Router streams its production RSC bootstrap inline when using static headers; a nonce-based middleware CSP can replace this if the deployment needs stricter script policy later.

## Consequences

Campaign play works without an account or network. Optional sync and remote imagery can be added only as explicit enhancements that do not weaken local durability or rights controls.
