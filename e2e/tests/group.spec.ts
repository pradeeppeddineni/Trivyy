import { test, expect, type Page } from '@playwright/test';

/**
 * Critical-flow E2E (TEST-4): a group "play together" game. The host opens a
 * lobby and shares a code; a second player joins and waits; the host starts;
 * both play the same set and land on the leaderboard.
 */
const CODE_RE = /^[ABCDEFGHJKMNPQRSTUVWXYZ23456789]{5}$/;

async function readCode(page: Page): Promise<string> {
  const el = page.getByText(CODE_RE).first();
  await el.waitFor();
  return ((await el.textContent()) ?? '').trim();
}

async function playFive(page: Page): Promise<void> {
  await expect(page.getByText(/question 1 of 5/i)).toBeVisible({ timeout: 20000 });
  for (let i = 0; i < 5; i += 1) {
    await expect(page.getByText(new RegExp(`question ${i + 1} of 5`, 'i'))).toBeVisible();
    await page.getByRole('button', { name: /^A\b/ }).click();
    await page.getByRole('button', { name: i < 4 ? /next question/i : /see results/i }).click();
  }
}

test('a host and a joiner can play together to a leaderboard', async ({ browser }) => {
  const hostCtx = await browser.newContext();
  const joinerCtx = await browser.newContext();
  const host = await hostCtx.newPage();
  const joiner = await joinerCtx.newPage();

  // Host: ?group → nickname → setup → lobby.
  await host.goto('/?group');
  await host.getByLabel(/your nickname/i).fill('Ada');
  await host.getByRole('button', { name: /continue/i }).click();
  // Questions "5" — the QUESTIONS row renders before the PLAYERS row, which also
  // has a "5" chip, so take the first.
  await host.getByRole('button', { name: '5', exact: true }).first().click();
  await host.getByRole('button', { name: /create lobby/i }).click();

  await expect(host.getByRole('heading', { name: /game lobby/i })).toBeVisible();
  const code = await readCode(host);
  expect(code).toMatch(CODE_RE);

  // Joiner: join by code, wait in the lobby.
  await joiner.goto(`/?join=${code}`);
  await joiner.getByLabel(/your nickname/i).fill('Bob');
  await joiner.getByRole('button', { name: /join game/i }).click();
  await expect(joiner.getByText(/waiting for the host/i)).toBeVisible({ timeout: 20000 });

  // Host sees the joiner appear, then starts the game.
  await expect(host.getByText('Bob')).toBeVisible({ timeout: 20000 });
  await host.getByRole('button', { name: /start game/i }).click();

  // Both play; both reach the leaderboard.
  await playFive(host);
  await playFive(joiner);

  await expect(host.getByRole('heading', { name: /leaderboard/i })).toBeVisible({ timeout: 20000 });
  await expect(joiner.getByRole('heading', { name: /leaderboard/i })).toBeVisible({
    timeout: 20000,
  });

  await test.info().attach('group-leaderboard', {
    body: await host.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });

  await hostCtx.close();
  await joinerCtx.close();
});
