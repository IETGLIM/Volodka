import { memo, useCallback } from 'react';
import { GRID_SIZE, TOTAL_CELLS } from '@/engine/minigame/memory/memoryPuzzleConstants';
import { buildCellAriaLabel } from '@/engine/minigame/memory/memoryPuzzlePresentation';
import { NeuralCell } from '@/components/game/memoryPuzzle/NeuralCell';

type MemoryPuzzleGridProps = {
  activeCell: number | null;
  wrongCell: number | null;
  correctWave: boolean;
  isClickable: boolean;
  focusedCell: number;
  onCellClick: (index: number) => void;
};

export const MemoryPuzzleGrid = memo(function MemoryPuzzleGrid({
  activeCell,
  wrongCell,
  correctWave,
  isClickable,
  focusedCell,
  onCellClick,
}: MemoryPuzzleGridProps) {
  const handleClick = useCallback(
    (index: number) => () => onCellClick(index),
    [onCellClick],
  );

  return (
    <div
      role="grid"
      aria-label="Нейронная сетка"
      className="grid gap-2 relative"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
    >
      {Array.from({ length: TOTAL_CELLS }).map((_, i) => (
        <NeuralCell
          key={i}
          index={i}
          isActive={activeCell === i}
          isWrong={wrongCell === i}
          isCorrectWave={correctWave}
          isClickable={isClickable}
          isFocused={focusedCell === i}
          ariaLabel={buildCellAriaLabel(i)}
          onClick={handleClick(i)}
          delay={i * 0.04}
        />
      ))}
    </div>
  );
});
