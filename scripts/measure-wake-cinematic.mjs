/**
 * Measure frame profiler during the WAKE CINEMATIC (before exploration).
 * The user's pasted HUD (57 ticks, 1/220 draw calls, 39ms budget runner)
 * matches a cutscene-ish state, not exploration (124 draw calls).
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
await page.getByTestId('menu-new-game').click();
await page.getByTestId('menu-start-prologue').waitFor({ timeout: 15_000 });
await page.getByTestId('menu-start-prologue').click();

await page.waitForFunction(
  () => typeof window.__volodka_e2e?.getFrameProfilerSnapshot === 'function',
  null,
  { timeout: 90_000 },
);
await page.evaluate(() => window.__volodka_e2e.armDevTools());

const grab = (extra = {}) => page.evaluate((e) => {
  const s = window.__volodka_e2e.getFrameProfilerSnapshot();
  return {
    phase: null,
    ticks: s.registeredTicks,
    cpuBudgetMs: Number(s.cpuBudgetMs.toFixed(2)),
    cpuFrameMs: Number(s.cpuFrameMs.toFixed(1)),
    physics: s.physicsStepMs,
    drawCalls: s.drawCalls,
    triangles: s.triangles,
    systems: Object.fromEntries(Object.entries(s.systems).map(([k, v]) => [k, Number(v.cpuMs.toFixed(2))])),
    topTicks: s.topTicks.slice(0, 6).map((t) => `${t.label}[${t.system}]=${t.cpuMs.toFixed(2)}`),
    ...e,
  };
}, extra);

// Sample during wake cinematic WITHOUT skipping.
const stages = [];
for (let i = 0; i < 10; i++) {
  await page.waitForTimeout(4000);
  const st = await grab({ t: (i + 1) * 4 });
  stages.push(st);
  console.log(`t=${st.t}s`, JSON.stringify(st));
  await page.screenshot({ path: `/tmp/wake-${i}.png` }).catch(() => {});
}

console.log('\n===== STAGE SUMMARY =====');
for (const s of stages) {
  console.log(
    `t=${String(s.t).padStart(3)}s ticks=${String(s.ticks).padStart(3)} budget=${String(s.cpuBudgetMs).padStart(6)}ms frame=${String(s.cpuFrameMs).padStart(7)}ms draws=${String(s.drawCalls).padStart(4)} top=[${s.topTicks.join(', ')}]`,
  );
}

await browser.close();
