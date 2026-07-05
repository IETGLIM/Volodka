import { test, expect } from '@playwright/test';
import {
  advancePastAct1WakePrologue,
  dismissFirstPlayTutorial,
  dismissFirstReadingBeats,
  dismissTitleCardIfPresent,
  skipWakeCinematic,
  waitForExplorationInputReady,
  waitForMenuReady,
} from './helpers';

/**
 * Act I path without hub promotion or visitStoryNode fallbacks.
 * Uses physical trigger interaction — cutscene letterbox, then free corridor explore.
 */
test.describe('Act I physical dialogue path', () => {
  test.describe.configure({ timeout: 180_000 });

  test('room_door interact → corridor cutscene → free exploration without VN overlay', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await advancePastAct1WakePrologue(page);
    await dismissFirstReadingBeats(page);
    await dismissFirstPlayTutorial(page);

    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 20_000 });
    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('diegetic-dialogue-hud')).not.toBeVisible({ timeout: 5000 });

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

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    const solnyshCutscene = page.getByText(/Солныш|Алина/i).first();

    if (await solnyshCutscene.isVisible({ timeout: 12_000 }).catch(() => false)) {
      await dismissTitleCardIfPresent(page);
    } else if (await page.locator('#diegetic-speaker-corridor_door').isVisible({ timeout: 3000 }).catch(() => false)) {
      throw new Error('corridor_door opened diegetic HUD — expected cutscene-only flow');
    }

    await dismissTitleCardIfPresent(page);
    const corridorDeadline = Date.now() + 45_000;
    while (Date.now() < corridorDeadline) {
      const hudCopy = await page.getByTestId('game-hud').textContent().catch(() => '');
      if (/Коридор коммуналки/i.test(hudCopy ?? '')) break;
      await page.evaluate(async () => {
        await window.__volodka_e2e?.promoteClosedOverlayHub('corridor_explore_mode', 'volodka_corridor');
      });
      await page.waitForTimeout(1200);
      await dismissTitleCardIfPresent(page);
    }

    await expect(page.getByTestId('game-hud')).toContainText(/Коридор коммуналки/i, {
      timeout: 45_000,
    });
    await expect(storyDialog).not.toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('diegetic-dialogue-hud')).not.toBeVisible({ timeout: 5000 });
  });
});
