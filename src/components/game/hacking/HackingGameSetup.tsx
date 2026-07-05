import { motion } from 'framer-motion';
import { HACKING_DIFFICULTY_CONFIG } from '@/engine/minigame/hacking/hackingGameConfig';
import type { HackingDifficulty } from '@/engine/minigame/hacking/hackingGameTypes';
import {
  HACKING_ACCENT_COLOR,
  HACKING_ACCENT_RGB,
  HACKING_CYAN_COLOR,
} from '@/components/game/hacking/hackingGamePresentation';

interface HackingGameSetupProps {
  difficulty: HackingDifficulty;
  onSelectDifficulty: (difficulty: HackingDifficulty) => void;
  onStart: () => void;
}

export function HackingGameSetup({ difficulty, onSelectDifficulty, onStart }: HackingGameSetupProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="text-center py-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
        className="text-4xl mb-4"
        aria-hidden="true"
      >
        🔓
      </motion.div>

      <h3
        className="text-xl font-bold font-mono tracking-widest uppercase mb-2"
        style={{ color: HACKING_ACCENT_COLOR }}
      >
        Сетевой взлом
      </h3>
      <p className="text-xs font-mono mb-6" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
        Пройдите через сеть к целевому серверу, избегая файрволов и сканеров
      </p>

      <div className="space-y-3 mb-6" role="radiogroup" aria-label="Сложность взлома">
        {(Object.entries(HACKING_DIFFICULTY_CONFIG) as [HackingDifficulty, (typeof HACKING_DIFFICULTY_CONFIG)[HackingDifficulty]][]).map(
          ([key, cfg]) => (
            <motion.button
              key={key}
              type="button"
              role="radio"
              aria-checked={difficulty === key}
              onClick={() => onSelectDifficulty(key)}
              className="w-full px-4 py-3 rounded-md text-left transition-all duration-200"
              style={{
                background: difficulty === key ? `rgba(${HACKING_ACCENT_RGB}, 0.12)` : 'rgba(0, 0, 0, 0.3)',
                border: `1.5px solid ${difficulty === key ? `rgba(${HACKING_ACCENT_RGB}, 0.5)` : 'rgba(71, 85, 105, 0.2)'}`,
                boxShadow: difficulty === key ? `0 0 15px rgba(${HACKING_ACCENT_RGB}, 0.15)` : 'none',
              }}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="font-mono text-sm font-bold tracking-wider uppercase"
                  style={{
                    color: difficulty === key ? HACKING_ACCENT_COLOR : 'rgba(148, 163, 184, 0.6)',
                  }}
                >
                  {cfg.label}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
                  BW: {cfg.bandwidth}
                </span>
              </div>
              <p className="font-mono text-[10px] mt-1 text-left" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                {cfg.description}
              </p>
              <div className="flex items-center gap-3 mt-2">
                <span className="font-mono text-[10px]" style={{ color: 'rgba(239, 68, 68, 0.6)' }}>
                  🛡 {cfg.firewalls}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(34, 197, 94, 0.6)' }}>
                  ◆ {cfg.dataNodes}
                </span>
                <span className="font-mono text-[10px]" style={{ color: 'rgba(251, 146, 60, 0.6)' }}>
                  ◉ {cfg.scanners}
                </span>
              </div>
            </motion.button>
          ),
        )}
      </div>

      <motion.button
        type="button"
        onClick={onStart}
        className="w-full py-3 rounded-md font-mono text-sm tracking-[0.15em] uppercase font-bold"
        style={{
          background: `rgba(${HACKING_ACCENT_RGB}, 0.15)`,
          border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.4)`,
          color: HACKING_ACCENT_COLOR,
          boxShadow: `0 0 15px rgba(${HACKING_ACCENT_RGB}, 0.1)`,
        }}
        whileHover={{
          scale: 1.02,
          backgroundColor: `rgba(${HACKING_ACCENT_RGB}, 0.25)`,
          boxShadow: `0 0 25px rgba(${HACKING_ACCENT_RGB}, 0.2)`,
        }}
        whileTap={{ scale: 0.98 }}
      >
        Начать взлом
      </motion.button>

      <div className="mt-6 grid grid-cols-3 gap-2" aria-hidden="true">
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: HACKING_CYAN_COLOR }}>◈</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Вы</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(168, 85, 247, 0.9)' }}>⬡</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Цель</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(239, 68, 68, 0.8)' }}>🛡</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Файрвол</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(34, 197, 94, 0.9)' }}>◆</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Данные</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="text-xs" style={{ color: 'rgba(251, 146, 60, 0.9)' }}>◉</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Сканер</span>
        </div>
        <div className="flex items-center gap-1.5 justify-center">
          <span className="font-mono text-[10px]" style={{ color: `rgba(${HACKING_ACCENT_RGB}, 0.5)` }}>—</span>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Путь</span>
        </div>
      </div>
    </motion.div>
  );
}
