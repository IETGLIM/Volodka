import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { POEMS } from '@/data/poems';
import { getPoemMargin } from '@/data/poemMargins';
import type { PoetryBookTab } from '@/engine/poetryBook/poetryBookConstants';
import { POEM_TYPEWRITER_CHAR_DELAY_MS } from '@/engine/poetryBook/poetryBookConstants';
import { getAllPoemPowers, getPoemPower } from '@/engine/PoemPowerSystem';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGameStore } from '@/store/gameStore';
import { usePoemTypewriter } from '@/components/game/poetryBook/usePoemTypewriter';

/** Stable empty array — avoids creating a new [] on every render. */
const EMPTY_LINES: string[] = [];

export function usePoetryBookController(open: boolean, onClose: () => void) {
  const reducedMotion = useEffectiveReducedMotion();
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const playerKarma = useGameStore((s) => s.playerState.karma);
  const playerFlags = useGameStore((s) => s.playerState.flags);
  const currentAct = useGameStore((s) => s.playerState.progression.currentAct);

  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [pageDirection, setPageDirection] = useState(0);
  const [activeTab, setActiveTab] = useState<PoetryBookTab>('poems');
  const contentRef = useRef<HTMLDivElement>(null);

  const collected = useMemo(
    () => POEMS.filter((poem) => collectedPoems.includes(poem.id)),
    [collectedPoems],
  );
  const collectedMain = useMemo(
    () => collected.filter((poem) => !poem.bonus),
    [collected],
  );
  const collectedHidden = useMemo(
    () => collected.filter((poem) => poem.bonus),
    [collected],
  );
  const totalPoems = POEMS.length;
  const collectedCount = collected.length;

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

  // Memoize the lines array so its identity is stable when selectedPoem is null.
  // Without this, `selectedPoem?.lines ?? []` creates a new [] every render,
  // which triggers usePoemTypewriter's useEffect (deps: [lines, ...]) every
  // frame → setDisplayedLines([]) → re-render → new [] → infinite loop
  // (React error #185: Maximum update depth exceeded).
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

  const collectedPowersCount = useMemo(
    () => collectedPoems.filter((id) => getPoemPower(id) !== undefined).length,
    [collectedPoems],
  );

  const totalPowerCount = getAllPoemPowers().length;

  const handleClose = useCallback(() => {
    setSelectedPoemId(null);
    setActiveTab('poems');
    onClose();
  }, [onClose]);

  const handleBack = useCallback(() => {
    setPageDirection(-1);
    setSelectedPoemId(null);
  }, []);

  const handleSelectPoem = useCallback((poemId: string) => {
    setPageDirection(1);
    setSelectedPoemId(poemId);
  }, []);

  const handlePrevPoem = useCallback(() => {
    if (currentPoemIndex > 0) {
      setPageDirection(-1);
      setSelectedPoemId(collected[currentPoemIndex - 1]!.id);
    }
  }, [collected, currentPoemIndex]);

  const handleNextPoem = useCallback(() => {
    if (currentPoemIndex < collected.length - 1) {
      setPageDirection(1);
      setSelectedPoemId(collected[currentPoemIndex + 1]!.id);
    }
  }, [collected, currentPoemIndex]);

  const handleTabChange = useCallback((tab: PoetryBookTab) => {
    setActiveTab(tab);
    setSelectedPoemId(null);
  }, []);

  useEffect(() => {
    if (!open) return;
    contentRef.current?.focus();
  }, [open, activeTab, selectedPoemId]);

  useEffect(() => {
    if (open) return;
    setSelectedPoemId(null);
    setActiveTab('poems');
  }, [open]);

  return {
    reducedMotion,
    contentRef,
    activeTab,
    selectedPoem,
    selectedPoemId,
    pageDirection,
    displayedLines,
    done,
    skipAll,
    marginNote,
    collectedMain,
    collectedHidden,
    collectedPoems,
    collectedCount,
    totalPoems,
    pageNumber,
    totalPages,
    currentPoemIndex,
    collectedPowersCount,
    totalPowerCount,
    handleClose,
    handleBack,
    handleSelectPoem,
    handlePrevPoem,
    handleNextPoem,
    handleTabChange,
  };
}

export type PoetryBookController = ReturnType<typeof usePoetryBookController>;
