/* ─── Volodka RPG – Faction Reputation Panel ───
 *
 * Lists each faction with:
 *   • aggregate reputation bar (average of all met NPC relations in faction)
 *   • tier label (Враг/Недоверие/Незнакомец/Знакомый/Друг/Близкий —
 *     reused from npcGifts NPC_AFFINITY_LEVELS)
 *   • count of NPCs met in faction / total members
 *
 * Opened from the Codex panel header via eventBus.emit('ui:open_panel',
 * { panel: 'factionReputation' }). The panel id is registered in
 * orchestrator/types.ts PANEL_IDS and rendered by LazyPanelSlot in
 * OrchestratorPanelSlots.
 */

'use client';

import { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Shield, Swords, CircleDot, Scale, Activity, Lock,
} from 'lucide-react';
import { PanelWrapper } from './PanelWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FACTION_IDS,
  FACTION_LABELS_RU,
  NPC_NEUTRAL_RELATION,
  useFactionReputation,
  type FactionId,
  type FactionReputationEntry,
} from '@/store/selectors/factionReputationSelectors';
import {
  NPC_AFFINITY_LEVELS,
  getAffinityLevel,
} from '@/data/npcGifts';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Types ─── */

interface FactionReputationPanelProps {
  open: boolean;
  onClose: () => void;
}

/* ─── Faction visual identity ───
 * Each faction gets a stable color + icon so the panel reads at a glance.
 * Network = cyan (the underground signal), Guild = amber (the archive),
 * Resistance = emerald (the green of growth/forbidden books),
 * Neutral = slate, ТОЛПА = rose (campfire + port-wine).
 */
interface FactionVisual {
  label: string;
  color: string;
  glow: string;
  icon: typeof Users;
  blurb: string;
}

const FACTION_VISUALS: Record<FactionId, FactionVisual> = {
  network: {
    label: FACTION_LABELS_RU.network,
    color: '#00e5ff',
    glow: '0 0 12px rgba(0,229,255,0.25)',
    icon: Shield,
    blurb: 'Подполье хакеров и курьеров Сети. Стихи как валюта, тишина как щит.',
  },
  guild: {
    label: FACTION_LABELS_RU.guild,
    color: '#fbbf24',
    glow: '0 0 12px rgba(251,191,36,0.25)',
    icon: Scale,
    blurb: 'IT-гильдия «Кодекс». Контроль над инфраструктурой и тайной основания.',
  },
  resistance: {
    label: FACTION_LABELS_RU.resistance,
    color: '#34d399',
    glow: '0 0 12px rgba(52,211,153,0.25)',
    icon: Swords,
    blurb: '«Чёрная Чернильница». Утечки, саботаж чипов, ночные трансляции стихов.',
  },
  neutral: {
    label: FACTION_LABELS_RU.neutral,
    color: '#a1a1aa',
    glow: '0 0 8px rgba(161,161,170,0.18)',
    icon: CircleDot,
    blurb: 'Обыватели города: бариста, библиотекари, рыбаки, бабки-паяльщицы.',
  },
  tolpa: {
    label: FACTION_LABELS_RU.tolpa,
    color: '#fb7185',
    glow: '0 0 12px rgba(251,113,133,0.25)',
    icon: Users,
    blurb: 'Лесной лагерь ЧК / ТОЛПА. Костёр, портвейн 777, кассеты с запретной поэзией.',
  },
};

/* ─── Bar helpers ───
 * Relation values are 0–100 (worldSlice clamps to [0, 100], neutral = 50).
 * We render a centered bar: 50% is the middle, <50 fills left (red),
 * >50 fills right (green/cyan). This matches the CodexPanel/NpcCodexPanel
 * relation-bar convention but makes the "deviation from neutral" readable.
 */
function relationToBarPercent(value: number): number {
  // Map 0..100 → 0..100 with 50 as the center.
  // We just use the raw value (0..100) as the bar width for simplicity,
  // but recolor based on tier — the tier label tells the player where
  // "neutral" is.
  return Math.max(0, Math.min(100, value));
}

function getTierColor(value: number): string {
  // Mirror the tier color from NpcCodexPanel.getRelationColor for consistency.
  if (value >= 81) return '#34d399';
  if (value >= 51) return '#34d399';
  if (value >= 11) return '#00e5ff';
  if (value >= -9) return '#a1a1aa';
  if (value >= -49) return '#fb923c';
  return '#f87171';
}

/* ─── Faction Row ─── */

function FactionRow({
  factionId,
  entry,
  index,
}: {
  factionId: FactionId;
  entry: FactionReputationEntry;
  index: number;
}) {
  const reducedMotion = useEffectiveReducedMotion();
  const visual = FACTION_VISUALS[factionId];
  const Icon = visual.icon;
  const { avgRelation, metCount, totalMembers } = entry;

  const hasMet = metCount > 0;
  const tier = getAffinityLevel(avgRelation);
  const tierColor = getTierColor(avgRelation);
  const barPercent = relationToBarPercent(avgRelation);

  // The aggregate tier is only meaningful when the player has actually met
  // someone in the faction. Otherwise show a locked / unmet state.
  const displayValue = hasMet ? avgRelation : NPC_NEUTRAL_RELATION;
  const displayTier = hasMet ? tier : NPC_AFFINITY_LEVELS[2]; // Незнакомец

  return (
    <motion.div
      initial={reducedMotion ? false : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        duration: reducedMotion ? 0 : 0.3,
        delay: reducedMotion ? 0 : index * 0.05,
        ease: [0.16, 1, 0.3, 1],
      }}
      className="rounded-xl border bg-slate-950/40 p-4 transition-colors hover:bg-slate-950/60"
      style={{
        borderColor: hasMet ? `${visual.color}25` : 'rgba(100,116,139,0.12)',
        boxShadow: hasMet ? `inset 0 0 0 1px ${visual.color}08` : 'none',
      }}
    >
      {/* Header row: icon + name + tier label */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className="shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
          style={{
            background: hasMet ? `${visual.color}14` : 'rgba(30,41,59,0.5)',
            border: `1px solid ${hasMet ? `${visual.color}30` : 'rgba(100,116,139,0.15)'}`,
          }}
        >
          {hasMet ? (
            <Icon className="size-5" style={{ color: visual.color }} aria-hidden />
          ) : (
            <Lock className="size-4 text-slate-600" aria-hidden />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-sm font-semibold text-slate-100 truncate">
              {visual.label}
            </h3>
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium rounded-md"
              style={{
                color: hasMet ? tierColor : '#94a3b8',
                background: hasMet ? `${tierColor}12` : 'rgba(148,163,184,0.08)',
                border: `1px solid ${hasMet ? `${tierColor}30` : 'rgba(148,163,184,0.15)'}`,
              }}
            >
              {displayTier.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-snug mt-0.5 line-clamp-2">
            {visual.blurb}
          </p>
        </div>

        {/* Numeric value + met count */}
        <div className="shrink-0 text-right">
          <div
            className="text-base font-mono font-semibold tabular-nums"
            style={{ color: hasMet ? tierColor : '#64748b' }}
          >
            {hasMet ? displayValue : '—'}
          </div>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
            {metCount}<span className="opacity-50">/{totalMembers}</span>
          </div>
        </div>
      </div>

      {/* Reputation bar */}
      <div className="relative">
        <div
          className="h-2 rounded-full overflow-hidden bg-slate-800/60 relative"
          role="progressbar"
          aria-valuenow={hasMet ? displayValue : 0}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Репутация фракции «${visual.label}»`}
        >
          {/* Neutral center tick — visual anchor at 50% */}
          <div
            className="absolute top-0 bottom-0 w-px bg-slate-600/50"
            style={{ left: '50%' }}
            aria-hidden
          />
          {hasMet ? (
            <motion.div
              className="h-full rounded-full"
              style={{
                background: `linear-gradient(90deg, ${tierColor}cc, ${tierColor})`,
                boxShadow: `0 0 8px ${tierColor}40`,
              }}
              initial={reducedMotion ? false : { width: 0 }}
              animate={{ width: `${barPercent}%` }}
              transition={{
                duration: reducedMotion ? 0 : 0.6,
                ease: [0.16, 1, 0.3, 1],
                delay: reducedMotion ? 0 : index * 0.05 + 0.1,
              }}
            />
          ) : (
            <div
              className="h-full rounded-full bg-slate-700/40"
              style={{ width: '50%' }}
              aria-hidden
            />
          )}
        </div>

        {/* Tier tick marks (0 / 50 / 100) */}
        <div className="flex justify-between mt-1 text-[9px] text-slate-600 font-mono">
          <span>0</span>
          <span className="opacity-60">нейтрально</span>
          <span>100</span>
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Aggregate summary header ─── */

function SummaryHeader({ entries }: { entries: FactionReputationEntry[] }) {
  const totalMet = entries.reduce((sum, e) => sum + e.metCount, 0);
  const totalMembers = entries.reduce((sum, e) => sum + e.totalMembers, 0);
  const metFactions = entries.filter((e) => e.metCount > 0).length;
  const overallAvg =
    totalMet > 0
      ? Math.round(
          entries.reduce(
            (sum, e) => sum + e.avgRelation * e.metCount,
            0,
          ) / Math.max(1, totalMet),
        )
      : NPC_NEUTRAL_RELATION;

  const overallTier = getAffinityLevel(overallAvg);
  const overallColor = getTierColor(overallAvg);

  return (
    <div className="px-4 py-3 border-b border-slate-800/40">
      <div className="flex items-center gap-2 mb-2">
        <Activity className="size-3.5 text-cyan-400/70" aria-hidden />
        <span className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">
          Общая репутация
        </span>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <div className="flex items-baseline gap-2">
            <span
              className="text-2xl font-mono font-semibold tabular-nums"
              style={{ color: totalMet > 0 ? overallColor : '#64748b' }}
            >
              {totalMet > 0 ? overallAvg : '—'}
            </span>
            <span
              className="text-xs"
              style={{ color: totalMet > 0 ? overallColor : '#94a3b8' }}
            >
              {totalMet > 0 ? overallTier.label : 'Нет данных'}
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-mono mt-0.5">
            Знакомых: {totalMet}<span className="opacity-50">/{totalMembers}</span>
            {' · '}
            Фракций открыто: {metFactions}<span className="opacity-50">/{entries.length}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

/* ─── Tier legend ─── */

function TierLegend() {
  return (
    <div className="px-4 py-2 border-b border-slate-800/40">
      <div className="flex items-center gap-1.5 mb-1.5">
        <span className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">
          Шкала репутации
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {NPC_AFFINITY_LEVELS.map((level) => {
          const color = getTierColor(level.minAffinity + 1);
          return (
            <span
              key={level.label}
              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] rounded border"
              style={{
                color: `${color}cc`,
                borderColor: `${color}30`,
                background: `${color}0a`,
              }}
            >
              <span
                className="inline-block w-1.5 h-1.5 rounded-full"
                style={{ background: color }}
                aria-hidden
              />
              {level.label}
              <span className="opacity-50 font-mono">{level.minAffinity}</span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Main Component ─── */

export function FactionReputationPanel({ open, onClose }: FactionReputationPanelProps) {
  const reputationMap = useFactionReputation();

  const entries = useMemo(
    () => FACTION_IDS.map((id) => ({ id, entry: reputationMap[id] })),
    [reputationMap],
  );

  const totalMet = entries.reduce((sum, { entry }) => sum + entry.metCount, 0);

  const footer = (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-slate-600 font-mono">
        volodka://faction-reputation
      </span>
      <span className="text-[10px] text-slate-500 font-mono">
        <Users className="size-3 inline mr-1" />
        {totalMet} знакомых
      </span>
    </div>
  );

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Репутация фракций"
      accentColor="cyan"
      layout="centered"
      icon={<Scale className="size-5 text-cyan-400" />}
      urlPath="volodka://faction-reputation"
      closeAriaLabel="Закрыть панель репутации фракций"
      footer={footer}
    >
      <div className="flex flex-col h-full" data-testid="faction-reputation-panel">
        <SummaryHeader entries={entries.map(({ entry }) => entry)} />
        <TierLegend />
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-4 flex flex-col gap-3">
            {entries.map(({ id, entry }, i) => (
              <FactionRow
                key={id}
                factionId={id}
                entry={entry}
                index={i}
              />
            ))}
            {totalMet === 0 && (
              <div className="text-center py-8">
                <Users className="size-10 text-slate-700 mx-auto mb-3" />
                <p className="text-sm text-slate-500">
                  Вы пока не познакомились ни с одним персонажем
                </p>
                <p className="text-[10px] text-slate-600 mt-1">
                  Заговорите с NPC, чтобы начать зарабатывать репутацию
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </PanelWrapper>
  );
}
