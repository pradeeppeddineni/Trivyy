import { test, expect } from '@playwright/test';

// Functional smoke for the Phase 0 design-system gallery. Runs in CI (TEST-4):
// proves the component library mounts and renders representative components.
test('the design-system gallery renders its components', async ({ page }) => {
  await page.goto('/');
  // The app opens on the Gallery tab with the component sections rendered.
  await expect(page.getByRole('button', { name: 'Gallery' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Buttons' })).toBeVisible();
  await expect(page.getByText(/play solo/i).first()).toBeVisible();

  // Attach a full-page screenshot as run evidence (uploaded as a CI artifact in
  // the Playwright report — see the E2E job's upload-artifact step).
  await test.info().attach('gallery', {
    body: await page.screenshot({ fullPage: true }),
    contentType: 'image/png',
  });
});

// Visual-regression baseline. fixme until fonts are self-hosted: the prototype
// loads Google Fonts from a CDN, whose load timing makes full-page screenshots
// flaky in CI. Once fonts are bundled (Phase 6 decision), generate the golden in
// the CI environment and remove `.fixme`.
test.fixme('the gallery matches its visual baseline', async ({ page }) => {
  await page.goto('/');
  await page.waitForLoadState('networkidle');
  await expect(page).toHaveScreenshot('gallery.png', { fullPage: true });
});
