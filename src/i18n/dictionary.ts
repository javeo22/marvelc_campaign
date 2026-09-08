export type Locale = "en" | "es";
export type LocalizedText = Partial<Record<Locale, string>> & { en: string };

export const supportedLocales = ["en", "es"] as const;

export function textForLocale(text: LocalizedText, locale: Locale): string {
  return text[locale] ?? text.en;
}
