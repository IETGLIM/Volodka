import { memo } from 'react';
import { motion } from 'framer-motion';
import { Check, Clock, Coins, Diamond, Gift, Heart, X, Zap } from 'lucide-react';
import { DAILY_MISSION_CATEGORY_META, type DailyMission } from '@/data/dailyMissions';
import { QuestBoardMissionProgressBar } from '@/components/game/questBoard/QuestBoardMissionProgressBar';
import { resolveQuestBoardMissionIcon } from '@/components/game/questBoard/questBoardMissionIcons';
import { useAcceptedDailyMission } from '@/components/game/questBoard/useQuestBoardSelectors';
import { useMissionResetTimer } from '@/components/game/questBoard/useMissionResetTimer';
import {
  QUEST_BOARD_DIFFICULTY_DIAMOND_COUNT,
  QUEST_BOARD_LABELS,
} from '@/engine/questBoard/questBoardConstants';
import {
  getCardEnterMotion,
  getMissionCardVisualState,
  isObjectiveComplete,
} from '@/engine/questBoard/questBoardPresentation';

type QuestBoardMissionCardProps = {
  mission: DailyMission;
  reducedMotion: boolean;
  acceptDisabled: boolean;
  onAccept: (missionId: string) => void;
  onAbandon: (missionId: string) => void;
  onClaim: (missionId: string) => void;
};

function DifficultyIndicator({ difficulty }: { difficulty: DailyMission['difficulty'] }) {
  const count = QUEST_BOARD_DIFFICULTY_DIAMOND_COUNT[difficulty];
  return (
    <div className="flex items-center gap-0.5" aria-hidden="true">
      {Array.from({ length: 3 }, (_, index) => (
        <Diamond
          key={index}
          className={`size-2.5 ${index < count ? 'text-amber-400 fill-amber-400' : 'text-slate-700 fill-slate-700'}`}
        />
      ))}
    </div>
  );
}

function CategoryBadge({ category }: { category: DailyMission['category'] }) {
  const meta = DAILY_MISSION_CATEGORY_META[category];
  return (
    <span
      className="text-[9px] font-mono px-1.5 py-0.5 rounded-sm uppercase tracking-wider"
      aria-label={meta.label}
      style={{
        color: meta.color,
        background: `${meta.color}12`,
        border: `1px solid ${meta.color}25`,
      }}
    >
      {meta.label}
    </span>
  );
}

export const QuestBoardMissionCard = memo(
  function QuestBoardMissionCard({
  mission,
  reducedMotion,
  acceptDisabled,
  onAccept,
  onAbandon,
  onClaim,
}: QuestBoardMissionCardProps) {
  const acceptedMission = useAcceptedDailyMission(mission.id);
  const resetTimeLeft = useMissionResetTimer(mission.resetSchedule);
  const cardMotion = getCardEnterMotion(reducedMotion);

  const meta = DAILY_MISSION_CATEGORY_META[mission.category];
  const MissionIcon = resolveQuestBoardMissionIcon(mission.icon);
  const isAccepted = acceptedMission !== undefined;
  const isCompleted = acceptedMission?.completed ?? false;
  const isClaimed = acceptedMission?.claimed ?? false;
  const visual = getMissionCardVisualState(isAccepted, isCompleted, isClaimed, meta.color);

  return (
    <motion.article
      role="listitem"
      aria-label={QUEST_BOARD_LABELS.missionAria(mission.title)}
      initial={cardMotion.initial}
      animate={cardMotion.animate}
      exit={cardMotion.exit}
      transition={cardMotion.transition}
      className={`relative rounded-lg border overflow-hidden transition-all${
        isClaimed ? ' quest-board-mission-card--claimed' : isCompleted ? ' quest-board-mission-card--completed' : ''
      }`}
      style={{
        borderLeftColor: meta.color,
        borderLeftWidth: '3px',
        borderColor: visual.borderColor,
        background: visual.background,
        ...(isClaimed ? {} : { opacity: visual.opacity }),
      }}
    >
      <div className="p-3 sm:p-4">
        <div className="flex items-start gap-2.5">
          <div
            className="w-9 h-9 rounded-md flex items-center justify-center shrink-0 border"
            style={{
              borderColor: `${meta.color}25`,
              background: isAccepted ? `${meta.color}12` : 'rgba(0,0,0,0.3)',
              color: isAccepted ? meta.color : 'rgba(100,116,139,0.5)',
            }}
            aria-hidden="true"
          >
            {isClaimed ? (
              <Check className="size-4 text-emerald-400/50" />
            ) : isCompleted ? (
              <Gift className="size-4 text-emerald-400" />
            ) : (
              <MissionIcon className="size-4" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5 flex-wrap">
              <span
                className="text-xs font-semibold font-mono truncate"
                style={{
                  color: isClaimed ? '#64748b' : isCompleted ? '#34d399' : '#e2e8f0',
                  textShadow: isCompleted ? '0 0 6px rgba(52,211,153,0.3)' : 'none',
                }}
              >
                {mission.title}
              </span>
              <CategoryBadge category={mission.category} />
              <DifficultyIndicator difficulty={mission.difficulty} />
            </div>
            <p className="text-[10px] text-slate-400 leading-tight line-clamp-2 mt-0.5">
              {mission.description}
            </p>
          </div>
        </div>

        <div className="mt-2.5 space-y-1.5">
        {mission.objectives.map((objective) => {
          const current = acceptedMission?.progress[objective.id] ?? 0;
          const target = objective.target;
          const done = isAccepted && isObjectiveComplete(current, target);
          return (
            <div key={objective.id}>
              <div className="flex items-center justify-between mb-0.5">
                <span className={`text-[10px] font-mono ${done ? 'text-emerald-400' : 'text-slate-400'}`}>
                  {done && (
                    <Check className="size-2.5 inline mr-0.5" aria-hidden="true" />
                  )}
                  {objective.description}
                </span>
                {isAccepted && (
                  <span className={`text-[10px] font-mono tabular-nums ${done ? 'text-emerald-400' : 'text-slate-500'}`}>
                    {current}/{target}
                  </span>
                )}
              </div>
              {isAccepted && (
                <>
                  <span className="sr-only">
                    {done
                      ? QUEST_BOARD_LABELS.objectiveComplete(objective.description)
                      : QUEST_BOARD_LABELS.objectiveProgress(current, target, objective.description)}
                  </span>
                  <QuestBoardMissionProgressBar
                    current={current}
                    target={target}
                    label={objective.description}
                    reducedMotion={reducedMotion}
                  />
                </>
              )}
            </div>
          );
        })}
        </div>

        <div className="mt-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-wrap" role="group" aria-label={QUEST_BOARD_LABELS.rewardsRegion}>
            <div className="flex items-center gap-0.5">
              <Zap className="size-3 text-cyan-400/60" aria-hidden="true" />
              <span className="sr-only">{QUEST_BOARD_LABELS.rewardXp}</span>
              <span className="text-[10px] font-mono text-cyan-300/80">{mission.rewards.xp}</span>
            </div>
            <div className="flex items-center gap-0.5">
              <Coins className="size-3 text-amber-400/60" aria-hidden="true" />
              <span className="sr-only">{QUEST_BOARD_LABELS.rewardCredits}</span>
              <span className="text-[10px] font-mono text-amber-300/80">{mission.rewards.credits}</span>
            </div>
            {mission.rewards.karma != null && mission.rewards.karma > 0 && (
              <div className="flex items-center gap-0.5">
                <Heart className="size-3 text-rose-400/60" aria-hidden="true" />
                <span className="sr-only">{QUEST_BOARD_LABELS.rewardKarma}</span>
                <span className="text-[10px] font-mono text-rose-300/80">+{mission.rewards.karma}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <span className="sr-only">{QUEST_BOARD_LABELS.resetTimer(resetTimeLeft)}</span>
            <div className="flex items-center gap-1" aria-hidden="true">
              <Clock className="size-3 text-amber-400/70" />
              <span className="text-[10px] font-mono text-amber-400/70">{resetTimeLeft}</span>
            </div>

            {isClaimed ? (
              <span className="text-[9px] font-mono text-slate-600 px-2 py-1 rounded border border-slate-800/30 bg-slate-900/30">
                {QUEST_BOARD_LABELS.claimed}
              </span>
            ) : isCompleted ? (
              <motion.button
                type="button"
                onClick={() => onClaim(mission.id)}
                aria-label={QUEST_BOARD_LABELS.claimMission(mission.title)}
                className="quest-board-btn--accept quest-board-btn--claim flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all"
                whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              >
                <Gift className="size-3" aria-hidden="true" />
                {QUEST_BOARD_LABELS.claim}
              </motion.button>
            ) : isAccepted ? (
              <motion.button
                type="button"
                onClick={() => onAbandon(mission.id)}
                aria-label={QUEST_BOARD_LABELS.abandonMission(mission.title)}
                className="quest-board-btn--abandon quest-board-btn--secondary flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono uppercase tracking-wider transition-all"
                whileHover={reducedMotion ? undefined : { scale: 1.05 }}
                whileTap={reducedMotion ? undefined : { scale: 0.95 }}
              >
                <X className="size-3" aria-hidden="true" />
                {QUEST_BOARD_LABELS.abandon}
              </motion.button>
            ) : (
              <motion.button
                type="button"
                disabled={acceptDisabled}
                aria-disabled={acceptDisabled}
                onClick={() => onAccept(mission.id)}
                aria-label={
                  acceptDisabled
                    ? QUEST_BOARD_LABELS.acceptMissionDisabled(mission.title)
                    : QUEST_BOARD_LABELS.acceptMission(mission.title)
                }
                title={acceptDisabled ? QUEST_BOARD_LABELS.acceptSlotsFull : undefined}
                className={`quest-board-btn--accept flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider transition-all${
                  acceptDisabled ? ' quest-board-btn--disabled' : ''
                }`}
                whileHover={reducedMotion || acceptDisabled ? undefined : { scale: 1.05 }}
                whileTap={reducedMotion || acceptDisabled ? undefined : { scale: 0.95 }}
              >
                {QUEST_BOARD_LABELS.accept}
              </motion.button>
            )}
          </div>
        </div>
      </div>
    </motion.article>
  );
  },
  (prev, next) =>
    prev.mission.id === next.mission.id &&
    prev.reducedMotion === next.reducedMotion &&
    prev.acceptDisabled === next.acceptDisabled &&
    prev.onAccept === next.onAccept &&
    prev.onAbandon === next.onAbandon &&
    prev.onClaim === next.onClaim,
);

QuestBoardMissionCard.displayName = 'QuestBoardMissionCard';
