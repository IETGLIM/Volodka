import { motion } from 'framer-motion';
import {
  computeObjectiveProgressPercent,
  getProgressBarTransition,
} from '@/engine/questBoard/questBoardPresentation';

type QuestBoardMissionProgressBarProps = {
  current: number;
  target: number;
  label: string;
  reducedMotion: boolean;
};

export function QuestBoardMissionProgressBar({
  current,
  target,
  label,
  reducedMotion,
}: QuestBoardMissionProgressBarProps) {
  const safeTarget = Math.max(1, target);
  const pct = computeObjectiveProgressPercent(current, safeTarget);

  return (
    <div
      role="progressbar"
      aria-valuenow={Math.min(current, safeTarget)}
      aria-valuemin={0}
      aria-valuemax={safeTarget}
      aria-label={label}
      className="relative h-1.5 bg-slate-800/80 rounded-full overflow-hidden progress-bar-cyber"
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full progress-bar-cyber-fill"
        style={{ background: 'linear-gradient(90deg, #10b981, #34d399)' }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={getProgressBarTransition(reducedMotion)}
      />
      {!reducedMotion && pct > 0 && (
        <div className="absolute inset-y-0 left-0 rounded-full overflow-hidden" style={{ width: `${pct}%` }}>
          <div className="quest-board-progress-shimmer absolute inset-0" aria-hidden="true" />
        </div>
      )}
    </div>
  );
}
