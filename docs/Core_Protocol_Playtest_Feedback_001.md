# Core Protocol Companion — Playtest Feedback 001
**Date:** 2026-09-10  
**Playtest:** Issue 01 — The Break-In  
**Hero / Aspect:** Spider-Man / Protection  
**Result:** Loss  
**Purpose:** Capture first real table-use feedback for the next app/campaign revision.

## 1. Issue Preparation Needs to Be Visual

### Problem
The preparation screen is too text-dependent. When the campaign mentions a hero, villain, modular set, side scheme, or set-aside card, the player still has to identify those cards physically.

### Change
Every mentioned physical card or set should have a visual reference.

For Issue 01, the preparation screen should visually show:
- Spider-Man identity
- Rhino I and Rhino II
- Bomb Scare / Amenaza de bomba modular set
- Bomb Scare side scheme that must be set aside
- Standard encounter set
- A clear indication that the Bomb Scare side scheme is revealed after normal setup

### Preferred UX
Add a **Visual Setup** view in addition to the checklist.

Suggested layout:

    PLAYER AREA                     VILLAIN AREA
    [Spider-Man image]              [Rhino I] -> [Rhino II]
    Aspect: chosen by player        Main Scheme

                                    ENCOUNTER DECK
                                    Standard set
                                    + Bomb Scare modular set

    SET ASIDE
    [Bomb Scare side scheme image]
    "Reveal after normal scenario setup"

Use arrows / numbered steps so the layout teaches the physical setup.

### Card Image Behavior
- Show thumbnail whenever a specific card is named.
- Tap/click opens a larger image.
- Show English and Spanish names together where possible.
- Modular sets should have a small visual gallery or expandable card list.
- Keep card imagery as reference material; do not reproduce unnecessary full-resolution assets.

---

## 2. Reconsider Forced Aspects

### Current Behavior
Core Protocol v1.1 requires each hero to use a new aspect on each main-story appearance. The recommended first route starts Spider-Man with Protection.

### Playtest Feedback
Spider-Man Protection in Issue 01 felt very hard in true solo.

The mandatory-aspect rule can create difficulty for reasons unrelated to the scenario itself:
- some hero/aspect combinations have weak threat control in true solo;
- the player may be forced into a deck that does not fit the matchup;
- losses may feel caused by the campaign restriction rather than deckbuilding decisions;
- it reduces the fun of learning how to build a hero for a specific problem.

### Proposed Rule Change
**Heroes remain mandatory for main-story issues. Aspects become player choice.**

The campaign can still encourage learning every aspect through the **Aspect Passport**, but it should be optional progression instead of a legality requirement.

Suggested structure:

- **Recommended Aspect:** the campaign's teaching suggestion.
- **Choose Any Aspect:** always legal.
- **Aspect Passport:** mark an aspect when that hero completes an issue using it.
- **Aspect Mastery achievements:** reward breadth without blocking progress.

Possible achievements:
- **Versatile Hero:** Win with a hero using 2 different aspects.
- **Four Corners:** Win at least once with that hero using all 4 aspects.
- **Avengers Academy:** Complete at least one issue with every aspect across the roster.
- Optional badges / cosmetic completion percentage in the app.

The recommended route remains useful for players who specifically want a guided learning curriculum.

### App Copy
Instead of:
> Pick an aspect that hero has not used earlier in the main story.

Use:
> **Recommended: Protection**  
> Choose any legal aspect and build the deck you think best fits Spider-Man and this mission.  
> Trying a new aspect advances your optional Aspect Passport.

---

## 3. Loss Resolution / Network UX Is Not Clear Enough

### Problem
After losing Issue 01, the app changed or displayed Network-related state without explaining what Network is or why the value changed.

This is a major onboarding problem because Issue 01 is the first time a player can interact with the persistent campaign systems.

### Rules That Need to Be Explained In-App
- **Hero defeated:** +1 Network and +1 Scar to that hero.
- **Main scheme completed:** +2 Network.
- Network represents Ultron learning/adapting from Avengers failures.
- Network penalties are cumulative.
- Thresholds:
  - **2 — Early Warning:** +1 threat on main scheme after standard setup.
  - **4 — Reinforced Chassis:** villain begins with Tough.
  - **6 — Prepared Ambush:** extra facedown encounter card after opening hand/mulligan.
  - **8 — Predictive Model:** first villain activation gets +1 ATK or +1 SCH.
  - **10 — Recursive Backup:** villain gains Tough after advancing to its next stage if it does not already have one.
- A Scar reduces that hero's starting hit-point dial by 1 on the next issue played with that hero; it does not reduce maximum HP.
- Winning with that hero removes 1 Scar.

### Required Post-Game Flow
When the player presses **Loss**, do not immediately return to the campaign map.

Ask:

**How did the issue end?**
- Hero defeated
- Main scheme completed

Then show a result panel.

Example for hero defeat:

    DEFEAT
    Rhino escaped with the stolen case.

    NETWORK +1
    0 -> 1

    Why?
    Ultron learns from every Avengers failure.

    Current Network effects:
    None.

    Next adaptation at Network 2:
    EARLY WARNING
    Start future issues with +1 threat on the main scheme.

    SPIDER-MAN SCAR +1
    Next time Spider-Man begins an issue, start his HP dial 1 lower.
    Win an issue with Spider-Man to remove one Scar.

    [Replay Issue]   [Return to Campaign]

Example for main-scheme loss:

    NETWORK +2
    0 -> 2

    NEW ADAPTATION UNLOCKED
    EARLY WARNING
    After standard setup, place +1 threat on the main scheme.

The app should emphasize newly activated consequences with a reveal/animation or comic-panel treatment.

---

## 4. Network Should Have Its Own Help Surface

Add a tappable **Network** meter in the campaign header.

Expanded panel should show:
- current value;
- narrative explanation;
- all thresholds;
- active adaptations highlighted;
- next threshold;
- how Network rises;
- how Act Recovery can lower it;
- the true-solo compensation at Network 6+ (two Field Assets).

The same applies to **Intel** and **Scars**.

A player should never need to open the full campaign PDF to understand a number shown by the app.

---

## 5. Issue 01 Should Function as Onboarding

Issue 01 is the first real campaign game, so it needs more explanation than later issues.

Add small contextual callouts:
- **Optional Objective — Why it matters:** gives +1 Intel even if the player later loses.
- **Mastery — Why it matters:** first-time Hero Mastery gives +1 Intel and remains earned even after a loss.
- **Network — First Loss tutorial:** explain only when first relevant.
- **Scar — First Hero Defeat tutorial:** explain only when first relevant.
- **Aspect Passport — Optional challenge:** explain when choosing a deck.

After the player has seen each tutorial once, collapse it into a tooltip/help icon.

---

## 6. Suggested Issue 01 Prep Screen

### Header
**ISSUE 01 — THE BREAK-IN**  
Spider-Man vs Rhino  
Standard • Bomb Scare

### Story Panel
Short issue intro.

### Step 1 — Choose Your Deck
**Hero:** Spider-Man  
**Recommended Aspect:** Protection  
**Aspect:** [Protection] [Justice] [Aggression] [Leadership]

Caption:
> Any legal aspect may be used. A new aspect advances the optional Aspect Passport.

### Step 2 — Gather These Cards
Visual cards/sets:
- Spider-Man
- Rhino I
- Rhino II
- The Break-In! main scheme
- Standard encounter set
- Bomb Scare modular set

### Step 3 — Set Aside
Large image:
- Bomb Scare side scheme

Caption:
> Do not shuffle this card into the encounter deck. Reveal it after normal scenario setup.

### Step 4 — Setup Diagram
Graphical table layout showing where each deck/card goes.

### Step 5 — Campaign Modifiers
Network: 0  
**No Network Adaptations active.**

Field Assets: none unlocked (or currently available assets if applicable).

### Step 6 — Objective
> Defeat Bomb Scare before Rhino advances to stage II.

Reward:
> +1 Intel. This remains earned even if you later lose the issue.

### Start Issue
[START ISSUE]

---

## 7. Priority for Next App Revision

### P0 — Must Fix
1. Post-loss explanation for Network and Scars.
2. Ask the player whether the loss was hero defeat or main-scheme completion.
3. Do not force the recommended aspect in the app.
4. Clearly distinguish **recommended aspect** from **required hero/scenario setup**.

### P1 — High Value
5. Card thumbnails for every specifically referenced card.
6. Visual setup layout for each issue.
7. Tap-to-expand Network / Intel / Scar explanations.
8. Show active and upcoming Network adaptations.

### P2 — Polish
9. Aspect Passport achievements and completion badges.
10. Comic-style unlock animation when Network adaptation / Intel asset becomes active.
11. Bilingual card-name toggle or paired English / Spanish labels.
12. “Why?” captions for objectives and special setup rules.

---

## Proposed Campaign Rule Revision

### Aspect Passport — revised
The listed hero is mandatory in each main-story issue. The player may use any legal aspect and rebuild freely between games and attempts. Each issue may recommend an aspect as part of the campaign's learning route, but the recommendation is not a deckbuilding restriction.

Track each aspect used to win with each hero in the optional **Aspect Passport**. Completing new hero/aspect combinations earns campaign achievements or completion badges but is not required to advance the story.

This preserves the campaign's goal of encouraging variety while allowing true-solo players to solve each matchup through deckbuilding.
