import cardReferenceJson from "@/content/card-reference.bilingual.json";
import type { CardReferenceIndex, CardReferenceRecord } from "@/domain/types";
import type { CardSearchQuery, CardSearchResult } from "./types";

const cardReference = cardReferenceJson as CardReferenceIndex;

export function normalizeSearchText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[.'!¡¿:()]/g, " ")
    .replace(/[-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function scoreRecord(record: CardReferenceRecord, terms: string[]) {
  const fields = {
    name_en: normalizeSearchText(record.name_en),
    name_es: normalizeSearchText(record.name_es),
    set_en: normalizeSearchText(record.set_en),
    set_es: normalizeSearchText(record.set_es),
    pack_en: normalizeSearchText(record.pack_en),
    pack_es: normalizeSearchText(record.pack_es),
    collector_number: normalizeSearchText(record.collector_number),
    marvelcdb_code: normalizeSearchText([record.marvelcdb_code, ...record.marvelcdb_alternate_codes].filter(Boolean).join(" ")),
    category: normalizeSearchText(record.category)
  };
  let score = 0;
  const matchedFields: string[] = [];
  for (const [field, value] of Object.entries(fields)) {
    const exact = terms.length === 1 && value === terms[0];
    const prefix = terms.every((term) => value.startsWith(term));
    const contains = terms.every((term) => value.includes(term));
    if (exact) {
      score += field.startsWith("name") ? 120 : 70;
      matchedFields.push(field);
    } else if (prefix) {
      score += field.startsWith("name") ? 90 : 55;
      matchedFields.push(field);
    } else if (contains) {
      score += field.startsWith("name") ? 65 : field.startsWith("set") ? 45 : 25;
      matchedFields.push(field);
    }
  }
  return { score, matchedFields };
}

export function findLocalCardByCode(code: string): CardReferenceRecord | null {
  return (
    cardReference.records.find(
      (record) => record.marvelcdb_code === code || record.marvelcdb_alternate_codes.includes(code)
    ) ?? null
  );
}

export function searchLocalCards(query: CardSearchQuery): CardSearchResult {
  const normalizedQuery = normalizeSearchText(query.q);
  const limit = Math.max(1, Math.min(query.limit ?? 25, 50));
  const terms = normalizedQuery ? normalizedQuery.split(" ") : [];
  const hits = cardReference.records
    .filter((record) => (query.category ? record.category === query.category : true))
    .filter((record) => (query.set ? record.set_en === query.set || record.set_es === query.set : true))
    .map((record) => {
      if (terms.length === 0) {
        return { record, score: 1, matchedFields: ["campaign-index"] };
      }
      const { score, matchedFields } = scoreRecord(record, terms);
      return { record, score, matchedFields };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score || a.record.name_en.localeCompare(b.record.name_en))
    .slice(0, limit);

  return {
    query: query.q,
    source: "local",
    hits,
    liveStatus: "disabled"
  };
}

export function cardReferenceCount() {
  return cardReference.record_count;
}
