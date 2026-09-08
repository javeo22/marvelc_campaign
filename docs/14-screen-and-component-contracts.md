# 14 — Screen and component contracts

This document defines the UI handoff at a level suitable for direct implementation. It complements the information architecture and design system; it does not replace the campaign reducer or duplicate source-derived rules.

## 14.1 Route contract

| Route | Rendering boundary | Required data | Primary action | Required failure states |
|---|---|---|---|---|
| `/` | Server shell + client save list | Local save summaries | Open or create campaign | IndexedDB unavailable, corrupt summary, empty library |
| `/campaigns/new` | Server content + client form | Campaign manifest, modes | Create local save | Definition invalid, storage denied |
| `/campaigns/[saveId]` | Server shell + client snapshot | Valid save + definition | Continue required transition | Save missing, migration required, read-only unknown event |
| `/campaigns/[saveId]/issues/[issueNumber]/prepare` | Server issue content + client plan state | Definition, snapshot, composed setup plan | Confirm setup and start issue | Stale snapshot, illegal issue, missing content reference |
| `/campaigns/[saveId]/play` | Client table surface inside server shell | Active session, reminders, selectors | Update table state / enter debrief | No active session, recovered autosave, write failure |
| `/campaigns/[saveId]/debrief` | Server issue content + client transaction form | Active session and computed consequence preview | Commit result | Already committed, sequence conflict, unresolved input |
| `/campaigns/[saveId]/interlude/[interludeId]` | Server content + client choice | Eligible Interlude and Recovery preview | Commit one choice and Recovery | Not eligible, already chosen, sequence conflict |
| `/campaigns/[saveId]/finale` | Server content + client ending state | Issue 15 result, Network, Intel, Masteries, flags | Resolve ending / acknowledge author gap | `needs_author_decision`, invalid finale history |
| `/campaigns/[saveId]/mirror` | Server table + client filters | Story history, Mirror rows, passport | Start or record a mirror | First-Mirror aspect violation, duplicate record |
| `/campaigns/[saveId]/passport` | Server layout + client filters | Aspect, Scar, Mastery selectors | Inspect hero completion | No special empty state |
| `/cards` | Server shell + client search | Bundled bilingual index, optional API adapter | Find a physical card | Upstream offline, ambiguous match, metadata-only fallback |
| `/decks` | Client log | Local deck records | Add/edit deck log | Invalid external URL, storage failure |
| `/rules` | Client log | Local rules notes | Add/edit note | Personal note not verified, source unavailable |
| `/settings` | Server shell + client preferences | UI settings schema | Save preferences / export data | Unsupported setting migration, export failure |

Dynamic route parameters use the modern asynchronous App Router conventions. Route pages must validate identifiers before loading user state and use `notFound()` only for genuinely absent resources, not for storage or migration failures.

## 14.2 Screen-state rule

Every route implements these states explicitly:

1. **Loading** — stable skeleton preserving final layout dimensions.
2. **Ready** — primary task is obvious without scrolling on a typical phone.
3. **Empty** — explains the next useful action; never a blank panel.
4. **Recoverable error** — retains valid local data and offers Retry, Export, or Open read-only as appropriate.
5. **Fatal content error** — identifies the content path/schema failure and blocks campaign mutation.
6. **Offline** — labels stale remote metadata while keeping campaign play fully functional.
7. **Read-only compatibility mode** — unknown future event or unsupported save version; permit inspection/export, prevent writes.

## 14.3 App shell

### `AppFrame`

Responsibilities:

- safe-area insets and maximum content width;
- global skip link and landmark order;
- responsive bottom navigation on phone, side rail on tablet/desktop;
- offline, migration, and pending-write status;
- no character art or official logo in the shell.

The shell cannot own campaign values. Intel, Network, and current issue are selectors passed from the route boundary.

### `ComicHeader`

Props:

```ts
interface ComicHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  issueNumber?: number;
  tone?: 'neutral' | 'intel' | 'network' | 'danger' | 'success';
  actions?: React.ReactNode;
}
```

The visual angle, halftone, or offset shadow is decorative. DOM reading order remains eyebrow → title → subtitle → actions.

## 14.4 Campaign components

### `IssueCover`

Shows issue number, title, Act, hero, villain, modular set, tier, and recommended aspect. The default cover uses original abstract line work. An external card image is never required for layout integrity.

Required variants: locked, available, in progress, completed win, completed loss, retry required, mirror.

### `TrackMeter`

```ts
interface TrackMeterProps {
  label: string;
  value: number;
  thresholds: Array<{ value: number; label: string }>;
  nextThreshold?: number;
  tone: 'intel' | 'network';
  describedBy?: string;
}
```

The meter must expose the numeric value and threshold text to assistive technology. Color and fill position are redundant cues.

### `AspectPassportGrid`

Inputs are derived passport rows. The component never decides legality. Each hero row shows the four aspects, three story appearances, first-Mirror requirement, Scars, and Mastery. Illegal selections return a reducer error and are announced in a live region.

### `FieldAssetSelector`

Inputs:

- unlocked asset list;
- normal slot limit selector;
- equipped and used IDs;
- optional Endgame Protocol extra slot;
- source effect text.

Disabled assets explain why: insufficient Intel, wrong issue, slot full, or already used. The component does not evaluate timing windows.

### `AdaptationStack`

Displays every active cumulative Network Adaptation in threshold order. A temporarily suppressed adaptation remains visible with its reason and expiry. In-game reminders are pinned in table mode.

### `ScarChip`

Shows 0–2 scars and the resulting starting-dial adjustment. Never states that maximum hit points changed. The chip is read-only outside explicit correction tooling.

## 14.5 Preparation components

### `SetupStepper`

Consumes `ComposedSetupPlan`, not raw prose. It renders groups by phase order and sends only completion UI events; confirmation state is ephemeral until `ISSUE_STARTED` unless the product chooses to persist preparation progress.

Required behavior:

- retain `sourceStep`, `sourceText`, and `includedBecause` in the diagnostics drawer;
- generated global steps are visually distinguished from issue-authored steps;
- conditional steps show the triggering flag, choice, Intel threshold, or Network rule in plain language;
- persistent reminders are copied into the live session, not marked complete;
- a user may return to previous steps without losing selections;
- “Start issue” is disabled until every required confirm/interactive step is resolved.

### `ObjectiveBrief`

Shows objective, flag reward, tracker controls to be enabled, whether a win is required, and when Intel is recorded. It must not imply that the app can observe the physical game.

## 14.6 Table-mode components

### `TableCommandBar`

Large controls for round, note, undo, display lock, and debrief. The main controls target at least 52 px. The bar remains reachable with one hand and does not cover objective content.

### `ObjectiveTracker`

Use a discriminated component map keyed by `tracker.kind`. Do not create a generic free-form tracker for source objectives.

| Kind | UI | Commit rule |
|---|---|---|
| `check` | One checkbox | Immediate when confirmed |
| `compound_check` | Multiple required checks | Immediate after all confirmed |
| `counter` | Stepper with target | Immediate at target confirmation |
| `compound_counter` | Checklist plus counter | Immediate when both satisfied |
| `distinct_counter` | Named-entry chips plus count | Immediate after target distinct names |
| `deadline_check` | Check plus deadline action | Missed after deadline action unless corrected |
| `round_deadline` | Check plus round boundary | Missed after deadline round unless corrected |
| `end_state` | Board-state checks | Finalize in debrief when game ends |
| `win_end_state` | Win plus checks/metric | Debrief only |

The app records player confirmation, not inferred legality.

### `CounterControl`

Plus/minus buttons, direct numeric edit, minimum zero, optional target. Repeated changes may be coalesced in local UI, but the persisted event must preserve the final semantic change and remain undoable.

### `ExternalCardImage`

```ts
interface ExternalCardImageProps {
  mode: 'off' | 'remote';
  src: string | null;
  alt: string;
  attribution?: string | null;
  unavailableReason?: string | null;
}
```

Rules:

- render a text/metadata card when mode is `off`, URL is absent, request fails, or mapping is uncertain;
- use a direct allowlisted upstream URL only after the rights launch gate is complete;
- never use an application image proxy, optimizer cache, download button, lightbox gallery, or offline cache;
- preserve layout dimensions so image failure does not move controls.

## 14.7 Debrief components

### `ConsequencePreview`

Shows prior mid-game awards separately from new debrief deltas. It lists current and resulting Intel, Network, Scars, flags, Masteries, current issue, next transition, and any Act Recovery eligibility. The preview is pure selector output.

### `CommitResultDialog`

Requires a result and any win-gated objective decision. “Other loss” requires explicit zero-consequence acknowledgement or a manual correction reason. The commit button shows the number of append-only events to be written.

After a successful transaction, the app presents a result splash and one clear next action. A network/sync failure does not roll back a committed local result.

## 14.8 Reference results

`BilingualCardResult` displays:

- primary name according to physical-card language;
- secondary English/Spanish name;
- pack and set in both languages where available;
- collector number and category;
- match confidence/status;
- external source action;
- optional image area governed by `ExternalCardImage`.

Ambiguous results show all candidates and require player selection. Fuzzy matching may rank but may not auto-select an image.

## 14.9 Dialogs, sheets, and confirmations

Use modal dialogs for destructive or irreversible commits; use bottom sheets for reference/help on phone. Focus returns to the triggering control. Escape/back closes non-destructive surfaces. A debrief commit, save deletion, import replacement, manual correction, and Mirror reset all require confirmation.

## 14.10 Copy contract

- “Record” means append to campaign history.
- “Confirm” means the player attests to a physical-board fact.
- “Complete” is reserved for objectives, issues, and checklists.
- “Use” marks a once-per-game Field Asset spent; it never claims legal timing.
- “Official clear” appears only for Standard or Expert, never Veteran.
- Unknown or source-undefined behavior is named plainly; do not conceal it behind a generic error.

## 14.11 Component acceptance evidence

For each signature component, the code agent supplies:

- Storybook or an equivalent isolated example for every variant;
- keyboard and screen-reader checks;
- phone portrait, phone landscape/foldable, tablet, and desktop screenshots;
- reduced-motion rendering;
- loading, empty, error, offline, and high-content-length states;
- component tests asserting semantic names and state, not CSS class names.
