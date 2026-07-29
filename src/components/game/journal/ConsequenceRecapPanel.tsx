import { Scale } from 'lucide-react';
import {
  generateActRecap,
  getConsequenceStats,
  getMoralHistory,
} from '@/engine/narrative/consequenceRecap';
import { usePlayerCurrentAct } from '@/store/selectors/playerSelectors';

/** Compact Disco Elysium-style recap of moral choices for the current act. */
export function ConsequenceRecapPanel() {
  const currentAct = usePlayerCurrentAct();
  const stats = getConsequenceStats();
  const moral = getMoralHistory().slice(0, 3);
  const recap = generateActRecap(currentAct);

  if (stats.totalChoices === 0 && stats.moralChoices === 0) {
    return null;
  }

  return (
    <section
      className="shrink-0 border-b border-cyan-900/30 bg-slate-950/50 px-4 py-3"
      aria-label="Итог решений"
    >
      <div className="mb-2 flex items-center gap-2">
        <Scale className="size-3.5 text-amber-400/70" aria-hidden />
        <h3 className="font-mono text-[10px] uppercase tracking-[0.18em] text-amber-300/70">
          Решения · Акт {currentAct}
        </h3>
        <span className="ml-auto font-mono text-[10px] text-slate-500">
          {stats.moralChoices} моральных · {stats.totalChoices} всего · карма {stats.karma}
        </span>
      </div>
      <p className="mb-2 whitespace-pre-line text-xs leading-relaxed text-slate-400">{recap}</p>
      {moral.length > 0 && (
        <ul className="space-y-1">
          {moral.map((entry) => (
            <li
              key={`${entry.nodeId}-${entry.timestamp}`}
              className="truncate text-[11px] text-slate-500"
            >
              <span className="text-amber-500/50">•</span> {entry.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
