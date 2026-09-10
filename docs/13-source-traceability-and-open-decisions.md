# 13 — Source traceability and open decisions

## Source files

| Source | Used for |
|---|---|
| `Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx` | Full campaign premise, rules, progression, narrative, setup, objectives, endings, mirrors, optional modes, and campaign log |
| `Core_Protocol_v1.1_Quickplay_Companion(1).docx` | Condensed setup reference and recommended aspect route |
| `Core_Protocol_v1.1_Quickplay_Companion(1).pdf` | Visual/print companion reference and page-level QA |
| `marvel_champions_journey_tracker_v2_core_protocol(1).xlsx` | Bilingual 359-row card index, collection model, progress/deck/rules fields, and spreadsheet formula cross-check |

## Rule traceability

| Domain rule | Source location |
|---|---|
| 15 story + 20 mirrors | Campaign Dossier → Campaign Structure; Mirror Protocol |
| Setup order | Campaign Dossier → Core Loop → Setup Order |
| Aspect Passport | Campaign Dossier → Deckbuilding → Aspect Passport; Quickplay recommended route |
| Intel/Network/Scars | Persistent State → Campaign Tracks |
| Act Recovery | Campaign Tracks and both Interludes |
| Adaptations | Difficulty Pressure → Network Adaptations |
| Field Assets | Campaign Rewards → Field Assets |
| Masteries | Hero Development → Hero Mastery |
| Issue content | Issue 01 through Issue 15 tables |
| Final Preparation | Act III → Final Preparation |
| Endings | Finale → Campaign Endings |
| Mirror rows | Post-Campaign → Mirror Protocol |
| Bilingual names | Reference → English ↔ Spanish; tracker Card Reference sheet |

## Source-derived versus product design

### Source-derived

- campaign content, order, thresholds, flags, choices, consequences, endings, and mirrors;
- true-solo format and Core Set requirement;
- recommended aspect route;
- bilingual official/localized card names present in source;
- tracker/log field inventory.

### Product design added for implementation

- event-sourced save model;
- IndexedDB/local-first architecture;
- optional Supabase sync;
- page routes and navigation;
- live optional HP/threat counters;
- PWA/offline behavior;
- comic design tokens and component system;
- MarvelCDB adapter, cache strategy, and rights kill switches;
- accessibility, security, testing, and CI requirements.

These additions must not alter the authored campaign rules.

## Open decision OD-001 — Undefined ending branch

**Source state:** The finale says a win with Network 0–3 earns **Avengers Assemble** only with at least four Mastery stars. It defines **Machine Broken** for Network 4–6 and **Pyrrhic Shutdown** for 7+, but no ending for Network 0–3 with zero to three Masteries.

**Safe implementation:** `resolveEnding()` returns `needs_author_decision`, displays the criteria, and preserves completion. Do not fall through to Machine Broken or Avengers Assemble.

**Author decision needed:** add a fallback ending or broaden an existing criterion in a future campaign content version.

## Open decision OD-002 — Full Spanish narrative

The source includes bilingual names but not a complete Spanish narrative/setup translation. English fallback is required. A future translation needs an approved source, attribution, review, and a content-only version bump.

## Open decision OD-003 — Public card imagery

Public API availability and noncommercial intent do not settle image rights. Production images remain disabled until the launch checklist is complete. Metadata-only mode is the release-safe default.

## Open decision OD-004 — Canon Mode aspect changes on retries

The source defines replay-until-win but does not state whether aspect choice may change between retries. Proposed safe UX: allow changing with a warning; record every attempt; stamp the main-story Aspect Passport from the winning/committed issue result. This should be approved or changed before Canon Mode leaves beta.

## Open decision OD-005 — “Other loss” consequences

The source quantifies hero defeat and main-scheme completion only. For a card-specific loss or abandoned game, default to no automatic track change and require explicit review. Do not map it silently to main-scheme loss.

## Open decision OD-006 — Issue 11 trigger semantics

The authored text says “The first time Defense Network leaves play.” The companion should reproduce that phrase and ask the player to confirm the trigger. It should not reinterpret why or how the side scheme left play.

## Open decision OD-007 — Future Rise of Red Skull scope

The tracker includes Core Set and The Rise of Red Skull, but Core Protocol itself requires only the Core Set. The architecture supports more packs and campaigns; the MVP must not invent Rise of Red Skull campaign content.

## Approved revision AR-001 — Optional Aspect Passport

Playtest Feedback 001 is the approved amendment for campaign content version 1.2.0. Main-story heroes remain mandatory, but any campaign aspect is legal. The recommended route remains a teaching suggestion. A hero/aspect stamp is recorded only when that hero wins an issue with that aspect; stamps are optional progression and never block story advancement. The existing first-Mirror rule remains unchanged when a fourth unused aspect is determinable.

## Approved revision AR-002 — Player-focused primary navigation

Player feedback found that standalone Cards, Decks, and Rules tabs were not used during campaign play. The primary shell now focuses on Campaign, Account, and Settings. Existing reference routes and stored deck/rules records remain intact for backward compatibility and export/import safety; exact card identification remains part of issue preparation.

## Content change protocol

Every source-level change requires:

1. decision ID and rationale;
2. updated authored document or approved amendment;
3. campaign definition diff;
4. golden test update;
5. content version bump;
6. save migration assessment;
7. Quickplay and tracker parity review.
