/* ─── Volodka RPG – Poem Reading Ritual Cutscene ───
   Full-screen reading beat before main poem powers activate.
   Camera dollies toward Volodka; text reveals line-by-line.
 */

import { useState, useEffect, useCallback, useRef, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { getPoemById } from '@/data/gameDataLoader';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useCinematicNarrativePresentation } from '@/hooks/useCinematicNarrativePresentation';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import {
  CinematicShell,
  CinematicLetterboxBars,
  CinematicTitleCard,
  resolvePoemPresentation,
} from '@/components/game/cinematic';
import {
  completePoemReadingCutscene,
  cancelPoemReadingCutscene,
} from '@/engine/poemReading/poemReadingOrchestrator';

const MIN_SKIP_MS = 1200;
const MIN_SKIP_REDUCED_MS = 400;
const BASE_LINE_DELAY_MS = 900;

function computeLineDelayMs(textSpeed: number, reducedMotion: boolean): number {
  if (reducedMotion) return 0;
  return Math.max(120, Math.round(BASE_LINE_DELAY_MS / textSpeed));
}

const PoemReadingContent = memo(function PoemReadingContent({
  poemId,
  onFinished,
}: {
  poemId: string;
  onFinished: () => void;
}) {
  const poem = getPoemById(poemId);
  const reducedMotion = useEffectiveReducedMotion();
  const { textSpeed } = useAccessibilitySettings();
  const [visibleLines, setVisibleLines] = useState(reducedMotion ? poem?.lines.length ?? 0 : 0);
  const [canSkip, setCanSkip] = useState(reducedMotion);
  const [ariaAnnouncement, setAriaAnnouncement] = useState('');
  const finishedRef = useRef(false);
  const skipEnabledAtRef = useRef(Date.now() + (reducedMotion ? MIN_SKIP_REDUCED_MS : MIN_SKIP_MS));

  const presentation = resolvePoemPresentation('#c8e6ff');
  const lines = poem?.lines ?? [];
  const lineDelayMs = computeLineDelayMs(Number(textSpeed), reducedMotion);

  useEffect(() => {
    eventBus.emit('camera:poem_reading_start', {});
    setAriaAnnouncement(poem ? `Чтение: ${poem.title}` : 'Чтение стихотворения');

    const skipTimer = setTimeout(() => {
      setCanSkip(true);
    }, reducedMotion ? MIN_SKIP_REDUCED_MS : MIN_SKIP_MS);

    return () => {
      clearTimeout(skipTimer);
    };
  }, [poem, reducedMotion]);

  useEffect(() => {
    if (!poem || reducedMotion || lines.length === 0) return;

    if (visibleLines >= lines.length) {
      const finishTimer = setTimeout(() => {
        if (!finishedRef.current) {
          finishedRef.current = true;
          onFinished();
        }
      }, Math.max(600, lineDelayMs));
      return () => clearTimeout(finishTimer);
    }

    const timer = setTimeout(() => {
      setVisibleLines((count) => count + 1);
    }, lineDelayMs);

    return () => clearTimeout(timer);
  }, [poem, lines.length, visibleLines, lineDelayMs, reducedMotion, onFinished]);

  useEffect(() => {
    if (!poem || !reducedMotion || lines.length === 0) return;

    const timer = setTimeout(() => {
      if (!finishedRef.current) {
        finishedRef.current = true;
        onFinished();
      }
    }, MIN_SKIP_REDUCED_MS + 200);
    return () => clearTimeout(timer);
  }, [poem, lines.length, reducedMotion, onFinished]);

  const finishReading = useCallback(() => {
    if (finishedRef.current) return;
    if (Date.now() < skipEnabledAtRef.current && !reducedMotion) return;
    finishedRef.current = true;
    onFinished();
  }, [onFinished, reducedMotion]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key !== ' ' && e.key !== 'Enter') return;
      e.preventDefault();
      if (!canSkip && !reducedMotion) {
        setVisibleLines(lines.length);
        setCanSkip(true);
        return;
      }
      finishReading();
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [canSkip, finishReading, lines.length, reducedMotion]);

  if (!poem) {
    return null;
  }

  return (
    <>
      <AriaLiveRegion message={ariaAnnouncement} priority="assertive" />
      <CinematicLetterboxBars style="thin" />

      <motion.div
        className="fixed inset-0 flex items-center justify-center pointer-events-auto"
        style={{ zIndex: UI_LAYERS.POEM }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.55 }}
        onClick={() => {
          if (canSkip || reducedMotion) {
            finishReading();
          }
        }}
        data-testid="poem-reading-cutscene"
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            zIndex: UI_LAYERS.POEM_VIGNETTE,
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.35) 0%, rgba(0,0,0,0.82) 90%)',
          }}
        />

        <CinematicShell presentation={presentation} backdropVariant="revelation">
          <div className="relative z-20 flex flex-col items-center w-full max-w-3xl px-6">
            <CinematicTitleCard
              title={poem.title}
              subtitle={poem.author}
              accentColor={presentation.accentColor}
              type="story_moment"
              reducedMotion={reducedMotion}
            />

            <div
              className="mt-6 w-full max-h-[40dvh] overflow-y-auto custom-scrollbar text-base sm:text-lg leading-relaxed px-2"
              aria-live="polite"
            >
              <AnimatePresence initial={false}>
                {lines.slice(0, visibleLines).map((line, index) => (
                  <motion.div
                    key={`${poem.id}-line-${index}`}
                    initial={reducedMotion ? false : { opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeOut' }}
                    className={`text-center ${line === '' ? 'h-4' : 'mb-1.5'}`}
                    style={{
                      fontFamily: '"Georgia", "Times New Roman", serif',
                      color: 'rgba(225, 238, 248, 0.9)',
                      textShadow: `0 0 18px ${presentation.accentColor}22`,
                    }}
                  >
                    {line}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {(canSkip || reducedMotion) && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-8 text-xs sm:text-sm tracking-[0.18em] uppercase text-center font-mono"
                  style={{ color: `${presentation.accentColor}aa` }}
                >
                  Пробел или щелчок — продолжить
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </CinematicShell>
      </motion.div>
    </>
  );
});

export function PoemReadingCutscene() {
  const [activePoemId, setActivePoemId] = useState<string | null>(null);

  useCinematicNarrativePresentation(activePoemId != null);

  useEffect(() => {
    const unsubShow = eventBus.on('poem:show_cutscene', ({ poemId }) => {
      setActivePoemId(poemId);
    });
    const unsubEnd = eventBus.on('poem:cutscene_end', () => {
      setActivePoemId(null);
    });
    return () => {
      unsubShow();
      unsubEnd();
    };
  }, []);

  const handleFinished = useCallback(() => {
    if (!activePoemId) return;
    completePoemReadingCutscene(activePoemId);
    setActivePoemId(null);
  }, [activePoemId]);

  useEffect(() => {
    if (!activePoemId) return;
    const poem = getPoemById(activePoemId);
    if (!poem) {
      cancelPoemReadingCutscene();
      setActivePoemId(null);
    }
  }, [activePoemId]);

  return (
    <AnimatePresence>
      {activePoemId && (
        <PoemReadingContent key={activePoemId} poemId={activePoemId} onFinished={handleFinished} />
      )}
    </AnimatePresence>
  );
}
