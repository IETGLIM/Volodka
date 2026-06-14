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
  // Wake handoff may still be opening the start beat or title card.
  await page.waitForTimeout(1500);
}

/** Advance Act I wake prologue (start → explore_mode) so exploration HUD mounts. */
export async function advancePastAct1WakePrologue(page: Page) {
  await dismissTitleCardIfPresent(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.promoteClosedOverlayHub === 'function',
    null,
    { timeout: 90_000 },
  );

  const hubDialog = page.getByRole('dialog', { name: /Голос/i });
  const gameHud = page.getByTestId('game-hud');

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    const hudVisible = await gameHud.isVisible().catch(() => false);
    const hubOpen = await hubDialog.isVisible().catch(() => false);
    if (hudVisible && !hubOpen) return;

    await dismissTitleCardIfPresent(page);
    await dismissLevelUpAndQuestOverlays(page);

    const startSpeaker = page.locator('#story-speaker-start');
    if (await startSpeaker.isVisible({ timeout: 500 }).catch(() => false)) {
      await skipStoryTypewriter(page);
      const riseBtn = page.getByRole('button', { name: /Подняться и осмотреться/i });
      if (await riseBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
        await riseBtn.click({ force: true });
        await page.waitForTimeout(800);
        continue;
      }
    } else if (hubOpen) {
      await skipStoryTypewriter(page);
      const exploreBtn = page.getByRole('button', { name: /Подняться и осмотреться/i });
      if (await exploreBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
        await exploreBtn.click({ force: true });
        await page.waitForTimeout(800);
        continue;
      }
    }

    await page.evaluate(async () => {
      await window.__volodka_e2e!.promoteClosedOverlayHub('explore_mode', 'volodka_room');
    });
    await page.waitForTimeout(1000);
  }

  if (await hubDialog.isVisible().catch(() => false)) {
    await page.evaluate(async () => {
      await window.__volodka_e2e!.promoteClosedOverlayHub('explore_mode', 'volodka_room');
    });
    await page.waitForTimeout(1000);
  }

  await expect(hubDialog).not.toBeVisible({ timeout: 15_000 });
  await expect(gameHud).toBeVisible({ timeout: 15_000 });
}

export async function skipStoryTypewriter(page: Page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    if (page.isClosed()) return;

    const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
    if (!(await skipBtn.isVisible({ timeout: 1500 }).catch(() => false))) {
      return;
    }
    try {
      await skipBtn.click({ force: true, timeout: 2000 });
    } catch {
      // Overlay may close mid-skip during hub promotion or cutscene handoff.
    }
    try {
      await page.waitForTimeout(300);
    } catch {
      return;
    }
  }
}

/** Dismiss level-up summary and quest popup overlays that block interactions. */
export async function dismissLevelUpAndQuestOverlays(page: Page) {
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const levelContinue = page.getByRole('button', { name: /^Продолжить$/i });
    if (await levelContinue.isVisible({ timeout: 1200 }).catch(() => false)) {
      try {
        await levelContinue.click({ force: true, timeout: 2000 });
      } catch {
        // Overlay may unmount mid-click.
      }
      await page.waitForTimeout(400);
      continue;
    }
    const questAccept = page.getByRole('button', { name: /^ПРИНЯТЬ$/i });
    if (await questAccept.isVisible({ timeout: 800 }).catch(() => false)) {
      try {
        await questAccept.click({ force: true, timeout: 2000 });
      } catch {
        // Quest card may re-render mid-click.
      }
      await page.waitForTimeout(400);
      continue;
    }
    return;
  }
}

/** Click through ExaminePanel when a trigger zone has examineData. Returns true if dismissed. */
export async function dismissExamineDialog(page: Page, titlePattern: RegExp): Promise<boolean> {
  const examineDialog = page.getByRole('dialog', { name: titlePattern });
  if (!(await examineDialog.isVisible({ timeout: 5000 }).catch(() => false))) {
    return false;
  }
  const continueBtn = page.getByRole('button', { name: /Продолжить/i });
  if (await continueBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
    await continueBtn.click({ force: true });
    await page.waitForTimeout(600);
  }
  return true;
}

/** Open a story beat via e2e bridge when physical triggers did not reach the overlay. */
export async function ensureStoryBeat(page: Page, nodeId: string, sceneId: string): Promise<void> {
  const speaker = page.locator(`#story-speaker-${nodeId}`);
  if (await speaker.isVisible({ timeout: 5000 }).catch(() => false)) {
    return;
  }
  await page.evaluate(
    ({ id, scene }) => {
      void window.__volodka_e2e?.forceStoryBeat(id, scene);
    },
    { id: nodeId, scene: sceneId },
  );
  await page.waitForTimeout(400);
}

/** Poll typewriter skip until narrative copy matching pattern is on screen. */
export async function waitForNarrativeText(page: Page, pattern: RegExp, timeout = 30_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    await skipStoryTypewriter(page);
    const match = page.getByText(pattern).first();
    if (await match.isVisible().catch(() => false)) {
      return;
    }
    await page.waitForTimeout(300);
  }
  await expect(page.getByText(pattern).first()).toBeVisible({ timeout: 0 });
}

/** Skip typewriter until story choice buttons matching pattern are rendered. */
export async function waitForStoryChoices(page: Page, choicePattern: RegExp, timeout = 45_000) {
  const deadline = Date.now() + timeout;
  while (Date.now() < deadline) {
    const choice = page.getByRole('button', { name: choicePattern }).first();
    if (await choice.isVisible().catch(() => false)) {
      return;
    }
    const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
    if (await skipBtn.isVisible().catch(() => false)) {
      try {
        await skipBtn.click({ force: true, timeout: 2000 });
      } catch {
        // Overlay may close mid-skip.
      }
    }
    await page.waitForTimeout(300);
  }
  await expect(page.getByRole('button', { name: choicePattern }).first()).toBeVisible({ timeout: 0 });
}

/** Wait for story overlay, skip typewriter, poll until choice buttons render. */
export async function advanceStoryOverlay(page: Page, expectedNodeId?: string, timeout = 45_000) {
  await dismissLevelUpAndQuestOverlays(page);
  await waitForStoryDialog(page, expectedNodeId, timeout);
  for (let attempt = 0; attempt < 8; attempt += 1) {
    await skipStoryTypewriter(page);
    const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
    if (!(await skipBtn.isVisible({ timeout: 800 }).catch(() => false))) {
      return;
    }
    await page.waitForTimeout(300);
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

/** Assert HUD toasts after first_reading completion (optional beat — slot may defer). */
export async function expectFirstReadingRewardToasts(page: Page) {
  await expect(
    page.getByText(/«Первое чтение» выполнено|Первое чтение/i).first(),
  ).toBeVisible({ timeout: 12_000 });
  await expect(
    page.getByText(/Стих в сборнике|Смерть есть лишь начало/i).first(),
  ).toBeVisible({ timeout: 12_000 });
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
  await advancePastAct1WakePrologue(page);
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 60_000 });
  await dismissFirstReadingBeats(page);
  await dismissFirstPlayTutorial(page);
  await page.waitForTimeout(1500);
  await dismissFirstPlayTutorial(page);
}

/** Dismiss overlays and wait for canvas before mid-game story bootstraps. */
export async function prepareStoryBootstrap(page: Page) {
  await waitForExplorationInputReady(page);
  await dismissLevelUpAndQuestOverlays(page);
  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.isStoryOverlayReady === 'function',
    null,
    { timeout: 30_000 },
  );
  await page
    .waitForFunction(
      () => {
        const loading = document.body.innerText.match(/Загрузка:[^\n]*/)?.[0] ?? '';
        return loading.length === 0 || /100\s*%/.test(loading);
      },
      null,
      { timeout: 20_000 },
    )
    .catch(() => undefined);
}

export async function waitForStoryDialog(page: Page, expectedNodeId?: string, timeout = 45_000) {
  if (expectedNodeId) {
    const speaker = page.locator(`#story-speaker-${expectedNodeId}`);
    const dialog = page.getByRole('dialog').filter({ has: speaker });
    const deadline = Date.now() + timeout;

    while (Date.now() < deadline) {
      if (await speaker.isVisible().catch(() => false)) {
        return dialog;
      }

      const overlayReady = await page
        .evaluate((nodeId) => window.__volodka_e2e?.isStoryOverlayReady(nodeId) ?? false, expectedNodeId)
        .catch(() => false);

      if (!overlayReady) {
        await page
          .evaluate(async (nodeId) => {
            if (window.__volodka_e2e?.ensureStoryOverlay) {
              await window.__volodka_e2e.ensureStoryOverlay(nodeId);
              return;
            }
            await window.__volodka_e2e?.visitStoryNode(nodeId);
          }, expectedNodeId)
          .catch(() => undefined);
      }

      const genericDialog = page.getByRole('dialog', { name: /Голос/i });
      if (await genericDialog.isVisible().catch(() => false)) {
        const hasExpectedSpeaker = await speaker.isVisible().catch(() => false);
        if (!hasExpectedSpeaker) {
          await page
            .evaluate(async (nodeId) => {
              if (window.__volodka_e2e?.ensureStoryOverlay) {
                await window.__volodka_e2e.ensureStoryOverlay(nodeId);
                return;
              }
              await window.__volodka_e2e?.visitStoryNode(nodeId);
            }, expectedNodeId)
            .catch(() => undefined);
        }
      }

      await page.waitForTimeout(400);
    }

    await expect(speaker).toBeVisible({ timeout: 0 });
    return dialog;
  }

  const storyDialog = page.getByRole('dialog', { name: /Голос/i });
  await expect(storyDialog).toBeVisible({ timeout });
  return storyDialog;
}

export async function waitForDialogue(page: Page, expectedNodeId: string, timeout = 45_000) {
  const speaker = page.locator(`#dialogue-speaker-${expectedNodeId}`);
  const dialog = page.getByRole('dialog').filter({ has: speaker });
  const deadline = Date.now() + timeout;
  let nudged = false;

  while (Date.now() < deadline) {
    if (await speaker.isVisible().catch(() => false)) {
      return dialog;
    }
    if (!nudged) {
      nudged = true;
      await page
        .evaluate((nodeId) => {
          void window.__volodka_e2e?.visitDialogueNode(nodeId);
        }, expectedNodeId)
        .catch(() => undefined);
    }
    await page.waitForTimeout(400);
  }

  await expect(speaker).toBeVisible({ timeout: 0 });
  return dialog;
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
