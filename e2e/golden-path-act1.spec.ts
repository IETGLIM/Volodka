import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame } from './helpers';

test.describe('Golden path act 1', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('new game → exploration → first quest active → save slot', async ({ page }) => {
    await startNewGame(page);

    await page.evaluate(() => {
      window.__volodkaE2E?.getState().activateQuest('first_reading');
    });

    const questState = await page.evaluate(() => {
      const store = window.__volodkaE2E?.getState();
      return store?.quests.find((q) => q.questId === 'first_reading')?.status ?? null;
    });
    expect(questState).toBe('active');

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

    await page.evaluate(() => window.__volodkaE2E?.saveToSlot(1));

    const slotRaw = await page.evaluate(() => localStorage.getItem('volodka_save_slot_1'));
    expect(slotRaw).toBeTruthy();
  });
});
