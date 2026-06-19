import { test, expect } from '@playwright/test';

/**
 * First critical-flow E2E (TEST-4). It is EXPECTED TO FAIL right now: the solo
 * game UI does not exist yet, so clicking "Start solo game" does not show a
 * question. This is the deliberate red test from course Block 4 ("see red
 * before green"). Do NOT delete or weaken it to make CI pass — implement the
 * solo game flow until it goes green.
 */
test('a player can start a solo game and see the first question', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: /start solo game/i }).click();
  await expect(page.getByText(/question 1/i)).toBeVisible();
});
