import { searchLocalCards } from "@/integrations/marvelcdb/local-card-search";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") ?? "";
  const locale = url.searchParams.get("locale");
  const limit = Number(url.searchParams.get("limit") ?? "25");
  const result = searchLocalCards({
    q,
    locale: locale === "en" || locale === "es" || locale === "both" ? locale : "both",
    limit: Number.isFinite(limit) ? limit : 25
  });
  return Response.json(result, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}
