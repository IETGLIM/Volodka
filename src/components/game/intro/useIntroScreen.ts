import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { POEMS } from '@/data/poems';
import { useGameStore } from '@/store/gameStore';
import {
  INTRO_MAX_DURATION_MS,
  INTRO_MISSING_POEM_DELAY_MS,
} from '@/engine/intro/introConfig';
import type { IntroFinishReason } from '@/engine/intro/introTelemetry';
import { introTelemetry } from '@/engine/intro/introTelemetry';
import type { Poem } from '@/shared/types/game';

export function useIntroScreen(poemId: string) {
  const setIntroSeen = useGameStore((s) => s.setIntroSeen);
  const setMainMenuOpen = useGameStore((s) => s.setMainMenuOpen);
  const setShowStoryOverlay = useGameStore((s) => s.setShowStoryOverlay);

  const introPoem = useMemo(() => POEMS.find((p) => p.id === poemId) ?? null, [poemId]);
  const [done, setDone] = useState(false);
  const finishedRef = useRef(false);
  const mountedRef = useRef(true);

  const finish = useCallback(
    (reason: IntroFinishReason) => {
      if (finishedRef.current || !mountedRef.current) return;
      finishedRef.current = true;
      setDone(true);
      introTelemetry.markFinished(reason);
      setShowStoryOverlay(false);
      setIntroSeen(true);
      setMainMenuOpen(true);
    },
    [setIntroSeen, setMainMenuOpen, setShowStoryOverlay],
  );

  useEffect(() => {
    mountedRef.current = true;
    introTelemetry.markStarted();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (introPoem) return;
    const timer = setTimeout(() => finish('missing_poem'), INTRO_MISSING_POEM_DELAY_MS);
    return () => clearTimeout(timer);
  }, [introPoem, finish]);

  useEffect(() => {
    const timer = setTimeout(() => finish('timeout'), INTRO_MAX_DURATION_MS);
    return () => clearTimeout(timer);
  }, [finish]);

  const handlePoemComplete = useCallback(() => finish('complete'), [finish]);
  const handleSkip = useCallback(() => finish('skip'), [finish]);

  return {
    introPoem: introPoem as Poem | null,
    done,
    handlePoemComplete,
    handleSkip,
  };
}
