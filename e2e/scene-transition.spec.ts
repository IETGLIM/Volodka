import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame, skipIntroToExploration } from './helpers';

test.describe('Scene transitions', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('room → corridor → room without hanging canvas', async ({ page }) => {
    await startNewGame(page);
    await skipIntroToExploration(page);

    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();

    await page.evaluate(async () => {
      const bridge = window.__volodkaE2E;
      if (!bridge) throw new Error('E2E bridge missing');
      bridge.transitionScene('volodka_corridor');
      await new Promise((r) => setTimeout(r, 3000));
      bridge.transitionScene('volodka_room');
      await new Promise((r) => setTimeout(r, 3000));
    });

    await expect
      .poll(async () => canvas.evaluate((el) => el.width > 0 && el.height > 0), { timeout: 30_000 })
      .toBe(true);
    await expect(canvas).toHaveCount(1);

    const sceneId = await page.evaluate(() => window.__volodkaE2E?.getState().exploration.currentSceneId);
    expect(sceneId).toBe('volodka_room');
  });
});
