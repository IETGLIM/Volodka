/* ─── Volodka RPG – Difficulty HUD Indicator ─── */
/* Small badge showing current difficulty. Only in exploration mode.
 * Click to open the difficulty selector. */

import { memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { DIFFICULTY_META } from '@/store/slices/difficultySlice';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGamePhase } from '@/store/selectors/uiSelectors';

export const DifficultyIndicator = memo(function DifficultyIndicator({
  onClick,
}: {
  onClick: () => void;
}) {
  const difficulty = useGameStore((s) => s.difficultySettings.difficulty);
  const phase = useGamePhase();
  const meta = DIFFICULTY_META[difficulty];

  const handleClick = useCallback(() => {
    if (phase === 'exploration') {
      onClick();
    }
  }, [phase, onClick]);

  if (phase !== 'exploration') return null;

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      initial={{ opacity: 0, x: 8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 8 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="pointer-events-auto flex items-center gap-1.5 px-2.5 py-1 rounded-md border font-mono text-[10px] uppercase tracking-wider transition-all hover:scale-105 cursor-pointer"
      style={{
        zIndex: UI_LAYERS.HUD + 1,
        color: meta.color,
        borderColor: meta.color + '30',
        background: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        boxShadow: `0 0 12px ${meta.glowColor}`,
      }}
      aria-label={`Сложность: ${meta.name}`}
      title={meta.name}
    >
      <span className="text-xs">{meta.icon}</span>
      <span style={{ color: meta.color + 'cc' }}>{meta.name}</span>
    </motion.button>
  );
});
