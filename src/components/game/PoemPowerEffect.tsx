
/* ─── Volodka RPG – Poem Power Visual Effect ───
   Full-screen glow effect + text notification when a poem power is activated.
   Listens to the 'poem:power_used' event from the EventBus.
*/

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { getPoemPower } from '@/engine/PoemPowerSystem';

interface ActivePowerNotification {
  id: string;
  powerName: string;
  poemId: string;
  timestamp: number;
}

export function PoemPowerEffect() {
  const [notifications, setNotifications] = useState<ActivePowerNotification[]>([]);

  const handlePowerUsed = useCallback((payload: { poemId: string; powerName: string }) => {
    const notification: ActivePowerNotification = {
      id: `power-fx-${Date.now()}`,
      powerName: payload.powerName,
      poemId: payload.poemId,
      timestamp: Date.now(),
    };

    setNotifications((prev) => [...prev, notification]);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== notification.id));
    }, 3000);
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('poem:power_used', handlePowerUsed);
    return () => unsub();
  }, [handlePowerUsed]);

  const latestNotification = notifications[notifications.length - 1];

  return (
    <>
      {/* Screen glow effect when power is used */}
      <AnimatePresence>
        {latestNotification && (
          <motion.div
            key={`glow-${latestNotification.id}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="fixed inset-0 pointer-events-none"
            style={{ zIndex: UI_LAYERS.HUD }}
          >
            {/* Amber/gold radial glow */}
            <motion.div
              initial={{ opacity: 0.6, scale: 0.8 }}
              animate={{ opacity: 0, scale: 1.2 }}
              transition={{ duration: 2.0, ease: 'easeOut' }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.15) 0%, rgba(251,191,36,0.05) 40%, transparent 70%)',
              }}
            />
            {/* Inner bright flash */}
            <motion.div
              initial={{ opacity: 0.8 }}
              animate={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, rgba(251,191,36,0.25) 0%, transparent 50%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Text notification at the top of the screen */}
      <AnimatePresence>
        {latestNotification && (
          <motion.div
            key={`text-${latestNotification.id}`}
            initial={{ opacity: 0, y: -30, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="fixed top-16 sm:top-20 left-1/2 -translate-x-1/2 pointer-events-none"
            style={{ zIndex: UI_LAYERS.HUD }}
          >
            <div className="flex items-center gap-2.5 px-5 py-3 rounded-xl bg-amber-950/80 border border-amber-500/40 backdrop-blur-md shadow-[0_0_30px_rgba(251,191,36,0.2)]">
              {/* Animated sparkles icon */}
              <motion.div
                animate={{ rotate: [0, 15, -15, 0], scale: [1, 1.2, 1] }}
                transition={{ duration: 0.6, repeat: 2 }}
              >
                <svg className="size-5 text-amber-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L14.09 8.26L20 9.27L15.55 13.97L16.91 20L12 16.9L7.09 20L8.45 13.97L4 9.27L9.91 8.26L12 2Z" />
                </svg>
              </motion.div>
              <div>
                <p className="text-sm font-semibold text-amber-200">Способность активирована</p>
                <p className="text-xs text-amber-400/70">{latestNotification.powerName}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
