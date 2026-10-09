import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { cloudConfigStatus } from "./config";
import { CloudError } from "./saves";

export async function requireAccount(request?: Request): Promise<string> {
  const status = cloudConfigStatus();
  if (!status.enabled || !status.configured) throw new CloudError(503, "Cloud sync is unavailable. Your local saves remain safe.");
  const session = await getServerSession(authOptions());
  if (!session?.user?.id) throw new CloudError(401, "Sign in before syncing saves.");
  const expected = request?.headers.get("X-Cloud-Account");
  if (expected && expected !== session.user.id) throw new CloudError(409, "Your signed-in account changed during sync. Refresh Account before retrying.");
  return session.user.id;
}
export function privateJson(value: unknown, status = 200) {
  return Response.json(value, { status, headers: { "Cache-Control": "private, no-store", Vary: "Cookie" } });
}
export function cloudFailure(error: unknown) {
  return error instanceof CloudError
    ? privateJson({ error: error.message }, error.status)
    : privateJson({ error: "Cloud storage is temporarily unavailable. Local progress is saved; retry later." }, 503);
}
export async function readSyncBody(request: Request): Promise<unknown> {
  if (request.headers.get("origin") !== new URL(process.env.NEXTAUTH_URL!).origin) throw new CloudError(403, "Cross-origin cloud writes are not allowed.");
  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") throw new CloudError(415, "Cloud writes require JSON.");
  const maxBytes = 3_000_000;
  if (Number(request.headers.get("content-length")) > maxBytes) throw new CloudError(413, "Save exceeds the 3 MB sync limit.");
  const reader = request.body?.getReader();
  if (!reader) throw new CloudError(400, "Save body is missing.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    size += value.byteLength;
    if (size > maxBytes) { await reader.cancel(); throw new CloudError(413, "Save exceeds the 3 MB sync limit."); }
    chunks.push(value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  try {
    return JSON.parse(new TextDecoder().decode(bytes), (key, value) => {
      if (["__proto__", "constructor", "prototype"].includes(key)) throw new Error("Forbidden key");
      return value;
    });
  } catch { throw new CloudError(400, "Save body is invalid JSON."); }
}
