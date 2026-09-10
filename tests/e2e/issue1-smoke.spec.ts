import { expect, test } from "@playwright/test";

test("new local campaign through Issue 1 debrief advances to Issue 2", async ({ page }) => {
  const browserErrors: string[] = [];
  page.on("console", (message) => {
    if (message.type() === "error") browserErrors.push(message.text());
  });
  page.on("pageerror", (error) => browserErrors.push(error.message));

  const saveName = `Smoke ${Date.now()}`;
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { name: "Open the dossier" })).toBeVisible();
  await expect(page.getByText("card images off", { exact: false })).toBeVisible();

  await page.getByLabel("Save name").fill(saveName);
  await page.getByLabel("English + Spanish").check();
  await page.getByRole("button", { name: /Create local campaign/ }).click();

  await expect(page.getByRole("heading", { name: saveName })).toBeVisible();
  await expect(page.getByText("THE BREAK-IN")).toBeVisible();
  await page.getByRole("link", { name: /Continue|Prepare Issue/ }).first().click();

  await expect(page.getByRole("heading", { name: "Issue 01" })).toBeVisible();
  await expect(page.getByText("Visual setup")).toBeVisible();
  await expect(page.getByText(/Standard · Normal/)).toBeVisible();
  await expect(page.getByText(/Any campaign aspect is legal/)).toBeVisible();
  await page.getByRole("radio", { name: "Aggression" }).check();
  const setupChecks = page.getByRole("checkbox", { name: /Confirm / });
  const checkCount = await setupChecks.count();
  expect(checkCount).toBeGreaterThan(0);
  for (let index = 0; index < checkCount; index += 1) {
    await setupChecks.nth(index).check();
  }
  await page.getByRole("button", { name: /Start issue/ }).click();

  await expect(page.getByRole("heading", { name: "THE BREAK-IN" })).toBeVisible();
  await page.getByLabel("Bomb Scare defeated").click();
  await expect(page.getByLabel("Bomb Scare defeated")).toBeChecked();
  await page.getByRole("button", { name: "Record objective now" }).click();
  await expect(page.getByRole("button", { name: "Record objective now" })).toBeDisabled();
  await page.getByRole("button", { name: "Earn Mastery" }).click();
  await expect(page.getByRole("button", { name: "Mastery recorded" })).toBeDisabled();
  await page.getByRole("link", { name: "End Game" }).click();

  await expect(page.getByRole("heading", { name: "THE BREAK-IN" })).toBeVisible();
  await expect(page.getByText("Win Intel: +1")).toBeVisible();
  await page.getByRole("button", { name: /Commit 1 event/ }).click();

  await expect(page.getByRole("heading", { name: "Victory" })).toBeVisible();
  await page.getByRole("link", { name: "Return to campaign" }).click();

  await expect(page.getByRole("heading", { name: saveName })).toBeVisible();
  await expect(page.getByText("SOUND MONEY")).toBeVisible();
  await expect(page.locator('[aria-label^="Intel: 3."]')).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("Issue 1 hero defeat explains Network, adaptations, and Scars before leaving debrief", async ({ page }) => {
  const saveName = `Loss tutorial ${Date.now()}`;
  await page.goto("/onboarding");
  await page.getByLabel("Save name").fill(saveName);
  await page.getByRole("button", { name: /Create local campaign/ }).click();
  await page.getByRole("link", { name: /Continue|Prepare Issue/ }).first().click();

  await expect(page.getByRole("heading", { name: "Issue 01" })).toBeVisible();
  const setupChecks = page.getByRole("checkbox", { name: /Confirm / });
  const setupCheckCount = await setupChecks.count();
  for (let index = 0; index < setupCheckCount; index += 1) {
    await setupChecks.nth(index).check();
  }
  await page.getByRole("button", { name: /Start issue/ }).click();
  await page.getByRole("link", { name: "End Game" }).click();

  await page.getByRole("radio", { name: "Hero defeated" }).check();
  await expect(page.getByText("Why +1?")).toBeVisible();
  await expect(page.getByText(/Next at Network 2: Early Warning/)).toBeVisible();
  await page.getByRole("button", { name: /Commit 1 event/ }).click();

  await expect(page.getByRole("heading", { name: "Defeat" })).toBeVisible();
  await expect(page.getByText("Network 0 → 1")).toBeVisible();
  await expect(page.getByText(/Spider-Man Scar 0 → 1/)).toBeVisible();
  await expect(page.getByText("None.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Prepare Issue 02" })).toBeVisible();
});

test("bilingual card search stays metadata-only", async ({ page }) => {
  await page.goto("/cards");
  await expect(page.getByRole("heading", { name: "Bilingual card search" })).toBeVisible();
  await page.getByLabel(/Search cards/).fill("01001a");
  await expect(page.getByRole("heading", { name: /Spider-Man/ }).first()).toBeVisible();
  await expect(page.getByText("Card images are disabled by the global launch gate.").first()).toBeVisible();
});

test("PWA shell serves bundled reference pages offline after install", async ({ context, page }) => {
  await page.goto("/cards");
  await expect(page.getByRole("heading", { name: "Bilingual card search" })).toBeVisible();
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  await context.setOffline(true);
  await page.goto("/cards");
  await expect(page.getByRole("heading", { name: "Bilingual card search" })).toBeVisible();
  await expect(page.getByText("card images off", { exact: false })).toBeVisible();
  await context.setOffline(false);
});
