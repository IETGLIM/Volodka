/* ─── Host for the unified poem reveal pipeline ─── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { getPoemById } from '@/data/gameDataLoader';
import { useCinematicNarrativePresentation } from '@/hooks/useCinematicNarrativePresentation';
import { useGameStore } from '@/store/gameStore';
import type { PoemRevealMode } from '@/engine/poemReveal/poemRevealTypes';
import {
  cancelPoemReveal,
  completePoemReveal,
  setPoemRevealUiActive,
} from '@/engine/poemReveal/poemRevealOrchestrator';
import {
  cancelPoemReadingCutscene,
  completePoemReadingCutscene,
} from '@/engine/poemReading/poemReadingOrchestrator';
import { triggerPoemCinematicVfx } from '@/engine/poemWorld/aaaPoemCinematicVfx';
import { PoemRevealShell } from './PoemRevealShell';

type ActiveReveal = { poemId: string; mode: PoemRevealMode };

/** Single mount point — listens to poem:show_reveal (+ legacy aliases). */
export function PoemRevealHost() {
  const [active, setActive] = useState<ActiveReveal | null>(null);
  const activeRef = useRef<ActiveReveal | null>(null);
  activeRef.current = active;
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);

  // power_ritual may run while a story node is closing; discovery waits for overlay.
  const blockedByStory = active?.mode === 'discovery' && showStoryOverlay;
  const visible = active != null && !blockedByStory;
  useCinematicNarrativePresentation(visible);

  useEffect(() => {
    setPoemRevealUiActive(visible && active ? active.poemId : null);
    return () => {
      setPoemRevealUiActive(null);
    };
  }, [visible, active]);

  useEffect(() => {
    return () => {
      if (!activeRef.current) return;
      // Clear pending power id + drain the entire FIFO (host is gone).
      cancelPoemReadingCutscene();
      cancelPoemReveal();
    };
  }, []);

  useEffect(() => {
    const show = (poemId: string, mode: PoemRevealMode) => {
      triggerPoemCinematicVfx(poemId, mode as any);
      setActive({ poemId, mode });
    };

    const unsubs = [
      eventBus.on('poem:show_reveal', ({ poemId, mode }) => {
        show(poemId, mode);
      }),
      eventBus.on('poem:show_discovery_reveal', ({ poemId }) => {
        setActive((prev) => prev ?? { poemId, mode: 'discovery' });
      }),
      eventBus.on('poem:show_cutscene', ({ poemId }) => {
        setActive((prev) => prev ?? { poemId, mode: 'power_ritual' });
      }),
      eventBus.on('poem:reveal_end', () => {
        setActive(null);
      }),
      eventBus.on('poem:discovery_reveal_end', () => {
        setActive((prev) => (prev?.mode === 'discovery' ? null : prev));
      }),
      eventBus.on('poem:cutscene_end', () => {
        setActive((prev) => (prev?.mode === 'power_ritual' ? null : prev));
      }),
    ];

    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  const handleFinished = useCallback(() => {
    const current = activeRef.current;
    if (!current) return;
    if (current.mode === 'power_ritual') {
      completePoemReadingCutscene(current.poemId);
    }
    completePoemReveal(current.poemId);
    setActive(null);
  }, []);

  useEffect(() => {
    if (!active) return;
    if (!getPoemById(active.poemId)) {
      cancelPoemReveal();
      setActive(null);
    }
  }, [active]);

  return (
    <AnimatePresence mode="wait">
      {visible && active ? (
        <PoemRevealShell
          key={`${active.mode}:${active.poemId}`}
          poemId={active.poemId}
          mode={active.mode}
          onFinished={handleFinished}
        />
      ) : null}
    </AnimatePresence>
  );
}
