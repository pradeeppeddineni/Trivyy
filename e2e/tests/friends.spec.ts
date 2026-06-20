import { test, expect, type Page } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4, spec v3 §13.2): two accounts become friends via
 * username search → request → accept, then each sees the other in their list.
 */
const TS = Date.now();
const ADA = `ada_${TS}`;
const BOB = `bob_${TS}`;

async function register(page: Page, username: string): Promise<void> {
  await page.goto('/?account');
  await page
    .getByRole('button', { name: /create an account/i })
    .first()
    .click();
  await page.getByLabel(/username/i).fill(username);
  await page.getByLabel(/^password$/i).fill('password1');
  await page.getByRole('button', { name: /create account/i }).click();
  await expect(page.getByRole('heading', { name: /save your recovery code/i })).toBeVisible();
  await page.getByRole('button', { name: /saved it/i }).click();
  await expect(page.getByRole('heading', { name: /your account/i })).toBeVisible();
}

test('two accounts can become friends via search + accept', async ({ browser }) => {
  const ctxA = await browser.newContext();
  const ctxB = await browser.newContext();
  const a = await ctxA.newPage();
  const b = await ctxB.newPage();

  await register(a, ADA);
  await register(b, BOB);

  // Ada searches for Bob and sends a request.
  await a.goto('/?friends');
  await expect(a.getByRole('heading', { name: /^Friends$/ })).toBeVisible();
  await a.getByLabel(/search by username/i).fill(BOB);
  await a.getByRole('button', { name: /^Search$/ }).click();
  await a.getByRole('button', { name: /^Add$/ }).first().click();
  await expect(a.getByText(/request sent/i)).toBeVisible();

  // Bob accepts the incoming request.
  await b.goto('/?friends');
  await expect(b.getByText(new RegExp(ADA, 'i')).first()).toBeVisible();
  await b
    .getByRole('button', { name: /^Accept$/ })
    .first()
    .click();

  // Bob now lists Ada as a friend.
  await expect(b.getByText(new RegExp(`@${ADA}`, 'i')).first()).toBeVisible();

  await test.info().attach('friends', {
    body: await b.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  // Ada reloads and sees Bob.
  await a.goto('/?friends');
  await expect(a.getByText(new RegExp(`@${BOB}`, 'i')).first()).toBeVisible();

  await ctxA.close();
  await ctxB.close();
});
