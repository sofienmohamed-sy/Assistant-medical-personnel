import { expect, test } from '@playwright/test';

test.describe('auth UI', () => {
  test('landing page CTAs link to signup and login', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('link', { name: /créer un compte/i })).toHaveAttribute(
      'href',
      '/signup',
    );
    await expect(page.getByRole('link', { name: /se connecter/i })).toHaveAttribute(
      'href',
      '/login',
    );
  });

  test('login form shows validation errors on empty submit', async ({ page }) => {
    await page.goto('/login');
    await expect(page.getByTestId('login-form')).toBeVisible();
    await page.getByRole('button', { name: /se connecter/i }).click();
    await expect(page.getByText(/Adresse e-mail requise/i)).toBeVisible();
    await expect(page.getByText(/Mot de passe requis/i)).toBeVisible();
  });

  test('signup form enforces matching passwords', async ({ page }) => {
    await page.goto('/signup');
    await page.getByLabel(/E-mail/i).fill('test@example.com');
    await page.getByLabel('Mot de passe', { exact: true }).fill('longenough1');
    await page.getByLabel(/confirmer le mot de passe/i).fill('different1');
    await page.getByRole('button', { name: /créer mon compte/i }).click();
    await expect(page.getByText(/correspondent pas/i)).toBeVisible();
  });

  test('forgot-password form validates email', async ({ page }) => {
    await page.goto('/forgot-password');
    await expect(page.getByTestId('forgot-form')).toBeVisible();
    await page.getByLabel(/E-mail/i).fill('not-an-email');
    await page.getByRole('button', { name: /envoyer le lien/i }).click();
    await expect(page.getByText(/Adresse e-mail invalide/i)).toBeVisible();
  });

  test('protected /app route redirects to /login when signed out', async ({ page }) => {
    await page.goto('/app');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('protected /onboarding route redirects to /login when signed out', async ({ page }) => {
    await page.goto('/onboarding');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('protected /pathologies route redirects to /login when signed out', async ({ page }) => {
    await page.goto('/pathologies');
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId('login-form')).toBeVisible();
  });

  test('protected /measurements/glycemia routes redirect to /login when signed out', async ({
    page,
  }) => {
    await page.goto('/measurements/glycemia');
    await expect(page).toHaveURL(/\/login$/);
    await page.goto('/measurements/glycemia/new');
    await expect(page).toHaveURL(/\/login$/);
  });
});
