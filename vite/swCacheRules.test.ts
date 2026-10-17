/**
 * v4.48.12 — P1 regression-тесты правил кэширования Service Worker.
 *
 * Баг: STATIC_ASSET_RE ожидал [name].[8 hex].ext, тогда как Vite отдаёт
 * [name]-[8 base64url].ext — ни один прод-бандл не кэшировался, офлайн-оболочка
 * имела HTML, но не могла запуститься (JS/CSS отсутствовали в кэше).
 *
 * Контракт закреплён на двух уровнях:
 *  1. Unit: regex, извлечённый из ПОСТАВЛЯЕМОГО исходника (public/sw.js),
 *     обязан совпадать с реальными формами имён Vite и не трогать
 *     нехэшированные/медийные пути.
 *  2. Build-интеграция (регистрируется ТОЛЬКО при наличии dist/): каждый
 *     script/link-путь из СОБРАННОГО index.html обязан совпадать с правилами
 *     SW, а собранный sw.js обязан нести эти пути в PRECACHE_BUNDLE_URLS —
 *     то есть после первого успешного визита у браузера есть всё для
 *     офлайн-перезагрузки (HTML — по networkFirst-фолбэку, бандлы — из
 *     precache при install).
 *
 * ВАЖНО (v4.56.3): dist-зависимая часть регистрируется через if (hasBuiltArtifacts),
 * а не describe.skipIf — Vitest исполняет колбэк describe при коллекции, поэтому
 * readFileSync(dist/…) падал ENOENT в CI, где test:unit не предваряется сборкой.
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SW_SOURCE_PATH = path.join(ROOT, 'public', 'sw.js');
const DIST_HTML_PATH = path.join(ROOT, 'dist', 'index.html');
const DIST_SW_PATH = path.join(ROOT, 'dist', 'sw.js');

/** Извлечь однострочный regex-литерал const NAME = /…/; из исходника SW. */
function extractRegexLiteral(source: string, constName: string): RegExp {
  const match = source.match(new RegExp(`const ${constName} = (\\/.+\\/);`));
  if (!match) throw new Error(`${constName} не найден в sw.js (ожидается однострочный литерал)`);
  return new RegExp(match[1].slice(1, -1));
}

/** Собрать same-origin JS/CSS пути из HTML (нормализация ./ → /). */
function extractHtmlBundlePaths(html: string): string[] {
  const urls = new Set<string>();
  const attrRe = /(?:src|href)\s*=\s*"([^"]+)"/g;
  let match: RegExpExecArray | null;
  while ((match = attrRe.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('./')) url = url.slice(1);
    if (!url.startsWith('/') || url.startsWith('//')) continue;
    if (!/\.(?:js|mjs|css)(?:[?#].*)?$/.test(url)) continue;
    urls.add(url.replace(/[?#].*$/, ''));
  }
  return [...urls].sort();
}

/** Вытащить содержимое PRECACHE_BUNDLE_URLS из собранного sw.js. */
function extractPrecacheBundleUrls(swSource: string): string[] {
  const match = swSource.match(/const PRECACHE_BUNDLE_URLS = \[([^\]]*)\];/);
  if (!match) return [];
  // Инъекция пишет JSON.stringify (двойные кавычки), shell-литерал — одинарные.
  return [...match[1].matchAll(/"([^"]+)"|'([^']+)'/g)].map(
    (entry) => entry[1] ?? entry[2],
  );
}

const swSource = readFileSync(SW_SOURCE_PATH, 'utf8');
const staticAssetRe = extractRegexLiteral(swSource, 'STATIC_ASSET_RE');
const mediaRe = extractRegexLiteral(swSource, 'MEDIA_RE');

describe('sw.js STATIC_ASSET_RE против реального вывода Vite', () => {
  it('совпадает с точными именами бандлов из P1-репорта', () => {
    expect(staticAssetRe.test('/assets/index-BoZTl6CZ.js')).toBe(true);
    expect(staticAssetRe.test('/assets/index-COn_IUUM.css')).toBe(true);
    expect(staticAssetRe.test('/assets/data-world-Dw4ZVjdT.js')).toBe(true);
  });

  it('совпадает с хэшированными шрифтами и вложенными именами чанков', () => {
    expect(staticAssetRe.test('/assets/cormorant-500-italic-cyrillic-BL4-EpBx.woff2')).toBe(true);
    expect(staticAssetRe.test('/assets/panel-poetry-power-bar-Ce1G5wsx.css')).toBe(true);
    expect(staticAssetRe.test('/assets/data-story-act1-mIq0OVWe.js')).toBe(true);
  });

  it('mount-агностичен: вложенный хостинг резолвится так же, как корень', () => {
    expect(staticAssetRe.test('/volodka/assets/index-BoZTl6CZ.js')).toBe(true);
    expect(staticAssetRe.test('/game/nested/assets/index-BoZTl6CZ.js')).toBe(true);
  });

  it('терпит cache-busting query-string', () => {
    expect(staticAssetRe.test('/assets/index-BoZTl6CZ.js?v=2')).toBe(true);
  });

  it('НЕ совпадает с нехэшированными, легаси и вне-assets путями', () => {
    // Без хэша = потенциально мутирующий файл → безопасный pass-through.
    expect(staticAssetRe.test('/assets/index.js')).toBe(false);
    // Легаси-форма [name].[8hex] никогда не существовала в этой сборке.
    expect(staticAssetRe.test('/assets/index.0123abcd.js')).toBe(false);
    // Sourcemap-продолжение и файл без расширения не кэшируем.
    expect(staticAssetRe.test('/assets/index-BoZTl6CZ.js.map')).toBe(false);
    expect(staticAssetRe.test('/assets/index-BoZTl6CZ')).toBe(false);
    // Вне /assets/ — не статический бандл.
    expect(staticAssetRe.test('/index-BoZTl6CZ.js')).toBe(false);
    expect(staticAssetRe.test('/assets/index-BoZTl6CZ.unknown')).toBe(false);
  });

  it('не глотает медийные пути — за них отвечает bounded media-кэш', () => {
    expect(staticAssetRe.test('/models/fps/fps_arms.glb')).toBe(false);
    expect(mediaRe.test('/models/fps/fps_arms.glb')).toBe(true);
  });
});

const hasBuiltArtifacts = existsSync(DIST_HTML_PATH) && existsSync(DIST_SW_PATH);

/* Чтение собранных артефактов — только когда dist/ реально существует.
 * describe.skipIf НЕ спасает: колбэк describe выполняется при коллекции,
 * и readFileSync ронял весь файл в CI (без сборки dist/ отсутствует). */
if (hasBuiltArtifacts) {
  describe('собранный index.html ↔ правила кэша Service Worker', () => {
    const html = readFileSync(DIST_HTML_PATH, 'utf8');
    const builtSw = readFileSync(DIST_SW_PATH, 'utf8');
    const bundlePaths = extractHtmlBundlePaths(html);
    const precached = extractPrecacheBundleUrls(builtSw);

    it('сборка ссылается хотя бы на один бандл (традиционный code-split)', () => {
      expect(bundlePaths.length).toBeGreaterThan(0);
    });

    it('каждый script/link-путь из index.html попадает под STATIC_ASSET_RE', () => {
      for (const url of bundlePaths) {
        expect(staticAssetRe.test(url), `${url} обязан кэшироваться офлайн`).toBe(true);
      }
    });

    it('PRECACHE_BUNDLE_URLS в собранном sw.js покрывает все пути из index.html', () => {
      expect(precached.length).toBeGreaterThan(0);
      for (const url of bundlePaths) {
        expect(precached, `${url} обязан быть в precache при install`).toContain(url);
      }
    });

    it('инъекция завершена: маркер не остался в собранном sw.js', () => {
      expect(builtSw.includes('__PRECACHE_BUNDLES__')).toBe(false);
    });

    it('каждый прекэшированный путь сам совпадает со STATIC_ASSET_RE', () => {
      for (const url of precached) {
        expect(staticAssetRe.test(url), url).toBe(true);
      }
    });

    it('shell-список не потерялся при инъекции', () => {
      expect(builtSw).toContain("const SHELL_PRECACHE_URLS = ['/', '/manifest.json', '/logo.svg', '/icon.svg'];");
    });

    it('fetch-хендлер реально маршрутизирует статику через cache-first', () => {
      expect(builtSw).toMatch(/STATIC_ASSET_RE\.test\(path\)/);
      expect(builtSw).toMatch(/cacheFirst\(request, CACHE_NAME\)/);
    });

    it('install защищён от зависания: каждый прекэш-fetch с жёстким таймаутом', () => {
      // QA-кейс: fetch из контекста SW может висеть вечно в части окружений —
      // без потолка install блокирует активацию SW целиком.
      expect(builtSw).toMatch(/AbortSignal\.timeout\(PRECACHE_TIMEOUT_MS\)/);
      expect(builtSw).toMatch(/urls\.map\(\(url\) => precacheOne\(cache, url\)\)/);
      expect(builtSw).toMatch(/await self\.skipWaiting\(\)/);
      // addAll-батчей больше нет: один сбой не роняет весь прекэш.
      expect(builtSw).not.toMatch(/cache\.addAll\(/);
    });
  });
}
