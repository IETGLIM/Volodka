import { test, expect } from '@playwright/test';
import {
  advancePastAct1WakePrologue,
  dismissFirstPlayTutorial,
  dismissFirstReadingBeats,
  skipStoryTypewriter,
  waitForMenuReady,
} from './helpers';

test.describe('New game flow', () => {
  test('skip prologue → narrative intro → room exploration', async ({ page }) => {
    test.setTimeout(180_000);

    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.getByTestId('menu-skip-prologue')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('menu-skip-prologue').click();

    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    const skipIntroDialog = page.getByRole('dialog', { name: /Голос/i });
    await expect(skipIntroDialog).toBeVisible({ timeout: 30_000 });
    await expect(page.locator('#story-speaker-skip_prologue_intro')).toBeVisible({ timeout: 10_000 });

    await skipStoryTypewriter(page);
    const exploreBtn = page.getByRole('button', { name: /Осмотреться/i });
    await expect(exploreBtn).toBeVisible({ timeout: 10_000 });
    await exploreBtn.click({ force: true });

    await advancePastAct1WakePrologue(page);
    await dismissFirstReadingBeats(page);
    await dismissFirstPlayTutorial(page);

    const gameHud = page.getByTestId('game-hud');
    await expect(gameHud).toBeVisible({ timeout: 20_000 });
    await expect(gameHud).toContainText(/Комната Володьки|Комната небольшая|уютная/i, {
      timeout: 20_000,
    });
    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  });

  test('start with prologue still mounts canvas from dialog', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.getByTestId('menu-start-prologue')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('menu-start-prologue').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });
  });
});
