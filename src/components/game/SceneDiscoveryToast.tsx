'use client';

/* ─── Volodka RPG – Glassmorphism Location Discovered Toast ───
 *  Shows a polished glassmorphism popup when the player discovers
 *  a new location for the first time: "Новое место: [Location Name]"
 *  with location icon, brief description, and progress counter.
 *  Uses framer-motion for fade-in/out.
 *  Listens to the 'exploration:scene_discovered' event bus event
 *  (same event used by SceneDiscoveryCelebration).
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { CORE_SCENE_IDS } from '@/config/sceneIds';
import { useDiscoveredScenes } from '@/store/selectors/explorationSelectors';

const DISPLAY_DURATION_MS = 4000;

interface DiscoveryData {
  sceneName: string;
  sceneId: string;
}

export function SceneDiscoveryToast() {
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
      if (!payload.sceneName) return;

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
      className="fixed top-20 right-4 sm:top-24 sm:right-6 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD + 5 }}
      aria-live="polite"
    >
      <AnimatePresence>
        {discovery && (
          <motion.div
            key={`discovery-toast-${discovery.sceneId}`}
            className="location-discovered-toast"
            initial={reducedMotion
              ? { opacity: 1, x: 0 }
              : { opacity: 0, x: 40, scale: 0.95 }
            }
            animate={reducedMotion
              ? { opacity: 1, x: 0 }
              : { opacity: 1, x: 0, scale: 1 }
            }
            exit={reducedMotion
              ? { opacity: 0 }
              : { opacity: 0, x: 30, scale: 0.97 }
            }
            transition={{
              duration: reducedMotion ? 0.15 : 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {/* Top accent bar */}
            <motion.div
              className="location-discovered-toast__accent-bar"
              initial={reducedMotion ? { scaleX: 1 } : { scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{
                duration: reducedMotion ? 0 : 0.6,
                delay: reducedMotion ? 0 : 0.1,
                ease: [0.16, 1, 0.3, 1],
              }}
            />

            <div className="location-discovered-toast__content">
              {/* Icon */}
              <div className="location-discovered-toast__icon-wrap">
                <MapPin
                  className="size-4"
                  style={{ color: '#00e5ff' }}
                  strokeWidth={2}
                />
              </div>

              {/* Info */}
              <div className="location-discovered-toast__info">
                <span className="location-discovered-toast__label">
                  Новое место
                </span>
                <span className="location-discovered-toast__name">
                  {discovery.sceneName}
                </span>
                <div className="flex items-center gap-1.5">
                  <Sparkles
                    className="size-2.5"
                    style={{ color: '#00e5ff', opacity: 0.5 }}
                  />
                  <span className="location-discovered-toast__progress">
                    {discoveredCount} / {totalScenes} открыто
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
