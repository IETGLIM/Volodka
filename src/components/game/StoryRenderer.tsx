
/* ─── Volodka RPG – Story narrative overlay (v3) ───
   Clean minimal overlay: text + choices on dark semi-transparent bg.
   Renders on top of exploration mode when showStoryOverlay is true
   (World Director pattern — 3D world stays visible underneath).
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, SkipForward } from 'lucide-react';
import {
  useSetCurrentNodeId,
  useStoryContext,
  useVisitNode,
} from '@/store/selectors';
import { STORY_NODES } from '@/data/storyNodes';
import { audioEngine } from '@/engine/AudioEngine';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
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

/** Scene hub nodes — story overlay menus while in 3D exploration */
const EXPLORE_HUB_NODE_IDS = new Set(['explore_mode', 'corridor_explore_mode']);

/** Nodes that open a scene hub; all other hub targets dismiss the overlay */
const EXPLORE_HUB_ENTRY: Record<string, string> = {
  start: 'explore_mode',
  corridor_door: 'corridor_explore_mode',
  go_home: 'explore_mode',
};

/* ── Page turn animation variants ── */
const pageTurnVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 8 : -8,
    x: direction > 0 ? 30 : -30,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -8 : 8,
    x: direction > 0 ? -30 : 30,
  }),
};

/* ── Component ── */
export function StoryRenderer() {
  const { showStoryOverlay, currentNodeId, playerState } = useStoryContext();
  const setCurrentNodeId = useSetCurrentNodeId();
  const visitNode = useVisitNode();
  const nodeEffectGenRef = useRef(0);

  const [pageDirection, setPageDirection] = useState(0);
  const [appliedEffects, setAppliedEffects] = useState<StoryEffect[]>([]);

  const conditionCtx = useMemo(
    () => buildStoryConditionContext(playerState),
    [playerState],
  );

  const node = useMemo(() => STORY_NODES[currentNodeId], [currentNodeId]);

  const { displayed, done, skip } = useTypewriter(node?.text ?? '', 28);

  // Visit node on mount, apply effects, sync 3D scene when the node defines sceneId
  useEffect(() => {
    if (!node) return;

    const effectGen = ++nodeEffectGenRef.current;
    visitNode(node.id);
    requestSceneTransitionForStoryNode(node.id, node.sceneId);

    if (node.effects && node.effects.length > 0) {
      applyEffects(node.effects);
      const effectsToShow = node.effects;
      setTimeout(() => {
        if (effectGen !== nodeEffectGenRef.current) return;
        setAppliedEffects(effectsToShow);
        setTimeout(() => {
          if (effectGen !== nodeEffectGenRef.current) return;
          setAppliedEffects([]);
        }, 3000);
      }, 0);
    } else {
      setTimeout(() => {
        if (effectGen !== nodeEffectGenRef.current) return;
        setAppliedEffects([]);
      }, 0);
    }
  }, [node?.id, visitNode]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      audioEngine.playSfx('confirm');

      if (choice.effects) {
        applyEffects(choice.effects);
        setAppliedEffects(choice.effects);
        setTimeout(() => setAppliedEffects([]), 3000);
      }

      // Page direction for animation
      setPageDirection(1);

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
    [currentNodeId, setCurrentNodeId],
  );

  const handleContinue = useCallback(() => {
    audioEngine.playSfx('confirm');
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
  const isOpen = showStoryOverlay && !!node && !!STORY_NODES[currentNodeId];
  if (!isOpen) return null;

  const karmaLevel =
    playerState.karma >= KARMA_HIGH_THRESHOLD
      ? 'high'
      : playerState.karma <= KARMA_LOW_THRESHOLD
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
        custom={pageDirection}
        variants={pageTurnVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: UI_LAYERS.DIALOGUE, perspective: '800px' }}
        onClick={done ? undefined : skip}
        role="dialog"
        aria-modal="true"
        {...(node.speaker ? { 'aria-labelledby': speakerTitleId } : { 'aria-label': 'Сюжетная сцена' })}
      >
        <AriaLiveRegion message={typewriterLiveMessage} priority="polite" />
        {/* Clean dark semi-transparent background */}
        <div className="absolute inset-0 bg-black/60" aria-hidden="true" />

        {/* Content */}
        <FocusTrap>
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative z-10 w-full max-w-2xl mx-4 sm:mx-auto"
        >
          {/* Speaker name row */}
          {node.speaker && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`mb-4 flex items-center gap-3 ${speakerColor}`}
            >
              <div>
                <span id={speakerTitleId} className="text-sm font-medium tracking-wider uppercase">
                  {speakerLabel}
                </span>
                {/* Skip button */}
                {!done && (
                  <button
                    onClick={(e) => { e.stopPropagation(); skip(); }}
                    className="ml-3 flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                    aria-label="Пропустить анимацию текста"
                  >
                    <SkipForward className="size-3" />
                    Пропустить
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Story text */}
          <div className="min-h-[120px] mb-4">
            <p className="text-lg sm:text-xl text-slate-100 leading-relaxed font-light">
              {displayed}
              {!done && (
                <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          </div>

          {/* Stat change highlight chips */}
          <AnimatePresence>
            {appliedEffects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-wrap gap-1.5 mb-4"
              >
                {appliedEffects.map((effect, i) => (
                  <StatChangeChip key={i} effect={effect} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Choices */}
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {node.choices.length > 0 ? (
                node.choices.map((choice, i) => {
                  const cond = checkStoryCondition(choice.condition, conditionCtx);
                  return (
                    <motion.button
                      key={`${currentNodeId}-choice-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3, ease: 'easeOut' }}
                      whileHover={cond.pass ? { scale: 1.02, x: 4 } : {}}
                      whileTap={cond.pass ? { scale: 0.98 } : {}}
                      onClick={() => { if (cond.pass) handleChoice(choice); }}
                      disabled={!cond.pass}
                      aria-label={buildChoiceAriaLabel({ index: i, text: choice.text, cond })}
                      aria-disabled={!cond.pass}
                      className={`
                        group relative text-left px-5 py-3 rounded-lg transition-all duration-200 overflow-hidden
                        ${cond.pass
                          ? 'border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                          : 'border border-slate-700/40 bg-slate-900/20 text-slate-500 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0
                          ${cond.pass ? 'bg-cyan-900/60 border border-cyan-500/30 text-cyan-300' : 'bg-slate-800/60 border border-slate-600/30 text-slate-500'}
                        `}>
                          {i + 1}
                        </span>
                        <span className="flex-1">{choice.text}</span>
                        {cond.skillCheck && (
                          <span className="flex items-center gap-1 text-xs text-rose-400">
                            <Zap className="size-3" />
                            {cond.skillCheck.skill} {cond.skillCheck.needed}
                          </span>
                        )}
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br" />
                    </motion.button>
                  );
                })
              ) : (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  aria-label="Продолжить"
                  className="group relative text-left px-5 py-3 rounded-lg border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer transition-all duration-200 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className="size-4 text-cyan-500 group-hover:text-cyan-300 transition-colors" />
                    <span>Продолжить</span>
                  </div>
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
}
