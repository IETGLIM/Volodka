
/* ─── Volodka RPG – Quest journal panel (AAA+ Overhaul v2) ───
   Grouped by status, difficulty indicators, progress bars, hints, rewards.
   Dark glass morphism with cyberpunk accents.
*/

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Circle, Trophy, BookOpen, EyeOff,
  Clock, AlertTriangle, RotateCcw, ChevronRight, Sparkles,
  Lightbulb, Shield, Swords, Zap, Star,
} from 'lucide-react';
import { QUEST_DEFINITIONS } from '@/data/quests';
import {
  useActiveQuests,
  useFailedQuests,
  getQuestProgress,
  areDependenciesMet,
} from '@/store/selectors/questSelectors';
import { GOLDEN_PATH_QUEST_SPINE, ACT1_SOLNYSH_QUEST_SPINE } from '@/data/goldenPath';
import { getGameStore } from '@/store/gameStore';
import { useQuests } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { PanelWrapper } from '@/components/game/PanelWrapper';
import type { QuestType, QuestState, QuestDifficulty } from '@/shared/types/game';

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

function RewardBadge({ reward, index }: { reward: { type: string; skill?: string; value?: number; itemId?: string; flag?: string; flagValue?: boolean }; index: number }) {
  const getLabel = () => {
    if (reward.type === 'addSkill' && reward.skill) return `${reward.skill} +${reward.value ?? 0}`;
    if (reward.type === 'addKarma') return `карма +${reward.value ?? 0}`;
    if (reward.type === 'addCredits') return `кредиты +${reward.value ?? 0}`;
    if (reward.type === 'addXp') return `опыт +${reward.value ?? 0}`;
    if (reward.type === 'addItem' && reward.itemId) return reward.itemId;
    if (reward.type === 'setFlag') return reward.flag ?? 'флаг';
    return reward.type;
  };

  const getIcon = () => {
    if (reward.type === 'addSkill') return <Star className="size-2.5 text-amber-400/60" />;
    if (reward.type === 'addKarma') return <Zap className="size-2.5 text-cyan-400/60" />;
    if (reward.type === 'addCredits') return <Sparkles className="size-2.5 text-yellow-400/60" />;
    if (reward.type === 'addItem') return <Trophy className="size-2.5 text-emerald-400/60" />;
    return <Sparkles className="size-2.5 text-purple-400/60" />;
  };

  return (
    <span key={index} className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] rounded-md border border-slate-700/30 bg-slate-800/40 text-slate-400">
      {getIcon()}
      {getLabel()}
    </span>
  );
}

export function QuestsPanel({ open, onClose }: QuestsPanelProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const quests = useQuests();
  const [showCompleted, setShowCompleted] = useState(false);
  const [showFailed, setShowFailed] = useState(true);
  const [expandedQuests, setExpandedQuests] = useState<Set<string>>(new Set());
  const prevOpenRef = useRef(false);

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
        const def = QUEST_DEFINITIONS.find((d) => d.id === q.questId);
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
      const def = QUEST_DEFINITIONS.find((d) => d.id === qs.questId);
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
    const def = QUEST_DEFINITIONS.find((d) => d.id === questId);
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
            onClick={() => setShowFailed(!showFailed)}
            className={`text-xs ${showFailed ? 'text-red-400' : 'text-slate-500'}`}
          >
            <AlertTriangle className="size-3.5 mr-1" />
            Провал{failedQuests.length > 0 ? ` (${failedQuests.length})` : ''}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowCompleted(!showCompleted)}
            className={`text-xs ${showCompleted ? 'text-emerald-400' : 'text-slate-500'}`}
          >
            <CheckCircle2 className="size-3.5 mr-1" />
            Готово{completedQuests.length > 0 ? ` (${completedQuests.length})` : ''}
          </Button>
        </div>
      )}
    >
      <div className="scanline-overlay" style={{ background: 'rgba(0,0,0,0.2)' }} data-testid="quests-panel">

            <ScrollArea className="flex-1 px-4 py-3">
              {/* Active quests by type */}
              {(Object.entries(QUEST_TYPE_LABELS) as [QuestType, typeof QUEST_TYPE_LABELS.main][]).map(
                ([type, config]) => {
                  const typeQuests = activeByType[type];
                  if (typeQuests.length === 0) return null;

                  const TypeIcon = config.icon;
                  return (
                    <div key={type} className="mb-5">
                      <h3 className={`text-xs font-medium uppercase tracking-wider mb-2 flex items-center gap-1.5 ${config.color}`}>
                        <TypeIcon className="size-3.5" />
                        {config.label}
                        <span className="text-slate-500 ml-1">({typeQuests.length})</span>
                      </h3>
                      <div className="flex flex-col gap-3">
                        {typeQuests.map((qs) => {
                          const def = QUEST_DEFINITIONS.find((d) => d.id === qs.questId);
                          if (!def) return null;

                          const progress = getQuestProgress(qs.questId);
                          const isExpanded = expandedQuests.has(qs.questId);
                          const deps = areDependenciesMet(qs.questId);

                          const isGoldenPathFocus = qs.questId === goldenPathFocusId;

                          return (
                            <div
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
                                      <Clock className="size-3.5 text-amber-400" />
                                    )}
                                    <Badge variant="outline" className="text-[10px] border-cyan-700/40 text-cyan-400">
                                      {progress}%
                                    </Badge>
                                  </div>
                                </div>

                                {/* Progress bar */}
                                <div className="mb-1">
                                  <Progress value={progress} className="h-1.5 bg-slate-800/80 shadow-[inset_0_1px_2px_rgba(0,0,0,0.3)]" />
                                </div>

                                {/* Hint section */}
                                {def.hint && !isExpanded && (
                                  <div className="flex items-start gap-1.5 mt-2">
                                    <Lightbulb className="size-3 text-amber-400/50 shrink-0 mt-0.5" />
                                    <p className="text-[10px] text-amber-400/50 italic leading-relaxed">{def.hint}</p>
                                  </div>
                                )}

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
                                >                                  <p className="text-xs text-slate-400 mb-3">{def.description}</p>

                                  {/* Hint section (expanded) */}
                                  {def.hint && (
                                    <div className="mb-3 p-2.5 rounded-lg bg-amber-950/20 border border-amber-800/25">
                                      <div className="text-[10px] text-amber-400 mb-1 flex items-center gap-1">
                                        <Lightbulb className="size-3" />
                                        Подсказка
                                      </div>
                                      <p className="text-[11px] text-amber-300/60 leading-relaxed">{def.hint}</p>
                                    </div>
                                  )}

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

                                  {/* Objectives */}
                                  <div className="flex flex-col gap-1.5 mb-3">
                                    {def.objectives.map((obj) => {
                                      const completed = qs.objectives[obj.id] === true;
                                      return (
                                        <div
                                          key={obj.id}
                                          className={`flex items-start gap-2 text-xs ${
                                            completed ? 'text-emerald-400/70' : 'text-slate-300'
                                          }`}
                                        >
                                          {completed ? (
                                            <CheckCircle2 className="size-3.5 mt-0.5 shrink-0 text-emerald-500" />
                                          ) : (
                                            <Circle className="size-3.5 mt-0.5 shrink-0 text-slate-500" />
                                          )}
                                          <div className="flex-1">
                                            <span className={completed ? 'line-through' : ''}>{obj.description}</span>
                                            {/* Poem power hint */}
                                            {!completed && obj.poemPowerHint && (
                                              <div className="mt-0.5 flex items-center gap-1 text-[10px] text-purple-400/80">
                                                <Sparkles className="size-2.5" />
                                                {obj.poemPowerHint}
                                              </div>
                                            )}
                                          </div>
                                        </div>
                                      );
                                    })}
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
                            </div>
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
                  <h3 className="text-xs font-medium text-red-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <AlertTriangle className="size-3.5" />
                    Провалено
                    <span className="text-red-500/40 ml-1">({failedQuests.length})</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {failedQuests.map((qs) => {
                      const def = QUEST_DEFINITIONS.find((d) => d.id === qs.questId);
                      if (!def) return null;
                      const canRetry = def.canRetry ?? false;
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
                            {canRetry && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-[10px] text-red-400 hover:text-red-300 h-6 px-2"
                                onClick={() => {
                                  getGameStore().activateQuest(qs.questId);
                                }}
                              >
                                <RotateCcw className="size-3 mr-1" />
                                Повторить
                              </Button>
                            )}
                          </div>
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
                  <h3 className="text-xs font-medium text-emerald-500/70 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="size-3.5" />
                    Завершено
                    <span className="text-emerald-500/40 ml-1">({completedQuests.length})</span>
                  </h3>
                  <div className="flex flex-col gap-2">
                    {completedQuests.map((qs) => {
                      const def = QUEST_DEFINITIONS.find((d) => d.id === qs.questId);
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
