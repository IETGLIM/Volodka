/**
 * Хук идеального пролога — оркестрация загрузки + фаз.
 * ИСПРАВЛЕНО: единый источник истины outer phase boot->breath->title->handoff
 * eyeOpen теперь subPhase внутри breath, а не отдельная outer фаза.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { PROLOGUE_PERFECTION, type ProloguePhase } from './prologuePerfectionConstants';

import { devWarn } from '@/shared/utils/devLog';
interface UseProloguePerfectionReturn {
  phase: ProloguePhase;
  progress: number;
  innerText: string;
  goNext: () => void;
  skipAll: () => void;
  isPreloading: boolean;
}

export function useProloguePerfection(onComplete: () => void): UseProloguePerfectionReturn {
  const [phase, setPhase] = useState<ProloguePhase>('boot');
  const [progress, setProgress] = useState(0);
  const [innerIdx, setInnerIdx] = useState(0);
  const [isPreloading, setIsPreloading] = useState(true);

  const physicsReadyRef = useRef(false);
  const storyReadyRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const preload = async () => {
      try {
        const { prefetchStoryNodes } = await import('@/data/gameDataLoader');
        await prefetchStoryNodes([...PROLOGUE_PERFECTION.preloadStoryNodes]);
        if (!cancelled) {
          storyReadyRef.current = true;
          setProgress((p) => Math.max(p, 0.4));
        }

        const { preloadPhysicsChunk } = await import('@/engine/physics/preloadPhysicsChunk');
        await preloadPhysicsChunk();
        if (!cancelled) {
          physicsReadyRef.current = true;
          setProgress((p) => Math.max(p, 0.85));
        }

        await import('@/components/game/FirstReadingCelebration');
        if (!cancelled) {
          setProgress(1);
          setIsPreloading(false);
        }
      } catch (e) {
        devWarn('[ProloguePerfection] preload failed, will fallback', e);
        if (!cancelled) {
          setProgress(1);
          setIsPreloading(false);
        }
      }
    };

    const progInterval = setInterval(() => {
      setProgress((p) => {
        if (p >= 0.9) return p;
        return Math.min(0.9, p + Math.random() * 0.07);
      });
    }, 280);

    void preload();

    return () => {
      cancelled = true;
      clearInterval(progInterval);
    };
  }, []);

  const goNext = useCallback(() => {
    setPhase((prev) => {
      if (prev === 'boot') return 'breath';
      if (prev === 'breath') return 'title'; // единый источник: breath включает eye внутри
      if (prev === 'title') return 'handoff';
      if (prev === 'eyeOpen') return 'title'; // legacy fallback
      return prev;
    });
  }, []);

  const skipAll = useCallback(() => {
    onComplete();
  }, [onComplete]);

  useEffect(() => {
    if (phase === 'eyeOpen') {
      const t = setTimeout(() => setPhase('title'), 1200);
      return () => clearTimeout(t);
    }
    if (phase === 'title') {
      const t = setTimeout(() => setPhase('handoff'), PROLOGUE_PERFECTION.titleCardDurationMs);
      return () => clearTimeout(t);
    }
    if (phase === 'handoff') {
      const t = setTimeout(onComplete, 600);
      return () => clearTimeout(t);
    }
  }, [phase, onComplete]);

  const innerText = PROLOGUE_PERFECTION.innerMonologue[innerIdx] ?? PROLOGUE_PERFECTION.innerMonologue[0];

  useEffect(() => {
    if (phase !== 'breath') return;
    const id = setInterval(() => {
      setInnerIdx((i) => (i + 1) % PROLOGUE_PERFECTION.innerMonologue.length);
    }, 2800);
    return () => clearInterval(id);
  }, [phase]);

  return {
    phase,
    progress,
    innerText,
    goNext,
    skipAll,
    isPreloading,
  };
}
