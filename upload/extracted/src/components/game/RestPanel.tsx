'use client';

/* ─── Volodka RPG – Rest Panel ─── */
/* Simple UI for resting at home to recover energy and reduce stress. */

import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { BedDouble, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface RestPanelProps {
  open: boolean;
  onClose: () => void;
}

export function RestPanel({ open, onClose }: RestPanelProps) {
  const restAtHome = useGameStore((s) => s.restAtHome);
  const energy = useGameStore((s) => s.playerState.energy);
  const stress = useGameStore((s) => s.playerState.stress);
  const currentScene = useGameStore((s) => s.exploration.currentSceneId);

  const canRest = currentScene === 'volodka_room' || currentScene === 'home_evening';

  const handleRest = () => {
    if (!canRest) return;
    restAtHome();
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.PANEL }}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />

          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-80"
          >
            <div className="bg-slate-950/95 border border-cyan-900/30 backdrop-blur-md rounded-lg p-6">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
              >
                <X className="size-4" />
              </button>

              {/* Icon */}
              <div className="flex items-center justify-center mb-4">
                <div className="w-14 h-14 rounded-full bg-slate-900/60 border border-cyan-800/30 flex items-center justify-center float-gentle">
                  <BedDouble className="size-7 text-cyan-400" />
                </div>
              </div>

              {/* Title */}
              <h3 className="text-lg font-semibold text-slate-100 text-center mb-2">
                Отдохнуть?
              </h3>

              {/* Current stats */}
              <div className="text-sm text-slate-400 text-center mb-4 space-y-1">
                <div>Энергия: <span className="text-emerald-400">{energy}/100</span></div>
                <div>Стресс: <span className="text-rose-400">{stress}/100</span></div>
                <div className="terminal-blink text-cyan-400 text-xs mt-1">█</div>
              </div>

              {/* Rest benefits */}
              <div className="bg-slate-900/40 rounded-md p-3 mb-4 text-xs text-slate-400 space-y-1">
                <div className="text-cyan-400 font-medium mb-1 hologram-distort">Эффекты отдыха:</div>
                <div className="text-reveal">✦ Энергия → 100</div>
                <div className="text-reveal" style={{ animationDelay: '0.1s' }}>✦ Стресс −30</div>
                <div className="text-reveal" style={{ animationDelay: '0.2s' }}>✦ Время +8 часов</div>
              </div>

              {!canRest && (
                <div className="text-xs text-rose-400 text-center mb-3">
                  Отдых доступен только дома
                </div>
              )}

              {/* Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 border-slate-700/40 text-slate-400 hover:bg-slate-800/30"
                  onClick={onClose}
                >
                  Нет
                </Button>
                <Button
                  variant="outline"
                  className="flex-1 border-cyan-800/40 text-cyan-400 hover:bg-cyan-900/20"
                  onClick={handleRest}
                  disabled={!canRest}
                >
                  Да, отдохнуть
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
