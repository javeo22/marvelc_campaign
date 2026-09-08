# 09 — Card images, rights, and fan-project controls

## Important conclusion

Do not describe MarvelCDB as a “fair use database,” and do not treat noncommercial status as automatic permission. MarvelCDB’s API page explicitly notes that card texts are copyrighted by Fantasy Flight Games. The U.S. Copyright Office explains that fair use is fact-specific, balances four factors, and has no fixed safe percentage. A public fan project can reduce risk through purpose, context, amount, market impact, and operational restraint, but only a qualified lawyer or the relevant rights holders can provide project-specific assurance.

This document is product risk guidance, not legal advice.

## Design precedent versus license

Fantasy Flight Games has officially run Marvel Champions custom-campaign contests that invited fans to create campaigns using existing content and campaign logs. That is useful design precedent. The contest guidance and rules do not amount to a general license to redistribute card images or official content in an unrelated web application.

References reviewed 2026-09-07:

- MarvelCDB API: `https://marvelcdb.com/api/`
- FFG campaign contest: `https://www.fantasyflightgames.com/en/news/2024/11/1/a-clash-of-campaigns/`
- U.S. Copyright Office fair-use overview: `https://www.copyright.gov/fair-use/more-info.html`

## Required technical posture

### Repository and build

- Store no official card-image binary in Git, Git LFS, `public/`, test snapshots, storybook fixtures, database seeds, or deployment artifacts.
- Store only card identifiers, metadata, and external URLs.
- Add a CI script that scans extensions, MIME signatures, and generated manifests.
- Keep images off by default in `.env.example` and production preview environments.

### Runtime

- Render externally hosted card images only in the context of setup/reference, not as a downloadable gallery.
- Use direct remote URLs; do not proxy through the application or an optimizer cache.
- Do not include images in service-worker runtime caching.
- Use modest display dimensions and lazy loading.
- Provide metadata-only fallback at equal functional quality.
- Add a global kill switch that stops all image requests without a redeploy where feasible.
- Do not expose image download, zoom-to-original, bulk export, print sheet, or offline pack features.

### Product presentation

- State that the project is unofficial, noncommercial, and requires the physical game.
- Attribute Marvel Champions, Marvel characters, card art, and marks to their respective owners without implying endorsement.
- Use an original app logo and original UI textures.
- Avoid placing “Marvel” or the official game logo as the dominant app brand.
- Include a visible rights/contact page and a documented takedown workflow.
- Do not run advertising, subscriptions, sponsorship gates, or donations tied to card imagery without a new legal review.

## Launch gate

Before public card images are enabled:

1. Review current MarvelCDB terms and contact the operator with the project description, domains, request volume, caching behavior, and intended image presentation.
2. Request written confirmation about hotlinking or other acceptable image use.
3. Review FFG/Asmodee and Marvel/Disney fan-content or trademark guidance that applies at launch.
4. Obtain qualified legal review appropriate to hosting jurisdiction and expected audience.
5. Record the decision, date, scope, and conditions in the repository.
6. Verify kill switches and no-cache behavior in production.

If any step is unresolved, ship metadata-only mode. The companion remains complete without images.

## Suggested fan notice

Use the fuller version in `legal/FAN_PROJECT_NOTICE.md`. Keep the notice factual and avoid claiming that the project’s use is legally “fair use” as a settled conclusion.

## Takedown handling

- Publish one contact address.
- Acknowledge reports and capture the specific URL/material.
- Disable remote images globally first if a credible issue is raised.
- Preserve logs needed to understand the report, without republishing the material.
- Remove or change disputed use promptly where appropriate.
- Document the resolution in a private operations log.
