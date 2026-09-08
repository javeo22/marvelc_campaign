import type { CardReferenceRecord, Locale } from "@/domain/types";

export interface CardSearchQuery {
  q: string;
  locale?: Locale | "both";
  limit?: number;
  category?: string;
  set?: string;
}

export interface CardSearchHit {
  record: CardReferenceRecord;
  score: number;
  matchedFields: string[];
}

export interface CardSearchResult {
  query: string;
  source: "local" | "local-plus-live";
  hits: CardSearchHit[];
  liveStatus: "disabled" | "available" | "unavailable";
}

export interface CardDetail {
  code: string;
  locale: Locale;
  name: string;
  packCode: string | null;
  packName: string | null;
  typeName: string | null;
  url: string | null;
  imageUrl: string | null;
  backImageUrl: string | null;
  mayCacheImages: false;
  rawUpdatedAt: string;
}

export interface MarvelCardRaw {
  code?: string;
  name?: string;
  real_name?: string;
  pack_code?: string;
  pack_name?: string;
  type_name?: string;
  url?: string;
  imagesrc?: string | null;
  backimagesrc?: string | null;
  linked_card?: {
    code?: string;
    name?: string;
    imagesrc?: string | null;
    backimagesrc?: string | null;
  } | null;
}

export interface CardCatalog {
  search(query: CardSearchQuery): Promise<CardSearchResult>;
  getCard(code: string, locale: Locale): Promise<CardDetail | null>;
}
