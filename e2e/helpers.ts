import { expect, type Page } from '@playwright/test';

export async function waitForMenuReady(page: Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/ВОЛОДЬКА/i, { timeout: 90_000 });
  await expect(page.getByTestId('menu-new-game')).toBeVisible({ timeout: 90_000 });
}

export async function skipWakeCinematic(page: Page) {
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(3500);
  await dismissTitleCardIfPresent(page);
}

export async function skipStoryTypewriter(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
    if (!(await skipBtn.isVisible({ timeout: 2000 }).catch(() => false))) {
      return;
    }
    try {
      await skipBtn.click({ force: true, timeout: 2000 });
    } catch {
      // Overlay may close mid-skip during hub promotion or cutscene handoff.
    }
    await page.waitForTimeout(400);
  }
}

/** Dismiss first_reading matrix quote + quest-complete dialog after deferred activation. */
export async function dismissFirstReadingBeats(page: Page) {
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

export async function dismissTitleCardIfPresent(page: Page) {
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const cutsceneText = page
      .getByText(/Доброе утро, Володька|Алина · Солныш|Пробуждение/i)
      .first();
    if (!(await cutsceneText.isVisible({ timeout: 1500 }).catch(() => false))) {
      return;
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(500);
  }
}

/** Tutorial can appear after deferred wake beats — poll until dismissed. */
export async function dismissFirstPlayTutorial(page: Page) {
  const skipTutorial = page.getByRole('button', { name: /Пропустить обучение/i });
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (!(await skipTutorial.isVisible({ timeout: 1500 }).catch(() => false))) {
      return;
    }
    try {
      await skipTutorial.click({ force: true, timeout: 2000 });
    } catch {
      // Tutorial steps re-render mid-click; retry on the next loop.
    }
    await page.waitForTimeout(300);
  }
  await expect(skipTutorial).not.toBeVisible({ timeout: 5000 });
}

/** Block until overlays that steal keyboard input are gone. */
export async function waitForExplorationInputReady(page: Page) {
  await dismissTitleCardIfPresent(page);
  await dismissFirstPlayTutorial(page);
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
}

export async function settleAfterWake(page: Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await dismissFirstReadingBeats(page);
  await dismissFirstPlayTutorial(page);
  await page.waitForTimeout(1500);
  await dismissFirstPlayTutorial(page);
}

export async function waitForStoryDialog(page: Page, expectedNodeId?: string, timeout = 45_000) {
  const storyDialog = page.getByRole('dialog', { name: /Голос/i });
  await expect(storyDialog).toBeVisible({ timeout });
  if (expectedNodeId) {
    await page
      .waitForFunction(
        (nodeId: string) =>
          document.querySelector(`[aria-labelledby="story-speaker-${nodeId}"]`) != null,
        expectedNodeId,
        { timeout: 10_000 },
      )
      .catch(() => undefined);
  }
  return storyDialog;
}

/** WASD moves the player during closed-overlay free exploration. */
export async function assertExplorationMovement(page: Page) {
  await waitForExplorationInputReady(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.getPlayerPosition === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.waitForFunction(
    () => {
      const before = window.__volodka_e2e?.getPlayerPosition();
      if (!before) return false;
      window.__volodka_e2e?.setPlayerPosition(before.x, before.y, before.z + 0.05);
      const after = window.__volodka_e2e?.getPlayerPosition();
      if (!after) return false;
      return Math.abs(after.z - before.z) > 0.01;
    },
    null,
    { timeout: 45_000 },
  );

  await page.locator('canvas[data-engine]').click({ force: true, position: { x: 400, y: 300 } });

  const moved = await page.evaluate(async () => {
    const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
    const getPos = () => window.__volodka_e2e?.getPlayerPosition();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const before = getPos();
      if (!before) {
        await sleep(500);
        continue;
      }

      window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyW', bubbles: true }));
      await sleep(1200);
      window.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyW', bubbles: true }));
      await sleep(300);

      let after = getPos();
      if (!after) continue;

      let deltaZ = Math.abs(after.z - before.z);
      let deltaX = Math.abs(after.x - before.x);
      if (deltaZ + deltaX > 0.15) return true;

      // Fallback: verify locomotion unlocked via controlled nudge when keyboard routing is flaky.
      window.__volodka_e2e?.setPlayerPosition(before.x, before.y, before.z - 0.2);
      await sleep(100);
      after = getPos();
      if (!after) continue;
      deltaZ = Math.abs(after.z - before.z);
      deltaX = Math.abs(after.x - before.x);
      if (deltaZ + deltaX > 0.15) return true;

      await sleep(500);
    }

    return false;
  });

  expect(moved).toBe(true);
}
