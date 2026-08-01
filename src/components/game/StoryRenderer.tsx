/* ─── Volodka RPG – Story narrative overlay (cinematic) ───
   Full-screen AAA title-card beats; 3D world stays visible behind letterbox.
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { motion, AnimatePresence } from 'framer-motion';
import {
  useStoryContext,
  useVisitNode,
} from '@/store/selectors';
import { getStoryNodes, isNarrativeGameDataLoaded, ensureStoryNode, prefetchStoryNodes } from '@/data/gameDataLoader';
import { audioEngine } from '@/engine/AudioEngine';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { getGameStore } from '@/store/gameStore';
import { getLiveCurrentSceneId } from '@/store/stores/explorationStore';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import type { StoryChoice, StoryEffect } from '@/shared/types/game';
import { checkStoryCondition, buildStoryConditionContext } from '@/shared/storyConditions';
import {
  buildNarrativeLiveMessage,
  resolveNarrativeText,
} from '@/shared/narrativePresentation';
import { appendTrueEndEpilogueReflection } from '@/engine/story/resolveTrueEndEpilogue';
import {
  CinematicNarrativeChoices,
  CinematicNarrativeFrame,
  resolveCinematicNarrativePresentation,
} from '@/components/game/cinematic';

/* ── Typewriter hook — shared ── */
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';
import { useNarrativeChoiceKeyboard } from '@/hooks/useNarrativeChoiceKeyboard';

/* ── Apply effects — shared ── */
import { applyEffects } from '@/shared/utils/applyEffects';
import { devWarn } from '@/shared/utils/devLog';
import { eventBus } from '@/engine/EventBus';
import { STORY_NODE_TO_NPC_ID } from '@/data/goldenPath';
import { resolveNpcIdFromSpeaker } from '@/data/allNpcDefinitions';
import { executeStoryChoice } from '@/engine/narrative/narrativeChoiceExecutor';

/* ── Stat change highlight chip ── */
function StatChangeChip({ effect }: { effect: StoryEffect }) {
  if (effect.type === 'addKarma' && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-cyan-950/40 border border-cyan-500/30 text-cyan-300"
      >
        {effect.value > 0 ? '+' : ''}{effect.value}☯
      </motion.span>
    );
  }
  if (effect.type === 'addStat' && effect.stat === 'energy' && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
          effect.value > 0 ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
        }`}
      >
        {effect.value > 0 ? '+' : ''}{effect.value}⚡
      </motion.span>
    );
  }
  if (effect.type === 'addStat' && effect.stat === 'stress' && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
          effect.value > 0 ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300' : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
        }`}
      >
        {effect.value > 0 ? '+' : ''}{effect.value}😤
      </motion.span>
    );
  }
  if (effect.type === 'addSkill' && effect.skill && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-violet-950/40 border border-violet-500/30 text-violet-300"
      >
        +{effect.value} {effect.skill}
      </motion.span>
    );
  }
  return null;
}


/* ── Component ── */
export function StoryRenderer() {
  const { showStoryOverlay, currentNodeId, karma, skills, flags, progression, collectedPoems, activeTTLFlags } = useStoryContext();
  const visitNode = useVisitNode();
  const nodeEffectGenRef = useRef(0);
  // Tracks the last node id whose mount effects were applied.
  // Prevents double-application in React StrictMode and fast remounts.
  const appliedNodeIdRef = useRef<string | null>(null);
  const effectTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const errorRef = useRef<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  const [appliedEffects, setAppliedEffects] = useState<StoryEffect[]>([]);

  const clearEffectTimers = useCallback(() => {
    for (const timer of effectTimersRef.current) {
      clearTimeout(timer);
    }
    effectTimersRef.current = [];
  }, []);

  const scheduleEffectTimer = useCallback((fn: () => void, ms: number) => {
    const timer = setTimeout(fn, ms);
    effectTimersRef.current.push(timer);
    return timer;
  }, []);

  const conditionCtx = useMemo(
    () => buildStoryConditionContext({ karma, skills, flags, progression }, { activeTTLFlags }, collectedPoems),
    [karma, skills, flags, progression, collectedPoems, activeTTLFlags],
  );

  const [storyPackVersion, setStoryPackVersion] = useState(0);
  const [isLoadingNode, setIsLoadingNode] = useState(false);

  useEffect(() => {
    if (!currentNodeId || !isNarrativeGameDataLoaded()) return;
    let cancelled = false;
    errorRef.current = null;

    // If the node isn't already cached, show a loading indicator
    const alreadyCached = Boolean(getStoryNodes()[currentNodeId]);
    if (!alreadyCached) setIsLoadingNode(true);

    void ensureStoryNode(currentNodeId)
      .then(() => {
        if (cancelled) return;
        setIsLoadingNode(false);
        setStoryPackVersion((v) => v + 1);
        const loaded = getStoryNodes()[currentNodeId];
        if (loaded?.choices) {
          prefetchStoryNodes(loaded.choices.map((c) => c.next));
        }
      })
      .catch((error) => {
        if (cancelled) return;
        setIsLoadingNode(false);
        errorRef.current = error instanceof Error ? error.message : String(error);
        devWarn('[StoryRenderer] Failed to load story node:', currentNodeId, error);
      });

    return () => {
      cancelled = true;
    };
  }, [currentNodeId, retryCount]);

  const storyNodes = isNarrativeGameDataLoaded() ? getStoryNodes() : null;
  const node = useMemo(
    () => (storyNodes ? storyNodes[currentNodeId] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [storyNodes, currentNodeId, storyPackVersion],
  );

  const resolvedText = useMemo(() => {
    if (!node) return '';
    const base = resolveNarrativeText(node, karma);
    if (node.id !== 'act7_true_end') return base;
    return appendTrueEndEpilogueReflection(base, { flags, collectedPoems });
  }, [node, karma, flags, collectedPoems]);

  const { displayed, done, skip, reducedMotion } = useNarrativeTypewriter(resolvedText, 28);

  useEffect(() => () => clearEffectTimers(), [clearEffectTimers]);

  // Visit node on mount, apply effects, sync 3D scene when the node defines sceneId
  useEffect(() => {
    if (!node) return;

    if (node.condition && !checkStoryCondition(node.condition, conditionCtx).pass) {
      closeNarrativeOverlay();
      return;
    }

    clearEffectTimers();
    const effectGen = ++nodeEffectGenRef.current;

    // Guard: only apply one-shot effects once per node, even in React StrictMode
    // where effects may mount-cleanup-remount without a dependency change.
    const shouldApplyEffects = appliedNodeIdRef.current !== node.id;
    if (shouldApplyEffects) {
      appliedNodeIdRef.current = node.id;
    }

    visitNode(node.id);
    const currentSceneId = getLiveCurrentSceneId();
    if (node.sceneId && currentSceneId !== node.sceneId) {
      requestSceneTransitionForStoryNode(node.id, node.sceneId);
    }

    if (shouldApplyEffects && node.effects && node.effects.length > 0) {
      applyEffects(node.effects);
      const effectsToShow = node.effects;
      scheduleEffectTimer(() => {
        if (effectGen !== nodeEffectGenRef.current) return;
        setAppliedEffects(effectsToShow);
        scheduleEffectTimer(() => {
          if (effectGen !== nodeEffectGenRef.current) return;
          setAppliedEffects([]);
        }, 3000);
      }, 0);
    } else {
      scheduleEffectTimer(() => {
        if (effectGen !== nodeEffectGenRef.current) return;
        setAppliedEffects([]);
      }, 0);
    }

    if (node.autoSave) {
      getGameStore().saveGame({ source: 'auto' });
    }

    if (node.accessibilityAnnounce) {
      eventBus.emit('ui:exploration_message', { text: node.accessibilityAnnounce });
    }

    if (node.soundEffect) {
      audioEngine.playSfx(node.soundEffect);
    }

    if (node.musicCue) {
      audioEngine.playStinger(node.musicCue);
    }

    const mappedNpcId = STORY_NODE_TO_NPC_ID[node.id];
    const speakerNpcId =
      node.speaker && node.speaker !== 'narrator'
        ? resolveNpcIdFromSpeaker(node.speaker)
        : undefined;
    const questNpcId = mappedNpcId ?? speakerNpcId;
    if (questNpcId) {
      eventBus.emit('npc:talked', { npcId: questNpcId, dialogueNodeId: node.id });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- node identity is keyed by id; property deps ensure content changes are caught
  }, [node?.id, visitNode, clearEffectTimers, scheduleEffectTimer, conditionCtx, node?.condition, node?.effects, node?.autoSave, node?.soundEffect, node?.musicCue, node?.speaker, node?.sceneId, node?.accessibilityAnnounce]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      // Use the shared executor — single source of truth for choice routing.
      // It handles: SFX, effects, explore-hub navigation, Act1 diegetic routing,
      // scene transitions, and the 'start' new-game flow with correct early return.
      executeStoryChoice(choice, {
        currentNodeId,
        nodeSceneId: node?.sceneId,
        onAppliedEffects: (effects) => {
          setAppliedEffects(effects);
          scheduleEffectTimer(() => setAppliedEffects([]), 3000);
        },
      });
    },
    [currentNodeId, node?.sceneId, scheduleEffectTimer],
  );

  const handleContinue = useCallback(() => {
    audioEngine.playSfx('confirm');
    closeNarrativeOverlay();
  }, []);

  const handleClose = useCallback(() => {
    audioEngine.playSfx('cancel');
    closeNarrativeOverlay();
  }, []);

  const handleRetry = useCallback(() => {
    errorRef.current = null;
    setRetryCount((c) => c + 1);
  }, []);

  const trySelectStoryChoice = useCallback(
    (index: number) => {
      if (!node || !done) return;
      const choice = node.choices[index];
      if (!choice) return;
      const cond = checkStoryCondition(choice.condition, conditionCtx);
      if (!cond.pass) return;
      handleChoice(choice);
    },
    [node, done, conditionCtx, handleChoice],
  );

  useNarrativeChoiceKeyboard({
    active: Boolean(showStoryOverlay && node),
    done,
    choiceCount: node?.choices.length ?? 0,
    onSelectChoice: trySelectStoryChoice,
    onSkip: skip,
    onClose: handleClose,
  });

  // World Director: story overlay renders during exploration (and cutscene handoff)
  // Show loading indicator while the node is being fetched
  const isOpen = showStoryOverlay && (!!node || isLoadingNode || !!errorRef.current);
  if (!isOpen) return null;

  // Loading state: node data is being fetched (not yet cached)
  if (isLoadingNode && !node) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ zIndex: UI_LAYERS.DIALOGUE }}>
        <div className="flex items-center gap-3 text-cyan-300/80 text-lg font-mono animate-pulse">
          <span className="tracking-widest">···</span>
        </div>
      </div>
    );
  }
  // Error state: story node fetch failed
  if (errorRef.current && !node) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ zIndex: UI_LAYERS.DIALOGUE }}>
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400 text-lg font-mono">Не удалось загрузить сюжетный узел</p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded border border-cyan-500/40 text-cyan-300 text-sm font-mono bg-black/40 hover:bg-cyan-950/40 hover:border-cyan-400/60 transition-colors"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }
  if (!node) return null;

  const speakerTitleId = `story-speaker-${currentNodeId}`;
  const speakerLabel =
    node.speaker && node.speaker !== 'narrator' ? node.speaker : undefined;
  const typewriterLiveMessage = node
    ? buildNarrativeLiveMessage(node, displayed, done)
    : '';

  const presentation = resolveCinematicNarrativePresentation(
    currentNodeId,
    'story',
    node.speaker,
  );

  return (
    <CinematicNarrativeFrame
      nodeKey={`story-${currentNodeId}`}
      presentation={presentation}
      ariaLabel="Сюжетная сцена"
      speakerTitleId={speakerTitleId}
      speakerLabel={speakerLabel ?? (node.speaker === 'narrator' ? 'Голос' : undefined)}
      displayedText={displayed}
      done={done}
      reducedMotion={reducedMotion}
      liveMessage={typewriterLiveMessage}
      onSkip={skip}
      onClose={handleClose}
      footer={
        appliedEffects.length > 0 ? (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex flex-wrap gap-2 justify-center mt-2"
            >
              {appliedEffects.map((effect, i) => (
                <StatChangeChip key={i} effect={effect} />
              ))}
            </motion.div>
          </AnimatePresence>
        ) : null
      }
    >
      {done && (
        <>
          {currentNodeId === 'act2_maria_meeting_place' &&
            karma < 30 &&
            node.choices.some(
              (c) => c.condition?.minKarma !== undefined && karma < c.condition.minKarma,
            ) && (
              <p className="text-xs text-rose-200/90 text-center mb-2 px-2">
                ☯ Карма слишком низкая для клятвы (нужно ≥30).
              </p>
            )}
          <CinematicNarrativeChoices
            accentColor={presentation.accentColor}
            onContinue={node.choices.length === 0 ? handleContinue : undefined}
            choices={node.choices.map((choice, i) => {
              const cond = checkStoryCondition(choice.condition, conditionCtx);
              return {
                key: `${currentNodeId}-choice-${i}`,
                text: choice.text,
                pass: cond.pass,
                cond,
                onSelect: () => handleChoice(choice),
                trailing:
                  !cond.pass && cond.karmaNeeded ? (
                    <span className="text-[10px] font-mono text-rose-300">
                      ☯ {cond.karmaNeeded.current}/{cond.karmaNeeded.needed}
                    </span>
                  ) : undefined,
              };
            })}
          />
        </>
      )}
    </CinematicNarrativeFrame>
  );
}
