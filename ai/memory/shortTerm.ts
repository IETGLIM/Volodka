// ============================================
// SHORT-TERM MEMORY
// ============================================
// Контекст последних взаимодействий с агентами.
// Хранится в оперативной памяти, ограничен по размеру.
// Используется для контекстного объединения.

import type { MemoryEntry } from '../agents/types';

const MAX_SHORT_TERM = 20; // Максимум записей в короткой памяти

let shortTermMemory: MemoryEntry[] = [];

/** Добавить запись в короткую память */
export function addShortTerm(entry: Omit<MemoryEntry, 'timestamp'>): void {
  shortTermMemory.push({
    ...entry,
    timestamp: Date.now(),
  });

  // Обрезаем, если превышен лимит
  if (shortTermMemory.length > MAX_SHORT_TERM) {
    shortTermMemory = shortTermMemory.slice(-MAX_SHORT_TERM);
  }
}

/** Получить все записи короткой памяти */
export function getShortTermMemory(): MemoryEntry[] {
  return [...shortTermMemory];
}

/** Получить последние N записей */
export function getRecentShortTerm(count: number): MemoryEntry[] {
  return shortTermMemory.slice(-count);
}

/** Очистить короткую память */
export function clearShortTermMemory(): void {
  shortTermMemory = [];
}

/** Построить контекст из короткой памяти для передачи агенту */
export function buildShortTermContext(tags?: string[], limit: number = 5): string {
  let entries = shortTermMemory;

  // Фильтруем по тегам, если указаны
  if (tags && tags.length > 0) {
    entries = entries.filter(e =>
      e.tags?.some(t => tags.includes(t))
    );
  }

  // Берём последние N записей
  const recent = entries.slice(-limit);

  if (recent.length === 0) return '';

  return recent
    .map(e => `[${e.role}${e.agentName ? `:${e.agentName}` : ''}]: ${e.content}`)
    .join('\n');
}
