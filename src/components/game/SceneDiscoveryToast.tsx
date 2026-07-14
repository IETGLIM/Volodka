/* ─── Volodka RPG – Scene Discovery System ───
   Tracks first-time scene visits and shows a discovery toast.
   Adds to the exploration feel — "New location discovered!"
   Integrates with the existing flag system and event bus.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { MapPin, Sparkles } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { SCENE_IDS, SCENE_DEFINITIONS } from '@/config/sceneDefinitions';
import type { SceneId } from '@/shared/types/game';

const TOTAL_SCENES = SCENE_IDS.length;

/** Get the display name for a scene */
function getSceneDisplayName(sceneId: SceneId): string {
  const def = SCENE_DEFINITIONS[sceneId as keyof typeof SCENE_DEFINITIONS];
  return (def as { name?: string })?.name ?? sceneId;
}

/** Build the flag key for a visited scene */
function visitedFlag(sceneId: string): string {
  return `visited_scene_${sceneId}`;
}

interface DiscoveryState {
  sceneId: SceneId;
  sceneName: string;
  count: number; // total discovered after this one
  show: boolean;
}

const DISPLAY_DURATION = 3500; // ms

export function SceneDiscoveryToast() {
  const reducedMotion = useEffectiveReducedMotion();
  const [discovery, setDiscovery] = useState<DiscoveryState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSceneEnter = useCallback((payload: { sceneId: string }) => {
    const sceneId = payload.sceneId as SceneId;
    const state = useGameStore.getState();
    const flag = visitedFlag(sceneId);

    // Skip if already visited
    if (state.playerState.flags?.[flag]) return;

    // Mark as visited
    state.setFlag(flag, true);

    // Count total visited scenes
    const allFlags = state.playerState.flags ?? {};
    let visitedCount = 0;
    for (const key of Object.keys(allFlags)) {
      if (key.startsWith('visited_scene_') && allFlags[key]) {
        visitedCount++;
      }
    }

    const sceneName = getSceneDisplayName(sceneId) ?? sceneId;

    // Clear any existing timer
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }

    setDiscovery({ sceneId, sceneName, count: visitedCount, show: true });

    timerRef.current = setTimeout(() => {
      setDiscovery((prev) => prev ? { ...prev, show: false } : null);
    }, DISPLAY_DURATION);
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('scene:enter', handleSceneEnter);
    return unsub;
  }, [handleSceneEnter]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <AnimatePresence>
      {discovery && (
        <motion.div
          key={`discovery-${discovery.sceneId}`}
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 30, scale: 0.95 }}
          animate={
            discovery.show
              ? reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
              : reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -10, scale: 0.98 }
          }
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -20 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION - 5 }}
        >
          <div
            className="relative flex flex-col items-center gap-3 px-8 py-5 rounded-xl border overflow-hidden"
            style={{
              background: 'linear-gradient(145deg, rgba(2,6,23,0.92) 0%, rgba(8,12,28,0.88) 100%)',
              borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.35)',
              boxShadow: '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.15), 0 0 80px rgb(var(--cyber-cyan-rgb) / 0.05), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.1)',
              backdropFilter: 'blur(16px)',
              minWidth: '240px',
            }}
          >
            {/* Top scan line */}
            <div
              className="absolute top-0 left-0 right-0 h-px"
              style={{
                background: 'linear-gradient(90deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.6), transparent)',
                boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.4)',
              }}
            />

            {/* Corner brackets */}
            <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t border-l border-cyan-400/40 pointer-events-none" />
            <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t border-r border-cyan-400/40 pointer-events-none" />
            <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b border-l border-cyan-400/40 pointer-events-none" />
            <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b border-r border-cyan-400/40 pointer-events-none" />

            {/* Icon + label */}
            <div className="flex items-center gap-2.5">
              <div
                className="flex items-center justify-center w-8 h-8 rounded-lg"
                style={{
                  background: 'rgb(var(--cyber-cyan-rgb) / 0.1)',
                  boxShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.2)',
                }}
              >
                <MapPin className="size-4 text-cyan-400" />
              </div>
              <span
                className="text-[10px] font-mono uppercase tracking-[0.25em] text-cyan-400/70"
                style={{ textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)' }}
              >
                Новое место
              </span>
            </div>

            {/* Scene name */}
            <span
              className="text-lg font-bold text-cyan-100 tracking-wide text-center text-fade-in-up"
              style={{ textShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)' }}
            >
              {discovery.sceneName}
            </span>

            {/* Discovery count */}
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono">
              <Sparkles className="size-3 text-amber-400/70" />
              <span>
                Открыто: <span className="text-cyan-300">{discovery.count}</span>
                <span className="text-slate-500"> / {TOTAL_SCENES}</span>
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-1 bg-slate-800/80 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: 'linear-gradient(90deg, rgb(var(--cyber-cyan-rgb) / 0.6), rgb(var(--cyber-cyan-rgb) / 0.9))',
                  boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.4)',
                }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, (discovery.count / TOTAL_SCENES) * 100)}%` }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}