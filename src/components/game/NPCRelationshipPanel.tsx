
/* ─── Volodka RPG – NPC Relationship Panel ───
   Shows the player's relationship with each NPC they've interacted with.
   Dark glass morphism with cyberpunk accents, matching QuestsPanel style.
*/

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Shield, Skull, Circle, MapPin, CalendarClock, Gift } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { findNpcById } from '@/data/allNpcDefinitions';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NPCScheduleTimeline } from '@/components/game/NPCScheduleTimeline';
import { GiftDialog } from '@/components/game/GiftDialog';
import { getAffinityLevel } from '@/data/npcGifts';
import { NPCPortrait, NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';
import type { NPCRelation, SceneId } from '@/shared/types/game';

/* ══════════════════════════════════════════════════════════════
   Relationship helpers
   ══════════════════════════════════════════════════════════════ */

type RelationLevel = 'ally' | 'neutral' | 'enemy';

function getRelationLevel(value: number): RelationLevel {
  if (value >= 65) return 'ally';
  if (value <= 30) return 'enemy';
  return 'neutral';
}

const RELATION_LABELS: Record<RelationLevel, string> = {
  ally: 'Союзник',
  neutral: 'Нейтрал',
  enemy: 'Враг',
};

const RELATION_COLORS: Record<RelationLevel, { bar: string; bg: string; text: string; border: string; glow: string }> = {
  ally: {
    bar: 'bg-emerald-500',
    bg: 'bg-emerald-950/30',
    text: 'text-emerald-400',
    border: 'border-emerald-700/40',
    glow: 'rgba(16,185,129,0.15)',
  },
  neutral: {
    bar: 'bg-amber-500',
    bg: 'bg-amber-950/30',
    text: 'text-amber-400',
    border: 'border-amber-700/40',
    glow: 'rgba(245,158,11,0.15)',
  },
  enemy: {
    bar: 'bg-red-500',
    bg: 'bg-red-950/30',
    text: 'text-red-400',
    border: 'border-red-700/40',
    glow: 'rgba(239,68,68,0.15)',
  },
};

const RELATION_ICONS: Record<RelationLevel, typeof Shield> = {
  ally: Shield,
  neutral: Circle,
  enemy: Skull,
};

/* ── Get NPC's current scene name ── */
function getNpcSceneName(npcId: string, npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>): string | null {
  const state = npcStates[npcId];
  if (!state) return null;
  const config = SCENE_CONFIG[state.sceneId];
  return config?.name ?? null;
}

/* ══════════════════════════════════════════════════════════════
   Affinity level visual helpers
   ══════════════════════════════════════════════════════════════ */

function getAffinityBadgeStyle(affinity: number): { bg: string; text: string; border: string } {
  if (affinity >= 81) return { bg: 'bg-amber-500/15', text: 'text-amber-400', border: 'border-amber-500/30' };
  if (affinity >= 51) return { bg: 'bg-emerald-500/15', text: 'text-emerald-400', border: 'border-emerald-500/30' };
  if (affinity >= 11) return { bg: 'bg-cyan-500/15', text: 'text-cyan-400', border: 'border-cyan-500/30' };
  if (affinity >= -9) return { bg: 'bg-slate-500/15', text: 'text-slate-400', border: 'border-slate-500/30' };
  if (affinity >= -49) return { bg: 'bg-orange-500/15', text: 'text-orange-400', border: 'border-orange-500/30' };
  return { bg: 'bg-rose-500/15', text: 'text-rose-400', border: 'border-rose-500/30' };
}

function getAffinityBarColor(affinity: number): string {
  if (affinity >= 51) return 'bg-emerald-500';
  if (affinity >= 11) return 'bg-cyan-500';
  if (affinity >= -9) return 'bg-slate-500';
  if (affinity >= -49) return 'bg-orange-500';
  return 'bg-rose-500';
}

function getAffinityTextColor(affinity: number): string {
  if (affinity >= 51) return 'text-emerald-400';
  if (affinity >= 11) return 'text-cyan-400';
  if (affinity >= -9) return 'text-slate-400';
  if (affinity >= -49) return 'text-orange-400';
  return 'text-rose-400';
}

/* ══════════════════════════════════════════════════════════════
   NPC Card component
   ══════════════════════════════════════════════════════════════ */

function NPCCard({
  relation,
  index,
  npcStates,
  currentHour,
  showSchedule,
  affinity,
  onOpenGift,
}: {
  relation: NPCRelation;
  index: number;
  npcStates: Record<string, { position: [number, number, number]; sceneId: SceneId }>;
  currentHour: number;
  showSchedule: boolean;
  affinity: number;
  onOpenGift: () => void;
}) {
  const npcDef = findNpcById(relation.npcId);

  // If we don't have a definition for this NPC, skip
  if (!npcDef) return null;

  const level = getRelationLevel(relation.value);
  const colors = RELATION_COLORS[level];
  const RelationIcon = RELATION_ICONS[level];
  const sceneName = getNpcSceneName(relation.npcId, npcStates);
  const portraitColors = NPC_PORTRAIT_COLORS[relation.npcId];

  // Affinity level info
  const affinityLevel = getAffinityLevel(affinity);
  const affinityBadge = getAffinityBadgeStyle(affinity);
  const affinityBarCol = getAffinityBarColor(affinity);
  const affinityTextCol = getAffinityTextColor(affinity);
  const affinityPercent = ((affinity + 100) / 200) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.06, duration: 0.25 }}
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: portraitColors
          ? `${portraitColors.primary}30`
          : 'rgba(34,211,238,0.15)',
        background: `linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(8,12,28,0.7) 100%)`,
        boxShadow: `inset 0 1px 0 ${colors.glow}, 0 0 20px ${colors.glow}`,
      }}
    >
      <div className="p-4">
        {/* Top row: portrait + info */}
        <div className="flex items-start gap-3">
          {/* Portrait */}
          <NPCPortrait npcId={relation.npcId} />

          {/* Info */}
          <div className="flex-1 min-w-0">
            {/* Name + relation icon + affinity badge */}
            <div className="flex items-center gap-2 mb-1">
              <span
                className="font-medium text-sm tracking-wide"
                style={{ color: portraitColors?.primary ?? '#94a3b8' }}
              >
                {npcDef.name}
              </span>
              <RelationIcon className={`size-3.5 ${colors.text}`} />
              <span className={`text-[10px] uppercase tracking-widest font-medium ${colors.text}`}>
                {RELATION_LABELS[level]}
              </span>
              {/* Affinity level badge */}
              <span className={`text-[9px] px-1.5 py-0.5 rounded border font-medium ${affinityBadge.bg} ${affinityBadge.text} ${affinityBadge.border}`}>
                {affinityLevel.label}
              </span>
            </div>

            {/* Description */}
            {npcDef.description && (
              <p className="text-[11px] text-slate-400/80 leading-relaxed mb-2 line-clamp-2">
                {npcDef.description}
              </p>
            )}

            {/* Scene indicator */}
            {sceneName && (
              <div className="flex items-center gap-1 mb-2.5">
                <MapPin className="size-3 text-slate-500/60" />
                <span className="text-[10px] text-slate-500/70">{sceneName}</span>
              </div>
            )}

            {/* Relationship bar */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Отношение</span>
                <span className={`text-xs font-mono font-medium ${colors.text}`}>
                  {relation.value}
                </span>
              </div>
              <div className="h-2 rounded-full bg-slate-800/80 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={{ width: 0 }}
                  animate={{ width: `${relation.value}%` }}
                  transition={{ duration: 0.6, delay: index * 0.06 + 0.2, ease: 'easeOut' }}
                  style={{
                    boxShadow: `0 0 8px ${colors.glow}`,
                  }}
                />
              </div>
            </div>

            {/* Affinity progress bar */}
            <div className="space-y-1 mt-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">Расположение</span>
                <span className={`text-xs font-mono font-medium ${affinityTextCol}`}>
                  {affinity > 0 ? '+' : ''}{affinity}
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-slate-800/80 overflow-hidden shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)] relative">
                {/* Center marker */}
                <div className="absolute top-0 bottom-0 left-1/2 w-px bg-slate-600/30 z-10" />
                <motion.div
                  className={`h-full rounded-full ${affinityBarCol}`}
                  initial={{ width: '50%' }}
                  animate={{ width: `${affinityPercent}%` }}
                  transition={{ duration: 0.6, delay: index * 0.06 + 0.3, ease: 'easeOut' }}
                />
              </div>
            </div>

            {/* Gift button */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenGift();
              }}
              className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium
                bg-cyan-600/20 text-cyan-400 border border-cyan-500/20
                hover:bg-cyan-600/40 hover:text-cyan-300 hover:border-cyan-500/30
                active:scale-[0.98] transition-all duration-150"
              aria-label={`Подарить ${npcDef.name}`}
            >
              <Gift className="size-3.5" />
              Подарить
            </button>
          </div>
        </div>

        {/* Schedule timeline */}
        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="overflow-hidden"
            >
              <div className="pt-2 mt-2 border-t border-slate-700/20">
                <NPCScheduleTimeline
                  npcId={relation.npcId}
                  currentHour={currentHour}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════
   Main Panel component
   ══════════════════════════════════════════════════════════════ */

export function NPCRelationshipPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const npcRelations = useGameStore((s) => s.npcRelations);
  const npcStates = useGameStore((s) => s.exploration.npcStates);
  const currentHour = useGameStore((s) => s.exploration.timeOfDay);
  const npcAffinity = useGameStore((s) => s.npcAffinity);
  const [showSchedule, setShowSchedule] = useState(true);
  const [giftDialogNpcId, setGiftDialogNpcId] = useState<string | null>(null);

  // Close on [N] key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'KeyN') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  // Sort relations: allies first, then neutral, then enemies
  const sortedRelations = useMemo(() => {
    return [...npcRelations].sort((a, b) => b.value - a.value);
  }, [npcRelations]);

  const hasRelations = sortedRelations.length > 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full sm:w-[30rem]"
          style={{
            zIndex: UI_LAYERS.PANEL,
            background: 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)',
            borderLeft: '1px solid rgba(34,211,238,0.15)',
            backdropFilter: 'blur(20px)',
            boxShadow: '-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 rgba(34,211,238,0.08)',
          }}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-cyan-900/20">
              <h2 className="text-lg font-semibold text-slate-100 flex items-center gap-2">
                <Users className="size-5 text-cyan-400" />
                Отношения
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowSchedule((v) => !v)}
                  className={`h-7 px-2 rounded-md flex items-center gap-1 text-[10px] font-medium transition-all duration-200 ${showSchedule ? 'text-cyan-400 bg-cyan-950/40 border border-cyan-800/30' : 'text-slate-500 bg-slate-900/40 border border-slate-700/20 hover:text-slate-300'}`}
                  aria-label={showSchedule ? 'Скрыть расписание' : 'Показать расписание'}
                >
                  <CalendarClock className="size-3" />
                  Расписание
                </button>
                <span className="text-[10px] text-slate-500 font-mono">[N] закрыть</span>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="size-5" />
                </button>
              </div>
            </div>

            {/* NPC List */}
            <ScrollArea className="flex-1 px-4 py-3">
              {hasRelations ? (
                <div className="flex flex-col gap-3">
                  {sortedRelations.map((relation, i) => (
                    <NPCCard
                      key={relation.npcId}
                      relation={relation}
                      index={i}
                      npcStates={npcStates}
                      currentHour={currentHour}
                      showSchedule={showSchedule}
                      affinity={npcAffinity[relation.npcId] ?? 0}
                      onOpenGift={() => setGiftDialogNpcId(relation.npcId)}
                    />
                  ))
                }
                </div>
              ) : (
                /* Empty state */
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.15 }}
                  >
                    <Users className="size-12 text-slate-700/50 mx-auto mb-4" />
                    <p className="text-slate-500 text-sm mb-1">Нет знакомых</p>
                    <p className="text-slate-600 text-xs max-w-[220px]">
                      Исследуйте мир и общайтесь с персонажами, чтобы появились отношения
                    </p>
                  </motion.div>
                </div>
              )}
            </ScrollArea>

            {/* Footer summary */}
            {hasRelations && (
              <div className="px-4 py-2.5 border-t border-cyan-900/20 bg-black/20">
                <div className="flex items-center justify-between text-[10px] text-slate-500">
                  <span>Знакомых: {sortedRelations.length}</span>
                  <div className="flex items-center gap-3">
                    {sortedRelations.filter((r) => getRelationLevel(r.value) === 'ally').length > 0 && (
                      <span className="flex items-center gap-1 text-emerald-500/70">
                        <Shield className="size-2.5" />
                        {sortedRelations.filter((r) => getRelationLevel(r.value) === 'ally').length} союзников
                      </span>
                    )}
                    {sortedRelations.filter((r) => getRelationLevel(r.value) === 'enemy').length > 0 && (
                      <span className="flex items-center gap-1 text-red-500/70">
                        <Skull className="size-2.5" />
                        {sortedRelations.filter((r) => getRelationLevel(r.value) === 'enemy').length} врагов
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Gift Dialog */}
      {giftDialogNpcId && (
        <GiftDialog
          open={!!giftDialogNpcId}
          onClose={() => setGiftDialogNpcId(null)}
          npcId={giftDialogNpcId}
        />
      )}
    </AnimatePresence>
  );
}
