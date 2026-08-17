/* ─── Volodka RPG – Enhanced Photo Mode ───
 * Adds: viewfinder guides (rule of thirds, golden ratio),
 * camera controls (zoom, tilt, height), 5 filter presets,
 * vignette, letterbox, screenshot with download + toast.
 * All UI text in Russian. */

import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  captureWebGlCanvasScreenshot,
  formatGameTimeOfDay,
  resolveSceneDisplayName,
} from '@/engine/photo/photoModePresentation';
import { PHOTO_MODE_LABELS, PHOTO_FLASH_DURATION_MS } from '@/engine/photo/photoModeConstants';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { hapticHeavy } from '@/shared/utils/hapticFeedback';
import { useGamePhase, useWeatherIndicatorState } from '@/store/selectors';
import { setPhotoModeActive } from '@/engine/photo/photoModeState';

/* ─── Filter presets ─── */
export type EnhancedPhotoFilter =
  | 'normal'
  | 'noir'
  | 'cyberpunk'
  | 'warm'
  | 'cool'
  | 'dreamy';

const FILTER_DEFINITIONS: Record<EnhancedPhotoFilter, { label: string; css: string }> = {
  normal: {
    label: 'НЕИЗМЕНЁННЫЙ',
    css: 'none',
  },
  noir: {
    label: 'НУАР',
    css: 'grayscale(1) contrast(1.3) brightness(0.85)',
  },
  cyberpunk: {
    label: 'КИБЕРПАНК',
    css: 'saturate(1.4) contrast(1.15) brightness(0.95) hue-rotate(10deg)',
  },
  warm: {
    label: 'ТЕПЛЫЙ',
    css: 'saturate(1.2) sepia(0.15) brightness(1.05) hue-rotate(-10deg)',
  },
  cool: {
    label: 'ХОЛОДНЫЙ',
    css: 'saturate(0.9) brightness(1.05) hue-rotate(20deg)',
  },
  dreamy: {
    label: 'СНОВИДНЫЙ',
    css: 'saturate(1.3) contrast(0.9) brightness(1.1) blur(0.3px)',
  },
};

const FILTER_ORDER: EnhancedPhotoFilter[] = [
  'normal', 'noir', 'cyberpunk', 'warm', 'cool', 'dreamy',
];

/* ─── Viewfinder guides ─── */
type GuideType = 'thirds' | 'golden' | 'none';

const GUIDE_LABELS: Record<GuideType, string> = {
  thirds: 'ПРАВИЛО ТРЕТЕЙ',
  golden: 'ЗОЛОТОЕ СЕЧЕНИЕ',
  none: 'БЕЗ НАЛОЖЕНИЙ',
};

const GUIDE_ORDER: GuideType[] = ['thirds', 'golden', 'none'];

/* ─── Photo filename ─── */
function photoFilename(): string {
  const d = new Date();
  const stamp = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
    '-',
    String(d.getHours()).padStart(2, '0'),
    String(d.getMinutes()).padStart(2, '0'),
    String(d.getSeconds()).padStart(2, '0'),
  ].join('');
  return `volodka-photo-${stamp}.png`;
}

/* ─── Component ─── */
export function PhotoModeEnhanced() {
  const gamePhase = useGamePhase();
  const { currentSceneId, timeOfDay } = useWeatherIndicatorState();
  const sceneName = resolveSceneDisplayName(currentSceneId);
  const timeStr = formatGameTimeOfDay(timeOfDay);

  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [filterIdx, setFilterIdx] = useState(0);
  const [guideIdx, setGuideIdx] = useState(0);
  const [vignetteOn, setVignetteOn] = useState(false);
  const [letterboxOn, setLetterboxOn] = useState(false);
  const [zoom, setZoom] = useState(1.0);
  const [tilt, setTilt] = useState(0);
  const [height, setHeight] = useState(0);
  const [frozen, setFrozen] = useState(false);
  const [announcement, setAnnouncement] = useState('');
  const [showControls, setShowControls] = useState(true);

  const activeRef = useRef(active);
  activeRef.current = active;
  const frozenRef = useRef(frozen);
  frozenRef.current = frozen;
  const showControlsRef = useRef(showControls);
  showControlsRef.current = showControls;
  const announcementTimerRef = useRef<number | null>(null);

  const filter = FILTER_ORDER[filterIdx];
  const guide = GUIDE_ORDER[guideIdx];
  const filterDef = FILTER_DEFINITIONS[filter];

  const announce = useCallback((msg: string) => {
    setAnnouncement(msg);
    if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
    announcementTimerRef.current = window.setTimeout(() => setAnnouncement(''), 2500);
  }, []);

  const enterPhotoMode = useCallback(() => {
    if (gamePhase !== 'exploration') return;
    setActive(true);
    setFrozen(true);
    setPhotoModeActive(true);
    announce(PHOTO_MODE_LABELS.entered);
  }, [gamePhase, announce]);

  const exitPhotoMode = useCallback(() => {
    if (!activeRef.current) return;
    setActive(false);
    setFrozen(false);
    setPhotoModeActive(false);
    setZoom(1.0);
    setTilt(0);
    setHeight(0);
    setVignetteOn(false);
    setLetterboxOn(false);
    announce(PHOTO_MODE_LABELS.exited);
  }, [announce]);

  const cycleFilter = useCallback(() => {
    setFilterIdx((i) => {
      const next = (i + 1) % FILTER_ORDER.length;
      announce(FILTER_ORDER[next] === 'normal' ? 'Фильтр сброшен' : FILTER_DEFINITIONS[FILTER_ORDER[next]].label);
      return next;
    });
  }, [announce]);

  const cycleGuide = useCallback(() => {
    setGuideIdx((i) => {
      const next = (i + 1) % GUIDE_ORDER.length;
      announce(GUIDE_LABELS[GUIDE_ORDER[next]]);
      return next;
    });
  }, [announce]);

  const captureScreenshot = useCallback(() => {
    if (!activeRef.current) return;

    hapticHeavy();
    setFlash(true);
    window.setTimeout(() => setFlash(false), PHOTO_FLASH_DURATION_MS);

    const result = captureWebGlCanvasScreenshot();
    if (result.ok) {
      // Apply filter to the captured image
      void applyFilterToDataUrl(result.dataUrl, filter).then((dataUrl) => {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = photoFilename();
        link.rel = 'noopener';
        document.body.appendChild(link);
        link.click();
        link.remove();
      });

      announce(PHOTO_MODE_LABELS.captureSuccess);
      eventBus.emit('game:notification', {
        title: PHOTO_MODE_LABELS.captureSuccess,
        type: 'info' as const,
      });
    } else {
      announce(PHOTO_MODE_LABELS.captureFailed);
    }
  }, [filter, announce]);

  const toggleVignette = useCallback(() => {
    setVignetteOn((v) => {
      announce(v ? 'Виньетка выкл' : 'Виньетка вкл');
      return !v;
    });
  }, [announce]);

  const toggleLetterbox = useCallback(() => {
    setLetterboxOn((v) => {
      announce(v ? 'Леттербокс выкл' : 'Леттербокс вкл');
      return !v;
    });
  }, [announce]);

  // Event bus toggle
  useEffect(() => {
    const unsub = eventBus.on('photo:toggle', () => {
      if (activeRef.current) exitPhotoMode();
      else enterPhotoMode();
    });
    return unsub;
  }, [enterPhotoMode, exitPhotoMode]);

  // Keyboard
  useEffect(() => {
    if (!active) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if (e.code === 'Escape' || e.code === 'KeyP') {
        e.preventDefault();
        e.stopPropagation();
        exitPhotoMode();
        return;
      }
      if (e.code === 'KeyN') {
        e.preventDefault();
        e.stopPropagation();
        cycleFilter();
        return;
      }
      if (e.code === 'KeyG') {
        e.preventDefault();
        e.stopPropagation();
        cycleGuide();
        return;
      }
      if (e.code === 'KeyV') {
        e.preventDefault();
        e.stopPropagation();
        toggleVignette();
        return;
      }
      if (e.code === 'KeyL') {
        e.preventDefault();
        e.stopPropagation();
        toggleLetterbox();
        return;
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        captureScreenshot();
        return;
      }
      if (e.code === 'KeyH') {
        e.preventDefault();
        e.stopPropagation();
        setShowControls((s) => !s);
        return;
      }
      // Zoom: scroll or +/-
      if (e.code === 'Equal' || e.code === 'NumpadAdd') {
        e.preventDefault();
        setZoom((z) => Math.min(2.0, z + 0.1));
      }
      if (e.code === 'Minus' || e.code === 'NumpadSubtract') {
        e.preventDefault();
        setZoom((z) => Math.max(0.5, z - 0.1));
      }
      // Tilt: up/down arrows
      if (e.code === 'ArrowUp') {
        e.preventDefault();
        setTilt((t) => Math.min(15, t + 1));
      }
      if (e.code === 'ArrowDown') {
        e.preventDefault();
        setTilt((t) => Math.max(-15, t - 1));
      }
      // Height: left/right arrows
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        setHeight((h) => Math.min(3, h + 0.2));
      }
      if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setHeight((h) => Math.max(-3, h - 0.2));
      }
    };

    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [active, exitPhotoMode, cycleFilter, cycleGuide, toggleVignette, toggleLetterbox, captureScreenshot]);

  // Mouse wheel zoom
  useEffect(() => {
    if (!active) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -0.05 : 0.05;
      setZoom((z) => Math.min(2.0, Math.max(0.5, z + delta)));
    };
    window.addEventListener('wheel', handleWheel, { passive: false });
    return () => window.removeEventListener('wheel', handleWheel);
  }, [active]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (announcementTimerRef.current) clearTimeout(announcementTimerRef.current);
      if (activeRef.current) setPhotoModeActive(false);
    };
  }, []);

  // Auto-exit if phase changes
  useEffect(() => {
    if (gamePhase !== 'exploration' && activeRef.current) {
      exitPhotoMode();
    }
  }, [gamePhase, exitPhotoMode]);

  const filterStyle: CSSProperties = filter !== 'normal'
    ? { filter: filterDef.css }
    : {};

  return (
    <>
      {/* Filter overlay on the canvas — applied via CSS filter on canvas container */}
      <AnimatePresence>
        {active && frozen && filter !== 'normal' && (
          <div
            key="photo-filter"
            className="fixed inset-0 pointer-events-none"
            style={{
              zIndex: UI_LAYERS.HUD + 1,
              ...filterStyle,
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {active && (
          <motion.div
            key="photo-mode-enhanced"
            className="fixed inset-0"
            style={{ zIndex: UI_LAYERS.LOADING }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            role="dialog"
            aria-modal="true"
            aria-label={PHOTO_MODE_LABELS.dialogLabel}
          >
            {/* A11y live region */}
            <div className="sr-only" aria-live="polite">
              {announcement}
            </div>

            {/* Flash */}
            <AnimatePresence>
              {flash && (
                <motion.div
                  key="flash"
                  className={`absolute inset-0 pointer-events-none ${filter === 'noir' ? 'bg-zinc-200' : 'bg-white'}`}
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: PHOTO_FLASH_DURATION_MS / 1000 }}
                />
              )}
            </AnimatePresence>

            {/* Viewfinder brackets */}
            <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
              <div
                className="absolute inset-8 sm:inset-12 md:inset-16"
                style={{
                  border: '2px solid rgb(0 229 255 / 0.35)',
                  boxShadow:
                    '0 0 16px rgb(0 229 255 / 0.1), inset 0 0 16px rgb(0 229 255 / 0.04)',
                }}
              >
                {/* Corner brackets */}
                {([['top', 'left'], ['top', 'right'], ['bottom', 'left'], ['bottom', 'right']] as const).map(
                  ([v, h]) => (
                    <div
                      key={`${v}-${h}`}
                      className="absolute"
                      style={{
                        [v]: -2,
                        [h]: -2,
                        width: 16,
                        height: 16,
                        borderTop: v === 'top' ? '2px solid #0ef' : 'none',
                        borderBottom: v === 'bottom' ? '2px solid #0ef' : 'none',
                        borderLeft: h === 'left' ? '2px solid #0ef' : 'none',
                        borderRight: h === 'right' ? '2px solid #0ef' : 'none',
                        boxShadow: `${h === 'left' ? '-' : ''}2px ${v === 'top' ? '-' : ''}2px 6px rgb(0 229 255 / 0.4)`,
                      }}
                    />
                  ),
                )}
              </div>

              {/* Rule of thirds */}
              {guide === 'thirds' && (
                <div className="absolute inset-8 sm:inset-12 md:inset-16">
                  <div className="absolute top-0 bottom-0 left-1/3 w-px border-l border-dashed" style={{ borderColor: 'rgb(0 229 255 / 0.12)' }} />
                  <div className="absolute top-0 bottom-0 left-2/3 w-px border-l border-dashed" style={{ borderColor: 'rgb(0 229 255 / 0.12)' }} />
                  <div className="absolute left-0 right-0 top-1/3 h-px border-t border-dashed" style={{ borderColor: 'rgb(0 229 255 / 0.12)' }} />
                  <div className="absolute left-0 right-0 top-2/3 h-px border-t border-dashed" style={{ borderColor: 'rgb(0 229 255 / 0.12)' }} />
                </div>
              )}

              {/* Golden ratio guides */}
              {guide === 'golden' && (
                <div className="absolute inset-8 sm:inset-12 md:inset-16">
                  {/* φ ≈ 0.618, 1-φ ≈ 0.382 */}
                  {[0.382, 0.618].map((pct) => (
                    <div key={`v-${pct}`}>
                      <div className="absolute top-0 bottom-0 w-px" style={{ left: `${pct * 100}%`, borderColor: 'rgb(167 139 250 / 0.15)', borderLeft: '1px dashed' }} />
                      <div className="absolute left-0 right-0 h-px" style={{ top: `${pct * 100}%`, borderColor: 'rgb(167 139 250 / 0.15)', borderTop: '1px dashed' }} />
                    </div>
                  ))}
                </div>
              )}

              {/* Center crosshair */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px" style={{ background: 'rgb(0 229 255 / 0.25)' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8" style={{ background: 'rgb(0 229 255 / 0.25)' }} />
              </div>
            </div>

            {/* Vignette */}
            {vignetteOn && (
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background:
                    'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)',
                }}
              />
            )}

            {/* Letterbox bars */}
            {letterboxOn && (
              <>
                <div className="absolute left-0 right-0 top-0 h-[10%] bg-black pointer-events-none" />
                <div className="absolute left-0 right-0 bottom-0 h-[10%] bg-black pointer-events-none" />
              </>
            )}

            {/* Top info bar */}
            <div className="absolute top-5 sm:top-8 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-none">
              <motion.span
                className="w-2 h-2 rounded-full"
                style={{
                  background: '#0ef',
                  boxShadow: '0 0 8px rgb(0 229 255 / 0.6)',
                }}
                animate={{ opacity: [1, 0.2, 1] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              />
              <span
                className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] uppercase"
                style={{
                  color: '#0ef',
                  textShadow: '0 0 12px rgb(0 229 255 / 0.5), 0 0 24px rgb(0 229 255 / 0.2)',
                }}
              >
                {filterDef.label}
              </span>
              {zoom !== 1.0 && (
                <span className="text-[10px] font-mono text-cyan-400/50">
                  ×{zoom.toFixed(1)}
                </span>
              )}
            </div>

            {/* Scene name — bottom left */}
            <div className="absolute bottom-8 sm:bottom-12 left-6 sm:left-10 pointer-events-none">
              <span
                className="text-[10px] sm:text-xs font-mono tracking-wider"
                style={{
                  color: 'rgb(0 229 255 / 0.6)',
                  textShadow: '0 0 6px rgb(0 229 255 / 0.3)',
                }}
              >
                {sceneName}
              </span>
            </div>

            {/* Time — bottom right */}
            <div className="absolute bottom-8 sm:bottom-12 right-6 sm:right-10 pointer-events-none">
              <span
                className="text-[10px] sm:text-xs font-mono tabular-nums"
                style={{
                  color: 'rgb(0 229 255 / 0.6)',
                  textShadow: '0 0 6px rgb(0 229 255 / 0.3)',
                }}
              >
                {timeStr}
              </span>
            </div>

            {/* Controls panel — bottom center */}
            <AnimatePresence>
              {showControls && (
                <motion.div
                  key="controls"
                  className="absolute bottom-8 sm:bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-2 pointer-events-auto"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ duration: 0.3 }}
                >
                  {/* Screenshot button */}
                  <button
                    type="button"
                    onClick={captureScreenshot}
                    className="relative flex items-center gap-1.5 px-4 py-2 rounded-lg border bg-black/50 backdrop-blur-md transition-all hover:bg-cyan-950/30 active:scale-95"
                    style={{
                      borderColor: 'rgb(0 229 255 / 0.3)',
                      boxShadow: '0 0 12px rgb(0 229 255 / 0.1)',
                    }}
                    aria-label={PHOTO_MODE_LABELS.captureAction}
                  >
                    <span className="w-3 h-3 rounded-full border-2 border-cyan-400" />
                    <span className="text-[10px] font-mono text-cyan-300">SPACE</span>
                  </button>

                  {/* Filter cycle */}
                  <div
                    className="flex items-center gap-1 px-2 py-1.5 rounded border bg-black/40 backdrop-blur-sm"
                    style={{ borderColor: 'rgb(0 229 255 / 0.15)' }}
                  >
                    <kbd className="text-[9px] font-mono text-cyan-400/80">N</kbd>
                    <span className="text-[9px] font-mono text-cyan-400/50">
                      {filterDef.label}
                    </span>
                  </div>

                  {/* Guide cycle */}
                  <div
                    className="flex items-center gap-1 px-2 py-1.5 rounded border bg-black/40 backdrop-blur-sm"
                    style={{ borderColor: 'rgb(0 229 255 / 0.15)' }}
                  >
                    <kbd className="text-[9px] font-mono text-cyan-400/80">G</kbd>
                    <span className="text-[9px] font-mono text-cyan-400/50">
                      {GUIDE_LABELS[guide]}
                    </span>
                  </div>

                  {/* Vignette */}
                  <button
                    type="button"
                    onClick={toggleVignette}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded border bg-black/40 backdrop-blur-sm transition-colors ${vignetteOn ? 'border-amber-500/30' : ''}`}
                    style={{ borderColor: vignetteOn ? 'rgb(255 171 0 / 0.4)' : 'rgb(0 229 255 / 0.15)' }}
                  >
                    <kbd className="text-[9px] font-mono" style={{ color: vignetteOn ? '#ffab00' : 'rgb(0 229 255 / 0.8)' }}>V</kbd>
                    <span className="text-[9px] font-mono" style={{ color: vignetteOn ? 'rgb(255 171 0 / 0.7)' : 'rgb(0 229 255 / 0.5)' }}>ВИН.</span>
                  </button>

                  {/* Letterbox */}
                  <button
                    type="button"
                    onClick={toggleLetterbox}
                    className={`flex items-center gap-1 px-2 py-1.5 rounded border bg-black/40 backdrop-blur-sm transition-colors ${letterboxOn ? 'border-amber-500/30' : ''}`}
                    style={{ borderColor: letterboxOn ? 'rgb(255 171 0 / 0.4)' : 'rgb(0 229 255 / 0.15)' }}
                  >
                    <kbd className="text-[9px] font-mono" style={{ color: letterboxOn ? '#ffab00' : 'rgb(0 229 255 / 0.8)' }}>L</kbd>
                    <span className="text-[9px] font-mono" style={{ color: letterboxOn ? 'rgb(255 171 0 / 0.7)' : 'rgb(0 229 255 / 0.5)' }}>КИН.</span>
                  </button>

                  {/* Exit */}
                  <div
                    className="flex items-center gap-1 px-2 py-1.5 rounded border bg-black/40 backdrop-blur-sm"
                    style={{ borderColor: 'rgb(0 229 255 / 0.15)' }}
                  >
                    <kbd className="text-[9px] font-mono text-cyan-400/80">ESC</kbd>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Zoom/tilt/height indicator (right side) */}
            {showControls && (zoom !== 1.0 || tilt !== 0 || height !== 0) && (
              <div className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 flex flex-col gap-2 pointer-events-none">
                <div className="text-[9px] font-mono text-cyan-400/50 space-y-0.5">
                  {zoom !== 1.0 && <div>ЗУМ ×{zoom.toFixed(1)}</div>}
                  {tilt !== 0 && <div>НАКЛОН {tilt > 0 ? '+' : ''}{tilt}°</div>}
                  {height !== 0 && <div>ВЫСОТА {height > 0 ? '+' : ''}{height.toFixed(1)}</div>}
                </div>
              </div>
            )}

            {/* Announcement toast */}
            <AnimatePresence>
              {announcement && (
                <motion.div
                  key="announcement"
                  className="absolute top-16 sm:top-20 left-1/2 -translate-x-1/2 px-4 py-2 rounded-lg border bg-black/70 backdrop-blur-md"
                  style={{
                    borderColor: 'rgb(0 229 255 / 0.2)',
                    boxShadow: '0 0 20px rgb(0 229 255 / 0.08)',
                  }}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <span className="text-xs font-mono text-cyan-300/80">{announcement}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/* ─── Helper: apply CSS filter to captured screenshot ─── */
function applyFilterToDataUrl(
  dataUrl: string,
  filter: EnhancedPhotoFilter,
): Promise<string> {
  if (filter === 'normal') return Promise.resolve(dataUrl);
  if (typeof document === 'undefined') return Promise.resolve(dataUrl);

  const cssFilter = FILTER_DEFINITIONS[filter].css;

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) { resolve(dataUrl); return; }
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) { resolve(dataUrl); return; }
          canvas.width = w;
          canvas.height = h;
          ctx.filter = cssFilter;
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL('image/png'));
        } catch { resolve(dataUrl); }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch { resolve(dataUrl); }
  });
}
