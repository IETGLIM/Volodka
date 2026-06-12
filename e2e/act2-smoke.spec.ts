import { test, expect } from '@playwright/test';
import {
  settleAfterWake,
  skipStoryTypewriter,
  skipWakeCinematic,
  waitForMenuReady,
  waitForStoryDialog,
} from './helpers';

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
    await waitForStoryDialog(page, 'act2_transition');
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
    await waitForStoryDialog(page, 'act2_albert_hint');
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

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('start_diagnosis'));
    }
    await waitForStoryDialog(page, 'start_diagnosis');
    await skipStoryTypewriter(page);

    await expect(
      page.getByRole('button', { name: /Начать расшифровку/i }),
    ).toBeVisible({ timeout: 30_000 });
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

    const storyDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await storyDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('fix_success'));
    }
    await waitForStoryDialog(page, 'fix_success');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/Стихи|живые стихи|4729|расшифров/i).first()).toBeVisible({
      timeout: 20_000,
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

    const mariaDialog = page.getByRole('dialog', { name: /Голос/i });
    if (!(await mariaDialog.isVisible({ timeout: 12_000 }).catch(() => false))) {
      await page.evaluate(() => window.__volodka_e2e?.visitStoryNode('act2_maria_meeting_place'));
    }
    await waitForStoryDialog(page, 'act2_maria_meeting_place');
    await skipStoryTypewriter(page);

    await expect(page.getByText(/Сеть|дверью|Виктория|клятв/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
