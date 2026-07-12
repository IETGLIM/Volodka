import { AnimatePresence, motion } from 'framer-motion';
import {
  PHOTO_CORNER_BRACKET_SIZE,
  PHOTO_MODE_LABELS,
} from '@/engine/photo/photoModeConstants';
import {
  formatRealClockTime,
  getBlinkDotMotion,
  getFlashOverlayTransition,
  getPhotoHintTransition,
  getPhotoOverlayTransition,
  getPhotoPreviewTransition,
} from '@/engine/photo/photoModePresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { PhotoPreviewData } from '@/components/game/photoMode/usePhotoModeController';

type PhotoModeViewfinderProps = {
  flash: boolean;
  preview: PhotoPreviewData | null;
  liveAnnouncement: string;
  reducedMotion: boolean;
  sceneName: string;
  timeStr: string;
  onCapture: () => void;
  onExit: () => void;
};

export function PhotoModeViewfinder({
  flash,
  preview,
  liveAnnouncement,
  reducedMotion,
  sceneName,
  timeStr,
  onCapture,
  onExit,
}: PhotoModeViewfinderProps) {
  const blinkDot = getBlinkDotMotion(reducedMotion);
  const reducedMotionClass = reducedMotion ? 'photo-mode--reduced-motion' : '';

  return (
    <motion.div
      key="photo-mode"
      className={`fixed inset-0 photo-mode-viewfinder ${reducedMotionClass}`}
      style={{ zIndex: UI_LAYERS.LOADING }}
      initial={reducedMotion ? false : { opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
      transition={getPhotoOverlayTransition(reducedMotion)}
      role="dialog"
      aria-modal="true"
      aria-label={PHOTO_MODE_LABELS.dialogLabel}
    >
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>
      <p className="sr-only">{PHOTO_MODE_LABELS.controlsSummary}</p>

      <div className="sr-only pointer-events-auto">
        <button type="button" onClick={onCapture} aria-label={PHOTO_MODE_LABELS.captureAction}>
          {PHOTO_MODE_LABELS.captureAction}
        </button>
        <button type="button" onClick={onExit} aria-label={PHOTO_MODE_LABELS.exitAction}>
          {PHOTO_MODE_LABELS.exitAction}
        </button>
      </div>

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16"
          style={{
            border: '2px solid rgb(var(--cyber-cyan-rgb) / 0.5)',
            boxShadow:
              '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.15), inset 0 0 12px rgb(var(--cyber-cyan-rgb) / 0.05)',
          }}
        >
          <div
            className="absolute"
            style={{
              top: -2,
              left: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderTop: '2px solid var(--cyber-cyan)',
              borderLeft: '2px solid var(--cyber-cyan)',
              boxShadow: '-2px -2px 6px rgb(var(--cyber-cyan-rgb) / 0.4)',
            }}
          />
          <div
            className="absolute"
            style={{
              top: -2,
              right: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderTop: '2px solid var(--cyber-cyan)',
              borderRight: '2px solid var(--cyber-cyan)',
              boxShadow: '2px -2px 6px rgb(var(--cyber-cyan-rgb) / 0.4)',
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: -2,
              left: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderBottom: '2px solid var(--cyber-cyan)',
              borderLeft: '2px solid var(--cyber-cyan)',
              boxShadow: '-2px 2px 6px rgb(var(--cyber-cyan-rgb) / 0.4)',
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: -2,
              right: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderBottom: '2px solid var(--cyber-cyan)',
              borderRight: '2px solid var(--cyber-cyan)',
              boxShadow: '2px 2px 6px rgb(var(--cyber-cyan-rgb) / 0.4)',
            }}
          />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-cyan-400/30 viewfinder-pulse" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-cyan-400/30 viewfinder-pulse" />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full viewfinder-pulse"
            style={{
              background: 'rgb(var(--cyber-cyan-rgb) / 0.6)',
              boxShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)',
            }}
          />
        </div>

        <div className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16">
          <div className="absolute top-0 bottom-0 left-1/3 w-px border-l border-dashed border-cyan-400/10" />
          <div className="absolute top-0 bottom-0 left-2/3 w-px border-l border-dashed border-cyan-400/10" />
          <div className="absolute left-0 right-0 top-1/3 h-px border-t border-dashed border-cyan-400/10" />
          <div className="absolute left-0 right-0 top-2/3 h-px border-t border-dashed border-cyan-400/10" />
        </div>
      </div>

      <div className="absolute top-6 sm:top-10 md:top-14 lg:top-18 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        <motion.span
          className="w-2 h-2 rounded-full bg-cyan-400"
          animate={blinkDot.animate}
          transition={blinkDot.transition}
          style={{ boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.6)' }}
          aria-hidden="true"
        />
        <span
          className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase"
          style={{
            textShadow:
              '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.5), 0 0 24px rgb(var(--cyber-cyan-rgb) / 0.2)',
          }}
        >
          {PHOTO_MODE_LABELS.title}
        </span>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 lg:bottom-18 left-6 sm:left-10 md:left-14 lg:left-18 pointer-events-none">
        <span
          className="text-[10px] sm:text-xs font-mono text-cyan-400/70 tracking-wider"
          style={{ textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.3)' }}
        >
          {sceneName}
        </span>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 lg:bottom-18 right-6 sm:right-10 md:right-14 lg:right-18 pointer-events-none">
        <span
          className="text-[10px] sm:text-xs font-mono text-cyan-400/70 tabular-nums"
          style={{ textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.3)' }}
        >
          {timeStr}
        </span>
      </div>

      <motion.div
        className="absolute bottom-6 sm:bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-none"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getPhotoHintTransition(reducedMotion)}
        aria-hidden="true"
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded border border-cyan-400/20 bg-black/40 backdrop-blur-sm">
          <kbd className="text-[9px] font-mono text-cyan-400/80">{PHOTO_MODE_LABELS.captureHintKey}</kbd>
          <span className="text-[9px] font-mono text-cyan-400/50">{PHOTO_MODE_LABELS.captureHint}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded border border-cyan-400/20 bg-black/40 backdrop-blur-sm">
          <kbd className="text-[9px] font-mono text-cyan-400/80">{PHOTO_MODE_LABELS.exitHintKey}</kbd>
          <span className="text-[9px] font-mono text-cyan-400/50">/</span>
          <kbd className="text-[9px] font-mono text-cyan-400/80">{PHOTO_MODE_LABELS.exitHintAlt}</kbd>
          <span className="text-[9px] font-mono text-cyan-400/50">{PHOTO_MODE_LABELS.exitHint}</span>
        </div>
      </motion.div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key="photo-flash"
            className="absolute inset-0 bg-white pointer-events-none"
            initial={{ opacity: reducedMotion ? 0.35 : 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={getFlashOverlayTransition(reducedMotion)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {preview && (
          <motion.div
            key={`preview-${preview.timestamp}`}
            className="absolute bottom-20 sm:bottom-24 right-6 sm:right-10 pointer-events-auto"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
            transition={getPhotoPreviewTransition(reducedMotion)}
          >
            <div
              className="relative rounded-lg overflow-hidden border-2"
              style={{
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.5)',
                boxShadow:
                  '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)',
                width: '160px',
                height: '90px',
              }}
            >
              <img
                src={preview.dataUrl}
                alt={PHOTO_MODE_LABELS.previewAlt}
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 backdrop-blur-sm">
                <span className="text-[8px] font-mono text-cyan-400/80">{formatRealClockTime()}</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
