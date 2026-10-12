import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  POETRY_READ_CHANGED_EVENT,
  notifyPoemReadChanged,
  readStoredPoemReadIds,
  withPoemMarkedRead,
  writeStoredPoemReadIds,
} from '@/components/game/poetryBook/poemReadProgress';

/* ─── Volodka RPG – хук прогресса чтения стихов (v4.48.11) ───
 * Единый источник отметок «прочитано» для панели «Собрание стихов» и
 * журнальной вкладки «Стихи»: состояние в localStorage, синхронизация
 * инстансов на странице через CustomEvent (и 'storage' для соседних вкладок).
 * Отметка идемпотентна: повторный вызов не пишет storage и не рассылает
 * события (нет лишних ре-рендеров второго инстанса).
 */
export function usePoetryReadProgress() {
  const [readPoemIds, setReadPoemIds] = useState<string[]>(() => readStoredPoemReadIds());

  // Зеркало для идемпотентности без зависимости от очереди рендеров:
  // markPoemRead может зваться из эффектов, где стейт ещё не обновился.
  const readRef = useRef<string[]>(readPoemIds);

  const applyIds = useCallback((next: string[]) => {
    readRef.current = next;
    setReadPoemIds(next);
  }, []);

  // Синхронизация: другой инстанс хука отметил стих (панель ↔ журнал),
  // либо изменился storage из соседней вкладки браузера.
  useEffect(() => {
    const sync = () => applyIds(readStoredPoemReadIds());
    window.addEventListener(POETRY_READ_CHANGED_EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(POETRY_READ_CHANGED_EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, [applyIds]);

  const markPoemRead = useCallback((poemId: string) => {
    if (readRef.current.includes(poemId)) return;
    const next = withPoemMarkedRead(readRef.current, poemId);
    writeStoredPoemReadIds(next);
    applyIds(next);
    notifyPoemReadChanged();
  }, [applyIds]);

  const readSet = useMemo(() => new Set(readPoemIds), [readPoemIds]);
  const readPoemsCount = readSet.size;

  return { readPoemIds: readSet, readPoemsCount, markPoemRead };
}

export type PoetryReadProgress = ReturnType<typeof usePoetryReadProgress>;
