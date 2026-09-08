# 00 — Executive brief

## Product vision

**Core Protocol Companion** turns a carefully authored paper campaign into a polished, installable web companion for actual table play. It should feel like opening a modern comic issue: the previous chapter, the mission briefing, a precise setup sequence, the fight dashboard, and the debrief all form one continuous experience.

The product’s value is not rules automation. Its value is reducing cognitive overhead while preserving physical play. It remembers every persistent consequence, makes the correct next setup obvious, and gives the player confidence that nothing from the campaign log was missed.

## Primary user context

The first user plays true solo, owns Spanish physical products, speaks about the game in English, and wants to explore heroes, aspects, villains, and difficulty progressively. The UI therefore needs two separate language preferences:

- **Interface/narrative language**, initially English.
- **Physical-card naming language**, English, Spanish, or both.

The source contains English campaign narrative and bilingual names for relevant Core heroes, villains, modular sets, and signature cards. It does not contain a full Spanish campaign translation.

## Product promise

At any moment the app answers four questions:

1. What do I set up next, and in what exact order?
2. What from earlier issues changes this game?
3. What campaign-specific details do I need to track while playing?
4. What changed when the game ended?

## Product principles

- **Table first.** Large controls, low glare, immediate actions, minimal typing.
- **Source faithful.** Campaign prose and mechanics are data, not hard-coded guesses.
- **Manual game authority.** The player confirms physical events; the app does not pretend to know the board.
- **Deterministic continuity.** The same event journal always produces the same campaign state.
- **Offline by default.** Campaign play never depends on MarvelCDB, login, or a server.
- **Bilingual identification.** English conversation and Spanish physical cards coexist naturally.
- **Comic energy, rules clarity.** Visual character without sacrificing accessibility.
- **Rights-aware.** The fan-project posture is supported by technical limits, not only a disclaimer.

## MVP definition

The first complete release includes:

- multiple local campaign saves;
- fail-forward and optional Canon Mode;
- all 15 story issues and 20 Mirror Protocol games;
- guided preparation and setup sequencing;
- persistent campaign engine and live table tracker;
- debrief with automatic consequences;
- Interludes, Act Recovery, Final Preparation, endings, and secret epilogue;
- hero passport, completion matrix, deck log, rules log, and session notes;
- bilingual card-name search from the 359-row tracker export;
- optional MarvelCDB metadata enhancement;
- installable PWA, offline content, autosave, and JSON backup/restore;
- a metadata-only card display that remains fully useful with images disabled.

## Deliberately deferred

- Account creation and cloud sync.
- MarvelCDB OAuth deck editing.
- Additional fan or official campaigns.
- Multiplayer campaign variants.
- Full Spanish campaign narrative.
- Social sharing, public profiles, leaderboards, or analytics.
- Any full Marvel Champions rules or card simulation.

## Success criteria

The app succeeds when a player can complete the campaign without touching the paper tracker, while still needing the physical game. A successful play session begins offline, survives app suspension or browser termination, clearly records optional achievements at the correct time, and produces an auditable debrief with no duplicate rewards.
