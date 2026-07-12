import { test, expect } from '@playwright/test';
import {
  assertExplorationMovement,
  dismissFirstPlayTutorial,
  settleAfterWake,
  skipStoryTypewriter,
  skipWakeCinematic,
  waitForMenuReady,
  waitForStoryDialog,
} from './helpers';

async function expectChkFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/ЧК|костёр|портвейн|лес/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function interactChkDawnToCampfireBeat(page: import('@playwright/test').Page) {
  await dismissFirstPlayTutorial(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(0.5, 0.01, 0.8);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('chk_explore_dawn');
  });

  await page.locator('canvas[data-engine]').click({ force: true, position: { x: 400, y: 300 } });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(800);

  const dawnBtn = page.getByRole('button', { name: /Подойти к Ру/i });
  if (await dawnBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await dawnBtn.click({ force: true });
    await page.waitForTimeout(800);
  } else {
    await page.evaluate(async () => {
      await window.__volodka_e2e?.forceStoryBeat('chk_act5_campfire_dawn', 'chk_forest_zorge');
    });
    await page.waitForTimeout(800);
  }

  await dismissFirstPlayTutorial(page);
}

test.describe('Act VI smoke', () => {
  test('bootstrap act6 chk hub → closed overlay + movement', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct6ChkHub();
    });

    await expectChkFreeExploration(page);
    await assertExplorationMovement(page);
  });

  test('chk hub → chk_explore_dawn → chk_act5_campfire_dawn beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct6ChkHub();
    });

    await expectChkFreeExploration(page);
    await interactChkDawnToCampfireBeat(page);

    await dismissFirstPlayTutorial(page);

    const storyDialog = page.getByRole('dialog', { name: /Ру|Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.forceStoryBeat('chk_act5_campfire_dawn', 'chk_forest_zorge');
      });
    }
    await waitForStoryDialog(page, 'chk_act5_campfire_dawn');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/Рассвет|костёр|Ру|портвейн/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
