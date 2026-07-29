
/* ─── Volodka RPG – StoryGuidanceHUD ─── */
/* Single compact objective strip below the compass — no duplicate quest HUD. */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Compass } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { getCurrentGuidance, type GuidanceInfo } from '@/engine/GuidedStoryManager';
import {
  buildGuidanceDirectionHint,
  resolveAvailableQuestTargetScene,
} from '@/engine/guidedStory/guidanceLocation';
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import { getNextTrackedObjective, areDependenciesMet, getQuestMarker } from '@/store/questStore';
import {
  useQuests,
  useCurrentSceneId,
  useOrchestratorNarrativeOverlay,
  useTimeOfDay,
  useScheduleContext,
} from '@/store/selectors';
// useTutorialActive removed — guidance is now shown during tutorial too
import { QUEST_DEFINITIONS } from '@/data/quests';
import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  EXPLORATION_HUD_LAYOUT,
  explorationObjectiveTopPx,
} from '@/shared/constants/hudLayout';
import { EXPLORATION_HUD_HANDOFF } from '@/shared/constants/transitionTimings';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import {
  isExplorationHudProfile,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';
import {
  computeObjectiveProgressPercent,
  formatQuestObjectiveProgress,
  getQuestTypeStripLabel,
  getQuestUrgencyColor,
  resolveQuestUrgency,
  type QuestObjectiveKind,
} from '@/hooks/questHudPresentation';
import type { QuestType } from '@/shared/types/game';
const GUIDANCE_DISMISS_KEY = 'volodka_guidance_dismissed_sig';

export function StoryGuidanceHUD() {
  const reducedMotion = useEffectiveReducedMotion();
  const motionDuration = reducedMotion ? 0 : 0.3;

  const [guidance, setGuidance] = useState<GuidanceInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [firstReadingHint, setFirstReadingHint] = useState<string | null>(getFirstReadingHint);
  const [dismissedSig, setDismissedSig] = useState<string | null>(() => {
    try {
      return sessionStorage.getItem(GUIDANCE_DISMISS_KEY);
    } catch {
      return null;
    }
  });

  const quests = useQuests();
  const profile = useGameplayPresentationProfile();
  const { showStoryOverlay, narrativeKind, diegeticNarrative } = useOrchestratorNarrativeOverlay();
  const currentSceneId = useCurrentSceneId();
  const timeOfDay = useTimeOfDay();
  const scheduleCtx = useScheduleContext();
  const [interactionLocked, setInteractionLocked] = useState(() => isInteractionLocked());
  const [revealReady, setRevealReady] = useState(false);
  const revealTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isResolvingNarrativeKind = showStoryOverlay && narrativeKind == null;
  const suppressForHandoff = profile === 'transition' || isResolvingNarrativeKind;

  useEffect(() => {
    const sync = () => setInteractionLocked(isInteractionLocked());
    sync();
    const unsub = eventBus.on('interaction:state_change', sync);
    return unsub;
  }, []);

  const currentObjective = useMemo(() => {
    const activeQuests = quests.filter((q) => q.status === 'active');
    // Priority 1: active golden-path quests (main story progression).
    // Without this priority, optional side quests like morning_sync (activated
    // automatically by CinematicTimelineRunner) would steal the HUD objective
    // from the actual golden-path quest the player should be pursuing.
    const goldenPathActive = activeQuests.find((aq) =>
      GOLDEN_PATH_QUEST_SPINE.includes(aq.questId),
    );
    const questIter = goldenPathActive
      ? [goldenPathActive]
      : activeQuests;
    for (const aq of questIter) {
      const obj = getNextTrackedObjective(aq.questId);
      if (obj) {
        const questDef = QUEST_DEFINITIONS.find((d) => d.id === aq.questId);
        const marker = getQuestMarker(aq.questId);
        const targetSceneId = marker?.sceneId ?? null;
        const directionHint = buildGuidanceDirectionHint(
          targetSceneId ?? undefined,
          currentSceneId,
        );
        const totalObjectives = questDef?.objectives.length ?? 0;
        const completedObjectives = questDef
          ? questDef.objectives.filter((o) => aq.objectives[o.id] === true).length
          : 0;
        return {
          text: obj.description,
          questTitle: questDef?.title ?? '',
          questType: (questDef?.questType ?? 'main') as QuestType,
          questId: aq.questId,
          objectiveType: 'active_quest' as const,
          directionHint,
          targetSceneId,
          completedObjectives,
          totalObjectives,
        };
      }
    }

    for (const questId of GOLDEN_PATH_QUEST_SPINE) {
      const questState = quests.find((q) => q.questId === questId);
      if (questState?.status === 'completed') continue;
      if (questState?.status === 'active') continue;

      const questDef = QUEST_DEFINITIONS.find((d) => d.id === questId);
      if (!questDef) continue;

      const deps = areDependenciesMet(questId);
      if (!deps.met) continue;

      const targetSceneId =
        resolveAvailableQuestTargetScene(questDef.questGiverNpcId, timeOfDay, scheduleCtx)
        ?? null;
      const directionHint = buildGuidanceDirectionHint(
        targetSceneId ?? undefined,
        currentSceneId,
      );

      return {
        text: `Прими задание: ${questDef.title}`,
        questTitle: questDef.title,
        questType: questDef.questType,
        questId,
        objectiveType: 'available_quest' as const,
        directionHint,
        targetSceneId,
        completedObjectives: 0,
        totalObjectives: questDef.objectives.length,
      };
    }

    return null;
  }, [quests, currentSceneId, timeOfDay, scheduleCtx]);
  useEffect(() => {
    const refresh = () => {
      const next = getCurrentGuidance();
      if (next) setGuidance(next);
    };
    refresh();

    const unsubs = [
      eventBus.on('story:guidance_update', (payload) => {
        setGuidance(payload);
        setFirstReadingHint(getFirstReadingHint());
      }),
      eventBus.on('scene:loaded', () => {
        refresh();
        setFirstReadingHint(getFirstReadingHint());
      }),
      eventBus.on('quest:completed', () => {
        setFirstReadingHint(getFirstReadingHint());
      }),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  const storyDirectionHint = useMemo(
    () => buildGuidanceDirectionHint(guidance?.targetSceneId, currentSceneId),
    [guidance?.targetSceneId, currentSceneId],
  );

  const directionHint = currentObjective?.directionHint ?? storyDirectionHint;

  const displayText = currentObjective?.text ?? guidance?.objectiveText ?? '';
  const objectiveSig = displayText
    ? `${currentObjective?.questTitle ?? ''}|${displayText}`
    : '';

  useEffect(() => {
    if (revealTimerRef.current) {
      clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }

    if (suppressForHandoff || !displayText) {
      setRevealReady(false);
      return;
    }

    revealTimerRef.current = setTimeout(() => {
      setRevealReady(true);
      revealTimerRef.current = null;
    }, EXPLORATION_HUD_HANDOFF.GUIDANCE_REVEAL_MS);

    return () => {
      if (revealTimerRef.current) {
        clearTimeout(revealTimerRef.current);
        revealTimerRef.current = null;
      }
    };
  }, [suppressForHandoff, displayText]);

  useEffect(() => {
    if (!objectiveSig) return;
    if (dismissedSig && dismissedSig !== objectiveSig) {
      setDismissedSig(null);
      try {
        sessionStorage.removeItem(GUIDANCE_DISMISS_KEY);
      } catch { /* ignore */ }
    }
  }, [objectiveSig, dismissedSig]);

  const actNumber = guidance?.actNumber ?? 1;
  const chapterTitle = guidance?.chapterTitle;
  const objectiveKind: QuestObjectiveKind = currentObjective?.objectiveType ?? 'story_guidance';
  const urgency = resolveQuestUrgency(
    currentObjective?.questType ?? 'main',
    objectiveKind,
    guidance?.urgency,
  );
  const urgencyColor = getQuestUrgencyColor(urgency);
  const typeStripLabel = currentObjective
    ? getQuestTypeStripLabel(currentObjective.questType, currentObjective.objectiveType)
    : null;
  const progressPercent = currentObjective
    ? computeObjectiveProgressPercent(
      currentObjective.completedObjectives,
      currentObjective.totalObjectives,
    )
    : 0;
  const progressLabel = currentObjective
    ? formatQuestObjectiveProgress(
      currentObjective.completedObjectives,
      currentObjective.totalObjectives,
    )
    : '';

  const openQuestJournal = useCallback((questId?: string) => {
    eventBus.emit('ui:open_panel', {
      panel: 'quests',
      ...(questId ? { questId } : {}),
    });
  }, []);
  const handleDismiss = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (!objectiveSig) return;
    setDismissedSig(objectiveSig);
    setExpanded(false);
    try {
      sessionStorage.setItem(GUIDANCE_DISMISS_KEY, objectiveSig);
    } catch { /* ignore */ }
  }, [objectiveSig]);

  const handleRestore = useCallback(() => {
    setDismissedSig(null);
    try {
      sessionStorage.removeItem(GUIDANCE_DISMISS_KEY);
    } catch { /* ignore */ }
  }, []);

  const toggleExpand = useCallback(() => {
    if (currentObjective?.objectiveType === 'available_quest') {
      openQuestJournal(currentObjective.questId);
      return;
    }
    setExpanded((prev) => !prev);
  }, [currentObjective?.objectiveType, currentObjective?.questId, openQuestJournal]);

  const handleOpenJournal = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    openQuestJournal(currentObjective?.questId);
  }, [currentObjective?.questId, openQuestJournal]);
  // Show guidance even during the tutorial — the player needs to know
  // their first objective ("Осмотреть рабочий стол [E]") immediately.
  // Previously tutorialActive hid this, leaving the player aimless.
  const shouldShow =
    isExplorationHudProfile(profile)
    && !showStoryOverlay
    && !diegeticNarrative
    && !interactionLocked
    && revealReady
    && Boolean(displayText);

  const isAvailableQuest = currentObjective?.objectiveType === 'available_quest';

  if (!shouldShow) return null;

  const isDismissed = Boolean(dismissedSig && dismissedSig === objectiveSig);
  const topPx = explorationObjectiveTopPx();

  if (isDismissed) {
    return (
      <motion.button
        type="button"
        initial={reducedMotion ? false : { opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: motionDuration }}
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto hud-filmic-kicker px-1 py-1"
        style={{
          top: topPx,
          zIndex: UI_LAYERS.HUD + 2,
          color: 'var(--hud-filmic-ink-muted)',
          background: 'transparent',
          border: 'none',
        }}
        onClick={handleRestore}
        aria-label="Показать текущую цель"
      >
        Цель
      </motion.button>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: -10 }}
        transition={{ duration: motionDuration, ease: 'easeOut' }}
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto"
        data-exploration-ui
        data-testid="story-guidance-hud"
        style={{
          top: topPx,
          zIndex: UI_LAYERS.HUD + 2,
          maxWidth: EXPLORATION_HUD_LAYOUT.OBJECTIVE_MAX_WIDTH,
          width: 'min(92vw, 360px)',
        }}
      >
        <div
          role="button"
          tabIndex={0}
          onClick={toggleExpand}
          onDoubleClick={(e) => {
            e.preventDefault();
            openQuestJournal(currentObjective?.questId);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              toggleExpand();
            }
            if (e.key === 'q' || e.key === 'Q') {
              e.preventDefault();
              openQuestJournal(currentObjective?.questId);
            }
          }}
          className="relative cursor-pointer hud-filmic-objective px-1 pt-1"
          aria-label={`Цель акта ${actNumber}: ${displayText}`}
        >
          <div className="flex flex-col items-center gap-1.5 px-8 sm:px-10">
            <div className="hud-filmic-rule hud-filmic-rule--wide" aria-hidden />
            <div className="flex items-center gap-2 flex-wrap justify-center">
              <span className="hud-filmic-kicker" style={{ color: urgencyColor }}>
                Акт {actNumber}
                {typeStripLabel ? ` · ${typeStripLabel}` : ''}
              </span>
              {directionHint && !expanded ? (
                <span className="hud-filmic-kicker truncate max-w-[140px]" style={{ letterSpacing: '0.12em' }}>
                  {directionHint}
                </span>
              ) : null}
            </div>
            <p
              className={`hud-filmic-body quest-objective-text ${expanded ? '' : 'line-clamp-2'}`}
              style={{ maxWidth: '100%' }}
            >
              {displayText}
            </p>
            {firstReadingHint && !expanded ? (
              <p className="hud-filmic-body text-[11px] opacity-80" style={{ fontStyle: 'italic' }}>
                {firstReadingHint}
              </p>
            ) : null}
            {currentObjective && currentObjective.totalObjectives > 0 && !expanded ? (
              <div className="w-full max-w-[220px] flex items-center gap-2 mt-0.5">
                <div className="flex-1 h-px overflow-hidden" style={{ background: 'rgba(214,211,209,0.12)' }}>
                  <div
                    className="h-full"
                    style={{
                      width: `${progressPercent}%`,
                      background: `linear-gradient(90deg, transparent, ${urgencyColor})`,
                      transition: reducedMotion ? undefined : 'width 0.5s ease',
                    }}
                  />
                </div>
                {progressLabel ? (
                  <span className="hud-filmic-kicker shrink-0" style={{ letterSpacing: '0.08em', fontSize: 8 }}>
                    {progressLabel}
                  </span>
                ) : null}
              </div>
            ) : null}
            {isAvailableQuest && !expanded ? (
              <span className="hud-filmic-kicker" style={{ letterSpacing: '0.18em' }}>
                Журнал · Q
              </span>
            ) : null}
            <div className="hud-filmic-rule hud-filmic-rule--soft" aria-hidden />
          </div>

          <div className="absolute top-0 right-0 flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleOpenJournal}
              className="min-w-[44px] min-h-[44px] w-11 h-11 sm:min-w-0 sm:min-h-0 sm:w-7 sm:h-7 flex items-center justify-center rounded-sm text-stone-500 hover:text-stone-200 hover:bg-white/5 transition-colors"
              aria-label="Открыть журнал заданий"
              title="Журнал (Q)"
            >
              <BookOpen className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="min-w-[44px] min-h-[44px] w-11 h-11 sm:min-w-0 sm:min-h-0 sm:w-7 sm:h-7 flex items-center justify-center rounded-sm text-stone-500 hover:text-stone-200 hover:bg-white/5 transition-colors"
              aria-label="Скрыть подсказку цели"
            >
              <X className="size-3.5" />
            </button>
          </div>

          <AnimatePresence>
            {expanded && (
              <motion.div
                initial={reducedMotion ? false : { height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={reducedMotion ? undefined : { height: 0, opacity: 0 }}
                transition={{ duration: reducedMotion ? 0 : 0.2 }}
                className="overflow-hidden px-3 py-2 mt-1"
              >
                {directionHint ? (
                  <p className="hud-filmic-body text-[11px] mb-1 opacity-80">{directionHint}</p>
                ) : null}
                {firstReadingHint ? (
                  <p className="hud-filmic-body text-[11px] mb-1 opacity-80">{firstReadingHint}</p>
                ) : null}
                {currentObjective?.questTitle ? (
                  <p className="hud-filmic-kicker mb-1" style={{ letterSpacing: '0.12em' }}>
                    {currentObjective.questTitle}
                  </p>
                ) : null}
                {chapterTitle ? (
                  <p className="hud-filmic-body text-[11px] opacity-70 mt-1">{chapterTitle}</p>
                ) : null}
                {progressLabel ? (
                  <p className="hud-filmic-kicker mt-1" style={{ letterSpacing: '0.1em', fontSize: 8 }}>
                    {progressLabel} · {progressPercent}%
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleOpenJournal}
                  className="hud-filmic-kicker mt-2 underline-offset-2 hover:underline"
                  style={{ color: 'var(--hud-filmic-accent)' }}
                >
                  Q — журнал
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ─── Lost player hint toast ─── */
export function PlayerLostHintToast() {
  const [hint, setHint] = useState<string | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const motionDuration = reducedMotion ? 0 : 0.4;

  useEffect(() => {
    const unsubs = [
      eventBus.on('story:player_lost', (payload) => {
        setHint(payload.hint);
      }),
      // New guidance means the player is back on track — dismiss lost toast.
      eventBus.on('story:guidance_update', () => {
        setHint(null);
      }),
    ];
    return () => {
      for (const unsub of unsubs) unsub();
    };
  }, []);

  // Auto-dismiss after 8 seconds
  useEffect(() => {
    if (!hint) return;
    const timer = setTimeout(() => setHint(null), 8000);
    return () => clearTimeout(timer);
  }, [hint]);

  const dismiss = useCallback(() => setHint(null), []);

  if (!hint) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={reducedMotion ? false : { opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? undefined : { opacity: 0, y: 20 }}
        transition={{ duration: motionDuration, ease: 'easeOut' }}
        className="fixed bottom-24 left-1/2 -translate-x-1/2 pointer-events-auto"
        style={{ zIndex: UI_LAYERS.HUD + 3, maxWidth: 320 }}
      >
        <div className="flex items-center gap-2 px-3 py-2 hud-filmic-toast">
          <Compass className="size-3.5 shrink-0" style={{ color: 'var(--hud-filmic-accent)' }} aria-hidden />
          <p className="hud-filmic-body text-[12px] flex-1" style={{ textAlign: 'left', fontStyle: 'italic' }}>
            {hint}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-sm text-stone-500 hover:text-stone-200 hover:bg-white/5 transition-colors shrink-0"
            aria-label="Закрыть подсказку"
          >
            <X className="size-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
