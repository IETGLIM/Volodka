import { memo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Circle, Gift, MapPin, Shield, Skull } from 'lucide-react';
import { NPCScheduleTimeline } from '@/components/game/NPCScheduleTimeline';
import { NPCPortrait, NPC_PORTRAIT_COLORS } from '@/components/game/shared/NPCPortrait';
import { findNpcById } from '@/data/allNpcDefinitions';
import { getAffinityLevel } from '@/data/npcGifts';
import {
  NPC_RELATIONSHIP_LABELS,
  RELATION_LEVEL_LABELS,
  type RelationLevel,
} from '@/engine/npcRelationship/npcRelationshipConstants';
import {
  formatAffinityValue,
  getAffinityBarPercent,
  getAffinityVisualStyle,
  getBarFillTransition,
  getCardEnterTransition,
  getAffinityBarTransition,
  getNpcPortraitPrimaryColor,
  getNpcSceneName,
  getRelationLevel,
  getRelationLevelColors,
  getScheduleRevealTransition,
  type NpcStateMap,
} from '@/engine/npcRelationship/npcRelationshipPresentation';
import type { NPCRelation } from '@/shared/types/game';

const RELATION_ICONS = {
  ally: Shield,
  neutral: Circle,
  enemy: Skull,
} as const satisfies Record<RelationLevel, typeof Shield>;

type NPCRelationshipCardProps = {
  relation: NPCRelation;
  index: number;
  npcStates: NpcStateMap;
  currentHour: number;
  showSchedule: boolean;
  affinity: number;
  canGift: boolean;
  reducedMotion: boolean;
  onOpenGift: (npcId: string) => void;
};

export const NPCRelationshipCard = memo(function NPCRelationshipCard({
  relation,
  index,
  npcStates,
  currentHour,
  showSchedule,
  affinity,
  canGift,
  reducedMotion,
  onOpenGift,
}: NPCRelationshipCardProps) {
  const npcDef = findNpcById(relation.npcId);
  if (!npcDef) return null;

  const level = getRelationLevel(relation.value);
  const colors = getRelationLevelColors(level);
  const RelationIcon = RELATION_ICONS[level];
  const sceneName = getNpcSceneName(relation.npcId, npcStates);
  const portraitPrimary = getNpcPortraitPrimaryColor(NPC_PORTRAIT_COLORS[relation.npcId]?.primary);
  const affinityLevel = getAffinityLevel(affinity);
  const affinityVisual = getAffinityVisualStyle(affinity);
  const cardMotion = getCardEnterTransition(index, reducedMotion);
  const scheduleMotion = getScheduleRevealTransition(reducedMotion);

  return (
    <motion.article
      initial={reducedMotion ? false : { opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={cardMotion}
      className="overflow-hidden rounded-xl border"
      aria-labelledby={`npc-rel-${relation.npcId}-name`}
      style={{
        borderColor: `${portraitPrimary}30`,
        background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(8,12,28,0.7) 100%)',
        boxShadow: `inset 0 1px 0 ${colors.glow}, 0 0 20px ${colors.glow}`,
      }}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div aria-hidden="true">
            <NPCPortrait npcId={relation.npcId} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <span
                id={`npc-rel-${relation.npcId}-name`}
                className="text-sm font-medium tracking-wide"
                style={{ color: portraitPrimary }}
              >
                {npcDef.name}
              </span>
              <RelationIcon className={`size-3.5 ${colors.text}`} aria-hidden="true" />
              <span className={`text-[10px] font-medium uppercase tracking-widest ${colors.text}`}>
                {RELATION_LEVEL_LABELS[level]}
              </span>
              <span
                className={`rounded border px-1.5 py-0.5 text-[9px] font-medium ${affinityVisual.badge.bg} ${affinityVisual.badge.text} ${affinityVisual.badge.border}`}
              >
                {affinityLevel.label}
              </span>
            </div>

            {npcDef.description && (
              <p className="mb-2 line-clamp-2 text-[11px] leading-relaxed text-slate-400/80">
                {npcDef.description}
              </p>
            )}

            {sceneName && (
              <div className="mb-2.5 flex items-center gap-1">
                <MapPin className="size-3 text-slate-500/60" aria-hidden="true" />
                <span className="text-[10px] text-slate-500/70">{sceneName}</span>
              </div>
            )}

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {NPC_RELATIONSHIP_LABELS.relation}
                </span>
                <span className={`font-mono text-xs font-medium ${colors.text}`}>{relation.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <motion.div
                  className={`h-full rounded-full ${colors.bar}`}
                  initial={reducedMotion ? false : { width: 0 }}
                  animate={{ width: `${relation.value}%` }}
                  transition={getBarFillTransition(index, reducedMotion)}
                  style={{ boxShadow: `0 0 8px ${colors.glow}` }}
                  role="progressbar"
                  aria-valuenow={relation.value}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={NPC_RELATIONSHIP_LABELS.relation}
                />
              </div>
            </div>

            <div className="mt-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase tracking-wider text-slate-500">
                  {NPC_RELATIONSHIP_LABELS.affinity}
                </span>
                <span className={`font-mono text-xs font-medium ${affinityVisual.text}`}>
                  {formatAffinityValue(affinity)}
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-slate-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]">
                <div className="absolute bottom-0 left-1/2 top-0 z-10 w-px bg-slate-600/30" aria-hidden="true" />
                <motion.div
                  className={`h-full rounded-full ${affinityVisual.bar}`}
                  initial={reducedMotion ? false : { width: '50%' }}
                  animate={{ width: `${getAffinityBarPercent(affinity)}%` }}
                  transition={getAffinityBarTransition(index, reducedMotion)}
                  role="progressbar"
                  aria-valuenow={affinity}
                  aria-valuemin={-100}
                  aria-valuemax={100}
                  aria-label={NPC_RELATIONSHIP_LABELS.affinity}
                />
              </div>
            </div>

            {canGift && (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  onOpenGift(relation.npcId);
                }}
                className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-md border border-cyan-500/20 bg-cyan-600/20 px-3 py-1.5 text-[11px] font-medium text-cyan-400 transition-all duration-150 hover:border-cyan-500/30 hover:bg-cyan-600/40 hover:text-cyan-300 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-400/70"
                aria-label={NPC_RELATIONSHIP_LABELS.giftAria(npcDef.name)}
              >
                <Gift className="size-3.5" aria-hidden="true" />
                {NPC_RELATIONSHIP_LABELS.gift}
              </button>
            )}
          </div>
        </div>

        <AnimatePresence>
          {showSchedule && (
            <motion.div
              initial={reducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reducedMotion ? { opacity: 0 } : { height: 0, opacity: 0 }}
              transition={scheduleMotion}
              className="overflow-hidden"
            >
              <div className="mt-2 border-t border-slate-700/20 pt-2">
                <NPCScheduleTimeline npcId={relation.npcId} currentHour={currentHour} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.article>
  );
});
