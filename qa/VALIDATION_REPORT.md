# Core Protocol Companion — final validation report

**Documentation release:** 2026-09-07  
**Final QA completed:** 2026-09-08 UTC  
**Pack status:** implementation-ready  
**Default card-image state:** disabled

## Executive result

The build pack passes its automated content and contract checks, the standalone TypeScript domain contract compiles under strict settings, and the polished DOCX has passed a complete 62-page render review. The pack contains no official card-image binaries. Remote card display remains disabled unless both application kill switches are enabled and the operator completes the separate rights launch checklist.

**Automated validator:** `PASS — 310 checks passed`.

## Automated content and contract validation

Command:

```bash
python scripts/validate_pack.py
```

Coverage includes:

- Draft 2020-12 validation for the campaign definition, sample save, bilingual card reference, card anchors, and UI settings;
- structural validation of every JSON Schema;
- story issue numbering, Mirror Protocol numbering, hero/villain frequency, unique pairings, aspect routes, and Standard/Expert coverage;
- all 15 objective flags, all 20 Mirror rows, nine Field Assets, five cumulative Network Adaptations, four authored endings, and the explicit unresolved finale branch;
- all 83 structured setup actions, including complete source-step coverage, valid phases, valid flag references, and valid Interlude-choice references;
- 359 bilingual card records with CSV/JSON parity;
- 25 campaign-critical card anchors and the verified suffix-sensitive MarvelCDB identifiers;
- 15-row issue map and 20-row Mirror Protocol CSV parity;
- OpenAPI 3.1 parsing, suffix-sensitive card-code validation, and absence of an image-proxy route;
- image modes limited to `off` and `remote`, with both image switches disabled in `.env.example`;
- no user-hosted image mode in the V1 contracts;
- numbered implementation documentation 00–16;
- no image binaries outside immutable source material;
- inclusion and SHA-256 verification of all four supplied source files.

## TypeScript contract validation

Command:

```bash
npx tsc --noEmit --strict --target ES2022 --moduleResolution node types/domain.ts
```

Result: **PASS** — no diagnostics.

This confirms that the standalone domain model is syntactically valid and internally type-checks without requiring the future application scaffold.

## DOCX production validation

Artifact: `Core_Protocol_Companion_Web_App_Build_Spec.docx`

- 62 rendered pages;
- all 62 page PNGs visually reviewed;
- no clipping, overlap, broken tables, missing glyphs, or page-frame overflow;
- chapter-level page breaks verified;
- 25 document tables reviewed, including the 10-column issue matrix;
- five original abstract graphics embedded and reviewed;
- 23 internal contents links resolve to existing Word bookmarks;
- all five graphics include descriptive alternative text;
- accessibility audit: **0 high, 0 medium, 0 low findings**;
- page numbering, first-page treatment, headers, and footers verified;
- no official character art, card image, official logo, or copied card frame included.

Render command:

```bash
python /home/oai/skills/docx/render_docx.py \
  Core_Protocol_Companion_Web_App_Build_Spec.docx \
  --output_dir /tmp/core-protocol-docx-render \
  --emit_pdf
```

Accessibility command:

```bash
python /home/oai/skills/docx/scripts/a11y_audit.py \
  Core_Protocol_Companion_Web_App_Build_Spec.docx
```

Rendered PNGs and the QA PDF are temporary review artifacts and are intentionally excluded from the distribution pack.

## Source integrity

The source copies packaged under `source-materials/` are byte-identical to the supplied files. Expected SHA-256 hashes:

| Source | SHA-256 |
|---|---|
| `Marvel_Champions_Core_Protocol_Campaign_v1.1_Balanced(1).docx` | `f6a313e0a8d791bc1f70ac045e150360f1d5dc51eecb74a9d33e1b56f6f4f35a` |
| `Core_Protocol_v1.1_Quickplay_Companion(1).docx` | `51ccf3d601aae781eed369dec76c2af27e2bdd694e2bb8bd7ce6c96589e4fbfa` |
| `Core_Protocol_v1.1_Quickplay_Companion(1).pdf` | `3e3a69aa091f9a9e5123a44ee9f5301c38597a520912ad7df235d63b5b06af7e` |
| `marvel_champions_journey_tracker_v2_core_protocol(1).xlsx` | `e0c0f5b9cf317b10d769d09bab2db65a6bf5bc7e08e6ba111a7afa2947811a1d` |

## Intentional source-dependent exception

The campaign source does not define an ending for this exact state:

- Issue 15 is won;
- Network is 0–3;
- fewer than four Hero Masteries have been earned.

The seed and reducer contract preserve this as `needs_author_decision`. It is a valid campaign result and **not** a validation failure. The code agent must display the authored criteria, preserve the completed save, and avoid substituting a different ending.

## Card-image release boundary

The complete application remains functional in metadata-only mode. V1 permits only:

- `off` — no remote card-image requests; or
- `remote` — direct, allowlisted remote display after the operator completes the rights review and enables both launch switches.

The design intentionally excludes an application image proxy, service-worker image caching, offline image packs, bulk image export, and user-uploaded image hosting. A fan notice and noncommercial purpose reduce risk but do not replace permission or project-specific legal review.

## Distribution integrity

`PACK_MANIFEST.md` gives a human-readable inventory. `MANIFEST.sha256` records a checksum for each distributed file except the checksum file itself. The ZIP archive is verified after creation by extracting to a temporary directory and checking every recorded digest.
