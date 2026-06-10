import { test, expect } from '@playwright/test';

test.describe('Landing Page', () => {
  test('should display the dashboard title', async ({ page }) => {
    await page.goto('/dashboard/restaurant');
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should navigate to sign-in page', async ({ page }) => {
    await page.goto('/auth/sign-in');
    await expect(page.getByLabel('Email')).toBeVisible();
  });
});
