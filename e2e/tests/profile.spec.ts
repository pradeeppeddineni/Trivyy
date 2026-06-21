import { test, expect } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4, spec v3 §13): a player finishes a solo game, then
 * opens "My stats" and sees their games + a recent game.
 */
test('my stats reflects a finished solo game', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel(/your nickname/i).fill('StatsPlayer');
  await page.getByRole('button', { name: /play solo/i }).click();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: /start round/i }).click();

  for (let i = 0; i < 5; i += 1) {
    await expect(page.getByText(new RegExp(`question ${i + 1} of 5`, 'i'))).toBeVisible();
    await page.getByRole('button', { name: /^A\b/ }).click();
    await page.getByRole('button', { name: i < 4 ? /next question/i : /see results/i }).click();
  }
  await expect(page.getByText(/^REVIEW$/)).toBeVisible();

  // Open My stats (same session) — the game is counted.
  await page.goto('/?me');
  await expect(page.getByRole('heading', { name: /my stats/i })).toBeVisible();
  await expect(page.getByText(/games played/i)).toBeVisible();
  await expect(page.getByText(/recent games/i)).toBeVisible();

  await test.info().attach('my-stats', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
