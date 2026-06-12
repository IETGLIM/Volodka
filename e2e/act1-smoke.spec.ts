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

test.describe('Act I smoke', () => {
  test('new game → wake → first_reading → corridor door', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);

    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/Первое чтение/i).first()).toBeVisible({ timeout: 15_000 });

    const skipTutorial = page.getByRole('button', { name: /Пропустить обучение/i });
    if (await skipTutorial.isVisible().catch(() => false)) {
      await skipTutorial.click();
    }

    await page.locator('canvas[data-engine]').click({ force: true, position: { x: 640, y: 360 } });
    await page.keyboard.down('w');
    await page.waitForTimeout(4000);
    await page.keyboard.up('w');

    const interactHint = page.locator('.interaction-hint-popup');
    await expect(interactHint).toBeVisible({ timeout: 30_000 });
    await page.keyboard.press('e');

    await expect(page.getByText(/коридор|Солныш|дверь/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
