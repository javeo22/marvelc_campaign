import { expect, test, type BrowserContext } from "@playwright/test";
import type { CampaignSave } from "@/domain/types";

test.describe("cloud client with authenticated API fixtures", () => {
  test.skip(process.env.NEXT_PUBLIC_CLOUD_SYNC_ENABLED !== "true", "Requires a cloud-enabled build; no real provider credentials are used.");
  test("two devices upload, download, retry offline changes, and receive new progress", async ({ browser }) => {
    const state: { cloud: { save: CampaignSave; revision: number; cloudUpdatedAt: string } | null } = { cloud: null };
    async function attach(context: BrowserContext) {
      await context.route("**/api/cloud/status", (route) => route.fulfill({ json: { enabled: true, configured: true, providers: ["github"] } }));
      await context.route("**/api/auth/session", (route) => route.fulfill({ json: { user: { id: "github:fixture-player", name: "Fixture Player" }, expires: "2099-01-01T00:00:00.000Z" } }));
      await context.route("**/api/cloud/saves**", async (route) => {
        const request = route.request();
        const saveId = new URL(request.url()).pathname.split("/")[4];
        if (request.method() === "PUT") {
          const body = request.postDataJSON() as { save: CampaignSave; expectedRevision: number | null };
          if ((state.cloud?.revision ?? null) !== body.expectedRevision) return route.fulfill({ status: 409, json: { error: "Revision changed" } });
          state.cloud = { save: body.save, revision: (state.cloud?.revision ?? 0) + 1, cloudUpdatedAt: new Date().toISOString() };
          return route.fulfill({ json: { revision: state.cloud.revision, cloudUpdatedAt: state.cloud.cloudUpdatedAt } });
        }
        if (!saveId) return route.fulfill({ json: state.cloud ? [{ saveId: state.cloud.save.saveId, name: state.cloud.save.name, currentIssueNumber: state.cloud.save.snapshot.currentIssueNumber, phase: state.cloud.save.snapshot.phase, intel: state.cloud.save.snapshot.intel, network: state.cloud.save.snapshot.network, sequence: state.cloud.save.sequence, revision: state.cloud.revision, cloudUpdatedAt: state.cloud.cloudUpdatedAt }] : [] });
        return state.cloud ? route.fulfill({ json: state.cloud }) : route.fulfill({ status: 404, json: { error: "Not found" } });
      });
    }
    const deviceA = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: test.info().project.use.viewport }); const deviceB = await browser.newContext({ baseURL: test.info().project.use.baseURL, viewport: test.info().project.use.viewport });
    try {
      await attach(deviceA); await attach(deviceB);
      const a = await deviceA.newPage(); const b = await deviceB.newPage();
      await a.goto("/onboarding"); await a.getByLabel("Save name").fill("Cross-device campaign");
      await a.getByRole("button", { name: /Create local campaign/ }).click();
      await expect(a.getByRole("heading", { name: "Cross-device campaign" })).toBeVisible();
      expect(state.cloud).toBeNull();
      const campaignUrl = a.url();
      await a.goto("/account");
      await expect(a.getByRole("heading", { name: "Fixture Player" })).toBeVisible();
      await a.getByRole("button", { name: "Enable sync" }).click();
      await expect(a.getByText("Automatic sync enabled", { exact: false })).toBeVisible();
      await b.goto("/account"); await b.getByRole("button", { name: "Download", exact: true }).click();
      await expect(b.getByText("Automatic sync enabled", { exact: false })).toBeVisible();
      await a.goto(campaignUrl); await a.getByRole("link", { name: /Continue|Prepare Issue/ }).first().click();
      await expect(a.getByRole("heading", { name: "Issue 01" })).toBeVisible();
      const checks = a.getByRole("checkbox", { name: /Confirm / });
      for (let index = 0, count = await checks.count(); index < count; index++) await checks.nth(index).check();
      await a.getByRole("button", { name: /Start issue/ }).click();
      await expect(a.getByRole("heading", { name: "THE BREAK-IN" })).toBeVisible();
      await expect.poll(() => state.cloud?.save.snapshot.activeSession?.round).toBe(1);
      await deviceA.setOffline(true);
      await a.getByRole("link", { name: "End round" }).click();
      await a.getByLabel("Review objective progress and any deadline").click();
      await a.getByRole("button", { name: "Start Round 2 · reviewed" }).click();
      await expect(a.getByText("Do this now · Round 2")).toBeVisible();
      await a.waitForTimeout(1800); expect(state.cloud?.save.snapshot.activeSession?.round).toBe(1);
      await deviceA.setOffline(false);
      await expect.poll(() => state.cloud?.save.snapshot.activeSession?.round, { timeout: 15000 }).toBe(2);
      await b.goto(`${campaignUrl}/play`);
      await expect(b.getByText("Do this now · Round 2")).toBeVisible({ timeout: 15000 });
    } finally { await deviceA.close(); await deviceB.close(); }
  });

  test("service worker never caches private API responses", async ({ page }) => {
    await page.goto("/cards");
    await page.evaluate(async () => { await navigator.serviceWorker.ready; });
    await page.reload(); await page.waitForFunction(() => navigator.serviceWorker.controller !== null);
    await page.evaluate(async () => {
      await fetch("/api/cloud/status"); await fetch("/api/cloud/saves"); await fetch("/api/auth/session");
    });
    const privateCached = await page.evaluate(async () => {
      const cacheNames = await caches.keys();
      const requests = (await Promise.all(cacheNames.map(async (name) => (await caches.open(name)).keys()))).flat();
      return requests.map((request) => new URL(request.url).pathname).filter((path) => path.startsWith("/api/") || path === "/account");
    });
    expect(privateCached).toEqual([]);
  });
});
