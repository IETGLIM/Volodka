/* ─── Volodka RPG – NPC Codex / Character Gallery Panel ───
   Full-featured NPC gallery with cyberpunk glass morphism,
   SVG-generated avatars, discovery states, relation indicators,
   tab filters, search, and detail view.
*/

'use client';

import { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Search, Eye, EyeOff, Heart, MapPin,
  MessageSquare, BookOpen, Lock, ChevronRight,
  Star, Swords, Shield, CircleDot,
} from 'lucide-react';
import { PanelWrapper } from './PanelWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useGameStore } from '@/store/gameStore';
import { useNpcCodexStore } from '@/store/stores/npcCodexStore';
import {
  ALL_NPC_DEFINITIONS,
  ALL_NPC_IDS,
} from '@/data/allNpcDefinitions';
import type { NPCDefinition, NPCAppearance, NPCSilhouette } from '@/shared/types/definitions/npc';
import { SCENE_CONFIG } from '@/config/scenes';
import type { SceneId } from '@/config/sceneIds';

/* ─── Types ─── */

interface NpcCodexPanelProps {
  open: boolean;
  onClose: () => void;
}

type FilterTab = 'all' | 'network' | 'neutral' | 'chk_tolpa' | 'discovered' | 'undiscovered';

interface NpcCardData {
  npc: NPCDefinition;
  discovered: boolean;
  relationValue: number;
}

/* ─── Scene location mapping ─── */

const NPC_SCENE_HINTS: Record<string, string> = {
  albert: 'cafe_evening',
  zarema: 'cafe_evening',
  kate: 'cafe_evening',
  lyonya: 'park_day',
  maria: 'office_day',
  solnysh: 'solnysh_room',
  grigory: 'river_pier',
  dmitry: 'abandoned_factory',
  anya: 'library_day',
  nikita: 'street_night',
  polina: 'home_evening',
  viktor: 'office_day',
  olga: 'library_day',
  mikhail: 'chk_campfire_night',
  svetlana: 'chk_campfire_night',
  roman: 'chk_forest_zorge',
  oleg: 'underground_bunker',
  irina: 'city_square',
  lena: 'volodka_room',
};

function getSceneLabel(sceneId: string): string {
  const config = SCENE_CONFIG[sceneId as SceneId];
  return config?.name ?? sceneId;
}

function getNpcLocation(npcId: string): string {
  const sceneId = NPC_SCENE_HINTS[npcId];
  if (sceneId) return getSceneLabel(sceneId);
  return 'Неизвестно';
}

/* ─── Faction helpers ─── */

const FACTION_LABELS: Record<string, string> = {
  network: 'Сеть',
  neutral: 'Нейтральный',
  tolpa: 'ЧК Толпа',
  chk_tolpa: 'ЧК Толпа',
};

function getFactionBadgeClass(faction: string | undefined): string {
  switch (faction) {
    case 'network': return 'npc-codex-faction-badge--network';
    case 'neutral': return 'npc-codex-faction-badge--neutral';
    case 'tolpa':
    case 'chk_tolpa': return 'npc-codex-faction-badge--chk_tolpa';
    default: return 'npc-codex-faction-badge--neutral';
  }
}

/* ─── Relation helpers ─── */

function getRelationLabel(value: number): { label: string; color: string } {
  if (value >= 60) return { label: 'Союзник', color: '#34d399' };
  if (value >= 20) return { label: 'Дружелюбный', color: '#00e5ff' };
  if (value >= -20) return { label: 'Нейтральный', color: '#a1a1aa' };
  if (value >= -60) return { label: 'Холодный', color: '#fb923c' };
  return { label: 'Враждебный', color: '#f87171' };
}

function getRelationColor(value: number): string {
  if (value >= 60) return '#34d399';
  if (value >= 20) return '#00e5ff';
  if (value >= -20) return '#a1a1aa';
  if (value >= -60) return '#fb923c';
  return '#f87171';
}

/* ─── SVG Avatar Generator ─── */

function NpcAvatar({
  appearance,
  discovered,
  size = 56,
  glowColor,
}: {
  appearance?: NPCAppearance;
  discovered: boolean;
  size?: number;
  glowColor?: string;
}) {
  const bodyColor = appearance?.bodyColor ?? '#475569';
  const accentColor = appearance?.accentColor ?? '#64748b';
  const headAccessory = appearance?.headAccessory ?? 'none';
  const silhouette = appearance?.silhouette ?? 'average';
  const glow = glowColor ?? '#00e5ff';

  if (!discovered) {
    return (
      <div
        className="npc-codex-silhouette rounded-xl flex items-center justify-center"
        style={{
          width: size,
          height: size,
          background: 'rgba(30,41,59,0.5)',
          border: '1px solid rgba(100,116,139,0.2)',
        }}
      >
        <Users className="size-5 text-slate-600" />
      </div>
    );
  }

  /* Body width based on silhouette */
  const bodyWidths: Record<NPCSilhouette, number> = { slim: 16, average: 22, heavy: 28 };
  const bw = bodyWidths[silhouette] ?? 22;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 56 56"
      className="npc-codex-avatar npc-codex-avatar--glow"
      style={{ '--npc-glow-color': glow } as React.CSSProperties}
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="28" cy="28" r="27" fill="rgba(15,23,42,0.6)" stroke={glow} strokeWidth="0.5" strokeOpacity="0.3" />
      {/* Body */}
      <rect
        x={28 - bw / 2}
        y={30}
        width={bw}
        height={18}
        rx={4}
        fill={bodyColor}
        opacity="0.9"
      />
      {/* Accent line on body */}
      <rect
        x={28 - bw / 2 + 2}
        y={36}
        width={bw - 4}
        height={2}
        rx={1}
        fill={accentColor}
        opacity="0.6"
      />
      {/* Head */}
      <circle cx="28" cy="20" r="8" fill={bodyColor} />
      {/* Eyes */}
      <circle cx="25" cy="19" r="1.2" fill={glow} opacity="0.8" />
      <circle cx="31" cy="19" r="1.2" fill={glow} opacity="0.8" />
      {/* Head accessory */}
      {headAccessory === 'glasses' && (
        <g opacity="0.7">
          <circle cx="25" cy="19" r="3" fill="none" stroke={accentColor} strokeWidth="0.8" />
          <circle cx="31" cy="19" r="3" fill="none" stroke={accentColor} strokeWidth="0.8" />
          <line x1="28" y1="19" x2="28" y2="19" stroke={accentColor} strokeWidth="0.6" />
        </g>
      )}
      {headAccessory === 'hat' && (
        <rect x="18" y="11" width="20" height="4" rx="2" fill={accentColor} opacity="0.7" />
      )}
      {headAccessory === 'scarf' && (
        <rect x="23" y="26" width="10" height="4" rx="2" fill={accentColor} opacity="0.5" />
      )}
      {headAccessory === 'earring' && (
        <circle cx="20" cy="22" r="1" fill={accentColor} opacity="0.8" />
      )}
    </svg>
  );
}

/* ─── NPC Card ─── */

function NpcCard({
  data,
  onClick,
}: {
  data: NpcCardData;
  onClick: () => void;
}) {
  const { npc, discovered, relationValue } = data;
  const relColor = getRelationColor(relationValue);
  const relLabel = getRelationLabel(relationValue);
  const glowColor = npc.appearance?.glowColor ?? '#00e5ff';
  const isDiscovered = discovered;

  return (
    <motion.button
      type="button"
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className={`
        npc-codex-card
        ${isDiscovered ? 'npc-codex-card--discovered' : 'npc-codex-card--undiscovered'}
        npc-codex-glass npc-codex-glass--hover
        rounded-xl p-3 w-full text-left cursor-pointer
      `}
      style={{
        borderColor: isDiscovered
          ? `${glowColor}25`
          : 'rgba(100,116,139,0.12)',
      }}
    >
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <NpcAvatar
          appearance={isDiscovered ? npc.appearance : undefined}
          discovered={isDiscovered}
          glowColor={glowColor}
          size={52}
        />

        {/* Info */}
        <div className="flex flex-col min-w-0 flex-1 gap-1.5">
          {/* Name + faction */}
          <div className="flex items-center gap-2">
            <span className={`text-sm font-semibold truncate ${
              isDiscovered ? 'text-slate-100' : 'text-slate-600'
            }`}>
              {isDiscovered ? npc.name : '???'}
            </span>
            {isDiscovered && npc.faction && (
              <span className={`npc-codex-faction-badge ${getFactionBadgeClass(npc.faction)} shrink-0`}>
                {FACTION_LABELS[npc.faction] ?? npc.faction}
              </span>
            )}
          </div>

          {/* Description (truncated) */}
          {isDiscovered && npc.description && (
            <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">
              {npc.description}
            </p>
          )}
          {!isDiscovered && (
            <p className="text-[11px] text-slate-600 italic">
              Персонаж ещё не обнаружен
            </p>
          )}

          {/* Relation bar (discovered only) */}
          {isDiscovered && (
            <div className="flex items-center gap-2 mt-0.5">
              <div className="npc-codex-relation-bar flex-1">
                <div
                  className="npc-codex-relation-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (relationValue + 100) / 2))}%`,
                    background: relColor,
                  }}
                />
              </div>
              <span
                className="text-[9px] font-mono shrink-0"
                style={{ color: `${relColor}aa` }}
              >
                {relLabel.label}
              </span>
            </div>
          )}
        </div>

        {/* Arrow indicator */}
        {isDiscovered && (
          <ChevronRight className="size-4 text-slate-600 shrink-0 mt-2" />
        )}
        {!isDiscovered && (
          <Lock className="size-3.5 text-slate-700 shrink-0 mt-2" />
        )}
      </div>
    </motion.button>
  );
}

/* ─── Detail View ─── */

function NpcDetailView({
  npc,
  relationValue,
  onClose,
}: {
  npc: NPCDefinition;
  relationValue: number;
  onClose: () => void;
}) {
  const glowColor = npc.appearance?.glowColor ?? '#00e5ff';
  const relInfo = getRelationLabel(relationValue);
  const relColor = getRelationColor(relationValue);

  /* Determine which bark band to show */
  const barkBand = relationValue >= 20
    ? npc.barkTexts?.friendly
    : relationValue >= -20
      ? npc.barkTexts?.neutral
      : npc.barkTexts?.hostile;

  const barkLines = barkBand
    ? (Array.isArray(barkBand) ? barkBand : [barkBand])
    : [];

  const ambientLines = npc.ambientBarks?.idle
    ? (Array.isArray(npc.ambientBarks.idle) ? npc.ambientBarks.idle : [npc.ambientBarks.idle])
    : [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 16 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="npc-codex-glass rounded-xl overflow-hidden"
      style={{ borderColor: `${glowColor}30` }}
    >
      {/* Header with avatar and background glow */}
      <div
        className="relative p-5"
        style={{ background: `linear-gradient(180deg, ${glowColor}0a 0%, transparent 100%)` }}
      >
        <div className="flex items-start gap-4">
          <NpcAvatar
            appearance={npc.appearance}
            discovered={true}
            glowColor={glowColor}
            size={72}
          />
          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-slate-100 mb-1">{npc.name}</h3>
            <div className="flex items-center gap-2 flex-wrap">
              {npc.faction && (
                <span className={`npc-codex-faction-badge ${getFactionBadgeClass(npc.faction)}`}>
                  {FACTION_LABELS[npc.faction] ?? npc.faction}
                </span>
              )}
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded-md"
                style={{
                  color: relColor,
                  background: `${relColor}12`,
                  border: `1px solid ${relColor}30`,
                }}
              >
                <Heart className="size-3 inline mr-1" />
                {relInfo.label} ({relationValue})
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            aria-label="Закрыть детали"
          >
            <X className="size-4" />
          </button>
        </div>
      </div>

      <ScrollArea className="npc-codex-scroll" style={{ maxHeight: '60vh' }}>
        <div className="p-5 space-y-5">
          {/* Full description */}
          {npc.description && (
            <div>
              <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <BookOpen className="size-3" />
                Описание
              </h4>
              <p className="text-sm text-slate-300 leading-relaxed">{npc.description}</p>
            </div>
          )}

          {/* Location */}
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <MapPin className="size-3" />
              Местоположение
            </h4>
            <p className="text-xs text-slate-400">{getNpcLocation(npc.id)}</p>
          </div>

          {/* Relation detail */}
          <div>
            <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Heart className="size-3" />
              Отношение
            </h4>
            <div className="flex items-center gap-3">
              <div className="npc-codex-relation-bar flex-1" style={{ height: '6px' }}>
                <div
                  className="npc-codex-relation-fill"
                  style={{
                    width: `${Math.max(0, Math.min(100, (relationValue + 100) / 2))}%`,
                    background: `linear-gradient(90deg, #f87171, ${relColor})`,
                    boxShadow: `0 0 8px ${relColor}40`,
                  }}
                />
              </div>
              <span className="text-xs font-mono" style={{ color: relColor }}>
                {relationValue}
              </span>
            </div>
          </div>

          {/* Dialogue snippets */}
          {barkLines.length > 0 && (
            <div>
              <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="size-3" />
                Фразы
              </h4>
              <div className="space-y-2">
                {barkLines.slice(0, 3).map((line, i) => (
                  <div key={i} className="npc-codex-quote text-xs">
                    «{line}»
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Ambient personality quotes */}
          {ambientLines.length > 0 && (
            <div>
              <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CircleDot className="size-3" />
                Обрывки мыслей
              </h4>
              <div className="space-y-2">
                {ambientLines.slice(0, 2).map((line, i) => (
                  <div key={i} className="npc-codex-quote text-xs text-slate-500">
                    «{line}»
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quest involvement */}
          {npc.questsGiven && npc.questsGiven.length > 0 && (
            <div>
              <h4 className="text-[10px] text-slate-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Swords className="size-3" />
                Связанные задания
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {npc.questsGiven.map((questId) => (
                  <span
                    key={questId}
                    className="text-[10px] font-mono px-2 py-1 rounded-md bg-slate-800/50 text-cyan-400/70 border border-cyan-900/20"
                  >
                    {questId}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </motion.div>
  );
}

/* ─── Filter Tabs ─── */

const FILTER_TABS: { id: FilterTab; label: string; icon: React.ReactNode }[] = [
  { id: 'all', label: 'Все', icon: <Users className="size-3" /> },
  { id: 'network', label: 'Сеть', icon: <Shield className="size-3" /> },
  { id: 'neutral', label: 'Нейтральные', icon: <CircleDot className="size-3" /> },
  { id: 'chk_tolpa', label: 'ЧК Толпа', icon: <Swords className="size-3" /> },
  { id: 'discovered', label: 'Открытые', icon: <Eye className="size-3" /> },
  { id: 'undiscovered', label: 'Скрытые', icon: <EyeOff className="size-3" /> },
];

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */

export function NpcCodexPanel({ open, onClose }: NpcCodexPanelProps) {
  /* ── State ── */
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<FilterTab>('all');
  const [selectedNpcId, setSelectedNpcId] = useState<string | null>(null);

  /* ── Game store subscriptions ── */
  const npcRelations = useGameStore((s) => s.npcRelations);
  const npcAffinity = useGameStore((s) => s.npcAffinity);

  /* ── NPC Codex store subscriptions ── */
  const discoveredNpcs = useNpcCodexStore((s) => s.discoveredNpcs);
  const discoveredSet = useMemo(
    () => new Set(discoveredNpcs),
    [discoveredNpcs],
  );

  /* ── Build relation maps ── */
  const relationMap = useMemo(() => {
    const map = new Map<string, number>();
    for (const rel of npcRelations) {
      map.set(rel.npcId, rel.value);
    }
    return map;
  }, [npcRelations]);

  const affinityMap = useMemo(() => {
    return { ...npcAffinity };
  }, [npcAffinity]);

  /* ── Build card data ── */
  const allCardData = useMemo(() => {
    return ALL_NPC_DEFINITIONS.map((npc) => ({
      npc,
      discovered: discoveredSet.has(npc.id),
      relationValue: relationMap.get(npc.id) ?? affinityMap[npc.id] ?? 0,
    }));
  }, [ALL_NPC_DEFINITIONS, discoveredSet, relationMap, affinityMap]);

  /* ── Filter ── */
  const filteredData = useMemo(() => {
    let result = allCardData;

    switch (activeTab) {
      case 'network':
        result = result.filter((d) => d.npc.faction === 'network');
        break;
      case 'neutral':
        result = result.filter((d) => d.npc.faction === 'neutral' || !d.npc.faction);
        break;
      case 'chk_tolpa':
        result = result.filter((d) => d.npc.faction === 'tolpa' || d.npc.faction === 'chk_tolpa');
        break;
      case 'discovered':
        result = result.filter((d) => d.discovered);
        break;
      case 'undiscovered':
        result = result.filter((d) => !d.discovered);
        break;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((d) =>
        d.discovered && d.npc.name.toLowerCase().includes(q),
      );
    }

    /* Sort: discovered first, then by name */
    return [...result].sort((a, b) => {
      if (a.discovered !== b.discovered) return a.discovered ? -1 : 1;
      return a.npc.name.localeCompare(b.npc.name, 'ru');
    });
  }, [allCardData, activeTab, searchQuery]);

  /* ── Stats ── */
  const totalNpcs = ALL_NPC_IDS.length;
  const discoveredCount = discoveredNpcs.length;
  const maxAffinityCount = allCardData.filter(
    (d) => d.discovered && d.relationValue >= 100,
  ).length;

  /* ── Selected NPC ── */
  const selectedData = selectedNpcId
    ? allCardData.find((d) => d.npc.id === selectedNpcId)
    : null;

  /* ── Reset detail when tab changes ── */
  useEffect(() => {
    const t = setTimeout(() => setSelectedNpcId(null), 0);
    return () => clearTimeout(t);
  }, [activeTab, searchQuery]);

  /* ── Footer ── */
  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-600 font-mono">
        volodka://npc-codex
      </span>
      <div className="flex items-center gap-3">
        <span className="text-[10px] text-slate-500 font-mono">
          <Eye className="size-3 inline mr-1" />
          {discoveredCount}/{totalNpcs} открыто
        </span>
        <span className="text-[10px] text-cyan-400/60 font-mono">
          <Star className="size-3 inline mr-1" />
          {maxAffinityCount}/{totalNpcs} макс.
        </span>
      </div>
    </div>
  );

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Кодекс персонажей"
      accentColor="cyan"
      layout="sidebar"
      icon={<Users className="size-5 text-cyan-400" />}
      shortcutLabel="N"
      urlPath="volodka://npc-codex"
      closeAriaLabel="Закрыть кодекс персонажей"
      footer={footer}
    >
      <div className="flex flex-col h-full" data-testid="npc-codex-panel">
        {/* Search + Stats bar */}
        <div className="px-4 py-3 border-b border-cyan-900/20">
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Поиск персонажей..."
              className="npc-codex-search"
              aria-label="Поиск персонажей"
            />
          </div>

          {/* Progress bar */}
          <div className="flex items-center gap-3 mb-3">
            <div className="npc-codex-relation-bar flex-1" style={{ height: '4px' }}>
              <motion.div
                className="npc-codex-relation-fill"
                style={{
                  background: 'linear-gradient(90deg, #0e7490, #00e5ff)',
                  boxShadow: '0 0 8px rgba(0,229,255,0.3)',
                }}
                initial={false}
                animate={{
                  width: `${totalNpcs > 0 ? (discoveredCount / totalNpcs) * 100 : 0}%`,
                }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[10px] text-cyan-400/60 font-mono shrink-0">
              {discoveredCount}/{totalNpcs}
            </span>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            {FILTER_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`npc-codex-tab ${isActive ? 'npc-codex-tab--active' : ''}`}
                  aria-pressed={isActive}
                >
                  <span className="inline-flex items-center gap-1">
                    {tab.icon}
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content area */}
        <div className="flex-1 min-h-0 relative">
          <AnimatePresence mode="wait">
            {selectedData && selectedData.discovered ? (
              <motion.div
                key="detail"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 p-4"
              >
                <button
                  type="button"
                  onClick={() => setSelectedNpcId(null)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400/60 hover:text-cyan-400/90 transition-colors mb-3"
                >
                  <ChevronRight className="size-3 rotate-180" />
                  Назад к списку
                </button>
                <NpcDetailView
                  npc={selectedData.npc}
                  relationValue={selectedData.relationValue}
                  onClose={() => setSelectedNpcId(null)}
                />
              </motion.div>
            ) : (
              <motion.div
                key="grid"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full"
              >
                <ScrollArea className="npc-codex-scroll h-full">
                  <div className="p-4">
                    {filteredData.length === 0 ? (
                      <div className="text-center py-12">
                        <Users className="size-10 text-slate-700 mx-auto mb-3" />
                        <p className="text-sm text-slate-500">Персонажи не найдены</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
                        <AnimatePresence>
                          {filteredData.map((data) => (
                            <NpcCard
                              key={data.npc.id}
                              data={data}
                              onClick={() => {
                                if (data.discovered) setSelectedNpcId(data.npc.id);
                              }}
                            />
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </PanelWrapper>
  );
}
