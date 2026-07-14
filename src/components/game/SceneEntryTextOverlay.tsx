
/* ─── Volodka RPG – Scene Entry Text Overlay ───
 *  Cinematic title card that appears briefly when entering a new scene.
 *  Shows the scene name and an atmospheric description (entryText).
 *  Fades in slowly like a movie title card, stays 2.5s, then fades out.
 *  Only appears when the scene has an entryText configured in SCENE_CONFIG.
 */

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SCENE_CONFIG } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { SceneId } from '@/config/sceneIds';

/** How long the text stays visible (ms) before fading out. */
const ENTRY_TEXT_HOLD_MS = 2500;
/** Fade-in duration (seconds). */
const FADE_IN_DURATION = 0.8;
/** Fade-out duration (seconds). */
const FADE_OUT_DURATION = 0.6;

export function SceneEntryTextOverlay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [visible, setVisible] = useState(false);
  const [sceneName, setSceneName] = useState('');
  const [entryText, setEntryText] = useState('');
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const genRef = useRef(0);

  useEffect(() => {
    const unsub = eventBus.on('scene:loaded', ({ sceneId }) => {
      const config = SCENE_CONFIG[sceneId as SceneId];
      if (!config?.entryText) return;

      // Cancel previous hold timer
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      genRef.current += 1;
      const gen = genRef.current;

      setSceneName(config.name);
      setEntryText(config.entryText);
      setVisible(true);

      holdTimerRef.current = setTimeout(() => {
        if (gen !== genRef.current) return;
        setVisible(false);
      }, ENTRY_TEXT_HOLD_MS);
    });

    return () => {
      unsub();
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    };
  }, []);

  const motionFadeIn = reducedMotion ? { duration: 0 } : { duration: FADE_IN_DURATION, ease: 'easeOut' as const };
  const motionFadeOut = reducedMotion ? { duration: 0 } : { duration: FADE_OUT_DURATION, ease: 'easeInOut' as const };

  return (
    <AnimatePresence>
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

          {/* Subtle scanlines */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(0,255,255,0.015) 2px, rgba(0,255,255,0.015) 4px)',
            }}
          />

          {/* Title card content */}
          <div className="relative z-10 flex flex-col items-center gap-4 px-6 max-w-lg">
            {/* Top decorative line */}
            <motion.div
              className="w-24 sm:w-36 h-px origin-center"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.5), transparent)',
              }}
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: reducedMotion ? 0 : 1.2, delay: 0.1, ease: 'easeOut' }}
            />

            {/* Scene name */}
            <motion.h2
              className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-[0.14em] text-center"
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                color: 'rgba(255,255,255,0.96)',
                textShadow: '0 0 40px rgba(0,255,255,0.3), 0 2px 12px rgba(0,0,0,0.85)',
              }}
              initial={{ opacity: 0, y: 16, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -8, filter: 'blur(4px)' }}
              transition={{ duration: FADE_IN_DURATION, delay: 0.15, ease: 'easeOut' }}
            >
              {sceneName}
            </motion.h2>

            {/* Atmospheric entry text */}
            <motion.p
              className="text-sm sm:text-base text-center tracking-wide italic"
              style={{
                fontFamily: '"Georgia", "Times New Roman", serif',
                color: 'rgba(200, 210, 230, 0.65)',
                textShadow: '0 0 20px rgba(0,255,255,0.12)',
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
                background: 'linear-gradient(90deg, transparent, rgba(0,255,255,0.3), transparent)',
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
