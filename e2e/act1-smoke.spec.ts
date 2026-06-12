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
  test('new game → wake → explore hub → corridor door interact', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);

    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });

    const riseChoice = page.getByRole('button', { name: /Подняться и осмотреться/i });
    if (await riseChoice.isVisible().catch(() => false)) {
      await riseChoice.click();
    }

    const freeExplore = page.getByRole('button', { name: /Свободно исследовать комнату/i });
    if (await freeExplore.isVisible().catch(() => false)) {
      await freeExplore.click();
    }

    const canvas = page.locator('canvas').first();
    await canvas.click({ position: { x: 200, y: 200 } });

    for (let i = 0; i < 12; i++) {
      await page.keyboard.down('w');
      await page.waitForTimeout(180);
      await page.keyboard.up('w');
    }

    const interactHint = page.locator('.interaction-hint-popup');
    await expect(interactHint).toBeVisible({ timeout: 20_000 });

    await page.keyboard.press('e');
    await expect(page.getByText(/коридор|Солныш|дверь/i).first()).toBeVisible({ timeout: 15_000 });
  });
});
