/* ─── Volodka RPG – Skip-Prologue Intro Overlay (IMPROVEMENT_PLAN 4.1) ───
   3-page typewriter intro in Disco Elysium inner-monologue style.
   Plays after the player picks "Пропустить пролог" from the New Game dialog,
   BEFORE the existing skip_prologue_intro story node is opened.
   Chrome: hud-filmic-quote + hud-filmic-divider classes (CSS-gated on
   prefers-reduced-motion — typewriter hook also auto-skips to full text).
   The story node is preserved as a fallback — this overlay only delays it.
*/

import { useCallback, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { safePlayMenuSfx } from '@/engine/menu/menuPresentation';
import { audioEngine } from '@/engine/AudioEngine';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const PAGES = [
  'Вы — Володня. IT-специалист. Утро. Будильник не звенел — телефон умер.',
  'На столе — нерешённый тикет, остывший кофе и блокнот со стихами.',
  'Кажется, сегодня будет долгий день.',
] as const;

const CONTINUE_LABEL = 'Продолжить';
const FINAL_LABEL = 'В путь';

export interface SkipPrologueOverlayProps {
  onComplete: () => void;
}

export function SkipPrologueOverlay({ onComplete }: SkipPrologueOverlayProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const [pageIndex, setPageIndex] = useState(0);
  const text = PAGES[pageIndex];
  const { displayed, done, skip } = useNarrativeTypewriter(text, 32);
  const isLastPage = pageIndex === PAGES.length - 1;

  const handleContinue = useCallback(() => {
    if (!done) {
      skip();
      return;
    }
    safePlayMenuSfx(audioEngine.playSfx.bind(audioEngine), 'confirm');
    if (isLastPage) {
      onComplete();
      return;
    }
    setPageIndex((i) => Math.min(i + 1, PAGES.length - 1));
  }, [done, skip, isLastPage, onComplete]);

  return (
    <motion.div
      key="skip-prologue-overlay-root"
      className="fixed inset-0 flex items-center justify-center pointer-events-auto"
      style={{ zIndex: UI_LAYERS.PANEL, background: 'rgba(0,0,0,0.86)', backdropFilter: 'blur(6px)' }}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? undefined : { opacity: 0 }}
      transition={{ duration: reducedMotion ? 0 : 0.4, ease: 'easeOut' }}
      role="dialog"
      aria-modal="true"
      aria-label="Вступление"
    >
      <div
        className="max-w-xl mx-4 px-6 sm:px-10 py-8 sm:py-12 relative"
        style={{
          background: 'linear-gradient(180deg, rgba(8,10,16,0.95) 0%, rgba(4,6,12,0.98) 100%)',
          border: '1px solid rgba(168, 162, 158, 0.18)',
          borderRadius: 4,
          boxShadow: '0 16px 64px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.04)',
        }}
      >
        {/* Top divider with diamond glyph */}
        <div className="hud-filmic-divider" aria-hidden style={{ margin: '0 auto 1.5rem', width: '12rem' }} />

        <AnimatePresence mode="wait">
          <motion.div
            key={`skip-page-${pageIndex}`}
            initial={reducedMotion ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? undefined : { opacity: 0, y: -8 }}
            transition={{ duration: reducedMotion ? 0 : 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="hud-filmic-quote"
          >
            <p
              className="font-serif text-base sm:text-lg md:text-xl leading-relaxed text-stone-200/90"
              style={{
                textShadow: '0 1px 8px rgba(0,0,0,0.6)',
                minHeight: '4.5rem',
              }}
            >
              {displayed}
              {!done && !reducedMotion ? (
                <span className="animate-pulse opacity-60" aria-hidden>▌</span>
              ) : null}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Bottom divider */}
        <div className="hud-filmic-divider" aria-hidden style={{ margin: '1.5rem auto 1.25rem', width: '8rem' }} />

        {/* Page dots */}
        <div className="flex items-center justify-center gap-1.5 mb-4" aria-hidden>
          {PAGES.map((_, i) => (
            <span
              key={i}
              className="rounded-full transition-all duration-300"
              style={{
                width: i === pageIndex ? 18 : 6,
                height: 6,
                background:
                  i === pageIndex
                    ? 'rgba(231,229,228,0.85)'
                    : i < pageIndex
                      ? 'rgba(168,162,158,0.5)'
                      : 'rgba(120,113,108,0.3)',
              }}
            />
          ))}
        </div>

        {/* Continue / Skip-typewriter button — shown once typed (or instantly under reduced-motion) */}
        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleContinue}
            className="cinematic-menu-item cinematic-menu-item--selected min-w-[8rem]"
            data-testid={`skip-prologue-${isLastPage ? 'finish' : 'continue'}`}
          >
            {isLastPage ? FINAL_LABEL : CONTINUE_LABEL}
          </button>
        </div>
      </div>
    </motion.div>
  );
}
