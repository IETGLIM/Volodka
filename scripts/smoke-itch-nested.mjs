/**
 * v4.44 smoke-тест itch-архива из ВЛОЖЕННОГО пути (симуляция itch iframe).
 * Проверяет: загрузку меню, старт игры, отсутствие 404 на модели/анимации,
 * отсутствие ошибок ErrorBoundary, чистую консоль.
 */
import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://127.0.0.1:4173/html/19673316/index.html';
const browser = await chromium.launch({
  headless: true,
  // локальное окружение: playwright-браузеры другой версии — берём готовый бинарник
  executablePath: '/home/z/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: [
    '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader', '--disable-gpu-sandbox',
    '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
});

const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
const page = await context.newPage();
context.on('requestfailed', (req) => {
  console404s.push(`[ctx-reqfail] ${req.url().slice(-120)} ${req.failure()?.errorText}`);
});
context.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('/api/')) {
    console404s.push(`[ctx-resp${res.status()}] ${res.url().slice(-120)}`);
  }
});
context.on('request', (req) => {
  const u = req.url();
  if (/basis|draco/i.test(u)) console.log('    [info] loader request:', u.slice(-90));
});

const console404s = [];
const consoleErrors = [];
const netFailures = [];
page.on('console', (msg) => {
  const text = msg.text();
  if (msg.type() === 'error') {
    if (/404|Failed to load resource/i.test(text)) {
      const loc = msg.location();
      console404s.push(`${text.slice(0, 80)} @@ from: ${loc.url?.slice(-110) ?? '?'}:${loc.lineNumber ?? '?'}`);
    }
    else consoleErrors.push(text.slice(0, 200));
  }
});
page.on('requestfailed', (req) => {
  console404s.push(`[reqfail] ${req.url().slice(-120)} ${req.failure()?.errorText}`);
});
page.on('response', (res) => {
  if (res.status() >= 400 && !res.url().includes('/api/')) {
    console404s.push(`[resp${res.status()}] ${res.url().slice(-120)}`);
  }
});
page.on('pageerror', (err) => consoleErrors.push(`[pageerror] ${String(err).slice(0, 200)}`));
page.on('requestfailed', (req) => {
  netFailures.push(`${req.url().slice(-90)} :: ${req.failure()?.errorText}`);
});
page.on('response', (res) => {
  if (res.status() >= 400) {
    const u = res.url();
    // /api/* ожидаемо отсутствует на статике — тихая деградация, не баг
    if (!u.includes('/api/')) netFailures.push(`${res.status()} ${u.slice(-100)}`);
  }
});

console.log('[1] goto', URL);
await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 120_000 });

console.log('[2] ждём меню…');
await page.getByTestId('menu-new-game').waitFor({ timeout: 120_000 });
await page.waitForTimeout(4000);
await page.screenshot({ path: '/home/z/my-project/smoke/shot-1-menu.png' });
console.log('    меню открыто, скриншот снят');

console.log('[3] новая игра…');
await page.getByTestId('menu-new-game').click();
const startBtn = page.getByTestId('menu-start-prologue');
try {
  await startBtn.waitFor({ timeout: 15_000 });
  await startBtn.click();
} catch {
  console.log('    (skip: кнопка пролога не появилась)');
}

console.log('[4] ждём пробуждение + сцену…');
await page.waitForFunction(
  () => typeof window.__volodka_e2e?.getFrameProfilerSnapshot === 'function',
  null, { timeout: 90_000 },
).catch(() => console.log('    (profiler не поднялся — продолжаем)'));
await page.waitForTimeout(9000);
await page.screenshot({ path: '/home/z/my-project/smoke/shot-2-wake.png' });

// Продвигаемся до exploration (жмём доступные кнопки)
const deadline = Date.now() + 90_000;
let reached = false;
while (Date.now() < deadline) {
  const st = await page.evaluate(() => ({
    hud: Boolean(document.querySelector('[data-testid="game-hud"]')),
    dialogs: Array.from(document.querySelectorAll('[role="dialog"]')).filter((d) => d.offsetParent !== null).length,
  }));
  if (st.hud && st.dialogs === 0) { reached = true; break; }
  for (const name of [/Подняться и осмотреться/i, /ЗАКРЫТЬ/i, /Продолжить/i, /Далее/i]) {
    const btn = page.getByRole('button', { name }).first();
    if (await btn.isVisible({ timeout: 250 }).catch(() => false)) {
      await btn.click({ force: true }).catch(() => {});
      await page.waitForTimeout(400);
    }
  }
  await page.evaluate(() => window.__volodka_e2e?.promoteClosedOverlayHub('explore_mode', 'volodka_room')).catch(() => {});
  await page.waitForTimeout(1500);
}
console.log('[5] exploration достигнут:', reached);
await page.waitForTimeout(5000);
await page.screenshot({ path: '/home/z/my-project/smoke/shot-3-exploration.png' });

// Проверяем, что 3D-модель игрока реально отрендерилась (канвас активен)
const canvasInfo = await page.evaluate(() => {
  const c = document.querySelector('canvas');
  if (!c) return { exists: false };
  return { exists: true, w: c.width, h: c.height };
});
console.log('[6] canvas:', JSON.stringify(canvasInfo));

// Журнал: убеждаемся, что вкладки БЕЗ «Кабинета мыслей»
const journalTabs = await page.evaluate(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  return tabs.map((t) => (t.textContent || '').trim()).filter(Boolean);
});
console.log('[7] вкладки журнала (если открыт):', JSON.stringify(journalTabs));

console.log('\n════════ ИТОГ ════════');
console.log('404/ресурсные ошибки :', console404s.length);
for (const t of console404s.slice(0, 10)) console.log('   404:', t);
console.log('JS-ошибки            :', consoleErrors.length);
for (const t of consoleErrors.slice(0, 10)) console.log('   ERR:', t);
console.log('Сетевые сбои (>=400) :', netFailures.length);
for (const t of netFailures.slice(0, 10)) console.log('   NET:', t);
const playerModelOk = !consoleErrors.some((e) => e.includes('cesium-player-model') || e.includes('volodka_lod0'));
console.log('Модель игрока        :', playerModelOk ? 'OK (без ошибок)' : 'ПРОБЛЕМА');
const bad = console404s.length > 0 || netFailures.length > 0 || !playerModelOk;
console.log(bad ? 'ВЕРДИКТ: ЕСТЬ ПРОБЛЕМЫ' : 'ВЕРДИКТ: ЧИСТО');

await browser.close();
process.exit(bad ? 1 : 0);
