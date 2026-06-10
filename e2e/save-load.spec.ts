import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame, skipIntroToExploration, waitForMenuReady } from './helpers';

test.describe('Save and load', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('slot save → reload → flag preserved', async ({ page }) => {
    await startNewGame(page);
    await skipIntroToExploration(page);

    await page.evaluate(() => {
      const store = window.__volodkaE2E?.getState();
      if (!store) throw new Error('E2E bridge missing');
      store.setFlag('e2e_save_marker', true);
      store.addKarma(7);
    });

    const markerBefore = await page.evaluate(
      () => window.__volodkaE2E?.getState().playerState.flags.e2e_save_marker === true,
    );
    expect(markerBefore).toBe(true);

    await page.evaluate(() => window.__volodkaE2E?.saveToSlot(2));

    await page.evaluate(() => {
      const store = window.__volodkaE2E?.getState();
      if (!store) throw new Error('E2E bridge missing');
      store.setFlag('e2e_save_marker', false);
    });

    await page.reload();
    await waitForMenuReady(page);
    await startNewGame(page);

    const loaded = await page.evaluate(() => window.__volodkaE2E?.loadFromSlot(2));
    expect(loaded).toBe(true);

    await skipIntroToExploration(page);

    const markerAfter = await page.evaluate(
      () => window.__volodkaE2E?.getState().playerState.flags.e2e_save_marker === true,
    );
    expect(markerAfter).toBe(true);
  });
});
