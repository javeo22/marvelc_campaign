# Source-material manifest

These files were supplied for the **Core Protocol Companion** project and are included byte-for-byte unchanged so a code agent, maintainer, or reviewer can trace implementation content back to the authored sources.

| Source file | Purpose | Bytes | SHA-256 |
|---|---|---:|---|
| `Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx` | Full authored campaign and narrative authority | 72,014 | `f6a313e0a8d791bc1f70ac045e150360f1d5dc51eecb74a9d33e1b56f6f4f35a` |
| `Core_Protocol_v1.1_Quickplay_Companion(1).docx` | Editable condensed table companion | 48,501 | `51ccf3d601aae781eed369dec76c2af27e2bdd694e2bb8bd7ce6c96589e4fbfa` |
| `Core_Protocol_v1.1_Quickplay_Companion(1).pdf` | Print-layout and visual-reference edition | 249,459 | `3e3a69aa091f9a9e5123a44ee9f5301c38597a520912ad7df235d63b5b06af7e` |
| `marvel_champions_journey_tracker_v2_core_protocol(1).xlsx` | Bilingual collection reference and 35-game journey tracker | 44,727 | `e0c0f5b9cf317b10d769d09bab2db65a6bf5bc7e08e6ba111a7afa2947811a1d` |

## Authority and derivation

- The campaign DOCX is authoritative for narrative, campaign systems, setup instructions, outcomes, Interludes, finale logic, and authored endings.
- The Quickplay files are authoritative condensed references and useful for checking table-order presentation.
- The spreadsheet is authoritative for the supplied bilingual card-name inventory and journey tracking structure.
- `data/core-protocol.v1.1.json` is the executable derivative used by the app, but wording disputes must be resolved against these sources.
- Derived artifacts in `data/`, `docs/`, and `schemas/` do **not** grant permission to redistribute official card art, logos, or a full copyrighted card-text corpus.

Run `python scripts/validate_pack.py` to confirm these files still match the recorded hashes.

## Searchable derivatives

`source-materials/extracted/` contains mechanical UTF-8 text extracts for repository search. These files are not part of the immutable source-hash set and do not supersede the originals.
