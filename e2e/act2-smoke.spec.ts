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

async function skipTitleCardIfPresent(page: import('@playwright/test').Page) {
  const titleSkip = page.locator('button.fixed.bottom-6').filter({ hasText: /^Пропустить$/ });
  if (await titleSkip.isVisible({ timeout: 8000 }).catch(() => false)) {
    await titleSkip.click({ force: true });
    await page.waitForTimeout(600);
  }
}

async function skipStoryTypewriter(page: import('@playwright/test').Page) {
  const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
  if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipBtn.click();
    await page.waitForTimeout(400);
  }
}

test.describe('Act II smoke', () => {
  test('bootstrap act2 → cafe golden branch → Albert hint', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    await page.evaluate(() => {
      window.__volodka_e2e?.bootstrapAct2Entry();
    });

    await skipTitleCardIfPresent(page);

    await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Сеть|Виктория|неон/i).first()).toBeVisible({ timeout: 20_000 });
    await skipStoryTypewriter(page);

    const cafeBtn = page.getByRole('button', { name: /Вернуться в кафе/i });
    await expect(cafeBtn).toBeVisible({ timeout: 15_000 });
    await cafeBtn.click();

    await expect(page.getByText(/Альберт|гильдии|стихи/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
