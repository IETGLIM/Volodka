/* ─── Volodka RPG – Scene Discovery Celebration ───
 * Brief toast notification shown when the player discovers
 * a new scene for the first time.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Sparkles } from 'lucide-react';
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
        // Clear any existing timer
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
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: -20, scale: 0.9, filter: 'blur(4px)' }}
            animate={reducedMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12, scale: 0.95, filter: 'blur(2px)' }}
            transition={{
              duration: reducedMotion ? 0.15 : 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-xl"
            style={{
              background: 'linear-gradient(135deg, rgba(2,6,23,0.92) 0%, rgba(8,18,28,0.88) 50%, rgba(0,8,16,0.92) 100%)',
              borderColor: 'rgba(52,211,153,0.35)',
              boxShadow: '0 0 20px rgba(52,211,153,0.15), 0 0 40px rgba(52,211,153,0.05), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(52,211,153,0.1)',
            }}
          >
            {/* Location pin icon with pulse */}
            <div className="relative">
              <motion.div
                animate={reducedMotion ? {} : {
                  scale: [1, 1.15, 1],
                }}
                transition={{
                  duration: 1.2,
                  repeat: 2,
                  ease: 'easeInOut',
                }}
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  background: 'rgba(52,211,153,0.12)',
                  border: '1px solid rgba(52,211,153,0.25)',
                  boxShadow: '0 0 10px rgba(52,211,153,0.2)',
                }}
              >
                <MapPin className="size-4 text-emerald-400" style={{ filter: 'drop-shadow(0 0 4px rgba(52,211,153,0.5))' }} />
              </motion.div>
              {/* Sparkle decorations */}
              {!reducedMotion && (
                <>
                  <motion.span
                    className="absolute -top-1 -right-1 text-[10px]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1.2, 0.8] }}
                    transition={{ duration: 1.5, delay: 0.2 }}
                  >
                    ✦
                  </motion.span>
                  <motion.span
                    className="absolute -bottom-0.5 -left-0.5 text-[8px]"
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: [0, 1, 0], scale: [0, 1, 0.6] }}
                    transition={{ duration: 1.2, delay: 0.5 }}
                  >
                    ✧
                  </motion.span>
                </>
              )}
            </div>

            {/* Text content */}
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[9px] font-mono uppercase tracking-[0.15em]"
                  style={{
                    color: 'rgba(52,211,153,0.7)',
                    textShadow: '0 0 6px rgba(52,211,153,0.3)',
                  }}
                >
                  Новая локация!
                </span>
                <Sparkles className="size-3 text-emerald-400/50" />
              </div>
              <span
                className="text-sm font-semibold text-emerald-300"
                style={{
                  textShadow: '0 0 8px rgba(52,211,153,0.3)',
                }}
              >
                {discovery.sceneName}
              </span>
            </div>

            {/* Discovery counter */}
            <div
              className="flex items-center gap-1 px-2 py-1 rounded-md ml-1"
              style={{
                background: 'rgba(52,211,153,0.08)',
                border: '1px solid rgba(52,211,153,0.15)',
              }}
            >
              <span
                className="text-[10px] font-mono font-bold tabular-nums"
                style={{ color: 'rgba(52,211,153,0.8)' }}
              >
                {discoveredCount}/{totalScenes}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}