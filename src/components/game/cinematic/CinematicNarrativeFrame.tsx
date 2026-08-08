import { type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SkipForward, X } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { CinematicShell } from './CinematicShell';
import {
  getCinematicTypeStyles,
  type CinematicNarrativePresentation,
} from './cinematicNarrativeStyles';

export interface CinematicNarrativeFrameProps {
  nodeKey: string;
  presentation: CinematicNarrativePresentation;
  ariaLabel: string;
  speakerTitleId?: string;
  speakerLabel?: string;
  displayedText: string;
  done: boolean;
  reducedMotion: boolean;
  liveMessage: string;
  onSkip: () => void;
  onClose: () => void;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children?: ReactNode;
  /** When true, adds data-mobile-dialogue attributes for CSS targeting */
  mobileDialogue?: boolean;
}

/** Full-screen AAA narrative beat — shared by story nodes and NPC dialogue. */
export function CinematicNarrativeFrame({
  nodeKey,
  presentation,
  ariaLabel,
  speakerTitleId,
  speakerLabel,
  displayedText,
  done,
  reducedMotion,
  liveMessage,
  onSkip,
  onClose,
  toolbar,
  footer,
  children,
  mobileDialogue = false,
}: CinematicNarrativeFrameProps) {
  const typeStyles = getCinematicTypeStyles(presentation.type);
  const { accentColor, type } = presentation;

  return (
    <AnimatePresence mode="sync">
      <motion.div
        key={nodeKey}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.2, ease: 'easeInOut' } }}
        transition={{ duration: reducedMotion ? 0 : 0.45, ease: 'easeInOut' }}
        className={`fixed inset-0 flex items-center justify-center pointer-events-none${mobileDialogue ? '' : ''}`}
        style={{ zIndex: UI_LAYERS.DIALOGUE }}
        {...(mobileDialogue ? { 'data-mobile-dialogue': 'true' as const } : {})}
        onClick={done ? undefined : onSkip}
      >
        <AriaLiveRegion message={liveMessage} priority="polite" />
        <CinematicShell presentation={presentation} />

        <FocusTrap>
          <div
            className="relative z-20 flex flex-col items-center w-full max-w-4xl px-6 sm:px-10 pointer-events-auto"
            role="dialog"
            aria-modal="true"
            {...(speakerTitleId ? { 'aria-labelledby': speakerTitleId } : { 'aria-label': ariaLabel })}
            {...(mobileDialogue ? { 'data-mobile-dialogue-content': 'true' as const } : {})}
          >
            {toolbar && (
              <div className="absolute top-4 right-0 left-0 flex justify-end gap-2 pointer-events-auto">
                {toolbar}
              </div>
            )}

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
              className="w-24 sm:w-36 h-px origin-center mb-6"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}80, transparent)`,
              }}
            />

            {speakerLabel && (
              <motion.h1
                id={speakerTitleId}
                initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                transition={{
                  duration: reducedMotion ? 0 : typeStyles.fadeInDuration,
                  delay: typeStyles.titleDelay,
                  ease: 'easeOut',
                }}
                className={`${typeStyles.titleSize} ${typeStyles.titleWeight} ${typeStyles.titleTracking} text-center narrative-speaker-nameplate dialogue-speaker-nameplate`}
                style={{
                  fontFamily: '"Georgia", "Times New Roman", serif',
                  color: 'rgba(255,255,255,0.96)',
                  textShadow: `0 0 40px ${accentColor}50, 0 2px 12px rgba(0,0,0,0.85)`,
                }}
              >
                {speakerLabel}
              </motion.h1>
            )}

            <motion.div
              key={`body-${nodeKey}`}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: reducedMotion ? 0 : 0.9,
                delay: speakerLabel ? typeStyles.bodyDelay : typeStyles.titleDelay,
                ease: 'easeOut',
              }}
              className={`${typeStyles.bodySize} text-center max-w-3xl mt-4 sm:mt-5 leading-relaxed hud-filmic-quote ${!done ? 'typewriter-active-glow' : ''}`}
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                color:
                  type === 'character_intro' || type === 'dialogue'
                    ? 'rgba(230, 225, 215, 0.88)'
                    : 'rgba(210, 220, 235, 0.82)',
                textShadow: `0 0 24px ${accentColor}15, 0 2px 8px rgba(0,0,0,0.75)`,
                fontSize: 'calc(1rem * var(--subtitle-scale, 1))',
              }}
            >
              {displayedText}
              {!done && (
                <span
                  className="inline-block w-0.5 h-[1.1em] ml-1 align-middle dialogue-text-cursor"
                  style={{
                    background: accentColor,
                    boxShadow: `0 0 8px ${accentColor}`,
                    animation: 'cursor-blink 0.8s step-end infinite',
                  }}
                />
              )}
            </motion.div>

            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.2, delay: 0.45, ease: 'easeOut' }}
              className="w-16 sm:w-24 h-px origin-center mt-6 mb-2"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}45, transparent)`,
              }}
            />

            {footer}

            {children && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: done ? 1 : 0, y: done ? 0 : 16 }}
                transition={{ duration: 0.35 }}
                className="w-full max-w-2xl mt-4 flex flex-col gap-2"
              >
                {children}
              </motion.div>
            )}
          </div>
        </FocusTrap>

        <div className="absolute top-5 right-5 z-30 flex items-center gap-2 pointer-events-auto">
          {!done && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSkip();
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-black/45 backdrop-blur-sm border border-white/10 text-white/75 text-sm hover:bg-black/65 hover:text-white transition-colors"
              aria-label="Пропустить анимацию текста"
            >
              <SkipForward className="size-3.5" />
              Пропустить
            </button>
          )}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="p-2 rounded-lg bg-black/45 backdrop-blur-sm border border-white/10 text-white/60 hover:text-white hover:bg-black/65 transition-colors"
            aria-label="Закрыть"
          >
            <X className="size-4" />
          </button>
        </div>

        {type === 'act_transition' && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.2 }}
            className="absolute bottom-[10dvh] text-[10px] tracking-[0.3em] uppercase pointer-events-none"
            style={{
              fontFamily: '"Georgia", "Times New Roman", serif',
              color: `${accentColor}55`,
            }}
          >
            volodka rpg
          </motion.p>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
