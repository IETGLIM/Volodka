/* ─── Volodka RPG – Scene Discovery Celebration ───
 * Filmic location caption — no neon toast / sparkle spam.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { CORE_SCENE_IDS } from '@/config/sceneIds';
import { useDiscoveredScenes } from '@/store/selectors/explorationSelectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface DiscoveryData {
  sceneName: string;
  sceneId: string;
}

const DISPLAY_DURATION_MS = 3500;

export function SceneDiscoveryCelebration() {
  const reducedMotion = useEffectiveReducedMotion();
  const discoveredScenes = useDiscoveredScenes();
  const [discovery, setDiscovery] = useState<DiscoveryData | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const getDiscoveredCount = useCallback(() => {
    if (!discoveredScenes) return 0;
    const coreSet = new Set(CORE_SCENE_IDS as unknown as readonly string[]);
    return discoveredScenes.filter((id: string) => coreSet.has(id)).length;
  }, [discoveredScenes]);

  useEffect(() => {
    const unsub = eventBus.on('exploration:scene_discovered', (payload) => {
      if (payload.sceneName) {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
        setDiscovery({
          sceneName: payload.sceneName,
          sceneId: payload.sceneId ?? 'unknown',
        });
        timerRef.current = setTimeout(() => {
          setDiscovery(null);
          timerRef.current = null;
        }, DISPLAY_DURATION_MS);
      }
    });
    return unsub;
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const discoveredCount = getDiscoveredCount();
  const totalScenes = CORE_SCENE_IDS.length;

  return (
    <div
      className="fixed top-24 sm:top-28 left-1/2 -translate-x-1/2 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD + 4 }}
      aria-live="polite"
    >
      <AnimatePresence>
        {discovery && (
          <motion.div
            key={discovery.sceneId}
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
            transition={{
              duration: reducedMotion ? 0.15 : 0.4,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="hud-filmic-caption px-4"
          >
            <div className="hud-filmic-rule hud-filmic-rule--wide" aria-hidden />
            <span className="hud-filmic-kicker">Новая локация · {discoveredCount}/{totalScenes}</span>
            <span className="hud-filmic-body text-[14px] sm:text-[15px]">
              {discovery.sceneName}
            </span>
            <div className="hud-filmic-rule hud-filmic-rule--soft" aria-hidden />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
