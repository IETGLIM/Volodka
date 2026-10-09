/** Journal DOM geometry probe: where does the overflow come from? */
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
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });
await page.getByTestId('menu-new-game').waitFor({ timeout: 120_000 });
await page.getByTestId('menu-new-game').click();
await page.getByTestId('menu-start-prologue').waitFor({ timeout: 15_000 });
await page.getByTestId('menu-start-prologue').click();
await page.waitForFunction(() => typeof window.__volodka_e2e?.getFrameProfilerSnapshot === 'function', null, { timeout: 90_000 });
await page.evaluate(() => window.__volodka_e2e.armDevTools());
await page.waitForTimeout(4000);
await page.keyboard.press('Escape');
await page.waitForTimeout(1500);
await page.keyboard.press('Escape');
await page.waitForTimeout(2000);

// Advance to exploration quickly.
for (let i = 0; i < 30; i++) {
  const st = await page.evaluate(() => ({
    hud: Boolean(document.querySelector('[data-testid="game-hud"]')),
    dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).filter((d) => d.offsetParent !== null).length,
  }));
  if (st.hud && st.dialogs === 0) break;
  for (const name of [/Подняться и осмотреться/i, /ЗАКРЫТЬ/i, /Продолжить/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible({ timeout: 250 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(300);
    }
  }
  await page.evaluate(() => window.__volodka_e2e.promoteClosedOverlayHub('explore_mode', 'volodka_room')).catch(() => {});
  await page.waitForTimeout(1000);
}

await page.keyboard.press('KeyJ');
await page.waitForTimeout(2000);

const geo = await page.evaluate(() => {
  const pick = (el) => {
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    return {
      rect: { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) },
      overflow: cs.overflow,
      display: cs.display,
      flexDir: cs.flexDirection,
      testId: el.getAttribute?.('data-testid') ?? null,
      cls: (el.className || '').toString().slice(0, 80),
    };
  };
  const panel = document.querySelector('[data-testid="journal-panel"]');
  const all = [...document.querySelectorAll('[role="dialog"]')].map((d) => pick(d));
  const tablist = document.querySelector('[role="tablist"][aria-label="Разделы журнала"]');
  const tabs = [...document.querySelectorAll('[role="tab"][id^="journal-tab-"]')].map((t) => ({
    id: t.id,
    rect: (() => { const r = t.getBoundingClientRect(); return { y: Math.round(r.y), h: Math.round(r.height) }; })(),
  }));
  // Which panel actually visible?
  const panels = all.map((p) => p?.cls?.slice(0, 60));
  return { panel: pick(panel), dialogs: all, tablist: pick(tablist), tabs, innerH: window.innerHeight };
});

console.log(JSON.stringify(geo, null, 2));
await page.screenshot({ path: '/tmp/journal-geo.png' });
await browser.close();
