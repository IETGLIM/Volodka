import { test, expect } from '@playwright/test';
import {
  advancePastAct1WakePrologue,
  dismissFirstPlayTutorial,
  dismissFirstReadingBeats,
  e2eBridge,
  skipWakeCinematic,
  waitForExplorationInputReady,
  startNewGameFromMenu,
  waitForMenuReady,
} from './helpers';

/**
 * Native player path: real keyboard movement + the normal E interaction.
 *
 * The bridge is used only for read-only position observation. This test must
 * never teleport the player, fire an interaction event, promote a hub, or open
 * a story node through the test API after gameplay begins.
 */
test.describe('Act I native player interaction', () => {
  test('movement + approach room door + press E → Solnysh intro cutscene', async ({ page }) => {
    test.setTimeout(180_000);

    await waitForMenuReady(page);
    await startNewGameFromMenu(page);
    await skipWakeCinematic(page);
    await advancePastAct1WakePrologue(page);
    await dismissFirstReadingBeats(page);
    await dismissFirstPlayTutorial(page);
    await waitForExplorationInputReady(page);

    await expect(page.locator('canvas[data-engine]')).toBeVisible();
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 20_000 });

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.getPlayerPosition === 'function',
      null,
      { timeout: 30_000 },
    );

    const door = { x: 0, z: 3.5 };
    const distanceToDoor = (position: { x: number; z: number }) =>
      Math.hypot(position.x - door.x, position.z - door.z);

    const start = await e2eBridge.getPlayerPosition(page);
    const startDistance = distanceToDoor(start);

    // The wake-up spawn can leave Volodka beside the bed (X ≈ 1.8), not
    // centered in the room. Approach the doorway in depth and correct the
    // lateral offset with native WASD input; do not teleport or fire triggers.
    const lateralKey = start.x > 0.45 ? 'a' : start.x < -0.45 ? 'd' : null;
    await page.keyboard.down('s');
    if (lateralKey) await page.keyboard.down(lateralKey);
    await page.waitForTimeout(1_100);
    if (lateralKey) await page.keyboard.up(lateralKey);
    await page.keyboard.up('s');
    await page.waitForTimeout(500);

    let approach = await e2eBridge.getPlayerPosition(page);
    if (distanceToDoor(approach) >= startDistance - 0.15) {
      // Fallback for a camera orbit that faces the opposite depth direction.
      await page.keyboard.down('w');
      if (lateralKey) {
        const oppositeLateralKey = lateralKey === 'a' ? 'd' : 'a';
        await page.keyboard.down(oppositeLateralKey);
      }
      await page.waitForTimeout(1_100);
      if (lateralKey) {
        const oppositeLateralKey = lateralKey === 'a' ? 'd' : 'a';
        await page.keyboard.up(oppositeLateralKey);
      }
      await page.keyboard.up('w');
      await page.waitForTimeout(500);
      approach = await e2eBridge.getPlayerPosition(page);
    }

    expect(
      distanceToDoor(approach),
      'WASD must move the real player closer to the room door; no E2E teleport is allowed',
    ).toBeLessThan(startDistance - 0.15);

    const interactionHint = page.getByTestId('interaction-hint');
    await expect(interactionHint).toBeVisible({ timeout: 15_000 });
    await expect(interactionHint).toContainText(/Открыть/i, { timeout: 10_000 });

    // This is the player's actual interaction path: keydown E is handled by
    // useEKeyInteraction → InteractionController → linked corridor story node.
    await page.keyboard.press('e');

    await expect(
      page.getByText('Алина · Солныш').first(),
      'Pressing E on the nearby door should launch the authored Solnysh introduction cutscene',
    ).toBeVisible({ timeout: 30_000 });
  });
});
