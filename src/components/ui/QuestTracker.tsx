'use client';

import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useQuestStore } from '@/core/quests/questStore';

/**
 * Минимальный оверлей модульных квестов (`src/core/quests`), не путать с панелью 📋 из `gameStore`.
 */
export default function QuestTracker() {
  const quests = useQuestStore(useShallow((s) => s.quests));

  const { active, completed } = useMemo(() => {
    const list = Object.values(quests);
    return {
      active: list.filter((q) => q.status === 'active'),
      completed: list.filter((q) => q.status === 'completed'),
    };
  }, [quests]);

  if (active.length === 0 && completed.length === 0) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed right-3 top-28 z-[48] w-[min(18rem,calc(100vw-1.5rem))] select-none font-mono text-[11px] text-cyan-100/90">
      {active.length > 0 && (
        <div className="mb-2 rounded border border-cyan-500/25 bg-slate-950/88 px-3 py-2 shadow-lg backdrop-blur-sm">
          <div className="mb-1.5 text-[9px] uppercase tracking-[0.28em] text-cyan-400/70">Квесты (core)</div>
          <ul className="space-y-2">
            {active.map((q) => (
              <li key={q.id}>
                <div className="font-semibold text-cyan-200/95">{q.title}</div>
                <div className="mt-0.5 text-[10px] leading-snug text-slate-300/85">{q.description}</div>
                <ul className="mt-1 space-y-0.5 border-l border-cyan-500/20 pl-2 text-slate-400/90">
                  {q.objectives.map((o) => (
                    <li key={o.id} className={o.completed ? 'text-emerald-400/90 line-through' : ''}>
                      {o.completed ? '✓ ' : '○ '}
                      {o.description}
                      {o.requiredCount != null && o.requiredCount > 1 ? (
                        <span className="text-cyan-500/60">
                          {' '}
                          ({o.currentCount ?? 0}/{o.requiredCount})
                        </span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {completed.length > 0 && (
        <div className="rounded border border-emerald-500/20 bg-slate-950/75 px-3 py-2 text-emerald-200/80 backdrop-blur-sm">
          <div className="mb-1 text-[9px] uppercase tracking-[0.28em] text-emerald-400/60">Готово</div>
          <ul className="space-y-1">
            {completed.map((q) => (
              <li key={q.id} className="line-through opacity-80">
                {q.title}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
