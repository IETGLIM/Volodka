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

/** After wake + act I title card, dismiss explore hub or take corridor VN branch. */
async function leaveExploreHub(page: import('@playwright/test').Page): Promise<'walk' | 'corridor'> {
  await expect(page.getByRole('dialog', { name: /Голос/i })).toBeVisible({ timeout: 45_000 });
  const skipText = page.getByRole('button', { name: /Пропустить/i });
  if (await skipText.isVisible().catch(() => false)) {
    await skipText.click();
  }
  const corridorBtn = page.getByRole('button', { name: /Выйти в коридор/i });
  await expect(corridorBtn).toBeVisible({ timeout: 15_000 });
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
});
