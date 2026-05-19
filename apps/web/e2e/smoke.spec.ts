import { expect, test } from '@playwright/test';

test.describe('smoke', () => {
  test('landing page renders the app card', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Assistant médical personnel/);
    await expect(page.getByTestId('landing-card')).toBeVisible();
    await expect(page.getByRole('heading', { name: /Assistant médical personnel/i })).toBeVisible();
  });

  test('Firebase status indicator is present', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('firebase-status')).toBeVisible();
  });

  test('PWA manifest is served', async ({ page, request }) => {
    await page.goto('/');
    const manifestResponse = await request.get('/manifest.webmanifest');
    expect(manifestResponse.ok()).toBeTruthy();
    const manifest = await manifestResponse.json();
    expect(manifest.name).toBe('Assistant médical personnel');
    expect(manifest.lang).toBe('fr');
  });
});
