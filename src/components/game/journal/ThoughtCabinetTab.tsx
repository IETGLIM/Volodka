/* ─── Volodka RPG – Thought Cabinet Tab (Journal) ─── */
/* A dual-pane cyberpunk terminal UI for equipping acquired "Thought Cabinet"
 * thoughts — internal monologue modifiers inspired by Disco Elysium. */

import { memo, useCallback, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  AlertTriangle,
  ChevronLeft,
  Cpu,
  Eye,
  HandHeart,
  Keyboard,
  Lock,
  Mic,
  Pen,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { JOURNAL_SKILL_LABELS } from '@/components/game/journal/journalConstants';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useAllThoughtCabinetItems, useAcquiredThoughts } from '@/store/selectors/thoughtCabinetSelectors';
import { useGameStore } from '@/store/gameStore';
import { MAX_EQUIPPED_THOUGHTS } from '@/data/thoughtCabinet';

/* ═══════════════════════════════════════════════════════════════
   Types
   ═══════════════════════════════════════════════════════════════ */

import type { ThoughtCabinetItem, ThoughtCabinetEffect } from '@/shared/types/game';
export type { ThoughtCabinetItem, ThoughtCabinetEffect };

/* ═══════════════════════════════════════════════════════════════
   Voice skill → icon / color mapping
   ═══════════════════════════════════════════════════════════════ */

const VOICE_META: Record<
  ThoughtCabinetItem['voice'],
  { icon: typeof Cpu; color: string; label: string }
> = {
  logic: { icon: Cpu, color: '#22d3ee', label: 'Логика' },
  coding: { icon: Keyboard, color: '#34d399', label: 'Кодинг' },
  empathy: { icon: HandHeart, color: '#fb7185', label: 'Эмпатия' },
  persuasion: { icon: Mic, color: '#fbbf24', label: 'Убеждение' },
  intuition: { icon: Eye, color: '#c084fc', label: 'Интуиция' },
  writing: { icon: Pen, color: '#f472b6', label: 'Письмо' },
  rhythm: { icon: ShieldCheck, color: '#fb923c', label: 'Ритм' },
};

/* ═══════════════════════════════════════════════════════════════
   Sub-components
   ═══════════════════════════════════════════════════════════════ */

interface ThoughtCardProps {
  thought: ThoughtCabinetItem;
  isAcquired: boolean;
  isEquipped: boolean;
  isSelected: boolean;
  index: number;
  onSelect: () => void;
  reducedMotion: boolean;
}

const ThoughtCard = memo(function ThoughtCard({
  thought,
  isAcquired,
  isEquipped,
  isSelected,
  index,
  onSelect,
  reducedMotion,
}: ThoughtCardProps) {
  const voice = VOICE_META[thought.voice];
  const VoiceIcon = voice.icon;

  return (
    <motion.button
      type="button"
      onClick={isAcquired ? onSelect : undefined}
      disabled={!isAcquired}
      initial={reducedMotion ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: 0.3,
        delay: reducedMotion ? 0 : index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`
        cyber-fade-in-stagger text-left p-3 rounded-xl border transition-all duration-200 min-h-[44px] relative
        ${isAcquired && isEquipped
          ? 'border-cyan-500/50 bg-cyan-950/20 shadow-[0_0_16px_rgb(var(--cyber-cyan-rgb) / 0.15),inset_0_0_8px_rgb(var(--cyber-cyan-rgb) / 0.05)] hud-filmic-thought-new'
          : isAcquired
            ? 'border-cyan-900/20 bg-slate-900/20 hover:bg-purple-950/15 hover:border-purple-800/25 cursor-pointer hud-filmic-thought-new'
            : 'border-slate-800/15 bg-slate-900/10 opacity-40 cursor-not-allowed'}
        ${isSelected ? 'ring-1 ring-purple-500/40' : ''}
      `}
      style={{
        '--stagger-index': index,
      } as React.CSSProperties}
      aria-label={
        isAcquired
          ? `${thought.name} — ${voice.label}${isEquipped ? ', экипировано' : ''}`
          : 'Мысль ещё не получена'
      }
    >
      {/* Purple left accent bar for acquired thoughts */}
      {isAcquired && (
        <div
          className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
          style={{
            background: isEquipped
              ? 'rgb(var(--cyber-cyan-rgb) / 0.7)'
              : 'rgba(168, 85, 247, 0.4)',
          }}
          aria-hidden
        />
      )}

      {/* Icon + Name row */}
      <div className="flex items-center gap-2 mb-1.5 pl-2">
        {isAcquired ? (
          <div
            className="size-6 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              borderColor: `${voice.color}30`,
              background: isEquipped ? `${voice.color}15` : `${voice.color}08`,
              color: voice.color,
              boxShadow: isEquipped ? `0 0 8px ${voice.color}25` : 'none',
            }}
          >
            <VoiceIcon className="size-3" />
          </div>
        ) : (
          <div className="size-6 rounded-md flex items-center justify-center shrink-0 border border-slate-800/30 bg-slate-900/30">
            <Lock className="size-3 text-slate-600" />
          </div>
        )}
        <span
          className={`text-xs font-mono truncate flex-1 ${isAcquired ? 'text-slate-200' : 'text-slate-600'}`}
          style={
            isEquipped
              ? { color: 'rgb(var(--cyber-cyan-rgb))', textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.4)' }
              : undefined
          }
        >
          {isAcquired ? thought.name : '???'}
        </span>
        {isEquipped && (
          <span
            className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded shrink-0"
            style={{
              background: 'rgba(0, 229, 255, 0.1)',
              color: 'rgb(var(--cyber-cyan-rgb))',
              border: '1px solid rgba(0, 229, 255, 0.3)',
              textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)',
              boxShadow: '0 0 8px rgba(0, 229, 255, 0.15)',
            }}
          >
            АКТИВНО
          </span>
        )}
      </div>

      {/* Brief description / effects preview */}
      {isAcquired && (
        <div className="pl-8 space-y-1">
          <p className="text-[10px] text-slate-500 line-clamp-2 leading-tight">
            {thought.description}
          </p>
          <div className="flex flex-wrap gap-1">
            {thought.effects.slice(0, 2).map((eff, idx) => (
              <span
                key={`${thought.id}-eff-${idx}`}
                className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                style={{
                  background: 'rgba(168, 85, 247, 0.08)',
                  color: `${voice.color}aa`,
                  border: '1px solid rgba(168, 85, 247, 0.12)',
                }}
              >
                {eff.skill} {eff.modifier > 0 ? `+${eff.modifier}` : eff.modifier}
              </span>
            ))}
          </div>
        </div>
      )}
    </motion.button>
  );
});

/* ═══════════════════════════════════════════════════════════════
   Main Tab Component
   ═══════════════════════════════════════════════════════════════ */

interface ThoughtCabinetTabProps {
  searchQuery: string;
}

export function ThoughtCabinetTab({ searchQuery }: ThoughtCabinetTabProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const allThoughts = useAllThoughtCabinetItems();
  const acquiredThoughts = useAcquiredThoughts();
  const equippedThoughtIds = useGameStore((s) => s.equippedThoughtIds);
  const equipThought = useGameStore((s) => s.equipThought);
  const unequipThought = useGameStore((s) => s.unequipThought);
  const maxEquipped = MAX_EQUIPPED_THOUGHTS;

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const selectedThought = useMemo(
    () => allThoughts.find((t) => t.id === selectedId) ?? null,
    [allThoughts, selectedId],
  );

  const isEquipped = selectedId ? equippedThoughtIds.includes(selectedId) : false;
  const isAcquired = selectedId
    ? acquiredThoughts.some((t) => t.id === selectedId)
    : false;
  const equippedCount = equippedThoughtIds.length;
  const canEquip =
    isAcquired && !isEquipped && equippedCount < maxEquipped;

  // Conflicting thoughts currently equipped
  const conflictingEquipped = useMemo(() => {
    if (!selectedThought?.mutuallyExclusive) return [];
    return selectedThought.mutuallyExclusive.filter((id) =>
      equippedThoughtIds.includes(id),
    );
  }, [selectedThought, equippedThoughtIds]);

  const willUnequipOnEquip = conflictingEquipped.length > 0 && canEquip;

  // Filter all thoughts by search query
  const filteredAll = useMemo(() => {
    if (!searchQuery.trim()) return allThoughts;
    const q = searchQuery.toLowerCase();
    return allThoughts.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        VOICE_META[t.voice].label.toLowerCase().includes(q),
    );
  }, [allThoughts, searchQuery]);

  const handleSelect = useCallback((id: string) => {
    setSelectedId(id);
  }, []);

  const handleEquip = useCallback(() => {
    if (!selectedId) return;
    equipThought(selectedId);
  }, [selectedId, equipThought]);

  const handleUnequip = useCallback(() => {
    if (!selectedId) return;
    unequipThought(selectedId);
  }, [selectedId, unequipThought]);

  /* ── Detail panel render ── */
  const detailPanel = selectedThought ? (
    <motion.div
      key="detail"
      initial={reducedMotion ? false : { opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={reducedMotion ? undefined : { opacity: 0, x: 20 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col h-full"
    >
      {/* Back button */}
      <div className="shrink-0 px-4 py-2.5 border-b border-cyan-900/15">
        <button
          type="button"
          onClick={() => setSelectedId(null)}
          className="flex items-center gap-1.5 text-xs text-cyan-400/70 hover:text-cyan-300 transition-colors"
        >
          <ChevronLeft className="size-3.5" aria-hidden />
          Назад к списку
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-4 space-y-4">
        {/* Voice badge + Name */}
        {isAcquired && (() => {
          const voice = VOICE_META[selectedThought.voice];
          const VoiceIcon = voice.icon;
          return (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div
                  className="size-7 rounded-md flex items-center justify-center border"
                  style={{
                    borderColor: `${voice.color}35`,
                    background: `${voice.color}12`,
                    color: voice.color,
                    boxShadow: isEquipped ? `0 0 10px ${voice.color}20` : 'none',
                  }}
                >
                  <VoiceIcon className="size-4" />
                </div>
                <span
                  className="text-[10px] font-mono uppercase tracking-widest"
                  style={{ color: `${voice.color}90` }}
                >
                  Голос: {voice.label}
                </span>
              </div>
              <h3
                className="text-lg font-semibold font-mono leading-tight"
                style={{
                  color: isEquipped ? 'rgb(var(--cyber-cyan-rgb))' : '#e2e8f0',
                  textShadow: isEquipped
                    ? '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)'
                    : 'none',
                }}
              >
                {selectedThought.name}
              </h3>
            </div>
          );
        })()}

        {!isAcquired && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <div className="size-7 rounded-md flex items-center justify-center border border-slate-800/30 bg-slate-900/30">
                <Lock className="size-4 text-slate-600" />
              </div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-slate-600">
                Недоступно
              </span>
            </div>
            <h3 className="text-lg font-semibold font-mono text-slate-600">???</h3>
          </div>
        )}

        {/* Flavor text */}
        {isAcquired && selectedThought.flavorText && (
          <div className="px-3 py-2.5 rounded-lg border border-purple-900/20 bg-purple-950/10">
            <p
              className="text-sm italic leading-relaxed font-serif"
              style={{ color: 'rgba(168, 85, 247, 0.8)', fontFamily: '"Georgia", "Times New Roman", serif' }}
            >
              {selectedThought.flavorText}
            </p>
          </div>
        )}

        {/* Description */}
        {isAcquired && (
          <p className="text-xs text-slate-300 leading-relaxed">
            {selectedThought.description}
          </p>
        )}

        {/* Effects */}
        {isAcquired && selectedThought.effects.length > 0 && (
          <div>
            <h4 className="text-[10px] font-mono uppercase tracking-widest text-slate-500 mb-2">
              Эффекты
            </h4>
            <div className="space-y-1.5">
              {selectedThought.effects.map((eff, idx) => {
                const skillInfo = JOURNAL_SKILL_LABELS[eff.skill as keyof typeof JOURNAL_SKILL_LABELS];
                return (
                  <div
                    key={`${selectedThought.id}-effect-${idx}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border border-cyan-900/15 bg-slate-900/30"
                  >
                    {skillInfo && (
                      <div
                        className={`size-2 rounded-full bg-gradient-to-r ${skillInfo.color} shrink-0`}
                        aria-hidden
                      />
                    )}
                    <span className="text-xs text-slate-200 font-medium flex-1">
                      {eff.skill}
                    </span>
                    <span
                      className={`text-xs font-mono font-bold ${eff.modifier > 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                    >
                      {eff.modifier > 0 ? `+${eff.modifier}` : eff.modifier}
                    </span>
                    <span className="text-[10px] text-slate-500 flex-1 text-right">
                      {eff.description}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Mutual exclusivity warning */}
        {isAcquired && selectedThought.mutuallyExclusive && selectedThought.mutuallyExclusive.length > 0 && (
          <div
            className="flex items-start gap-2 px-3 py-2.5 rounded-lg border"
            style={{
              borderColor: conflictingEquipped.length > 0 ? 'rgba(251, 113, 133, 0.3)' : 'rgba(251, 191, 36, 0.2)',
              background: conflictingEquipped.length > 0 ? 'rgba(251, 113, 133, 0.06)' : 'rgba(251, 191, 36, 0.06)',
            }}
          >
            <AlertTriangle
              className={`size-4 mt-0.5 shrink-0 ${conflictingEquipped.length > 0 ? 'text-rose-400' : 'text-amber-400/60'}`}
              aria-hidden
            />
            <div>
              <p className={`text-xs font-medium ${conflictingEquipped.length > 0 ? 'text-rose-300' : 'text-amber-300/70'}`}>
                {conflictingEquipped.length > 0
                  ? 'Взаимоисключающие мысли!'
                  : 'Взаимоисключающая мысль'}
              </p>
              {selectedThought.mutuallyExclusive.map((exId) => {
                const exThought = allThoughts.find((t) => t.id === exId);
                const isCurrentlyEquipped = equippedThoughtIds.includes(exId);
                return (
                  <p
                    key={exId}
                    className={`text-[10px] font-mono mt-0.5 ${isCurrentlyEquipped ? 'text-rose-400/80' : 'text-amber-400/50'}`}
                  >
                    {isCurrentlyEquipped ? '⚠ ' : '↔ '}
                    {exThought?.name ?? exId}
                    {isCurrentlyEquipped && ' — будет снята при экипировке'}
                  </p>
                );
              })}
            </div>
          </div>
        )}

        {/* Equip / Unequip button */}
        {isAcquired && (
          <div className="pt-2">
            {isEquipped ? (
              <button
                type="button"
                onClick={handleUnequip}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border"
                style={{
                  background: 'rgba(251, 113, 133, 0.08)',
                  borderColor: 'rgba(251, 113, 133, 0.25)',
                  color: '#fb7185',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  Снять
                </span>
              </button>
            ) : equippedCount >= maxEquipped && !willUnequipOnEquip ? (
              <div
                className="w-full py-2.5 rounded-xl text-xs font-mono uppercase tracking-wider text-center opacity-50 border"
                style={{
                  background: 'rgba(0,0,0,0.2)',
                  borderColor: 'rgba(100,116,139,0.15)',
                  color: '#64748b',
                }}
              >
                Все слоты заняты
              </div>
            ) : (
              <button
                type="button"
                onClick={handleEquip}
                className="w-full py-2.5 rounded-xl text-xs font-mono font-bold uppercase tracking-wider transition-all duration-200 border hover:scale-[1.01] active:scale-[0.99]"
                style={{
                  background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.12), rgba(0, 229, 255, 0.05))',
                  borderColor: 'rgba(0, 229, 255, 0.35)',
                  color: 'rgb(var(--cyber-cyan-rgb))',
                  boxShadow: '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.12), inset 0 0 8px rgb(var(--cyber-cyan-rgb) / 0.05)',
                  textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
                }}
              >
                <span className="flex items-center justify-center gap-2">
                  {willUnequipOnEquip ? (
                    <>
                      <AlertTriangle className="size-3.5" aria-hidden />
                      Экипировать (снять конфликтные)
                    </>
                  ) : (
                    <>
                      <Zap className="size-3.5" aria-hidden />
                      Экипировать
                    </>
                  )}
                </span>
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  ) : null;

  /* ── Grid panel render ── */
  const gridPanel = (
    <div className="flex flex-col h-full">
      {/* Slots indicator */}
      <div className="shrink-0 px-4 py-2.5 border-b border-cyan-900/15">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="size-3.5 text-purple-400/60" aria-hidden />
            <span className="text-xs text-slate-400">
              Слоты:{' '}
              <span
                className="font-mono font-bold"
                style={{
                  color:
                    equippedCount >= maxEquipped
                      ? 'rgb(var(--cyber-cyan-rgb))'
                      : '#94a3b8',
                }}
              >
                {equippedCount}/{maxEquipped}
              </span>{' '}
              использовано
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: maxEquipped }).map((_, i) => (
              <div
                key={`slot-${i}`}
                className="size-2.5 rounded-full border transition-all duration-300"
                style={{
                  borderColor:
                    i < equippedCount
                      ? 'rgb(var(--cyber-cyan-rgb) / 0.5)'
                      : 'rgba(100,116,139,0.2)',
                  background:
                    i < equippedCount
                      ? 'rgb(var(--cyber-cyan-rgb) / 0.3)'
                      : 'transparent',
                  boxShadow:
                    i < equippedCount
                      ? '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.3)'
                      : 'none',
                }}
              />
            ))}
          </div>
        </div>
        <p className="text-[10px] text-slate-600 mt-1 leading-tight">
          Внутренние голоса, которые формируют твою личность. Экипируй до {maxEquipped} мыслей для усиления навыков.
        </p>
      </div>

      {/* Thought grid */}
      <div className="flex-1 overflow-y-auto custom-scrollbar-thin p-4">
        <div
          className="grid grid-cols-1 sm:grid-cols-2 gap-2.5"
          role="list"
          aria-label="Мысли кабинета"
        >
          <AnimatePresence mode="popLayout">
            {filteredAll.map((thought, idx) => (
              <ThoughtCard
                key={thought.id}
                thought={thought}
                isAcquired={acquiredThoughts.some((a) => a.id === thought.id)}
                isEquipped={equippedThoughtIds.includes(thought.id)}
                isSelected={selectedId === thought.id}
                index={idx}
                onSelect={() => handleSelect(thought.id)}
                reducedMotion={reducedMotion}
              />
            ))}
          </AnimatePresence>
        </div>

        {filteredAll.length === 0 && (
          <div className="text-center py-12">
            <Sparkles className="size-10 text-slate-700 mx-auto mb-3" aria-hidden />
            <p className="text-sm text-slate-500 mb-1">Ничего не найдено</p>
            <p className="text-xs text-slate-600">Попробуйте другой запрос</p>
          </div>
        )}
      </div>
    </div>
  );

  /* ── Final layout: left (60%) + right detail (40%) ── */
  return (
    <div className="h-full flex">
      {/* Left: grid */}
      <div
        className="flex-1 min-w-0"
        style={{ flexBasis: selectedId ? '60%' : '100%' }}
      >
        {gridPanel}
      </div>

      {/* Right: detail panel */}
      <AnimatePresence>
        {detailPanel && (
          <motion.div
            initial={reducedMotion ? false : { opacity: 0, width: 0 }}
            animate={{ opacity: 1, width: '40%' }}
            exit={reducedMotion ? undefined : { opacity: 0, width: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="border-l border-cyan-900/15 overflow-hidden shrink-0"
            style={{ minWidth: 0 }}
          >
            {detailPanel}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}