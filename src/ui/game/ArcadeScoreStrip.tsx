'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { useArcadeScoreStore } from '@/state/arcadeScoreStore';
import { useSessionPresetStore } from '@/state/sessionPresetStore';

/** Счёт и combo в демо — поверх 3D, не дублирует финальный `DemoResultsStrip`. */
export const ArcadeScoreStrip = memo(function ArcadeScoreStrip() {
  const preset = useSessionPresetStore((s) => s.preset);
  const score = useArcadeScoreStore((s) => s.score);
  const combo = useArcadeScoreStore((s) => s.combo);

  if (preset !== 'arcadeSlice') return null;

  return (
    <motion.div
      data-exploration-ui
      className="pointer-events-none fixed top-[max(0.5rem,env(safe-area-inset-top))] right-[max(0.5rem,env(safe-area-inset-right))] z-[38] font-mono"
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <div
        className="rounded border border-fuchsia-500/25 bg-black/65 px-3 py-2 text-right shadow-[0_0_20px_rgba(217,70,239,0.12)]"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
        }}
      >
        <div className="text-[9px] uppercase tracking-[0.25em] text-fuchsia-400/50">Demo score</div>
        <div className="text-lg tabular-nums text-fuchsia-100/95">{score}</div>
        {combo > 1 && (
          <div className="text-[10px] text-cyan-300/80">
            combo ×{combo}
          </div>
        )}
      </div>
    </motion.div>
  );
});
