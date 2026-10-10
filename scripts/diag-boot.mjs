import { chromium } from 'playwright';

const URL = process.argv[2] ?? 'http://localhost:4173/html/19673316/index.html';
const browser = await chromium.launch({
  headless: true,
  executablePath: '/home/z/.cache/ms-playwright/chromium-1243/chrome-linux64/chrome',
  args: [
    '--use-angle=default', '--enable-webgl', '--ignore-gpu-blocklist',
    '--enable-unsafe-swiftshader', '--disable-gpu-sandbox',
    '--disable-backgrounding-occluded-windows', '--disable-renderer-backgrounding',
    '--disable-background-timer-throttling',
    '--disable-features=CalculateNativeWinOcclusion',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
const errors = [];
page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') errors.push(`[${m.type()}] ${m.text().slice(0, 300)}`); });
page.on('pageerror', (e) => errors.push(`[pageerror] ${String(e).slice(0, 300)}`));
page.on('response', (r) => { if (r.status() >= 400) errors.push(`[net${r.status()}] ${r.url()}`); });
page.on('requestfailed', (r) => errors.push(`[netfail] ${r.url()} ${r.failure()?.errorText}`));

await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 60_000 });
for (let i = 0; i < 6; i++) {
  await page.waitForTimeout(5000);
  const state = await page.evaluate(() => ({
    bodyText: (document.body.innerText || '').slice(0, 200),
    rootChildren: document.getElementById('root')?.childElementCount ?? -1,
    testIds: Array.from(document.querySelectorAll('[data-testid]')).slice(0, 12).map((el) => el.getAttribute('data-testid')),
  })).catch((e) => ({ err: String(e).slice(0, 150) }));
  console.log(`t=${(i + 1) * 5}s:`, JSON.stringify(state));
}
await page.screenshot({ path: '/home/z/my-project/smoke/diag.png' });
console.log('\nerrors:', errors.length);
for (const e of errors.slice(0, 20)) console.log(' ', e);
await browser.close();
