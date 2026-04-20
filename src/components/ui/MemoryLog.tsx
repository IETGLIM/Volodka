'use client';

import { useMemo, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { getEmotionalProfile } from '@/core/memory/emotionalProfile';
import type { MemoryEmotion } from '@/core/memory/types';
import { useMemoryStore } from '@/core/memory/memoryStore';

const EMOTION_STYLES: Record<MemoryEmotion, string> = {
  neutral: 'border-slate-500/40 bg-slate-900/50 text-slate-200',
  happy: 'border-emerald-500/45 bg-emerald-950/35 text-emerald-100',
  sad: 'border-blue-500/35 bg-blue-950/30 text-blue-100',
  regret: 'border-violet-500/40 bg-violet-950/35 text-violet-100',
  love: 'border-rose-500/45 bg-rose-950/35 text-rose-100',
  anger: 'border-red-500/50 bg-red-950/40 text-red-100',
};

function formatTime(ts: number): string {
  try {
    return new Intl.DateTimeFormat('ru-RU', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(ts));
  } catch {
    return String(ts);
  }
}

type EmotionFilter = 'all' | MemoryEmotion;

const EMOTION_SUMMARY_RU: Record<MemoryEmotion, string> = {
  neutral: 'нейтральное спокойствие',
  happy: 'лёгкая тяга к свету',
  sad: 'тяжесть и тишина',
  regret: 'сожаление и оглядки назад',
  love: 'тепло и близость',
  anger: 'злость и напряжение',
};

/**
 * Журнал нарративной памяти — часть опыта, не отладка.
 */
export default function MemoryLog() {
  const { memories, relationships } = useMemoryStore(
    useShallow((s) => ({ memories: s.memories, relationships: s.relationships })),
  );
  const [emotionFilter, setEmotionFilter] = useState<EmotionFilter>('all');
  const [significantOnly, setSignificantOnly] = useState(false);
  const [groupByEntity, setGroupByEntity] = useState(false);

  const filtered = useMemo(() => {
    let list = memories;
    if (significantOnly) {
      list = list.filter((m) => m.persistent);
    }
    if (emotionFilter !== 'all') {
      list = list.filter((m) => (m.emotion ?? 'neutral') === emotionFilter);
    }
    return list;
  }, [memories, emotionFilter, significantOnly]);

  const grouped = useMemo(() => {
    if (!groupByEntity) return null;
    const map = new Map<string | undefined, typeof filtered>();
    for (const m of filtered) {
      const k = m.relatedEntityId;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(m);
    }
    return [...map.entries()].sort(([a], [b]) => String(a).localeCompare(String(b)));
  }, [filtered, groupByEntity]);

  const profile = useMemo(() => getEmotionalProfile(), [memories]);
  const relationshipRows = useMemo(
    () => Object.entries(relationships).sort(([a], [b]) => a.localeCompare(b)),
    [relationships],
  );

  if (memories.length === 0) {
    return null;
  }

  const renderCard = (m: (typeof memories)[number]) => {
    const emo = m.emotion ?? 'neutral';
    const frame = EMOTION_STYLES[emo] ?? EMOTION_STYLES.neutral;
    return (
      <li
        key={m.id}
        className={`rounded-lg border px-3 py-2.5 text-left shadow-sm backdrop-blur-sm ${frame}`}
      >
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="font-semibold leading-snug">{m.title}</span>
          <time className="shrink-0 font-mono text-[9px] uppercase tracking-wider opacity-70">
            {formatTime(m.timestamp)}
          </time>
        </div>
        <p className="mt-1 text-[11px] leading-relaxed opacity-90">{m.description}</p>
        <div className="mt-1.5 flex flex-wrap gap-1.5 font-mono text-[9px] uppercase tracking-wide opacity-75">
          {m.relatedEntityId ? (
            <span className="rounded bg-black/25 px-1.5 py-0.5">@{m.relatedEntityId}</span>
          ) : null}
          {m.tags?.map((t) => (
            <span key={t} className="rounded bg-black/20 px-1.5 py-0.5">
              #{t}
            </span>
          ))}
          {m.persistent ? <span className="text-amber-200/90">★ значимое</span> : null}
        </div>
      </li>
    );
  };

  return (
    <div className="pointer-events-auto fixed bottom-3 left-3 z-[48] flex max-h-[min(52vh,420px)] w-[min(22rem,calc(100vw-1.5rem))] flex-col rounded-lg border border-cyan-500/20 bg-slate-950/90 font-mono text-[11px] text-slate-100 shadow-2xl backdrop-blur-md">
      <div className="flex shrink-0 flex-col gap-2 border-b border-cyan-500/15 px-3 py-2">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase tracking-[0.32em] text-cyan-400/80">Память</span>
          <span className="text-[9px] text-slate-500">{filtered.length}/{memories.length}</span>
        </div>
        <div className="flex flex-wrap gap-1.5">
          <label className="flex cursor-pointer items-center gap-1 text-[9px] text-slate-400">
            <input
              type="checkbox"
              checked={significantOnly}
              onChange={(e) => setSignificantOnly(e.target.checked)}
              className="accent-cyan-500"
            />
            только значимые
          </label>
          <label className="flex cursor-pointer items-center gap-1 text-[9px] text-slate-400">
            <input
              type="checkbox"
              checked={groupByEntity}
              onChange={(e) => setGroupByEntity(e.target.checked)}
              className="accent-cyan-500"
            />
            по сущности
          </label>
        </div>
        <select
          value={emotionFilter}
          onChange={(e) => setEmotionFilter(e.target.value as EmotionFilter)}
          className="rounded border border-cyan-500/25 bg-black/40 px-2 py-1 text-[10px] text-cyan-100/90 outline-none focus:border-cyan-400/50"
          aria-label="Фильтр по эмоции"
        >
          <option value="all">все эмоции</option>
          <option value="neutral">нейтрально</option>
          <option value="happy">радость</option>
          <option value="sad">грусть</option>
          <option value="regret">сожаление</option>
          <option value="love">любовь</option>
          <option value="anger">злость</option>
        </select>
        <p className="text-[10px] leading-snug text-slate-300/90">
          Сейчас ты чувствуешь в основном:{' '}
          <span className="text-cyan-200/95">{EMOTION_SUMMARY_RU[profile.dominantEmotion]}</span>
          <span className="text-slate-500">
            {' '}
            · стабильность {Math.round(profile.stability * 100)}% · позитивность{' '}
            {Math.round(profile.positivity * 100)}%
          </span>
        </p>
        {relationshipRows.length > 0 ? (
          <div className="rounded border border-fuchsia-500/20 bg-fuchsia-950/15 px-2 py-1.5 text-[9px] text-fuchsia-100/90">
            <div className="mb-1 uppercase tracking-[0.22em] text-fuchsia-400/70">Раппорт</div>
            <ul className="space-y-0.5">
              {relationshipRows.map(([id, val]) => (
                <li key={id} className="flex justify-between gap-2 font-mono">
                  <span className="truncate text-fuchsia-200/85">{id}</span>
                  <span className="shrink-0 text-fuchsia-300">{val}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>
      <ul className="min-h-0 flex-1 space-y-2 overflow-y-auto px-3 py-2 pr-1">
        {groupByEntity && grouped
          ? grouped.map(([entity, rows]) => (
              <li key={entity ?? 'none'} className="space-y-2">
                <div className="sticky top-0 bg-slate-950/95 py-0.5 text-[9px] uppercase tracking-[0.28em] text-cyan-500/70">
                  {entity ? `Сущность · ${entity}` : 'Без привязки'}
                </div>
                <ul className="space-y-2">{rows.map((m) => renderCard(m))}</ul>
              </li>
            ))
          : filtered.map((m) => renderCard(m))}
      </ul>
    </div>
  );
}
