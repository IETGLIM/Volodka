
/* ─── Volodka RPG – Quest journal panel (AAA+ Overhaul v2) ───
   Grouped by status, difficulty indicators, progress bars, hints, rewards.
   Dark glass morphism with cyberpunk accents.
*/

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Circle, Trophy, BookOpen, EyeOff,
  Clock, AlertTriangle, RotateCcw, ChevronRight, Sparkles,
  Lightbulb, Shield, Swords, Zap, Star, Package, MapPin, MessageCircle, Gamepad2,
} from 'lucide-react';
import { QUEST_DEFINITIONS } from '@/data/quests';
import type {
  QuestDefinition,
  QuestType,
  QuestState,
  QuestDifficulty,
  SceneId,
  StoryEffect,
  TrainablePlayerSkill,
} from '@/shared/types/game';
import { findNpcById, getItemDefinition } from '@/data/gameDataLoader';
import { JOURNAL_SKILL_LABELS } from '@/components/game/journal/journalConstants';
import { getQuestMarker } from '@/store/questStore';
import { eventBus } from '@/engine/EventBus';

/* ── O(1) quest definition lookup (replaces O(n) .find() scans) ── */
const QUEST_DEF_MAP = new Map<string, QuestDefinition>(QUEST_DEFINITIONS.map((d) => [d.id, d]));
import {
  useActiveQuests,
  useFailedQuests,
  getQuestProgress,
  areDependenciesMet,
} from '@/store/selectors/questSelectors';
import { GOLDEN_PATH_QUEST_SPINE, ACT1_SOLNYSH_QUEST_SPINE } from '@/data/goldenPath';
import { dispatchGameAction } from '@/shared/gameBridge/gameActionBridge';
import { questCanRetry } from '@/shared/quest/questRetry';
import {
  canBypassRetryLock,
  isCriticalPathQuest,
  QUEST_RETRY_PENALTY,
} from '@/shared/quest/questFailureBypass';
import { useQuests, useCurrentSceneId } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  buildQuestJournalContextualHint,
  buildQuestJournalRouteCta,
} from '@/hooks/questJournalHint';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import { remainingQuestHours } from '@/engine/quest/questTimeLimits';

interface QuestsPanelProps {
  open: boolean;
  onClose: () => void;
}

const QUEST_TYPE_LABELS: Record<QuestType, { label: string; icon: typeof Trophy; color: string }> = {
  main: { label: 'Основные', icon: Trophy, color: 'text-amber-400' },
  side: { label: 'Побочные', icon: BookOpen, color: 'text-cyan-400' },
  hidden: { label: 'Скрытые', icon: EyeOff, color: 'text-purple-400' },
  daily: { label: 'Ежедневные', icon: Clock, color: 'text-emerald-400' },
};

const DIFFICULTY_CONFIG: Record<QuestDifficulty, { label: string; color: string; bgColor: string; borderColor: string; icon: typeof Shield }> = {
  easy: { label: 'Легко', color: 'text-emerald-400', bgColor: 'bg-emerald-950/30', borderColor: 'border-emerald-700/40', icon: Shield },
  medium: { label: 'Средне', color: 'text-amber-400', bgColor: 'bg-amber-950/30', borderColor: 'border-amber-700/40', icon: Swords },
  hard: { label: 'Сложно', color: 'text-rose-400', bgColor: 'bg-rose-950/30', borderColor: 'border-rose-700/40', icon: Zap },
};

function DifficultyBadge({ difficulty }: { difficulty?: QuestDifficulty }) {
  if (!difficulty) return null;
  const config = DIFFICULTY_CONFIG[difficulty];
  const Icon = config.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md border ${config.bgColor} ${config.borderColor} ${config.color}`}>
      <Icon className="size-2.5" />
      {config.label}
    </span>
  );
}

/* ── Objective type icon helper ── */
function getObjectiveTypeIcon(type: string) {
  switch (type) {
    case 'npc_talked': return <MessageCircle className="size-3 text-cyan-400/70" />;
    case 'location_visited': return <MapPin className="size-3 text-emerald-400/70" />;
    case 'item_collected': return <Package className="size-3 text-amber-400/70" />;
    case 'poem_collected': return <BookOpen className="size-3 text-purple-400/70" />;
    case 'flag_set': return <Zap className="size-3 text-yellow-400/70" />;
    case 'minigame_completed': return <Gamepad2 className="size-3 text-rose-400/70" />;
    case 'custom': return <Star className="size-3 text-slate-400/70" />;
    default: return <Circle className="size-3 text-slate-400/70" />;
  }
}

/* ── Grouped objective progress for collection-type quests ── */
function ObjectiveGroupProgress({ objectives, questState, label, icon }: {
  objectives: { id: string; description: string }[];
  questState: QuestState;
  label: string;
  icon: React.ReactNode;
}) {
  const completed = objectives.filter((o) => questState.objectives[o.id] === true).length;
  const total = objectives.length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className="mb-2">
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">
          {label}
        </span>
        <span className="text-[10px] font-mono tabular-nums ml-auto" style={{ color: completed === total ? '#34d399' : '#94a3b8' }}>
          {completed}/{total}
        </span>
      </div>
      <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ background: completed === total ? 'linear-gradient(90deg, #059669, #34d399)' : 'linear-gradient(90deg, #0e7490, #22d3ee)' }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

/* ── Animated checkmark for objective completion ── */
function ObjectiveCheckmark({ justCompleted }: { justCompleted: boolean }) {
  return (
    <AnimatePresence>
      {justCompleted ? (
        <motion.span
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 1.3, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 15 }}
          className="inline-flex items-center justify-center"
          aria-hidden="true"
        >
          <CheckCircle2 className="size-3.5 text-emerald-400" />
        </motion.span>
      ) : null}
    </AnimatePresence>
  );
}

function humanizeRewardLabel(reward: StoryEffect): string {
  if (reward.type === 'addSkill' && reward.skill) {
    const skill = reward.skill as TrainablePlayerSkill;
    const name = JOURNAL_SKILL_LABELS[skill]?.name ?? reward.skill;
    return `${name} +${reward.value ?? 0}`;
  }
  if (reward.type === 'addKarma') return `Карма +${reward.value ?? 0}`;
  if (reward.type === 'addCredits') return `Кредиты +${reward.value ?? 0}`;
  if (reward.type === 'addXp') return `Опыт +${reward.value ?? 0}`;
  if (reward.type === 'addItem' && reward.itemId) {
    const itemName = getItemDefinition(reward.itemId)?.name ?? reward.itemId;
    return itemName;
  }
  if (reward.type === 'setFlag') {
    if (reward.flag === 'network_member') return 'Статус: член Сети';
    return 'Прогресс сюжета';
  }
  return reward.type;
}

function RewardBadge({ reward, index }: { reward: StoryEffect; index: number }) {
  const label = humanizeRewardLabel(reward);

  const getIcon = () => {
    if (reward.type === 'addSkill') return <Star className="size-2.5 text-amber-400/60" />;
    if (reward.type === 'addKarma') return <Zap className="size-2.5 text-cyan-400/60" />;
    if (reward.type === 'addCredits') return <Sparkles className="size-2.5 text-yellow-400/60" />;
    if (reward.type === 'addItem') return <Trophy className="size-2.5 text-emerald-400/60" />;
    return <Sparkles className="size-2.5 text-purple-400/60" />;
  };

  return (
    <span key={index} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md border border-slate-700/30 bg-slate-800/40 text-slate-300">
      {getIcon()}
      {label}
    </span>
  );
}

function ShowOnMapButton({ questId, currentSceneId }: { questId: string; currentSceneId: SceneId }) {
  const marker = getQuestMarker(questId);
  if (!marker?.sceneId || marker.sceneId === currentSceneId) return null;

  return (
    <button
      type="button"
      className="inline-flex items-center gap-1 mt-2 px-2 py-1 rounded-md text-[10px] font-mono tracking-wide text-cyan-300/90 border border-cyan-700/40 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/50 transition-colors"
      onClick={(e) => {
        e.stopPropagation();
        eventBus.emit('ui:open_panel', { panel: 'worldMap', sceneId: marker.sceneId });
      }}
    >
      <MapPin className="size-3 text-cyan-400" />
      На карте
    </button>
  );
}

export function QuestsPanel({ open, onClose }: QuestsPanelProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const quests = useQuests();
  const currentSceneId = useCurrentSceneId();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFailed, setShowFailed] = useState(true);
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const [flashingQuestId, setFlashingQuestId] = useState<string | null>(null);
  const prevOpenRef = useRef(false);
  const flashTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  /* ── Flash effect when an objective updates ── */
  const prevObjectivesRef = useRef<Record<string, Record<string, boolean>>>({});
  useEffect(() => {
    const currentMap: Record<string, Record<string, boolean>> = {};
    for (const qs of quests) {
      if (qs.status === 'active') {
        currentMap[qs.questId] = { ...qs.objectives };
      }
    }
    const prevMap = prevObjectivesRef.current;
    for (const [questId, objectives] of Object.entries(currentMap)) {
      const prev = prevMap[questId];
      if (prev) {
        for (const [objId, completed] of Object.entries(objectives)) {
          if (completed && prev[objId] !== completed) {
            setFlashingQuestId(questId);
            const id = setTimeout(() => {
              flashTimeoutsRef.current.delete(id);
              setFlashingQuestId(null);
            }, 1200);
            flashTimeoutsRef.current.add(id);
            break;
          }
        }
      }
    }
    prevObjectivesRef.current = currentMap;
  }, [quests]);

  /* ── Listen for objective update events ── */
  useEffect(() => {
    const unsub = eventBus.on('quest:objective_updated', ({ questId }) => {
      setFlashingQuestId(questId);
      const id = setTimeout(() => {
        flashTimeoutsRef.current.delete(id);
        setFlashingQuestId(null);
      }, 1200);
      flashTimeoutsRef.current.add(id);
    });
    return unsub;
  }, []);

  // Cleanup flash timeouts on unmount
  useEffect(() => {
    const timeouts = flashTimeoutsRef.current;
    return () => {
      for (const id of timeouts) {
        clearTimeout(id);
      }
      timeouts.clear();
    };
  }, []);

  const activeQuests = useActiveQuests();
  const failedQuests = useFailedQuests();
  const completedQuests = quests.filter((q) => q.status === 'completed');

  const goldenPathFocusId = useMemo(() => {
    for (const questId of GOLDEN_PATH_QUEST_SPINE) {
      if (activeQuests.some((q) => q.questId === questId)) {
        return questId;
      }
    }
    return null;
  }, [activeQuests]);

  const expandQuest = useCallback((questId: string) => {
    setExpandedQuests((prev) => {
      const next = new Set(prev);
      next.add(questId);
      return next;
    });
    requestAnimationFrame(() => {
      document
        .querySelector(`[data-quest-id="${questId}"]`)
        ?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'nearest' });
    });
  }, [reducedMotion]);

  useEffect(() => {
    if (open && !prevOpenRef.current) {
      const spineActive = GOLDEN_PATH_QUEST_SPINE.find((id) =>
        activeQuests.some((q) => q.questId === id),
      );
      const mainActive = activeQuests.find((q) => {
        const def = QUEST_DEF_MAP.get(q.questId);
        return def?.questType === 'main';
      });
      const toExpand = spineActive ?? mainActive?.questId ?? activeQuests[0]?.questId;
      if (toExpand) {
        expandQuest(toExpand);
      }
    }
    prevOpenRef.current = open;
  }, [open, activeQuests, expandQuest]);

  useEffect(() => {
    if (!open) return undefined;
    const unsub = eventBus.on('quests:select_quest', ({ questId }) => {
      expandQuest(questId);
    });
    return unsub;
  }, [open, expandQuest]);
  // Group active quests by quest type
  const activeByType = useMemo(() => {
    const groups: Record<QuestType, QuestState[]> = {
      main: [],
      side: [],
      hidden: [],
      daily: [],
    };
    for (const qs of activeQuests) {
      const def = QUEST_DEF_MAP.get(qs.questId);
      if (def) {
        groups[def.questType].push(qs);
      } else {
        groups.side.push(qs);
      }
    }
    return groups;
  }, [activeQuests]);

  const toggleExpand = (questId: string) => {
    setExpandedQuests((prev) => {
      const next = new Set(prev);
      if (next.has(questId)) {
        next.delete(questId);
      } else {
        next.add(questId);
      }
      return next;
    });
  };

  const hasPoemBypass = (questId: string) => {
    const def = QUEST_DEF_MAP.get(questId);
    return def?.objectives.some((o) => o.poemPowerBypass) ?? false;
  };

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title="Задания"
      urlPath="volodka://quests"
      accentColor="cyan"
      layout="sidebar"
      icon={<Trophy className="size-5 text-cyan-400" />}
      shortcutLabel="Q"
      headerExtra={(
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onClose();
              eventBus.emit('ui:open_panel', { panel: 'questBoard' });
            }}
            title="Открыть доску ежедневных заданий"
            className="text-xs text-emerald-400/80 border border-emerald-500/20 hover:text-emerald-300 hover:bg-emerald-950/20"
          >
            Доска
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowFailed(!showFailed)}
            title="Показать/скрыть проваленные задания"
            className={`text-xs transition-all ${showFailed ? 'text-red-400 border border-red-500/30 bg-red-950/20' : 'text-slate-500 border border-transparent hover:text-red-400/70'}`}
          >
            <AlertTriangle className="size-3.5 mr-1" />
            Провал.{failedQuests.length > 0 ? ` (${failedQuests.length})` : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            title="Показать/скрыть завершённые задания"
            className={`text-xs transition-all ${showCompleted ? 'text-emerald-400 border border-emerald-500/30 bg-emerald-950/20' : 'text-slate-500 border border-transparent hover:text-emerald-400/70'}`}
          >
            <CheckCircle2 className="size-3.5 mr-1" />
            Заверш.{completedQuests.length > 0 ? ` (${completedQuests.length})` : ''}
          </Button>
        </div>
      )}
    >
      <div className="scanline-overlay" style={{ background: 'rgba(0,0,0,0.2)' }} data-testid="quests-panel">

            <ScrollArea className="flex-1 px-4 py-3">
              {/* ── Quest progress overview bar (at-a-glance summary) ── */}
              {(() => {
                const totalDiscovered = activeQuests.length + completedQuests.length + failedQuests.length;
                if (totalDiscovered === 0) return null;
                const avgProgress = activeQuests.length > 0
                  ? Math.round(activeQuests.reduce((sum, qs) => sum + getQuestProgress(qs.questId), 0) / activeQuests.length)
                  : 100;
                return (
                  <div
                    className="mb-4 p-3 rounded-xl border border-cyan-900/20 flex items-center gap-3"
                    style={{ background: 'linear-gradient(135deg, rgba(0,255,238,0.04) 0%, rgba(8,12,28,0.5) 100%)' }}
                    data-testid="quest-overview-bar"
                  >
                    <div className="flex items-center gap-1.5 shrink-0">
                      <BookOpen className="size-4 text-cyan-400/70" />
                      <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/60">Журнал</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2">
                      <Progress value={avgProgress} className="h-1.5 bg-slate-800/60" />
                      <span className="text-[10px] font-mono text-cyan-300/80 shrink-0">{avgProgress}%</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 text-[10px] font-mono">
                      <span className="text-cyan-400/80" title="Активные">{activeQuests.length}</span>
                      <span className="text-slate-600">/</span>
                      <span className="text-emerald-400/60" title="Завершённые">{completedQuests.length}</span>
                      {failedQuests.length > 0 && (
                        <>
                          <span className="text-slate-600">/</span>
                          <span className="text-red-400/60" title="Проваленные">{failedQuests.length}</span>
                        </>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Active quests by type */}
              {(Object.entries(QUEST_TYPE_LABELS) as [QuestType, typeof QUEST_TYPE_LABELS.main][]).map(
                ([type, config], typeIdx) => {
                  const typeQuests = activeByType[type];
                  if (typeQuests.length === 0) return null;

                  const TypeIcon = config.icon;
                  return (
                    <div key={type} className="mb-5">
                      {typeIdx > 0 && <div className="neon-divider cyber-glow-line mb-3" aria-hidden="true" />}
                      <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 ${config.color}`}>
                        <TypeIcon className="size-3.5" />
                        {config.label}
                        <span className="text-slate-500 ml-1">({typeQuests.length})</span>
                      </h3>
                      <div className="flex flex-col gap-3">
                        {typeQuests.map((qs) => {
                          const def = QUEST_DEF_MAP.get(qs.questId);
                          if (!def) return null;

                          const progress = getQuestProgress(qs.questId);
                          const isExpanded = expandedQuests.has(qs.questId);
                          const deps = areDependenciesMet(qs.questId);

                          const isGoldenPathFocus = qs.questId === goldenPathFocusId;
                          const isFlashing = qs.questId === flashingQuestId;

                          return (
                            <motion.div
                              key={qs.questId}
                              data-quest-id={qs.questId}
                              className={`rounded-xl border overflow-hidden ${
                                isGoldenPathFocus
                                  ? 'border-cyan-500/40 ring-1 ring-cyan-400/25'
                                  : 'border-cyan-900/15'
                              }`}
                              style={{
                                background: 'linear-gradient(135deg, rgba(15,23,42,0.6) 0%, rgba(8,12,28,0.7) 100%)',
                                boxShadow: 'inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.04)',
                              }}
                              animate={isFlashing && !reducedMotion ? {
                                boxShadow: [
                                  'inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.04)',
                                  '0 0 20px rgba(0,255,238,0.3), inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.04)',
                                  'inset 0 1px 0 rgb(var(--cyber-cyan-rgb) / 0.04)',
                                ],
                              } : undefined}
                              transition={{ duration: 0.6 }}
                            >
                              {/* Quest header */}
                              <div className="px-4 py-3">
                                <div className="flex items-center justify-between mb-2">
                                  <button
                                    type="button"
                                    className="flex items-center gap-1.5 text-left flex-1 min-w-0"
                                    onClick={() => toggleExpand(qs.questId)}
                                  >
                                    <ChevronRight
                                      className={`size-3.5 text-slate-500 transition-transform shrink-0 ${isExpanded ? 'rotate-90' : ''}`}
                                    />
                                    <span className="text-sm text-slate-100 font-medium truncate">{def.title}</span>
                                  </button>
                                  <div className="flex items-center gap-2 shrink-0 ml-2">
                                    {ACT1_SOLNYSH_QUEST_SPINE.includes(qs.questId) && (
                                      <Badge variant="outline" className="text-[10px] border-amber-500/40 text-amber-300/90">
                                        ☀️ Алина
                                      </Badge>
                                    )}
                                    {GOLDEN_PATH_QUEST_SPINE.includes(qs.questId)
                                      && !ACT1_SOLNYSH_QUEST_SPINE.includes(qs.questId) && (
                                      <Badge variant="outline" className="text-[10px] border-cyan-600/40 text-cyan-300/80">
                                        сюжет
                                      </Badge>
                                    )}
                                    <DifficultyBadge difficulty={def.difficulty} />
                                    {hasPoemBypass(qs.questId) && (
                                      <Sparkles className="size-3.5 text-purple-400" />
                                    )}
                                    {def.timeLimitHours && (
                                      <span
                                        className="text-[10px] text-amber-400/80 flex items-center gap-0.5"
                                        title="Оставшееся время"
                                      >
                                        <Clock className="size-3.5 text-amber-400" />
                                        {Math.ceil(remainingQuestHours(qs.hoursElapsed ?? 0, def.timeLimitHours))}ч
                                      </span>
                                    )}
                                    <Badge variant="outline" className="text-[10px] border-cyan-700/40 text-cyan-400">
                                      {progress}%
                                    </Badge>
                                  </div>
                                </div>

                                {/* Quest giver / location hint (collapsed) */}
                                {!isExpanded && def.questGiverNpcId && (() => {
                                  const npc = findNpcById(def.questGiverNpcId);
                                  return npc ? (
                                    <div className="flex items-center gap-1 mt-1">
                                      <span className="text-[10px] text-cyan-400/50">
                                        от {npc.name}
                                      </span>
                                    </div>
                                  ) : null;
                                })()}

                                {/* Progress bar */}
                                <div className="mb-1">
                                  <Progress value={progress} className="h-1.5 bg-slate-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
                                </div>

                                {/* Hint section */}
                                {(() => {
                                  const contextual = buildQuestJournalContextualHint(qs.questId, currentSceneId);
                                  const routeCta = buildQuestJournalRouteCta(qs.questId, currentSceneId);
                                  const collapsedHint = contextual ?? def.hint;
                                  if ((!collapsedHint && !routeCta) || isExpanded) return null;
                                  return (
                                  <div className="mt-2 space-y-1">
                                    {collapsedHint && (
                                      <div className="flex items-start gap-1.5">
                                        <Lightbulb className="size-3 text-amber-400/50 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-amber-400/50 italic leading-relaxed">{collapsedHint}</p>
                                      </div>
                                    )}
                                    {routeCta && (
                                      <button
                                        type="button"
                                        className="flex items-center gap-1.5 pl-4 text-left group"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          const marker = getQuestMarker(qs.questId);
                                          if (marker?.sceneId) {
                                            eventBus.emit('ui:open_panel', {
                                              panel: 'worldMap',
                                              sceneId: marker.sceneId,
                                            });
                                          }
                                        }}
                                      >
                                        <MapPin className="size-3 text-cyan-400/60 shrink-0 group-hover:text-cyan-300" />
                                        <p className="text-[10px] text-cyan-300/65 font-mono tracking-wide group-hover:text-cyan-200 underline-offset-2 group-hover:underline">
                                          {routeCta} · на карте
                                        </p>
                                      </button>
                                    )}
                                  </div>
                                  );
                                })()}

                                {/* Reward preview (collapsed) */}
                                {def.rewards && def.rewards.length > 0 && !isExpanded && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {def.rewards.map((r, i) => (
                                      <RewardBadge key={i} reward={r} index={i} />
                                    ))}
                                  </div>
                                )}
                              </div>

                              {isExpanded && (
                                <motion.div
                                  initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                                  transition={{ duration: reducedMotion ? 0 : 0.2 }}
                                  className="px-4 pb-3 border-t border-cyan-900/15 pt-3"
                                >                                  <p className="text-xs text-slate-400 mb-3">
                                    {def.description}
                                    {def.questGiverNpcId && (() => {
                                      const npc = findNpcById(def.questGiverNpcId);
                                      return npc ? (
                                        <span className="text-[10px] text-cyan-400/60 block mt-1">
                                          Задание от: {npc.name}
                                        </span>
                                      ) : null;
                                    })()}
                                  </p>

                                  {/* Contextual next-step + static quest hint */}
                                  {(() => {
                                    const contextual = buildQuestJournalContextualHint(qs.questId, currentSceneId);
                                    const routeCta = buildQuestJournalRouteCta(qs.questId, currentSceneId);
                                    if (!contextual && !def.hint && !routeCta) return null;
                                    return (
                                    <div className="mb-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/25 space-y-2">
                                      {contextual && (
                                        <div>
                                          <div className="text-[10px] text-cyan-400 mb-1 flex items-center gap-1">
                                            <MapPin className="size-3" />
                                            Сейчас
                                          </div>
                                          <p className="text-[11px] text-cyan-200/70 leading-relaxed">{contextual}</p>
                                        </div>
                                      )}
                                      {routeCta && (
                                        <div className="text-[11px] text-cyan-300/80 font-mono flex items-center gap-1.5">
                                          <MapPin className="size-3 text-cyan-400" />
                                          {routeCta}
                                        </div>
                                      )}
                                      <ShowOnMapButton questId={qs.questId} currentSceneId={currentSceneId} />
                                      {def.hint && (
                                        <div>
                                          <div className="text-[10px] text-amber-400 mb-1 flex items-center gap-1">
                                            <Lightbulb className="size-3" />
                                            Подсказка
                                          </div>
                                          <p className="text-[11px] text-amber-300/60 leading-relaxed">{def.hint}</p>
                                        </div>
                                      )}
                                    </div>
                                    );
                                  })()}

                                  {/* Dependencies */}
                                  {!deps.met && (
                                    <div className="mb-3 p-2.5 rounded-lg bg-amber-900/15 border border-amber-800/20">
                                      <div className="text-[10px] text-amber-400 mb-1 flex items-center gap-1">
                                        <AlertTriangle className="size-3" />
                                        Требуются задания:
                                      </div>
                                      {deps.missing.map((title) => (
                                        <div key={title} className="text-[10px] text-amber-300/70 flex items-center gap-1">
                                          <ChevronRight className="size-2.5" />
                                          {title}
                                        </div>
                                      ))}
                                    </div>
                                  )}

                                  {/* Objective group progress bars for collection-type quests */}
                                  {(() => {
                                    const typeGroups: Record<string, { id: string; description: string }[]> = {};
                                    for (const obj of def.objectives) {
                                      if (!typeGroups[obj.type]) typeGroups[obj.type] = [];
                                      typeGroups[obj.type].push({ id: obj.id, description: obj.description });
                                    }
                                    const multiObjTypes = Object.entries(typeGroups).filter(([, objs]) => objs.length >= 3);
                                    if (multiObjTypes.length === 0) return null;
                                    return (
                                      <div className="mb-3 space-y-2">
                                        {multiObjTypes.map(([type, objs]) => (
                                          <ObjectiveGroupProgress
                                            key={type}
                                            objectives={objs}
                                            questState={qs}
                                            label={
                                              type === 'poem_collected' ? 'Стихи'
                                                : type === 'item_collected' ? 'Предметы'
                                                : type === 'flag_set' ? 'Условия'
                                                : type === 'npc_talked' ? 'Собеседники'
                                                : type === 'location_visited' ? 'Локации'
                                                : type === 'minigame_completed' ? 'Мини-игры'
                                                : 'Цели'
                                            }
                                            icon={getObjectiveTypeIcon(type)}
                                          />
                                        ))}
                                      </div>
                                    );
                                  })()}

                                  {/* Progressive reveal total progress summary */}
                                  {def.progressiveRevealCount && (() => {
                                    const totalObjs = def.objectives.length;
                                    const completedObjs = def.objectives.filter((o) => qs.objectives[o.id]).length;
                                    // Choose appropriate Russian word form for "стихотворение"
                                    const poemWord = completedObjs === 1 ? 'стихотворение'
                                      : completedObjs >= 2 && completedObjs <= 4 ? 'стихотворения'
                                      : 'стихотворений';
                                    return (
                                      <div className="flex items-center gap-2 mb-2 px-1 py-1 rounded"
                                        style={{ background: 'rgba(0, 255, 238, 0.06)', border: '1px solid rgba(0, 255, 238, 0.12)' }}>
                                        <BookOpen className="size-3 text-cyan-400/60 shrink-0" />
                                        <span className="text-[10px] font-mono text-cyan-300/80">
                                          Собрано {poemWord}: {completedObjs} из {totalObjs}
                                        </span>
                                      </div>
                                    );
                                  })()}

                                  {/* Objectives */}
                                  <div className="flex flex-col gap-1.5 mb-3">
                                    {def.objectives
                                      .filter((obj, _idx, allObjs) => {
                                        // Progressive reveal: for quests with progressiveRevealCount,
                                        // only show completed objectives + next N uncompleted ones.
                                        const revealCount = def.progressiveRevealCount;
                                        if (!revealCount) return true;
                                        if (qs.objectives[obj.id]) return true; // always show completed
                                        // Count how many uncompleted objectives appear before this one
                                        let uncompletedBefore = 0;
                                        for (const prev of allObjs) {
                                          if (prev.id === obj.id) break;
                                          if (!qs.objectives[prev.id]) uncompletedBefore++;
                                        }
                                        return uncompletedBefore < revealCount;
                                      })
                                      .map((obj) => {
                                      const completed = qs.objectives[obj.id] === true;
                                      return (
                                        <button
                                          type="button"
                                          key={obj.id}
                                          disabled={completed}
                                          className={`flex items-start gap-2 text-xs text-left w-full rounded-md px-1 py-0.5 -mx-1 transition-colors ${
                                            completed
                                              ? 'text-emerald-400/70 cursor-default'
                                              : 'text-slate-300 hover:bg-cyan-950/30 hover:text-cyan-100'
                                          }`}
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            if (completed) return;
                                            const marker = getQuestMarker(qs.questId);
                                            eventBus.emit('quest:pulse_marker', {
                                              questId: qs.questId,
                                              sceneId: marker?.sceneId,
                                            });
                                            if (marker?.sceneId && marker.sceneId !== currentSceneId) {
                                              eventBus.emit('ui:open_panel', {
                                                panel: 'worldMap',
                                                sceneId: marker.sceneId,
                                              });
                                            } else if (marker?.sceneId === currentSceneId) {
                                              onClose();
                                            }
                                          }}
                                        >
                                          {completed ? (
                                            <ObjectiveCheckmark justCompleted={completed} />
                                          ) : obj.type === 'flag_set' ? (
                                            <div className="flex items-center gap-1 mt-0.5 shrink-0">
                                              <Zap className="size-3 text-yellow-500/60" />
                                              <span className="text-[8px] font-mono text-yellow-400/50 tracking-wider whitespace-nowrap">В процессе...</span>
                                            </div>
                                          ) : (
                                            <Circle className="size-3.5 mt-0.5 shrink-0 text-slate-500" />
                                          )}
                                          <div className="flex-1">
                                            <span className={completed ? 'quest-objective-complete' : ''}>{obj.description}</span>
                                            {/* Poem power hint */}
                                            {!completed && obj.poemPowerHint && (
                                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-purple-400/80">
                                                <Sparkles className="size-2.5" />
                                                {obj.poemPowerHint}
                                              </div>
                                            )}
                                          </div>
                                        </button>
                                      );
                                    })}
                                    {/* Progressive reveal indicator */}
                                    {def.progressiveRevealCount && (() => {
                                      const totalIncomplete = def.objectives.filter((o) => !qs.objectives[o.id]).length;
                                      const revealedIncomplete = def.objectives.filter((obj, _idx, allObjs) => {
                                        if (qs.objectives[obj.id]) return false;
                                        let uncompletedBefore = 0;
                                        for (const prev of allObjs) {
                                          if (prev.id === obj.id) break;
                                          if (!qs.objectives[prev.id]) uncompletedBefore++;
                                        }
                                        return uncompletedBefore < def.progressiveRevealCount!;
                                      }).length;
                                      const hidden = totalIncomplete - revealedIncomplete;
                                      if (hidden > 0) {
                                        return (
                                          <div className="text-[10px] text-slate-500 italic mt-1">
                                            …и ещё {hidden} {hidden === 1 ? 'стих' : hidden < 5 ? 'стиха' : 'стихов'} впереди
                                          </div>
                                        );
                                      }
                                      return null;
                                    })()}
                                  </div>

                                  {/* Rewards */}
                                  {def.rewards && def.rewards.length > 0 && (
                                    <div className="pt-2 border-t border-cyan-900/15">
                                      <div className="text-[10px] text-slate-500 mb-1.5 flex items-center gap-1">
                                        <Trophy className="size-2.5" />
                                        Награда за выполнение:
                                      </div>
                                      <div className="flex flex-wrap gap-1">
                                        {def.rewards.map((r, i) => (
                                          <RewardBadge key={i} reward={r} index={i} />
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </motion.div>
                              )}
                            </motion.div>
                          );
                        })}
                      </div>
                    </div>
                  );
                },
              )}

              {/* Failed quests */}
              {showFailed && failedQuests.length > 0 && (
                <div className="mb-5">
                  <div className="neon-divider mb-3" aria-hidden="true" />
                  <h3 className="text-xs font-medium text-red-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" />
                    Провалено
                    <span className="text-red-500/40 ml-1">({failedQuests.length})</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {failedQuests.map((qs) => {
                      const def = QUEST_DEF_MAP.get(qs.questId);
                      if (!def) return null;
                      const canRetry = questCanRetry(def);
                      const playerFlags = useGameStore.getState().playerState.flags;
                      const canBypass = canBypassRetryLock(def, playerFlags);
                      const isCritical = isCriticalPathQuest(def);
                      const showRetryButton = canRetry || canBypass;
                      return (
                        <div
                          key={qs.questId}
                          className="px-3 py-2.5 rounded-xl bg-red-950/15 border border-red-900/25"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="size-4 text-red-500/60" />
                              <span className="text-sm text-red-300/70 line-through">{def.title}</span>
                            </div>
                            {showRetryButton && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] text-red-400 hover:text-red-300 h-6 px-2"
                                onClick={() => {
                                  dispatchGameAction({ type: 'quest/retry', questId: qs.questId });
                                }}
                              >
                                <RotateCcw className="size-3 mr-1" />
                                {canRetry ? 'Повторить' : 'Второй шанс'}
                              </Button>
                            )}
                          </div>
                          {canRetry && (
                            <p className="text-[10px] text-red-400/60 mt-1">Можно повторить задание</p>
                          )}
                          {!canRetry && canBypass && isCritical && (
                            <p className="text-[10px] text-amber-400/70 mt-1">
                              Второй шанс: карма {QUEST_RETRY_PENALTY.karma}, стресс +{QUEST_RETRY_PENALTY.stress}
                            </p>
                          )}
                          <p className="text-[10px] text-red-400/50 mt-1">{def.description}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Completed quests */}
              {showCompleted && completedQuests.length > 0 && (
                <div className="mb-5">
                  <div className="neon-divider mb-3" aria-hidden="true" />
                  <h3 className="text-xs font-medium text-emerald-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Завершено
                    <span className="text-emerald-500/40 ml-1">({completedQuests.length})</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {completedQuests.map((qs) => {
                      const def = QUEST_DEF_MAP.get(qs.questId);
                      if (!def) return null;
                      return (
                        <div
                          key={qs.questId}
                          className="px-3 py-2 rounded-xl bg-slate-900/20 border border-cyan-900/10 text-sm text-slate-500 flex items-center gap-2"
                        >
                          <CheckCircle2 className="size-4 text-emerald-600/50" />
                          <span className="line-through">{def.title}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeQuests.length === 0 && (
                <div className="text-center py-16 px-4">
                  <div className="relative inline-block mb-4">
                    <BookOpen className="size-10 text-cyan-500/25 mx-auto" />
                    <Sparkles className="size-3 text-amber-400/40 absolute -top-1 -right-1" />
                  </div>
                  <p className="text-slate-400 text-sm font-medium">Нет активных квестов</p>
                  <p className="text-slate-600 text-[10px] mt-1.5 leading-relaxed max-w-[220px] mx-auto">
                    Исследуйте мир, говорите с людьми и осматривайте предметы — задания найдут вас сами.
                  </p>
                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[9px] text-cyan-500/40 font-mono uppercase tracking-wider">
                    <MapPin className="size-2.5" />
                    <span>Поиск доступен</span>
                  </div>
                </div>
              )}

              {activeQuests.length === 0 && completedQuests.length === 0 && failedQuests.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-8">
                  Нет активных заданий
                </div>
              )}
            </ScrollArea>
      </div>
    </PanelWrapper>
  );
}
