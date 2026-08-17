
/* ─── Volodka RPG – Difficulty Selector ─── */
/* 5-card visual difficulty picker with glass morphism.
 * Replaces the old 3-button combat difficulty in SettingsPanel. */

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import {
  type GameDifficulty,
  GAME_DIFFICULTY_ORDER,
  DIFFICULTY_PRESETS,
  DIFFICULTY_META,
} from '@/store/slices/difficultySlice';

interface DifficultySelectorProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Danger meter (5 segments) ─── */
function DangerMeter({ level }: { level: number }) {
  return (
    <div className="flex gap-0.5 mt-2">
      {Array.from({ length: 5 }, (_, i) => (
        <div
          key={i}
          className="h-1.5 flex-1 rounded-full transition-all duration-300"
          style={{
            backgroundColor:
              i <= level
                ? DIFFICULTY_META[GAME_DIFFICULTY_ORDER[Math.min(level, 4)]].color
                : 'rgba(71, 85, 105, 0.25)',
            opacity: i <= level ? 1 : 0.4,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Nightmare confirmation dialog ─── */
function NightmareConfirm({
  onConfirm,
  onCancel,
}: {
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="absolute inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0, 0, 0, 0.85)' }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative max-w-sm w-full mx-4 rounded-lg border border-red-500/40 p-6"
        style={{
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(16px)',
          boxShadow: '0 0 40px rgba(239, 68, 68, 0.15), inset 0 1px 0 rgba(255,255,255,0.05)',
        }}
      >
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex items-center justify-center w-10 h-10 rounded-lg"
            style={{ background: 'rgba(239, 68, 68, 0.15)' }}
          >
            <AlertTriangle className="w-5 h-5 text-red-400" />
          </div>
          <h3 className="font-mono text-sm text-red-300 uppercase tracking-wider">
            Кошмарный режим
          </h3>
        </div>
        <p className="font-mono text-xs text-slate-300 leading-relaxed mb-6">
          Вы уверены? Персонажи будут умирать навсегда.
          Стресс удваивается, враги становятся смертельно опасными.
          Этот выбор нельзя изменить после начала игры.
        </p>
        <div className="flex gap-3 justify-end">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wide border transition-colors"
            style={{
              color: 'rgba(148, 163, 184, 0.8)',
              borderColor: 'rgba(71, 85, 105, 0.4)',
              background: 'rgba(15, 23, 42, 0.6)',
            }}
          >
            Отмена
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-md font-mono text-xs uppercase tracking-wide border transition-colors"
            style={{
              color: '#fecaca',
              borderColor: 'rgba(239, 68, 68, 0.5)',
              background: 'rgba(239, 68, 68, 0.15)',
            }}
          >
            Принять
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ─── Main component ─── */

export function DifficultySelector({ open, onClose }: DifficultySelectorProps) {
  const currentDifficulty = useGameStore((s) => s.difficultySettings.difficulty);
  const setGameDifficulty = useGameStore((s) => s.setGameDifficulty);
  const [nightmarePending, setNightmarePending] = useState(false);

  const handleSelect = useCallback(
    (id: GameDifficulty) => {
      if (id === 'nightmare' && currentDifficulty !== 'nightmare') {
        setNightmarePending(true);
        return;
      }
      setGameDifficulty(id);
    },
    [setGameDifficulty, currentDifficulty],
  );

  const confirmNightmare = useCallback(() => {
    setGameDifficulty('nightmare');
    setNightmarePending(false);
  }, [setGameDifficulty]);

  if (!open) return null;

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-40"
            style={{
              background: 'rgba(0, 0, 0, 0.7)',
              backdropFilter: 'blur(4px)',
            }}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ scale: 0.92, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.92, opacity: 0, y: 20 }}
            transition={{
              duration: 0.35,
              ease: [0.25, 0.46, 0.45, 0.94],
            }}
            className="relative z-50 w-full max-w-3xl mx-4 max-h-[85vh] overflow-y-auto rounded-lg border"
            style={{
              background: 'rgba(15, 23, 42, 0.92)',
              backdropFilter: 'blur(20px)',
              borderColor: 'rgba(100, 116, 139, 0.25)',
              boxShadow: '0 0 60px rgba(6, 182, 212, 0.05), inset 0 1px 0 rgba(255,255,255,0.04)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b" style={{ borderColor: 'rgba(71, 85, 105, 0.3)' }}>
              <div>
                <h2 className="font-mono text-sm text-cyan-300/90 uppercase tracking-[0.2em]">
                  Сложность
                </h2>
                <p className="font-mono text-[10px] text-slate-500 mt-1">
                  Выберите уровень испытаний
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 flex items-center justify-center rounded-md transition-colors border"
                style={{
                  color: 'rgba(148, 163, 184, 0.6)',
                  borderColor: 'rgba(71, 85, 105, 0.3)',
                  background: 'rgba(15, 23, 42, 0.5)',
                }}
                aria-label="Закрыть"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Difficulty cards grid */}
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
              {GAME_DIFFICULTY_ORDER.map((id) => {
                const meta = DIFFICULTY_META[id];
                const preset = DIFFICULTY_PRESETS[id];
                const isActive = currentDifficulty === id;

                return (
                  <motion.button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(id)}
                    whileHover={{ y: -2, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="relative rounded-lg border p-4 text-left transition-all duration-300 cursor-pointer"
                    style={{
                      borderColor: isActive
                        ? meta.color + '80'
                        : 'rgba(71, 85, 105, 0.25)',
                      background: isActive
                        ? `linear-gradient(135deg, rgba(15, 23, 42, 0.9), ${meta.glowColor})`
                        : 'rgba(15, 23, 42, 0.6)',
                      boxShadow: isActive
                        ? `0 0 20px ${meta.glowColor}, inset 0 1px 0 rgba(255,255,255,0.05)`
                        : 'inset 0 1px 0 rgba(255,255,255,0.02)',
                    }}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <div
                        className="absolute -top-px -left-px -right-px h-0.5 rounded-t-lg"
                        style={{
                          background: `linear-gradient(90deg, transparent, ${meta.color}, transparent)`,
                        }}
                      />
                    )}

                    {/* Icon */}
                    <div className="text-2xl mb-2">{meta.icon}</div>

                    {/* Name */}
                    <div
                      className="font-mono text-xs font-semibold uppercase tracking-wider mb-1.5"
                      style={{ color: isActive ? meta.color : 'rgba(203, 213, 225, 0.8)' }}
                    >
                      {meta.name}
                    </div>

                    {/* Description */}
                    <p className="font-mono text-[10px] leading-relaxed" style={{ color: 'rgba(148, 163, 184, 0.7)' }}>
                      {meta.description}
                    </p>

                    {/* Danger meter */}
                    <DangerMeter level={meta.dangerLevel} />

                    {/* Key stats */}
                    <div className="mt-3 grid grid-cols-2 gap-x-2 gap-y-1">
                      <div className="flex justify-between">
                        <span className="font-mono text-[9px] text-slate-500">Урон врагов</span>
                        <span className="font-mono text-[9px]" style={{ color: meta.color }}>
                          {preset.enemyDamageMultiplier}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono text-[9px] text-slate-500">Урон игроку</span>
                        <span className="font-mono text-[9px]" style={{ color: meta.color }}>
                          {preset.playerDamageMultiplier}x
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono text-[9px] text-slate-500">Проверки</span>
                        <span className="font-mono text-[9px]" style={{ color: meta.color }}>
                          {preset.skillCheckThreshold > 0 ? `+${preset.skillCheckThreshold}` : preset.skillCheckThreshold}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-mono text-[9px] text-slate-500">Стресс</span>
                        <span className="font-mono text-[9px]" style={{ color: meta.color }}>
                          {preset.stressAccumulationRate}x
                        </span>
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div
              className="px-5 py-3 border-t"
              style={{ borderColor: 'rgba(71, 85, 105, 0.2)' }}
            >
              <p className="font-mono text-[10px] text-slate-500/70 text-center">
                Сложность сохраняется вместе с игрой. Можно изменить в любой момент.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {nightmarePending && (
          <NightmareConfirm
            onConfirm={confirmNightmare}
            onCancel={() => setNightmarePending(false)}
          />
        )}
      </AnimatePresence>
    </>
  );
}
