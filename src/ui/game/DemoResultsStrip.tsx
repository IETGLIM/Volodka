'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useArcadeScoreStore, computeArcadeRank } from '@/state/arcadeScoreStore';
import { useGameStore } from '@/state';
import { useSessionPresetStore } from '@/state/sessionPresetStore';

export const DemoResultsStrip = memo(function DemoResultsStrip() {
  const preset = useSessionPresetStore((s) => s.preset);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const score = useArcadeScoreStore((s) => s.score);
  const maxCombo = useArcadeScoreStore((s) => s.maxCombo);
  const warm = useGameStore((s) => s.playerState.flags.vs_slice_outcome_warm);
  const cold = useGameStore((s) => s.playerState.flags.vs_slice_outcome_cold);
  const tvDone = useGameStore((s) =>
    s.completedQuestIds.includes('exploration_zarema_tv_feed'),
  );
  const rackDone = useGameStore((s) =>
    s.completedQuestIds.includes('exploration_volodka_rack'),
  );

  const visible = preset === 'arcadeSlice' && currentNodeId === 'vs_slice_outro';

  const rank = useMemo(() => {
    let bonus = 0;
    if (warm) bonus += 80;
    if (tvDone) bonus += 40;
    if (rackDone) bonus += 30;
    if (cold && !warm) bonus -= 20;
    return computeArcadeRank(score + bonus);
  }, [score, warm, cold, tvDone, rackDone]);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed top-20 right-4 z-[45] w-52 rounded border border-cyan-500/30 bg-black/80 px-3 py-3 font-mono text-xs shadow-lg pointer-events-none"
    >
      <div className="text-cyan-400/90 tracking-widest text-[10px] mb-2">ДЕМО · ИТОГ</div>
      <div className="text-3xl font-bold text-amber-300 mb-1">{rank}</div>
      <div className="text-cyan-200/80 tabular-nums">Score: {score}</div>
      <div className="text-cyan-500/60 tabular-nums">Combo max: {maxCombo}</div>
      <ul className="mt-2 space-y-0.5 text-[10px] text-slate-400">
        <li>{rackDone ? '✓' : '·'} стойка</li>
        <li>{tvDone ? '✓' : '·'} TV-лог</li>
        <li>{warm ? '✓' : cold ? '✗' : '·'} исход</li>
      </ul>
    </motion.div>
  );
});
