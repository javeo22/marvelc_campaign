import { cloudConfigStatus } from "@/integrations/cloud/config";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json(cloudConfigStatus(), { headers: { "Cache-Control": "private, no-store" } });
}
