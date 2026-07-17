
/* ─── Volodka RPG – StoryGuidanceHUD ─── */
/* Single compact objective strip below the compass — no duplicate quest HUD. */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, BookOpen, Compass } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { getCurrentGuidance, type GuidanceInfo } from '@/engine/GuidedStoryManager';
import { buildGuidanceDirectionHint } from '@/engine/guidedStory/guidanceLocation';
import { getNextTrackedObjective, areDependenciesMet, getQuestMarker } from '@/store/questStore';
import { useQuests, useCurrentSceneId, useOrchestratorNarrativeOverlay } from '@/store/selectors';
import { useTutorialActive } from '@/store/selectors/uiSelectors';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
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
import type { QuestType, SceneId } from '@/shared/types/game';
const GUIDANCE_DISMISS_KEY = 'volodka_guidance_dismissed_sig';

/** Contextual hint for the first_reading quest — tells the player *where* to go. */
function getFirstReadingHint(): string | null {
  try {
    const snap = getGameSnapshot();
    if (snap.playerState.progression.currentAct !== 1) return null;
    const quest = snap.quests.find(
      (q) => q.questId === 'first_reading' && q.status === 'active',
    );
    if (!quest) return null;
    const deskDone = snap.playerState.flags['interacted_desk'] === true;
    if (!deskDone) {
      return 'Подойди к рабочему столу и нажми [E]';
    }
    const hasPoem2 = snap.collectedPoems.includes('poem_2');
    const monitorRead = snap.playerState.flags['terminal_poem_read'] === true;
    if (!monitorRead && !hasPoem2) {
      return 'Активируй монитор на столе [E] — стих мерцает на экране';
    }
    if (!hasPoem2) {
      return 'Стихотворение можно найти на книжной полке слева от стола';
    }
    return null;
  } catch {
    return null;
  }
}

export function StoryGuidanceHUD() {
  const reducedMotion = useEffectiveReducedMotion();
  const motionDuration = reducedMotion ? 0 : 0.3;

  const [guidance, setGuidance] = useState<GuidanceInfo | null>(null);
  const [expanded, setExpanded] = useState(false);
  const [_lostHint, setLostHint] = useState<string | null>(null);
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
  const tutorialActive = useTutorialActive();
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

      return {
        text: `Прими задание: ${questDef.title}`,
        questTitle: questDef.title,
        questType: questDef.questType,
        questId,
        objectiveType: 'available_quest' as const,
        directionHint: null as string | null,
        targetSceneId: null as SceneId | null,
        completedObjectives: 0,
        totalObjectives: questDef.objectives.length,
      };
    }

    return null;
  }, [quests, currentSceneId]);
  useEffect(() => {
    const refresh = () => {
      const next = getCurrentGuidance();
      if (next) setGuidance(next);
    };
    refresh();

    const unsubs = [
      eventBus.on('story:guidance_update', (payload) => {
        setGuidance(payload);
        setLostHint(null); // clear lost hint when guidance updates
        setFirstReadingHint(getFirstReadingHint());
      }),
      eventBus.on('scene:loaded', () => {
        refresh();
        setFirstReadingHint(getFirstReadingHint());
      }),
      eventBus.on('story:player_lost', (payload) => {
        setLostHint(payload.hint);
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
  const shouldShow =
    isExplorationHudProfile(profile)
    && !showStoryOverlay
    && !diegeticNarrative
    && !interactionLocked
    && !tutorialActive
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
        className="fixed left-1/2 -translate-x-1/2 pointer-events-auto font-mono text-[10px] tracking-wider px-2.5 py-1 rounded-full border hud-button-cyber"
        style={{
          top: topPx,
          zIndex: UI_LAYERS.HUD + 2,
          color: urgencyColor,
          borderColor: `${urgencyColor}44`,
          background: 'rgba(0, 8, 16, 0.75)',
          backdropFilter: 'blur(8px)',
        }}
        onClick={handleRestore}
        aria-label="Показать текущую цель"
      >
        ► Цель
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
          className="relative rounded-md cursor-pointer quest-tracker-strip"
          style={{
            background: 'rgba(0, 10, 18, 0.82)',
            border: `1px solid ${urgencyColor}33`,
            boxShadow: `0 0 10px ${urgencyColor}12`,
            backdropFilter: 'blur(10px)',
          }}
          aria-label={`Цель акта ${actNumber}: ${displayText}`}
        >
          <div className="flex items-start gap-2 px-3 py-2 pr-16">
            <span
              className="text-xs font-bold flex-shrink-0 mt-0.5"
              style={{ color: urgencyColor, textShadow: `0 0 6px ${urgencyColor}44` }}
              aria-hidden
            >
              ►
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span
                  className="text-[9px] font-mono tracking-wider font-semibold"
                  style={{ color: '#00ffeeaa' }}
                >
                  ЦЕЛЬ · АКТ {actNumber}
                </span>
                {typeStripLabel ? (
                  <span
                    className="text-[8px] font-mono tracking-wider px-1 py-px rounded"
                    style={{
                      color: urgencyColor,
                      border: `1px solid ${urgencyColor}44`,
                      background: `${urgencyColor}11`,
                    }}
                  >
                    {typeStripLabel}
                  </span>
                ) : null}
                {directionHint && !expanded ? (
                  <span
                    className="text-[9px] font-mono tracking-wide truncate max-w-[120px]"
                    style={{ color: '#66ccffaa' }}
                  >
                    → {directionHint}
                  </span>
                ) : null}
                {isAvailableQuest && !expanded ? (
                  <span
                    className="text-[9px] font-mono tracking-wide ml-auto shrink-0"
                    style={{ color: `${urgencyColor}cc` }}
                  >
                    Журнал · Q
                  </span>
                ) : null}
                {!isAvailableQuest && !expanded && displayText ? (
                  <span
                    className="text-[9px] font-mono tracking-wide ml-auto shrink-0 opacity-60"
                    aria-hidden
                  >
                    ▾
                  </span>
                ) : null}
              </div>
              <p
                className={`text-xs font-mono leading-snug quest-objective-text ${expanded ? '' : 'line-clamp-2'}`}
                style={{ color: '#c8e8e8' }}
              >
                {displayText}
              </p>
              {firstReadingHint && !expanded ? (
                <p
                  className="text-[10px] font-mono mt-1 leading-snug"
                  style={{ color: '#66ccff' }}
                >
                  → {firstReadingHint}
                </p>
              ) : null}
              {currentObjective && currentObjective.totalObjectives > 0 && !expanded ? (
                <div className="mt-1.5 flex items-center gap-2">
                  <div className="flex-1 h-1 rounded-full overflow-hidden bg-white/8">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${progressPercent}%`,
                        background: `linear-gradient(90deg, ${urgencyColor}88, ${urgencyColor})`,
                        transition: reducedMotion ? undefined : 'width 0.5s ease',
                      }}
                    />
                  </div>
                  {progressLabel ? (
                    <span
                      className="text-[8px] font-mono tabular-nums shrink-0"
                      style={{ color: `${urgencyColor}aa` }}
                    >
                      {progressLabel}
                    </span>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>

          <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5">
            <button
              type="button"
              onClick={handleOpenJournal}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors hud-button-cyber"
              aria-label="Открыть журнал заданий"
              title="Журнал (Q)"
            >
              <BookOpen className="size-3.5" />
            </button>
            <button
              type="button"
              onClick={handleDismiss}
              className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-white hover:bg-white/10 transition-colors hud-button-cyber"
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
                className="overflow-hidden border-t px-3 py-2"
                style={{ borderColor: `${urgencyColor}22` }}
              >
                {directionHint ? (
                  <p className="text-[10px] font-mono mb-1" style={{ color: '#66ccff' }}>
                    → {directionHint}
                  </p>
                ) : null}
                {firstReadingHint ? (
                  <p className="text-[10px] font-mono mb-1" style={{ color: '#66ccff' }}>
                    → {firstReadingHint}
                  </p>
                ) : null}
                {currentObjective?.questTitle ? (
                  <p className="text-[10px] font-mono" style={{ color: '#889999' }}>
                    Задание: <span style={{ color: '#ffaa88' }}>{currentObjective.questTitle}</span>
                  </p>
                ) : null}
                {chapterTitle ? (
                  <p className="text-[10px] font-mono mt-1" style={{ color: '#668888' }}>
                    {chapterTitle}
                  </p>
                ) : null}
                {progressLabel ? (
                  <p className="text-[10px] font-mono mt-1" style={{ color: `${urgencyColor}99` }}>
                    Прогресс: {progressLabel} ({progressPercent}%)
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={handleOpenJournal}
                  className="text-[9px] font-mono mt-1.5 underline-offset-2 hover:underline"
                  style={{ color: `${urgencyColor}cc` }}
                >
                  Q — журнал заданий
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
    const unsub = eventBus.on('story:player_lost', (payload) => {
      setHint(payload.hint);
    });
    return unsub;
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
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{
            background: 'rgba(0, 10, 18, 0.88)',
            border: '1px solid #ffaa4433',
            boxShadow: '0 0 12px #ffaa4412',
            backdropFilter: 'blur(10px)',
          }}
        >
          <Compass className="size-4 text-amber-400/70 shrink-0" aria-hidden />
          <p className="text-[11px] font-mono leading-snug text-amber-200/80 flex-1">
            {hint}
          </p>
          <button
            type="button"
            onClick={dismiss}
            className="w-5 h-5 flex items-center justify-center rounded text-slate-500 hover:text-white hover:bg-white/10 transition-colors shrink-0"
            aria-label="Закрыть подсказку"
          >
            <X className="size-3" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
