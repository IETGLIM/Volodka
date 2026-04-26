'use client';

import { useState, useCallback, useMemo, useRef, useEffect, useLayoutEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { DialogueNode, DialogueChoice, DialogueEffect } from '@/data/rpgTypes';
import {
  startDialogue,
  endDialogue,
  processDialogueChoice,
  applyDialogueEffects,
  evaluateCondition,
  type DialogueContext,
} from '@/engine/DialogueEngine';
import { DIALOGUE_NODES } from '@/data/npcDefinitions';
import type { PlayerState, NPCRelation } from '@/data/types';
import { asTrainablePlayerSkill } from '@/lib/trainablePlayerSkill';
import { useGameStore } from '@/state';
import { explorationHourToNarrativeTimeOfDay } from '@/game/conditions/timeOfDay';
import { CyberSkillCheckResult, type SkillCheckBannerPayload } from './CyberSkillCheckResult';
import { QuestAcceptedGlitchToast } from './QuestAcceptedGlitchToast';

interface DialogueRendererProps {
  isOpen: boolean;
  npcId: string;
  npcName: string;
  dialogueTree: DialogueNode;
  /** Диалог открыт из сюжетного выбора — после завершения продолжится история */
  storyLinked?: boolean;
  /** Диалог поверх 3D-обхода: кинематографичные полосы и более тёмный фон. */
  explorationLayout?: boolean;
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  flags: Record<string, boolean>;
  inventory: string[];
  visitedNodes: string[];
  onEffect: (effect: DialogueEffect) => void;
  onClose: () => void;
}

// ============================================
// HOLOGRAPHIC NPC PORTRAIT FRAME
// ============================================

function HolographicPortrait({ npcName, npcColor }: { npcName: string; npcColor: string }) {
  return (
    <div className="relative">
      {/* Rotating ring animation */}
      <div
        className="absolute -inset-1.5 rounded-full border border-cyan-500/20"
        style={{
          animation: 'holo-rotate 6s ease-in-out infinite',
          borderTopColor: 'rgba(0, 255, 255, 0.3)',
          borderRightColor: 'transparent',
        }}
      />
      {/* Avatar */}
      <div
        className={`w-12 h-12 rounded-full bg-gradient-to-br ${npcColor} flex items-center justify-center text-white text-lg font-bold shadow-lg relative z-10`}
        style={{
          boxShadow: '0 0 15px rgba(0, 255, 255, 0.2), 0 0 30px rgba(0, 255, 255, 0.1)',
        }}
      >
        {npcName.charAt(0)}
      </div>
    </div>
  );
}

// ============================================
// CYBER DIALOGUE CHOICE
// ============================================

const CyberDialogueChoice = memo(function CyberDialogueChoice({
  choice,
  index,
  currentNodeId,
  isConditionMet,
  flags,
  handleChoice,
}: {
  choice: DialogueChoice;
  index: number;
  currentNodeId: string;
  isConditionMet: boolean;
  flags: Record<string, boolean>;
  handleChoice: (choice: DialogueChoice) => void;
}) {
  const [isHovered, setIsHovered] = useState(false);

  const dialogueChoiceAria = !isConditionMet
    ? `Недоступная реплика ${index + 1}: ${choice.text}`
    : `Выбрать реплику ${index + 1}: ${choice.text}`;

  return (
    <motion.button
      key={`${currentNodeId}-${index}`}
      type="button"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      onClick={() => handleChoice(choice)}
      disabled={!isConditionMet}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      aria-label={dialogueChoiceAria}
      className={`game-critical-motion w-full text-left relative overflow-hidden transition-all duration-200 game-fm-layer game-fm-layer-promote ${
        isConditionMet ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
      }`}
      style={{
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
      }}
    >
      <div
        className={`relative px-4 py-3 border-l-2 ${
          isConditionMet
            ? 'bg-slate-900/80 border-cyan-500/40 hover:border-cyan-400/60'
            : 'bg-red-950/20 border-red-500/30'
        }`}
        style={{
          boxShadow: isHovered && isConditionMet ? '0 0 12px rgba(0, 255, 255, 0.15)' : 'none',
        }}
      >
        {/* Scan line on hover */}
        {isHovered && isConditionMet && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, rgba(0, 255, 255, 0.08) 50%, transparent 100%)',
              backgroundSize: '50% 100%',
              animation: 'cyber-scan 1.5s linear infinite',
            }}
          />
        )}

        <div className="flex items-center gap-2 relative z-10">
          {/* Left indicator */}
          <div
            className={`w-1 h-5 rounded-full ${
              isConditionMet ? 'bg-cyan-400/60' : 'bg-red-500/40'
            }`}
            style={{
              boxShadow: isConditionMet ? '0 0 6px rgba(0, 255, 255, 0.4)' : 'none',
            }}
          />

          <span className="font-mono text-sm text-cyan-400/60">{index + 1}.</span>
          <span className={`text-base font-medium ${isConditionMet ? 'text-white/90' : 'text-slate-500'}`}>
            {choice.text}
          </span>

          {choice.skillCheck && (
            <span className="ml-2 font-mono text-[10px] text-cyan-500/60">
              [{choice.skillCheck.skill} ≥ {choice.skillCheck.difficulty}]
            </span>
          )}

          {!isConditionMet && (
            <span className="ml-auto font-mono text-[10px] text-red-400/60 uppercase tracking-wider">
              🔒 RESTRICTED
            </span>
          )}
        </div>
      </div>
    </motion.button>
  );
});

// ============================================
// MAIN DIALOGUE RENDERER
// ============================================

export default function DialogueRenderer({
  isOpen,
  npcId,
  npcName,
  dialogueTree,
  storyLinked = false,
  explorationLayout = false,
  playerState,
  npcRelations,
  flags,
  inventory,
  visitedNodes,
  onEffect,
  onClose,
}: DialogueRendererProps) {
  const [currentNode, setCurrentNode] = useState<DialogueNode>(dialogueTree);
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const [lastSkillCheck, setLastSkillCheck] = useState<SkillCheckBannerPayload | null>(null);
  const [dimaQuestToastOpen, setDimaQuestToastOpen] = useState(false);

  const addStat = useGameStore(s => s.addStat);
  const addStress = useGameStore(s => s.addStress);
  const reduceStress = useGameStore(s => s.reduceStress);
  const setFlag = useGameStore(s => s.setFlag);
  const unsetFlag = useGameStore(s => s.unsetFlag);
  const updateNPCRelation = useGameStore(s => s.updateNPCRelation);
  const addItem = useGameStore(s => s.addItem);
  const removeItem = useGameStore(s => s.removeItem);
  const activateQuest = useGameStore(s => s.activateQuest);
  const updateQuestObjective = useGameStore(s => s.updateQuestObjective);
  const collectPoem = useGameStore(s => s.collectPoem);
  const addSkill = useGameStore(s => s.addSkill);
  const explorationHour = useGameStore((s) => s.exploration.timeOfDay);

  const dialogueStoreActions = useMemo(() => ({
    addStat, addStress, reduceStress, setFlag, unsetFlag,
    updateNPCRelation, addItem, removeItem, activateQuest,
    updateQuestObjective, collectPoem,
    addSkill: (skill: string, amount: number) => {
      const k = asTrainablePlayerSkill(skill);
      if (k != null) addSkill(k, amount);
    },
  }), [addStat, addStress, reduceStress, setFlag, unsetFlag, updateNPCRelation, addItem, removeItem, activateQuest, updateQuestObjective, collectPoem, addSkill]);

  useLayoutEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Build dialogue context (только проп playerState — без getState(), чтобы не рассинхронизироваться с родителем)
  const dialogueContext: DialogueContext = useMemo(
    () => ({
      playerState,
      npcRelations,
      flags,
      inventory,
      visitedNodes,
      skills: playerState.skills,
      narrativeTimeOfDay: explorationHourToNarrativeTimeOfDay(explorationHour),
      equippedItemIds: playerState.equippedItemIds ?? [],
    }),
    [playerState, npcRelations, flags, inventory, visitedNodes, explorationHour],
  );

  useEffect(() => {
    if (!isOpen) return;
    startDialogue(npcId, dialogueTree, dialogueContext);
  }, [isOpen, npcId, dialogueTree, dialogueContext]);

  /** Квестовое уведомление: старт разговора с Димой (ветка корня) — без внутренних id в UI диалога. */
  useEffect(() => {
    if (!isOpen) {
      setDimaQuestToastOpen(false);
      return;
    }
    if (npcId === 'volodka_dima_neighbor' && dialogueTree.id === 'volodka_dima_root') {
      setDimaQuestToastOpen(true);
    }
  }, [isOpen, npcId, dialogueTree.id]);

  const typingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (typingIntervalRef.current != null) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
      }
    },
    [],
  );

  const startTyping = useCallback((text: string) => {
    if (typingIntervalRef.current != null) {
      clearInterval(typingIntervalRef.current);
      typingIntervalRef.current = null;
    }
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    typingIntervalRef.current = setInterval(() => {
      if (i < text.length) {
        setDisplayedText(text.slice(0, ++i));
      } else {
        if (typingIntervalRef.current != null) {
          clearInterval(typingIntervalRef.current);
          typingIntervalRef.current = null;
        }
        setIsTyping(false);
      }
    }, 25);
  }, []);

  const dismissDimaQuestToast = useCallback(() => setDimaQuestToastOpen(false), []);

  const closeDialogueSession = useCallback(() => {
    endDialogue(npcId, dialogueTree.id);
    onClose();
  }, [npcId, dialogueTree.id, onClose]);

  // Handle dialogue choice
  const handleChoice = useCallback((choice: DialogueChoice) => {
    const result = processDialogueChoice(
      choice,
      DIALOGUE_NODES as Record<string, DialogueNode>,
      dialogueContext,
      npcId,
    );

    if (result.blocked) return;

    // Apply effects
    if (result.effects.length > 0) {
      applyDialogueEffects(result.effects, dialogueStoreActions);
    }

    // Show skill check result
    if (result.skillCheckResult) {
      setLastSkillCheck(result.skillCheckResult);
      setTimeout(() => setLastSkillCheck(null), 3000);
    }

    // Move to next node
    if (result.nextNode) {
      setCurrentNode(result.nextNode);
      startTyping(result.nextNode.text);
    } else {
      // End of dialogue
      closeDialogueSession();
    }
  }, [dialogueContext, npcId, currentNode, dialogueStoreActions, startTyping, closeDialogueSession, dialogueTree.id]);

  // Get NPC avatar color based on name
  const npcColor = useMemo(() => {
    switch (npcId) {
      case 'zarema_home':
        return 'from-fuchsia-500 to-rose-700';
      case 'maria':
      case 'kitchen_maria':
        return 'from-rose-600 to-pink-700';
      case 'albert':
      case 'cafe_barista':
        return 'from-amber-600 to-orange-700';
      case 'office_colleague':
        return 'from-cyan-600 to-blue-700';
      case 'dream_lillian':
        return 'from-purple-600 to-violet-700';
      case 'park_elder':
        return 'from-emerald-600 to-green-700';
      default:
        return 'from-slate-600 to-slate-700';
    }
  }, [npcId]);

  // Neon color for NPC name
  const npcNeonColor = useMemo(() => {
    switch (npcId) {
      case 'zarema_home':
        return 'text-fuchsia-200';
      case 'maria':
      case 'kitchen_maria':
        return 'text-rose-300';
      case 'albert':
      case 'cafe_barista':
        return 'text-amber-300';
      case 'office_colleague':
        return 'text-cyan-300';
      case 'dream_lillian':
        return 'text-purple-300';
      case 'park_elder':
        return 'text-emerald-300';
      default:
        return 'text-slate-300';
    }
  }, [npcId]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="game-critical-motion fixed inset-0 z-50 flex items-end justify-center game-fm-layer game-fm-layer-promote font-[family-name:var(--font-geist-mono)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <QuestAcceptedGlitchToast
            open={dimaQuestToastOpen}
            body="Помочь соседу Диме: Grafana не должна будить весь подъезд. Реплики ниже — твой ответ."
            onDismiss={dismissDimaQuestToast}
          />
          {explorationLayout && (
            <>
              <div
                className="pointer-events-none absolute inset-x-0 top-0 z-[52] h-[min(10vh,72px)] bg-black shadow-[0_12px_40px_rgba(0,0,0,0.85)]"
                aria-hidden
              />
              <div
                className="pointer-events-none absolute inset-x-0 bottom-0 z-[52] h-[min(12vh,88px)] bg-black shadow-[0_-12px_40px_rgba(0,0,0,0.85)]"
                aria-hidden
              />
            </>
          )}

          {/* Dark overlay */}
          <div
            className={`absolute inset-0 ${explorationLayout ? 'bg-black/68' : 'bg-black/40'}`}
            onClick={closeDialogueSession}
            role="presentation"
          />

          {/* Dialogue window — cyberpunk terminal */}
          <motion.div
            className={`relative mx-4 mb-4 w-full max-w-4xl game-fm-layer ${explorationLayout ? 'z-[53]' : ''}`}
            style={{ transformOrigin: 'bottom center' }}
            initial={{ opacity: 0, scale: 0.97, skewX: -2 }}
            animate={{ opacity: 1, scale: 1, skewX: 0 }}
            exit={{ opacity: 0, scale: 0.97, skewX: 1.5 }}
            transition={{ type: 'spring', stiffness: 380, damping: 32 }}
          >
            <div
              className="overflow-hidden border border-orange-500/35 bg-black/95 shadow-[0_0_32px_rgba(34,197,94,0.22),0_0_56px_rgba(251,146,60,0.08)] backdrop-blur-md terminal-border-pulse"
              style={{
                clipPath: 'polygon(0 0, calc(100% - 16px) 0, 100% 16px, 100% 100%, 16px 100%, 0 calc(100% - 16px))',
              }}
            >
              <div className="border-b border-emerald-500/25 bg-emerald-950/15 px-4 py-1.5">
                <p className="text-[9px] uppercase tracking-[0.24em] text-emerald-400/85">
                  VOLODKA_OS v.1.3 // USER: root // CONN: SECURE
                </p>
              </div>
              {explorationLayout && (
                <div className="border-b border-orange-500/15 bg-black/40 px-4 py-1">
                  <p className="text-[9px] uppercase tracking-[0.2em] text-orange-300/55">CHANNEL: DIALOGUE // MODE: LIVE</p>
                </div>
              )}

              {storyLinked && (
                <div className="border-b border-amber-500/25 bg-amber-950/25 px-4 py-2">
                  <p className="font-mono text-[10px] leading-snug text-amber-200/80">
                    ⟡ Встроенный диалог — после «Завершить разговор» или последней реплики вы вернётесь к сюжетной ветке.
                  </p>
                </div>
              )}

              {/* Terminal header with NPC info */}
              <div className="flex items-center gap-4 border-b border-emerald-500/20 bg-black/50 p-4">
                {/* NPC portrait with holographic frame */}
                <HolographicPortrait npcName={npcName} npcColor={npcColor} />

                <div className="flex-1">
                  <h3
                    className={`font-mono font-bold ${npcNeonColor}`}
                    style={{
                      textShadow: '0 0 12px rgba(52, 211, 153, 0.35)',
                    }}
                  >
                    {npcName}
                  </h3>
                  <p className="mt-0.5 text-[10px] tracking-wide text-emerald-600/50">INCOMING_SIGNAL</p>
                </div>

                {/* System status indicators */}
                <div className="flex items-center gap-1.5">
                  <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-emerald-500/60">LIVE</span>
                </div>

                <button
                  type="button"
                  onClick={closeDialogueSession}
                  className="font-mono text-slate-500 hover:text-cyan-400 transition-colors p-2 text-sm border border-slate-700/30 hover:border-cyan-500/30"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
                  }}
                  aria-label={`Закрыть диалог с ${npcName}`}
                >
                  <span aria-hidden>✕</span>
                </button>
              </div>

              {/* Scanline overlay */}
              <div
                className="absolute inset-0 pointer-events-none z-20"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
                }}
              />

              {/* Skill check result */}
              <AnimatePresence>
                {lastSkillCheck && (
                  <CyberSkillCheckResult result={lastSkillCheck} />
                )}
              </AnimatePresence>

              {/* Dialogue text */}
              <div className="p-6 min-h-[100px] relative z-10">
                <p
                  className="text-white/90 text-lg leading-relaxed whitespace-pre-line"
                  style={{
                    textShadow: '0 0 8px rgba(0, 255, 255, 0.1)',
                  }}
                >
                  {isTyping ? displayedText : currentNode.text}
                  {isTyping && <span className="animate-pulse text-cyan-400">|</span>}
                </p>
              </div>

              {/* Dialogue choices — cyberpunk style */}
              {currentNode.choices && currentNode.choices.length > 0 && (
                <div className="px-4 pb-4 space-y-2 relative z-10">
                  {currentNode.choices.map((choice, i) => {
                    const isConditionMet = choice.skillCheck
                      ? true
                      : !choice.condition || evaluateCondition(choice.condition, dialogueContext);

                    return (
                      <CyberDialogueChoice
                        key={`${currentNode.id}-${i}`}
                        choice={choice}
                        index={i}
                        currentNodeId={currentNode.id}
                        isConditionMet={isConditionMet}
                        flags={flags}
                        handleChoice={handleChoice}
                      />
                    );
                  })}
                </div>
              )}

              {/* Auto-next or end dialogue */}
              {(!currentNode.choices || currentNode.choices.length === 0) && (
                <div className="px-4 pb-4 flex justify-end relative z-10">
                  <button
                    type="button"
                    onClick={closeDialogueSession}
                    className="px-4 py-2 font-mono text-sm text-cyan-400/60 hover:text-cyan-400 border border-cyan-500/20 hover:border-cyan-500/40 transition-colors"
                    style={{
                      clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                    }}
                    aria-label={`Завершить разговор с ${npcName} и закрыть окно`}
                  >
                    Завершить разговор
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
