import { marvelCdbCatalog } from "@/integrations/marvelcdb/client";

type Params = {
  params: Promise<{ code: string }>;
};

export async function GET(request: Request, { params }: Params) {
  const { code } = await params;
  if (!/^[0-9]{5}[a-z]?$/.test(code)) {
    return Response.json({ error: "Invalid card code." }, { status: 400 });
  }
  const url = new URL(request.url);
  const locale = url.searchParams.get("locale") === "es" ? "es" : "en";
  const detail = await marvelCdbCatalog.getCard(code, locale);
  if (!detail) {
    return Response.json({ error: "Card metadata unavailable." }, { status: 404 });
  }
  return Response.json(detail, {
    headers: {
      "Cache-Control": "public, max-age=300, stale-while-revalidate=3600"
    }
  });
}
