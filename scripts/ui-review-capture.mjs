/**
 * UI review capture: menu → exploration → pause → journal → quest board.
 * Saves screenshots to /tmp/ui-review-*.png for visual inspection.
 */
import { chromium } from 'playwright';

const url = process.argv[2] ?? 'http://127.0.0.1:4173';
const browser = await chromium.launch({
  headless: false,
  args: [
    '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader', '--disable-gpu-sandbox',
    '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling', '--disable-features=CalculateNativeWinOcclusion',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
page.on('pageerror', (err) => console.error('[pageerror]', String(err).slice(0, 200)));

await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.getByTestId('menu-new-game').waitFor({ timeout: 120_000 });
await page.waitForTimeout(3000);
await page.screenshot({ path: '/tmp/ui-review-1-menu.png' });
console.log('menu captured');

await page.getByTestId('menu-new-game').click();
await page.getByTestId('menu-start-prologue').waitFor({ timeout: 15_000 });
await page.getByTestId('menu-start-prologue').click();
await page.waitForFunction(
  () => typeof window.__volodka_e2e?.getFrameProfilerSnapshot === 'function',
  null, { timeout: 90_000 },
);
await page.evaluate(() => window.__volodka_e2e.armDevTools());
await page.waitForTimeout(4000);
await page.screenshot({ path: '/tmp/ui-review-2-wake.png' });

// Advance to exploration.
const deadline = Date.now() + 120_000;
let ok = false;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => ({
    hud: Boolean(document.querySelector('[data-testid="game-hud"]')),
    dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).filter((d) => d.offsetParent !== null).length,
  }));
  if (st.hud && st.dialogs === 0) { ok = true; break; }
  for (const name of [/Подняться и осмотреться/i, /ЗАКРЫТЬ/i, /Продолжить/i, /Далее/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible({ timeout: 250 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(350);
    }
  }
  await page.evaluate(() => window.__volodka_e2e.promoteClosedOverlayHub('explore_mode', 'volodka_room')).catch(() => {});
  await page.waitForTimeout(1200);
}
console.log('exploration reached:', ok);
await page.waitForTimeout(2500);
await page.screenshot({ path: '/tmp/ui-review-3-exploration.png' });
console.log('exploration captured');

// Pause menu.
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
await page.screenshot({ path: '/tmp/ui-review-4-pause.png' });
console.log('pause captured');
await page.keyboard.press('Escape');
await page.waitForTimeout(800);

// Journal (J or Tab).
for (const key of ['j', 'Tab']) {
  await page.keyboard.press(key);
  await page.waitForTimeout(1200);
  await page.screenshot({ path: `/tmp/ui-review-5-journal-${key}.png` });
  await page.keyboard.press(key);
  await page.waitForTimeout(500);
}
console.log('journal captured');

await browser.close();
