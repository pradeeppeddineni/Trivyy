import { test, expect, type Page } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4): an async duel across two independent browser
 * contexts. The creator plays a set and shares a code; the opponent joins by
 * the ?join link and plays the same set; the creator's waiting screen polls and
 * resolves to a head-to-head result.
 */
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;

async function readCode(page: Page): Promise<string> {
  const el = page.getByText(CODE_RE).first();
  await el.waitFor();
  return ((await el.textContent()) ?? '').trim();
}

async function playFive(page: Page): Promise<void> {
  await expect(page.getByText(/question 1 of 5/i)).toBeVisible();
  for (let i = 0; i < 5; i += 1) {
    await expect(page.getByText(new RegExp(`question ${i + 1} of 5`, 'i'))).toBeVisible();
    await page.getByRole('button', { name: /^A\b/ }).click();
    await page.getByRole('button', { name: i < 4 ? /next question/i : /see results/i }).click();
  }
}

test('two players can play an async duel to a head-to-head result', async ({ browser }) => {
  const creatorCtx = await browser.newContext();
  const opponentCtx = await browser.newContext();
  const creator = await creatorCtx.newPage();
  const opponent = await opponentCtx.newPage();

  // Creator: ?duel → nickname → setup → play → share/waiting screen.
  await creator.goto('/?duel');
  await creator.getByLabel(/your nickname/i).fill('Ada');
  await creator.getByRole('button', { name: /continue/i }).click();
  await creator.getByRole('button', { name: '5', exact: true }).click();
  await creator.getByRole('button', { name: /create challenge/i }).click();
  await playFive(creator);

  await expect(creator.getByText(/challenge ready/i)).toBeVisible();
  const code = await readCode(creator);
  expect(code).toMatch(CODE_RE);

  // Opponent: join by the code, play the same set.
  await opponent.goto(`/?join=${code}`);
  await opponent.getByLabel(/your nickname/i).fill('Bob');
  await opponent.getByRole('button', { name: /join game/i }).click();
  await playFive(opponent);

  // Both finished → the creator's polled waiting screen resolves to a result.
  await expect(creator.getByText(/you win|you lost|it's a draw/i)).toBeVisible({ timeout: 20000 });

  await test.info().attach('duel-result', {
    body: await creator.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await creatorCtx.close();
  await opponentCtx.close();
});
