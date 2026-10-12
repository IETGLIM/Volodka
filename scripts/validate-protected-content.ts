#!/usr/bin/env npx tsx
/**
 * ЗАЩИТА АВТОРСКОГО КОНТЕНТА «ВОЛОДЬКИ» (v4.48.0)
 *
 * Неизменяемые вещи по воле автора:
 *   1. Стихи Владимира Лебедева (src/data/poems.ts) — ритм, рифма, лексика.
 *   2. Имена персонажей (Володька, Зорге, Умка, Солныш, Ру, Басед...).
 *
 * Скрипт держит hash-снапшот каждого стиха и список канонических имён.
 * Любое изменение текста стиха или исчезновение имени из контентных данных
 * роняет валидацию ДО деплоя.
 *
 * Легитимное обновление снапшота (например, автор сам написал новый стих):
 *   npx tsx --tsconfig tsconfig.json scripts/validate-protected-content.ts --update
 * — и осознанный коммит изменённого protected-content.snapshot.json.
 *
 * Usage: npm run validate:protected
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { POEMS } from '../src/data/poems.ts';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SNAPSHOT_PATH = join(__dirname, 'protected-content.snapshot.json');
const DATA_DIR = join(__dirname, '..', 'src', 'data');

/* Канонические имена. Изменение списка — только осознанным правком
 * снапшота вместе с отчётом автору. Зорге (место) и Умка (собака)
 * не в NPC-реестрах — проверяем присутствием в контентных файлах. */
const CANONICAL_NAMES = [
  'Володька',
  'Альберт',
  'Зарема',
  'Мария',
  'Кира',
  'Дмитрий',
  'Виктор',
  'Борис',
  'Тамара',
  'Гриша',
  'Солныш',
  'Умка',
  'Зорге',
  'Трофим',
  'Элис',
  'Ру',
  'Басед',
  'Смерть',
  'Сталкер',
  'Ритка',
  'Баба Зина',
] as const;

function poemFingerprint(p: { id: string; title: string; author: string; lines: readonly string[] }): string {
  const canonical = [p.id, p.title, p.author, ...p.lines].join('\n');
  return createHash('sha256').update(canonical, 'utf8').digest('hex');
}

/* Рекурсивный обход src/data + story texts (JSON) — где живут имена. */
function collectTextFiles(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '__pycache__') continue;
      collectTextFiles(full, out);
    } else if (/\.(ts|json)$/.test(name)) {
      out.push(full);
    }
  }
  return out;
}

type Snapshot = { poems: Record<string, string>; names: string[]; generatedAt: string };

function main(): void {
  const updateMode = process.argv.includes('--update');

  if (updateMode) {
    const poems: Record<string, string> = {};
    for (const p of POEMS) poems[p.id] = poemFingerprint(p);
    const snapshot: Snapshot = {
      poems,
      names: [...CANONICAL_NAMES],
      generatedAt: new Date().toISOString(),
    };
    writeFileSync(SNAPSHOT_PATH, JSON.stringify(snapshot, null, 2) + '\n', 'utf8');
    console.log(`protected-content.snapshot.json обновлён: ${POEMS.length} стихов, ${snapshot.names.length} имён`);
    process.exit(0);
  }

  if (!existsSync(SNAPSHOT_PATH)) {
    console.error('[protected] Снапшот не найден. Сгенерируйте: npm run validate:protected -- --update');
    process.exit(1);
  }
  const snapshot = JSON.parse(readFileSync(SNAPSHOT_PATH, 'utf8')) as Snapshot;

  const errors: string[] = [];

  /* 1. Стихи: hash-контроль. */
  const byId = new Map(POEMS.map((p) => [p.id, p]));
  for (const [id, expectedHash] of Object.entries(snapshot.poems)) {
    const poem = byId.get(id);
    if (!poem) {
      errors.push(`стих ${id} ИСЧЕЗ из poems.ts — это запрещено`);
      continue;
    }
    const actual = poemFingerprint(poem);
    if (actual !== expectedHash) {
      errors.push(
        `стих ${id} («${poem.title}») ИЗМЕНЁН — тексты Владимира Лебедева неприкосновенны. Откатите правку или получите явное согласие автора и обновите снапшот.`,
      );
    }
  }
  for (const p of POEMS) {
    if (!(p.id in snapshot.poems)) {
      console.log(`[protected] новый стих без снапшота: ${p.id} («${p.title}») — обновите снапшот (--update)`);
    }
  }

  /* 2. Имена: каждое каноническое имя должно встречаться в контентных данных. */
  const dataFiles = collectTextFiles(DATA_DIR);
  let corpus = '';
  for (const f of dataFiles) corpus += readFileSync(f, 'utf8');
  // Story texts лежат отдельным пакетом JSON.
  const storyTextsDir = join(__dirname, '..', 'src', 'data', 'story', 'texts');
  if (existsSync(storyTextsDir)) {
    for (const f of collectTextFiles(storyTextsDir)) corpus += readFileSync(f, 'utf8');
  }
  for (const name of snapshot.names) {
    if (!corpus.includes(name)) {
      errors.push(`каноническое имя «${name}» больше не встречается в контентных данных — переименование персонажей запрещено`);
    }
  }

  if (errors.length > 0) {
    console.error(`\n[protected] НАРУШЕНИЯ АВТОРСКОГО КОНТЕНТА (${errors.length}):`);
    for (const e of errors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log(`Protected content: OK (${Object.keys(snapshot.poems).length} стихов целы, ${snapshot.names.length} имён на месте)`);
}

main();
