
/* ─── Volodka RPG – Story narrative overlay (v4) ───
   Bottom-panel overlay matching DialogueRenderer (World Director pattern).
   3D world stays visible; no fullscreen VN center card.
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, SkipForward, X } from 'lucide-react';
import {
  useSetCurrentNodeId,
  useStoryContext,
  useVisitNode,
} from '@/store/selectors';
import { getStoryNodes, isNarrativeGameDataLoaded, ensureStoryNode, prefetchStoryNodes } from '@/data/gameDataLoader';
import { audioEngine } from '@/engine/AudioEngine';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { EXPLORE_HUB_NODE_IDS } from '@/shared/exploreHubNodes';
import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { StoryChoice, StoryEffect } from '@/shared/types/game';
import { checkStoryCondition, buildStoryConditionContext } from '@/shared/storyConditions';

/* ── Typewriter hook — shared ── */
import { useTypewriter } from '@/hooks/useTypewriter';

/* ── Apply effects — shared ── */
import { applyEffects } from '@/shared/utils/applyEffects';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { buildChoiceAriaLabel } from '@/shared/utils/choiceAriaLabel';
import { devWarn } from '@/shared/utils/devLog';

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


/** Nodes that open a scene hub; all other hub targets dismiss the overlay */
const EXPLORE_HUB_ENTRY: Record<string, string> = {
  start: 'explore_mode',
  corridor_door: 'corridor_explore_mode',
  go_home: 'explore_mode',
};

/* ── Component ── */
export function StoryRenderer() {
  const { showStoryOverlay, currentNodeId, storyConditionPlayer, karma } = useStoryContext();
  const setCurrentNodeId = useSetCurrentNodeId();
  const visitNode = useVisitNode();
  const nodeEffectGenRef = useRef(0);
  const effectTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

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
    () => buildStoryConditionContext(storyConditionPlayer),
    [storyConditionPlayer],
  );

  const [storyPackVersion, setStoryPackVersion] = useState(0);

  useEffect(() => {
    if (!currentNodeId || !isNarrativeGameDataLoaded()) return;
    let cancelled = false;

    void ensureStoryNode(currentNodeId)
      .then(() => {
        if (cancelled) return;
        setStoryPackVersion((v) => v + 1);
        const loaded = getStoryNodes()[currentNodeId];
        if (loaded?.choices) {
          prefetchStoryNodes(loaded.choices.map((c) => c.next));
        }
      })
      .catch((error) => {
        devWarn('[StoryRenderer] Failed to load story node:', currentNodeId, error);
      });

    return () => {
      cancelled = true;
    };
  }, [currentNodeId]);

  const storyNodes = isNarrativeGameDataLoaded() ? getStoryNodes() : null;
  const node = useMemo(
    () => (storyNodes ? storyNodes[currentNodeId] : undefined),
    [storyNodes, currentNodeId, storyPackVersion],
  );

  const { displayed, done, skip } = useTypewriter(node?.text ?? '', 28);

  useEffect(() => () => clearEffectTimers(), [clearEffectTimers]);

  // Visit node on mount, apply effects, sync 3D scene when the node defines sceneId
  useEffect(() => {
    if (!node) return;

    clearEffectTimers();
    const effectGen = ++nodeEffectGenRef.current;
    visitNode(node.id);
    requestSceneTransitionForStoryNode(node.id, node.sceneId);

    if (node.effects && node.effects.length > 0) {
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
  }, [node?.id, visitNode, clearEffectTimers, scheduleEffectTimer]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      audioEngine.playSfx('confirm');

      if (choice.effects) {
        applyEffects(choice.effects);
        setAppliedEffects(choice.effects);
        scheduleEffectTimer(() => setAppliedEffects([]), 3000);
      }

      if (choice.next === null) {
        closeNarrativeOverlay();
      } else if (choice.next && EXPLORE_HUB_NODE_IDS.has(choice.next)) {
        const hubFromEntry = EXPLORE_HUB_ENTRY[currentNodeId];
        if (hubFromEntry === choice.next) {
          setCurrentNodeId(choice.next);
        } else {
          closeNarrativeOverlay();
        }
      } else {
        setCurrentNodeId(choice.next);
      }
    },
    [currentNodeId, setCurrentNodeId, scheduleEffectTimer],
  );

  const handleContinue = useCallback(() => {
    audioEngine.playSfx('confirm');
    closeNarrativeOverlay();
  }, []);

  const handleClose = useCallback(() => {
    audioEngine.playSfx('cancel');
    closeNarrativeOverlay();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    if (!done || !node || node.choices.length === 0) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= node.choices.length) {
        const choice = node.choices[num - 1];
        const cond = checkStoryCondition(choice.condition, conditionCtx);
        if (cond.pass) handleChoice(choice);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [done, node, conditionCtx, handleChoice]);

  // World Director: story overlay renders during exploration (and cutscene handoff)
  const isOpen = showStoryOverlay && !!node;
  if (!isOpen) return null;

  const karmaLevel =
    karma >= KARMA_HIGH_THRESHOLD
      ? 'high'
      : karma <= KARMA_LOW_THRESHOLD
        ? 'low'
        : 'mid';

  const speakerColor =
    node.speaker === 'narrator'
      ? 'text-slate-300'
      : karmaLevel === 'high'
        ? 'text-cyan-400'
        : karmaLevel === 'low'
          ? 'text-rose-400'
          : 'text-slate-200';

  const speakerTitleId = `story-speaker-${currentNodeId}`;
  const speakerLabel = node.speaker === 'narrator' ? 'Голос' : node.speaker;
  const typewriterLiveMessage = node.speaker
    ? `${speakerLabel}: ${displayed}${done ? '' : '…'}`
    : `${displayed}${done ? '' : '…'}`;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`story-${currentNodeId}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-x-0 bottom-0 flex justify-center pointer-events-none"
        style={{ zIndex: UI_LAYERS.DIALOGUE }}
        onClick={done ? undefined : skip}
      >
        <AriaLiveRegion message={typewriterLiveMessage} priority="polite" />
        <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px]" aria-hidden="true" />

        <FocusTrap>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[700px] mx-3 mb-3 pointer-events-auto"
            role="dialog"
            aria-modal="true"
            {...(node.speaker ? { 'aria-labelledby': speakerTitleId } : { 'aria-label': 'Сюжетная сцена' })}
          >
            <div
              className="relative border border-cyan-800/40 backdrop-blur-md overflow-hidden"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
                background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
                boxShadow: '0 0 20px rgb(var(--cyber-cyan-rgb) / 0.06), 0 4px 16px rgba(0,0,0,0.4), inset 0 0 12px rgba(0,0,0,0.3)',
              }}
            >
              <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-3 py-1">
                <span className="h-1 w-1 rounded-full bg-emerald-500/80" />
                <span className="h-1 w-1 rounded-full bg-amber-400/80" />
                <span className="h-1 w-1 rounded-full bg-red-500/80" />
                <span className="ml-2 font-mono text-[7px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://narrative</span>
                <div className="flex-1" />
                {!done && (
                  <button
                    onClick={(e) => { e.stopPropagation(); skip(); }}
                    className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono text-slate-500 hover:text-cyan-400 transition-colors"
                    aria-label="Пропустить анимацию текста"
                  >
                    <SkipForward className="size-2" />
                    Пропустить
                  </button>
                )}
                <button
                  onClick={handleClose}
                  className="text-slate-500 hover:text-white hover:bg-rose-500/20 rounded p-0.5 transition-colors"
                  aria-label="Закрыть"
                >
                  <X className="size-3" />
                </button>
              </div>

              <div className="relative z-0 p-3">
                {node.speaker && (
                  <div className={`mb-2 flex items-center gap-2 ${speakerColor}`}>
                    <span id={speakerTitleId} className="text-[10px] font-medium tracking-wider uppercase">
                      {speakerLabel}
                    </span>
                  </div>
                )}

                <div className="min-h-[36px] mb-2">
                  <motion.p
                    key={currentNodeId}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                    className="text-sm text-slate-100 leading-relaxed"
                  >
                    {displayed}
                    {!done && (
                      <span
                        className="inline-block w-0.5 h-3.5 ml-0.5 align-middle"
                        style={{
                          background: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
                          boxShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.6)',
                          animation: 'cursor-blink 0.8s step-end infinite',
                        }}
                      />
                    )}
                  </motion.p>
                </div>

                <AnimatePresence>
                  {appliedEffects.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="flex flex-wrap gap-1.5 mb-2"
                    >
                      {appliedEffects.map((effect, i) => (
                        <StatChangeChip key={i} effect={effect} />
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>

                {done && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col gap-1.5"
                  >
                    {node.choices.length > 0 ? (
                      node.choices.map((choice, i) => {
                        const cond = checkStoryCondition(choice.condition, conditionCtx);
                        return (
                          <motion.button
                            key={`${currentNodeId}-choice-${i}`}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.06, duration: 0.25, ease: 'easeOut' }}
                            whileHover={cond.pass ? { scale: 1.01, x: 2 } : {}}
                            whileTap={cond.pass ? { scale: 0.99 } : {}}
                            onClick={() => { if (cond.pass) handleChoice(choice); }}
                            disabled={!cond.pass}
                            aria-label={buildChoiceAriaLabel({ index: i, text: choice.text, cond })}
                            aria-disabled={!cond.pass}
                            className={`group relative text-left px-3 py-2 rounded-md text-sm transition-all duration-200 overflow-hidden ${
                              cond.pass
                                ? 'border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer'
                                : 'border border-slate-700/40 bg-slate-900/20 text-slate-500 cursor-not-allowed opacity-50'
                            }`}
                          >
                            <div className="flex items-center gap-2">
                              <ChevronRight className="size-3 text-cyan-500/70 group-hover:text-cyan-300 transition-colors shrink-0" />
                              <span className="flex-1">{choice.text}</span>
                              {cond.skillCheck && (
                                <span className="flex items-center gap-1 text-xs text-rose-400 shrink-0">
                                  <Zap className="size-3" />
                                  {cond.skillCheck.skill} {cond.skillCheck.needed}
                                </span>
                              )}
                            </div>
                          </motion.button>
                        );
                      })
                    ) : (
                      <motion.button
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.25 }}
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handleContinue}
                        aria-label="Продолжить"
                        className="group relative text-left px-3 py-2 rounded-md text-sm border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer transition-all duration-200"
                      >
                        <div className="flex items-center gap-2">
                          <ChevronRight className="size-3 text-cyan-500 group-hover:text-cyan-300 transition-colors" />
                          <span>Продолжить</span>
                        </div>
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
}
