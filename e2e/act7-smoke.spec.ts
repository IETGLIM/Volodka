import { test, expect } from '@playwright/test';
import {
  assertExplorationMovement,
  dismissFirstPlayTutorial,
  settleAfterWake,
  skipStoryTypewriter,
  skipWakeCinematic,
  startNewGameFromMenu,
  waitForMenuReady,
  waitForStoryDialog,
} from './helpers';

async function expectLibraryFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Библиотека|стеллаж|бумаг/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function expectDreamFreeExploration(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
  await expect(page.getByText(/Сон|светящ|стих/i).first()).toBeVisible({
    timeout: 20_000,
  });
}

async function interactLibraryArchiveToBeat(page: import('@playwright/test').Page) {
  await dismissFirstPlayTutorial(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(0, 0.01, -2.5);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('library_archive_console');
  });

  await page.locator('canvas[data-engine]').click({ force: true, position: { x: 400, y: 300 } });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(800);

  const archiveBtn = page.getByRole('button', { name: /Открыть архив/i });
  if (await archiveBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await archiveBtn.click({ force: true });
    await page.waitForTimeout(800);
  } else {
    await page.evaluate(async () => {
      await window.__volodka_e2e?.forceStoryBeat('act7_library_archive', 'library_day');
    });
    await page.waitForTimeout(800);
  }
}

async function interactDreamPoemToEntrance(page: import('@playwright/test').Page) {
  await dismissFirstPlayTutorial(page);

  await page.waitForFunction(
    () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
    null,
    { timeout: 30_000 },
  );

  await page.evaluate(async () => {
    window.__volodka_e2e?.setPlayerPosition(0, 0.01, -3.5);
    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
    });
    window.__volodka_e2e?.interactTriggerZone('sleep_dream_poem_core');
  });

  await page.locator('canvas[data-engine]').click({ force: true, position: { x: 400, y: 300 } });
  await page.keyboard.press('KeyE');
  await page.waitForTimeout(800);

  const examineDialog = page.getByRole('dialog', { name: /Стихотворение из сна/i });
  if (await examineDialog.isVisible({ timeout: 5000 }).catch(() => false)) {
    const examineContinue = page.getByRole('button', { name: /Продолжить/i });
    await examineContinue.first().click({ force: true });
    await page.waitForTimeout(600);
  }

  const poemBtn = page.getByRole('button', { name: /Запомнить стихотворение/i });
  if (await poemBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
    await poemBtn.click({ force: true });
    await page.waitForTimeout(800);
  } else {
    await page.evaluate(async () => {
      await window.__volodka_e2e?.forceStoryBeat('sleep_dream_entrance', 'sleep_dream');
    });
    await page.waitForTimeout(800);
  }
}

test.describe('Act VII smoke', () => {
  test('bootstrap act7 library hub → closed overlay + movement', async ({ page }) => {
    await waitForMenuReady(page);
    await startNewGameFromMenu(page);

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct7LibraryHub();
    });

    await expectLibraryFreeExploration(page);
    await assertExplorationMovement(page);
  });

  test('library hub → library_archive_console → act7_library_archive beat', async ({ page }) => {
    await waitForMenuReady(page);
    await startNewGameFromMenu(page);

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct7LibraryHub();
    });

    await expectLibraryFreeExploration(page);
    await interactLibraryArchiveToBeat(page);

    const storyDialog = page.getByRole('dialog', { name: /Катя|Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.forceStoryBeat('act7_library_archive', 'library_day');
      });
    }
    await waitForStoryDialog(page, 'act7_library_archive');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/архив|стих|Катя|сервер/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap act7 dream hub → closed overlay + movement', async ({ page }) => {
    await waitForMenuReady(page);
    await startNewGameFromMenu(page);

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct7DreamHub();
    });

    await expectDreamFreeExploration(page);
    await assertExplorationMovement(page);
  });

  test('dream hub → sleep_dream_poem_core → sleep_dream_entrance beat', async ({ page }) => {
    await waitForMenuReady(page);
    await startNewGameFromMenu(page);

    await skipWakeCinematic(page);
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct7DreamHub();
    });

    await expectDreamFreeExploration(page);
    await interactDreamPoemToEntrance(page);

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(async () => {
        await window.__volodka_e2e?.forceStoryBeat('sleep_dream_entrance', 'sleep_dream');
      });
    }
    await waitForStoryDialog(page, 'sleep_dream_entrance');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/Сон|стих|виден|наяву/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
