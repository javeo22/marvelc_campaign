import NextAuth from "next-auth";
import type { NextRequest } from "next/server";
import { authOptions } from "@/integrations/cloud/auth";
import { cloudConfigStatus } from "@/integrations/cloud/config";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
async function handle(request: NextRequest, context: { params: Promise<{ nextauth: string[] }> }) {
  const status = cloudConfigStatus();
  if (!status.enabled || !status.configured) {
    return Response.json({ error: "Cloud sign-in is unavailable. Local saves still work." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
  return NextAuth(authOptions())(request, context);
}
export { handle as GET, handle as POST };
