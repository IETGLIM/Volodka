// ============================================
// MEMORY INDEX — Единый экспорт + комбинированный API
// ============================================

export {
  addShortTerm,
  getShortTermMemory,
  getRecentShortTerm,
  clearShortTermMemory,
  buildShortTermContext,
} from './shortTerm';

export {
  addLongTerm,
  similaritySearch,
  getLongTermMemory,
  clearLongTermMemory,
  buildLongTermContext,
  exportLongTermMemory,
  importLongTermMemory,
} from './longTerm';

import { addShortTerm, getShortTermMemory, buildShortTermContext } from './shortTerm';
import { addLongTerm, similaritySearch, buildLongTermContext } from './longTerm';
import type { MemoryEntry, MemoryState } from '../agents/types';

/** Получить полное состояние памяти */
export function getFullMemoryState(): MemoryState {
  return {
    shortTerm: getShortTermMemory(),
    longTerm: similaritySearch('', 50), // Получаем самые важные записи
  };
}

/** Сохранить результат агента в память */
export function saveAgentResultToMemory(
  agentName: string,
  content: string,
  tags: string[] = [],
  importance: number = 0.5
): void {
  // В короткую — полностью
  addShortTerm({
    role: 'agent',
    agentName,
    content,
    tags,
  });

  // В долгосрочную — саммари (первые 300 символов) с оценкой важности
  addLongTerm(
    {
      role: 'agent',
      agentName,
      content: content.slice(0, 300),
      tags,
    },
    importance
  );
}

/** Построить контекст для агента из обоих типов памяти */
export function buildFullContext(query: string, tags?: string[]): string {
  const shortContext = buildShortTermContext(tags, 3);
  const longContext = buildLongTermContext(query, 3);

  const parts: string[] = [];
  if (longContext) parts.push(`[Долгосрочная память]:\n${longContext}`);
  if (shortContext) parts.push(`[Недавние решения]:\n${shortContext}`);

  return parts.join('\n\n');
}
