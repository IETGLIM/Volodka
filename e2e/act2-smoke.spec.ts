import { test, expect } from '@playwright/test';

async function waitForMenuReady(page: import('@playwright/test').Page) {
  await page.goto('/');
  await expect(page).toHaveTitle(/ВОЛОДЬКА/i, { timeout: 90_000 });
  await expect(page.getByTestId('menu-new-game')).toBeVisible({ timeout: 90_000 });
}

async function skipWakeCinematic(page: import('@playwright/test').Page) {
  await page.waitForTimeout(2500);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(3500);
}

async function skipStoryTypewriter(page: import('@playwright/test').Page) {
  const skipBtn = page.getByRole('button', { name: /Пропустить анимацию текста/i });
  if (await skipBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
    try {
      await skipBtn.click({ force: true, timeout: 3000 });
    } catch {
      // Overlay may close mid-skip during hub promotion or cutscene handoff.
    }
    await page.waitForTimeout(400);
  }
}

/** Dismiss first_reading matrix quote + quest-complete dialog after deferred activation. */
async function dismissFirstReadingBeats(page: import('@playwright/test').Page) {
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

/** Let wake-up deferred beats finish before e2e bootstrap overwrites story state. */
async function dismissFirstPlayTutorial(page: import('@playwright/test').Page) {
  const skipTutorial = page.getByRole('button', { name: /Пропустить обучение/i });
  if (await skipTutorial.isVisible({ timeout: 5000 }).catch(() => false)) {
    await skipTutorial.click({ force: true });
    await page.waitForTimeout(400);
  }
}

async function settleAfterWake(page: import('@playwright/test').Page) {
  await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 45_000 });
  await dismissFirstReadingBeats(page);
  await dismissFirstPlayTutorial(page);
  await page.waitForTimeout(1500);
}

test.describe('Act II smoke', () => {
  test('bootstrap act2 → act2_transition → cafe golden branch', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2Entry();
    });

    const hubDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await hubDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('act2_transition'));
    }
    await expect(hubDialog).toBeVisible({ timeout: 45_000 });
    await skipStoryTypewriter(page);

    const cafeBtn = page.getByRole('button', { name: /Вернуться в кафе/i });
    if (await cafeBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await cafeBtn.click({ force: true });
    } else {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('act2_albert_hint'));
    }

    await expect(page.getByText(/Альберт|гильдии|стихи/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap act2 albert hint beat on cafe scene', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2AlbertHint();
    });

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('act2_albert_hint'));
    }
    await expect(storyDialog).toBeVisible({ timeout: 45_000 });
    await skipStoryTypewriter(page);
    await expect(page.getByText(/Альберт|гильдии|стихи/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap office hub → start_diagnosis golden branch', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapMidActOffice();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/IT-гильдии|офис|сервер/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );
    await page.evaluate(() => window.__volodka_e2e?.interactTriggerZone('office_terminal'));

    await expect(page.getByText(/4729|расшифров|стихи|терминал/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap start_diagnosis beat directly', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapStartDiagnosis();
    });

    const hubDialog = page.getByRole('dialog', { name: /Голос/i });
    await expect(hubDialog).toBeVisible({ timeout: 45_000 });
    await skipStoryTypewriter(page);

    const decryptBtn = hubDialog.getByRole('button', { name: /Начать расшифровку/i });
    await expect(decryptBtn).toBeVisible({ timeout: 45_000 });
    await decryptBtn.click({ force: true });

    await expect(page.getByText(/4729|расшифров|стихи/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap fix_success → poem revelation beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapFixSuccess();
    });

    await expect(page.getByText(/Стихи в коде|живые стихи|зашифрован/i).first()).toBeVisible({
      timeout: 45_000,
    });
  });

  test('bootstrap act2 maria meeting place with karma gate hint', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2MariaMeeting();
    });

    const hubDialog = page.getByRole('dialog', { name: /Голос/i });
    await expect(hubDialog).toBeVisible({ timeout: 45_000 });
    await skipStoryTypewriter(page);

    await expect(page.getByText(/Сеть|дверью|Виктория|клятв/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
