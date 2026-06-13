
/* ─── Volodka RPG – Scene Transition Progress Bar ─── */
/* Real milestone progress via TransitionDirector (unload → enter → loaded). */

import { motion, AnimatePresence } from 'framer-motion';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useTransitionDirector } from '@/hooks/useTransitionDirector';

const BAR_HEIGHT_PX = 3;
const CYAN = 'var(--cyber-cyan)';
const EMERALD = '#34d399';
const CYAN_GLOW = 'rgb(var(--cyber-cyan-rgb) / 0.35)';
const EMERALD_GLOW = 'rgba(52, 211, 153, 0.35)';

export function SceneTransitionProgress() {
  const { phase, progress, targetScene } = useTransitionDirector();

  const sceneName = targetScene ? (SCENE_CONFIG[targetScene]?.name ?? targetScene) : '';
  const isComplete = phase === 'complete';

  return (
    <AnimatePresence>
      {phase !== 'idle' && (
        <motion.div
          key="scene-transition-progress"
          className="fixed inset-x-0 top-0 pointer-events-none"
          style={{ zIndex: UI_LAYERS.HUD + 3 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress}
          aria-label={sceneName ? `Загрузка: ${sceneName}` : 'Загрузка сцены'}
        >
          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${BAR_HEIGHT_PX + 28}px`,
              background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.55) 0%, rgba(0, 0, 0, 0.2) 60%, transparent 100%)',
            }}
          />

          <div
            className="absolute inset-x-0 top-0 overflow-hidden"
            style={{ height: `${BAR_HEIGHT_PX + 28}px`, opacity: 0.04 }}
          >
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="hex-grid-progress" width="12" height="10.4" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                  <polygon
                    points="6,0 12,3 12,8 6,10.4 0,8 0,3"
                    fill="none"
                    stroke={isComplete ? EMERALD : CYAN}
                    strokeWidth="0.3"
                  />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#hex-grid-progress)" />
            </svg>
          </div>

          <div
            className="absolute inset-x-0 top-0"
            style={{
              height: `${BAR_HEIGHT_PX}px`,
              background: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            <motion.div
              className="absolute inset-y-0 left-0"
              style={{
                background: `linear-gradient(90deg, ${CYAN}, ${isComplete ? EMERALD : CYAN}88, ${EMERALD})`,
                boxShadow: `0 0 8px ${isComplete ? EMERALD_GLOW : CYAN_GLOW}, 0 0 20px ${isComplete ? EMERALD_GLOW : CYAN_GLOW}`,
              }}
              initial={{ width: '0%' }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
            >
              <div className="absolute inset-0 overflow-hidden">
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.15) 45%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.15) 55%, transparent 100%)`,
                    backgroundSize: '250% 100%',
                  }}
                  animate={{ backgroundPosition: ['250% 0', '-250% 0'] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                />
              </div>

              <div
                className="absolute right-0 top-1/2 -translate-y-1/2"
                style={{
                  width: '6px',
                  height: `${BAR_HEIGHT_PX + 4}px`,
                  borderRadius: '50%',
                  background: isComplete ? EMERALD : CYAN,
                  boxShadow: `0 0 6px ${isComplete ? EMERALD : CYAN}, 0 0 12px ${isComplete ? EMERALD_GLOW : CYAN_GLOW}`,
                }}
              />
            </motion.div>
          </div>

          <AnimatePresence>
            {sceneName && (
              <motion.div
                key={`scene-label-${sceneName}`}
                className="absolute top-1 left-0 inset-x-0 flex items-center px-3"
                style={{ height: '20px' }}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <span
                  className="text-[10px] font-mono tracking-wider select-none"
                  style={{
                    color: isComplete ? EMERALD : CYAN,
                    textShadow: `0 0 8px ${isComplete ? EMERALD_GLOW : CYAN_GLOW}`,
                  }}
                >
                  {isComplete ? '✓ ' : ''}
                  Загрузка: {sceneName}
                </span>
                <span
                  className="ml-auto text-[9px] font-mono tabular-nums select-none"
                  style={{
                    color: isComplete ? EMERALD : CYAN,
                    opacity: 0.7,
                  }}
                >
                  {Math.round(progress)}%
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {isComplete && (
              <motion.div
                key="complete-pulse"
                className="absolute inset-x-0 top-0"
                style={{
                  height: `${BAR_HEIGHT_PX}px`,
                  background: EMERALD,
                  boxShadow: `0 0 12px ${EMERALD_GLOW}, 0 0 24px ${EMERALD_GLOW}`,
                }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
