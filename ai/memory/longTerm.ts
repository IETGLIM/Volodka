// ============================================
// LONG-TERM MEMORY
// ============================================
// Персистентная память с векторным поиском.
// Хранит ключевые решения, архитектурные паттерны,
// сюжетные повороты, технические решения.
// Использует простую эвристику для "похожести" (без внешних эмбеддингов).

import type { MemoryEntry } from '../agents/types';

const MAX_LONG_TERM = 200;

interface LongTermEntry extends MemoryEntry {
  /** Векторное представление (упрощённое — TF-IDF на словах) */
  vector: Map<string, number>;
  /** Важность (0-1) — влияет на приоритет при поиске */
  importance: number;
}

let longTermMemory: LongTermEntry[] = [];

// ============================================
// ВЕКТОРИЗАЦИЯ (упрощённая TF-IDF)
// ============================================

/** Токенизация и нормализация текста */
function tokenize(text: string): string[] {
  const stopWords = new Set([
    'и', 'в', 'на', 'с', 'что', 'это', 'как', 'не', 'по', 'к',
    'но', 'за', 'от', 'до', 'из', 'а', 'то', 'о', 'для', 'бы',
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would',
  ]);

  return text
    .toLowerCase()
    .replace(/[^\wа-яё]/gi, ' ')
    .split(/\s+/)
    .filter(w => w.length > 2 && !stopWords.has(w));
}

/** Создать TF-вектор из текста */
function createVector(text: string): Map<string, number> {
  const tokens = tokenize(text);
  const freq = new Map<string, number>();

  for (const token of tokens) {
    freq.set(token, (freq.get(token) || 0) + 1);
  }

  // Нормализуем
  const total = tokens.length || 1;
  for (const [key, val] of freq) {
    freq.set(key, val / total);
  }

  return freq;
}

/** Косинусное сходство между двумя TF-векторами */
function cosineSimilarity(a: Map<string, number>, b: Map<string, number>): number {
  const allKeys = new Set([...a.keys(), ...b.keys()]);
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (const key of allKeys) {
    const va = a.get(key) || 0;
    const vb = b.get(key) || 0;
    dotProduct += va * vb;
    normA += va * va;
    normB += vb * vb;
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// ============================================
// API
// ============================================

/** Добавить запись в долгосрочную память */
export function addLongTerm(
  entry: Omit<MemoryEntry, 'timestamp'>,
  importance: number = 0.5
): void {
  const fullEntry: LongTermEntry = {
    ...entry,
    timestamp: Date.now(),
    importance,
    vector: createVector(entry.content),
  };

  longTermMemory.push(fullEntry);

  // Обрезаем — удаляем наименее важные
  if (longTermMemory.length > MAX_LONG_TERM) {
    longTermMemory.sort((a, b) => b.importance - a.importance);
    longTermMemory = longTermMemory.slice(0, MAX_LONG_TERM);
  }
}

/** Поиск по сходству — возвращает top-K записей */
export function similaritySearch(query: string, topK: number = 5): MemoryEntry[] {
  const queryVector = createVector(query);

  const scored = longTermMemory.map(entry => ({
    entry,
    score: cosineSimilarity(queryVector, entry.vector) * (0.5 + entry.importance * 0.5),
  }));

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, topK).map(s => ({
    role: s.entry.role,
    agentName: s.entry.agentName,
    content: s.entry.content,
    timestamp: s.entry.timestamp,
    tags: s.entry.tags,
  }));
}

/** Получить все записи долгосрочной памяти */
export function getLongTermMemory(): MemoryEntry[] {
  return longTermMemory.map(({ vector, importance, ...rest }) => rest);
}

/** Очистить долгосрочную память */
export function clearLongTermMemory(): void {
  longTermMemory = [];
}

/** Построить контекст из долгосрочной памяти по запросу */
export function buildLongTermContext(query: string, topK: number = 3): string {
  const results = similaritySearch(query, topK);

  if (results.length === 0) return '';

  return results
    .map(e => `[${e.role}${e.agentName ? `:${e.agentName}` : ''}]: ${e.content.slice(0, 300)}`)
    .join('\n');
}

/** Сохранить долгосрочную память в JSON (для персистентности) */
export function exportLongTermMemory(): string {
  return JSON.stringify(
    longTermMemory.map(({ vector, ...rest }) => rest),
    null,
    2
  );
}

/** Загрузить долгосрочную память из JSON */
export function importLongTermMemory(json: string): void {
  try {
    const entries = JSON.parse(json) as Array<Omit<LongTermEntry, 'vector'>>;
    longTermMemory = entries.map(entry => ({
      ...entry,
      vector: createVector(entry.content),
    }));
  } catch {
    console.error('[LongTermMemory] Failed to import memory');
  }
}
