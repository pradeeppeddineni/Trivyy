import { test, expect } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4): a player starts a solo game, sees the first
 * question, answers through to the end, and sees the review. Drives the real UI
 * against the real backend (Express + Postgres seeded with the CI fixture).
 */
test('a player can play a solo game from start to review', async ({ page }) => {
  await page.goto('/');

  // Home: pick a nickname, then start a solo game.
  await page.getByLabel(/your nickname/i).fill('E2EPlayer');
  await page.getByRole('button', { name: /play solo/i }).click();

  // Setup: keep the defaults (Surprise me / Any) but use a small count so the
  // fixture bank always satisfies it, then start.
  await expect(page.getByRole('heading', { name: /set up your round/i })).toBeVisible();
  await page.getByRole('button', { name: '5', exact: true }).click();
  await page.getByRole('button', { name: /start round/i }).click();

  // Gameplay: the first question appears. Answer all five questions, advancing
  // with the Next / See results button after each grade.
  await expect(page.getByText(/question 1 of 5/i)).toBeVisible();

  for (let i = 0; i < 5; i += 1) {
    await expect(page.getByText(new RegExp(`question ${i + 1} of 5`, 'i'))).toBeVisible();
    // Answer pills are buttons A–D; click the first available choice.
    await page.getByRole('button', { name: /^A\b/ }).click();
    // After grading, advance.
    const advance = page.getByRole('button', { name: i < 4 ? /next question/i : /see results/i });
    await advance.click();
  }

  // Solo results: the review is shown.
  await expect(page.getByText(/^REVIEW$/)).toBeVisible();
  await expect(page.getByRole('button', { name: /play again/i })).toBeVisible();
  await expect(page.getByText(/your answer:/i).first()).toBeVisible();

  await test.info().attach('solo-results', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
