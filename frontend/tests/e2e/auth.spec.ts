import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should show login form', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors with empty form', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await page.getByRole('button', { name: /sign in/i }).click();
    await expect(page.getByText(/valid email/i)).toBeVisible();
  });
});
