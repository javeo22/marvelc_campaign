import { cloudDatabase, listSaves } from "@/integrations/cloud/database";
import { cloudFailure, privateJson, requireAccount } from "@/integrations/cloud/http";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    const ownerId = await requireAccount();
    return privateJson(await listSaves(cloudDatabase(), ownerId));
  } catch (error) { return cloudFailure(error); }
}
