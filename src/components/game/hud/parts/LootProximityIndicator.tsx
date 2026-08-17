import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

export function LootProximityIndicator() {
  const [nearLoot, setNearLoot] = useState(false);
  const [lootName, setLootName] = useState('');
  const [lootAcquired, setLootAcquired] = useState(false);
  const [acquiredName, setAcquiredName] = useState('');
  const reducedMotion = useEffectiveReducedMotion();
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const showAcquired = useCallback((name?: string) => {
    setAcquiredName(name || 'Предмет');
    setLootAcquired(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLootAcquired(false), 2000);
  }, []);

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', (data: any) => {
      const name = (data?.name || data?.label || '').toLowerCase();
      const type = (data?.type || '').toLowerCase();
      const isLoot = name.includes('сундук') || name.includes('контейнер') || name.includes('ящик')
        || name.includes('лоот') || type === 'loot' || type === 'container' || type === 'chest';
      if (isLoot) {
        setLootName(data?.name || data?.label || '');
        setNearLoot(true);
      } else {
        setNearLoot(false);
      }
    });

    const unsubEnd = eventBus.on('interaction:end', () => setNearLoot(false));
    const unsubStart = eventBus.on('interaction:start', () => setNearLoot(false));
    const unsubLoot = eventBus.on('loot:reward', (data: any) => {
      showAcquired(data?.itemName || data?.item);
    });

    return () => {
      unsubHint();
      unsubEnd();
      unsubStart();
      unsubLoot();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [showAcquired]);

  return (
    <>
      {/* Loot proximity indicator near crosshair */}
      <AnimatePresence>
        {nearLoot && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 10 }}
            transition={{ duration: reducedMotion ? 0 : 0.3 }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 mt-8 pointer-events-none z-30 hud-filmic-loot-glow-fade"
          >
            <div className="loot-proximity-card flex items-center gap-1.5 px-2.5 py-1 rounded border border-amber-600/30 bg-amber-950/60 backdrop-blur-sm">
              <motion.span
                animate={reducedMotion ? {} : { rotate: [0, 10, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                className="text-sm"
              >
                💎
              </motion.span>
              <span className="text-[10px] text-amber-300/90 font-mono tracking-wide">
                {lootName || 'ДОБЫЧА'}
              </span>
              <div className="loot-proximity-pulse-dot w-1.5 h-1.5 rounded-full bg-amber-400/60" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loot acquired flash */}
      <AnimatePresence>
        {lootAcquired && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: reducedMotion ? 0 : 0.4 }}
            className="absolute top-[30%] left-1/2 -translate-x-1/2 pointer-events-none z-40"
          >
            <div className="loot-acquired-flash flex flex-col items-center gap-1">
              <motion.div
                animate={reducedMotion ? {} : { scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="text-2xl"
              >
                ✨
              </motion.div>
              <span className="loot-acquired-text text-xs text-amber-300 font-mono font-semibold tracking-wider">
                + {acquiredName}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}