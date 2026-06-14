import { memo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { HACKING_GRID_SIZE } from '@/engine/minigame/hacking/hackingGameConfig';
import type { GridNode, GridPosition, MovePacket } from '@/engine/minigame/hacking/hackingGameTypes';
import { HACKING_CYAN_RGB } from '@/components/game/hacking/hackingGamePresentation';

interface HackingGameGridLinesProps {
  grid: GridNode[][];
  path: GridPosition[];
  movePacket: MovePacket | null;
}

export const HackingGameGridLines = memo(function HackingGameGridLines({
  grid,
  path,
  movePacket,
}: HackingGameGridLinesProps) {
  const gridLines: ReactNode[] = [];

  for (let r = 0; r < HACKING_GRID_SIZE; r++) {
    for (let c = 0; c < HACKING_GRID_SIZE; c++) {
      if (c < HACKING_GRID_SIZE - 1 && grid[r][c].type !== 'firewall' && grid[r][c + 1].type !== 'firewall') {
        gridLines.push(
          <line
            key={`h-${r}-${c}`}
            x1={c * 100 + 50}
            y1={r * 100 + 50}
            x2={(c + 1) * 100 + 50}
            y2={r * 100 + 50}
            stroke="rgba(71, 85, 105, 0.12)"
            strokeWidth="1"
          />,
        );
      }
      if (r < HACKING_GRID_SIZE - 1 && grid[r][c].type !== 'firewall' && grid[r + 1][c].type !== 'firewall') {
        gridLines.push(
          <line
            key={`v-${r}-${c}`}
            x1={c * 100 + 50}
            y1={r * 100 + 50}
            x2={c * 100 + 50}
            y2={(r + 1) * 100 + 50}
            stroke="rgba(71, 85, 105, 0.12)"
            strokeWidth="1"
          />,
        );
      }
    }
  }

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
      viewBox={`0 0 ${HACKING_GRID_SIZE * 100} ${HACKING_GRID_SIZE * 100}`}
      aria-hidden="true"
    >
      {path.length > 1 &&
        path.map((point, index) => {
          if (index === 0) return null;
          const prev = path[index - 1];
          return (
            <motion.line
              key={`path-${index}`}
              x1={prev.col * 100 + 50}
              y1={prev.row * 100 + 50}
              x2={point.col * 100 + 50}
              y2={point.row * 100 + 50}
              stroke={`rgba(${HACKING_CYAN_RGB}, 0.25)`}
              strokeWidth="2"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.3 }}
            />
          );
        })}

      {gridLines}

      {movePacket && (
        <motion.circle
          r="4"
          fill={`rgba(${HACKING_CYAN_RGB}, 0.8)`}
          initial={{
            cx: movePacket.from.col * 100 + 50,
            cy: movePacket.from.row * 100 + 50,
            opacity: 1,
          }}
          animate={{
            cx: movePacket.to.col * 100 + 50,
            cy: movePacket.to.row * 100 + 50,
            opacity: 0,
          }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        />
      )}
    </svg>
  );
});
