# Content validation checklist

Run this checklist whenever the campaign definition, source documents, or card reference changes.

## Automated gates

- [ ] `data/core-protocol.v1.1.json` validates against `schemas/campaign-definition.schema.json`.
- [ ] `examples/sample-save.issue-06.json` validates against `schemas/campaign-save.schema.json`.
- [ ] `data/card-reference.bilingual.json` validates against `schemas/card-reference.schema.json`.
- [ ] Issue numbers are unique and exactly 1–15.
- [ ] Mirror numbers are unique and exactly 1–20.
- [ ] Every issue’s hero, villain, modular set, tier, flag, and recommended aspect matches the source documents.
- [ ] Every source setup bullet is represented once and in its authored order.
- [ ] Every issue has a card-anchor match or a documented exception.
- [ ] Every Core card code is confirmed against captured English and Spanish MarvelCDB API fixtures before images are enabled.
- [ ] No official card-image binary exists in the repository, build output, service-worker cache manifest, or database.

## Manual source review

- [ ] Compare all fifteen `PREVIOUSLY` passages against the campaign DOCX.
- [ ] Compare all campaign setup bullets and optional objectives against the campaign DOCX.
- [ ] Compare both interlude choices and both recovery rules.
- [ ] Compare all five Network Adaptations and nine Field Assets.
- [ ] Compare all five Hero Masteries and recommended aspect routes.
- [ ] Compare the twenty Mirror Protocol rows.
- [ ] Confirm Issue 13 and Issue 15 objectives remain win-gated.
- [ ] Confirm objectives and Masteries otherwise persist after a later loss.
- [ ] Confirm Scars reduce only the starting dial, not maximum hit points.
- [ ] Confirm the Network 6+ Field Asset limit is two.
- [ ] Confirm Endgame Protocol is outside the limit only in Issue 15 at 15+ Intel.

## Known author decision

- [ ] Resolve or deliberately retain the undefined ending state: Issue 15 won, Network 0–3, fewer than four Mastery stars.
- [ ] Add full Spanish narrative only from an approved translation source; do not infer it from card-name localization.
