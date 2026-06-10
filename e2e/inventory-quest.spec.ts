import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame, skipIntroToExploration } from './helpers';

test.describe('Inventory and quest rewards', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('collect item and complete quest updates store state', async ({ page }) => {
    await startNewGame(page);
    await skipIntroToExploration(page);

    const result = await page.evaluate(() => {
      const bridge = window.__volodkaE2E;
      if (!bridge) throw new Error('E2E bridge missing');

      bridge.getState().activateQuest('first_reading');
      bridge.addInventoryItem('guild_access_badge', 1);

      const before = bridge.getState().playerState.inventory.some((i) => i.id === 'guild_access_badge');
      bridge.completeQuest('first_reading');
      const questStatus = bridge.getState().quests.find((q) => q.questId === 'first_reading')?.status;

      return { hadItem: before, questStatus };
    });

    expect(result.hadItem).toBe(true);
    expect(result.questStatus).toBe('completed');
  });
});
