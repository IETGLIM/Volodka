#!/usr/bin/env node
/**
 * Creates a clean source archive for Vercel deploy / offline verification.
 * Excludes node_modules, dist, .git, secrets, and prior deploy zips.
 */
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'deploy-archive');

const EXCLUDE_DIRS = new Set([
  'node_modules',
  'dist',
  '.git',
  '.vercel',
  '.cursor',
  'deploy-archive',
  'examples',
  'upload',
  'test',
  'prompt',
  'skills',
  '.claude',
  'coverage',
  '.next',
  'out',
  'build',
]);

const EXCLUDE_FILES = new Set([
  '.DS_Store',
  'npm-debug.log',
  'yarn-debug.log',
  'yarn-error.log',
  'pnpm-debug.log',
  'server.log',
  'dev.log',
  'dev.out.log',
]);

const EXCLUDE_EXT = ['.tsbuildinfo', '.log'];
const EXCLUDE_PREFIX = ['.env', 'local-'];

function gitShortHash() {
  try {
    return execSync('git rev-parse --short HEAD', { cwd: ROOT, encoding: 'utf8' }).trim();
  } catch {
    return 'nogit';
  }
}

function shouldExclude(relPath, isDir) {
  const parts = relPath.split(/[/\\]/);
  if (parts.some((p) => EXCLUDE_DIRS.has(p))) return true;
  const base = path.basename(relPath);
  if (EXCLUDE_FILES.has(base)) return true;
  if (EXCLUDE_EXT.some((ext) => base.endsWith(ext))) return true;
  if (EXCLUDE_PREFIX.some((p) => base.startsWith(p))) return true;
  if (base.endsWith('.zip')) return true;
  if (!isDir && relPath.startsWith('deploy-archive' + path.sep)) return true;
  return false;
}

function copyTree(src, dest, rel = '') {
  let count = 0;
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const entryRel = rel ? `${rel}/${entry.name}` : entry.name;
    if (shouldExclude(entryRel, entry.isDirectory())) continue;
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      fs.mkdirSync(to, { recursive: true });
      count += copyTree(from, to, entryRel);
    } else {
      fs.mkdirSync(path.dirname(to), { recursive: true });
      fs.copyFileSync(from, to);
      count += 1;
    }
  }
  return count;
}

function writeDeployDocs(staging, meta) {
  const deployMd = `# Volodka RPG — деплой на Vercel

## Содержимое архива

Чистый исходный код (Vite + React + R3F), без \`node_modules\`, \`dist\`, \`.git\`, \`.vercel\`.

### В этой сборке

- Исправление подпрыгивания персонажа при первом нажатии WASD (ground lock, без gravity на полу)
- Open-world layer, perf budgets, content validation, lazy bundles
- Act 3 story spine, ТОЛПА / ЧК, 24+ NPC, accessibility

## Быстрый деплой

### Вариант A — Vercel CLI

\`\`\`bash
npm install -g vercel
cd volodka-rpg
npm install
npm run build
vercel          # preview
vercel --prod   # production
\`\`\`

### Вариант B — Vercel Dashboard

1. [vercel.com/new](https://vercel.com/new) → **Import**
2. Загрузите zip или подключите Git-репозиторий
3. Framework: **Vite** (или авто из \`vercel.json\`)
4. Build: \`npm run build\`, Output: \`dist\`

### Локальная проверка перед деплоем

\`\`\`bash
npm install
npm run build
npm run preview
\`\`\`

Откройте http://localhost:4173 — меню, новая игра, переход в 3D, диалог с NPC.

## Переменные окружения

Для этой SPA **не требуются** env vars на Vercel.

## Метаданные

- Дата: ${meta.createdAt}
- Git: ${meta.gitHash}
- Node: ${meta.nodeVersion}
- Файлов в архиве: ${meta.fileCount}
`;

  const manifest = `Volodka RPG — deploy archive manifest
=====================================
Created:    ${meta.createdAt}
Git hash:   ${meta.gitHash} (working tree snapshot)
Node:       ${meta.nodeVersion}
Zip name:   ${meta.zipName}
File count: ${meta.fileCount}

Verify locally:
  npm install && npm run build && npm run preview

Excluded:
  node_modules, dist, .git, .vercel, .cursor, .env*, *.tsbuildinfo, deploy-archive/*.zip
`;

  fs.writeFileSync(path.join(staging, 'DEPLOY-VERCEL.md'), deployMd, 'utf8');
  fs.writeFileSync(path.join(staging, 'ARCHIVE-MANIFEST.txt'), manifest, 'utf8');
}

async function main() {
  const hash = gitShortHash();
  const stamp = new Date().toISOString().replace(/[-:T.Z]/g, '').slice(0, 14);
  const zipName = `volodka-vercel-${stamp}-${hash}.zip`;
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const staging = path.join(process.env.TEMP || '/tmp', `volodka-deploy-${stamp}`);
  if (fs.existsSync(staging)) fs.rmSync(staging, { recursive: true, force: true });
  fs.mkdirSync(staging, { recursive: true });

  const fileCount = copyTree(ROOT, staging);
  const meta = {
    createdAt: new Date().toISOString(),
    gitHash: hash,
    nodeVersion: process.version,
    zipName,
    fileCount: fileCount + 2,
  };
  writeDeployDocs(staging, meta);

  const zipPath = path.join(OUT_DIR, zipName);
  if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);

  let packed = false;
  try {
    execSync(`tar -a -cf "${zipPath}" -C "${staging}" .`, { stdio: 'inherit' });
    packed = true;
  } catch {
    // tar unavailable or path issue — fall through
  }

  if (!packed) {
    const psStaging = staging.replace(/'/g, "''");
    const psZip = zipPath.replace(/'/g, "''");
    execSync(
      `powershell -NoProfile -Command "Compress-Archive -LiteralPath (Get-ChildItem -LiteralPath '${psStaging}' | ForEach-Object { $_.FullName }) -DestinationPath '${psZip}' -Force"`,
      { stdio: 'inherit' },
    );
  }

  fs.rmSync(staging, { recursive: true, force: true });

  const stat = fs.statSync(zipPath);
  const mb = (stat.size / (1024 * 1024)).toFixed(2);

  // Keep only 3 newest zips
  const zips = fs
    .readdirSync(OUT_DIR)
    .filter((f) => f.endsWith('.zip'))
    .map((f) => ({ f, m: fs.statSync(path.join(OUT_DIR, f)).mtimeMs }))
    .sort((a, b) => b.m - a.m);
  for (const old of zips.slice(3)) {
    fs.unlinkSync(path.join(OUT_DIR, old.f));
    console.log(`Removed old archive: ${old.f}`);
  }

  console.log('\nDeploy archive ready');
  console.log(`  Path:  ${zipPath}`);
  console.log(`  Size:  ${mb} MB`);
  console.log(`  Files: ${meta.fileCount}`);
  console.log(`  Git:   ${hash}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
