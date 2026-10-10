#!/usr/bin/env node
/**
 * v4.43.0 — create-itch-archive.mjs
 *
 * Собирает ЧИСТЫЙ, ГОТОВЫЙ, РАБОЧИЙ архив для itch.io (HTML5 upload).
 *
 * Почему отдельный скрипт (а не реюз create-deploy-archive.mjs):
 *   — тот скрипт пакует ИСХОДНИКИ для Vercel (npm install на месте);
 *   — itch.io принимает только готовый статик-бандл: zip, в КОРНЕ которого
 *     лежит index.html, все ассеты — относительные пути.
 *
 * Ключевое отличие от обычного билда: `--base=./` — относительные пути
 * вместо абсолютных `/assets/...`. На itch (html-classic.itch.zone/<hash>/)
 * абсолютный путь = 404 = чёрный экран. Это был главный блокер релиза.
 *
 * Пайплайн:
 *   1. vite build --base=./          (dist/)
 *   2. prune-deploy-assets.ts        (убрать недостижимые ассеты из public/)
 *   3. staging: dist/ + ITCH-README.txt + метаданные
 *   4. zip: index.html в корне архива
 *
 * Использование:
 *   npm run archive:itch             # полный цикл (build + prune + zip)
 *   node scripts/create-itch-archive.mjs --no-build   # переупаковать готовый dist/
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DIST = path.join(ROOT, 'dist');
const OUT_DIR = process.env.ITCH_ARCHIVE_DIR
  ? path.resolve(process.env.ITCH_ARCHIVE_DIR)
  : path.join(ROOT, 'itch-archive');

const args = new Set(process.argv.slice(2));
const SKIP_BUILD = args.has('--no-build');

function gitShortHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

function readVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
  return pkg.version || '0.0.0';
}

function assertRelativeBase() {
  const indexHtml = fs.readFileSync(path.join(DIST, 'index.html'), 'utf8');
  const absolute = indexHtml.match(/(?:src|href)="\/assets\//);
  if (absolute) {
    console.error(
      '\n[FAIL] dist/index.html содержит АБСОЛЮТНЫЕ пути (/assets/...).\n' +
        'На itch.io это даст 404 и чёрный экран.\n' +
        'Пересоберите с относительным base: npm run build:itch\n',
    );
    process.exit(1);
  }
  const relative = indexHtml.match(/(?:src|href)="\.\/assets\//);
  if (!relative) {
    console.warn('[WARN] не найдены ./assets/ ссылки — проверьте билд вручную.');
  } else {
    console.log('[OK] base относительный (./assets/...) — itch-совместимо.');
  }
}

function zipDir(staging, zipPath) {
  // Приоритет: системный zip → python zipfile → tar.gz (последний рубеж).
  try {
    execSync(`cd "${staging}" && zip -q -r -X "${zipPath}" .`, { stdio: 'inherit' });
    return 'zip';
  } catch { /* fall through */ }
  try {
    execSync(
      `python3 -c "import shutil; shutil.make_archive('${zipPath.replace(/\.zip$/, '')}', 'zip', '${staging}')"`,
      { stdio: 'inherit' },
    );
    return 'python';
  } catch { /* fall through */ }
  const tgz = zipPath.replace(/\.zip$/, '.tar.gz');
  execSync(`cd "${staging}" && tar -czf "${tgz}" .`, { stdio: 'inherit' });
  console.warn(`[WARN] zip недоступен — создан ${path.basename(tgz)} (itch принимает только zip, переупакуйте).`);
  return 'tar';
}

function writeItchReadme(staging, meta) {
  const txt = `ВОЛОДЬКА — сказка между сменами
3D-RPG в память о Владимире Лебедеве
=====================================================

Это готовая HTML5-сборка для itch.io.

КАК ОПУБЛИКОВАТЬ:
1. itch.io → Create new project → Kind of project: HTML
2. В секции Uploaded files загрузите этот zip ЦЕЛИКОМ
3. Поставьте галочку "This file will be played in the browser"
4. Viewport: рекомендуем 1280 x 720 (игра адаптируется и под меньшие)
5. Enable fullscreen — по вкусу (кнопка есть и в игре)

ТЕХНИЧЕСКИЕ ЗАМЕТКИ:
- Все пути относительные (./assets/...) — работает во вложенном iframe itch.
- WASM-физика (Rapier) грузится лениво, при старте новой игры.
- Сохранения — в localStorage браузера (в iframe itch живут в sandbox,
  очищаются вместе с данными сайта itch.io).
- AI-фичи (городские новости LLM) на статическом хостинге отключены
  автоматически — игра деградирует молча, без ошибок.
- Управление: WASD + E (взаимодействие) + Esc (пауза). Тач поддержан.

СБОРКА:
- Версия:  ${meta.version}
- Дата:    ${meta.createdAt}
- Git:     ${meta.gitHash}
- Node:    ${meta.nodeVersion}
`;
  fs.writeFileSync(path.join(staging, 'ITCH-README.txt'), txt, 'utf8');
}

async function main() {
  const hash = gitShortHash();
  const version = readVersion();

  if (!SKIP_BUILD) {
    console.log('\n[1/4] Production build (base=./ для itch.io)...');
    execSync('npx vite build --base=./', { cwd: ROOT, stdio: 'inherit' });
    console.log('\n[2/4] Prune deploy assets...');
    execSync('npx tsx --tsconfig tsconfig.json scripts/prune-deploy-assets.ts', { cwd: ROOT, stdio: 'inherit' });
  } else {
    console.log('\n[1-2/4] Пропущено (--no-build): использую готовый dist/');
  }

  if (!fs.existsSync(path.join(DIST, 'index.html'))) {
    console.error('[FAIL] dist/index.html не найден — сначала соберите.');
    process.exit(1);
  }
  assertRelativeBase();

  console.log('\n[3/4] Staging...');
  fs.mkdirSync(OUT_DIR, { recursive: true });
  const staging = path.join(OUT_DIR, '.staging');
  fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });
  execSync(`cp -a "${DIST}/." "${staging}/"`, { stdio: 'inherit' });

  const meta = {
    version,
    createdAt: new Date().toISOString(),
    gitHash: hash,
    nodeVersion: process.version,
  };
  writeItchReadme(staging, meta);

  console.log('\n[4/4] Zip...');
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 8);
  const zipName = `volodka-itch-v${version}-${stamp}-${hash}.zip`;
  const zipPath = path.join(OUT_DIR, zipName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
  zipDir(staging, zipPath);
  fs.rmSync(staging, { recursive: true, force: true });

  // держим только 3 последних архива
  const zips = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.zip'))
    .map((f) => ({ f, m: fs.statSync(path.join(OUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  for (const old of zips.slice(3)) {
    fs.unlinkSync(path.join(OUT_DIR, old.f));
    console.log(`Удалён старый архив: ${old.f}`);
  }

  const stat = fs.statSync(zipPath);
  const mb = (stat.size / (1024 * 1024)).toFixed(2);
  console.log('\n✓ Itch-архив готов');
  console.log(`  Путь:   ${zipPath}`);
  console.log(`  Размер: ${mb} MB`);
  console.log(`  Версия: v${version} (${hash})`);
  console.log('\nПроверка перед публикацией: распакуйте в подпапку и откройте');
  console.log('index.html через локальный сервер (npx serve) — симуляция itch-iframe.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
