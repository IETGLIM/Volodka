
/* ─── Volodka RPG – Photo Mode ───
 * A screenshot capture feature with cyberpunk viewfinder overlay.
 * Toggle via camera button on HUD or Ctrl+P shortcut.
 * While active: hides HUD, shows viewfinder, captures on Space/Enter.
 * On capture: white flash, canvas.toDataURL, preview thumbnail, sound + toast.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { PHOTO_EVENTS, PHOTO_EMPTY_PAYLOAD } from '@/engine/events';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { useGamePhase } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { SCENE_CONFIG } from '@/config/scenes';

/* ─── Types ─── */

interface PreviewData {
  dataUrl: string;
  timestamp: number;
}

/* ─── Constants ─── */

const FLASH_DURATION_MS = 200;
const PREVIEW_DISPLAY_MS = 3000;
const CORNER_BRACKET_SIZE = 16;

/* ─── Shared state for HUD visibility ─── */
/** Other components can read this to decide whether to hide themselves. */
export const photoModeActive = { current: false };

/* ─── Component ─── */

export function PhotoMode() {
  const [active, setActive] = useState(false);
  const [flash, setFlash] = useState(false);
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeRef = useRef(false);

  // ── Current scene info ──
  const currentSceneId = useGameStore((s) => s.exploration.currentSceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const sceneName = SCENE_CONFIG[currentSceneId]?.name ?? 'Неизвестно';

  // ── Timestamp in HH:MM format from game time ──
  const timeStr = `${Math.floor(timeOfDay).toString().padStart(2, '0')}:${((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')}`;

  // ── Real-world timestamp for capture ──
  const getRealTimeStr = useCallback(() => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  }, []);

  // ── Enter photo mode ──
  const enterPhotoMode = useCallback(() => {
    if (readGamePhase(useGameStore.getState()) !== 'exploration') return;
    setActive(true);
    activeRef.current = true;
    photoModeActive.current = true;
    eventBus.emit(PHOTO_EVENTS.active, PHOTO_EMPTY_PAYLOAD);
  }, []);

  // ── Exit photo mode ──
  const exitPhotoMode = useCallback(() => {
    setActive(false);
    activeRef.current = false;
    photoModeActive.current = false;
    eventBus.emit(PHOTO_EVENTS.inactive, PHOTO_EMPTY_PAYLOAD);
  }, []);

  // ── Capture screenshot ──
  const captureScreenshot = useCallback(() => {
    if (!activeRef.current) return;

    // White flash
    setFlash(true);
    setTimeout(() => setFlash(false), FLASH_DURATION_MS);

    // Capture WebGL canvas
    try {
      const canvas = document.querySelector('canvas');
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setPreview({ dataUrl, timestamp: Date.now() });

        // Clear previous preview timer
        if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => setPreview(null), PREVIEW_DISPLAY_MS);
      }
    } catch {
      // Canvas capture may fail if tainted or unavailable
    }

    // Sound feedback
    eventBus.emit('sound:play', { type: 'screenshot' });

    // Toast notification
    eventBus.emit('game:notification', {
      title: '📸 Скриншот сохранён!',
      type: 'info' as const,
    });
  }, []);

  // ── Listen for external toggle (HUD button, Ctrl+P) ──
  useEffect(() => {
    const unsub = eventBus.on(PHOTO_EVENTS.toggle, () => {
      if (activeRef.current) {
        exitPhotoMode();
      } else {
        enterPhotoMode();
      }
    });
    return unsub;
  }, [enterPhotoMode, exitPhotoMode]);

  // ── Keyboard controls inside photo mode ──
  useEffect(() => {
    if (!active) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      if ((e.code === 'KeyP' && !e.ctrlKey && !e.shiftKey) || e.code === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        exitPhotoMode();
      }
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        e.stopPropagation();
        captureScreenshot();
      }
    };

    // Use capture phase to intercept before GameOrchestrator's listener
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [active, exitPhotoMode, captureScreenshot]);

  // ── Cleanup preview timer on unmount ──
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  // ── Ensure photo mode state resets if mode changes away from exploration ──
  const mode = useGamePhase();
  useEffect(() => {
    if (mode !== 'exploration' && activeRef.current) {
      // Defer state update to avoid synchronous setState in effect
      const t = setTimeout(() => exitPhotoMode(), 0);
      return () => clearTimeout(t);
    }
  }, [mode, exitPhotoMode]);

  return (
    <AnimatePresence>
      {active && (
        <motion.div
          key="photo-mode"
          className="fixed inset-0 pointer-events-none photo-mode-viewfinder"
          style={{ zIndex: UI_LAYERS.LOADING }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {/* ── Thin cyan border frame ── */}
          <div
            className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16"
            style={{
              border: '2px solid rgba(34, 211, 238, 0.5)',
              boxShadow: '0 0 12px rgba(34, 211, 238, 0.15), inset 0 0 12px rgba(34, 211, 238, 0.05)',
            }}
          >
            {/* ── Corner brackets ── */}
            {/* Top-left */}
            <div
              className="absolute"
              style={{
                top: -2, left: -2,
                width: CORNER_BRACKET_SIZE, height: CORNER_BRACKET_SIZE,
                borderTop: '2px solid #22d3ee',
                borderLeft: '2px solid #22d3ee',
                boxShadow: '-2px -2px 6px rgba(34, 211, 238, 0.4)',
              }}
            />
            {/* Top-right */}
            <div
              className="absolute"
              style={{
                top: -2, right: -2,
                width: CORNER_BRACKET_SIZE, height: CORNER_BRACKET_SIZE,
                borderTop: '2px solid #22d3ee',
                borderRight: '2px solid #22d3ee',
                boxShadow: '2px -2px 6px rgba(34, 211, 238, 0.4)',
              }}
            />
            {/* Bottom-left */}
            <div
              className="absolute"
              style={{
                bottom: -2, left: -2,
                width: CORNER_BRACKET_SIZE, height: CORNER_BRACKET_SIZE,
                borderBottom: '2px solid #22d3ee',
                borderLeft: '2px solid #22d3ee',
                boxShadow: '-2px 2px 6px rgba(34, 211, 238, 0.4)',
              }}
            />
            {/* Bottom-right */}
            <div
              className="absolute"
              style={{
                bottom: -2, right: -2,
                width: CORNER_BRACKET_SIZE, height: CORNER_BRACKET_SIZE,
                borderBottom: '2px solid #22d3ee',
                borderRight: '2px solid #22d3ee',
                boxShadow: '2px 2px 6px rgba(34, 211, 238, 0.4)',
              }}
            />
          </div>

          {/* ── Crosshair at center ── */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
            {/* Horizontal line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-px bg-cyan-400/30 viewfinder-pulse" />
            {/* Vertical line */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-px h-8 bg-cyan-400/30 viewfinder-pulse" />
            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full viewfinder-pulse"
              style={{
                background: 'rgba(34, 211, 238, 0.6)',
                boxShadow: '0 0 6px rgba(34, 211, 238, 0.5)',
              }}
            />
          </div>

          {/* ── Rule of thirds grid ── */}
          <div className="absolute inset-4 sm:inset-8 md:inset-12 lg:inset-16 pointer-events-none">
            {/* Vertical lines */}
            <div className="absolute top-0 bottom-0 left-1/3 w-px border-l border-dashed border-cyan-400/10" />
            <div className="absolute top-0 bottom-0 left-2/3 w-px border-l border-dashed border-cyan-400/10" />
            {/* Horizontal lines */}
            <div className="absolute left-0 right-0 top-1/3 h-px border-t border-dashed border-cyan-400/10" />
            <div className="absolute left-0 right-0 top-2/3 h-px border-t border-dashed border-cyan-400/10" />
          </div>

          {/* ── "PHOTO MODE" text in top-center with blinking dot ── */}
          <div className="absolute top-6 sm:top-10 md:top-14 lg:top-18 left-1/2 -translate-x-1/2 flex items-center gap-2">
            <motion.span
              className="w-2 h-2 rounded-full bg-cyan-400"
              animate={{ opacity: [1, 0.2, 1] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ boxShadow: '0 0 8px rgba(34, 211, 238, 0.6)' }}
            />
            <span
              className="text-xs sm:text-sm font-mono font-bold tracking-[0.2em] text-cyan-400 uppercase"
              style={{ textShadow: '0 0 12px rgba(34, 211, 238, 0.5), 0 0 24px rgba(34, 211, 238, 0.2)' }}
            >
              PHOTO MODE
            </span>
          </div>

          {/* ── Scene name in bottom-left ── */}
          <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 lg:bottom-18 left-6 sm:left-10 md:left-14 lg:left-18">
            <span
              className="text-[10px] sm:text-xs font-mono text-cyan-400/70 tracking-wider"
              style={{ textShadow: '0 0 6px rgba(34, 211, 238, 0.3)' }}
            >
              {sceneName}
            </span>
          </div>

          {/* ── Timestamp in bottom-right ── */}
          <div className="absolute bottom-6 sm:bottom-10 md:bottom-14 lg:bottom-18 right-6 sm:right-10 md:right-14 lg:right-18">
            <span
              className="text-[10px] sm:text-xs font-mono text-cyan-400/70 tabular-nums"
              style={{ textShadow: '0 0 6px rgba(34, 211, 238, 0.3)' }}
            >
              {timeStr}
            </span>
          </div>

          {/* ── Controls hint at bottom-center ── */}
          <motion.div
            className="absolute bottom-6 sm:bottom-10 md:bottom-14 left-1/2 -translate-x-1/2 flex items-center gap-3"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
          >
            <div className="flex items-center gap-1 px-2 py-1 rounded border border-cyan-400/20 bg-black/40 backdrop-blur-sm">
              <kbd className="text-[9px] font-mono text-cyan-400/80">SPACE</kbd>
              <span className="text-[9px] font-mono text-cyan-400/50">снимок</span>
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded border border-cyan-400/20 bg-black/40 backdrop-blur-sm">
              <kbd className="text-[9px] font-mono text-cyan-400/80">P</kbd>
              <span className="text-[9px] font-mono text-cyan-400/50">/</span>
              <kbd className="text-[9px] font-mono text-cyan-400/80">ESC</kbd>
              <span className="text-[9px] font-mono text-cyan-400/50">выход</span>
            </div>
          </motion.div>

          {/* ── White flash overlay on capture ── */}
          <AnimatePresence>
            {flash && (
              <motion.div
                key="photo-flash"
                className="absolute inset-0 bg-white pointer-events-none"
                initial={{ opacity: 0.9 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: FLASH_DURATION_MS / 1000, ease: 'easeOut' }}
                style={{ animation: `flash-white ${FLASH_DURATION_MS}ms ease-out forwards` }}
              />
            )}
          </AnimatePresence>

          {/* ── Preview thumbnail in bottom-right ── */}
          <AnimatePresence>
            {preview && (
              <motion.div
                key={`preview-${preview.timestamp}`}
                className="absolute bottom-20 sm:bottom-24 right-6 sm:right-10 pointer-events-auto"
                initial={{ opacity: 0, scale: 0.8, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: 10 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <div
                  className="relative rounded-lg overflow-hidden border-2"
                  style={{
                    borderColor: 'rgba(34, 211, 238, 0.5)',
                    boxShadow: '0 0 16px rgba(34, 211, 238, 0.3), 0 4px 16px rgba(0, 0, 0, 0.5)',
                    width: '160px',
                    height: '90px',
                  }}
                >
                  {/* data URL screenshot preview — not a static image */}
                  <img
                    src={preview.dataUrl}
                    alt="Screenshot preview"
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay info */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-black/60 backdrop-blur-sm">
                    <span className="text-[8px] font-mono text-cyan-400/80">{getRealTimeStr()}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
