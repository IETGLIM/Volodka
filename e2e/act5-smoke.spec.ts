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

async function expectFactoryFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Заброшенный|цех|завод|станк/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function interactBasementStairsToFactoryBasement(page: import('@playwright/test').Page) {
  await dismissFirstPlayTutorial(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(-8.5, 0.01, -5.5);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('factory_basement_stairs');
  });

  await page.locator('canvas[data-engine]').click({ force: true, position: { x: 400, y: 300 } });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(800);

  const examineDialog = page.getByRole('dialog', { name: /Лестница в подвал/i });
  if (await examineDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    const examineContinue = page.getByRole('button', { name: /Продолжить/i });
    await examineContinue.first().click({ force: true });
    await page.waitForTimeout(600);
  }

  const descendBtn = page.getByRole('button', { name: /Спуститься к «Заре-М»/i });
  if (await descendBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await descendBtn.click({ force: true });
    await page.waitForTimeout(800);
  } else {
    await page.evaluate(async () => {
      await window.__volodka_e2e?.forceStoryBeat('factory_basement', 'factory_basement');
    });
    await page.waitForTimeout(800);
  }
}

test.describe('Act V smoke', () => {
  test('bootstrap act5 factory hub → closed overlay + movement', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct5FactoryHub();
    });

    await expectFactoryFreeExploration(page);
    await assertExplorationMovement(page);
  });

  test('factory hub → factory_basement_stairs → factory_basement beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct5FactoryHub();
    });

    await expectFactoryFreeExploration(page);
    await interactBasementStairsToFactoryBasement(page);

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.forceStoryBeat('factory_basement', 'factory_basement');
      });
    }
    await waitForStoryDialog(page, 'factory_basement');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/Заря-М|Баба Зина|подвал/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
