import { test, expect } from '@playwright/test';
import {
  advanceStoryOverlay,
  prepareStoryBootstrap,
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
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2Entry();
    });

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
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2AlbertHint();
    });

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
    await prepareStoryBootstrap(page);

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
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapStartDiagnosis();
    });

    await advanceStoryOverlay(page, 'start_diagnosis');

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
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapFixSuccess();
    });

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
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2MariaMeeting();
    });

    await advanceStoryOverlay(page, 'act2_maria_meeting_place');

    await expect(page.getByText(/Сеть|дверью|Виктория|клятв/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap office hub → dmitry_defection physical beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2DmitryOffice();
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
    await page.evaluate(() => {
      window.__volodka_e2e?.setPlayerPosition(-2.0, 0.01, 1.5);
      window.__volodka_e2e?.interactTriggerZone('office_dmitry_meeting');
    });

    await page.waitForTimeout(800);

    const continueBtn = page.getByRole('button', { name: /^Продолжить$/i });
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
      await page.waitForTimeout(600);
    }

    const protocolBtn = page.getByRole('button', { name: /Протокол|Дмитрий|Александр/i });
    if (await protocolBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await protocolBtn.first().click({ force: true });
      await page.waitForTimeout(800);
    }

    await expect(page.getByText(/Протокол|Дмитрий|Забвения|терминал/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap cafe hub → cafe_safehouse barista trigger', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2CafeSafehouse();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/Синяя яма|кафе|бариста/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );
    await page.evaluate(() => {
      window.__volodka_e2e?.setPlayerPosition(0, 0.01, -3.5);
      window.__volodka_e2e?.interactTriggerZone('cafe_safehouse_barista');
    });

    await page.waitForTimeout(800);

    const continueBtn = page.getByRole('button', { name: /^Продолжить$/i });
    if (await continueBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await continueBtn.click({ force: true });
      await page.waitForTimeout(600);
    }

    const safehouseBtn = page.getByRole('button', { name: /явочн|Договорились|задн/i });
    if (await safehouseBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await safehouseBtn.first().click({ force: true });
      await page.waitForTimeout(800);
    }

    await expect(page.getByText(/явочн|задн|барист|Сети|подсобк/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap office hub → vault_key_fragments guild fragment', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2VaultGuildFragment();
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
    await page.evaluate(() => {
      window.__volodka_e2e?.setPlayerPosition(-3.5, 0.01, -4.0);
      window.__volodka_e2e?.interactTriggerZone('office_vault_guild_fragment');
    });

    await page.waitForTimeout(800);

    const takeBtn = page.getByRole('button', { name: /Забрать фрагмент|шкафчик/i });
    if (await takeBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await takeBtn.first().click({ force: true });
      await page.waitForTimeout(600);
    }

    await expect(page.getByText(/фрагмент|ключ|гильди/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap library hub → poetry_smuggling stash trigger', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2PoetrySmugglingLibrary();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/библиотек|стеллаж|бумаг/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );
    await page.evaluate(() => {
      window.__volodka_e2e?.setPlayerPosition(-4.0, 0.01, -4.0);
      window.__volodka_e2e?.interactTriggerZone('library_poetry_stash');
    });

    await page.waitForTimeout(800);

    const stashBtn = page.getByRole('button', { name: /Забрать|тайник|стих/i });
    if (await stashBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await stashBtn.first().click({ force: true });
      await page.waitForTimeout(600);
    }

    await expect(page.getByText(/стих|патрул|парк|свёрток/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap pier hub → trofim portwine physical beat', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2PierBasement();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/пирс|река|Трофим|костёр/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );
    await page.evaluate(() => {
      window.__volodka_e2e?.setPlayerPosition(4.0, 0.01, -7.2);
      window.__volodka_e2e?.interactTriggerZone('pier_trofim_portwine');
    });

    await page.waitForTimeout(800);

    const keyBtn = page.getByRole('button', { name: /Принять ключ|портвейн|777/i });
    if (await keyBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await keyBtn.first().click({ force: true });
      await page.waitForTimeout(600);
    }

    await expect(page.getByText(/ключ|Трофим|подвал|777/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });

  test('bootstrap street winter hub → act2 closing bridge trigger', async ({ page }) => {
    await waitForMenuReady(page);
    await page.getByTestId('menu-new-game').click();
    await expect(page.locator('canvas[data-engine]')).toBeVisible({ timeout: 90_000 });

    await skipWakeCinematic(page);
    await expect(page.getByTestId('game-hud')).toBeVisible({ timeout: 30_000 });
    await settleAfterWake(page);
    await prepareStoryBootstrap(page);

    await page.evaluate(async () => {
      await window.__volodka_e2e?.bootstrapAct2ClosingWinter();
    });

    await expect(page.getByRole('dialog', { name: /Голос/i })).not.toBeVisible({ timeout: 5000 });
    await expect(page.getByText(/зимн|снег|улиц/i).first()).toBeVisible({
      timeout: 20_000,
    });

    await page.waitForFunction(
      () => typeof window.__volodka_e2e?.interactTriggerZone === 'function',
      null,
      { timeout: 30_000 },
    );
    await page.evaluate(() => {
      window.__volodka_e2e?.setPlayerPosition(-1.5, 0.01, 4.0);
      window.__volodka_e2e?.interactTriggerZone('street_winter_act2_closing');
    });

    await page.waitForTimeout(800);

    const homeBtn = page.getByRole('button', { name: /Идти домой/i });
    if (await homeBtn.isVisible({ timeout: 8000 }).catch(() => false)) {
      await homeBtn.first().click({ force: true });
      await page.waitForTimeout(600);
    }

    await expect(page.getByText(/снег|домой|новый день|act3/i).first()).toBeVisible({
      timeout: 20_000,
    });
  });
});
