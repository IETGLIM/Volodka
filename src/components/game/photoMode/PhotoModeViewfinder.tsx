import { AnimatePresence, motion } from 'framer-motion';
import {
  PHOTO_CORNER_BRACKET_SIZE,
  PHOTO_FILTER_CSS,
  PHOTO_FILTER_LABELS,
  PHOTO_FRAME_LABELS,
  PHOTO_GALLERY_STRIP_MAX,
  PHOTO_MODE_LABELS,
  type PhotoFilterPreset,
  type PhotoFramePreset,
} from '@/engine/photo/photoModeConstants';
import {
  formatRealClockTime,
  getBlinkDotMotion,
  getFlashOverlayTransition,
  getPhotoFilterTitle,
  getPhotoHintTransition,
  getPhotoOverlayTransition,
  getPhotoPreviewTransition,
  isPhotoFilterDesaturated,
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
  framePreset: PhotoFramePreset;
  lightingBoosted: boolean;
  onCapture: () => void;
  onExit: () => void;
  onCycleFilter: () => void;
  onCycleFrame: () => void;
  onSelectHistory?: (entry: PhotoCaptureHistoryEntry) => void;
  onDownloadPreview?: () => void;
  onSharePreview?: () => void;
  onExportGalleryBatch?: () => void;
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
  framePreset,
  lightingBoosted,
  onCapture,
  onExit,
  onCycleFilter: _onCycleFilter,
  onCycleFrame: _onCycleFrame,
  onSelectHistory,
  onDownloadPreview,
  onSharePreview,
  onExportGalleryBatch,
}: PhotoModeViewfinderProps) {
  const blinkDot = getBlinkDotMotion(reducedMotion);
  const isDesaturated = isPhotoFilterDesaturated(filterPreset);
  const accentSolid = isDesaturated ? 'rgb(200, 200, 210)' : 'var(--cyber-cyan)';
  const accent = (alpha: number) =>
    isDesaturated ? `rgb(180 180 190 / ${alpha})` : `rgb(var(--cyber-cyan-rgb) / ${alpha})`;
  const reducedMotionClass = reducedMotion ? 'photo-mode--reduced-motion' : '';
  const filterClass = isDesaturated ? 'photo-mode--noir' : 'photo-mode--neon';
  const liveFilterCss = PHOTO_FILTER_CSS[filterPreset];

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
      {/* A11y live region */}
      <div className="sr-only" aria-live="polite">
        {liveAnnouncement}
      </div>
      <p className="sr-only">{PHOTO_MODE_LABELS.controlsSummary}</p>

      {/* Screen-reader-only buttons */}
      <div className="sr-only pointer-events-auto">
        <button type="button" onClick={onCapture} aria-label={PHOTO_MODE_LABELS.captureAction}>
          {PHOTO_MODE_LABELS.captureAction}
        </button>
        <button type="button" onClick={onExit} aria-label={PHOTO_MODE_LABELS.exitAction}>
          {PHOTO_MODE_LABELS.exitAction}
        </button>
      </div>

      {/* Live filter overlay on canvas */}
      {filterPreset !== 'normal' && (
        <div
          className="absolute inset-0 pointer-events-none photo-filter-overlay"
          style={{ filter: liveFilterCss }}
          aria-hidden="true"
        />
      )}

      {/* Noir-specific desat layers */}
      {filterPreset === 'noir' && <div className="photo-mode-noir-desat" aria-hidden="true" />}
      {filterPreset === 'noir' && <div className="photo-mode-noir-grade" aria-hidden="true" />}
      {filterPreset === 'noir' && <div className="photo-mode-noir-contrast" aria-hidden="true" />}
      {filterPreset === 'noir' && <div className="photo-mode-noir-grain" aria-hidden="true" />}

      {/* Vintage film grain overlay */}
      {filterPreset === 'vintage_film' && <div className="photo-filter-vintage-grain" aria-hidden="true" />}

      {/* Dream bloom glow overlay */}
      {filterPreset === 'dream_bloom' && <div className="photo-filter-dream-glow" aria-hidden="true" />}

      {/* ═══ Frame overlays ═══ */}
      {framePreset === 'cyberpunk_hud' && <CyberpunkHudFrame accent={accent} accentSolid={accentSolid} />}
      {framePreset === 'minimal' && <MinimalFrame accent={accent} accentSolid={accentSolid} />}
      {framePreset === 'letterbox' && <LetterboxFrame />}

      {/* Default viewfinder brackets (when no HUD frame) */}
      {framePreset === 'none' && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div
            className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16"
            style={{
              border: `2px solid ${accent(0.5)}`,
              boxShadow: `0 0 12px ${accent(0.15)}, inset 0 0 12px ${accent(0.05)}`,
            }}
          >
            {/* Four corner brackets */}
            <CornerBracket pos="top-left" accent={accent} accentSolid={accentSolid} />
            <CornerBracket pos="top-right" accent={accent} accentSolid={accentSolid} />
            <CornerBracket pos="bottom-left" accent={accent} accentSolid={accentSolid} />
            <CornerBracket pos="bottom-right" accent={accent} accentSolid={accentSolid} />
          </div>

          {/* Center crosshair */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px viewfinder-pulse" style={{ background: accent(0.3) }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 viewfinder-pulse" style={{ background: accent(0.3) }} />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full viewfinder-pulse" style={{ background: accent(0.6), boxShadow: `0 0 6px ${accent(0.5)}` }} />
          </div>

          {/* Rule-of-thirds guides */}
          <div className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16">
            <div className="absolute top-0 bottom-0 left-1/3 w-px border-l border-dashed" style={{ borderColor: accent(0.1) }} />
            <div className="absolute top-0 bottom-0 left-2/3 w-px border-l border-dashed" style={{ borderColor: accent(0.1) }} />
            <div className="absolute left-0 right-0 top-1/3 h-px border-t border-dashed" style={{ borderColor: accent(0.1) }} />
            <div className="absolute left-0 right-0 top-2/3 h-px border-t border-dashed" style={{ borderColor: accent(0.1) }} />
          </div>
        </div>
      )}

      {/* ═══ Top info bar ═══ */}
      <div className="absolute top-6 sm:top-10 md:top-14 lg:top-18 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
        <motion.span
          className="w-2 h-2 rounded-full"
          style={{ background: accentSolid, boxShadow: `0 0 8px ${accent(0.6)}` }}
          animate={blinkDot.animate}
          transition={blinkDot.transition}
          aria-hidden="true"
        />
        <span className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase photo-filter-title" style={{ color: accentSolid, textShadow: `0 0 12px ${accent(0.5)}, 0 0 24px ${accent(0.2)}` }}>
          {getPhotoFilterTitle(filterPreset)}
        </span>
        {framePreset !== 'none' && (
          <span className="text-[9px] font-mono tracking-wider" style={{ color: accent(0.45) }}>
            · {PHOTO_FRAME_LABELS[framePreset]}
          </span>
        )}
        {lightingBoosted && (
          <span className="text-[9px] font-mono tracking-wider" style={{ color: 'rgb(255 200 50 / 0.6)' }}>
            ☀ ВЫС.КАЧ.
          </span>
        )}
      </div>

      {/* Scene name — bottom left */}
      <div className="absolute bottom-20 sm:bottom-24 left-6 sm:left-10 md:left-14 lg:left-18 pointer-events-none">
        <span className="text-[10px] sm:text-xs font-mono tracking-wider" style={{ color: accent(0.7), textShadow: `0 0 6px ${accent(0.3)}` }}>
          {sceneName}
        </span>
      </div>

      {/* Time — bottom right (above gallery) */}
      <div className="absolute bottom-20 sm:bottom-24 right-6 sm:right-10 md:right-14 lg:right-18 pointer-events-none">
        <span className="text-[10px] sm:text-xs font-mono tabular-nums" style={{ color: accent(0.7), textShadow: `0 0 6px ${accent(0.3)}` }}>
          {timeStr}
        </span>
      </div>

      {/* ═══ Bottom controls bar ═══ */}
      <motion.div
        className="absolute bottom-14 sm:bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 sm:gap-3 pointer-events-none"
        initial={reducedMotion ? false : { opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={getPhotoHintTransition(reducedMotion)}
        aria-hidden="true"
      >
        <div className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm" style={{ borderColor: accent(0.2) }}>
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>{PHOTO_MODE_LABELS.captureHintKey}</kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>{PHOTO_MODE_LABELS.captureHint}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm" style={{ borderColor: accent(0.2) }}>
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>{PHOTO_MODE_LABELS.filterHintKey}</kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>{PHOTO_FILTER_LABELS[filterPreset]}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm" style={{ borderColor: accent(0.2) }}>
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>{PHOTO_MODE_LABELS.frameHintKey}</kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>{PHOTO_FRAME_LABELS[framePreset]}</span>
        </div>
        <div className="flex items-center gap-1 px-2 py-1 rounded border bg-black/40 backdrop-blur-sm" style={{ borderColor: accent(0.2) }}>
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>{PHOTO_MODE_LABELS.exitHintKey}</kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>/</span>
          <kbd className="text-[9px] font-mono" style={{ color: accent(0.8) }}>{PHOTO_MODE_LABELS.exitHintAlt}</kbd>
          <span className="text-[9px] font-mono" style={{ color: accent(0.5) }}>{PHOTO_MODE_LABELS.exitHint}</span>
        </div>
      </motion.div>

      {/* ═══ Flash overlay ═══ */}
      <AnimatePresence>
        {flash && (
          <motion.div
            key="photo-flash"
            className={`absolute inset-0 pointer-events-none ${isDesaturated ? 'bg-zinc-200' : 'bg-white'}`}
            initial={{ opacity: reducedMotion ? 0.35 : 0.9 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={getFlashOverlayTransition(reducedMotion)}
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      {/* ═══ Preview thumbnail (right) ═══ */}
      <AnimatePresence>
        {preview && (
          <motion.div
            key={`preview-${preview.timestamp}`}
            className="absolute bottom-28 sm:bottom-32 right-6 sm:right-10 pointer-events-auto"
            initial={reducedMotion ? false : { opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, scale: 0.9, y: 10 }}
            transition={getPhotoPreviewTransition(reducedMotion)}
          >
            <div className="relative rounded-lg overflow-hidden border-2" style={{ borderColor: accent(0.5), boxShadow: `0 0 16px ${accent(0.3)}, 0 4px 16px rgba(0, 0, 0, 0.5)`, width: '160px', height: '90px' }}>
              <img src={preview.dataUrl} alt={PHOTO_MODE_LABELS.previewAlt} className="w-full h-full object-cover" />
              <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 backdrop-blur-sm flex items-center justify-between gap-1">
                <span className="text-[8px] font-mono" style={{ color: accent(0.8) }}>{formatRealClockTime()}</span>
                <div className="flex items-center gap-1">
                  {onDownloadPreview && (
                    <button type="button" onClick={onDownloadPreview} className="text-[8px] font-mono px-1 py-0.5 rounded border bg-black/40" style={{ color: accent(0.9), borderColor: accent(0.35) }} aria-label={PHOTO_MODE_LABELS.downloadAction}>↓</button>
                  )}
                  {onSharePreview && (
                    <button type="button" onClick={onSharePreview} className="text-[8px] font-mono px-1 py-0.5 rounded border bg-black/40" style={{ color: accent(0.9), borderColor: accent(0.35) }} aria-label={PHOTO_MODE_LABELS.shareAction}>↗</button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ═══ Gallery strip (bottom) ═══ */}
      {captureHistory.length > 0 && onSelectHistory && (
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 pointer-events-auto flex items-center gap-2" role="list" aria-label={PHOTO_MODE_LABELS.galleryTitle}>
          <span className="text-[8px] font-mono uppercase tracking-wider" style={{ color: accent(0.55) }}>{PHOTO_MODE_LABELS.galleryTitle}</span>
          {onExportGalleryBatch && captureHistory.length > 1 && (
            <button type="button" onClick={onExportGalleryBatch} className="text-[8px] font-mono px-1.5 py-0.5 rounded border bg-black/40 touch-manipulation min-h-[28px]" style={{ color: accent(0.9), borderColor: accent(0.35) }} aria-label={PHOTO_MODE_LABELS.galleryExportBatch}>{PHOTO_MODE_LABELS.galleryExportBatch}</button>
          )}
          <div className="flex items-center gap-1.5">
            {captureHistory.slice(-PHOTO_GALLERY_STRIP_MAX).map((entry) => (
              <button key={entry.id} type="button" role="listitem" onClick={() => onSelectHistory(entry)} aria-label={`${PHOTO_MODE_LABELS.gallerySelect}: ${entry.sceneName}`} className="rounded border overflow-hidden transition-opacity hover:opacity-100 opacity-80 touch-manipulation photo-gallery-thumb" style={{ width: 48, height: 32, borderColor: accent(0.35), boxShadow: `0 0 8px ${accent(0.12)}` }}>
                <img src={entry.dataUrl} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Frame sub-components
   ══════════════════════════════════════════════════════════════ */

function CornerBracket({ pos, accent, accentSolid }: { pos: string; accent: (a: number) => string; accentSolid: string }) {
  const s = PHOTO_CORNER_BRACKET_SIZE;
  const styles: Record<string, React.CSSProperties> = {
    'top-left': { top: -2, left: -2, borderTop: `2px solid ${accentSolid}`, borderLeft: `2px solid ${accentSolid}`, boxShadow: `-2px -2px 6px ${accent(0.4)}` },
    'top-right': { top: -2, right: -2, borderTop: `2px solid ${accentSolid}`, borderRight: `2px solid ${accentSolid}`, boxShadow: `2px -2px 6px ${accent(0.4)}` },
    'bottom-left': { bottom: -2, left: -2, borderBottom: `2px solid ${accentSolid}`, borderLeft: `2px solid ${accentSolid}`, boxShadow: `-2px 2px 6px ${accent(0.4)}` },
    'bottom-right': { bottom: -2, right: -2, borderBottom: `2px solid ${accentSolid}`, borderRight: `2px solid ${accentSolid}`, boxShadow: `2px 2px 6px ${accent(0.4)}` },
  };
  return <div className="absolute" style={{ ...styles[pos], width: s, height: s }} />;
}

/** Cyberpunk HUD frame — full-screen data overlay with scan lines and corner HUD elements. */
function CyberpunkHudFrame({ accent, accentSolid }: { accent: (a: number) => string; accentSolid: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none photo-cyberpunk-frame" aria-hidden="true">
      {/* Outer border */}
      <div className="absolute inset-3 sm:inset-6 md:inset-8 border border-dashed" style={{ borderColor: accent(0.3) }} />
      <div className="absolute inset-2 sm:inset-5 md:inset-7 border" style={{ borderColor: accent(0.15) }} />
      {/* Top-left HUD data */}
      <div className="absolute top-5 left-5 sm:top-8 sm:left-8">
        <div className="text-[8px] font-mono" style={{ color: accent(0.6) }}>VOLODKA // PHOTO MODE</div>
        <div className="text-[7px] font-mono mt-0.5" style={{ color: accent(0.35) }}>████████░░ 80%</div>
      </div>
      {/* Top-right HUD data */}
      <div className="absolute top-5 right-5 sm:top-8 sm:right-8 text-right">
        <div className="text-[8px] font-mono" style={{ color: accent(0.6) }}>RES: 3840×2160</div>
        <div className="text-[7px] font-mono mt-0.5" style={{ color: accent(0.35) }}>HDR: ON</div>
      </div>
      {/* Bottom-left */}
      <div className="absolute bottom-20 left-5 sm:bottom-24 sm:left-8">
        <div className="text-[7px] font-mono" style={{ color: accent(0.4) }}>▸ БАЛАНС БЕЛОВАЯ 6500К</div>
        <div className="text-[7px] font-mono" style={{ color: accent(0.4) }}>▸ ISO 100 · ƒ/2.8</div>
      </div>
      {/* Corner brackets */}
      <div className="absolute inset-2 sm:inset-5 md:inset-7">
        <CornerBracket pos="top-left" accent={accent} accentSolid={accentSolid} />
        <CornerBracket pos="top-right" accent={accent} accentSolid={accentSolid} />
        <CornerBracket pos="bottom-left" accent={accent} accentSolid={accentSolid} />
        <CornerBracket pos="bottom-right" accent={accent} accentSolid={accentSolid} />
      </div>
      {/* Scan lines */}
      <div className="absolute inset-0 photo-cyberpunk-scanlines" />
    </div>
  );
}

/** Minimal frame — thin clean border with subtle glow. */
function MinimalFrame({ accent, accentSolid }: { accent: (a: number) => string; accentSolid: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute inset-6 sm:inset-12 md:inset-20" style={{ border: `1px solid ${accent(0.25)}`, boxShadow: `0 0 20px ${accent(0.05)}` }} />
      <div className="absolute inset-6 sm:inset-12 md:inset-20">
        <CornerBracket pos="top-left" accent={accent} accentSolid={accentSolid} />
        <CornerBracket pos="top-right" accent={accent} accentSolid={accentSolid} />
        <CornerBracket pos="bottom-left" accent={accent} accentSolid={accentSolid} />
        <CornerBracket pos="bottom-right" accent={accent} accentSolid={accentSolid} />
      </div>
    </div>
  );
}

/** Cinematic letterbox — black bars top and bottom for 2.39:1 aspect. */
function LetterboxFrame() {
  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      <div className="absolute left-0 right-0 top-0 photo-letterbox-bar" />
      <div className="absolute left-0 right-0 bottom-0 photo-letterbox-bar" />
    </div>
  );
}
