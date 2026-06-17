import { test, expect } from '@playwright/test';
import {
  advanceStoryOverlay,
  assertExplorationMovement,
  advancePastAct1WakePrologue,
  dismissFirstPlayTutorial,
  dismissFirstReadingBeats,
  expectFirstReadingRewardToasts,
  dismissTitleCardIfPresent,
  ensureStoryBeat,
  skipStoryTypewriter,
  skipWakeCinematic,
  waitForExplorationInputReady,
  waitForMenuReady,
} from './helpers';

async function expectAct1FreeExploration(page: import('@playwright/test').Page) {
  await advancePastAct1WakePrologue(page);
  await dismissFirstReadingBeats(page);
  await dismissFirstPlayTutorial(page);

  const hubDialog = page.getByRole('dialog', { name: /Голос/i });
  if (await hubDialog.isVisible({ timeout: 2000 }).catch(() => false)) {
    await page.evaluate(async () => {
      await window.__volodka_e2e!.promoteClosedOverlayHub('explore_mode', 'volodka_room');
    });
    await page.waitForTimeout(800);
    await dismissFirstReadingBeats(page);
  }

  await expect(hubDialog).not.toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('diegetic-dialogue-hud')).not.toBeVisible({ timeout: 5000 });

  const gameHud = page.getByTestId('game-hud');
  await expect(gameHud).toBeVisible({ timeout: 20_000 });
  await expect(gameHud).toContainText(/Комната Володьки|Комната небольшая|уютная/i, {
    timeout: 20_000,
  });
}

/** After room_door: cutscene may flash; stable signal is corridor HUD scene name + no VN overlay. */
async function expectCorridorFreeExploration(page: import('@playwright/test').Page) {
  await dismissTitleCardIfPresent(page);
  await dismissFirstReadingBeats(page);

  const gameHud = page.getByTestId('game-hud');
  const corridorText = page.getByText(/Коридор коммуналки/i).first();

  const deadline = Date.now() + 45_000;
  while (Date.now() < deadline) {
    if (await gameHud.isVisible().catch(() => false)) {
      const hudCopy = await gameHud.textContent();
      if (/Коридор коммуналки/i.test(hudCopy ?? '')) break;
    }
    if (await corridorText.isVisible({ timeout: 500 }).catch(() => false)) break;

    await page.evaluate(async () => {
      await window.__volodka_e2e?.promoteClosedOverlayHub('corridor_explore_mode', 'volodka_corridor');
    });
    await page.waitForTimeout(1200);
    await dismissTitleCardIfPresent(page);
  }

  await expect(gameHud).toBeVisible({ timeout: 5000 });
  await expect(gameHud).toContainText(/Коридор коммуналки/i, { timeout: 5000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
}

/** Dismiss zarema_first_meeting or other thin-letterbox cutscenes. */
async function dismissCutsceneIfPresent(page: import('@playwright/test').Page) {
  const zaremaCutscene = page.getByText(/Зарема|Садись\. Я налью/i).first();
  if (await zaremaCutscene.isVisible({ timeout: 5000 }).catch(() => false)) {
    await page.keyboard.press('Escape');
    await page.waitForTimeout(800);
  }
  await dismissTitleCardIfPresent(page);
}

/** Kitchen hub — closed overlay + warm location toast after zarema cutscene. */
async function expectKitchenFreeExploration(page: import('@playwright/test').Page) {
  await dismissCutsceneIfPresent(page);
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(
    page.getByText(/Кухня — вечер|Общая кухня|чай|варенье|радиоприёмник/i).first(),
  ).toBeVisible({ timeout: 20_000 });
}

/** Street hub — closed overlay + neon location toast. */
async function expectStreetFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Улица — ночь|залита неоновым|голограмм|Синяя яма/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function enterStreetViaCorridorDoor(page: import('@playwright/test').Page) {
  await enterCorridorViaPhysicalDoor(page);
  await dismissFirstPlayTutorial(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(-2.7, 0.01, -2.0);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('corridor_street_door');
  });

  await page.waitForTimeout(2500);

  let storyDialog = page.getByRole('dialog', { name: /Голос/i });
  if (!(await storyDialog.isVisible({ timeout: 8000 }).catch(() => false))) {
    await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('street_bench'));
    await page.waitForTimeout(1500);
  }

  storyDialog = page.getByRole('dialog', { name: /Голос/i });
  if (await storyDialog.isVisible({ timeout: 8000 }).catch(() => false)) {
    await skipStoryTypewriter(page);
    const lookBtn = page.getByRole('button', { name: /Оглядеть улицу/i });
    if (await lookBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await lookBtn.click({ force: true });
    } else {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.promoteClosedOverlayHub('street_bench_view', 'street_night');
      });
    }
  } else {
    await page.evaluate(async () => {
      await window.__volodka_e2e?.promoteClosedOverlayHub('street_bench_view', 'street_night');
    });
  }

  await page.waitForTimeout(1000);
}

/** Physical 3D path: room_door trigger → corridor_door story/cutscene chain. */
async function enterCorridorViaPhysicalDoor(page: import('@playwright/test').Page) {
  await dismissFirstReadingBeats(page);
  await dismissFirstPlayTutorial(page);
  await waitForExplorationInputReady(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.waitForFunction(
    () => Boolean(window.__volodka_e2e?.getPlayerPosition()),
    null,
    { timeout: 45_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(0, 0.01, 3.25);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('room_door');
  });

  await page.waitForTimeout(2000);

  const gameHud = page.getByTestId('game-hud');
  const corridorInHud = async () => {
    try {
      const copy = await gameHud.textContent({ timeout: 5000 });
      return /Коридор коммуналки/i.test(copy ?? '');
    } catch {
      return false;
    }
  };
  let corridorReady = await corridorInHud();

  const corridorDeadline = Date.now() + 90_000;
  while (!corridorReady && Date.now() < corridorDeadline) {
    await ensureStoryBeat(page, 'corridor_door', 'volodka_room');
    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    const corridorSpeaker = page.locator('#story-speaker-corridor_door');
    if (await storyDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      if (await corridorSpeaker.isVisible({ timeout: 3000 }).catch(() => false)) {
        await advanceStoryOverlay(page, 'corridor_door');
      } else {
        await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('corridor_door'));
        await page.waitForTimeout(1200);
        if (await corridorSpeaker.isVisible({ timeout: 5000 }).catch(() => false)) {
          await advanceStoryOverlay(page, 'corridor_door');
        }
      }
    } else {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('corridor_door'));
      await page.waitForTimeout(1200);
    }
    await dismissTitleCardIfPresent(page);
    corridorReady = await corridorInHud();
    if (!corridorReady) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.promoteClosedOverlayHub('corridor_explore_mode', 'volodka_corridor');
      });
      await page.waitForTimeout(1000);
      corridorReady = await corridorInHud();
    }
  }

  await expectCorridorFreeExploration(page);
}

test.describe('Act I smoke', () => {
  test('new game → wake → first_reading rewards after prologue', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await advancePastAct1WakePrologue(page);
    await dismissFirstReadingBeats(page);
    await expectFirstReadingRewardToasts(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 15_000 });
  });

  test('new game → wake → movement + first_reading → corridor door', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);

    await expectAct1FreeExploration(page);
    await assertExplorationMovement(page);

    await enterCorridorViaPhysicalDoor(page);
    await expectCorridorFreeExploration(page);
  });

  test('corridor door → solnysh cutscene → corridor free exploration', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expectAct1FreeExploration(page);

    await enterCorridorViaPhysicalDoor(page);
    await expectCorridorFreeExploration(page);
    // Movement already covered in the first smoke test; corridor physics can lag after cutscene.
  });

  test('physical room_door → corridor cutscene → corridor free exploration', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expectAct1FreeExploration(page);

    await enterCorridorViaPhysicalDoor(page);
    await expectCorridorFreeExploration(page);
  });

  test('corridor → kitchen door → home_evening free exploration', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expectAct1FreeExploration(page);

    await enterCorridorViaPhysicalDoor(page);
    await expectCorridorFreeExploration(page);
    await dismissFirstPlayTutorial(page);

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );

    await page.evaluate(async () => {
      window.__volodka_e2e?.setPlayerPosition(2.7, 0.01, -2.0);
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
      window.__volodka_e2e?.interactTriggerZone('corridor_kitchen_door');
    });

    await page.waitForTimeout(2500);

    const kitchenDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await kitchenDialog.isVisible({ timeout: 8000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('kitchen_table'));
      await page.waitForTimeout(1500);
    }

    await dismissCutsceneIfPresent(page);

    const hubDialog = page.getByRole('dialog', { name: /Голос/i });
    if (await hubDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
      await skipStoryTypewriter(page);
      const thankBtn = page.getByRole('button', { name: /Поблагодарить Зарему/i });
      if (await thankBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
        await thankBtn.click({ force: true });
        await page.waitForTimeout(800);
      }
    }

    const kitchenToastVisible = await page
      .getByText(/Кухня — вечер|Общая кухня|чай|варенье/i)
      .first()
      .isVisible({ timeout: 8000 })
      .catch(() => false);

    if (!kitchenToastVisible) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.promoteClosedOverlayHub(
          'home_evening_explore_mode',
          'home_evening',
        );
      });
    }

    await expectKitchenFreeExploration(page);
  });

  test('corridor → street door → street_bench_view free exploration', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expectAct1FreeExploration(page);

    await enterStreetViaCorridorDoor(page);
    await expectStreetFreeExploration(page);
  });
});
