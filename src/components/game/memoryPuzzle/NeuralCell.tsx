import { memo } from 'react';
import { motion } from 'framer-motion';
import { ACCENT_COLOR, ACCENT_RGB, RED_RGB } from '@/engine/minigame/memory/memoryPuzzleConstants';

export type NeuralCellProps = {
  index: number;
  isActive: boolean;
  isWrong: boolean;
  isCorrectWave: boolean;
  isClickable: boolean;
  isFocused: boolean;
  ariaLabel: string;
  onClick: () => void;
  delay?: number;
};

export const NeuralCell = memo(function NeuralCell({
  isActive,
  isWrong,
  isCorrectWave,
  isClickable,
  isFocused,
  ariaLabel,
  onClick,
  delay = 0,
}: NeuralCellProps) {
  return (
    <motion.div
      role="gridcell"
      aria-label={ariaLabel}
      aria-selected={isFocused}
      tabIndex={isFocused ? 0 : -1}
      className="relative flex items-center justify-center rounded-lg select-none outline-none"
      style={{
        width: '100%',
        aspectRatio: '1',
        background: isActive
          ? `rgba(${ACCENT_RGB}, 0.2)`
          : isWrong
            ? `rgba(${RED_RGB}, 0.2)`
            : 'rgba(15, 23, 42, 0.6)',
        border: `1.5px solid ${
          isFocused
            ? `rgba(${ACCENT_RGB}, 0.9)`
            : isActive
              ? `rgba(${ACCENT_RGB}, 0.7)`
              : isWrong
                ? `rgba(${RED_RGB}, 0.8)`
                : isCorrectWave
                  ? `rgba(${ACCENT_RGB}, 0.5)`
                  : 'rgba(51, 65, 85, 0.4)'
        }`,
        boxShadow: isActive
          ? `0 0 20px rgba(${ACCENT_RGB}, 0.4), inset 0 0 15px rgba(${ACCENT_RGB}, 0.15)`
          : isWrong
            ? `0 0 20px rgba(${RED_RGB}, 0.4), inset 0 0 15px rgba(${RED_RGB}, 0.15)`
            : isCorrectWave
              ? `0 0 12px rgba(${ACCENT_RGB}, 0.2), inset 0 0 8px rgba(${ACCENT_RGB}, 0.08)`
              : isFocused
                ? `0 0 12px rgba(${ACCENT_RGB}, 0.35)`
                : '0 0 2px rgba(0,0,0,0.3)',
        cursor: isClickable ? 'pointer' : 'default',
      }}
      animate={
        isActive
          ? {
              scale: [1, 1.08, 1],
              boxShadow: [
                `0 0 15px rgba(${ACCENT_RGB}, 0.3), inset 0 0 10px rgba(${ACCENT_RGB}, 0.1)`,
                `0 0 30px rgba(${ACCENT_RGB}, 0.6), inset 0 0 20px rgba(${ACCENT_RGB}, 0.25)`,
                `0 0 15px rgba(${ACCENT_RGB}, 0.3), inset 0 0 10px rgba(${ACCENT_RGB}, 0.1)`,
              ],
            }
          : isWrong
            ? { x: [0, -4, 4, -4, 4, 0], scale: [1, 0.95, 1.05, 0.95, 1] }
            : isCorrectWave
              ? { scale: [1, 1.05, 1] }
              : {}
      }
      transition={
        isActive
          ? { duration: 0.4, ease: 'easeInOut' }
          : isWrong
            ? { duration: 0.4, ease: 'easeInOut' }
            : isCorrectWave
              ? { duration: 0.3, delay, ease: 'easeOut' }
              : {}
      }
      onClick={isClickable ? onClick : undefined}
      whileHover={isClickable ? { scale: 1.06 } : {}}
      whileTap={isClickable ? { scale: 0.94 } : {}}
    >
      <span
        className="relative z-10 font-mono text-sm"
        style={{
          color: isActive
            ? ACCENT_COLOR
            : isWrong
              ? `rgba(${RED_RGB}, 0.9)`
              : isCorrectWave
                ? `rgba(${ACCENT_RGB}, 0.6)`
                : 'rgba(71, 85, 105, 0.4)',
          textShadow: isActive
            ? `0 0 10px rgba(${ACCENT_RGB}, 0.5)`
            : isWrong
              ? `0 0 10px rgba(${RED_RGB}, 0.5)`
              : 'none',
        }}
        aria-hidden="true"
      >
        {isActive ? '⬡' : isWrong ? '✕' : '⬡'}
      </span>

      {isActive ? (
        <div className="absolute inset-0 rounded-lg overflow-hidden pointer-events-none" style={{ opacity: 0.4 }}>
          <motion.div
            className="absolute left-0 right-0 h-px"
            style={{
              background: `linear-gradient(90deg, transparent, rgba(${ACCENT_RGB}, 0.6), transparent)`,
            }}
            animate={{ top: ['0%', '100%'] }}
            transition={{ duration: 0.5, ease: 'linear' }}
          />
        </div>
      ) : null}
    </motion.div>
  );
});
