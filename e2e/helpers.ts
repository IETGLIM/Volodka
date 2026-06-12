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
  const cutsceneText = page.getByText(/Доброе утро, Володька|Алина · Солныш|АКТ I/i).first();
  if (!(await cutsceneText.isVisible({ timeout: 8000 }).catch(() => false))) return;
  await page.waitForTimeout(1200);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(800);
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

export async function waitForStoryDialog(page: Page, timeout = 45_000) {
  const storyDialog = page.getByRole('dialog', { name: /Голос/i });
  await expect(storyDialog).toBeVisible({ timeout });
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

  const before = await page.evaluate(() => window.__volodka_e2e?.getPlayerPosition());
  expect(before).toBeTruthy();

  await page.keyboard.down('KeyW');
  await page.waitForTimeout(900);
  await page.keyboard.up('KeyW');
  await page.waitForTimeout(200);

  const after = await page.evaluate(() => window.__volodka_e2e?.getPlayerPosition());
  expect(after).toBeTruthy();

  const deltaZ = Math.abs((after?.z ?? 0) - (before?.z ?? 0));
  const deltaX = Math.abs((after?.x ?? 0) - (before?.x ?? 0));
  expect(deltaZ + deltaX).toBeGreaterThan(0.15);
}
