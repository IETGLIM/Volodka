import { expect, type Page } from '@playwright/test';

export async function enableE2EBridge(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('volodka_e2e', '1');
  });
}

export async function waitForMenuReady(page: Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/ВОЛОДЬКА/i, { timeout: 30_000 });
  await expect(page.getByTestId('menu-new-game')).toBeVisible({ timeout: 90_000 });
}

async function waitForE2EBridge(page: Page) {
  await page.waitForFunction(() => window.__volodkaE2E != null, null, { timeout: 120_000 });
}

/** Close intro / quest overlays that block gameplay UI in e2e. */
export async function dismissBlockingOverlays(page: Page) {
  await page.evaluate(() => {
    window.__volodkaE2E?.skipToExploration();
    window.__volodkaE2E?.dismissOverlays();
  });

  await expect(page.getByTestId('intro-skip')).toBeHidden({ timeout: 30_000 });

  const questAccept = page.getByTestId('quest-accept');
  if (await questAccept.isVisible({ timeout: 2_000 }).catch(() => false)) {
    await questAccept.click();
    await page.evaluate(() => {
      window.__volodkaE2E?.dismissOverlays();
    });
  }
}

export async function waitForExplorationReady(page: Page) {
  await expect
    .poll(async () =>
      page.evaluate(() => {
        const bridge = window.__volodkaE2E;
        if (!bridge) return null;
        const state = bridge.getState();
        return (
          bridge.getGamePhase() === 'exploration' &&
          !state.mainMenuOpen &&
          !state.introActive &&
          state.introSeen
        );
      }),
    )
    .toBe(true);
}

export async function startNewGame(page: Page) {
  await waitForMenuReady(page);
  await page.getByTestId('menu-new-game').click();
  await waitForE2EBridge(page);
  await page.evaluate(() => {
    window.__volodkaE2E?.skipToExploration();
  });
  await dismissBlockingOverlays(page);
  await waitForExplorationReady(page);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 120_000 });
}

export async function skipIntroToExploration(page: Page) {
  await page.evaluate(() => {
    window.__volodkaE2E?.skipToExploration();
  });
  await dismissBlockingOverlays(page);
  await waitForExplorationReady(page);
  await expect(page.locator('canvas').first()).toBeVisible({ timeout: 90_000 });
}

export async function openPauseMenu(page: Page) {
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('pause-save-slots')).toBeVisible({ timeout: 15_000 });
}

export async function openSaveSlots(page: Page) {
  await openPauseMenu(page);
  await page.getByTestId('pause-save-slots').click();
  await expect(page.getByTestId('save-slot-1-save')).toBeVisible({ timeout: 15_000 });
}
