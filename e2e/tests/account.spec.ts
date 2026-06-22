import { test, expect, type Page } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4, spec §13.1): a player creates an account, saves the
 * one-time recovery code, signs out, signs back in, then resets the password with
 * the recovery code and signs in with the new one. Real UI + API + DB.
 *
 * Signing in (or finishing registration) lands on the HOME screen — the account
 * pill ("Account menu") confirms a signed-in session; sign-out is done from that
 * menu.
 */

/** Confirm we're on the signed-in home, then sign out via the account menu. */
async function signOutFromHome(page: Page): Promise<void> {
  await expect(page.getByRole('button', { name: /account menu/i })).toBeVisible();
  await page.getByRole('button', { name: /account menu/i }).click();
  await page.getByRole('menuitem', { name: /sign out/i }).click();
  // Sign out logs out + redirects to the guest landing — wait for it so the
  // session is fully cleared before the next step.
  await expect(page.getByRole('button', { name: /play as guest/i })).toBeVisible();
}

test('sign up, save recovery code, sign out/in, and reset with the code', async ({ page }) => {
  // Unique handle so retries / repeated CI runs do not collide on the unique username.
  const username = `e2e_${Date.now()}`;
  const password = 'firstpassword';

  await page.goto('/?account');

  // Guest → login screen. Switch to register.
  await page
    .getByRole('button', { name: /create an account/i })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: /create an account/i })).toBeVisible();

  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/display name/i).fill('E2E Tester');
  await page.getByLabel(/^password$/i).fill(password);
  await page.getByRole('button', { name: /create account/i }).click();

  // Recovery code is shown once — capture it.
  await expect(page.getByRole('heading', { name: /save your recovery code/i })).toBeVisible();
  const code = (await page
    .locator('text=/^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/')
    .textContent())!.trim();
  expect(code).toMatch(/^[A-Z0-9-]{19}$/);

  await test.info().attach('account-recovery', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  // Continue → lands on the signed-in home.
  await page.getByRole('button', { name: /saved it/i }).click();
  await signOutFromHome(page);

  // Sign back in with the original password → home.
  await page.goto('/?account');
  await expect(page.getByRole('heading', { name: /^Sign in$/ })).toBeVisible();
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill(password);
  await page.getByRole('button', { name: /^Sign in$/ }).click();
  await signOutFromHome(page);

  // Reset the password with the recovery code.
  await page.goto('/?account');
  await page.getByRole('button', { name: /forgot password/i }).click();
  await expect(page.getByRole('heading', { name: /reset password/i })).toBeVisible();
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/recovery code/i).fill(code);
  await page.getByLabel(/new password/i).fill('secondpassword');
  await page.getByRole('button', { name: /reset password/i }).click();

  // Reset rotates the code: a fresh recovery code is shown once, then → sign in.
  await expect(page.getByRole('heading', { name: /save your recovery code/i })).toBeVisible();
  await page.getByRole('button', { name: /saved it/i }).click();

  // Back on sign in; the new password works → home.
  await expect(page.getByRole('heading', { name: /^Sign in$/ })).toBeVisible();
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/password/i).fill('secondpassword');
  await page.getByRole('button', { name: /^Sign in$/ }).click();
  await expect(page.getByRole('button', { name: /account menu/i })).toBeVisible();
});
