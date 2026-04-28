'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { eventBus } from '@/engine/EventBus';
import { motion, AnimatePresence } from 'framer-motion';
import type { StoryNode, StoryChoice, ChoiceCondition, PoemLine, StoryEffect } from '@/data/types';
import { explorationHourToNarrativeTimeOfDay } from '@/game/conditions/timeOfDay';
import { statsEngine } from '@/engine/StatsEngine';
import { useGameStore } from '@/state';
import { useStoryConditionSlice } from '@/hooks/useStoryConditionSlice';
import { useMobileVisualPerf } from '@/hooks/useMobileVisualPerf';
import { useIsMobile } from '@/hooks/use-mobile';
import { formatSkillCheckHint } from '@/lib/skillCheckHint';
import { PoemGameComponent, InterpretationComponent } from './PoemComponents';
import { CyberSkillCheckResult, type SkillCheckBannerPayload } from './CyberSkillCheckResult';

interface StoryRendererProps {
  node: StoryNode;
  onChoice: (choice: StoryChoice) => void;
  /** После успешной мини-игры со стихами — обновление квестов (например poem_written) */
  onPoemGameComplete?: (ctx: { nodeId: string; score: number }) => void;
}

/** Фон «под стеклом» за текстом сюжета — не плоский залив, а neo-noir слои */
function getStoryBodyBackdropCss(opts: {
  dream: boolean;
  poem: boolean;
  ending: boolean;
  lite: boolean;
}): string {
  if (opts.lite) {
    if (opts.dream) return 'linear-gradient(175deg, #140a1c 0%, #0a0610 100%)';
    if (opts.poem) return 'linear-gradient(175deg, #1a1008 0%, #0c0806 100%)';
    if (opts.ending) return 'linear-gradient(175deg, #0c0c10 0%, #050508 100%)';
    return 'linear-gradient(175deg, #070c12 0%, #050508 100%)';
  }
  if (opts.dream) {
    return [
      'radial-gradient(ellipse 120% 90% at 50% -35%, rgba(192,132,252,0.26), transparent 52%)',
      'radial-gradient(ellipse 75% 55% at 100% 105%, rgba(76,29,149,0.42), transparent 58%)',
      'radial-gradient(ellipse 55% 40% at 0% 75%, rgba(139,92,246,0.14), transparent 48%)',
      'linear-gradient(168deg, #0a0612 0%, #12081a 42%, #0c0610 100%)',
    ].join(', ');
  }
  if (opts.poem) {
    return [
      'radial-gradient(ellipse 115% 85% at 50% -30%, rgba(251,191,36,0.14), transparent 50%)',
      'radial-gradient(ellipse 80% 50% at 0% 100%, rgba(180,83,9,0.22), transparent 55%)',
      'radial-gradient(ellipse 60% 45% at 100% 60%, rgba(245,158,11,0.08), transparent 45%)',
      'linear-gradient(168deg, #120a06 0%, #1a0f08 40%, #0c0805 100%)',
    ].join(', ');
  }
  if (opts.ending) {
    return [
      'radial-gradient(ellipse 100% 70% at 50% -20%, rgba(148,163,184,0.12), transparent 48%)',
      'radial-gradient(ellipse 90% 55% at 50% 120%, rgba(30,41,59,0.5), transparent 55%)',
      'linear-gradient(172deg, #08090c 0%, #0f1014 50%, #060608 100%)',
    ].join(', ');
  }
  return [
    'radial-gradient(ellipse 110% 80% at 50% -32%, rgba(0,255,255,0.1), transparent 48%)',
    'radial-gradient(ellipse 85% 55% at 105% 100%, rgba(255,90,40,0.07), transparent 52%)',
    'radial-gradient(ellipse 65% 45% at -5% 70%, rgba(0,180,200,0.06), transparent 46%)',
    'linear-gradient(178deg, #03060c 0%, #0a1018 38%, #060a0f 72%, #040508 100%)',
  ].join(', ');
}

// ============================================
// CYBER CHOICE CARD
// ============================================

interface CyberChoiceProps {
  choice: StoryChoice;
  index: number;
  nodeId: string;
  isLocked: boolean;
  lockReason?: string;
  onSelect: (choice: StoryChoice) => void;
  isDream: boolean;
  isPoem: boolean;
  skillHint?: string;
}

function CyberChoiceCard({ choice, index, nodeId, isLocked, lockReason, onSelect, isDream, isPoem, skillHint }: CyberChoiceProps) {
  const [isHovered, setIsHovered] = useState(false);

  const choiceTheme = useMemo(() => {
    if (isDream) {
      return {
        border: 'var(--game-ui-story-dream-border)',
        borderHover: 'var(--game-ui-story-dream-border-hover)',
        cardGlow: 'var(--game-ui-story-dream-choice-glow)',
        indicatorBg: 'var(--game-ui-story-dream-indicator)',
        indicatorGlow: 'var(--game-ui-story-dream-indicator-glow)',
        scanSweep: 'linear-gradient(90deg, transparent 0%, rgba(168, 85, 247, 0.1) 50%, transparent 100%)',
        indexMuted: 'rgb(192 132 252 / 0.6)',
        skillHint: 'rgb(192 132 252 / 0.55)',
      };
    }
    if (isPoem) {
      return {
        border: 'var(--game-ui-story-poem-border)',
        borderHover: 'var(--game-ui-story-poem-border-hover)',
        cardGlow: 'var(--game-ui-story-poem-choice-glow)',
        indicatorBg: 'var(--game-ui-story-poem-indicator)',
        indicatorGlow: 'var(--game-ui-story-poem-indicator-glow)',
        scanSweep: 'linear-gradient(90deg, transparent 0%, rgba(251, 191, 36, 0.1) 50%, transparent 100%)',
        indexMuted: 'rgb(251 191 36 / 0.6)',
        skillHint: 'rgb(245 158 11 / 0.55)',
      };
    }
    return {
      border: 'var(--game-ui-story-cyan-border)',
      borderHover: 'var(--game-ui-story-cyan-border-hover)',
      cardGlow: 'var(--game-ui-story-cyan-choice-glow)',
      indicatorBg: 'var(--game-ui-story-cyan-indicator)',
      indicatorGlow: 'var(--game-ui-story-cyan-indicator-glow)',
      scanSweep: 'var(--game-ui-story-scan-sweep-cyan)',
      indexMuted: 'rgb(var(--game-ui-rgb-cyan) / 0.6)',
      skillHint: 'rgb(var(--game-ui-rgb-cyan) / 0.55)',
    };
  }, [isDream, isPoem]);

  const choiceAria = isLocked
    ? `Недоступный вариант ${index + 1}: ${choice.text}${lockReason ? `. ${lockReason}` : ''}`
    : `Выбрать вариант ${index + 1}: ${choice.text}`;

  return (
    <motion.button
      key={`${nodeId}-${index}`}
      type="button"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      onClick={(e) => {
        e.stopPropagation();
        if (!isLocked) onSelect(choice);
      }}
      disabled={isLocked}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={choiceAria}
      className={`game-critical-motion w-full text-left relative overflow-hidden transition-all duration-200 game-fm-layer game-fm-layer-promote ${
        isLocked
          ? 'opacity-50 cursor-not-allowed'
          : 'cursor-pointer'
      }`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
      }}
    >
      <div
        className="relative px-4 py-3 border-l-2"
        style={{
          borderLeftColor: isLocked ? 'rgb(239 68 68 / 0.3)' : isHovered ? choiceTheme.borderHover : choiceTheme.border,
          background: isLocked ? 'rgb(69 10 10 / 0.2)' : 'rgb(15 23 42 / 0.8)',
          boxShadow: isHovered && !isLocked ? `0 0 15px ${choiceTheme.cardGlow}` : 'none',
        }}
      >
        {/* Scan line sweep on hover */}
        {isHovered && !isLocked && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: choiceTheme.scanSweep,
              backgroundSize: '50% 100%',
              animation: 'cyber-scan 1.5s linear infinite',
            }}
          />
        )}

        <div className="flex items-center gap-3 relative z-10">
          {/* Left indicator bar */}
          <div
            className={`w-1 h-6 rounded-full ${isLocked ? 'bg-red-500/40' : ''}`}
            style={
              isLocked
                ? undefined
                : {
                    background: choiceTheme.indicatorBg,
                    boxShadow: `0 0 6px ${choiceTheme.indicatorGlow}`,
                  }
            }
          />

          <span
            className={`font-mono text-sm mr-1 ${isLocked ? 'text-red-600' : ''}`}
            style={!isLocked ? { color: choiceTheme.indexMuted } : undefined}
          >
            {isLocked ? '🔒' : `${index + 1}.`}
          </span>

          <span className={`min-w-0 flex-1 text-base font-medium md:text-lg ${isLocked ? 'text-slate-500' : 'text-white/90'}`}>
            {choice.text}
          </span>

          {!isLocked && choice.dialogueNpcId && (
            <span className="shrink-0 font-mono text-[10px] text-cyan-500/50" title="Встроенный диалог с персонажем">
              💬
            </span>
          )}

          {isLocked && (
            <span className="ml-auto font-mono text-[10px] text-red-400/60 uppercase tracking-wider">RESTRICTED</span>
          )}
        </div>

        {skillHint && !isLocked && (
          <p
            className="mt-1.5 pl-9 font-mono text-[10px] leading-snug tracking-wide relative z-10"
            style={{ color: choiceTheme.skillHint }}
          >
            <span className="opacity-50">CHK</span> {skillHint}
          </p>
        )}

        {isLocked && lockReason && (
          <span className="text-xs text-slate-600 ml-10 relative z-10">{lockReason}</span>
        )}
      </div>
    </motion.button>
  );
}

// ============================================
// SPEAKER TAG
// ============================================

function SpeakerTag({ speaker }: { speaker: string }) {
  const isInternal = speaker === 'Внутренний голос';
  const isVika = speaker === 'Виктория' || speaker === 'Мария';

  const tagStyle = isInternal
    ? { bg: 'bg-slate-800/80', text: 'text-slate-300', border: 'border-slate-600/40', prefix: '[', suffix: ']' }
    : isVika
    ? { bg: 'bg-rose-900/60', text: 'text-rose-200', border: 'border-rose-500/40', prefix: '<', suffix: '>' }
    : { bg: 'bg-slate-900/75', text: 'text-cyan-100', border: 'border-cyan-500/35', prefix: '<', suffix: '>' };

  return (
    <motion.div
      className="mb-3"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
    >
      <span className={`px-3 py-1.5 font-mono text-sm border ${tagStyle.bg} ${tagStyle.text} ${tagStyle.border}`}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
        }}
      >
        {tagStyle.prefix}{speaker}{tagStyle.suffix}
      </span>
    </motion.div>
  );
}

// ============================================
// MAIN STORY RENDERER
// ============================================

export default function StoryRenderer({ node, onChoice, onPoemGameComplete }: StoryRendererProps) {
  const visualLite = useMobileVisualPerf();
  const isNarrow = useIsMobile() ?? false;
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const typingRef = useRef<NodeJS.Timeout | null>(null);
  const skillBannerTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [lastSkillCheck, setLastSkillCheck] = useState<SkillCheckBannerPayload | null>(null);
  const conditionSlice = useStoryConditionSlice();
  const inventoryIds = useGameStore((s) => s.inventory.map((i) => i.item.id).join(','));
  const npcRelationSig = useGameStore((s) => s.npcRelations.map((r) => `${r.id}:${r.value}`).join('|'));
  const activeQuestIds = useGameStore((s) => s.activeQuestIds);
  const completedQuestIds = useGameStore((s) => s.completedQuestIds);

  // Typewriter effect
  useEffect(() => {
    if (!node.text) {
      setIsTyping(false);
      setDisplayedText('');
      return;
    }

    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    const text = node.text;

    if (typingRef.current) clearInterval(typingRef.current);
    typingRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, ++i));
      } else {
        if (typingRef.current) clearInterval(typingRef.current);
        typingRef.current = null;
        setIsTyping(false);
      }
    }, 25);

    return () => {
      if (typingRef.current) {
        clearInterval(typingRef.current);
        typingRef.current = null;
      }
    };
  }, [node.id, node.text]);

  useEffect(() => {
    setLastSkillCheck(null);
    if (skillBannerTimeoutRef.current) {
      clearTimeout(skillBannerTimeoutRef.current);
      skillBannerTimeoutRef.current = null;
    }
  }, [node.id]);

  useEffect(() => {
    const unsub = eventBus.on('skill:check', (payload) => {
      if (skillBannerTimeoutRef.current) {
        clearTimeout(skillBannerTimeoutRef.current);
        skillBannerTimeoutRef.current = null;
      }
      setLastSkillCheck({
        success: payload.success,
        skill: payload.skill,
        roll: payload.roll,
        difficulty: payload.difficulty,
      });
      skillBannerTimeoutRef.current = setTimeout(() => {
        setLastSkillCheck(null);
        skillBannerTimeoutRef.current = null;
      }, 3000);
    });
    return () => {
      unsub();
      if (skillBannerTimeoutRef.current) {
        clearTimeout(skillBannerTimeoutRef.current);
        skillBannerTimeoutRef.current = null;
      }
    };
  }, []);

  const skipTyping = useCallback(() => {
    if (typingRef.current) {
      clearInterval(typingRef.current);
      typingRef.current = null;
    }
    if (node.text) {
      setDisplayedText(node.text);
      setIsTyping(false);
    }
  }, [node.text]);

  // Check if a choice condition is met
  const checkCondition = useCallback((condition?: ChoiceCondition): { met: boolean; reason?: string } => {
    if (!condition) return { met: true };

    const state = useGameStore.getState();
    const playerState = state.playerState;
    const inventory = state.inventory.map((i) => i.item.id);

    return statsEngine.isChoiceConditionMet(
      condition,
      playerState,
      playerState.flags,
      inventory,
      state.npcRelations,
      playerState.visitedNodes,
      activeQuestIds,
      completedQuestIds,
      {
        narrativeTimeOfDay: explorationHourToNarrativeTimeOfDay(state.exploration.timeOfDay),
        equippedItemIds: playerState.equippedItemIds ?? [],
      },
    );
  }, [conditionSlice, inventoryIds, npcRelationSig, activeQuestIds, completedQuestIds]);

  // Auto-advance for nodes with autoNext
  // BUGFIX: pass node's onEnter/effect so effects aren't silently lost
  useEffect(() => {
    if (node.autoNext && !node.choices?.length && !isTyping && !node.text) {
      const timer = setTimeout(() => onChoice({
        text: '',
        next: node.autoNext!,
        effect: node.onEnter || node.effect,
      }), 500);
      return () => clearTimeout(timer);
    }
  }, [node, isTyping, onChoice]);

  const isDreamNode = node.type === 'dream';
  const isPoemNode = node.type === 'poem' || node.type === 'poem_game';
  const isEndingNode = node.type === 'ending';

  const bodyBackdropCss = useMemo(
    () =>
      getStoryBodyBackdropCss({
        dream: isDreamNode,
        poem: isPoemNode,
        ending: isEndingNode,
        lite: visualLite,
      }),
    [isDreamNode, isPoemNode, isEndingNode, visualLite],
  );

  const hasRenderableContent =
    !!node.text ||
    !!node.choices?.length ||
    !!node.autoNext ||
    node.type === 'poem_game' ||
    node.type === 'interpretation';

  if (!hasRenderableContent) return null;

  const borderColor = isDreamNode
    ? 'border-purple-500/40'
    : isPoemNode
    ? 'border-amber-500/40'
    : isEndingNode
    ? 'border-slate-400/30'
    : 'border-cyan-500/40';

  return (
    <motion.div
      className="game-critical-motion fixed bottom-0 left-0 right-0 z-40 p-4 max-md:p-5 game-fm-layer game-fm-layer-promote"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      transition={{ duration: visualLite ? 0.2 : 0.4 }}
    >
      <div
        className={`max-w-4xl mx-auto relative border-t ${borderColor} bg-[#020308]/96 shadow-2xl cursor-pointer overflow-hidden ${
          visualLite ? '' : 'backdrop-blur-md terminal-border-pulse'
        }`}
        style={{
          clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
        }}
        onClick={skipTyping}
      >
        {/* Terminal header bar */}
        <div className="relative z-30 flex items-center justify-between px-4 py-2 border-b border-cyan-500/10 bg-black/45">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
            <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
          </div>
          <span className="font-mono text-[10px] text-cyan-500/40 tracking-wider">
            volodka://story/{node.id}
          </span>
          <div className="w-12" />
        </div>

        <div className="relative min-h-[120px]">
          {/* Атмосфера за текстом и вариантами */}
          <div
            className="pointer-events-none absolute inset-0 z-0"
            aria-hidden
            style={{ background: bodyBackdropCss }}
          />
          {!visualLite && (
            <div
              className="pointer-events-none absolute inset-0 z-[1] opacity-[0.4]"
              aria-hidden
              style={{
                backgroundImage: [
                  'repeating-linear-gradient(90deg, transparent, transparent 22px, rgba(0,255,255,0.028) 22px, rgba(0,255,255,0.028) 23px)',
                  'repeating-linear-gradient(0deg, transparent, transparent 22px, rgba(0,255,255,0.022) 22px, rgba(0,255,255,0.022) 23px)',
                ].join(', '),
              }}
            />
          )}
          {!visualLite && (
            <div
              className="pointer-events-none absolute inset-0 z-[2]"
              aria-hidden
              style={{
                background:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.05) 2px, rgba(0, 0, 0, 0.05) 4px)',
              }}
            />
          )}

          <AnimatePresence>
            {lastSkillCheck && (
              <div className="relative z-[25]">
                <CyberSkillCheckResult result={lastSkillCheck} />
              </div>
            )}
          </AnimatePresence>

          <div className="relative z-10 px-5 py-6 md:px-6 md:py-6">
          {/* Dream indicator */}
          {isDreamNode && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-purple-400 text-sm font-mono">🌙 Сон</span>
            </div>
          )}

          {/* Poem indicator */}
          {isPoemNode && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-amber-400 text-sm font-mono">✍️ Написание стихов</span>
            </div>
          )}

          {/* Ending indicator */}
          {isEndingNode && (
            <div className="mb-3 flex items-center gap-2">
              <span className="text-slate-300 text-sm font-mono">— Финал —</span>
            </div>
          )}

          {/* Speaker name */}
          {node.speaker && (
            <SpeakerTag speaker={node.speaker} />
          )}

          {/* Text */}
          {node.text && (
            <div className="min-h-[80px] mb-4">
              <p
                className={`text-xl md:text-2xl leading-relaxed whitespace-pre-line ${
                  isDreamNode ? 'text-purple-200/90' : isPoemNode ? 'text-amber-200/90' : 'text-white/90'
                }`}
                style={{
                  textShadow: '0 0 8px rgba(0, 255, 255, 0.1)',
                }}
              >
                {displayedText}
                {isTyping && (
                  <span className={`animate-pulse ${
                    isDreamNode ? 'text-purple-400' : isPoemNode ? 'text-amber-400' : 'text-cyan-400'
                  }`}>|</span>
                )}
              </p>
            </div>
          )}

          {/* Skip typing button */}
          {isTyping && (
            <div className="relative z-[50] flex justify-end mb-2">
              <button
                onClick={(e) => { e.stopPropagation(); skipTyping(); }}
                className="min-h-11 px-3 py-2 font-mono text-xs text-cyan-400/60 hover:text-cyan-400 transition-colors border border-cyan-500/20 hover:border-cyan-500/40 touch-manipulation"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                }}
              >
                Пропустить ▶
              </button>
            </div>
          )}

          {/* Choices — cyberpunk style */}
          <AnimatePresence>
            {!isTyping && node.choices && node.choices.length > 0 && (
              <motion.div
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ staggerChildren: 0.08 }}
              >
                {node.choices.map((choice, i) => {
                  const conditionResult = checkCondition(choice.condition);
                  const isLocked = !conditionResult.met || choice.locked;
                  const skillHint =
                    choice.skillCheck && !isLocked
                      ? formatSkillCheckHint(
                          choice.skillCheck.skill,
                          choice.skillCheck.difficulty,
                          conditionSlice.skills,
                        )
                      : undefined;

                  return (
                    <CyberChoiceCard
                      key={`${node.id}-${i}`}
                      choice={choice}
                      index={i}
                      nodeId={node.id}
                      isLocked={!!isLocked}
                      lockReason={conditionResult.reason}
                      onSelect={onChoice}
                      isDream={isDreamNode}
                      isPoem={isPoemNode}
                      skillHint={skillHint}
                    />
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Poem Game mini-game */}
          {node.type === 'poem_game' && node.lines && !isTyping && (
            <PoemGameComponent
              lines={node.lines}
              onComplete={(score) => {
                onPoemGameComplete?.({ nodeId: node.id, score });
                // After poem game, advance to autoNext or first choice's next
                const nextId = node.autoNext || node.choices?.[0]?.next;
                if (nextId) {
                  onChoice({
                    text: '',
                    next: nextId,
                    effect: node.onEnter || node.effect,
                  });
                }
              }}
            />
          )}

          {/* Dream Interpretation */}
          {node.type === 'interpretation' && node.interpretations && !isTyping && (
            <InterpretationComponent
              interpretations={node.interpretations}
              onSelect={(effect: StoryEffect) => {
                // Apply the chosen interpretation's effect and advance
                const nextId = node.autoNext || node.choices?.[0]?.next;
                if (nextId) {
                  onChoice({
                    text: '',
                    next: nextId,
                    effect,
                  });
                }
              }}
            />
          )}

          {/* Auto-advance indicator */}
          {!isTyping && !node.choices?.length && node.autoNext && node.text && (
            <motion.div
              className="flex justify-end mt-2"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                onClick={(e) => { e.stopPropagation(); onChoice({ text: '', next: node.autoNext!, effect: node.onEnter || node.effect }); }}
                className="px-4 py-2 font-mono text-sm text-cyan-400/60 hover:text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                style={{
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }}
              >
                Продолжить →
              </button>
            </motion.div>
          )}
          </div>

          {isTyping && isNarrow && (
            <button
              type="button"
              aria-label="Пропустить набор текста"
              className="absolute inset-x-0 bottom-0 z-[45] h-[min(46%,280px)] min-h-[120px] bg-transparent md:hidden touch-manipulation"
              onClick={(e) => {
                e.stopPropagation();
                skipTyping();
              }}
            />
          )}
        </div>
      </div>
    </motion.div>
  );
}
