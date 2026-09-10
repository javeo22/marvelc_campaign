import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

test("@a11y shell and card search have no automated WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/");
  const shell = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(shell.violations).toEqual([]);

  await page.goto("/cards");
  const cards = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(cards.violations).toEqual([]);
});

test("@a11y Issue 1 preparation and loss tutorial have no automated WCAG 2.2 AA violations", async ({ page }) => {
  await page.goto("/onboarding");
  await page.getByLabel("Save name").fill(`A11y ${Date.now()}`);
  await page.getByRole("button", { name: /Create local campaign/ }).click();
  await page.getByRole("link", { name: /Continue|Prepare Issue/ }).first().click();
  await expect(page.getByRole("heading", { name: "Issue 01" })).toBeVisible();

  const preparation = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(preparation.violations).toEqual([]);

  const setupChecks = page.getByRole("checkbox", { name: /Confirm / });
  const setupCheckCount = await setupChecks.count();
  for (let index = 0; index < setupCheckCount; index += 1) {
    await setupChecks.nth(index).check();
  }
  await page.getByRole("button", { name: /Start issue/ }).click();
  await page.getByRole("link", { name: "End Game" }).click();
  await page.getByRole("radio", { name: "Hero defeated" }).check();

  const preview = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(preview.violations).toEqual([]);

  await page.getByRole("button", { name: /Commit 1 event/ }).click();
  await expect(page.getByRole("heading", { name: "Defeat" })).toBeVisible();
  const result = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
  expect(result.violations).toEqual([]);
});
