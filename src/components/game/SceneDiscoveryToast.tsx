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
import { SCENE_CONFIG } from '@/config/scenes';
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
    const hasEntryText = Boolean(SCENE_CONFIG[sceneId]?.entryText);
    if (hasEntryText) return;

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
          initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 12 }}
          animate={
            discovery.show
              ? reducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0 }
              : reducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -8 }
          }
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -8 }}
          transition={{ duration: reducedMotion ? 0.15 : 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none select-none"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION - 5 }}
        >
          <div className="hud-filmic-caption px-4">
            <div className="hud-filmic-rule hud-filmic-rule--wide" aria-hidden />
            <div className="flex items-center gap-2">
              <MapPin className="size-3.5 text-stone-500" aria-hidden />
              <span className="hud-filmic-kicker">
                Новое место
              </span>
            </div>
            <span className="hud-filmic-body text-[16px] text-fade-in-up">
              {discovery.sceneName}
            </span>
            <div className="flex items-center gap-1.5">
              <Sparkles className="size-3 text-stone-500" aria-hidden />
              <span className="hud-filmic-kicker" style={{ letterSpacing: '0.1em' }}>
                Открыто {discovery.count} / {TOTAL_SCENES}
              </span>
            </div>
            <div className="hud-filmic-rule hud-filmic-rule--soft" aria-hidden />
            <span className="sr-only">
              Открыто:
              <span>
                {' '}
                {discovery.count} / {TOTAL_SCENES}
              </span>
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}