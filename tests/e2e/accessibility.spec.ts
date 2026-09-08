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
