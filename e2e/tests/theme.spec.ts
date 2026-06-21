import { test, expect } from '@playwright/test';

test('home renders in light and dark', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#root')).toBeVisible();
  await page.screenshot({ path: 'test-results/home-light.png', fullPage: true });

  await page.evaluate(() => localStorage.setItem('trivyy.theme', 'dark'));
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await page.screenshot({ path: 'test-results/home-dark.png', fullPage: true });
});
