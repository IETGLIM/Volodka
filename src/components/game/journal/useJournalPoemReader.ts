import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { POEMS } from '@/data/poems';
import { getPoemMargin } from '@/data/poemMargins';
import { POEM_TYPEWRITER_CHAR_DELAY_MS } from '@/engine/poetryBook/poetryBookConstants';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameStore } from '@/store/gameStore';
import { usePoemTypewriter } from '@/components/game/poetryBook/usePoemTypewriter';
import {
  resolveDefaultPoemViewMode,
  writeStoredPoemViewMode,
  type PoemViewMode,
} from '@/components/game/poetryBook/poemViewMode';

/** Stable empty array — avoids creating a new [] on every render.
 * См. usePoetryBookController: без стабилизации usePoemTypewriter уходит
 * в бесконечный цикл (React error #185). */
const EMPTY_LINES: string[] = [];

export interface JournalPoemReaderInput {
  /** Выбранный стих вкладки «Стихи» (id) либо null — список. */
  selectedPoemId: string | null;
  /** Селектор/сеттер выделения из PoemsTab (грид-клик несёт телеметрию журнала). */
  selectPoem: (poemId: string | null) => void;
}

/* ─── Хост-хук разворота «Ночной тетради» во вкладке «Стихи» журнала (v4.48.10) ───
 * Полный usePoetryBookController переиспользовать нельзя: он привязан к
 * открытому состоянию панели «Собрание стихов» (сброс выделения при закрытии,
 * табы «Способности», onClose). Здесь — те же КУСКИ чтения (машинописец,
 * заметка на полях, пейджер по собранным, разделяемый вид 'spread'|'scroll'),
 * но поверх локального выделения PoemsTab. Панель журнала даёт ширину и высоту
 * развороту, PoemSpreadView рисует сам разворот без знаний о хозяине.
 */
export function useJournalPoemReader({ selectedPoemId, selectPoem }: JournalPoemReaderInput) {
  const reducedMotion = useEffectiveReducedMotion();
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const playerKarma = useGameStore((s) => s.playerState.karma);
  const playerFlags = useGameStore((s) => s.playerState.flags);
  const currentAct = useGameStore((s) => s.playerState.progression.currentAct);

  // Вид чтения РАЗДЕЛЯЕТСЯ с «Собранием стихов» (один localStorage-ключ):
  // игрок один раз выбирает разворот — журнал и панель показывают одинаково.
  const [viewMode, setViewMode] = useState<PoemViewMode>(() => resolveDefaultPoemViewMode());
  const contentRef = useRef<HTMLDivElement>(null);

  // Пейджер листает только СОБРАННЫЕ стихи (семантика «Собрания стихов»).
  const collected = useMemo(
    () => POEMS.filter((poem) => collectedPoems.includes(poem.id)),
    [collectedPoems],
  );

  const selectedPoem = useMemo(
    () => POEMS.find((poem) => poem.id === selectedPoemId) ?? null,
    [selectedPoemId],
  );

  const marginNote = useMemo(() => {
    if (!selectedPoem) return undefined;
    return getPoemMargin(selectedPoem.id, {
      karma: playerKarma,
      flags: playerFlags,
      currentAct,
    });
  }, [selectedPoem, playerKarma, playerFlags, currentAct]);

  const typewriterLines = useMemo(
    () => selectedPoem?.lines ?? EMPTY_LINES,
    [selectedPoem],
  );

  const { displayedLines, done, skipAll } = usePoemTypewriter(
    typewriterLines,
    selectedPoemId !== null,
    reducedMotion,
    POEM_TYPEWRITER_CHAR_DELAY_MS,
  );

  const currentPoemIndex = selectedPoemId
    ? collected.findIndex((poem) => poem.id === selectedPoemId)
    : -1;
  const pageNumber = currentPoemIndex >= 0 ? currentPoemIndex + 1 : 0;
  const totalPages = collected.length;

  const handleBack = useCallback(() => {
    selectPoem(null);
  }, [selectPoem]);

  const handlePrevPoem = useCallback(() => {
    if (currentPoemIndex > 0) {
      selectPoem(collected[currentPoemIndex - 1]!.id);
    }
  }, [collected, currentPoemIndex, selectPoem]);

  const handleNextPoem = useCallback(() => {
    if (currentPoemIndex < collected.length - 1) {
      selectPoem(collected[currentPoemIndex + 1]!.id);
    }
  }, [collected, currentPoemIndex, selectPoem]);

  const handleToggleViewMode = useCallback(() => {
    setViewMode((prev) => {
      const next: PoemViewMode = prev === 'spread' ? 'scroll' : 'spread';
      writeStoredPoemViewMode(next);
      return next;
    });
  }, []);

  // Фокус на контейнер разворота при выборе стиха — клавиатурный скип
  // машинописца (Enter/Space) работает сразу после клика по карточке.
  useEffect(() => {
    if (selectedPoemId === null) return;
    contentRef.current?.focus();
  }, [selectedPoemId]);

  return {
    reducedMotion,
    viewMode,
    handleToggleViewMode,
    selectedPoem,
    displayedLines,
    done,
    skipAll,
    marginNote,
    pageNumber,
    totalPages,
    currentPoemIndex,
    contentRef,
    handleBack,
    handlePrevPoem,
    handleNextPoem,
  };
}

export type JournalPoemReader = ReturnType<typeof useJournalPoemReader>;
