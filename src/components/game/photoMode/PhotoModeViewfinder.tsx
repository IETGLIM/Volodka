import { AnimatePresence, motion } from 'framer-motion';
import {
  PHOTO_CORNER_BRACKET_SIZE,
  PHOTO_MODE_LABELS,
  type PhotoFilterPreset,
} from '@/engine/photo/photoModeConstants';
import {
  formatRealClockTime,
  getBlinkDotMotion,
  getFlashOverlayTransition,
  getPhotoFilterTitle,
  getPhotoHintTransition,
  getPhotoOverlayTransition,
  getPhotoPreviewTransition,
} from '@/engine/photo/photoModePresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { PhotoPreviewData } from '@/components/game/photoMode/usePhotoModeController';
import type { PhotoCaptureHistoryEntry } from '@/engine/photo/photoCaptureHistory';

type PhotoModeViewfinderProps = {
  flash: boolean;
  preview: PhotoPreviewData | null;
  captureHistory?: PhotoCaptureHistoryEntry[];
  liveAnnouncement: string;
  reducedMotion: boolean;
  sceneName: string;
  timeStr: string;
  filterPreset: PhotoFilterPreset;
  onCapture: () => void;
  onExit: () => void;
  onSelectHistory?: (entry: PhotoCaptureHistoryEntry) => void;
  onDownloadPreview?: () => void;
  onSharePreview?: () => void;
};

export function PhotoModeViewfinder({
  flash,
  preview,
  captureHistory = [],
  liveAnnouncement,
  reducedMotion,
  sceneName,
  timeStr,
  filterPreset,
  onCapture,
  onExit,
  onSelectHistory,
  onDownloadPreview,
  onSharePreview,
}: PhotoModeViewfinderProps) {
  const blinkDot = getBlinkDotMotion(reducedMotion);
  const isNoir = filterPreset === 'noir';
  const accentSolid = isNoir ? 'rgb(200, 200, 210)' : 'var(--cyber-cyan)';
  const accent = (alpha: number) =>
    isNoir ? `rgb(180 180 190 / ${alpha})` : `rgb(var(--cyber-cyan-rgb) / ${alpha})`;
  const reducedMotionClass = reducedMotion ? 'photo-mode--reduced-motion' : '';
  const filterClass = isNoir ? 'photo-mode--noir' : 'photo-mode--neon';

  return (
    <motion.div
      key="photo-mode"
      className={`fixed inset-0 photo-mode-viewfinder ${filterClass} ${reducedMotionClass}`}
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

      {isNoir && <div className="photo-mode-noir-desat" aria-hidden="true" />}
      {isNoir && <div className="photo-mode-noir-grade" aria-hidden="true" />}
      {isNoir && <div className="photo-mode-noir-contrast" aria-hidden="true" />}
      {isNoir && <div className="photo-mode-noir-grain" aria-hidden="true" />}
      {isNoir && <div className="photo-mode-noir-letterbox" aria-hidden="true" />}

      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div
          className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16"
          style={{
            border: `2px solid ${accent(0.5)}`,
            boxShadow: `0 0 12px ${accent(0.15)}, inset 0 0 12px ${accent(0.05)}`,
          }}
        >
          <div
            className="absolute"
            style={{
              top: -2,
              left: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderTop: `2px solid ${accentSolid}`,
              borderLeft: `2px solid ${accentSolid}`,
              boxShadow: `-2px -2px 6px ${accent(0.4)}`,
            }}
          />
          <div
            className="absolute"
            style={{
              top: -2,
              right: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderTop: `2px solid ${accentSolid}`,
              borderRight: `2px solid ${accentSolid}`,
              boxShadow: `2px -2px 6px ${accent(0.4)}`,
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: -2,
              left: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderBottom: `2px solid ${accentSolid}`,
              borderLeft: `2px solid ${accentSolid}`,
              boxShadow: `-2px 2px 6px ${accent(0.4)}`,
            }}
          />
          <div
            className="absolute"
            style={{
              bottom: -2,
              right: -2,
              width: PHOTO_CORNER_BRACKET_SIZE,
              height: PHOTO_CORNER_BRACKET_SIZE,
              borderBottom: `2px solid ${accentSolid}`,
              borderRight: `2px solid ${accentSolid}`,
              boxShadow: `2px 2px 6px ${accent(0.4)}`,
            }}
          />
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px viewfinder-pulse"
            style={{ background: accent(0.3) }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 viewfinder-pulse"
            style={{ background: accent(0.3) }}
          />
          <div
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full viewfinder-pulse"
            style={{
              background: accent(0.6),
              boxShadow: `0 0 6px ${accent(0.5)}`,
            }}
          />
        </div>

        <div className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16">
          <div className="absolute top-0 bottom-0 left-1/3 w-px border-l border-dashed" style={{ borderColor: accent(0.1) }} />
          <div className="absolute top-0 bottom-0 left-2/3 w-px border-l border-dashed" style={{ borderColor: accent(0.1) }} />
          <div className="absolute left-0 right-0 top-1/3 h-px border-t border-dashed" style={{ borderColor: accent(0.1) }} />
          <div className="absolute left-0 right-0 top-2/3 h-px border-t border-dashed" style={{ borderColor: accent(0.1) }} />
        </div>
      </div>

      <div className="absolute top-6 sm:top-10 md:top-14 lg:top-18 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        <motion.span
          className="w-2 h-2 rounded-full"
          style={{
            background: accentSolid,
            boxShadow: `0 0 8px ${accent(0.6)}`,
          }}
          animate={blinkDot.animate}
          transition={blinkDot.transition}
          aria-hidden="true"
        />
        <span
          className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase"
          style={{
            color: accentSolid,
            textShadow: `0 0 12px ${accent(0.5)}, 0 0 24px ${accent(0.2)}`,
          }}
        >
          {getPhotoFilterTitle(filterPreset)}
        </span>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 lg:bottom-18 left-6 sm:left-10 md:left-14 lg:left-18 pointer-events-none">
        <span
          className="text-[10px] sm:text-xs font-mono tracking-wider"
          style={{
            color: accent(0.7),
            textShadow: `0 0 6px ${accent(0.3)}`,
          }}
        >
          {sceneName}
        </span>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 lg:bottom-18 right-6 sm:right-10 md:right-14 lg:right-18 pointer-events-none">
        <span
          className="text-[10px] sm:text-xs font-mono tabular-nums"
          style={{
            color: accent(0.7),
            textShadow: `0 0 6px ${accent(0.3)}`,
          }}
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
        <div
          className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm"
          style={{ borderColor: accent(0.2) }}
        >
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>
            {PHOTO_MODE_LABELS.captureHintKey}
          </kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>
            {PHOTO_MODE_LABELS.captureHint}
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm"
          style={{ borderColor: accent(0.2) }}
        >
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>
            {PHOTO_MODE_LABELS.filterHintKey}
          </kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>
            {isNoir ? PHOTO_MODE_LABELS.filterHintNoir : PHOTO_MODE_LABELS.filterHintNeon}
          </span>
        </div>
        <div
          className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm"
          style={{ borderColor: accent(0.2) }}
        >
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>
            {PHOTO_MODE_LABELS.exitHintKey}
          </kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>/</span>
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>
            {PHOTO_MODE_LABELS.exitHintAlt}
          </kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>
            {PHOTO_MODE_LABELS.exitHint}
          </span>
        </div>
      </motion.div>

      <AnimatePresence>
        {flash && (
          <motion.div
            key="photo-flash"
            className={`absolute inset-0 pointer-events-none ${isNoir ? 'bg-zinc-200' : 'bg-white'}`}
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
                borderColor: accent(0.5),
                boxShadow: `0 0 16px ${accent(0.3)}, 0 4px 16px rgba(0, 0, 0, 0.5)`,
                width: '160px',
                height: '90px',
              }}
            >
              <img
                src={preview.dataUrl}
                alt={PHOTO_MODE_LABELS.previewAlt}
                className={`w-full h-full object-cover ${isNoir ? 'photo-mode-preview-noir' : ''}`}
              />
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 backdrop-blur-sm flex items-center justify-between gap-1">
                <span className="text-[8px] font-mono" style={{ color: accent(0.8) }}>
                  {formatRealClockTime()}
                </span>
                <div className="flex items-center gap-1">
                  {onDownloadPreview && (
                    <button
                      type="button"
                      onClick={onDownloadPreview}
                      className="text-[8px] font-mono px-1 py-0.5 rounded border bg-black/40"
                      style={{ color: accent(0.9), borderColor: accent(0.35) }}
                      aria-label={PHOTO_MODE_LABELS.downloadAction}
                    >
                      ↓
                    </button>
                  )}
                  {onSharePreview && (
                    <button
                      type="button"
                      onClick={onSharePreview}
                      className="text-[8px] font-mono px-1 py-0.5 rounded border bg-black/40"
                      style={{ color: accent(0.9), borderColor: accent(0.35) }}
                      aria-label={PHOTO_MODE_LABELS.shareAction}
                    >
                      ↗
                    </button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {captureHistory.length > 0 && onSelectHistory && (
        <div
          className="absolute bottom-6 left-6 sm:left-10 pointer-events-auto flex flex-col gap-1.5"
          role="list"
          aria-label={PHOTO_MODE_LABELS.galleryTitle}
        >
          <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: accent(0.55) }}>
            {PHOTO_MODE_LABELS.galleryTitle}
          </span>
          <div className="flex items-center gap-1.5">
            {captureHistory.slice(0, 6).map((entry) => (
              <button
                key={entry.id}
                type="button"
                role="listitem"
                onClick={() => onSelectHistory(entry)}
                aria-label={`${PHOTO_MODE_LABELS.gallerySelect}: ${entry.sceneName}`}
                className="rounded border overflow-hidden transition-opacity hover:opacity-100 opacity-80"
                style={{
                  width: 44,
                  height: 28,
                  borderColor: accent(0.35),
                  boxShadow: `0 0 8px ${accent(0.12)}`,
                }}
              >
                <img
                  src={entry.dataUrl}
                  alt=""
                  className={`w-full h-full object-cover ${entry.filter === 'noir' ? 'photo-mode-preview-noir' : ''}`}
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
