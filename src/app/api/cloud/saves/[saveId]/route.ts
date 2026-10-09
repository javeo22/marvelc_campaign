import { z } from "zod";
import { cloudDatabase, readSave, writeSave } from "@/integrations/cloud/database";
import { cloudFailure, privateJson, readSyncBody, requireAccount } from "@/integrations/cloud/http";
import { CloudError, saveIdSchema, validateCloudSave } from "@/integrations/cloud/saves";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ saveId: string }> };
async function idFromContext(context: Context) {
  const parsed = saveIdSchema.safeParse((await context.params).saveId);
  if (!parsed.success) throw new CloudError(400, "Save ID is invalid.");
  return parsed.data;
}
export async function GET(request: Request, context: Context) {
  try {
    const ownerId = await requireAccount(request);
    return privateJson(await readSave(cloudDatabase(), ownerId, await idFromContext(context)));
  } catch (error) { return cloudFailure(error); }
}
export async function PUT(request: Request, context: Context) {
  try {
    const ownerId = await requireAccount(request);
    const saveId = await idFromContext(context);
    const body = z.object({ save: z.unknown(), expectedRevision: z.number().int().positive().nullable() }).strict().safeParse(await readSyncBody(request));
    if (!body.success) throw new CloudError(400, "Sync request is invalid.");
    const save = validateCloudSave(body.data.save);
    if (save.saveId !== saveId) throw new CloudError(400, "Save ID does not match the request.");
    return privateJson(await writeSave(cloudDatabase(), ownerId, save, body.data.expectedRevision));
  } catch (error) { return cloudFailure(error); }
}
