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

async function skipStoryTypewriter(page: import('@playwright/test').Page) {
  const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
  if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipBtn.click({ force: true });
    await page.waitForTimeout(400);
  }
}

test.describe('Act II smoke', () => {
  test('bootstrap act2 → act2_transition → cafe golden branch', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2Entry();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 45_000 });
    await skipStoryTypewriter(page);

    const cafeBtn = page.getByRole('button', { name: /Вернуться в кафе/i });
    await expect(cafeBtn).toBeVisible({ timeout: 45_000 });
    await cafeBtn.click({ force: true });

    await expect(page.getByText(/Альберт|гильдии|стихи/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap act2 albert hint beat on cafe scene', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2AlbertHint();
    });

    await skipStoryTypewriter(page);
    await expect(page.getByText(/Альберт|гильдии|стихи/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap mid-act → start_diagnosis beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapStartDiagnosis();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 45_000 });
    await skipStoryTypewriter(page);

    const decryptBtn = page.getByRole('button', { name: /Начать расшифровку/i });
    await expect(decryptBtn).toBeVisible({ timeout: 45_000 });
    await decryptBtn.click({ force: true });

    await expect(page.getByText(/4729|стихи|расшифров/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
