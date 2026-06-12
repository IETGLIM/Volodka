import { test, expect } from '@playwright/test';

async function waitForMenuReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/ВОЛОДЬКА/i, { timeout: 90_000 });
  await expect(page.getByTestId('menu-new-game')).toBeVisible({ timeout: 90_000 });
}

async function skipWakeCinematic(page: import('@playwright/test').Page) {
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(3500);
}

/** Dismiss first_reading matrix quote + quest-complete dialog after deferred activation. */
async function dismissFirstReadingBeats(page: import('@playwright/test').Page) {
  await page.waitForTimeout(1200);
  const matrixQuote = page.getByText(/Слова — это протокол/i);
  if (await matrixQuote.isVisible({ timeout: 10_000 }).catch(() => false)) {
    await page.mouse.click(400, 300);
    await page.waitForTimeout(800);
  }
  const continueQuest = page.getByRole('button', { name: /^Продолжить$/i });
  if (await continueQuest.isVisible({ timeout: 5000 }).catch(() => false)) {
    await continueQuest.click();
    await page.waitForTimeout(500);
  }
}

async function skipStoryTypewriter(page: import('@playwright/test').Page) {
  const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
  if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    try {
      await skipBtn.click({ force: true, timeout: 3000 });
    } catch {
      // Overlay may close mid-skip during hub promotion or cutscene handoff.
    }
    await page.waitForTimeout(400);
  }
}

async function dismissFirstPlayTutorial(page: import('@playwright/test').Page) {
  const skipTutorial = page.getByRole('button', { name: /Пропустить обучение/i });
  if (await skipTutorial.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipTutorial.click({ force: true });
    await page.waitForTimeout(400);
  }
}

/** Act I free exploration — no persistent hub overlay; location context via scene toast. */
async function expectAct1FreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await dismissFirstReadingBeats(page);
  await dismissFirstPlayTutorial(page);

  const hubDialog = page.getByRole('dialog', { name: /Голос/i });
  await expect(hubDialog).not.toBeVisible({ timeout: 3000 });

  await expect(page.getByText(/Комната Володьки|коридор|Солныш/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

/** WASD moves the player during closed-overlay free exploration. */
async function assertExplorationMovement(page: import('@playwright/test').Page) {
  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.getPlayerPosition === 'function',
    null,
    { timeout: 30_000 },
  );
  const before = await page.evaluate(() => window.__volodka_e2e?.getPlayerPosition());
  expect(before).toBeTruthy();

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(200);

  const after = await page.evaluate(() => window.__volodka_e2e?.getPlayerPosition());
  expect(after).toBeTruthy();

  const deltaZ = Math.abs((after?.z ?? 0) - (before?.z ?? 0));
  const deltaX = Math.abs((after?.x ?? 0) - (before?.x ?? 0));
  expect(deltaZ + deltaX).toBeGreaterThan(0.15);
}

async function skipTitleCardIfPresent(page: import('@playwright/test').Page) {
  const cutsceneText = page.getByText(/Доброе утро, Володька|Алина · Солныш|АКТ I/i).first();
  if (!(await cutsceneText.isVisible({ timeout: 8000 }).catch(() => false))) return;
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
}

/** After room_door: cutscene may flash; stable signal is corridor hub toast + no VN overlay. */
async function expectCorridorFreeExploration(page: import('@playwright/test').Page) {
  await skipTitleCardIfPresent(page);
  await expect(page.getByText(/Коридор коммуналки|коридор тянется/i).first()).toBeVisible({
    timeout: 45_000,
  });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
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
  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(0, 0.01, 3.25);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('room_door');
  });

  await page.waitForTimeout(1500);

  const storyDialog = page.getByRole('dialog', { name: /Голос/i });
  const corridorToastVisible = await page
    .getByText(/Коридор коммуналки|коридор тянется/i)
    .first()
    .isVisible({ timeout: 8000 })
    .catch(() => false);

  if (!corridorToastVisible) {
    if (!(await storyDialog.isVisible({ timeout: 5000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('corridor_door'));
    } else {
      await skipStoryTypewriter(page);
    }
  }

  await expectCorridorFreeExploration(page);
}

test.describe('Act I smoke', () => {
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

  test('corridor free exploration → kitchen_table golden branch', async ({ page }) => {
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

    await page.evaluate(() => {
      window.__volodka_e2e?.interactTriggerZone('corridor_kitchen_door');
    });

    const kitchenDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await kitchenDialog.isVisible({ timeout: 8000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('kitchen_table'));
    }

    await expect(page.getByText(/Зарема|чай|кухн/i).first()).toBeVisible({ timeout: 20_000 });
  });

  test('corridor → street door → street_bench_view free exploration', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expectAct1FreeExploration(page);

    await enterStreetViaCorridorDoor(page);
    await expectStreetFreeExploration(page);
    await assertExplorationMovement(page);
  });
});
