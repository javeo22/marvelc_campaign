import { campaignDefinition } from "@/domain/content";
import { cardReferenceCount } from "@/integrations/marvelcdb/local-card-search";

export async function GET() {
  return Response.json(
    {
      ok: true,
      app: "core-protocol-companion",
      contentVersion: campaignDefinition.version,
      cards: cardReferenceCount(),
      cardImages: "off"
    },
    {
      headers: {
        "Cache-Control": "no-store"
      }
    }
  );
}
