/**
 * Live frame-profiler measurement in volodka_room.
 * Boots the built app in headless Chromium, starts a new game, skips the wake
 * cinematic, waits for stabilization, then samples the frame profiler snapshot
 * via the e2e bridge and prints systems + top ticks.
 *
 * Usage: node scripts/measure-frame-profiler.mjs [--url http://127.0.0.1:4173]
 */
import { chromium } from 'playwright';

const url = process.argv.includes('--url')
  ? process.argv[process.argv.indexOf('--url') + 1]
  : 'http://127.0.0.1:4173';

const browser = await chromium.launch({
  headless: process.env.MEASURE_HEADLESS === '1',
  channel: process.env.MEASURE_HEADLESS === '1' ? 'chromium' : undefined,
  args: [
    '--use-angle=default',
    '--enable-webgl',
    '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader',
    '--disable-gpu-sandbox',
    '--disable-backgrounding-occluded-windows',
    '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });

page.on('pageerror', (err) => console.error('[pageerror]', String(err).slice(0, 200)));

console.log('[1/4] open', url);
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120_000 });

console.log('[2/4] start new game');
await page.getByTestId('menu-new-game').waitFor({ timeout: 120_000 });
await page.getByTestId('menu-new-game').click();
await page.getByTestId('menu-start-prologue').waitFor({ timeout: 15_000 });
await page.getByTestId('menu-start-prologue').click();

console.log('[3/4] wait e2e bridge + arm devtools + advance wake prologue');
await page.waitForFunction(() => typeof window.__volodka_e2e?.getFrameProfilerSnapshot === 'function', null, { timeout: 90_000 });
await page.evaluate(() => window.__volodka_e2e.armDevTools());
await page.waitForTimeout(2500);
await page.keyboard.press('Escape');
await page.waitForTimeout(2000);
await page.keyboard.press('Escape');
await page.waitForTimeout(3000);

// Advance Act I wake prologue: dismiss story beats, promote explore_mode hub.
const deadline = Date.now() + 120_000;
let promoted = false;
let iter = 0;
while (Date.now() < deadline) {
  iter += 1;
  const st = await page.evaluate(() => ({
    ticks: window.__volodka_e2e.getFrameProfilerSnapshot().registeredTicks,
    hud: Boolean(document.querySelector('[data-testid="game-hud"]')),
    dialogVisible: Array.from(document.querySelectorAll('[role="dialog"]')).some((d) => d.offsetParent !== null),
  }));
  console.log(`iter ${iter}:`, JSON.stringify(st));
  if (st.hud && st.ticks > 10 && !st.dialogVisible) {
    console.log('exploration reached, ticks =', st.ticks);
    break;
  }
  // Dismiss possible overlays.
  for (const name of [/Подняться и осмотреться/i, /ЗАКРЫТЬ/i, /Продолжить/i, /Далее/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible({ timeout: 300 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  if (!promoted) {
    await page.evaluate(() => window.__volodka_e2e.promoteClosedOverlayHub('explore_mode', 'volodka_room'));
    promoted = true;
  }
  if (iter === 3) await page.screenshot({ path: '/tmp/advance-iter3.png' });
  if (iter === 8) await page.screenshot({ path: '/tmp/advance-iter8.png' });
  await page.waitForTimeout(1500);
}

const canvasState = await page.evaluate(() => {
  const c = document.querySelector('canvas[data-engine]');
  if (!c) return 'none';
  const st = getComputedStyle(c);
  return `visibility=${st.visibility} w=${c.width} h=${c.height}`;
});
console.log('canvas:', canvasState);
await page.screenshot({ path: '/tmp/prof-state.png' });

console.log('[4/4] sampling profiler (12 s stabilize)...');
await page.waitForTimeout(12_000);

const grab = () => page.evaluate(() => {
  const s = window.__volodka_e2e.getFrameProfilerSnapshot();
  return {
    cpuBudgetMs: s.cpuBudgetMs,
    cpuFrameMs: s.cpuFrameMs,
    physicsStepMs: s.physicsStepMs,
    registeredTicks: s.registeredTicks,
    drawCalls: s.drawCalls,
    triangles: s.triangles,
    textures: s.textures,
    geometries: s.geometries,
    reactRendersThisFrame: s.reactRendersThisFrame,
    zustandNotificationsThisFrame: s.zustandNotificationsThisFrame,
    systems: Object.fromEntries(Object.entries(s.systems).map(([k, v]) => [k, Number(v.cpuMs.toFixed(2))])),
    topTicks: s.topTicks.map((t) => ({ label: t.label, system: t.system, cpuMs: Number(t.cpuMs.toFixed(2)) })),
  };
});

const snap1 = await grab();
const fps = await page.evaluate(() => new Promise((resolve) => {
  let frames = 0;
  const t0 = performance.now();
  const tick = () => {
    frames += 1;
    if (performance.now() - t0 < 5000) requestAnimationFrame(tick);
    else resolve(Math.round((frames * 1000) / (performance.now() - t0)));
  };
  requestAnimationFrame(tick);
}));
await page.waitForTimeout(3000);
const snap2 = await grab();

console.log('\n===== PROFILER SAMPLE 1 =====');
console.log(JSON.stringify(snap1, null, 2));
console.log('\n===== PROFILER SAMPLE 2 =====');
console.log(JSON.stringify(snap2, null, 2));
console.log('\n===== FPS (5 s rAF, headless swiftshader) =====', fps);

await browser.close();
