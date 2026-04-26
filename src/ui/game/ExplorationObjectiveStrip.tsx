'use client';

import type { ExplorationSceneObjectiveLine } from '@/lib/explorationSceneQuestObjectives';

type Props = {
  lines: ExplorationSceneObjectiveLine[];
};

/**
 * Верхняя «лента цели» для 3D-обхода: один явный шаг, согласованный с миникартой.
 */
export function ExplorationObjectiveStrip({ lines }: Props) {
  if (lines.length === 0) return null;

  const primary = lines[0];
  const extra = lines.length - 1;

  return (
    <div className="pointer-events-none fixed left-1/2 top-[max(5.25rem,calc(env(safe-area-inset-top,0px)+4.25rem))] z-[46] w-[min(36rem,calc(100vw-1.5rem))] -translate-x-1/2 select-none">
      <div
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="rounded-lg border border-cyan-500/35 bg-slate-950/92 px-3 py-2 shadow-xl backdrop-blur-md sm:px-4 sm:py-2.5"
      >
        <div className="text-[9px] font-mono uppercase tracking-[0.28em] text-cyan-400/72">Цель · локация</div>
        <div className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-snug text-cyan-200/78 sm:text-[11px]">
          {primary.questTitle}
        </div>
        <div className="mt-1 font-mono text-[11px] font-semibold leading-snug text-cyan-50/95 sm:text-xs">
          {primary.objectiveText}
        </div>
        {primary.hint ? (
          <div className="mt-1 border-l-2 border-cyan-500/35 pl-2 text-[10px] leading-snug text-slate-400/95">
            {primary.hint}
          </div>
        ) : null}
        {extra > 0 ? (
          <div className="mt-1.5 text-[9px] tracking-wide text-cyan-500/55">+ ещё {extra} в этой зоне</div>
        ) : null}
      </div>
    </div>
  );
}
