'use client';

/* ─── Volodka RPG – Quest Tracker HUD ───
 * Compact top-left panel showing the current active quest with up to 5
 * objectives, progress bar, and completion flash animation.
 *
 * Priority for "current" quest:
 *  1. Active quest on the GOLDEN_PATH_QUEST_SPINE (main story)
 *  2. First active quest with questType === 'main'
 *  3. First active quest overall
 */

import { useMemo, useRef, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { useGameSelector } from '@/store/selectors/hooks';
import { getQuestDefinitions } from '@/data/gameDataLoader';
import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';
import { explorationLootTopPx } from '@/shared/constants/hudLayout';
import type { QuestState } from '@/shared/types/game';
import type { QuestObjective } from '@/shared/types/definitions/quest';

const MAX_OBJECTIVES_SHOWN = 5;
const COMPLETION_FLASH_MS = 1200;

/* ── Derived quest view for rendering ── */
interface TrackedQuestView {
  questId: string;
  title: string;
  objectives: Array<{
    id: string;
    description: string;
    completed: boolean;
  }>;
  completedCount: number;
  totalCount: number;
  allDone: boolean;
}

/** Pick the single most relevant active quest. */
function resolveTrackedQuest(quests: QuestState[]): TrackedQuestView | null {
  const activeQuests = quests.filter((q) => q.status === 'active');
  if (activeQuests.length === 0) return null;

  const defs = getQuestDefinitions();

  // Priority 1: golden-path quest that is active
  let chosen: QuestState | null = null;
  for (const qs of activeQuests) {
    if (GOLDEN_PATH_QUEST_SPINE.includes(qs.questId)) {
      chosen = qs;
      break;
    }
  }

  // Priority 2: questType === 'main'
  if (!chosen) {
    for (const qs of activeQuests) {
      const def = defs.find((d) => d.id === qs.questId);
      if (def?.questType === 'main') {
        chosen = qs;
        break;
      }
    }
  }

  // Priority 3: first active quest
  if (!chosen) {
    chosen = activeQuests[0];
  }

  const def = defs.find((d) => d.id === chosen.questId);
  if (!def) return null;

  const objectives: TrackedQuestView['objectives'] = def.objectives
    .slice(0, MAX_OBJECTIVES_SHOWN)
    .map((o: QuestObjective) => ({
      id: o.id,
      description: o.description,
      completed: chosen.objectives[o.id] === true,
    }));

  const completedCount = objectives.filter((o) => o.completed).length;
  const totalCount = objectives.length;

  return {
    questId: chosen.questId,
    title: def.title,
    objectives,
    completedCount,
    totalCount,
    allDone: completedCount === totalCount && totalCount > 0,
  };
}

/* ── Progress bar ── */
function QuestProgressBar({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? (completed / total) * 100 : 0;
  return (
    <div className="w-full h-[3px] rounded-full overflow-hidden bg-white/10">
      <motion.div
        className="h-full rounded-full"
        style={{ background: 'linear-gradient(90deg, #22d3ee, #06b6d4)' }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
    </div>
  );
}

/* ── Main component ── */
export function QuestTrackerHUD() {
  const quests = useGameSelector((s) => s.quests);
  const reducedMotion = useEffectiveReducedMotion();
  const quietStyle = useHudQuietStyle();

  const tracked = useMemo(() => resolveTrackedQuest(quests), [quests]);

  // Track quest ID changes for slide-in animation
  const prevQuestIdRef = useRef<string | null>(null);
  const [slideKey, setSlideKey] = useState(0);

  useEffect(() => {
    if (tracked?.questId && tracked.questId !== prevQuestIdRef.current) {
      prevQuestIdRef.current = tracked.questId;
      setSlideKey((k) => k + 1);
    }
  }, [tracked?.questId]);

  // Completion flash state
  const [flashActive, setFlashActive] = useState(false);
  const flashTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevAllDoneRef = useRef(false);

  useEffect(() => {
    if (tracked?.allDone && !prevAllDoneRef.current) {
      setFlashActive(true);
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
      flashTimeoutRef.current = setTimeout(() => setFlashActive(false), COMPLETION_FLASH_MS);
    }
    prevAllDoneRef.current = tracked?.allDone ?? false;
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, [tracked?.allDone]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (flashTimeoutRef.current) clearTimeout(flashTimeoutRef.current);
    };
  }, []);

  if (!tracked) return null;

  const slideAnim = reducedMotion
    ? { initial: false, animate: { opacity: 1 }, exit: { opacity: 0 } }
    : {
        initial: { opacity: 0, x: -24 },
        animate: { opacity: 1, x: 0 },
        exit: { opacity: 0, x: -24 },
      };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={slideKey}
        {...slideAnim}
        transition={{ duration: reducedMotion ? 0 : 0.35, ease: 'easeOut' }}
        className="fixed pointer-events-none select-none"
        data-testid="quest-tracker-hud"
        data-exploration-ui
        style={{
          top: explorationLootTopPx() + 8,
          left: 12,
          zIndex: UI_LAYERS.HUD,
          maxWidth: 320,
          ...quietStyle,
        }}
      >
        {/* Glass-morphism container */}
        <div
          className="relative overflow-hidden"
          style={{
            background: 'rgba(0, 8, 16, 0.65)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            border: '1px solid rgb(var(--cyber-cyan-rgb, 34 211 238) / 0.15)',
            borderRadius: '4px',
            boxShadow:
              '0 0 12px rgb(var(--cyber-cyan-rgb, 34 211 238) / 0.06), inset 0 0 12px rgba(0, 0, 0, 0.3)',
            maxHeight: 200,
          }}
        >
          {/* Completion flash overlay */}
          <AnimatePresence>
            {flashActive && (
              <motion.div
                className="absolute inset-0 pointer-events-none"
                style={{ zIndex: 10, borderRadius: '4px' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: [0, 0.45, 0] }}
                transition={{ duration: COMPLETION_FLASH_MS / 1000, ease: 'easeOut' }}
                exit={{ opacity: 0 }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      'radial-gradient(ellipse at center, rgba(34,211,238,0.35) 0%, transparent 70%)',
                    borderRadius: '4px',
                  }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Content area with custom scrollbar */}
          <div
            className="overflow-y-auto"
            style={{
              maxHeight: 180,
              scrollbarWidth: 'thin',
              scrollbarColor: 'rgba(34,211,238,0.25) transparent',
            }}
          >
            {/* Quest title */}
            <div
              className="px-3 pt-2.5 pb-1 font-mono text-[11px] tracking-wide uppercase"
              style={{
                color: 'rgb(var(--cyber-cyan-rgb, 34 211 238))',
                textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb, 34 211 238) / 0.4)',
                lineHeight: 1.3,
              }}
            >
              {tracked.title}
            </div>

            {/* Objectives list */}
            <div className="px-3 pb-2 flex flex-col gap-[3px]">
              {tracked.objectives.map((obj) => (
                <div
                  key={obj.id}
                  className="flex items-start gap-1.5"
                  style={{ fontSize: '10px', lineHeight: 1.4 }}
                >
                  <span
                    className="shrink-0 mt-[1px] font-mono"
                    style={{
                      color: obj.completed
                        ? 'rgb(var(--cyber-cyan-rgb, 34 211 238) / 0.5)'
                        : 'rgb(var(--cyber-cyan-rgb, 34 211 238))',
                      textShadow: obj.completed
                        ? 'none'
                        : '0 0 4px rgb(var(--cyber-cyan-rgb, 34 211 238) / 0.3)',
                    }}
                  >
                    {obj.completed ? '✓' : '○'}
                  </span>
                  <span
                    className="font-sans"
                    style={{
                      color: obj.completed
                        ? 'rgba(148, 163, 184, 0.55)'
                        : 'rgba(226, 232, 240, 0.85)',
                      textDecoration: obj.completed
                        ? 'line-through'
                        : 'none',
                    }}
                  >
                    {obj.description}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Progress bar + fraction label */}
          <div className="px-3 pb-2">
            <QuestProgressBar
              completed={tracked.completedCount}
              total={tracked.totalCount}
            />
            <div
              className="flex justify-end mt-0.5 font-mono"
              style={{ fontSize: '9px', color: 'rgba(148, 163, 184, 0.5)' }}
            >
              {tracked.completedCount}/{tracked.totalCount}
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
