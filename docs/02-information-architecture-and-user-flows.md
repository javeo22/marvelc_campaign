# 02 — Information architecture and user flows

## Navigation model

The app uses a compact bottom navigation on phones and a rail on larger screens.

- **Campaign** — current issue, tracks, resume, progress.
- **Play** — active session; hidden/disabled when no game is active.
- **Reference** — cards, deck log, rules log.
- **Journey** — hero passport, flags, completion grid, Mirror Protocol.
- **Account** — optional username/password sign-in, cloud upload/download, sync status.
- **Settings** — language, display, backups, image mode, legal notice.

## Route map

```text
/
/onboarding
/campaigns
/campaigns/new
/campaigns/[saveId]
/campaigns/[saveId]/issue/[issueNumber]/prepare
/campaigns/[saveId]/issue/[issueNumber]/play
/campaigns/[saveId]/issue/[issueNumber]/debrief
/campaigns/[saveId]/interlude/[interludeId]
/campaigns/[saveId]/finale
/campaigns/[saveId]/journey
/campaigns/[saveId]/passport
/campaigns/[saveId]/mirror
/reference/cards
/reference/decks
/reference/rules
/account
/settings
/settings/backup
/settings/about
```

## First-run flow

1. **Splash panel** — original Core Protocol wordmark, fan notice, Continue.
2. **Play mode** — Fail-forward recommended or Canon Mode.
3. **Languages** — UI/narrative and physical card names separately.
4. **Display** — comic light/dark/system, reduced motion, large table controls.
5. **Card images** — metadata-only default; remote images unavailable until launch gate is enabled.
6. **Save name** — default “Core Protocol.”
7. **Campaign opens** — Issue 1 panel and a short “how this companion works” overlay.

## Campaign dashboard

Above the fold:

- Issue number, title, hero portrait placeholder or permitted card thumbnail, villain, tier, aspect.
- Primary action: **Prepare Issue**, **Resume Fight**, **Finish Debrief**, or **Choose Interlude**.
- Intel and Network meters with next threshold.
- Current hero Scar chips.
- Active Network Adaptations.
- Unlocked Field Asset count.

Below:

- act progress strip;
- objective flags and Masteries;
- recent activity;
- quick links to passport, completion grid, decks, rules, and backup.

## Preparation wizard

### Panel 1 — Cast and loadout

Show hero/villain/modular/tier, villain stages, encounter sets, bilingual names, card-reference links, and recommended aspect.

### Panel 2 — Aspect Passport

Show all four aspects with used, recommended, and passport-stamp states. Every campaign aspect is legal in the main story; the route is a teaching suggestion, and a win with a new hero/aspect combination adds an optional passport stamp.

### Panel 3 — Field Assets

Show only unlocked assets. Display one slot normally or two slots at Network 6+. Explain the Issue 15 Endgame Protocol exception.

### Panel 4 — Setup sequence

Render a vertical sequence with explicit checkpoints:

1. Issue pre-setup and set-aside actions.
2. Physical game’s normal setup.
3. Campaign setup, continuity flags, and Interlude effects.
4. Network adaptations and Final Preparation.
5. Opening hand and mulligan.
6. Prepared Ambush, when active.

The player confirms each physical step. The app never marks a card effect as resolved without a tap.

### Panel 5 — Mission objective

Show the objective, tracker behavior, timing, flag reward, and whether it persists after a loss or explicitly requires a win.

### Panel 6 — Ready

Summarize selected aspect, starting Scar penalty, Field Assets, extra encounter cards, Tough/status modifications, threat changes, and optional counter presets. **Start Issue** commits the preparation selections atomically.

## Table mode

The default layout is a calm dashboard inside an energetic comic frame:

- persistent header: Issue, round, offline/save status, quick exit;
- objective panel: counter/checklist/deadline plus “Record objective now”;
- hero panel: optional HP and Scar reminder;
- villain/main scheme panel: optional stage, HP, and threat;
- Field Assets: large ready/used cards;
- Mastery panel: condition and “Earned” action if not already unlocked;
- quick note and activity/Undo drawer;
- **End Game** button protected from accidental taps.

A “minimal table view” hides optional HP/villain controls and leaves only campaign-required tracking.

## Debrief flow

1. Choose **Win**, **Hero defeated**, **Main scheme completed**, **Other loss**, or **Abandoned**.
2. Confirm objective status. If it was already recorded, show locked earned state.
3. Confirm newly earned Mastery, with idempotent check.
4. Preview all deltas before saving:
   - Intel change and unlocks;
   - Network change and newly active adaptations;
   - Scar change;
   - flag and aspect record;
   - official matchup clear when applicable.
5. Commit debrief as one transaction.
6. Read the appropriate authored result narrative.
7. Move to Interlude/Recovery/finale/next issue according to source state.

## Interlude and recovery flow

The choice is presented as two opposing full-width comic panels. Each panel clearly shows the future help and future cost. The player confirms the choice, then sees an Act Recovery calculation with both conditions shown independently. One action commits choice and recovery events in source order.

## Finale flow

Before Issue 15, show Final Preparation points derived from four named flags. During setup, each spend is recorded against one of three authored options. After the debrief, resolve an ending. If the source’s undefined branch occurs, show a neutral “Campaign author decision required” panel with the exact criteria and preserve the completed save.

## Error and recovery states

- **Interrupted write:** reopen last valid event sequence; offer retry.
- **Invalid import:** identify schema/migration errors without partially importing.
- **Definition version mismatch:** migrate a copy; retain original backup.
- **MarvelCDB unavailable:** use bundled bilingual reference and hide remote imagery.
- **Remote image fails:** replace with metadata panel, never broken-image chrome.
- **Storage quota:** prompt export, then allow cleanup; never silently discard a save.
- **Cloud conflict:** retain both branches until deterministic merge or user choice.
