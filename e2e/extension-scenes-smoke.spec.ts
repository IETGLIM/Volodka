import { test, expect } from '@playwright/test';
import type { SceneId } from '../src/shared/types/game';
import { e2eBridge, skipWakeCinematic, waitForMenuReady } from './helpers';

/** Extension districts — smoke via direct scene transition (no closed-overlay hub). */
const EXTENSION_SCENE_IDS: SceneId[] = ['pier_evening', 'city_square'];

test.describe('Extension scenes smoke', () => {
  test('bridge exposes bootstrapExtensionScene after new game', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });
    await skipWakeCinematic(page);
    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.bootstrapExtensionScene === 'function',
      null,
      { timeout: 90_000 },
    );
  });

  for (const sceneId of EXTENSION_SCENE_IDS) {
    test(`transitions to ${sceneId} without throwing`, async ({ page }) => {
      test.setTimeout(180_000);
      await waitForMenuReady(page);
      await page.getByTestId('menu-new-game').click();
      await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });
      await skipWakeCinematic(page);
      await e2eBridge.bootstrapExtensionScene(page, sceneId);
      await expect(page.locator('canvas[data-engine]')).toBeVisible();
      const pos = await e2eBridge.getPlayerPosition(page);
      expect(Number.isFinite(pos.x)).toBe(true);
    });
  }
});
