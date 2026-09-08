# 08 — Data, API, and MarvelCDB integration

## Integration posture

MarvelCDB is an optional external metadata service. Its official API page states that the API is intended for deckbuilders, card databases, tournament managers, and other tools complementary to playing Marvel Champions. It exposes public endpoints, asks clients to respect HTTP caching, and provides permissive CORS for public responses. The English and Spanish sites each expose the API.

This is technical permission to query a public service, not a copyright license for all content or images. The application therefore separates metadata, copyrighted card text, and external image display.

Research references, reviewed 2026-09-07:

- `https://marvelcdb.com/api/`
- `https://marvelcdb.com/api/doc`
- `https://es.marvelcdb.com/api/`
- `https://github.com/zzorba/marvelsdb-json-data`

## Public endpoints used

```text
GET {base}/api/public/card/{card_code}.json
GET {base}/api/public/cards/{pack_code}.json
GET {base}/api/public/cards/
GET {base}/api/public/decklist/{decklist_id}.json   (optional)
GET {base}/api/public/faq/{card_code}.json          (optional)
```

Prefer per-card or per-pack requests for the Core Protocol screen. Do not download the full corpus on each request.

## Locale hosts

```text
English: https://marvelcdb.com
Spanish: https://es.marvelcdb.com
```

The adapter accepts a configured base URL rather than constructing locale subdomains internally. This supports testing and future mirrors.

## Adapter interface

```ts
interface CardCatalog {
  search(query: CardSearchQuery): Promise<CardSearchResult>;
  getCard(code: string, locale: 'en' | 'es'): Promise<CardDetail | null>;
  getPublicDecklist?(id: number): Promise<PublicDecklist | null>;
}
```

Normalize only fields the UI needs. Preserve raw JSON in short-lived server cache for debugging but do not expose unknown HTML.

## Normalized image handling

The API may return `imagesrc`, `backimagesrc`, or linked-side image fields. The adapter:

1. accepts only `https` or same-host relative paths;
2. resolves relative paths against the configured MarvelCDB host;
3. checks the exact host allowlist;
4. returns an external URL only when both image flags are enabled;
5. marks `mayCache: false`;
6. never fetches the binary server-side;
7. handles missing alter-ego/back images without deriving an undocumented path.

Do not hardcode `/bundles/cards/{code}.png` as the sole strategy. Use API fields and fixture tests.

### Code-suffix cases already identified

The upstream JSON uses suffixed codes for identity sides (`01001a`/`01001b`, and equivalent pairs for the other Core heroes) and four resource variants for Wakanda Forever! (`01043a` through `01043d`). The bundled card index records these as a primary code plus alternate codes. Other generated Core codes remain candidates until fixture verification; never strip or invent a suffix during image lookup.

## Caching

- Honor upstream `Cache-Control`, `ETag`, and `Last-Modified` when present.
- Set a conservative application freshness window, then revalidate.
- Identify requests with a descriptive User-Agent and project contact.
- Deduplicate concurrent requests.
- Use exponential backoff for transient failures; do not retry an obvious not-found indefinitely.
- Cap normalized metadata storage and expose “last updated” status.
- Cache authenticated data nowhere until OAuth is explicitly designed.

## Fixture-first implementation

Before enabling external metadata:

1. Capture one English and one Spanish Core pack response in development.
2. Store small redacted test fixtures containing representative hero, villain, side scheme, double-sided card, missing-image, and accented-name cases.
3. Verify every entry in `data/core-protocol-card-anchors.json` against fixtures or a controlled validation script.
4. Update `match_status` to verified in generated app data.
5. Keep live API tests out of normal CI; use contract fixtures.

Do not commit the entire upstream card corpus solely for tests.

## Search merge

The bundled tracker index is the base. Merge optional MarvelCDB data by verified code:

```text
local name/pack/collector record
  + verified MarvelCDB code
  + localized live metadata
  + optional external image URL
```

If code resolution is uncertain, display the local record and no image. Never use fuzzy matching alone to select a card image silently.

## API surface

`api/openapi.yaml` defines:

- health/status;
- normalized card search;
- normalized card lookup;
- optional public decklist lookup;
- optional event sync.

There is intentionally no image-proxy endpoint.

## Rate and failure behavior

- A setup screen may prefetch only its small list of anchored cards.
- Search waits for a short debounce and cancels stale queries.
- On rate limit or outage, show local results instantly and a non-blocking “live details unavailable” notice.
- Never prevent issue setup or debrief because MarvelCDB is unavailable.
