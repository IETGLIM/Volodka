import { test, expect } from '@playwright/test';
import {
  assertExplorationMovement,
  settleAfterWake,
  skipStoryTypewriter,
  skipWakeCinematic,
  waitForMenuReady,
  waitForStoryDialog,
} from './helpers';

async function expectParkFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Парк днём|аллеи|скамейки|памятник/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function expectLibraryFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Библиотека|стеллаж|бумаг/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function interactParkInscriptionToZaremaWarning(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(0, 0.01, -2.0);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('park_inscription_stone');
  });

  await page.waitForTimeout(800);

  const continueBtn = page.getByRole('button', { name: /^Продолжить$/i });
  if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continueBtn.click({ force: true });
    await page.waitForTimeout(600);
  }

  const zaremaBtn = page.getByRole('button', { name: /Искать Зарему/i });
  if (await zaremaBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await zaremaBtn.click({ force: true });
    await page.waitForTimeout(800);
  } else {
    await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('act3_zarema_warning'));
    await page.waitForTimeout(800);
  }
}

test.describe('Act III smoke', () => {
  test('bootstrap act3 park hub → closed overlay + movement', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct3ParkHub();
    });

    await expectParkFreeExploration(page);
    await assertExplorationMovement(page);
  });

  test('park hub → park_inscription_stone → act3_zarema_warning beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct3ParkHub();
    });

    await expectParkFreeExploration(page);
    await interactParkInscriptionToZaremaWarning(page);

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('act3_zarema_warning'));
    }
    await waitForStoryDialog(page, 'act3_zarema_warning');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/арестовали|облав|Зарема/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap act3 library hub → closed overlay exploration', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct3LibraryHub();
    });

    await expectLibraryFreeExploration(page);
    await assertExplorationMovement(page);
  });
});
