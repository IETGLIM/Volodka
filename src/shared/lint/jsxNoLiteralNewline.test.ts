import { describe, expect, it } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

/* ─── Регресс-тест этапа 85 (v4.23): литеральные «\n» в JSX-тексте ───
 *
 * Баг-происхождение (v4.22, NpcScheduleDisplay.tsx:316): скриптовая
 * склейка заменила реальный перенос строки на escape-последовательность
 * `\n` прямо в JSX-тексте. JSX не интерпретирует escape-последовательности:
 * узел содержит непробельные символы («\» и «n»), поэтому React печатает
 * буквальный «\n» на экране.
 *
 * Этот сканер обходит все .tsx-файлы src/ и флагует литеральные
 * backslash-n ВНЕ строковых литералов в JSX-позиции (после «>»/«}» или
 * в начале строки после тега). Внутри строк ('\n', шаблоны) — легитимно
 * и игнорируется; регексы и комментарии не флагуются.
 */

function walkTsx(dir: string, out: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules' || name === '__pycache__') continue;
      walkTsx(full, out);
    } else if (name.endsWith('.tsx')) {
      out.push(full);
    }
  }
  return out;
}

/** Префикс до совпадения находится внутри строкового литерала? */
function isInsideString(prefix: string): boolean {
  let inString = false;
  let quoteChar = '';
  for (let i = 0; i < prefix.length; i++) {
    const ch = prefix[i];
    if (inString) {
      if (ch === '\\') {
        i++; // экранированный символ внутри строки
        continue;
      }
      if (ch === quoteChar) inString = false;
    } else if (ch === '"' || ch === "'" || ch === '`') {
      inString = true;
      quoteChar = ch;
    } else if (ch === '/' && prefix[i + 1] === '/') {
      return true; // хвостовой комментарий — дальше не код
    }
  }
  return inString;
}

function findSuspiciousLines(source: string): number[] {
  const lines = source.split('\n');
  const flagged: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    if (trimmed.startsWith('//') || trimmed.startsWith('*') || trimmed.startsWith('/*')) {
      continue; // строки комментариев целиком
    }

    let from = 0;
    for (;;) {
      const idx = line.indexOf('\\n', from);
      if (idx === -1) break;
      from = idx + 2;

      const prefix = line.slice(0, idx);
      if (isInsideString(prefix)) continue;

      // JSX-текстовая позиция: перед литералом (через пробелы) — граница
      // тега/выражения («>» или «}»), либо литерал стоит в начале строки,
      // а предыдущая строка заканчивается тегом (классический разрыв).
      const before = prefix.replace(/[ \t]+$/, '');
      const prevChar = before.length > 0 ? before[before.length - 1] : '';
      const prevLine = i > 0 ? lines[i - 1].trimEnd() : '';
      const jsxBoundary =
        prevChar === '>' ||
        prevChar === '}' ||
        (before.length === 0 && />$/.test(prevLine));

      if (jsxBoundary) {
        flagged.push(i + 1);
      }
    }
  }

  return flagged;
}

describe('регресс: литеральные «\\n» в JSX-тексте (этап 85)', () => {
  it('в .tsx-файлах src/ нет литеральных backslash-n в JSX-позиции', () => {
    const srcRoot = join(__dirname, '..', '..');
    const files = walkTsx(srcRoot);
    expect(files.length).toBeGreaterThan(400); // сканер реально обходит дерево

    const offenders: string[] = [];
    for (const file of files) {
      const source = readFileSync(file, 'utf8');
      for (const line of findSuspiciousLines(source)) {
        offenders.push(`${file}:${line}`);
      }
    }

    expect(offenders).toEqual([]);
  });
});
