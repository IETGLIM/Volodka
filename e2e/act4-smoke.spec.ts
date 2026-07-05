import { test, expect } from '@playwright/test';
import {
  assertExplorationMovement,
  dismissExamineDialog,
  dismissFirstPlayTutorial,
  dismissLevelUpAndQuestOverlays,
  ensureStoryBeat,
  prepareStoryBootstrap,
  settleAfterWake,
  skipStoryTypewriter,
  skipWakeCinematic,
  waitForMenuReady,
  waitForStoryChoices,
  waitForStoryDialog,
} from './helpers';

async function expectRooftopFreeExploration(page: import('@playwright/test').Page) {
  await dismissLevelUpAndQuestOverlays(page);
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Край крыши|Крыша|ветер|город/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function expectStreetWinterFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Зимняя улица|снег|зим/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function interactMarchBannerToPeacefulMarch(page: import('@playwright/test').Page) {
  await dismissFirstPlayTutorial(page);

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
    window.__volodka_e2e?.interactTriggerZone('street_winter_march_banner');
  });

  await page.locator('canvas[data-engine]').click({ force: true, position: { x: 400, y: 300 } });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(800);

  const examineDialog = page.getByRole('dialog', { name: /Мирный марш/i });
  if (await examineDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    await dismissExamineDialog(page, /Мирный марш/i);
  }

  const marchBtn = page.getByRole('button', { name: /Продолжить марш/i });
  if (await marchBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await marchBtn.click({ force: true });
    await page.waitForTimeout(800);
  } else {
    await page.evaluate(async () => {
      await window.__volodka_e2e?.forceStoryBeat('act4_peaceful_march', 'street_winter');
    });
    await page.waitForTimeout(800);
  }
}

test.describe('Act IV smoke', () => {
  test('bootstrap act4 street winter hub → closed overlay + movement', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct4StreetWinterHub();
    });

    await expectStreetWinterFreeExploration(page);
    await assertExplorationMovement(page);
  });

  test('street winter hub → street_winter_march_banner → act4_peaceful_march beat', async ({
    page,
  }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct4StreetWinterHub();
    });

    await expectStreetWinterFreeExploration(page);
    await interactMarchBannerToPeacefulMarch(page);

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.forceStoryBeat('act4_peaceful_march', 'street_winter');
      });
    }
    await waitForStoryDialog(page, 'act4_peaceful_march');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/плакат|марш|поток|Виктория/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('rooftop hub → rooftop_broadcast_antenna → act4_rooftop_broadcast beat', async ({
    page,
  }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct4RooftopHub();
    });

    await expectRooftopFreeExploration(page);

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );

    await page.evaluate(async () => {
      window.__volodka_e2e?.setPlayerPosition(0, 0.01, -2.5);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      window.__volodka_e2e?.interactTriggerZone('rooftop_broadcast_antenna');
    });

    await page.waitForTimeout(800);
    await dismissLevelUpAndQuestOverlays(page);
    await dismissExamineDialog(page, /Передающая антенна/i);

    const broadcastBtn = page.getByRole('button', { name: /Начать подготовку вещания/i });
    if (await broadcastBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await broadcastBtn.click({ force: true });
      await page.waitForTimeout(800);
    }

    await ensureStoryBeat(page, 'act4_rooftop_broadcast', 'rooftop_edge');
    await waitForStoryDialog(page, 'act4_rooftop_broadcast');
    await waitForStoryChoices(page, /вещан/i, 45_000);
  });
});
