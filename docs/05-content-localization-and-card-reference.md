# 05 — Content, localization, and card reference

## Source content policy

The campaign DOCX is the authority for narrative and full setup wording. The Quickplay Companion supplies condensed table guidance and the recommended aspect route. The journey tracker supplies the bilingual card index, extended collection reference, and log fields.

The app bundles the campaign’s original fan-authored text and machine-readable rules. It does not bundle full official card text or images.

## Language model

Use two independent settings:

```ts
uiLanguage: 'en' | 'es'
physicalCardLanguage: 'en' | 'es' | 'both'
```

Current content availability:

| Content | English | Spanish |
|---|---:|---:|
| App chrome | Required | Required |
| Campaign narrative | Source available | Not in source |
| Campaign setup/objectives | Source available | Not in source |
| Hero/villain/modular names | Source available | Source available |
| Signature card names | Source available | Source available |
| 359-row collection card names | Source available | Source available |

Spanish UI may therefore display English campaign paragraphs with a compact **English source text** badge until an approved translation is added. Never silently machine-translate stored campaign content and present it as authored.

## Name display

Examples:

- English: `Under Attack`
- Spanish physical: `Civiles en peligro`
- Both: `Under Attack · Civiles en peligro`

Preserve the tracker’s official/localized spelling, even when it is not a literal translation. Search normalizes accents and punctuation but display does not.

## Stable identity rules

Do not key cards by collector number alone. Use:

```text
(pack or pack_code, collector_number, side/code)
```

The export includes a local `record_id` and optional MarvelCDB code. Core codes are derived from the documented pattern and are marked for API fixture verification.

## Campaign issue matrix

| # | Issue | Hero | Villain | Modular | Tier | Recommended aspect | Flag |
|---:|---|---|---|---|---|---|---|
| 01 | The Break-In | Spider-Man | Rhino | Bomb Scare | Standard | Protection | BOMB DEFUSED |
| 02 | Sound Money | Captain Marvel | Klaw | Masters of Evil | Standard | Leadership | MASTERS BROKEN |
| 03 | Machine In The Static | She-Hulk | Ultron | Under Attack | Standard | Aggression | DRONE SAMPLE |
| 04 | Mind Over Metal | Iron Man | Rhino | The Doomsday Chair | Standard | Justice | M.O.D.O.K. PROFILED |
| 05 | The Vibranium Trail | Black Panther | Klaw | Legions of Hydra | Standard | Justice | HYDRA LEDGER |
| 06 | Echo Chamber | Spider-Man | Klaw | Under Attack | Veteran | Justice | SONIC KEY |
| 07 | City Of Drones | Captain Marvel | Ultron | Bomb Scare | Veteran | Aggression | EVACUATION COMPLETE |
| 08 | Hard Case | She-Hulk | Rhino | Legions of Hydra | Veteran | Leadership | RHINO CONFESSION |
| 09 | Counterfrequency | Iron Man | Klaw | Masters of Evil | Veteran | Aggression | FIREWALL STABLE |
| 10 | The Vibranium Protocol | Black Panther | Ultron | The Doomsday Chair | Veteran | Aggression | VIBRANIUM SECURED |
| 11 | Hostile Witness | She-Hulk | Klaw | The Doomsday Chair | Expert | Justice | WITNESS PROTECTED |
| 12 | Siege Protocol | Black Panther | Rhino | Bomb Scare | Expert | Protection | EMBASSY SECURED |
| 13 | Terminal Velocity | Captain Marvel | Rhino | Under Attack | Expert | Justice | SKYLINE HELD |
| 14 | The Last Neighborhood | Spider-Man | Ultron | Masters of Evil | Expert | Leadership | CITY SAVED |
| 15 | The Ultron Directive | Iron Man | Ultron | Legions of Hydra | Expert | Leadership | CLEAN SHUTDOWN |

## Card-data layers

1. **Bundled local reference** — names, pack, number, category, set, and source links from the tracker. Required offline.
2. **MarvelCDB normalized metadata** — optional live/cached enhancement.
3. **External image reference** — optional and separately gated; never required for functionality.
4. **User-provided image base** — optional private configuration for a user who has a lawful local source. Never synchronized by default.

## Search behavior

- Unicode normalize and remove combining diacritics for index terms.
- Tokenize hyphens, apostrophes, periods, and exclamation marks.
- Rank exact English/Spanish name, prefix, set, then fuzzy token match.
- Accept common punctuation variants such as `MODOK` and `M.O.D.O.K.`.
- Show pack and collector number to disambiguate duplicate characters.
- Allow filtering by owned pack, category, set, language, and campaign relevance.

## Content editing workflow

1. Modify a versioned source/translation file.
2. Update campaign definition or bilingual reference.
3. Run schema validation and source checklist.
4. Generate a human-readable diff focused on issue setup, objectives, rewards, and endings.
5. Bump content version separately from application version.
6. Add a migration only when identifiers or behavioral semantics change.

## Full Spanish translation extension

Add `translations/core-protocol.es.json` keyed by stable content IDs. Require translator attribution and reviewer approval. Missing keys fall back to English. A translation may not change thresholds, flags, timing, or objectives.
