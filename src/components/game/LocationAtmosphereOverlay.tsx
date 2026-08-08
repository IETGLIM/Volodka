'use client';

/** ─── Volodka RPG – Location Atmosphere Overlay ───
 *
 * Applies a subtle color wash overlay based on current scene ID
 * and time of day. Different palettes per scene type:
 *   - street_night:  cool blue/cyan tint
 *   - volodka_room:  warm amber/orange tint
 *   - underground:   deep purple/indigo tint
 *   - dream:         shifting rainbow/magenta
 *   - default:       neutral dark (no tint)
 *
 * Glass panel at top of screen showing location name + time.
 * Fades in/out on scene transitions.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useExplorationStore } from '@/store/stores/explorationStore';
import { SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { SceneId } from '@/config/sceneDefinitions';

/* ─── Scene palette map ─── */

type SceneCategory = 'street_night' | 'indoor_warm' | 'underground' | 'dream' | 'day_outdoor' | 'default';

interface AtmospherePalette {
  category: SceneCategory;
  /** CSS gradient colors for the overlay */
  gradient: string;
  /** Base opacity at peak time */
  peakOpacity: number;
}

function classifyScene(sceneId: SceneId): SceneCategory {
  if (sceneId === 'street_night' || sceneId === 'pier_evening') return 'street_night';
  if (sceneId === 'volodka_room' || sceneId === 'home_evening' || sceneId === 'solnysh_room' || sceneId === 'zarema_albert_room') return 'indoor_warm';
  if (sceneId === 'factory_basement' || sceneId === 'underground_bunker' || sceneId === 'library_basement' || sceneId === 'guild_mainframe') return 'underground';
  if (sceneId === 'sleep_dream') return 'dream';
  if (sceneId === 'park_day' || sceneId === 'office_day' || sceneId === 'library_day' || sceneId === 'chk_forest_zorge') return 'day_outdoor';
  return 'default';
}

const PALETTES: Record<SceneCategory, AtmospherePalette> = {
  street_night: {
    category: 'street_night',
    gradient: 'linear-gradient(180deg, rgba(0,229,255,0.08) 0%, rgba(0,150,200,0.04) 40%, transparent 100%)',
    peakOpacity: 0.6,
  },
  indoor_warm: {
    category: 'indoor_warm',
    gradient: 'linear-gradient(180deg, rgba(255,170,50,0.06) 0%, rgba(255,120,30,0.03) 40%, transparent 100%)',
    peakOpacity: 0.5,
  },
  underground: {
    category: 'underground',
    gradient: 'linear-gradient(180deg, rgba(120,60,200,0.07) 0%, rgba(80,30,160,0.04) 40%, transparent 100%)',
    peakOpacity: 0.7,
  },
  dream: {
    category: 'dream',
    gradient: 'linear-gradient(180deg, rgba(200,50,255,0.06) 0%, rgba(255,50,150,0.04) 40%, transparent 100%)',
    peakOpacity: 0.8,
  },
  day_outdoor: {
    category: 'day_outdoor',
    gradient: 'linear-gradient(180deg, rgba(255,240,200,0.04) 0%, transparent 60%)',
    peakOpacity: 0.3,
  },
  default: {
    category: 'default',
    gradient: 'transparent',
    peakOpacity: 0,
  },
};

/* ─── Time helpers ─── */

/** Returns a 0-1 multiplier: 1 at midnight, 0 at noon. */
function nightIntensity(hour: number): number {
  // Night peaks at 0 (midnight) and 24, day peaks at 12.
  // Smooth cosine: cos(hour/24 * 2π) maps noon→1, midnight→-1.
  const normalized = ((hour % 24) + 24) % 24;
  return (1 - Math.cos((normalized / 24) * Math.PI * 2)) / 2;
}

/** Format time of day as HH:MM in Russian convention. */
function formatTime(hour: number): string {
  const h = Math.floor(((hour % 24) + 24) % 24);
  const m = Math.floor((hour - Math.floor(hour)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/** Time-of-day label in Russian. */
function timeLabel(hour: number): string {
  const h = ((hour % 24) + 24) % 24;
  if (h >= 5 && h < 9) return 'Раннее утро';
  if (h >= 9 && h < 12) return 'Утро';
  if (h >= 12 && h < 14) return 'Полдень';
  if (h >= 14 && h < 17) return 'День';
  if (h >= 17 && h < 20) return 'Вечер';
  if (h >= 20 && h < 23) return 'Ночь';
  return 'Глубокая ночь';
}

/* ─── Component ─── */

export function LocationAtmosphereOverlay() {
  const currentSceneId = useExplorationStore((s) => s.exploration.currentSceneId);
  const timeOfDay = useExplorationStore((s) => s.exploration.timeOfDay);

  const [displayedScene, setDisplayedScene] = useState(currentSceneId);
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Scene name from definitions
  const sceneName = useMemo(() => {
    const def = SCENE_DEFINITIONS[currentSceneId];
    return def?.name ?? currentSceneId;
  }, [currentSceneId]);

  const category = useMemo(() => classifyScene(currentSceneId), [currentSceneId]);
  const palette = PALETTES[category];

  // Scene transition: show name briefly
  useEffect(() => {
    if (currentSceneId !== displayedScene) {
      setDisplayedScene(currentSceneId);
      setVisible(true);

      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      hideTimerRef.current = setTimeout(() => {
        setVisible(false);
      }, 3000);

      return () => {
        if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      };
    }
  }, [currentSceneId, displayedScene]);

  // Compute overlay opacity from time of day
  const ni = nightIntensity(timeOfDay);
  const overlayOpacity = palette.peakOpacity * (category === 'dream' ? 0.7 + Math.sin(timeOfDay * 0.5) * 0.3 : ni);

  // Don't render anything for default scenes with no atmosphere
  if (palette.peakOpacity === 0) return null;

  return (
    <>
      {/* Color wash overlay — covers the entire screen */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: UI_LAYERS.NOIR_OVERLAY,
          opacity: overlayOpacity,
          background: palette.gradient,
          transition: 'opacity 2s ease',
        }}
        aria-hidden
      />

      {/* Location name + time banner — top of screen, fades in on transition */}
      <AnimatePresence>
        {visible && (
          <motion.div
            key={displayedScene}
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="fixed top-3 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ zIndex: UI_LAYERS.SCENE_BANNER }}
          >
            <div className="bg-black/50 backdrop-blur-xl border border-cyan-500/15 rounded-lg px-4 py-1.5 flex items-center gap-3">
              <span className="text-xs font-mono tracking-wider text-cyan-300/80">
                {sceneName}
              </span>
              <span className="w-px h-3 bg-cyan-500/20" aria-hidden />
              <span className="text-[10px] font-mono text-cyan-400/50 tabular-nums">
                {formatTime(timeOfDay)}
              </span>
              <span className="text-[10px] font-mono text-cyan-400/35">
                {timeLabel(timeOfDay)}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
