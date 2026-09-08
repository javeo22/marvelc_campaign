# Responsive wireframes

These are structural wireframes, not final visual comps. Apply `design/tokens.json` and the design-system specification.

## Phone — campaign dashboard

```text
┌──────────────────────────────────────┐
│ CORE PROTOCOL       Offline ✓   ⚙︎  │
├──────────────────────────────────────┤
│ ISSUE 06 // ECHO CHAMBER             │
│ Spider-Man · Spiderman               │
│ vs Klaw · Under Attack               │
│ VETERAN                 JUSTICE      │
│                                      │
│ [ PREPARE ISSUE ]                    │
├──────────────────┬───────────────────┤
│ INTEL 12         │ NETWORK 2         │
│ ████████░ next15 │ ██░░ next4        │
├──────────────────┴───────────────────┤
│ ACTIVE: Early Warning                │
│ SCARS: Spider-Man 0                  │
├──────────────────────────────────────┤
│ ACT II   ● ○ ○ ○ ○                   │
│ Recent: Hydra Lead chosen            │
└──────────────────────────────────────┘
 Campaign   Play   Reference   Journey
```

## Phone — preparation stepper

```text
┌──────────────────────────────────────┐
│ ← ISSUE 06 SETUP              3 / 6 │
├──────────────────────────────────────┤
│ ① CAST & TIER                  ✓     │
│ ② ASPECT                       ✓     │
│ ③ CAMPAIGN SETUP                     │
│ ┌──────────────────────────────────┐ │
│ │ □ Set Under Attack aside.        │ │
│ │ □ Complete normal Klaw setup.    │ │
│ │ □ Reveal Under Attack.           │ │
│ │ □ MASTERS BROKEN missing? +1.    │ │
│ └──────────────────────────────────┘ │
│ ④ NETWORK                            │
│ ⑤ OPENING HAND                       │
│ ⑥ MISSION OBJECTIVE                  │
│                                      │
│ [ BACK ]                [ CONTINUE ] │
└──────────────────────────────────────┘
```

## Phone — table mode

```text
┌──────────────────────────────────────┐
│ ISSUE 07     ROUND 3     Saved ✓    │
├──────────────────────────────────────┤
│ OBJECTIVE // EVACUATION              │
│ Bomb Scare defeated       [  ✓  ]   │
│ Drone Evacuation          −  4  +   │
│ Target: 5                            │
│ [ RECORD OBJECTIVE NOW ]             │
├──────────────────────────────────────┤
│ FIELD ASSETS                         │
│ [S.H.I.E.L.D. Recon READY]           │
│ [Damage Control USED]                │
├───────────────┬──────────────────────┤
│ HERO HP − 8 + │ SCHEME − 3 +         │
│ VILLAIN II    │ Notes ▾              │
├───────────────┴──────────────────────┤
│ Undo last action         [ END GAME ]│
└──────────────────────────────────────┘
```

## Tablet/foldable — table mode

```text
┌──────────┬─────────────────────────────┬───────────────┐
│ Journey  │ OBJECTIVE / LIVE PLAY       │ Activity      │
│ Intel 12 │ ┌─────────────────────────┐ │ 20:31 +Drone  │
│ Net 6    │ │ Drone Rescue  −  3  +  │ │ 20:29 Round3 │
│ Scar 1   │ │ Master defeated [ ]     │ │ Undo         │
│          │ └─────────────────────────┘ │               │
│ Assets   │ ┌───────────┬─────────────┐ │ Notes         │
│ [Ready]  │ │ Hero HP   │ Main Threat │ │ ...           │
│ [Used ]  │ │  − 7 +    │   − 4 +     │ │               │
│          │ └───────────┴─────────────┘ │               │
│          │ [ MINIMAL VIEW ] [END GAME] │               │
└──────────┴─────────────────────────────┴───────────────┘
```

## Debrief

```text
┌──────────────────────────────────────┐
│ DEBRIEF // ISSUE 03                  │
│                                      │
│ Result: [Hero defeated]              │
│ Objective: DRONE SAMPLE earned ✓     │
│ Mastery: GAMMA SLAM earned ✓         │
│                                      │
│ CONSEQUENCES                         │
│ Intel        +0 this debrief         │
│ Network      0 → 1                   │
│ She-Hulk     Scar 0 → 1              │
│ Story        Advance (Fail-forward)  │
│                                      │
│ [ EDIT ]              [ COMMIT ]     │
└──────────────────────────────────────┘
```
