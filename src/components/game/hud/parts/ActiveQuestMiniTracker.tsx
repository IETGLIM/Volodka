/* ─── Volodka RPG – Active Quest Mini-Tracker (HUD persistent strip) ───
   Small, unobtrusive tracker on the HUD that shows the next objective
   of the currently focused active quest. Auto-cycles every 10 seconds
   through active quests. Player can pin a specific quest.
*/

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronUp, Pin, PinOff, BookOpen } from 'lucide-react';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getNextTrackedObjective } from '@/store/questStore';
import { getQuestProgress } from '@/store/selectors/questSelectors';
import { useQuests } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { QuestType } from '@/shared/types/game';

const CYCLE_INTERVAL_MS = 10_000;

const QUEST_TYPE_ICON: Record<QuestType, string> = {
  main: '⚔',
  side: '◈',
  hidden: '◆',
  daily: '◎',
};

const QUEST_TYPE_COLOR: Record<QuestType, string> = {
  main: '#ff6644',
  side: '#00d4e0',
  hidden: '#cc66ff',
  daily: '#aaaaaa',
};

function getObjectiveTypeIcon(type: string): string {
  switch (type) {
    case 'npc_talked': return '💬';
    case 'location_visited': return '📍';
    case 'item_collected': return '📦';
    case 'poem_collected': return '📜';
    case 'flag_set': return '⚡';
    case 'minigame_completed': return '🎮';
    case 'custom': return '○';
    default: return '●';
  }
}

export function ActiveQuestMiniTracker() {
  const reducedMotion = useEffectiveReducedMotion();
  const quests = useQuests();
  const [expanded, setExpanded] = useState(false);
  const [pinnedQuestId, setPinnedQuestId] = useState<string | null>(null);
  const [cycleIndex, setCycleIndex] = useState(0);
  const cycleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevObjectiveKeyRef = useRef<string | null>(null);
  const [objectiveFlash, setObjectiveFlash] = useState(false);
  const flashTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeQuests = useMemo(
    () => quests.filter((q) => q.status === 'active'),
    [quests],
  );

  /* ── Determine which quest to display ── */
  const displayQuest = useMemo(() => {
    if (pinnedQuestId) {
      const pinned = activeQuests.find((q) => q.questId === pinnedQuestId);
      if (pinned) return pinned;
      // Pinned quest no longer active, unpin
      setPinnedQuestId(null);
    }
    if (activeQuests.length === 0) return null;
    const idx = cycleIndex % activeQuests.length;
    return activeQuests[idx];
  }, [pinnedQuestId, activeQuests, cycleIndex]);

  /* ── Auto-cycle through active quests ── */
  useEffect(() => {
    if (pinnedQuestId || activeQuests.length <= 1) {
      // No cycling when pinned or only 1 quest
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
      return;
    }

    cycleTimerRef.current = setInterval(() => {
      setCycleIndex((prev) => prev + 1);
    }, CYCLE_INTERVAL_MS);

    return () => {
      if (cycleTimerRef.current) {
        clearInterval(cycleTimerRef.current);
        cycleTimerRef.current = null;
      }
    };
  }, [pinnedQuestId, activeQuests.length]);

  /* ── Keep cycle index in bounds ── */
  useEffect(() => {
    if (activeQuests.length > 0 && cycleIndex >= activeQuests.length) {
      setCycleIndex(0);
    }
  }, [activeQuests.length, cycleIndex]);

  /* ── Reset when quests change significantly ── */
  const activeQuestIdKey = activeQuests.map((q) => q.questId).join(',');
  useEffect(() => {
    setCycleIndex(0);
  }, [activeQuestIdKey]);

  /* ── Listen for quest selection events from other UI ── */
  useEffect(() => {
    const unsub = eventBus.on('quests:select_quest', ({ questId }) => {
      const exists = activeQuests.some((q) => q.questId === questId);
      if (exists) {
        setPinnedQuestId(questId);
      }
    });
    return unsub;
  }, [activeQuests]);

  /* ── Get display data ── */
  const questDef = useMemo(
    () => (displayQuest ? QUEST_DEFINITIONS.find((d) => d.id === displayQuest.questId) ?? null : null),
    [displayQuest],
  );

  const nextObjective = useMemo(
    () => (displayQuest ? getNextTrackedObjective(displayQuest.questId) : null),
    [displayQuest],
  );

  const progress = useMemo(
    () => (displayQuest ? getQuestProgress(displayQuest.questId) : 0),
    [displayQuest],
  );

  /* ── Detect objective progress change → trigger flash ── */
  useEffect(() => {
    const currentKey = displayQuest
      ? `${displayQuest.questId}:${nextObjective?.objectiveId ?? 'done'}:${progress}`
      : null;

    if (currentKey && prevObjectiveKeyRef.current !== null && currentKey !== prevObjectiveKeyRef.current) {
      // Objective or progress changed
      if (flashTimerRef.current) clearTimeout(flashTimerRef.current);
      setObjectiveFlash(true);
      flashTimerRef.current = setTimeout(() => {
        setObjectiveFlash(false);
        flashTimerRef.current = null;
      }, 300);
    }

    prevObjectiveKeyRef.current = currentKey;

    return () => {
      if (flashTimerRef.current) {
        clearTimeout(flashTimerRef.current);
        flashTimerRef.current = null;
      }
    };
  }, [displayQuest, nextObjective, progress]);

  const togglePin = useCallback(() => {
    if (pinnedQuestId) {
      setPinnedQuestId(null);
    } else if (displayQuest) {
      setPinnedQuestId(displayQuest.questId);
    }
  }, [pinnedQuestId, displayQuest]);

  const toggleExpand = useCallback(() => {
    setExpanded((prev) => !prev);
  }, []);

  const openQuestJournal = useCallback(() => {
    eventBus.emit('ui:open_panel', {
      panel: 'quests',
      ...(displayQuest ? { questId: displayQuest.questId } : {}),
    });
  }, [displayQuest]);

  /* ── Don't render if no active quests ── */
  if (!displayQuest || !questDef) return null;

  const questType = questDef.questType;
  const typeColor = QUEST_TYPE_COLOR[questType];
  const typeIcon = QUEST_TYPE_ICON[questType];
  const objIcon = nextObjective
    ? getObjectiveTypeIcon(
        questDef.objectives.find((o) => o.id === nextObjective.objectiveId)?.type ?? 'custom',
      )
    : '✓';
  const motionDuration = reducedMotion ? 0 : 0.25;

  return (
    <div
      className="pointer-events-auto"
      style={{ zIndex: UI_LAYERS.HUD + 1 }}
    >
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionDuration }}
        className="relative"
        style={{ maxWidth: 320, width: 'min(80vw, 320px)' }}
      >
        {/* Collapsed: single line */}
        <div
          role="button"
          tabIndex={0}
          onClick={toggleExpand}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpand();
            }
          }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-md cursor-pointer quest-tracker-glow quest-tracker-flow-border"
          style={{
            background: 'linear-gradient(135deg, rgba(0, 8, 16, 0.82) 0%, rgba(4, 12, 24, 0.78) 100%)',
            border: `1px solid ${typeColor}33`,
            '--quest-glow-color': `${typeColor}15`,
            boxShadow: `0 0 8px ${typeColor}10, 0 2px 8px rgba(0,0,0,0.4)`,
            backdropFilter: 'blur(8px)',
          } as React.CSSProperties}
          aria-label={
            nextObjective
              ? `${questDef.title}: ${nextObjective.description}`
              : `${questDef.title}: все цели выполнены`
          }
        >
          {/* Quest type icon */}
          <span
            className="text-xs flex-shrink-0"
            style={{ color: typeColor, textShadow: `0 0 4px ${typeColor}44` }}
            aria-hidden="true"
          >
            {typeIcon}
          </span>

          {/* Objective icon */}
          <span className="text-xs flex-shrink-0" aria-hidden="true">
            {objIcon}
          </span>

          {/* Objective text */}
          <p
            className={`text-[10px] font-mono leading-snug truncate flex-1 rounded px-1 -mx-1 ${objectiveFlash ? 'objective-flash' : ''}`}
            style={{ color: '#c8e8e8', textShadow: objectiveFlash ? `0 0 8px ${typeColor}44` : 'none', transition: 'text-shadow 0.3s ease' }}
          >
            {nextObjective ? nextObjective.description : 'Все цели выполнены'}
          </p>

          {/* Pin indicator */}
          {pinnedQuestId === displayQuest.questId && (
            <Pin className="size-3 text-amber-400/70 flex-shrink-0" aria-label="Закреплено" />
          )}

          {/* Expand chevron */}
          <ChevronUp
            className={`size-3 text-slate-500 flex-shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
            aria-hidden="true"
          />
        </div>

        {/* Expanded: full details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={reducedMotion ? false : { height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
              transition={{ duration: motionDuration }}
              className="overflow-hidden rounded-b-md"
              style={{
                background: 'rgba(0, 8, 16, 0.88)',
                border: '1px solid rgba(0,255,238,0.15)',
                borderTop: 'none',
                backdropFilter: 'blur(10px)',
              }}
            >
              <div className="px-3 py-2.5 space-y-2">
                {/* Quest title */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono font-bold tracking-wider"
                    style={{ color: typeColor, textShadow: `0 0 6px ${typeColor}44` }}
                  >
                    {questDef.title}
                  </span>
                  <span
                    className="text-[8px] font-mono px-1 py-px rounded ml-auto"
                    style={{
                      color: typeColor,
                      border: `1px solid ${typeColor}33`,
                      background: `${typeColor}11`,
                    }}
                  >
                    {questType === 'main' ? 'ОСН' : questType === 'side' ? 'ПОБ' : questType === 'hidden' ? 'СКР' : 'ЕЖД'}
                  </span>
                </div>

                {/* Progress bar */}
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-1 bg-white/8 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full rounded-full quest-progress-shimmer"
                      style={{ background: `linear-gradient(90deg, ${typeColor}66, ${typeColor}cc, ${typeColor})`, boxShadow: `0 0 6px ${typeColor}40` }}
                      initial={false}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.4 }}
                    />
                  </div>
                  <span className="text-[8px] font-mono tabular-nums" style={{ color: `${typeColor}aa` }}>
                    {progress}%
                  </span>
                </div>

                {/* Progressive reveal total progress summary */}
                {questDef.progressiveRevealCount && (() => {
                  const totalObjs = questDef.objectives.length;
                  const completedObjs = questDef.objectives.filter((o) => displayQuest.objectives[o.id]).length;
                  const poemWord = completedObjs === 1 ? 'стихотворение'
                    : completedObjs >= 2 && completedObjs <= 4 ? 'стихотворения'
                    : 'стихотворений';
                  return (
                    <div className="flex items-center gap-1.5 px-1 py-0.5 rounded" style={{ background: 'rgba(0,255,238,0.06)', border: '1px solid rgba(0,255,238,0.1)' }}>
                      <BookOpen className="size-2.5 text-cyan-400/60 shrink-0" />
                      <span className="text-[9px] font-mono text-cyan-300/70">
                        Собрано {poemWord}: {completedObjs} из {totalObjs}
                      </span>
                    </div>
                  );
                })()}

                {/* All objectives */}
                <div className="space-y-1 max-h-32 overflow-y-auto" style={{ scrollbarWidth: 'thin', scrollbarColor: '#00ffee22 transparent' }}>
                  {questDef.objectives.map((obj) => {
                    const isCompleted = displayQuest.objectives[obj.id] === true;
                    return (
                      <div
                        key={obj.id}
                        className={`flex items-start gap-1.5 text-[10px] font-mono ${
                          isCompleted ? 'text-emerald-400/60' : 'text-slate-300'
                        }`}
                      >
                        <span className="flex-shrink-0 mt-px" aria-hidden="true">
                          {isCompleted ? '✓' : obj.type === 'flag_set' ? '⚡' : '○'}
                        </span>
                        <span className={isCompleted ? 'line-through' : ''}>
                          {obj.description}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Actions row */}
                <div className="flex items-center gap-2 pt-1 border-t" style={{ borderColor: 'rgba(0,255,238,0.1)' }}>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); togglePin(); }}
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                    style={{ color: pinnedQuestId ? '#ffaa00' : '#667777' }}
                    aria-label={pinnedQuestId ? 'Открепить' : 'Закрепить'}
                  >
                    {pinnedQuestId ? <PinOff className="size-3" /> : <Pin className="size-3" />}
                    {pinnedQuestId ? 'Открепить' : 'Закрепить'}
                  </button>
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openQuestJournal(); }}
                    className="flex items-center gap-1 text-[9px] font-mono px-1.5 py-0.5 rounded hover:bg-white/10 transition-colors"
                    style={{ color: '#667777' }}
                    aria-label="Открыть журнал"
                  >
                    <BookOpen className="size-3" />
                    Журнал
                  </button>
                  {activeQuests.length > 1 && (
                    <span className="text-[8px] font-mono ml-auto" style={{ color: '#556666' }}>
                      {activeQuests.indexOf(displayQuest) + 1}/{activeQuests.length}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
