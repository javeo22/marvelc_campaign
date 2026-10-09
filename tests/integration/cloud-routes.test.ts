// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { GET as list } from "@/app/api/cloud/saves/route";
import { GET as read, PUT as write } from "@/app/api/cloud/saves/[saveId]/route";
import { fixtureSave } from "../fixtures/cloud-save";
const mocks = vi.hoisted(() => ({ session: vi.fn(), db: vi.fn(), list: vi.fn(), read: vi.fn(), write: vi.fn() }));
vi.mock("next-auth", () => ({ getServerSession: mocks.session }));
vi.mock("@/integrations/cloud/database", () => ({ cloudDatabase: mocks.db, listSaves: mocks.list, readSave: mocks.read, writeSave: mocks.write }));
const context = { params: Promise.resolve({ saveId: "save-test" }) };
function request(value: unknown = { save: fixtureSave(), expectedRevision: null }, origin = "https://companion.example.com") {
  return new Request("https://companion.example.com/api/cloud/saves/save-test", { method: "PUT", headers: { "Content-Type": "application/json", Origin: origin }, body: JSON.stringify(value) });
}
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("NEXT_PUBLIC_CLOUD_SYNC_ENABLED", "true");
  vi.stubEnv("DATABASE_URL", "postgres://test:test@db.example.com/test");
  vi.stubEnv("NEXTAUTH_URL", "https://companion.example.com");
  vi.stubEnv("NEXTAUTH_SECRET", "test-only-secret-".repeat(3));
  vi.stubEnv("AUTH_GITHUB_ID", "test-id"); vi.stubEnv("AUTH_GITHUB_SECRET", "test-secret");
  mocks.session.mockResolvedValue({ user: { id: "github:owner" } });
  mocks.db.mockReturnValue("test-db"); mocks.list.mockResolvedValue([]); mocks.read.mockResolvedValue({ save: fixtureSave(), revision: 1 }); mocks.write.mockResolvedValue({ revision: 1 });
});
afterEach(() => vi.unstubAllEnvs());
describe("Authenticated cloud HTTP boundaries", () => {
  it("rejects every read/write without a session, before contacting storage", async () => {
    mocks.session.mockResolvedValue(null);
    expect((await list()).status).toBe(401);
    expect((await read(request(), context)).status).toBe(401);
    expect((await write(request(), context)).status).toBe(401);
    expect(mocks.db).not.toHaveBeenCalled();
  });
  it("uses only the verified session identity and returns uncached private data", async () => {
    const response = await list();
    expect(mocks.list).toHaveBeenCalledWith("test-db", "github:owner");
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    await read(request(), context);
    expect(mocks.read).toHaveBeenCalledWith("test-db", "github:owner", "save-test");
    expect((await write(request(), context)).status).toBe(200);
    expect(mocks.write).toHaveBeenCalledWith("test-db", "github:owner", fixtureSave(), null);
  });
  it("rejects cross-origin writes and requests that supply another owner", async () => {
    expect((await write(request(undefined, "https://attacker.example"), context)).status).toBe(403);
    expect((await write(request({ save: fixtureSave(), expectedRevision: null, ownerId: "other" }), context)).status).toBe(400);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("rejects malformed journals and mismatched save IDs before storage", async () => {
    expect((await write(request({ save: { ...fixtureSave(), saveId: "other-save" }, expectedRevision: null }), context)).status).toBe(400);
    expect((await write(request({ save: { ...fixtureSave(), checksum: "bad" }, expectedRevision: null }), context)).status).toBe(400);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("rejects an account switch during an in-flight sync", async () => {
    const changed = request(); changed.headers.set("X-Cloud-Account", "google:other-account");
    expect((await write(changed, context)).status).toBe(409);
    expect(mocks.write).not.toHaveBeenCalled();
  });
  it("bounds streamed payloads and rejects non-JSON uploads", async () => {
    const large = new Request("https://companion.example.com/api/cloud/saves/save-test", { method: "PUT", headers: { Origin: "https://companion.example.com", "Content-Type": "application/json" }, body: " ".repeat(3_000_001) });
    expect((await write(large, context)).status).toBe(413);
    const text = new Request("https://companion.example.com/api/cloud/saves/save-test", { method: "PUT", headers: { Origin: "https://companion.example.com" }, body: "{}" });
    expect((await write(text, context)).status).toBe(415);
  });
  it("hides database details when storage is unavailable", async () => {
    mocks.list.mockRejectedValue(new Error("sensitive-connection-details"));
    const response = await list();
    expect(response.status).toBe(503);
    expect(await response.text()).not.toContain("sensitive-connection-details");
  });
});
