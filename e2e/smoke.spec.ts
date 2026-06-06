import { test, expect } from '@playwright/test';

async function waitForMenuReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/ВОЛОДЬКА/i);
  await expect(page.getByTestId('menu-new-game')).toBeVisible({ timeout: 90_000 });
}

test.describe('Volodka smoke', () => {
  test('boots to menu', async ({ page }) => {
    await waitForMenuReady(page);
  });

  test('starts new game and mounts WebGL canvas', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas')).toHaveCount(1, { timeout: 90_000 });
  });

  test('canvas emits first frame after new game', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible({ timeout: 90_000 });
    await expect
      .poll(async () => canvas.evaluate((el) => el.width > 0 && el.height > 0))
      .toBe(true);
  });
});
