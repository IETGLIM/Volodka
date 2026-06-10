import { test, expect } from '@playwright/test';
import { enableE2EBridge, startNewGame, skipIntroToExploration, waitForMenuReady } from './helpers';

test.describe('Save and load', () => {
  test.beforeEach(async ({ page }) => {
    await enableE2EBridge(page);
  });

  test('slot save → reload → flag preserved', async ({ page }) => {
    await startNewGame(page);

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

    await page.reload();
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await page.waitForFunction(() => window.__volodkaE2E != null, null, { timeout: 120_000 });

    const loaded = await page.evaluate(() => window.__volodkaE2E?.loadFromSlot(2));
    expect(loaded).toBe(true);

    await skipIntroToExploration(page);

    await expect
      .poll(
        async () =>
          page.evaluate(
            () => window.__volodkaE2E?.getState().playerState.flags.e2e_save_marker === true,
          ),
        { timeout: 15_000 },
      )
      .toBe(true);
  });
});
