import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame, dismissBlockingOverlays } from './helpers';

test.describe('Combat flee', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('enter combat, flee, and return to exploration UI', async ({ page }) => {
    await startNewGame(page);
    await dismissBlockingOverlays(page);

    await page.evaluate(() => {
      window.__volodkaE2E?.startCombat('system_daemon');
    });

    await expect
      .poll(async () => page.evaluate(() => window.__volodkaE2E?.getCombatState()?.status ?? null))
      .toBe('active');

    await page.evaluate(() => {
      window.__volodkaE2E?.fleeCombat();
    });

    await expect
      .poll(async () => page.evaluate(() => window.__volodkaE2E?.getState().combatActive ?? true), {
        timeout: 20_000,
      })
      .toBe(false);

    await expect
      .poll(async () => page.evaluate(() => window.__volodkaE2E?.getCombatState() ?? 'pending'), {
        timeout: 20_000,
      })
      .toBeNull();

    await expect
      .poll(async () => page.evaluate(() => window.__volodkaE2E?.getGamePhase() ?? null))
      .toBe('exploration');
  });
});
