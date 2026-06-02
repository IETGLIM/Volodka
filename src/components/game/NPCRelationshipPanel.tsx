
/* ─── Volodka RPG – NPC Relationship Panel ───
   Shows the player's relationship with each NPC they've interacted with.
   Dark glass morphism with cyberpunk accents, matching QuestsPanel style.
*/

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Shield, Skull, Circle, MapPin, CalendarClock, Gift } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';
import { SCENE_CONFIG } from '@/config/scenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { ScrollArea } from '@/components/ui/scroll-area';
import { NPCScheduleTimeline } from '@/components/game/NPCScheduleTimeline';
import { GiftDialog } from '@/components/game/GiftDialog';
import { getAffinityLevel } from '@/data/npcGifts';
import type { NPCRelation, SceneId } from '@/shared/types/game';

/* ══════════════════════════════════════════════════════════════
   SVG NPC PORTRAITS — stylized line art (copied from DialogueRenderer)
   ══════════════════════════════════════════════════════════════ */

const NPC_PORTRAIT_COLORS: Record<string, { primary: string; glow: string; accent: string }> = {
  albert: { primary: '#8b9dc3', glow: 'rgba(139,157,195,0.4)', accent: '#6b7db3' },
  zarema: { primary: '#e8a87c', glow: 'rgba(232,168,124,0.4)', accent: '#d4896a' },
  maria: { primary: '#c77dba', glow: 'rgba(199,125,186,0.4)', accent: '#a85d99' },
  office_dmitry: { primary: '#7dad7a', glow: 'rgba(125,173,122,0.4)', accent: '#5d8d5a' },
  office_alexander: { primary: '#6b8fc4', glow: 'rgba(107,143,196,0.4)', accent: '#4a6fa4' },
  office_colleague: { primary: '#a0926b', glow: 'rgba(160,146,107,0.4)', accent: '#80724b' },
  cafe_barista: { primary: '#c4956a', glow: 'rgba(196,149,106,0.4)', accent: '#a4754a' },
};

/* ── Albert: Geometric/angular face, glasses, neat hair ── */
function AlbertPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M25 22 L40 16 L55 22 L58 42 L55 58 L40 64 L25 58 L22 42 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q30 10 40 12 Q50 10 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 20 Q32 8 40 10 Q48 8 54 20" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <line x1="30" y1="16" x2="30" y2="22" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="36" y1="14" x2="36" y2="20" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="44" y1="14" x2="44" y2="20" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="50" y1="16" x2="50" y2="22" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <rect x="28" y="32" width="10" height="7" rx="1" fill="none" stroke={color} strokeWidth="1.2" />
      <rect x="42" y="32" width="10" height="7" rx="1" fill="none" stroke={color} strokeWidth="1.2" />
      <line x1="38" y1="35" x2="42" y2="35" stroke={color} strokeWidth="1" />
      <line x1="24" y1="35" x2="28" y2="35" stroke={color} strokeWidth="0.8" />
      <line x1="52" y1="35" x2="56" y2="35" stroke={color} strokeWidth="0.8" />
      <circle cx="33" cy="35.5" r="1.2" fill={color} opacity="0.7" />
      <circle cx="47" cy="35.5" r="1.2" fill={color} opacity="0.7" />
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M35 52 Q40 55 45 52" fill="none" stroke={color} strokeWidth="1" />
      <path d="M32 56 Q40 62 48 56" fill="none" stroke={color} strokeWidth="0.5" opacity="0.3" />
    </svg>
  );
}

/* ── Zarema: Warm soft features, hijab suggestion, kind eyes ── */
function ZaremaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M20 28 Q20 10 40 10 Q60 10 60 28 L62 60 Q50 68 40 68 Q30 68 18 60 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M22 26 Q22 14 40 14 Q58 14 58 26" fill="none" stroke={color} strokeWidth="1" opacity="0.5" />
      <path d="M28 30 Q28 22 40 20 Q52 22 52 30 L52 48 Q52 58 40 60 Q28 58 28 48 Z" fill="none" stroke={color} strokeWidth="1.2" opacity="0.6" />
      <path d="M32 36 Q35 33 38 36" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M42 36 Q45 33 48 36" fill="none" stroke={color} strokeWidth="1.3" />
      <circle cx="35" cy="36" r="1" fill={color} opacity="0.8" />
      <circle cx="45" cy="36" r="1" fill={color} opacity="0.8" />
      <line x1="31" y1="35" x2="30" y2="33.5" stroke={color} strokeWidth="0.5" />
      <line x1="49" y1="35" x2="50" y2="33.5" stroke={color} strokeWidth="0.5" />
      <path d="M40 40 L39 45 Q40 46 41 45" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M34 50 Q40 55 46 50" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M20 38 Q18 50 22 60" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M60 38 Q62 50 58 60" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
    </svg>
  );
}

/* ── Maria: Sharp features, short hair, intense gaze ── */
function MariaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M28 24 L38 18 L42 18 L52 24 L54 42 L50 56 L40 60 L30 56 L26 42 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 28 Q26 12 40 10 Q54 12 54 28 L52 22 Q48 14 40 14 Q32 14 28 22 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 30 L26 24" stroke={color} strokeWidth="1" />
      <path d="M54 24 L56 30" stroke={color} strokeWidth="1" />
      <path d="M30 34 L38 32 L38 36 L30 36 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 32 L50 34 L50 36 L42 36 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="35" cy="34.5" r="1.5" fill={color} />
      <circle cx="45" cy="34.5" r="1.5" fill={color} />
      <path d="M30 30 L38 28" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M42 28 L50 30" stroke={color} strokeWidth="1" opacity="0.7" />
      <path d="M40 38 L38 46 L42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M35 52 L45 52" stroke={color} strokeWidth="1.2" />
      <path d="M36 52 Q40 54 44 52" fill="none" stroke={color} strokeWidth="0.6" opacity="0.4" />
    </svg>
  );
}

/* ── Dmitry: Round face, beard, tired eyes ── */
function DmitryPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 28 Q26 18 40 16 Q54 18 54 28 L56 44 Q56 58 40 62 Q24 58 24 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 26 Q28 14 40 12 Q52 14 54 26" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M28 24 Q30 16 40 14 Q50 16 52 24" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path d="M30 36 Q34 33 38 36" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 36 Q46 33 50 36" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="35.5" r="1.2" fill={color} opacity="0.6" />
      <circle cx="46" cy="35.5" r="1.2" fill={color} opacity="0.6" />
      <path d="M30 37.5 Q34 39 38 37.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M42 37.5 Q46 39 50 37.5" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M40 40 L38 46 Q40 48 42 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M28 48 Q28 58 40 64 Q52 58 52 48" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M30 50 Q30 56 40 60 Q50 56 50 50" fill="none" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M35 50 Q40 52 45 50" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
}

/* ── Alexander: Hard jawline, slicked hair, cold eyes ── */
function AlexanderPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 24 L36 16 L44 16 L54 24 L56 40 L54 54 L48 60 L32 60 L26 54 L24 40 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q26 8 40 8 Q54 8 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 22 Q28 12 40 10 Q52 12 54 22" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <line x1="32" y1="12" x2="30" y2="20" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="40" y1="10" x2="40" y2="18" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <line x1="48" y1="12" x2="50" y2="20" stroke={color} strokeWidth="0.5" opacity="0.3" />
      <path d="M29 34 L39 33 L39 35 L29 35 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M41 33 L51 34 L51 35 L41 35 Z" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="34" r="1" fill={color} opacity="0.9" />
      <circle cx="46" cy="34" r="1" fill={color} opacity="0.9" />
      <path d="M29 31 L38 29" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <path d="M42 29 L51 31" stroke={color} strokeWidth="1.2" opacity="0.8" />
      <path d="M40 36 L37 46 L43 46" fill="none" stroke={color} strokeWidth="1" />
      <path d="M34 52 L46 52" stroke={color} strokeWidth="1.2" />
      <path d="M36 52 Q40 53 44 52" fill="none" stroke={color} strokeWidth="0.4" opacity="0.3" />
      <path d="M26 48 L32 58" stroke={color} strokeWidth="0.6" opacity="0.3" />
      <path d="M54 48 L48 58" stroke={color} strokeWidth="0.6" opacity="0.3" />
    </svg>
  );
}

/* ── Colleague: Nervous expression, messy hair, shifting eyes ── */
function ColleaguePortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M28 24 Q28 18 40 16 Q52 18 52 24 L54 44 Q54 56 40 60 Q26 56 26 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 26 Q22 10 40 8 Q58 10 56 26" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M22 22 L26 16" stroke={color} strokeWidth="1" />
      <path d="M30 12 L28 18" stroke={color} strokeWidth="0.8" />
      <path d="M36 8 L34 14" stroke={color} strokeWidth="0.8" />
      <path d="M44 8 L46 14" stroke={color} strokeWidth="0.8" />
      <path d="M50 12 L52 18" stroke={color} strokeWidth="0.8" />
      <path d="M56 22 L54 16" stroke={color} strokeWidth="1" />
      <ellipse cx="33" cy="35" rx="3.5" ry="2.5" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="47" cy="34" rx="3.5" ry="2.5" fill="none" stroke={color} strokeWidth="1" />
      <circle cx="34" cy="35" r="1.2" fill={color} opacity="0.7" />
      <circle cx="48" cy="34" r="1.2" fill={color} opacity="0.7" />
      <path d="M29 31 Q33 28 37 31" fill="none" stroke={color} strokeWidth="1" />
      <path d="M43 30 Q47 27 51 30" fill="none" stroke={color} strokeWidth="1" />
      <path d="M40 38 L39 44 Q40 45 41 44" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M35 50 Q40 48 45 50" fill="none" stroke={color} strokeWidth="1" />
      <ellipse cx="55" cy="32" rx="1" ry="2" fill={color} opacity="0.3" />
    </svg>
  );
}

/* ── Barista: Friendly smile, apron, knowing eyes ── */
function BaristaPortrait({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 80 80" className="w-full h-full">
      <path d="M26 26 Q26 16 40 14 Q54 16 54 26 L56 44 Q56 58 40 62 Q24 58 24 44 Z" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M24 24 Q24 8 40 8 Q56 8 56 24" fill="none" stroke={color} strokeWidth="1.5" />
      <path d="M26 22 Q26 12 40 10 Q54 12 54 22" fill="none" stroke={color} strokeWidth="0.8" opacity="0.4" />
      <path d="M30 34 Q34 31 38 34" fill="none" stroke={color} strokeWidth="1.2" />
      <path d="M42 34 Q46 31 50 34" fill="none" stroke={color} strokeWidth="1.2" />
      <circle cx="34" cy="33.5" r="1.3" fill={color} opacity="0.8" />
      <circle cx="46" cy="33.5" r="1.3" fill={color} opacity="0.8" />
      <path d="M30 30 Q34 27 38 29" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M42 29 Q46 27 50 30" fill="none" stroke={color} strokeWidth="0.8" opacity="0.5" />
      <path d="M40 38 L39 44 Q40 45 41 44" fill="none" stroke={color} strokeWidth="0.8" />
      <path d="M32 50 Q40 56 48 50" fill="none" stroke={color} strokeWidth="1.3" />
      <path d="M30 60 L26 68" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <path d="M50 60 L54 68" stroke={color} strokeWidth="0.8" opacity="0.3" />
      <path d="M26 68 L54 68" stroke={color} strokeWidth="0.8" opacity="0.3" />
    </svg>
  );
}

/* ── Portrait renderer by NPC ID ── */
function NPCPortrait({ npcId }: { npcId: string }) {
  const colors = NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista;

  const renderSvg = () => {
    switch (npcId) {
      case 'albert': return <AlbertPortrait color={colors.primary} />;
      case 'zarema': return <ZaremaPortrait color={colors.primary} />;
      case 'maria': return <MariaPortrait color={colors.primary} />;
      case 'office_dmitry': return <DmitryPortrait color={colors.primary} />;
      case 'office_alexander': return <AlexanderPortrait color={colors.primary} />;
      case 'office_colleague': return <ColleaguePortrait color={colors.primary} />;
      case 'cafe_barista': return <BaristaPortrait color={colors.primary} />;
      default: return <AlbertPortrait color={colors.primary} />;
    }
  };

  return (
    <div
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 shrink-0 overflow-hidden"
      style={{
        borderColor: `${colors.primary}88`,
        boxShadow: `0 0 12px ${colors.glow}, 0 0 24px ${colors.glow}, inset 0 0 8px ${colors.glow}`,
        background: `radial-gradient(ellipse at center, ${colors.glow} 0%, transparent 70%)`,
      }}
    >
      {renderSvg()}
    </div>
  );
}

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
  const npcDef = NPC_DEFINITIONS.find((n) => n.id === relation.npcId);

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
