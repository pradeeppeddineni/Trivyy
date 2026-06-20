import { test, expect } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4, spec build-order #7): the admin opens question
 * management, adds a question, and hides one. Drives the real CRUD API + UI.
 */
const ADMIN_PASSWORD = 'e2e-admin-password';

async function signIn(page: import('@playwright/test').Page): Promise<void> {
  await page.goto('/?admin');
  await page.getByLabel(/admin username/i).fill('admin');
  await page.getByLabel(/admin password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('heading', { name: /^Analytics$/ })).toBeVisible();
}

test('admin can add and hide questions', async ({ page }) => {
  await signIn(page);

  await page.getByRole('button', { name: /manage questions/i }).click();
  await expect(page.getByRole('heading', { name: /^Questions$/ })).toBeVisible();

  // Add a question.
  await page.getByRole('button', { name: /add question/i }).click();
  await expect(page.getByRole('heading', { name: /add question/i })).toBeVisible();
  await page.getByPlaceholder('The question').fill('E2E: which planet is known as the Red Planet?');
  await page.getByPlaceholder('The correct answer').fill('Mars');
  await page.getByPlaceholder(/wrong answer 1/i).fill('Venus');
  await page.getByPlaceholder(/wrong answer 2/i).fill('Jupiter');
  await page.getByRole('button', { name: /^Save$/ }).click();

  // Back on the list, the new question is searchable.
  await expect(page.getByRole('heading', { name: /^Questions$/ })).toBeVisible();
  await page.getByPlaceholder(/search question/i).fill('Red Planet');
  await expect(page.getByText(/red planet/i).first()).toBeVisible();

  // Hide it → its action flips to Unhide.
  await page
    .getByRole('button', { name: /^Hide$/ })
    .first()
    .click();
  await expect(page.getByRole('button', { name: /^Unhide$/ }).first()).toBeVisible();

  await test.info().attach('admin-questions', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
