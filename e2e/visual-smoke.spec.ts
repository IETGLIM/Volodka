import { test, expect } from '@playwright/test';

test.describe('Visual smoke', () => {
  test('boot shows loading progress then menu', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('progressbar')).toBeVisible({ timeout: 15000 });
    await expect(page.getByText('Новая игра')).toBeVisible({ timeout: 30000 });
  });

  test('menu screen baseline screenshot', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByText('Новая игра')).toBeVisible({ timeout: 30000 });
    await expect(page).toHaveScreenshot('menu-screen.png', {
      maxDiffPixelRatio: 0.05,
    });
  });
});
