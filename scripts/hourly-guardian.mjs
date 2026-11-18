#!/usr/bin/env node
/**
 * HOURLY GUARDIAN — детерминированный почасовой агент доработки Volodka.
 *
 * Это НЕ LLM-агент, а строгий детерминированный скрипт: он выполняет
 * безопасный подмножество контракта docs/HOURLY_IMPROVEMENT.md, которое
 * не требует творческих решений:
 *
 *   1. Синхронизация с origin/main (если сеть доступна).
 *   2. Health-чек: npm ci при необходимости, lint, typecheck, validate:protected,
 *      validate:content, полный vitest.
 *   3. Авто-ремонт узкого класса проблем (eslint --fix, prefer-const и т.п.).
 *   4. Проверка неприкосновенности стихов (гейт validate:protected).
 *   5. Отчёт в docs/HOURLY_LOG.md + атомарный коммит, если что-то изменилось.
 *   6. Push, если есть доступ (GITHUB_TOKEN / credentials).
 *
 * Творческие задачи (P1–P3 из HOURLY_IMPROVEMENT.md) выполняет LLM-сессия
 * (cron-инструмент этой песочницы или GitHub Actions с агентом) — скрипт
 * лишь держит репозиторий зелёным между сессиями.
 *
 * Usage: node scripts/hourly-guardian.mjs [--dry-run] [--skip-install]
 * Exit codes: 0 — зелёно/починено; 1 — требует внимания (запись в LOG).
 */
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const DRY_RUN = process.argv.includes('--dry-run');
const SKIP_INSTALL = process.argv.includes('--skip-install');

const log = (msg) => console.log(`[guardian] ${msg}`);
const now = () => new Date();

function run(cmd, args, opts = {}) {
  try {
    const out = execFileSync(cmd, args, {
      cwd: ROOT,
      encoding: 'utf8',
      timeout: opts.timeout ?? 15 * 60 * 1000,
      stdio: ['ignore', 'pipe', 'pipe'],
      ...opts,
    });
    return { ok: true, out: String(out) };
  } catch (err) {
    return { ok: false, out: String(err.stdout ?? '') + String(err.stderr ?? '') };
  }
}

function git(args, opts = {}) {
  return run('git', args, opts);
}

/* ── 1. Синхронизация ─────────────────────────────────────────── */
function sync() {
  const fetch = git(['fetch', 'origin', 'main'], { timeout: 60_000 });
  if (!fetch.ok) {
    log('сеть/origin недоступны — работаю с локальным main');
    return;
  }
  // БЕЗОПАСНАЯ синхронизация: только fast-forward. reset --hard ЗАПРЕЩЁН —
  // он уничтожил бы локальные коммиты при недоступном push (урок 2026-11-18).
  const ff = git(['merge', '--ff-only', 'origin/main']);
  if (ff.ok) {
    log('fast-forward до origin/main (локальные коммиты сохранены)');
  } else {
    log('origin/main разошёлся с локальным main — остаюсь на локальном, слияние не выполняю');
  }
}

/* ── 2. Установка при необходимости ───────────────────────────── */
function ensureDeps() {
  if (SKIP_INSTALL) return;
  if (!existsSync(path.join(ROOT, 'node_modules', '.bin', 'vitest'))) {
    log('node_modules неполный — npm ci');
    const ci = run('npm', ['ci', '--no-audit', '--no-fund'], { timeout: 20 * 60 * 1000 });
    if (!ci.ok) throw new Error('npm ci провалился');
  }
}

/* ── 3. Health-чек ────────────────────────────────────────────── */
/* Абсолютный эталон неприкосновенности: SHA-256 файла стихов.
 * Снят с бэкапа автора 2026-11-18 (download/volodka-poems-protected). */
const POEMS_SHA256 = '6d95924da1651f6c18db8a05f3e5431486763fd8d2c29a24e4b84730c41c4c88';

function health() {
  const steps = [];

  // Слой 0 — независимая проверка стихов ДО любых действий.
  const poemHashNow = run('node', ['-e',
    "const{createHash}=require('node:crypto');const s=require('fs').readFileSync('src/data/poems.ts');console.log(createHash('sha256').update(s).digest('hex'))"]);
  if (!poemHashNow.ok || poemHashNow.out.trim() !== POEMS_SHA256) {
    git(['checkout', '--', 'src/data/poems.ts']);
    throw new Error('СТИХИ ИЗМЕНЕНЫ — откат poems.ts и стоп сессии (эталон SHA-256 не совпал)');
  }
  steps.push(['poems sha256', true]);

  const protectedCheck = run('npm', ['run', 'validate:protected']);
  steps.push(['validate:protected', protectedCheck.ok]);
  if (!protectedCheck.ok) {
    // НЕПРИКОСНОВЕННОСТЬ НАРУШЕНА — откат всего и стоп.
    log('!!! validate:protected ПРОВАЛЕН — откат рабочих изменений');
    git(['checkout', '--', '.']);
    throw new Error('ЗАЩИТА АВТОРСКОГО КОНТЕНТА: снапшот стихов/имён не совпал');
  }

  const lintFix = run('npx', ['eslint', 'src', '--fix']);
  const typecheck = run('npm', ['run', 'typecheck']);
  steps.push(['typecheck', typecheck.ok]);

  const content = run('npm', ['run', 'validate:content']);
  steps.push(['validate:content', content.ok]);

  const tests = run('npm', ['run', 'test:unit'], { timeout: 30 * 60 * 1000 });
  steps.push(['vitest', tests.ok]);

  return {
    steps,
    lintFixed: lintFix.ok,
    poemHash: poemHashNow.out.trim(),
    testsOut: tests.out,
  };
}

/* ── 4. Коммит и отчёт ────────────────────────────────────────── */
function hasChanges() {
  const r = git(['status', '--porcelain']);
  return r.ok && r.out.trim().length > 0;
}

function writeLogEntry(status, details) {
  const logPath = path.join(ROOT, 'docs', 'HOURLY_LOG.md');
  const stamp = now().toISOString().slice(0, 16).replace('T', ' ');
  const sha = git(['rev-parse', '--short', 'HEAD']).out.trim();
  const entry = `## Сессия ${stamp} UTC (guardian, ${sha}) — ${status}\n` +
    `- Проверки: ${details.steps.map(([n, ok]) => `${n}=${ok ? 'OK' : 'FAIL'}`).join(', ')}\n` +
    (details.lintFixed ? '- eslint --fix применён\n' : '') +
    `- poems.ts sha256: ${details.poemHash}\n` +
    `- Дальше: см. docs/HOURLY_IMPROVEMENT.md §3\n\n`;
  const prev = existsSync(logPath) ? readFileSync(logPath, 'utf8') : '';
  const headEnd = prev.indexOf('## Сессия');
  const header = headEnd === -1 ? prev : prev.slice(0, headEnd);
  writeFileSync(logPath, header + entry + (headEnd === -1 ? '' : prev.slice(headEnd)), 'utf8');
}

function commitIfNeeded() {
  if (!hasChanges()) {
    log('изменений нет — репозиторий зелёный');
    return null;
  }
  const stamp = now().toISOString().slice(0, 10);
  git(['add', '-A']);
  const msg = `chore(guardian): ${stamp} — ежечасный health-чек${''}`;
  git(['commit', '-m', msg]);
  const sha = git(['rev-parse', '--short', 'HEAD']).out.trim();
  log(`коммит ${sha}`);
  const push = git(['push', 'origin', 'main'], { timeout: 120_000 });
  log(push.ok ? 'push OK' : 'push недоступен (нет токена) — коммит локальный');
  return sha;
}

/* ── main ─────────────────────────────────────────────────────── */
function main() {
  log(`старт ${now().toISOString()}${DRY_RUN ? ' (dry-run)' : ''}`);
  sync();
  ensureDeps();
  const h = health();
  const allOk = h.steps.every(([, ok]) => ok);
  if (DRY_RUN) {
    log('dry-run: изменения не коммичу');
    log(JSON.stringify(h.steps));
    process.exit(allOk ? 0 : 1);
  }
  writeLogEntry(allOk ? 'зелёный прогон' : 'ТРЕБУЕТ ВНИМАНИЯ', h);
  const sha = commitIfNeeded();
  log(allOk ? 'итог: зелёный' : 'итог: есть красные шаги — см. HOURLY_LOG.md');
  process.exit(allOk ? 0 : 1);
}

try {
  main();
} catch (err) {
  console.error(`[guardian] ФАТАЛЬНО: ${err.message}`);
  process.exit(1);
}
