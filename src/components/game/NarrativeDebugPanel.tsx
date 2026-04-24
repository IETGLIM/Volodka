'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '@/store/gameStore';
import {
  isNarrativeDebugEnabled,
  narrativeDebugActivateQuest,
  narrativeDebugClearQuest,
  narrativeDebugCompleteActiveQuest,
  narrativeDebugListQuestIds,
  narrativeDebugSetCoreStat,
  narrativeDebugSetFlag,
  narrativeDebugSetObjectiveValue,
  narrativeDebugSetPanic,
  type NarrativeDebugCoreStat,
} from '@/lib/narrativeDebug';

const CORE_STATS: NarrativeDebugCoreStat[] = [
  'mood',
  'creativity',
  'stability',
  'energy',
  'karma',
  'selfEsteem',
  'stress',
];

/**
 * Панель отладки нарратива (статы, флаги, квесты). ` — переключить; только dev или `NEXT_PUBLIC_GAME_DEBUG_PANEL=1`.
 */
export function NarrativeDebugPanel() {
  const enabled = isNarrativeDebugEnabled();
  const [open, setOpen] = useState(false);
  const [flagName, setFlagName] = useState('');
  const [questFilter, setQuestFilter] = useState('');
  const [objectiveQuestId, setObjectiveQuestId] = useState('');
  const [objectiveId, setObjectiveId] = useState('');
  const [objectiveValue, setObjectiveValue] = useState('0');

  const {
    mood,
    creativity,
    stability,
    energy,
    karma,
    selfEsteem,
    stress,
    panicMode,
    flags,
    activeQuestIds,
    completedQuestIds,
  } = useGameStore(
    useShallow((s) => ({
      mood: s.playerState.mood,
      creativity: s.playerState.creativity,
      stability: s.playerState.stability,
      energy: s.playerState.energy,
      karma: s.playerState.karma,
      selfEsteem: s.playerState.selfEsteem,
      stress: s.playerState.stress,
      panicMode: s.playerState.panicMode,
      flags: s.playerState.flags,
      activeQuestIds: s.activeQuestIds,
      completedQuestIds: s.completedQuestIds,
    })),
  );

  const statsMap = useMemo(
    () => ({ mood, creativity, stability, energy, karma, selfEsteem, stress }),
    [mood, creativity, stability, energy, karma, selfEsteem, stress],
  );

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`' || e.key === 'ё') {
        if (e.ctrlKey || e.metaKey || e.altKey) return;
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [enabled]);

  const flagEntries = useMemo(() => Object.keys(flags).sort(), [flags]);

  const questIds = useMemo(() => {
    const all = narrativeDebugListQuestIds();
    const q = questFilter.trim().toLowerCase();
    if (!q) return all;
    return all.filter((id) => id.toLowerCase().includes(q));
  }, [questFilter]);

  const applyStat = useCallback((stat: NarrativeDebugCoreStat, raw: string) => {
    const n = Number(raw);
    if (!Number.isFinite(n)) return;
    narrativeDebugSetCoreStat(stat, n);
  }, []);

  if (!enabled) return null;

  return (
    <>
      {open && (
        <div
          className="fixed inset-y-16 right-2 z-[12000] w-[min(100vw-1rem,22rem)] flex flex-col rounded border border-amber-500/40 bg-[#0a0812]/95 text-amber-100/95 shadow-[0_0_40px_rgba(245,158,11,0.12)] font-mono text-[11px] pointer-events-auto"
          role="dialog"
          aria-label="Narrative debug"
        >
          <div className="flex items-center justify-between border-b border-amber-500/25 px-2 py-1.5 bg-amber-950/40">
            <span className="tracking-widest text-amber-200/90">NARRATIVE DEBUG</span>
            <button
              type="button"
              className="px-2 py-0.5 rounded border border-amber-600/40 hover:bg-amber-900/30"
              onClick={() => setOpen(false)}
            >
              Esc / `
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-4">
            <section>
              <div className="text-amber-300/80 mb-1 uppercase tracking-wider">Статы</div>
              <div className="space-y-1">
                {CORE_STATS.map((stat) => (
                  <label key={stat} className="flex items-center gap-1">
                    <span className="w-24 shrink-0 text-amber-100/70">{stat}</span>
                    <input
                      type="number"
                      className="flex-1 min-w-0 bg-black/50 border border-amber-800/40 rounded px-1 py-0.5 text-amber-50"
                      defaultValue={String(statsMap[stat as keyof typeof statsMap])}
                      key={`${stat}-${statsMap[stat as keyof typeof statsMap]}`}
                      onBlur={(e) => applyStat(stat, e.target.value)}
                    />
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  checked={panicMode}
                  onChange={(e) => narrativeDebugSetPanic(e.target.checked)}
                />
                <span>Panic mode</span>
              </label>
            </section>

            <section>
              <div className="text-amber-300/80 mb-1 uppercase tracking-wider">Флаги</div>
              <div className="flex gap-1 mb-1">
                <input
                  className="flex-1 bg-black/50 border border-amber-800/40 rounded px-1 py-0.5"
                  placeholder="flag_id"
                  value={flagName}
                  onChange={(e) => setFlagName(e.target.value)}
                />
                <button
                  type="button"
                  className="px-2 py-0.5 rounded border border-emerald-700/50 text-emerald-200/90"
                  onClick={() => {
                    const id = flagName.trim();
                    if (!id) return;
                    narrativeDebugSetFlag(id, true);
                    setFlagName('');
                  }}
                >
                  Set
                </button>
                <button
                  type="button"
                  className="px-2 py-0.5 rounded border border-rose-700/50 text-rose-200/90"
                  onClick={() => {
                    const id = flagName.trim();
                    if (!id) return;
                    narrativeDebugSetFlag(id, false);
                    setFlagName('');
                  }}
                >
                  Unset
                </button>
              </div>
              <ul className="max-h-28 overflow-y-auto space-y-0.5 text-amber-100/70">
                {flagEntries.map((f) => (
                  <li key={f} className="flex justify-between gap-1">
                    <span className="truncate">{f}</span>
                    <button
                      type="button"
                      className="shrink-0 text-rose-300/80 hover:underline"
                      onClick={() => narrativeDebugSetFlag(f, false)}
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            </section>

            <section>
              <div className="text-amber-300/80 mb-1 uppercase tracking-wider">Квесты (gameStore)</div>
              <input
                className="w-full mb-1 bg-black/50 border border-amber-800/40 rounded px-1 py-0.5"
                placeholder="фильтр id…"
                value={questFilter}
                onChange={(e) => setQuestFilter(e.target.value)}
              />
              <ul className="max-h-40 overflow-y-auto space-y-1">
                {questIds.slice(0, 80).map((qid) => {
                  const active = activeQuestIds.includes(qid);
                  const done = completedQuestIds.includes(qid);
                  return (
                    <li key={qid} className="border-b border-amber-900/20 pb-1">
                      <div className="truncate text-amber-50/90" title={qid}>
                        {qid}{' '}
                        <span className="text-amber-500/70">
                          {done ? '✓' : active ? '●' : '○'}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-0.5 mt-0.5">
                        <button
                          type="button"
                          className="px-1 rounded border border-cyan-800/50 text-cyan-200/80"
                          onClick={() => narrativeDebugActivateQuest(qid)}
                        >
                          Activate
                        </button>
                        <button
                          type="button"
                          className="px-1 rounded border border-violet-800/50 text-violet-200/80"
                          onClick={() => narrativeDebugCompleteActiveQuest(qid)}
                        >
                          Complete
                        </button>
                        <button
                          type="button"
                          className="px-1 rounded border border-slate-700 text-slate-300/80"
                          onClick={() => narrativeDebugClearQuest(qid)}
                        >
                          Clear
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
              <div className="mt-2 flex flex-col gap-1">
                <span className="text-amber-500/80">Цель (objective)</span>
                <input
                  className="bg-black/50 border border-amber-800/40 rounded px-1 py-0.5"
                  placeholder="questId"
                  value={objectiveQuestId}
                  onChange={(e) => setObjectiveQuestId(e.target.value)}
                />
                <input
                  className="bg-black/50 border border-amber-800/40 rounded px-1 py-0.5"
                  placeholder="objectiveId"
                  value={objectiveId}
                  onChange={(e) => setObjectiveId(e.target.value)}
                />
                <div className="flex gap-1">
                  <input
                    className="flex-1 bg-black/50 border border-amber-800/40 rounded px-1 py-0.5"
                    type="number"
                    value={objectiveValue}
                    onChange={(e) => setObjectiveValue(e.target.value)}
                  />
                  <button
                    type="button"
                    className="px-2 rounded border border-amber-700/50"
                    onClick={() => {
                      const qid = objectiveQuestId.trim();
                      const oid = objectiveId.trim();
                      if (!qid || !oid) return;
                      narrativeDebugSetObjectiveValue(qid, oid, Number(objectiveValue));
                    }}
                  >
                    Set obj
                  </button>
                </div>
              </div>
            </section>
          </div>
          <div className="border-t border-amber-500/20 px-2 py-1 text-amber-600/80 text-[10px]">
            Клавиша ` (backquote) — открыть/закрыть · только dev или NEXT_PUBLIC_GAME_DEBUG_PANEL=1
          </div>
        </div>
      )}
      {!open && (
        <button
          type="button"
          className="fixed bottom-2 left-2 z-[12000] pointer-events-auto px-2 py-1 rounded border border-amber-700/40 bg-black/70 text-[10px] text-amber-400/90 font-mono opacity-60 hover:opacity-100"
          onClick={() => setOpen(true)}
          title="Narrative debug (`)"
        >
          DBG
        </button>
      )}
    </>
  );
}
