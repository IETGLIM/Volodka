
/* ─── Volodka RPG – Scene Entry Text Overlay ───
 *  Cinematic title card that appears briefly when entering a new scene.
 *  Shows the scene name, location category, and an atmospheric description (entryText).
 *  Fades in slowly like a movie title card, stays 2.5s, then fades out.
 *  Only appears when the scene has an entryText configured in SCENE_CONFIG.
 *  DEFERS appearance until SceneTransitionOverlay has fully exited — no overlap.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENE_CONFIG } from '@/config/scenes';
import { getSceneLocationCategory } from '@/config/sceneLocationCategories';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useSceneTransitionOverlayController } from '@/hooks/useSceneTransitionOverlayController';
import type { SceneId } from '@/config/sceneIds';
import type { LocationCategory } from '@/shared/types/locationCategory';

/** How long the text stays visible (ms) before fading out. */
const ENTRY_TEXT_HOLD_MS = 2500;
/** Fade-in duration (seconds). */
const FADE_IN_DURATION = 0.8;

/** Russian labels for location categories — displayed as subtitle. */
const LOCATION_CATEGORY_LABELS: Record<LocationCategory, string> = {
  home: 'ПОМЕЩЕНИЕ',
  cafe: 'ПОМЕЩЕНИЕ',
  office: 'ПОМЕЩЕНИЕ',
  library: 'ПОМЕЩЕНИЕ',
  corridor: 'ПОМЕЩЕНИЕ',
  street: 'УЛИЦА',
  park: 'ПРИРОДА',
  factory: 'ПОМЕЩЕНИЕ',
  rooftop: 'УЛИЦА',
  unknown: 'НЕИЗВЕСТНО',
};

export function SceneEntryTextOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [visible, setVisible] = useState(false);
  const [sceneName, setSceneName] = useState('');
  const [entryText, setEntryText] = useState('');
  const [locationCategoryLabel, setLocationCategoryLabel] = useState('');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);
  const pendingRef = useRef<{ name: string; text: string; categoryLabel: string; gen: number } | null>(null);

  const { isActive: transitionActive } = useSceneTransitionOverlayController();

  // When transition overlay finishes, show pending entry text
  useEffect(() => {
    if (transitionActive) return; // transition still running — wait
    if (!pendingRef.current) return; // no pending data

    const { name, text, categoryLabel, gen } = pendingRef.current;
    if (gen !== genRef.current) return; // stale generation
    pendingRef.current = null;

    setSceneName(name);
    setEntryText(text);
    setLocationCategoryLabel(categoryLabel);
    setVisible(true);

    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    holdTimerRef.current = setTimeout(() => {
      setVisible(false);
    }, ENTRY_TEXT_HOLD_MS);
  }, [transitionActive]);

  // Listen for scene:loaded to queue pending entry text
  useEffect(() => {
    const unsub = eventBus.on('scene:loaded', ({ sceneId }) => {
      const config = SCENE_CONFIG[sceneId as SceneId];
      if (!config?.entryText) return;

      // Cancel previous
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      genRef.current += 1;
      setVisible(false); // hide previous entry text immediately

      // Store pending — we'll show it once transition overlay finishes (or immediately if not active)
      const category = getSceneLocationCategory(sceneId as SceneId);
      const categoryLabel = LOCATION_CATEGORY_LABELS[category] ?? LOCATION_CATEGORY_LABELS.unknown;
      pendingRef.current = { name: config.name, text: config.entryText, categoryLabel, gen: genRef.current };
    });

    return () => {
      unsub();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const motionFadeIn = reducedMotion ? { duration: 0 } : { duration: FADE_IN_DURATION, ease: 'easeOut' as const };

  return (
    <AnimatePresence mode="wait">
      {visible && (
        <motion.div
          key={`scene-entry-${sceneName}`}
          className="fixed inset-0 flex items-center justify-center pointer-events-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION + 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={motionFadeIn}
        >
          {/* Dark vignette backdrop */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.85) 100%)',
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={motionFadeIn}
          />

          {/* Soft film grain wash — no cyan scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.35) 100%)',
            }}
          />

          {/* Title card content */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 max-w-lg">
            {/* Top decorative line */}
            <motion.div
              className="w-24 sm:w-36 h-px origin-center"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(214,211,209,0.45), transparent)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reducedMotion ? 0 : 1.2, delay: 0.1, ease: 'easeOut' }}
            />

            {/* Location category subtitle */}
            {locationCategoryLabel && (
              <motion.span
                className="text-[10px] sm:text-[11px] font-mono font-medium tracking-[0.25em] uppercase text-center"
                style={{
                  color: 'rgba(0, 210, 235, 0.55)',
                  textShadow: '0 0 8px rgba(0, 210, 235, 0.15)',
                }}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.6, delay: 0.05, ease: 'easeOut' }}
              >
                {locationCategoryLabel}
              </motion.span>
            )}

            {/* Scene name */}
            <motion.h2
              className="scene-name-banner text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.14em] text-center"
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                color: 'rgba(245,245,244,0.96)',
                textShadow: '0 2px 14px rgba(0,0,0,0.85)',
                animation: 'none',
              }}
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: FADE_IN_DURATION, delay: 0.15, ease: 'easeOut' }}
            >
              {sceneName}
            </motion.h2>

            {/* Thin cyan accent line under scene name */}
            <motion.div
              className="w-32 sm:w-48 h-px origin-center"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0, 210, 235, 0.5), transparent)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              exit={{ scaleX: 0 }}
              transition={{ duration: reducedMotion ? 0 : 0.8, delay: 0.4, ease: 'easeOut' }}
            />

            {/* Atmospheric entry text */}
            <motion.p
              className="text-sm sm:text-base text-center tracking-wide italic"
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                color: 'rgba(214, 211, 209, 0.72)',
                textShadow: '0 1px 8px rgba(0,0,0,0.7)',
              }}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.9, delay: 0.45, ease: 'easeOut' }}
            >
              {entryText}
            </motion.p>

            {/* Bottom decorative line */}
            <motion.div
              className="w-16 sm:w-24 h-px origin-center"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(168,162,158,0.4), transparent)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reducedMotion ? 0 : 1.2, delay: 0.5, ease: 'easeOut' }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
