'use client';

/* ─── Volodka RPG – Poem Journal Panel ───
   Dedicated panel showing all collected poems with
   atmospheric display, power tracking, mood indicators,
   and reading progress. Does NOT modify poem text content.
*/

import { useState, useMemo, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, ScrollText, Zap, Search, ChevronLeft,
  Sparkles, Eye,
} from 'lucide-react';
import { PanelWrapper } from './PanelWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameStore } from '@/store/gameStore';
import { POEMS } from '@/data/poems';
import { getUnifiedPoem } from '@/data/unifiedPoemRegistry';
import { getPoemPower, canUsePower, getCooldownRemaining } from '@/engine/PoemPowerSystem';
import { TOTAL_UNIFIED_POEMS } from '@/data/poemCollectionMeta';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Types ─── */

interface PoemJournalPanelProps {
  open: boolean;
  onClose: () => void;
}

type PoemMood = 'melancholy' | 'hope' | 'rage' | 'wonder' | 'love' | 'default';

type JournalTab = 'collected' | 'powers' | 'progress';

/* ─── Mood Detection ─── */

const MOOD_KEYWORDS: Record<PoemMood, string[]> = {
  melancholy: ['смерть', 'одиночество', 'тоска', 'печаль', 'уныни', 'потеря', 'боль', 'страда', 'горе', 'слеза', 'пусто', 'один', 'ноч', 'тьма', 'холод', 'забыть', 'ушёл', 'ушла'],
  hope: ['надежда', 'свет', 'рассвет', 'весна', 'жизнь', 'будет', 'добро', 'мечта', 'верить', 'добр', 'тепло', 'солнц', 'яр', 'нов'],
  rage: ['ярость', 'гнев', 'кровь', 'уничтож', 'сожж', 'война', 'борь', 'враг', 'разруш', 'бунт', 'протест', 'революц', 'свобода', 'насилие'],
  wonder: ['звёзд', 'космос', 'тайн', 'магия', 'неведом', 'чудо', 'мисти', 'душа', 'бесконечн', 'вечн', 'мироздан', 'глубин'],
  love: ['любовь', 'сердце', 'целова', 'обнять', 'нежн', 'родн', 'дорог', 'любим', 'ласка', 'страсть', 'чувств'],
  default: [],
};

const MOOD_COLORS: Record<PoemMood, { bg: string; text: string; dot: string; glow: string }> = {
  melancholy: { bg: 'poem-mood-melancholy', text: '#93c5fd', dot: '#60a5fa', glow: 'rgba(96,165,250,0.15)' },
  hope:      { bg: 'poem-mood-hope',      text: '#fde68a', dot: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  rage:      { bg: 'poem-mood-rage',       text: '#fca5a5', dot: '#f43f5e', glow: 'rgba(244,63,94,0.15)' },
  wonder:    { bg: 'poem-mood-wonder',     text: '#d8b4fe', dot: '#a78bfa', glow: 'rgba(167,139,250,0.15)' },
  love:      { bg: 'poem-mood-love',       text: '#f9a8d4', dot: '#f472b6', glow: 'rgba(244,114,182,0.15)' },
  default:   { bg: 'poem-mood-default',    text: '#a5f3fc', dot: '#00e5ff', glow: 'rgba(0,229,255,0.1)' },
};

const MOOD_LABELS: Record<PoemMood, string> = {
  melancholy: 'Меланхолия',
  hope: 'Надежда',
  rage: 'Ярость',
  wonder: 'Чудо',
  love: 'Любовь',
  default: 'Нейтральный',
};

function detectPoemMood(themes: string[], _lines: string[]): PoemMood {
  const themeText = themes.join(' ').toLowerCase();
  const scores: Record<PoemMood, number> = {
    melancholy: 0, hope: 0, rage: 0, wonder: 0, love: 0, default: 0,
  };
  for (const [mood, keywords] of Object.entries(MOOD_KEYWORDS)) {
    for (const kw of keywords) {
      if (themeText.includes(kw)) scores[mood as PoemMood] += 1;
    }
  }
  let best: PoemMood = 'default';
  let bestScore = 0;
  for (const [mood, score] of Object.entries(scores)) {
    if (score > bestScore) { bestScore = score; best = mood as PoemMood; }
  }
  return best;
}

/* ─── Helpers ─── */

/* ─── Progress Ring ─── */

function ProgressRing({ collected, total }: { collected: number; total: number }) {
  const pct = total > 0 ? collected / total : 0;
  const r = 36;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);

  return (
    <div className="flex items-center gap-3">
      <svg width="88" height="88" viewBox="0 0 88 88" className="poem-progress-ring">
        <circle cx="44" cy="44" r={r} fill="none" stroke="rgba(100,116,139,0.12)" strokeWidth="4" />
        <circle
          cx="44" cy="44" r={r} fill="none" stroke="#00e5ff" strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          className="poem-progress-ring-fill"
          transform="rotate(-90 44 44)"
          style={{ filter: 'drop-shadow(0 0 4px rgba(0,229,255,0.3))' }}
        />
        <text x="44" y="42" textAnchor="middle" fill="#e2e8f0" fontSize="16" fontWeight="700" fontFamily="'JetBrains Mono', monospace">
          {collected}
        </text>
        <text x="44" y="54" textAnchor="middle" fill="rgba(148,163,184,0.5)" fontSize="8" fontFamily="'JetBrains Mono', monospace">
          из {total}
        </text>
      </svg>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs text-slate-300 font-mono">Прочитано</span>
        <span className="text-[10px] text-slate-500 font-mono">стихов собрано</span>
      </div>
    </div>
  );
}

/* ─── Mood Indicator Dot ─── */

function MoodDot({ mood }: { mood: PoemMood }) {
  const colors = MOOD_COLORS[mood];
  return (
    <div
      className="poem-mood-indicator"
      style={{ color: colors.dot, background: colors.dot }}
      aria-label={MOOD_LABELS[mood]}
    />
  );
}

/* ─── Poem List Item ─── */

function PoemListItem({
  poem,
  mood,
  isSelected,
  onClick,
}: {
  poem: typeof POEMS[number];
  mood: PoemMood;
  isSelected: boolean;
  onClick: () => void;
}) {
  const colors = MOOD_COLORS[mood];
  const power = getPoemPower(poem.id);
  const desc = getUnifiedPoem(poem.id);

  return (
    <button
      type="button"
      onClick={onClick}
      className={`poem-list-item ${colors.bg} ${isSelected ? 'poem-list-selected' : ''}`}
    >
      <div className="flex items-center gap-2">
        <MoodDot mood={mood} />
        <div className="flex flex-col min-w-0 flex-1">
          <span className="text-xs font-medium text-slate-200 truncate" style={{ color: colors.text }}>
            {poem.title}
          </span>
          <span className="text-[9px] text-slate-500 font-mono truncate">
            {desc?.worldDescription ?? poem.themes.join(', ')}
          </span>
        </div>
        {power && (
          <Zap className="size-3 text-amber-400/50 shrink-0" />
        )}
      </div>
    </button>
  );
}

/* ─── Poem Detail View ─── */

function PoemDetailView({
  poem,
  mood,
  onBack,
}: {
  poem: typeof POEMS[number];
  mood: PoemMood;
  onBack: () => void;
}) {
  const reducedMotion = useEffectiveReducedMotion();
  const colors = MOOD_COLORS[mood];
  const power = getPoemPower(poem.id);
  const canUse = power ? canUsePower(poem.id) : false;
  const cd = power ? getCooldownRemaining(poem.id) : 0;
  const desc = getUnifiedPoem(poem.id);

  return (
    <motion.div
      initial={reducedMotion ? { opacity: 1 } : { opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? { opacity: 1 } : { opacity: 0, x: -12 }}
      transition={{ duration: 0.2 }}
      className="p-4 relative z-10"
    >
      {/* Back button */}
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1 text-[10px] text-slate-500 hover:text-slate-300 font-mono transition-colors mb-3"
      >
        <ChevronLeft className="size-3" />
        Назад к списку
      </button>

      {/* Title */}
      <h3
        className="poem-title-display mb-1"
        style={{ color: colors.text }}
      >
        {poem.title}
      </h3>
      <p className="text-[10px] text-slate-500 font-mono mb-4">
        {poem.author}
      </p>

      {/* Meta row */}
      <div className="flex flex-wrap gap-2 mb-4">
        <span
          className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] rounded-full font-mono"
          style={{ background: colors.glow, color: colors.text, border: `1px solid ${colors.dot}30` }}
        >
          {MOOD_LABELS[mood]}
        </span>
        {poem.themes.map((theme) => (
          <span key={theme} className="px-2 py-0.5 text-[9px] rounded-full border border-slate-700/30 bg-slate-800/30 text-slate-400">
            {theme}
          </span>
        ))}
      </div>

      {/* Poem body */}
      <div className="poem-verse mb-4">
        {poem.lines.map((line, i) => (
          <div key={i} className="poem-verse-line">
            {line || '\u00A0'}
          </div>
        ))}
      </div>

      {/* Power info */}
      {power && (
        <div className="mt-4 pt-3 border-t border-slate-800/40">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 mb-2">
            <Zap className="size-3" />
            Сила стиха
          </div>
          <div
            className={`poem-power-badge ${canUse ? 'poem-power-badge-active' : 'poem-power-badge-inactive'}`}
          >
            <Zap className="size-3" />
            <span>{power.name}</span>
            {!canUse && cd > 0 && (
              <span className="ml-1 opacity-60">({Math.ceil(cd / 1000)}с)</span>
            )}
          </div>
          <p className="text-[10px] text-slate-400 mt-1.5 leading-relaxed">
            {power.description}
          </p>
        </div>
      )}

      {/* World/combat description from registry */}
      {desc && (
        <div className="mt-3 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] rounded border border-cyan-800/30 bg-cyan-950/20 text-cyan-400/60">
            <Eye className="size-2.5" />
            {desc.worldDescription}
          </span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Powers Tab ─── */

function PowersTab({ collectedPoems }: { collectedPoems: string[] }) {
  const powers = useMemo(() => {
    return collectedPoems
      .map((id) => ({ id, power: getPoemPower(id) }))
      .filter((p): p is { id: string; power: NonNullable<ReturnType<typeof getPoemPower>> } => p.power !== undefined);
  }, [collectedPoems]);

  return (
    <div className="p-4 space-y-2">
      {powers.length === 0 ? (
        <p className="text-xs text-slate-500 italic py-8 text-center">
          Соберите стихи, чтобы открыть их силы
        </p>
      ) : (
        powers.map(({ id, power }) => {
          const usable = canUsePower(id);
          const cd = getCooldownRemaining(id);
          const desc = getUnifiedPoem(id);
          return (
            <div
              key={id}
              className={`p-3 rounded-lg border transition-colors ${
                usable
                  ? 'border-emerald-700/30 bg-emerald-950/10'
                  : 'border-slate-800/40 bg-slate-900/30'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <Zap className={`size-3.5 ${usable ? 'text-emerald-400' : 'text-slate-500'}`} />
                  <span className="text-xs font-medium text-slate-200">{power.name}</span>
                </div>
                <span className={`poem-power-badge ${usable ? 'poem-power-badge-active' : 'poem-power-badge-inactive'}`}>
                  {usable ? 'Готово' : cd > 0 ? `${Math.ceil(cd / 1000)}с` : 'КД'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 leading-relaxed">{power.description}</p>
              {desc && (
                <p className="text-[9px] text-slate-500 mt-1 font-mono">
                  ← {desc.canonicalName}
                </p>
              )}
            </div>
          );
        })
      )}
    </div>
  );
}

/* ─── Progress Tab ─── */

function ProgressTab({ collectedPoems }: { collectedPoems: string[] }) {
  const moodCounts = useMemo(() => {
    const counts: Record<PoemMood, number> = {
      melancholy: 0, hope: 0, rage: 0, wonder: 0, love: 0, default: 0,
    };
    for (const id of collectedPoems) {
      const poem = POEMS.find((p) => p.id === id);
      if (!poem) continue;
      const mood = detectPoemMood(poem.themes, poem.lines);
      counts[mood] += 1;
    }
    return counts;
  }, [collectedPoems]);

  const powerCount = collectedPoems.filter((id) => getPoemPower(id) !== undefined).length;

  return (
    <div className="p-4 space-y-4">
      <ProgressRing collected={collectedPoems.length} total={TOTAL_UNIFIED_POEMS} />

      <div className="h-px" style={{ background: 'linear-gradient(90deg, transparent, rgba(100,116,139,0.2), transparent)' }} />

      {/* Mood breakdown */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Sparkles className="size-3 text-slate-500" />
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Настроения</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {(Object.entries(moodCounts) as [PoemMood, number][])
            .filter(([, count]) => count > 0)
            .map(([mood, count]) => {
              const colors = MOOD_COLORS[mood];
              return (
                <div
                  key={mood}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md border"
                  style={{
                    borderColor: `${colors.dot}25`,
                    background: `${colors.dot}08`,
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ background: colors.dot, boxShadow: `0 0 6px ${colors.dot}` }}
                  />
                  <span className="text-[10px] font-mono" style={{ color: colors.text }}>
                    {MOOD_LABELS[mood]}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono ml-auto">{count}</span>
                </div>
              );
            })}
        </div>
      </div>

      {/* Power stats */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Zap className="size-3 text-slate-500" />
          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Силы стихов</span>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg border border-amber-800/20 bg-amber-950/10">
          <span className="text-lg font-bold text-amber-400 font-mono">{powerCount}</span>
          <span className="text-[10px] text-slate-400 font-mono">сил открыто из собранных стихов</span>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export function PoemJournalPanel({ open, onClose }: PoemJournalPanelProps) {
  const collectedPoems = useGameStore((s) => s.collectedPoems);
  const [selectedPoemId, setSelectedPoemId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<JournalTab>('collected');
  const [searchQuery, setSearchQuery] = useState('');
  const [_, setTick] = useState(0);

  // Tick to refresh cooldowns
  useEffect(() => {
    if (!open) return;
    const iv = setInterval(() => setTick((t) => t + 1), 1000);
    return () => clearInterval(iv);
  }, [open]);

  const collected = useMemo(
    () => POEMS.filter((p) => collectedPoems.includes(p.id)),
    [collectedPoems],
  );

  const poemMoods = useMemo(() => {
    const map = new Map<string, PoemMood>();
    for (const poem of POEMS) {
      map.set(poem.id, detectPoemMood(poem.themes, poem.lines));
    }
    return map;
  }, []);

  const filteredCollected = useMemo(() => {
    if (!searchQuery.trim()) return collected;
    const q = searchQuery.toLowerCase();
    return collected.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.themes.some((t) => t.toLowerCase().includes(q)),
    );
  }, [collected, searchQuery]);

  const selectedPoem = useMemo(
    () => POEMS.find((p) => p.id === selectedPoemId) ?? null,
    [selectedPoemId],
  );

  const selectedMood = selectedPoemId ? poemMoods.get(selectedPoemId) ?? 'default' : 'default';

  const handleSelect = useCallback((id: string) => {
    setSelectedPoemId(id);
  }, []);

  const handleBack = useCallback(() => {
    setSelectedPoemId(null);
  }, []);

  const tabs: Array<{ key: JournalTab; label: string; icon: typeof BookOpen }> = [
    { key: 'collected', label: 'Стихи', icon: ScrollText },
    { key: 'powers', label: 'Силы', icon: Zap },
    { key: 'progress', label: 'Прогресс', icon: Sparkles },
  ];

  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-600 font-mono">
        volodka://poem-journal
      </span>
      <span className="text-[10px] text-slate-500 font-mono">
        {collected.length}/{TOTAL_UNIFIED_POEMS} собрано
      </span>
    </div>
  );

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Журнал стихов"
      accentColor="cyan"
      layout="sidebar"
      icon={<ScrollText className="size-5 text-cyan-400" />}
      shortcutLabel="J"
      urlPath="volodka://poem-journal"
      closeAriaLabel="Закрыть журнал стихов"
      footer={footer}
    >
      <div className="flex flex-col h-full poem-journal-atmosphere" data-testid="poem-journal-panel">
        <div className="relative z-10 flex flex-col h-full">
          {/* Tab bar */}
          <div className="px-4 py-2 border-b border-slate-800/40 flex items-center gap-1">
            {tabs.map(({ key, label, icon: TabIcon }) => (
              <button
                key={key}
                type="button"
                onClick={() => { setActiveTab(key); setSelectedPoemId(null); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-medium rounded-md transition-all duration-200 codex-cat-tab ${
                  activeTab === key
                    ? 'bg-cyan-950/30 text-cyan-400 border border-cyan-700/30 codex-cat-active'
                    : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
              >
                <TabIcon className="size-3" />
                {label}
              </button>
            ))}
          </div>

          {/* Content area */}
          <div className="flex flex-1 min-h-0">
            {activeTab === 'collected' && (
              <>
                {/* Search bar */}
                <div className="w-full px-4 py-2 border-b border-slate-800/40">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-700/30 bg-slate-900/40">
                    <Search className="size-3.5 text-slate-500 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Поиск по стихам..."
                      className="flex-1 bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none"
                    />
                  </div>
                </div>
                <AnimatePresence mode="wait">
                  {selectedPoem ? (
                    <ScrollArea className="flex-1">
                      <PoemDetailView
                        poem={selectedPoem}
                        mood={selectedMood}
                        onBack={handleBack}
                      />
                    </ScrollArea>
                  ) : (
                    <ScrollArea className="flex-1">
                      <div className="p-2 space-y-1">
                        {filteredCollected.length === 0 ? (
                          <div className="text-center py-12">
                            <BookOpen className="size-10 text-slate-700 mb-3 mx-auto" />
                            <p className="text-xs text-slate-500">Стихи ещё не собраны</p>
                            <p className="text-[10px] text-slate-600 mt-1">
                              Исследуйте мир, чтобы найти стихи
                            </p>
                          </div>
                        ) : (
                          filteredCollected.map((poem) => (
                            <PoemListItem
                              key={poem.id}
                              poem={poem}
                              mood={poemMoods.get(poem.id) ?? 'default'}
                              isSelected={selectedPoemId === poem.id}
                              onClick={() => handleSelect(poem.id)}
                            />
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  )}
                </AnimatePresence>
              </>
            )}

            {activeTab === 'powers' && (
              <ScrollArea className="flex-1">
                <PowersTab collectedPoems={collectedPoems} />
              </ScrollArea>
            )}

            {activeTab === 'progress' && (
              <ScrollArea className="flex-1">
                <ProgressTab collectedPoems={collectedPoems} />
              </ScrollArea>
            )}
          </div>
        </div>
      </div>
    </PanelWrapper>
  );
}
