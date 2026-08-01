/* ─── Unified poem reveal shell — one typography / stage pipeline ───
 * Modes: discovery | power_ritual | explicit_read
 * Stages: kicker → typewriter excerpt → badge → combat cue → dismiss
 * Full poem text stays in the poetry book.
 */

import { useCallback, useEffect, useMemo, useRef, memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { getPoemById } from '@/data/gameDataLoader';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import {
  CinematicShell,
  CinematicLetterboxBars,
  CinematicTitleCard,
  resolvePoemPresentation,
} from '@/components/game/cinematic';
import { usePoemTypewriter } from '@/components/game/poetryBook/usePoemTypewriter';
import { getPoemExcerpt, POEM_EXCERPT_LINE_COUNT } from '@/shared/poem/poemExcerpt';
import {
  getPoemEffectCategory,
  getPoemEffectLabel,
} from '@/components/game/combatUi/poemPowerPresentation';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import type { PoemRevealMode } from '@/engine/poemReveal/poemRevealTypes';
import { POEM_REVEAL_STAGE_FLAGS } from '@/engine/poemReveal/poemRevealTypes';

const TYPEWRITER_MS = 36;

export type PoemRevealShellProps = {
  poemId: string;
  mode: PoemRevealMode;
  onFinished: () => void;
};

export const PoemRevealShell = memo(function PoemRevealShell({
  poemId,
  mode,
  onFinished,
}: PoemRevealShellProps) {
  const poem = getPoemById(poemId);
  const reducedMotion = useEffectiveReducedMotion();
  const finishedRef = useRef(false);
  const continueRef = useRef<HTMLButtonElement>(null);
  const flags = POEM_REVEAL_STAGE_FLAGS[mode];

  const excerpt = useMemo(
    () => getPoemExcerpt(poem?.lines ?? [], POEM_EXCERPT_LINE_COUNT),
    [poem],
  );
  const power = poem ? getPoemPower(poem.id) : undefined;
  const combatCategory = poem ? getPoemEffectCategory(poem.id) : null;
  const presentation = resolvePoemPresentation(flags.accentColor);

  const { displayedLines, done, skipAll } = usePoemTypewriter(
    excerpt.lines,
    true,
    reducedMotion,
    TYPEWRITER_MS,
  );

  useEffect(() => {
    if (flags.emitCameraDolly) {
      eventBus.emit('camera:poem_reading_start', {});
    }
    if (flags.muffleAudio) {
      audioEngine.enableDialogueMuffle();
    }
    return () => {
      if (flags.muffleAudio) {
        audioEngine.disableDialogueMuffle();
      }
    };
  }, [flags.emitCameraDolly, flags.muffleAudio]);

  useEffect(() => {
    if (done) {
      continueRef.current?.focus({ preventScroll: true });
    }
  }, [done]);

  const finish = useCallback(() => {
    if (finishedRef.current) return;
    if (!done) {
      skipAll();
      return;
    }
    finishedRef.current = true;
    onFinished();
  }, [done, onFinished, skipAll]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== ' ' && event.key !== 'Enter' && event.key !== 'Escape') return;
      event.preventDefault();
      finish();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finish]);

  if (!poem) return null;

  const completenessLabel = excerpt.isFragment ? 'Фрагмент' : 'Полный текст';
  const completenessHint = excerpt.isFragment
    ? 'Полный текст — в сборнике 📖'
    : 'Стих сохранён в сборнике';

  const ariaMessage =
    mode === 'power_ritual'
      ? `Чтение: ${poem.title}`
      : `Новый стих: ${poem.title}. ${completenessLabel}.`;

  return (
    <>
      <AriaLiveRegion message={ariaMessage} priority="assertive" />
      <CinematicLetterboxBars style="thin" />
      <motion.div
        className="fixed inset-0 flex items-center justify-center pointer-events-auto"
        style={{ zIndex: UI_LAYERS.POEM }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.45 }}
        data-testid={flags.testId}
        data-poem-reveal-mode={mode}
        role="dialog"
        aria-modal="true"
        aria-label={
          mode === 'power_ritual' ? `Чтение: ${poem.title}` : `Стих найден: ${poem.title}`
        }
        onClick={finish}
      >
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            zIndex: UI_LAYERS.POEM_VIGNETTE,
            background:
              'radial-gradient(ellipse at center, rgba(0,0,0,0.12) 0%, rgba(0,0,0,0.55) 45%, rgba(0,0,0,0.9) 100%)',
          }}
        />

        <CinematicShell presentation={presentation} backdropVariant="revelation">
          <div className="relative z-20 flex flex-col items-center w-full max-w-2xl px-6 glass-panel">
            {flags.showKicker ? (
              <p
                className="mb-3 text-[10px] font-mono tracking-[0.35em] uppercase"
                style={{ color: `${presentation.accentColor}99` }}
              >
                {flags.kickerLabel}
              </p>
            ) : null}

            {flags.showTitleCard ? (
              <CinematicTitleCard
                title={poem.title}
                subtitle={poem.author}
                accentColor={presentation.accentColor}
                type="story_moment"
                reducedMotion={reducedMotion}
                size="location"
              />
            ) : null}

            <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
              {flags.showCompletenessBadge ? (
                <span
                  className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded border"
                  style={{
                    color: excerpt.isFragment ? '#fbbf24' : '#66ffaa',
                    borderColor: excerpt.isFragment
                      ? 'rgba(251,191,36,0.35)'
                      : 'rgba(102,255,170,0.35)',
                    background: excerpt.isFragment
                      ? 'rgba(120,60,10,0.25)'
                      : 'rgba(0,40,24,0.35)',
                  }}
                  data-testid="poem-reveal-completeness"
                >
                  {completenessLabel}
                </span>
              ) : null}
              {flags.showCombatCue && power && combatCategory ? (
                <span
                  className="text-[10px] font-mono tracking-wide px-2 py-0.5 rounded border border-cyan-500/30 text-cyan-200/90 bg-cyan-950/40"
                  data-testid="poem-reveal-combat-cue"
                >
                  Бой · {power.name} · {getPoemEffectLabel(combatCategory)}
                </span>
              ) : null}
            </div>

            <div
              className="mt-6 w-full text-base sm:text-lg px-2 min-h-[7.5rem] poem-stanza-display"
              style={{ lineHeight: '2.0' }}
              aria-live="polite"
              onClick={(e) => {
                e.stopPropagation();
                finish();
              }}
            >
              {displayedLines.map((line, index) => (
                <motion.p
                  key={`${poem.id}-ex-${index}`}
                  initial={reducedMotion ? false : { opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: 0.5,
                    delay: reducedMotion ? 0 : index * 0.3,
                    ease: 'easeOut',
                  }}
                  className={`text-center ${line === '' ? 'h-4' : 'mb-1.5'}`}
                  style={{
                    fontFamily: 'Georgia, "Times New Roman", serif',
                    color: 'rgba(225, 238, 248, 0.92)',
                    textShadow: `0 0 10px ${presentation.accentColor}44, 0 0 25px ${presentation.accentColor}22, 0 0 40px ${presentation.accentColor}11`,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {line}
                  {index === displayedLines.length - 1 && !done && line !== '' ? (
                    <span className="typewriter-cursor" aria-hidden>
                      |
                    </span>
                  ) : null}
                </motion.p>
              ))}
            </div>

            {flags.showBookHint ? (
              <p className="mt-4 text-[10px] font-mono tracking-widest text-slate-500 text-center">
                {completenessHint}
              </p>
            ) : null}

            {flags.showPowerDescription && power ? (
              <p className="mt-2 text-[11px] font-mono text-cyan-300/70 text-center max-w-md leading-relaxed">
                {power.description}
              </p>
            ) : null}

            <AnimatePresence>
              {done ? (
                <motion.button
                  ref={continueRef}
                  type="button"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    finish();
                  }}
                  className="mt-7 px-6 py-2 rounded border font-mono text-xs sm:text-sm tracking-[0.15em] uppercase transition-colors cursor-pointer pointer-events-auto"
                  style={{
                    color: `${presentation.accentColor}cc`,
                    borderColor: `${presentation.accentColor}44`,
                    background: `${presentation.accentColor}0a`,
                  }}
                  data-testid="poem-reveal-continue"
                  aria-label="Продолжить"
                >
                  Продолжить
                </motion.button>
              ) : (
                <p className="mt-7 text-[10px] font-mono tracking-widest text-slate-600">
                  нажмите, чтобы пропустить
                </p>
              )}
            </AnimatePresence>
          </div>
        </CinematicShell>
      </motion.div>
    </>
  );
});
