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

/** After wake + act I title card, dismiss explore hub or take corridor VN branch. */
async function leaveExploreHub(page: import('@playwright/test').Page): Promise<'walk' | 'corridor'> {
  await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 45_000 });
  await dismissFirstReadingBeats(page);
  const skipText = page.getByRole('button', { name: /Пропустить/i });
  if (await skipText.isVisible().catch(() => false)) {
    await skipText.click();
  }
  const corridorBtn = page.getByRole('button', { name: /Выйти в коридор/i });
  await expect(corridorBtn).toBeVisible({ timeout: 30_000 });
  await corridorBtn.click();
  return 'corridor';
}

test.describe('Act I smoke', () => {
  test('new game → wake → first_reading → corridor door', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);

    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Первое чтение/i).first()).toBeVisible({ timeout: 15_000 });

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

    // act1_corridor_solnysh title card — skip if overlay appears
    const solnyshOverlay = page.getByText(/Солныш|Алина/i).first();
    await expect(solnyshOverlay).toBeVisible({ timeout: 20_000 });
    const skipCutscene = page.getByRole('button', { name: /Пропустить/i });
    if (await skipCutscene.isVisible().catch(() => false)) {
      await skipCutscene.click();
    }

    // Promoted to corridor_explore_mode after cutscene
    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 25_000 });
    await expect(page.getByText(/коридор|Солныш|Умка|кухн/i).first()).toBeVisible({
      timeout: 15_000,
    });
  });
});
