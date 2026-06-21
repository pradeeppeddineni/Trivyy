import { test, expect, type Page } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4, spec v3 §13.3): a signed-in player creates a
 * persistent group, opens it, and sees members, the invite, and standings.
 */
const USER = `grp_${Date.now()}`;

async function register(page: Page, username: string): Promise<void> {
  await page.goto('/?account');
  await page
    .getByRole('button', { name: /create an account/i })
    .first()
    .click();
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/^password$/i).fill('password1');
  await page.getByRole('button', { name: /create account/i }).click();
  await page.getByRole('button', { name: /saved it/i }).click();
  await expect(page.getByRole('heading', { name: /your account/i })).toBeVisible();
}

test('create a group and open its detail', async ({ page }) => {
  await register(page, USER);

  await page.goto('/?groups');
  await expect(page.getByRole('heading', { name: /^Groups$/ })).toBeVisible();

  await page.getByLabel(/group name/i).fill('E2E Club');
  await page.getByRole('button', { name: /^Create$/ }).click();

  // The new group appears in the list; open it.
  await page.getByRole('button', { name: /E2E Club/ }).click();

  await expect(page.getByRole('heading', { name: /E2E Club/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /play a round with this group/i })).toBeVisible();
  await expect(page.getByText(/members \(1\)/i)).toBeVisible();
  await expect(page.getByText(/standings/i)).toBeVisible();

  await test.info().attach('group-detail', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});
