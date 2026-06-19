import { test, expect } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4): the admin signs in. Drives the real UI against the
 * real API, which verifies the password against the argon2 hash wired into the
 * Playwright webServer env (playwright.config.ts → ADMIN_PASSWORD_HASH). A wrong
 * password is rejected; the correct one reaches the admin panel and signs back
 * out. The password below matches that hash ('e2e-admin-password').
 */
const ADMIN_PASSWORD = 'e2e-admin-password';

test('an admin can sign in, see the panel, and sign out', async ({ page }) => {
  await page.goto('/?admin');

  // The session probe resolves to the sign-in form.
  await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();

  // A wrong password is rejected with a precise message (the API returns 401).
  await page.getByLabel(/admin password/i).fill('definitely-wrong');
  await page.getByRole('button', { name: /sign in/i }).click();
  await expect(page.getByRole('alert')).toHaveText(/incorrect password/i);

  // The correct password reaches the admin panel.
  await page.getByLabel(/admin password/i).fill(ADMIN_PASSWORD);
  await page.getByRole('button', { name: /sign in/i }).click();

  await expect(page.getByRole('heading', { name: /^Admin$/ })).toBeVisible();
  await expect(page.getByText(/signed in as the admin/i)).toBeVisible();

  await test.info().attach('admin-dashboard', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  // Sign out returns to the form.
  await page.getByRole('button', { name: /sign out/i }).click();
  await expect(page.getByRole('heading', { name: /admin sign in/i })).toBeVisible();
});
