import { test, expect } from '@playwright/test';
import {
  advancePastAct1WakePrologue,
  advanceStoryOverlay,
  dismissFirstPlayTutorial,
  dismissFirstReadingBeats,
  dismissTitleCardIfPresent,
  skipStoryTypewriter,
  skipWakeCinematic,
  waitForExplorationInputReady,
  waitForMenuReady,
} from './helpers';

/**
 * Act I path without hub promotion or visitStoryNode fallbacks.
 * Uses physical trigger interaction + UI story choices only.
 */
test.describe('Act I physical dialogue path', () => {
  test.describe.configure({ timeout: 180_000 });

  test('room_door interact → corridor_door story without e2e hub promotion', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await advancePastAct1WakePrologue(page);
    await dismissFirstReadingBeats(page);
    await dismissFirstPlayTutorial(page);

    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 10_000 });

    await waitForExplorationInputReady(page);
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

    await page.waitForTimeout(2000);

    const corridorSpeaker = page.locator('#story-speaker-corridor_door');
    const storyDialog = page.getByRole('dialog', { name: /Голос/i });

    if (!(await corridorSpeaker.isVisible({ timeout: 12_000 }).catch(() => false))) {
      throw new Error('corridor_door story did not open from physical room_door interact');
    }

    await expect(storyDialog).toBeVisible();
    await skipStoryTypewriter(page);
    await advanceStoryOverlay(page, 'corridor_door');
    await dismissTitleCardIfPresent(page);

    await expect(page.getByTestId('game-hud')).toContainText(/Коридор коммуналки/i, {
      timeout: 30_000,
    });
    await expect(storyDialog).not.toBeVisible({ timeout: 10_000 });
  });
});
