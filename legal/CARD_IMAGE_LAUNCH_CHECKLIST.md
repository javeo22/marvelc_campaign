# Card-image launch checklist

**Default decision:** production card images remain OFF.

Complete and sign every applicable item before setting `CARD_IMAGES_ENABLED=true` or `NEXT_PUBLIC_CARD_IMAGE_MODE=remote` in a public deployment.

## Service/operator review

- [ ] Current MarvelCDB API/site terms reviewed and archived with date.
- [ ] Project description sent to MarvelCDB operator, including domains, noncommercial purpose, exact image behavior, expected traffic, User-Agent, and cache policy.
- [ ] Written response/permission or acceptable-use guidance recorded.
- [ ] English and Spanish hosts confirmed separately if both are used.

## Rights review

- [ ] Current FFG/Asmodee and Marvel/Disney fan/trademark guidance reviewed.
- [ ] Qualified legal review completed for the actual deployment and audience, or a documented decision made to remain metadata-only.
- [ ] No claim that “noncommercial” or a disclaimer automatically makes the use fair.
- [ ] Branding reviewed to avoid official endorsement or confusion.

## Technical controls

- [ ] No card-image binary exists in Git history, build artifact, `public/`, fixtures, screenshots, database, export, or backup.
- [ ] App never fetches image binaries server-side.
- [ ] Next image optimization/proxy is disabled for remote card art.
- [ ] Service worker excludes remote card images from precache and runtime cache.
- [ ] Exact image host allowlist configured.
- [ ] Both build-time and runtime kill switches tested.
- [ ] Metadata-only fallback tested at every image location.
- [ ] No download, bulk view, print, export, or offline image pack exists.
- [ ] Request logs prove image-off mode sends no card-image requests.

## Operations

- [ ] Fan notice and attribution visible.
- [ ] Takedown contact monitored.
- [ ] Takedown procedure rehearsed, including global image disable.
- [ ] Decision owner, review date, approved domains, and conditions recorded below.

### Approval record

- Decision: [ ] Keep off  [ ] Enable within recorded scope
- Reviewer/owner:
- Date:
- Approved domains:
- Conditions/expiry:
- Evidence links:
