import { motion, AnimatePresence } from 'framer-motion';
import { HACKING_DIFFICULTY_CONFIG } from '@/engine/minigame/hacking/hackingGameConfig';
import type { HackingDifficulty, HackingGameState } from '@/engine/minigame/hacking/hackingGameTypes';
import { HackingGameGrid } from '@/components/game/hacking/HackingGameGrid';
import {
  HACKING_ACCENT_COLOR,
  HACKING_ACCENT_RGB,
  HACKING_AMBER_RGB,
  HACKING_CYAN_COLOR,
  HACKING_CYAN_RGB,
  HACKING_GREEN_RGB,
} from '@/components/game/hacking/hackingGamePresentation';

interface HackingGamePlayingProps {
  state: HackingGameState;
  scannerPositions: Set<string>;
  reachableNodes: Set<string>;
  pathSet: Set<string>;
  onMove: (row: number, col: number) => void;
}

export function HackingGamePlaying({
  state,
  scannerPositions,
  reachableNodes,
  pathSet,
  onMove,
}: HackingGamePlayingProps) {
  const config = HACKING_DIFFICULTY_CONFIG[state.difficulty as HackingDifficulty];
  const { bandwidth, turn, dataCollected, scannerAlert } = state;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div
        className="flex items-center justify-between px-3 py-2 rounded-md mb-3"
        style={{ background: 'rgba(0, 0, 0, 0.3)', border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.1)` }}
      >
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="font-mono text-[10px] uppercase tracking-wider" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
              BW
            </span>
            <div className="w-20 h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(30, 41, 59, 0.6)' }}>
              <motion.div
                className="h-full rounded-full"
                style={{
                  background: bandwidth > 5
                    ? `rgba(${HACKING_CYAN_RGB}, 0.7)`
                    : bandwidth > 2
                      ? `rgba(${HACKING_AMBER_RGB}, 0.7)`
                      : 'rgba(239, 68, 68, 0.7)',
                }}
                animate={{ width: `${(bandwidth / config.bandwidth) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span
              className="font-mono text-xs font-bold"
              style={{
                color: bandwidth > 5
                  ? HACKING_CYAN_COLOR
                  : bandwidth > 2
                    ? `rgba(${HACKING_AMBER_RGB}, 0.9)`
                    : HACKING_ACCENT_COLOR,
              }}
            >
              {bandwidth}
            </span>
          </div>
          <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
            Ход: {turn}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="text-[10px]" style={{ color: `rgba(${HACKING_GREEN_RGB}, 0.8)` }}>◆</span>
            <span className="font-mono text-xs" style={{ color: `rgba(${HACKING_GREEN_RGB}, 0.8)` }}>
              {dataCollected.length}
            </span>
          </div>
          <span
            className="font-mono text-[10px] px-1.5 py-0.5 rounded"
            style={{
              background: `rgba(${HACKING_ACCENT_RGB}, 0.08)`,
              border: `1px solid rgba(${HACKING_ACCENT_RGB}, 0.2)`,
              color: `rgba(${HACKING_ACCENT_RGB}, 0.6)`,
            }}
          >
            {config.label}
          </span>
        </div>
      </div>

      <AnimatePresence>
        {scannerAlert && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="text-center mb-2"
            role="status"
            aria-live="polite"
          >
            <span
              className="font-mono text-xs font-bold tracking-wider"
              style={{ color: 'rgba(251, 146, 60, 0.9)', textShadow: '0 0 8px rgba(251, 146, 60, 0.3)' }}
            >
              {scannerAlert}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      <HackingGameGrid
        grid={state.grid}
        path={state.path}
        movePacket={state.movePacket}
        playerPos={state.playerPos}
        scannerPositions={scannerPositions}
        reachableNodes={reachableNodes}
        pathSet={pathSet}
        dataCollected={state.dataCollected}
        onMove={onMove}
      />

      <p className="font-mono text-[10px] text-center mt-3" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
        Стрелки или клик по соседней ячейке • Достигните целевого сервера ⬡
      </p>
    </motion.div>
  );
}
