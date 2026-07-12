import { memo } from 'react';
import { HACKING_GRID_SIZE } from '@/engine/minigame/hacking/hackingGameConfig';
import type { GridNode, GridPosition, MovePacket } from '@/engine/minigame/hacking/hackingGameTypes';
import { HackingGameGridLines } from '@/components/game/hacking/HackingGameGridLines';
import { HackingNetworkNode } from '@/components/game/hacking/HackingNetworkNode';

interface HackingGameGridProps {
  grid: GridNode[][];
  path: GridPosition[];
  movePacket: MovePacket | null;
  playerPos: GridPosition;
  scannerPositions: Set<string>;
  reachableNodes: Set<string>;
  pathSet: Set<string>;
  dataCollected: readonly string[];
  onMove: (row: number, col: number) => void;
}

export const HackingGameGrid = memo(function HackingGameGrid({
  grid,
  path,
  movePacket,
  playerPos,
  scannerPositions,
  reachableNodes,
  pathSet,
  dataCollected,
  onMove,
}: HackingGameGridProps) {
  const dataCollectedSet = new Set(dataCollected);

  return (
    <div className="relative">
      <HackingGameGridLines grid={grid} path={path} movePacket={movePacket} />

      <div
        role="grid"
        aria-label="Сетевая карта для взлома"
        className="grid gap-1.5 relative"
        style={{
          gridTemplateColumns: `repeat(${HACKING_GRID_SIZE}, 1fr)`,
          zIndex: 2,
        }}
      >
        {Array.from({ length: HACKING_GRID_SIZE }).map((_, row) =>
          Array.from({ length: HACKING_GRID_SIZE }).map((_, col) => {
            const node = grid[row][col];
            const key = `${row}-${col}`;
            const isPlayerHere = playerPos.row === row && playerPos.col === col;
            const isScannerHere = scannerPositions.has(key) && !isPlayerHere;

            return (
              <HackingNetworkNode
                key={node.id}
                node={node}
                isPlayerHere={isPlayerHere}
                isScannerHere={isScannerHere}
                isPath={pathSet.has(key) && !isPlayerHere}
                isReachable={reachableNodes.has(key)}
                isDataCollected={dataCollectedSet.has(key)}
                onClick={() => onMove(row, col)}
              />
            );
          }),
        )}
      </div>
    </div>
  );
});
