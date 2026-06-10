import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame } from './helpers';

test.describe('Combat flee', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('enter combat, flee, and return to exploration', async ({ page }) => {
    await startNewGame(page);

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
      .poll(async () => page.evaluate(() => window.__volodkaE2E?.getGamePhase() ?? null), {
        timeout: 20_000,
      })
      .toBe('exploration');
  });
});
