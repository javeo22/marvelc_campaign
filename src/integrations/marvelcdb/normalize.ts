import type { Locale } from "@/domain/types";
import type { CardDetail, MarvelCardRaw } from "./types";

export interface ImageGate {
  publicMode: "off" | "remote";
  serverEnabled: boolean;
  allowedHosts: string[];
}

function safeUrl(value: string | null | undefined, baseUrl: string, allowedHosts: string[]): string | null {
  if (!value) return null;
  try {
    const url = value.startsWith("/") ? new URL(value, baseUrl) : new URL(value);
    if (url.protocol !== "https:") return null;
    if (!allowedHosts.includes(url.hostname)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

export function imagesAllowed(gate: ImageGate): boolean {
  return gate.publicMode === "remote" && gate.serverEnabled;
}

export function normalizeMarvelCard(
  raw: MarvelCardRaw,
  locale: Locale,
  baseUrl: string,
  gate: ImageGate
): CardDetail {
  const allowed = imagesAllowed(gate);
  return {
    code: raw.code ?? "",
    locale,
    name: raw.real_name ?? raw.name ?? raw.code ?? "Unknown card",
    packCode: raw.pack_code ?? null,
    packName: raw.pack_name ?? null,
    typeName: raw.type_name ?? null,
    url: raw.url ? safeUrl(raw.url, baseUrl, [new URL(baseUrl).hostname]) : null,
    imageUrl: allowed ? safeUrl(raw.imagesrc, baseUrl, gate.allowedHosts) : null,
    backImageUrl: allowed
      ? safeUrl(raw.backimagesrc ?? raw.linked_card?.imagesrc ?? raw.linked_card?.backimagesrc, baseUrl, gate.allowedHosts)
      : null,
    mayCacheImages: false,
    rawUpdatedAt: new Date(0).toISOString()
  };
}
