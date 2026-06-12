import { test, expect } from '@playwright/test';

async function waitForMenuReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/ВОЛОДЬКА/i);
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
    await skipBtn.click();
    await page.waitForTimeout(400);
  }
}

async function dismissFirstPlayTutorial(page: import('@playwright/test').Page) {
  const skipTutorial = page.getByRole('button', { name: /Пропустить обучение/i });
  if (await skipTutorial.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipTutorial.click();
    await page.waitForTimeout(400);
  }
}

async function closeNarrativeOverlay(page: import('@playwright/test').Page) {
  const dialog = page.getByRole('dialog', { name: /Голос/i });
  const closeBtn = dialog.getByRole('button', { name: /^Закрыть$/i });
  if (await closeBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeBtn.click();
    await page.waitForTimeout(500);
  }
}

async function skipTitleCardIfPresent(page: import('@playwright/test').Page) {
  const titleSkip = page.locator('button.fixed.bottom-6').filter({ hasText: /^Пропустить$/ });
  if (await titleSkip.isVisible({ timeout: 8000 }).catch(() => false)) {
    await titleSkip.click({ force: true });
    await page.waitForTimeout(600);
  }
}

/** After wake + act I title card, dismiss explore hub or take corridor VN branch. */
async function leaveExploreHub(page: import('@playwright/test').Page): Promise<'walk' | 'corridor'> {
  await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 45_000 });
  await dismissFirstReadingBeats(page);
  await skipStoryTypewriter(page);
  const corridorBtn = page.getByRole('button', { name: /Выйти в коридор/i });
  await expect(corridorBtn).toBeVisible({ timeout: 30_000 });
  await corridorBtn.click();
  return 'corridor';
}

/** Physical 3D path: walk toward room_door, trigger zone interact → corridor_door cutscene chain. */
async function enterCorridorViaPhysicalDoor(page: import('@playwright/test').Page) {
  await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 45_000 });
  await dismissFirstReadingBeats(page);
  await skipStoryTypewriter(page);
  await closeNarrativeOverlay(page);

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(1200);
  await page.keyboard.up('KeyW');

  await page.evaluate(() => {
    window.__volodka_e2e?.setPlayerPosition(0, 0.01, 3.25);
    window.__volodka_e2e?.interactTriggerZone('room_door');
  });

  const continueDoor = page.getByRole('button', { name: /^Продолжить$/i });
  await expect(continueDoor).toBeVisible({ timeout: 15_000 });
  await continueDoor.click();
}

test.describe('Act I smoke', () => {
  test('new game → wake → first_reading → corridor door', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);

    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await leaveExploreHub(page);
    await expect(page.getByText(/коридор|Солныш|дверь/i).first()).toBeVisible({ timeout: 15_000 });
  });

  test('corridor door → solnysh cutscene → corridor explore hub', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await leaveExploreHub(page);

    const solnyshOverlay = page.getByText(/Солныш|Алина/i).first();
    await expect(solnyshOverlay).toBeVisible({ timeout: 20_000 });
    await skipTitleCardIfPresent(page);

    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/коридор|Солныш|Умка|кухн/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('physical room_door → corridor cutscene → corridor explore hub', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await enterCorridorViaPhysicalDoor(page);

    const solnyshOverlay = page.getByText(/Солныш|Алина/i).first();
    await expect(solnyshOverlay).toBeVisible({ timeout: 25_000 });
    await skipTitleCardIfPresent(page);

    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/коридор|Солныш|Умка|кухн/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });

  test('corridor explore hub → kitchen_table golden branch', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await leaveExploreHub(page);
    await skipTitleCardIfPresent(page);

    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 25_000 });
    await dismissFirstPlayTutorial(page);
    await skipStoryTypewriter(page);
    const kitchenBtn = page.getByRole('button', { name: /Пойти на кухню/i });
    await expect(kitchenBtn).toBeVisible({ timeout: 15_000 });
    await kitchenBtn.click();

    await expect(page.getByText(/Зарема|чай|кухн/i).first()).toBeVisible({ timeout: 20_000 });
  });
});
