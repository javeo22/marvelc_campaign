import type { Locale } from "@/domain/types";
import { readEnv } from "@/domain/validation";
import { findLocalCardByCode, searchLocalCards } from "./local-card-search";
import { normalizeMarvelCard } from "./normalize";
import type { CardCatalog, CardDetail, CardSearchQuery, CardSearchResult, MarvelCardRaw } from "./types";

interface CacheEntry {
  detail: CardDetail | null;
  expiresAt: number;
}

const memoryCache = new Map<string, CacheEntry>();

export class MarvelCdbCatalog implements CardCatalog {
  async search(query: CardSearchQuery): Promise<CardSearchResult> {
    return searchLocalCards(query);
  }

  async getCard(code: string, locale: Locale): Promise<CardDetail | null> {
    if (!/^[0-9]{5}[a-z]?$/.test(code)) return null;
    const env = readEnv();
    const baseUrl = locale === "es" ? env.MARVELCDB_ES_BASE_URL : env.MARVELCDB_EN_BASE_URL;
    const cacheKey = `${locale}:${code}:${env.cardImagesAllowed ? "remote" : "off"}`;
    const cached = memoryCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) return cached.detail;

    try {
      const response = await fetch(`${baseUrl}/api/public/card/${code}.json`, {
        headers: {
          Accept: "application/json",
          "User-Agent": env.MARVELCDB_USER_AGENT
        },
        next: { revalidate: 60 * 60 }
      });
      if (!response.ok) {
        const fallback = localFallback(code, locale);
        memoryCache.set(cacheKey, { detail: fallback, expiresAt: Date.now() + 5 * 60 * 1000 });
        return fallback;
      }
      const raw = (await response.json()) as MarvelCardRaw;
      const detail = normalizeMarvelCard(raw, locale, baseUrl, {
        publicMode: env.NEXT_PUBLIC_CARD_IMAGE_MODE,
        serverEnabled: env.CARD_IMAGES_ENABLED === "true",
        allowedHosts: [new URL(env.MARVELCDB_EN_BASE_URL).hostname, new URL(env.MARVELCDB_ES_BASE_URL).hostname]
      });
      memoryCache.set(cacheKey, { detail, expiresAt: Date.now() + 60 * 60 * 1000 });
      return detail;
    } catch {
      const fallback = localFallback(code, locale);
      memoryCache.set(cacheKey, { detail: fallback, expiresAt: Date.now() + 5 * 60 * 1000 });
      return fallback;
    }
  }
}

function localFallback(code: string, locale: Locale): CardDetail | null {
  const local = findLocalCardByCode(code);
  if (!local) return null;
  return {
    code,
    locale,
    name: locale === "es" ? local.name_es : local.name_en,
    packCode: null,
    packName: locale === "es" ? local.pack_es : local.pack_en,
    typeName: local.category,
    url: locale === "es" ? local.source_es : local.source_en,
    imageUrl: null,
    backImageUrl: null,
    mayCacheImages: false,
    rawUpdatedAt: new Date(0).toISOString()
  };
}

export const marvelCdbCatalog = new MarvelCdbCatalog();
