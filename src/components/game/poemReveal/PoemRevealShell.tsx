/* ─── Unified poem reveal shell — AAA luxury — one typography / stage pipeline ───
 * Modes: discovery | power_ritual | explicit_read
 * Stages: kicker → typewriter excerpt → badge → combat cue → dismiss
 * Full poem text stays in the poetry book.
 * AAA: paper texture, Cormorant Garamond, ink bleed, filmi shadows, no plastic.
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
        transition={{ duration: reducedMotion ? 0 : 0.55, ease: [0.16, 1, 0.3, 1] }}
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
              'radial-gradient(ellipse at center, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.52) 44%, rgba(0,0,0,0.88) 100%)',
          }}
        />

        <CinematicShell presentation={presentation} backdropVariant="revelation">
          <div className="relative z-20 flex flex-col items-center w-full max-w-[42rem] px-7">
            {flags.showKicker ? (
              <motion.p
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.6 }}
                className="mb-3.5 text-[10px] font-mono tracking-[0.38em] uppercase"
                style={{ color: `${presentation.accentColor}aa` }}
              >
                {flags.kickerLabel}
              </motion.p>
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

            <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
              {flags.showCompletenessBadge ? (
                <span
                  className="text-[10px] font-mono tracking-widest uppercase px-2.5 py-1 rounded-full border backdrop-blur-md"
                  style={{
                    color: excerpt.isFragment ? '#fde68a' : '#86efac',
                    borderColor: excerpt.isFragment
                      ? 'rgba(253, 230, 138, 0.32)'
                      : 'rgba(134, 239, 172, 0.32)',
                    background: excerpt.isFragment
                      ? 'rgba(120,60,10,0.22)'
                      : 'rgba(0,40,24,0.32)',
                    boxShadow: `0 0 12px ${presentation.accentColor}18`,
                  }}
                  data-testid="poem-reveal-completeness"
                >
                  {completenessLabel}
                </span>
              ) : null}
              {flags.showCombatCue && power && combatCategory ? (
                <span
                  className="text-[10px] font-mono tracking-wide px-2.5 py-1 rounded-full border backdrop-blur-md"
                  style={{
                    borderColor: 'rgba(165, 243, 252, 0.28)',
                    color: 'rgba(165, 243, 252, 0.88)',
                    background: 'rgba(8, 40, 48, 0.42)',
                  }}
                  data-testid="poem-reveal-combat-cue"
                >
                  Бой · {power.name} · {getPoemEffectLabel(combatCategory)}
                </span>
              ) : null}
            </div>

            <div
              className="mt-7 w-full text-base sm:text-[17px] leading-[1.9] px-5 py-6 min-h-[9rem] relative rounded-[14px] overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(18,16,12,0.42) 0%, rgba(10,8,6,0.58) 100%)',
                border: '1px solid rgba(220,215,210,0.10)',
                boxShadow: '0 12px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)',
                backdropFilter: 'blur(14px)',
              }}
              aria-live="polite"
              onClick={(e) => {
                e.stopPropagation();
                finish();
              }}
            >
              <div
                className="absolute inset-0 pointer-events-none opacity-[0.05] mix-blend-soft-light"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
                }}
                aria-hidden
              />
              <div className="relative">
                {displayedLines.map((line, index) => (
                  <p
                    key={`${poem.id}-ex-${index}`}
                    className={`text-center ${line === '' ? 'h-5' : 'mb-2.5'} tracking-[0.012em]`}
                    style={{
                      fontFamily: '"Cormorant Garamond", "Georgia", serif',
                      fontWeight: line.trim().length < 22 ? 300 : 400,
                      fontSize: line.trim().length < 16 ? '1.20em' : '1em',
                      fontStyle: line.trim().length < 12 || line.startsWith(' ') ? 'italic' : 'normal',
                      color: 'rgba(244, 238, 230, 0.96)',
                      textShadow: `0 1px 18px rgba(0,0,0,0.62), 0 0 26px ${presentation.accentColor}32`,
                      whiteSpace: 'pre-wrap',
                      letterSpacing: '0.014em',
                      lineHeight: line.trim().length < 12 ? '1.5' : '1.92',
                    }}
                  >
                    {line}
                    {index === displayedLines.length - 1 && !done && line !== '' ? (
                      <span className="typewriter-cursor ml-[3px] opacity-80" aria-hidden>
                        ▌
                      </span>
                    ) : null}
                  </p>
                ))}
              </div>
            </div>

            {flags.showBookHint ? (
              <p className="mt-4 text-[10px] font-mono tracking-widest text-stone-500/70 text-center">
                {completenessHint}
              </p>
            ) : null}

            {flags.showPowerDescription && power ? (
              <p className="mt-3 text-[11px] font-mono text-cyan-200/65 text-center max-w-md leading-relaxed italic">
                {power.description}
              </p>
            ) : null}

            <AnimatePresence>
              {done ? (
                <motion.button
                  ref={continueRef}
                  type="button"
                  initial={{ opacity: 0, y: 8, filter: 'blur(4px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                  onClick={(e) => {
                    e.stopPropagation();
                    finish();
                  }}
                  className="mt-8 px-7 py-2.5 rounded-full border font-mono text-xs sm:text-sm tracking-[0.16em] uppercase transition-all duration-300 cursor-pointer pointer-events-auto backdrop-blur-md hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    color: `${presentation.accentColor}dd`,
                    borderColor: `${presentation.accentColor}44`,
                    background: `linear-gradient(180deg, ${presentation.accentColor}14 0%, ${presentation.accentColor}08 100%)`,
                    boxShadow: `0 0 24px ${presentation.accentColor}22, inset 0 1px 0 rgba(255,255,255,0.07)`,
                  }}
                  data-testid="poem-reveal-continue"
                  aria-label="Продолжить"
                >
                  Продолжить
                </motion.button>
              ) : (
                <p className="mt-8 text-[10px] font-mono tracking-widest text-stone-600/70">нажмите, чтобы пропустить</p>
              )}
            </AnimatePresence>
          </div>
        </CinematicShell>
      </motion.div>
    </>
  );
});
