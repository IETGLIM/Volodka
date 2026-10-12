#!/usr/bin/env node
/**
 * v4.48.12 — inject-sw-precache.mjs
 *
 * P1 fix: SW-кэширование было несовместимо с именами Vite-сборки.
 * STATIC_ASSET_RE ожидал [name].[8 hex].ext, а Vite реально отдаёт
 * [name]-[8 base64url].ext (/assets/index-BoZTl6CZ.js и т.п.) — ни один
 * бандл не кэшировался, и офлайн-оболочка имела HTML без JS/CSS.
 *
 * Скрипт закрывает цикл на этапе сборки:
 *   1. Читает dist/index.html и собирает same-origin script/link-пути
 *      (entry-чанк + стилевые чанки; manifest/data: отбрасываются).
 *   2. Извлекает РЕАЛЬНЫЙ STATIC_ASSET_RE из dist/sw.js (единственный
 *      источник истины — сам поставляемый файл) и валидирует каждый путь.
 *      Несовпадение = FAIL сборки (жёсткий гард: «правило и реальность
 *      разъехались» должно падать на билде, а не в офлайне у игрока).
 *   3. Идемпотентно заменяет ВЕСЬ литерал PRECACHE_BUNDLE_URLS в dist/sw.js
 *      (не маркер — поэтому повторный прогон/--no-build безопасны).
 *
 * Подключён ПОСЛЕ vite build/prune во всех прод-пайплайнах:
 *   npm run build / build:vercel / build:full / archive:itch.
 *
 * Если dist/index.html не ссылается ни на один бандл (режим viteSingleFile
 * с инлайном) — это легитимный no-op с предупреждением: офлайн работает
 * сам HTML, ничего инъектировать не нужно.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const DIST = path.join(ROOT, 'dist');
const BUNDLE_EXT_RE = /\.(?:js|mjs|css)(?:[?#].*)?$/;
const ARRAY_RE = /const PRECACHE_BUNDLE_URLS = \[[^\]]*\];/;

/** Собрать same-origin пути бандлов из HTML (./assets/x → /assets/x). */
function collectBundleUrls(html) {
  const urls = new Set();
  const attrRe = /(?:src|href)\s*=\s*"([^"]+)"/g;
  let match;
  while ((match = attrRe.exec(html)) !== null) {
    let url = match[1];
    if (url.startsWith('./')) url = url.slice(1); // ./assets/x.js → /assets/x.js
    if (!url.startsWith('/') || url.startsWith('//')) continue; // data:, https:, фрагменты
    if (!BUNDLE_EXT_RE.test(url)) continue; // manifest.json, картинки и пр. — не бандлы
    urls.add(url.replace(/[?#].*$/, '')); // ключ кэша — чистый путь
  }
  return [...urls].sort();
}

/** Извлечь однострочный regex-литерал const NAME = /…/; из исходника SW. */
function extractRegexLiteral(swSource, constName) {
  const m = swSource.match(new RegExp(`const ${constName} = (\\/.+\\/);`));
  if (!m) throw new Error(`const ${constName} не найден в dist/sw.js (однострочный литерал ожидается)`);
  return new RegExp(m[1].slice(1, -1));
}

function main() {
  const htmlPath = path.join(DIST, 'index.html');
  const swPath = path.join(DIST, 'sw.js');
  if (!fs.existsSync(htmlPath)) {
    console.error('[inject-sw-precache] dist/index.html не найден — сначала vite build.');
    process.exit(1);
  }
  if (!fs.existsSync(swPath)) {
    console.error('[inject-sw-precache] dist/sw.js не найден — public/sw.js обязан попадать в сборку.');
    process.exit(1);
  }

  const sw = fs.readFileSync(swPath, 'utf8');
  const staticAssetRe = extractRegexLiteral(sw, 'STATIC_ASSET_RE');
  const bundles = collectBundleUrls(fs.readFileSync(htmlPath, 'utf8'));

  // Жёсткий гард: каждый бандл из HTML обязан попадать под cache-first
  // правило SW. Иначе — падение сборки (не молчаливый офлайн-баг).
  const mismatches = bundles.filter((url) => !staticAssetRe.test(url));
  if (mismatches.length > 0) {
    console.error(
      '[inject-sw-precache] BUILD GUARD FAILED — пути бандлов из dist/index.html ' +
        'не совпадают со STATIC_ASSET_RE (офлайн они бы никогда не закэшировались):',
    );
    for (const url of mismatches) console.error(`  - ${url}`);
    console.error('  Почини правило в public/sw.js ИЛИ схему именования в vite.config.');
    process.exit(1);
  }

  if (!ARRAY_RE.test(sw)) {
    console.error(
      '[inject-sw-precache] литерал PRECACHE_BUNDLE_URLS не найден в dist/sw.js — ' +
        'дрейф public/sw.js. Восстанови массив из public/sw.js.',
    );
    process.exit(1);
  }

  if (bundles.length === 0) {
    console.warn(
      '[inject-sw-precache] WARN: dist/index.html не ссылается ни на один JS/CSS бандл ' +
        '(viteSingleFile-инлайн?) — инъекция пустая, precache ограничен shell-списком.',
    );
  }

  const injection = bundles.map((url) => `  ${JSON.stringify(url)},`).join('\n');
  const nextSw = sw.replace(ARRAY_RE, `const PRECACHE_BUNDLE_URLS = [\n${injection}\n];`);
  fs.writeFileSync(swPath, nextSw, 'utf8');

  console.log(
    `[inject-sw-precache] OK: ${bundles.length} бандл(ов) прекэшировано и провалидировано против STATIC_ASSET_RE`,
  );
  for (const url of bundles) console.log(`  + ${url}`);
}

main();
