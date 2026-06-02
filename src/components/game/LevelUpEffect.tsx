
/* ─── Volodka RPG – Level Up Effect ───
   Dramatic full-screen effect when the player levels up.
   Listens on EventBus for 'player:levelup' event AND watches
   the player store for level changes via useGameStore.
*/

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface LevelUpState {
  newLevel: number;
  prevLevel: number;
  id: string;
  perkPointGained: boolean;
}

/** Number of CSS particle dots for the burst effect */
const PARTICLE_COUNT = 18;

export function LevelUpEffect() {
  const [levelUp, setLevelUp] = useState<LevelUpState | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLevelUp = useCallback((newLevel: number, prevLevel: number, perkPointGained = false) => {
    // Clear any previous timer
    if (timerRef.current) clearTimeout(timerRef.current);

    const id = `levelup-${Date.now()}-${newLevel}`;
    setLevelUp({ newLevel, prevLevel, id, perkPointGained });

    // Auto-dismiss after ~3 seconds
    timerRef.current = setTimeout(() => {
      setLevelUp(null);
    }, 3000);
  }, []);

  // ── Watch EventBus for player:levelup ──
  useEffect(() => {
    const unsub = eventBus.on('player:levelup', (payload) => {
      triggerLevelUp(payload.newLevel, payload.prevLevel, payload.perkPointGained ?? false);
    });
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [triggerLevelUp]);

  // ── Also watch the store for level changes ──
  const storeLevel = useGameStore((s) => s.playerState.progression?.level ?? 1);
  const prevStoreLevel = useRef(storeLevel);

  useEffect(() => {
    if (storeLevel > prevStoreLevel.current) {
      const prev = prevStoreLevel.current;
      prevStoreLevel.current = storeLevel;
      // Defer state update to avoid synchronous setState in effect
      const t = setTimeout(() => triggerLevelUp(storeLevel, prev), 0);
      return () => clearTimeout(t);
    } else if (storeLevel < prevStoreLevel.current) {
      // Level can decrease on load — just sync ref
      prevStoreLevel.current = storeLevel;
    }
  }, [storeLevel, triggerLevelUp]);

  return (
    <AnimatePresence>
      {levelUp && (
        <motion.div
          key={levelUp.id}
          className="fixed inset-0 pointer-events-none level-up-overlay"
          style={{ zIndex: UI_LAYERS.LOADING }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* ── Full-screen golden flash ── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0.7 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.4) 0%, rgba(251,191,36,0.15) 40%, rgba(251,191,36,0.05) 70%, transparent 100%)',
            }}
          />

          {/* ── Ambient glow that pulses amber then fades ── */}
          <motion.div
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.25, 0.15, 0.2, 0] }}
            transition={{ duration: 2.5, ease: 'easeInOut' }}
            style={{
              background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.12) 0%, rgba(251,191,36,0.04) 50%, transparent 80%)',
            }}
          />

          {/* ── Particle burst effect (pure CSS dots) ── */}
          <div className="absolute inset-0 flex items-center justify-center">
            {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
              const angle = (360 / PARTICLE_COUNT) * i;
              const distance = 80 + (i % 3) * 40; // varied distances
              const delay = i * 0.03;
              const size = 3 + (i % 4);
              return (
                <motion.div
                  key={`particle-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    background: i % 2 === 0
                      ? 'rgba(251,191,36,0.9)'
                      : 'rgba(34,211,238,0.8)',
                    boxShadow: i % 2 === 0
                      ? '0 0 6px rgba(251,191,36,0.6)'
                      : '0 0 6px rgba(34,211,238,0.5)',
                  }}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 1,
                  }}
                  animate={{
                    x: Math.cos((angle * Math.PI) / 180) * distance,
                    y: Math.sin((angle * Math.PI) / 180) * distance,
                    opacity: 0,
                    scale: 0.3,
                  }}
                  transition={{
                    duration: 1.2,
                    delay,
                    ease: 'easeOut',
                  }}
                />
              );
            })}
          </div>

          {/* ── Centered "УРОВЕНЬ {n}!" text with scale animation ── */}
          <div className="absolute inset-0 flex items-center justify-center">
            <motion.div
              className="flex flex-col items-center gap-2"
              initial={{ scale: 0.3, opacity: 0 }}
              animate={{ scale: [0.3, 1.15, 1], opacity: [0, 1, 1] }}
              exit={{ scale: 1.1, opacity: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              {/* Top decorative line */}
              <motion.div
                className="h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
                }}
                initial={{ width: 0 }}
                animate={{ width: 180 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              />

              {/* Level up text */}
              <motion.div
                className="px-8 py-3 rounded-xl relative"
                style={{
                  background: 'rgba(0,0,0,0.6)',
                  backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(251,191,36,0.4)',
                  boxShadow: '0 0 40px rgba(251,191,36,0.2), 0 0 80px rgba(251,191,36,0.08), inset 0 0 20px rgba(251,191,36,0.05)',
                }}
              >
                {/* Corner brackets */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-amber-400/40 rounded-tl-md" />
                <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-amber-400/40 rounded-tr-md" />
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b border-l border-amber-400/40 rounded-bl-md" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-amber-400/40 rounded-br-md" />

                <motion.p
                  className="text-3xl sm:text-4xl md:text-5xl font-mono font-black tracking-[0.15em] text-center"
                  style={{
                    color: '#fbbf24',
                    textShadow: '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3), 0 0 60px rgba(251,191,36,0.15)',
                  }}
                  animate={{
                    textShadow: [
                      '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)',
                      '0 0 30px rgba(251,191,36,0.8), 0 0 60px rgba(251,191,36,0.4), 0 0 80px rgba(251,191,36,0.2)',
                      '0 0 20px rgba(251,191,36,0.6), 0 0 40px rgba(251,191,36,0.3)',
                    ],
                  }}
                  transition={{ duration: 1.5, repeat: 1, ease: 'easeInOut' }}
                >
                  УРОВЕНЬ {levelUp.newLevel}!
                </motion.p>
              </motion.div>

              {/* Bottom decorative line */}
              <motion.div
                className="h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
                }}
                initial={{ width: 0 }}
                animate={{ width: 180 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              />

              {/* Subtitle */}
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.4 }}
              >
                <motion.p
                  className="text-sm font-mono tracking-wider text-amber-300/60"
                  style={{ textShadow: '0 0 8px rgba(251,191,36,0.3)' }}
                >
                  +1 очко навыка
                </motion.p>
                {levelUp.perkPointGained && (
                  <motion.p
                    className="text-sm font-mono tracking-wider text-cyan-300/70"
                    style={{ textShadow: '0 0 8px rgba(34,211,238,0.4)' }}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                  >
                    ★ +1 очко черты
                  </motion.p>
                )}
              </motion.div>
            </motion.div>
          </div>

          {/* ── Scan-line sweep across the screen ── */}
          <motion.div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(180deg, transparent 0%, rgba(251,191,36,0.05) 50%, transparent 100%)',
            }}
            initial={{ y: '-100%' }}
            animate={{ y: '100%' }}
            transition={{ duration: 1.5, ease: 'easeInOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
