import { test, expect } from '@playwright/test';
import { startNewGameFromMenu, waitForMenuReady } from './helpers';

test.describe('Volodka smoke', () => {
  test('boots to menu', async ({ page }) => {
    await waitForMenuReady(page);
  });

  test('starts new game and mounts WebGL canvas', async ({ page }) => {
    await waitForMenuReady(page);
    await startNewGameFromMenu(page);
    await expect(page.locator('canvas[data-engine]')).toHaveCount(1);
  });

  test('canvas emits first frame after new game', async ({ page }) => {
    await waitForMenuReady(page);
    await startNewGameFromMenu(page);
    const canvas = page.locator('canvas[data-engine]').first();
    await expect(canvas).toBeVisible();
    await expect
      .poll(async () => canvas.evaluate((el) => el.width > 0 && el.height > 0), {
        timeout: 60_000,
      })
      .toBe(true);
  });
});
