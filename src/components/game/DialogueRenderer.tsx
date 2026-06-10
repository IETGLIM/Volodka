
/* ─── Volodka RPG – NPC dialogue overlay (AAA+ v2) ───
   Enhanced with: colored speaker name background, dialogue history,
   auto-advance mode, improved hover preview with effect details,
   better stat change highlighting.
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, Zap, Shield, Skull, Circle, Clock, FastForward, History, Eye } from 'lucide-react';
import {
  useDialogueContext,
  useSetCurrentNodeId,
  useVisitNode,
} from '@/store/selectors';
import {
  getDialogueNodes,
  findNpcById,
  findNpcByName,
  createInventoryItem,
  isNarrativeGameDataLoaded,
  ensureDialogueNode,
} from '@/data/gameDataLoader';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { getGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type {
  DialogueChoice,
  StoryEffect,
  TrainablePlayerSkill,
  NPCRelation,
} from '@/shared/types/game';
import { checkStoryCondition, buildStoryConditionContext } from '@/shared/storyConditions';
import { NPCPortrait, NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { buildChoiceAriaLabel } from '@/shared/utils/choiceAriaLabel';
import { devWarn } from '@/shared/utils/devLog';

/* ── Emotion detection from text ── */
function detectEmotion(text: string): 'calm' | 'angry' | 'sad' | 'happy' {
  if (text.includes('!') && (text.includes('ненави') || text.includes('боюсь') || text.includes('не могу'))) return 'angry';
  if (text.includes('...') && (text.includes('устал') || text.includes('потер') || text.includes('одинок') || text.includes('плачет'))) return 'sad';
  if (text.includes('!') && (text.includes('рад') || text.includes('найдём') || text.includes('обещаю') || text.includes('спасибо'))) return 'happy';
  return 'calm';
}

const EMOTION_BORDER: Record<string, string> = {
  calm: 'border-slate-500/50',
  angry: 'border-red-500/70',
  sad: 'border-blue-500/60',
  happy: 'border-amber-500/60',
};

/* ── Relationship indicator ── */
function getRelationLevel(npcId: string, relations: NPCRelation[]): 'ally' | 'neutral' | 'enemy' {
  const rel = relations.find((r) => r.npcId === npcId);
  if (!rel) return 'neutral';
  if (rel.value >= 65) return 'ally';
  if (rel.value <= 30) return 'enemy';
  return 'neutral';
}

/* ── Relationship glow color mapping ── */
const RELATION_GLOW: Record<string, { color: string; shadow: string; border: string }> = {
  ally: { color: '#34d399', shadow: '0 0 8px rgba(52,211,153,0.4), 0 0 16px rgba(52,211,153,0.2)', border: 'rgba(52,211,153,0.3)' },
  neutral: { color: 'var(--cyber-cyan)', shadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.4), 0 0 16px rgb(var(--cyber-cyan-rgb) / 0.2)', border: 'rgb(var(--cyber-cyan-rgb) / 0.3)' },
  enemy: { color: '#fb7185', shadow: '0 0 8px rgba(251,113,133,0.4), 0 0 16px rgba(251,113,133,0.2)', border: 'rgba(251,113,133,0.3)' },
};

/* ── Typewriter hook ── */
import { useTypewriter } from '@/hooks/useTypewriter';

/* ── Apply effects ── */
import { applyEffects } from '@/shared/utils/applyEffects';

/* ── Skill icons & labels (consistent with LevelUpSummary) ── */
const SKILL_LABELS: Record<TrainablePlayerSkill, string> = {
  logic: 'Логика',
  coding: 'Кодирование',
  empathy: 'Эмпатия',
  persuasion: 'Убеждение',
  intuition: 'Интуиция',
  writing: 'Письмо',
  rhythm: 'Ритм',
};

const SKILL_ICONS: Record<TrainablePlayerSkill, string> = {
  logic: '🧠',
  coding: '💻',
  empathy: '💛',
  persuasion: '🗣️',
  intuition: '👁️',
  writing: '✍️',
  rhythm: '🎵',
};

/* ── Impact preview ── */
interface ChoiceImpact {
  karma: number;
  energy: number;
  stress: number;
  npcRelation: { npcId: string; value: number } | null;
  skills: { skill: string; value: number }[];
}

function getChoiceImpact(effects: StoryEffect[] | undefined, npcId?: string): ChoiceImpact {
  if (!effects) return { karma: 0, energy: 0, stress: 0, npcRelation: null, skills: [] };
  let karma = 0, energy = 0, stress = 0;
  let npcRelation: ChoiceImpact['npcRelation'] = null;
  const skills: ChoiceImpact['skills'] = [];
  for (const fx of effects) {
    if (fx.type === 'addKarma' && fx.value) karma += fx.value;
    if (fx.type === 'addStat') {
      if (fx.stat === 'energy' && fx.value) energy += fx.value;
      if (fx.stat === 'stress' && fx.value) stress += fx.value;
    }
    if (fx.type === 'addSkill' && fx.skill && fx.value) {
      skills.push({ skill: fx.skill, value: fx.value });
    }
    if (fx.type === 'npcChange' && fx.npcChange?.relation) {
      const targetNpc = fx.npcId || npcId;
      if (targetNpc) npcRelation = { npcId: targetNpc, value: fx.npcChange.relation };
    }
  }
  return { karma, energy, stress, npcRelation, skills };
}

/* ══════════════════════════════════════════════════════════════
   DIALOGUE HISTORY — tracks previous lines for scrolling
   ══════════════════════════════════════════════════════════════ */
interface HistoryLine {
  speaker: string;
  text: string;
  timestamp: number;
}

/* ── Component ── */
export function DialogueRenderer() {
  const { mode, showStoryOverlay, currentNodeId, storyConditionPlayer, karma, npcRelations, timeOfDay } = useDialogueContext();
  const setCurrentNodeId = useSetCurrentNodeId();
  const visitNode = useVisitNode();

  const [skillCheckBanner, setSkillCheckBanner] = useState<{
    skill: TrainablePlayerSkill;
    success: boolean;
  } | null>(null);

  // ── Dialogue history ──
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  // ── Auto-advance mode ──
  const [autoAdvance, setAutoAdvance] = useState(false);
  const autoAdvanceDelay = 2500; // ms

  // ── World Director: dialogue is now an overlay, not a separate mode ──
  // Before: isOpen = mode === 'visual-novel' (requires switching away from exploration)
  // Now: isOpen = showStoryOverlay + has dialogue node (narrative overlay on 3D world)
  const [dialoguePackVersion, setDialoguePackVersion] = useState(0);

  useEffect(() => {
    if (!currentNodeId || !isNarrativeGameDataLoaded()) return;
    let cancelled = false;

    void ensureDialogueNode(currentNodeId)
      .then(() => {
        if (!cancelled) setDialoguePackVersion((v) => v + 1);
      })
      .catch((error) => {
        devWarn('[DialogueRenderer] Failed to load dialogue node:', currentNodeId, error);
      });

    return () => {
      cancelled = true;
    };
  }, [currentNodeId]);

  const dialogueNodes = isNarrativeGameDataLoaded() ? getDialogueNodes() : null;
  const isOpen = showStoryOverlay && !!dialogueNodes?.[currentNodeId];
  const node = useMemo(
    () => (dialogueNodes ? dialogueNodes[currentNodeId] : undefined),
    [dialogueNodes, currentNodeId, dialoguePackVersion],
  );
  const conditionCtx = useMemo(() => {
    const npcDef = node ? findNpcByName(node.speaker) : undefined;
    return buildStoryConditionContext(storyConditionPlayer, {
      npcRelations,
      npcId: npcDef?.id ?? '',
      timeOfDay,
    });
  }, [storyConditionPlayer, npcRelations, timeOfDay, node]);
  const { displayed, done, skip } = useTypewriter(node?.text ?? '', 30);

  // Apply node-level effects on mount
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (node && appliedRef.current !== node.id) {
      appliedRef.current = node.id;

      visitNode(node.id);
      if (node.sceneId) {
        const currentSceneId = getGameStore().exploration.currentSceneId;
        if (currentSceneId !== node.sceneId) {
          requestSceneTransitionForStoryNode(node.id, node.sceneId);
        }
      }

      // Add to history (deferred to avoid sync setState in effect)
      if (node.speaker && node.text) {
        const speaker = node.speaker;
        const text = node.text;
        setTimeout(() => {
          setHistory((prev) => [...prev, { speaker, text, timestamp: Date.now() }]);
        }, 0);
      }

      if (node.speaker) {
        const npcDef = findNpcByName(node.speaker);
        const npcId = npcDef?.id ?? node.speaker.toLowerCase().replace(/\s+/g, '_');
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: node.id });
      }

      if (node.effects) {
        applyEffects(node.effects);
      }
    }
  }, [node, visitNode]);

  const handleClose = useCallback(() => {
    audioEngine.playSfx('ui_close');
    closeNarrativeOverlay();
  }, []);

  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      audioEngine.playSfx('confirm');

      if (choice.effects) {
        applyEffects(choice.effects);
      }

      if (choice.next === null) {
        closeNarrativeOverlay();
      } else {
        setCurrentNodeId(choice.next);
      }
    },
    [setCurrentNodeId],
  );

  // Auto-advance: pick first choice that passes checkStoryCondition (incl. npcId for relation gates).
  useEffect(() => {
    if (!autoAdvance || !done || !node || node.choices.length === 0) return;

    const timer = setTimeout(() => {
      const availableChoice = node.choices.find((c) =>
        checkStoryCondition(c.condition, conditionCtx).pass,
      );
      if (availableChoice) {
        handleChoice(availableChoice);
      }
    }, autoAdvanceDelay);

    return () => clearTimeout(timer);
  }, [autoAdvance, done, node, conditionCtx, handleChoice]);

  if (!isOpen || !node) return null;

  const npcDef = findNpcByName(node.speaker);
  const npcId = npcDef?.id ?? '';
  const portraitColors = npcId ? (NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista) : NPC_PORTRAIT_COLORS.cafe_barista;
  const emotion = detectEmotion(node.text);
  const emotionBorder = EMOTION_BORDER[emotion] || EMOTION_BORDER.calm;
  const relationLevel = npcId ? getRelationLevel(npcId, npcRelations) : 'neutral';

  const RelationIcon = relationLevel === 'ally' ? Shield : relationLevel === 'enemy' ? Skull : Circle;

  // Speaker name colored background style
  const speakerBgStyle: React.CSSProperties = npcId
    ? {
        background: `linear-gradient(90deg, ${portraitColors.bg} 0%, transparent 100%)`,
        borderLeft: `3px solid ${portraitColors.primary}`,
        paddingLeft: '6px',
      }
    : {};

  const speakerTitleId = `dialogue-speaker-${currentNodeId}`;
  const typewriterLiveMessage = node.speaker
    ? `${node.speaker}: ${displayed}${done ? '' : '…'}`
    : `${displayed}${done ? '' : '…'}`;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="fixed inset-x-0 bottom-0 flex justify-center pointer-events-none"
        style={{ zIndex: UI_LAYERS.DIALOGUE }}
        onClick={done ? undefined : skip}
      >
        <AriaLiveRegion message={typewriterLiveMessage} priority="polite" />
        {/* Subtle backdrop — only behind the widget area */}
        <div className="absolute inset-0 bg-black/20" aria-hidden="true" />

        {/* Compact dialogue widget */}
        <FocusTrap>
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-[700px] mx-3 mb-3 pointer-events-auto"
            role="dialog"
            aria-modal="true"
            {...(node.speaker ? { 'aria-labelledby': speakerTitleId } : { 'aria-label': 'Диалог' })}
          >
          <div
            className={`relative border ${emotionBorder} backdrop-blur-md overflow-hidden transition-colors duration-500`}
            style={{
              clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
              background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
              boxShadow: `0 0 20px rgb(var(--cyber-cyan-rgb) / 0.06), 0 4px 16px rgba(0,0,0,0.4), inset 0 0 12px rgba(0,0,0,0.3)`,
            }}
          >
            {/* Terminal header — compact */}
            <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-3 py-1">
              <span className="h-1 w-1 rounded-full bg-emerald-500/80" />
              <span className="h-1 w-1 rounded-full bg-amber-400/80" />
              <span className="h-1 w-1 rounded-full bg-red-500/80" />
              <span className="ml-2 font-mono text-[7px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://dialogue</span>
              <div className="flex-1" />
              {/* Auto-advance toggle */}
              <button
                onClick={() => setAutoAdvance(!autoAdvance)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono transition-colors ${
                  autoAdvance ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
                title="Авто-продолжение"
                aria-label={autoAdvance ? 'Выключить авто-продолжение' : 'Включить авто-продолжение'}
                aria-pressed={autoAdvance}
              >
                <FastForward className="size-2" />
                Авто
              </button>
              {/* History toggle */}
              <button
                onClick={() => setShowHistory(!showHistory)}
                className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-mono transition-colors ${
                  showHistory ? 'bg-amber-900/40 text-amber-300 border border-amber-500/30' : 'text-slate-500 hover:text-slate-300 border border-transparent'
                }`}
                title="История диалога"
                aria-label={showHistory ? 'Скрыть историю диалога' : 'Показать историю диалога'}
                aria-pressed={showHistory}
              >
                <History className="size-2" />
                История
              </button>
              {/* Close button */}
              <button onClick={handleClose} className="text-slate-500 hover:text-white hover:bg-rose-500/20 rounded p-0.5 transition-colors" aria-label="Закрыть">
                <X className="size-3" />
              </button>
            </div>

            {/* Content area — compact padding */}
            <div className="relative z-0 p-3">
              {/* Dialogue history overlay */}
              <AnimatePresence>
                {showHistory && history.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="mb-3 max-h-32 overflow-y-auto rounded border border-slate-700/30 bg-black/40 p-2"
                  >
                    <div className="text-[8px] text-slate-500 font-mono uppercase tracking-wider mb-1.5">История диалога</div>
                    {history.slice(-10).map((line, i) => (
                      <div key={i} className="mb-1 last:mb-0">
                        <span className="text-[9px] font-mono text-cyan-400/60">{line.speaker}: </span>
                        <span className="text-[10px] text-slate-400/80">{line.text.length > 80 ? line.text.slice(0, 80) + '...' : line.text}</span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Speaker portrait + name + relationship — compact layout */}
              <div className="flex items-center gap-2.5 mb-2">
                {npcId ? (
                  <NPCPortrait npcId={npcId} size="default" />
                ) : (
                  <div className="w-9 h-9 rounded-lg border border-slate-600/50 flex items-center justify-center text-sm font-bold text-slate-400 bg-slate-800/50 shrink-0">?</div>
                )}
                <div className="flex-1 min-w-0">
                  {/* ── Compact Speaker Nameplate ── */}
                  <div className="dialogue-nameplate relative">
                    {/* Decorative line before name */}
                    <div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-3 h-px"
                      style={{
                        background: `linear-gradient(90deg, transparent, ${RELATION_GLOW[relationLevel]?.color ?? 'var(--cyber-cyan)'})`,
                        opacity: 0.5,
                      }}
                    />
                    <div className="flex items-center gap-1.5" style={{ paddingLeft: '12px', ...speakerBgStyle }}>
                      {/* Corner bracket left */}
                      <span className="text-[7px] leading-none" style={{ color: `${RELATION_GLOW[relationLevel]?.color ?? 'var(--cyber-cyan)'}66` }}>⟨</span>
                      <span
                        id={speakerTitleId}
                        className="font-medium text-xs tracking-wide uppercase"
                        style={{
                          color: portraitColors.primary,
                          textShadow: RELATION_GLOW[relationLevel]?.shadow,
                        }}
                      >
                        {node.speaker}
                      </span>
                      {/* Corner bracket right */}
                      <span className="text-[7px] leading-none" style={{ color: `${RELATION_GLOW[relationLevel]?.color ?? 'var(--cyber-cyan)'}66` }}>⟩</span>
                      {npcId && (
                        <span className="flex items-center gap-0.5" title={relationLevel === 'ally' ? 'Союзник' : relationLevel === 'enemy' ? 'Враг' : 'Нейтрал'}>
                          <RelationIcon className={`size-2.5 ${
                            relationLevel === 'ally' ? 'text-emerald-400' : relationLevel === 'enemy' ? 'text-red-400' : 'text-slate-400'
                          }`} />
                        </span>
                      )}
                      {/* Emotion indicator — inline, compact */}
                      {emotion !== 'calm' && (
                        <span className={`text-[8px] uppercase tracking-widest ${
                          emotion === 'angry' ? 'text-red-400/70' :
                          emotion === 'sad' ? 'text-blue-400/70' :
                          'text-amber-400/70'
                        }`}>
                          {emotion === 'angry' ? 'гнев' : emotion === 'sad' ? 'грусть' : 'радость'}
                        </span>
                      )}
                    </div>
                    {/* Decorative line after name */}
                    <div
                      className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-px"
                      style={{
                        background: `linear-gradient(-90deg, transparent, ${RELATION_GLOW[relationLevel]?.color ?? 'var(--cyber-cyan)'})`,
                        opacity: 0.5,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Skill check banner */}
              <AnimatePresence>
                {skillCheckBanner && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className={`mb-2 px-2 py-1 rounded text-xs font-medium ${
                      skillCheckBanner.success
                        ? 'bg-emerald-900/40 border border-emerald-500/40 text-emerald-300'
                        : 'bg-rose-900/40 border border-rose-500/40 text-rose-300'
                    }`}
                  >
                    {skillCheckBanner.success
                      ? `✓ Проверка пройдена: ${skillCheckBanner.skill}`
                      : `✗ Проверка не пройдена: ${skillCheckBanner.skill}`}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Dialogue text with typewriter + enhanced cursor */}
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
                      className="dialogue-cursor inline-block w-0.5 h-3.5 ml-0.5 align-middle"
                      style={{
                        background: 'rgb(var(--cyber-cyan-rgb) / 0.8)',
                        boxShadow: '0 0 4px rgb(var(--cyber-cyan-rgb) / 0.6), 0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
                        animation: 'cursor-blink 0.8s step-end infinite',
                      }}
                    />
                  )}
                </motion.p>
              </div>

              {/* Choices — compact */}
              {done && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.2 }}
                  className="flex flex-col gap-1"
                >
                  {node.choices.map((choice, i) => {
                    const cond = checkStoryCondition(choice.condition, conditionCtx);

                    const handleClick = () => {
                      if (!cond.pass) return;

                      if (choice.condition?.minSkillCheck && cond.skillCheckResult) {
                        setSkillCheckBanner({
                          skill: cond.skillCheckResult.skill,
                          success: cond.skillCheckResult.success,
                        });
                        if (!cond.skillCheckResult.success) return;
                        setTimeout(() => setSkillCheckBanner(null), 1500);
                      }

                      handleChoice(choice);
                    };

                    const impact = getChoiceImpact(choice.effects, npcId);
                    const hasImpact = impact.karma !== 0 || impact.energy !== 0 || impact.stress !== 0 || impact.npcRelation !== null || impact.skills.length > 0;

                    // Keyboard shortcut key (1-9)
                    const shortcutKey = i + 1;

                    const choiceAriaLabel = buildChoiceAriaLabel({
                      index: i,
                      text: choice.text,
                      cond,
                    });

                    return (
                      <motion.button
                        key={`${currentNodeId}-dlg-${i}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08, duration: 0.2 }}
                        onClick={handleClick}
                        disabled={!cond.pass}
                        aria-label={choiceAriaLabel}
                        aria-disabled={!cond.pass}
                        className={`
                          dialogue-choice-btn group relative text-left pl-6 pr-3 py-1.5 border transition-all duration-200 text-xs overflow-hidden
                          ${cond.pass
                            ? 'border-cyan-800/50 bg-cyan-950/20 hover:bg-cyan-900/30 hover:border-cyan-600/60 text-slate-100 cursor-pointer'
                            : 'border-slate-700/30 bg-slate-900/10 text-slate-500 cursor-not-allowed opacity-50'
                          }
                        `}
                        style={{ clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))' }}
                      >
                        {/* Left-side accent bar */}
                        <div
                          className="absolute left-0 top-0 bottom-0 w-0.5"
                          style={{
                            background: cond.pass
                              ? 'linear-gradient(180deg, rgb(var(--cyber-cyan-rgb) / 0.6), rgb(var(--cyber-cyan-rgb) / 0.2))'
                              : 'rgba(100,116,139,0.2)',
                          }}
                        />
                        {/* Number badge — compact */}
                        <span
                          className={`absolute left-1 top-1/2 -translate-y-1/2 text-[8px] font-mono font-bold w-3.5 h-3.5 flex items-center justify-center rounded-sm ${
                            cond.pass
                              ? 'bg-cyan-900/40 text-cyan-300 border border-cyan-500/20'
                              : 'bg-slate-800/40 text-slate-500 border border-slate-600/20'
                          }`}
                        >
                          {shortcutKey}
                        </span>
                        {/* Scan-line sweep on hover */}
                        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                          <div
                            className="absolute left-0 right-0 h-2 -top-2 group-hover:top-full"
                            style={{ background: 'linear-gradient(180deg, transparent, rgb(var(--cyber-cyan-rgb) / 0.08), transparent)', transition: 'top 0.8s ease-in-out' }}
                          />
                        </div>
                        {/* Hover border glow */}
                        <div
                          className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          style={{
                            boxShadow: cond.pass ? 'inset 0 0 8px rgb(var(--cyber-cyan-rgb) / 0.06), 0 0 6px rgb(var(--cyber-cyan-rgb) / 0.08)' : 'none',
                          }}
                        />
                        <div className="flex items-center gap-1.5">
                          <ChevronRight className="size-3 text-cyan-500/70 group-hover:text-cyan-300 transition-colors shrink-0" />
                          <span className="flex-1">
                            {choice.text}
                            {/* Karma-gated indicator: subtle when met */}
                            {cond.pass && choice.condition?.minKarma !== undefined && (
                              <span className="ml-1 text-[9px] font-mono text-emerald-400/70" title={`☯ Карма ≥ ${choice.condition.minKarma} (У вас: ${karma})`}>☯</span>
                            )}
                            {cond.pass && choice.condition?.maxKarma !== undefined && (
                              <span className="ml-1 text-[9px] font-mono text-cyan-400/70" title={`☯ Карма ≤ ${choice.condition.maxKarma} (У вас: ${karma})`}>☯</span>
                            )}
                            {/* Skill-gated indicator: subtle when met */}
                            {cond.pass && choice.condition?.minSkill && Object.keys(choice.condition.minSkill).length > 0 && (
                              <span className="ml-1 text-[9px] font-mono text-emerald-400/70" title={Object.entries(choice.condition.minSkill).map(([sk, val]) => `${SKILL_ICONS[sk as TrainablePlayerSkill] ?? ''} ${SKILL_LABELS[sk as TrainablePlayerSkill] ?? sk} ≥ ${val}`).join(', ')}>⚡</span>
                            )}
                            {cond.pass && choice.condition?.minSkillCheck && (
                              <span className="ml-1 text-[9px] font-mono text-emerald-400/70" title={`${SKILL_ICONS[choice.condition.minSkillCheck.skill]} ${SKILL_LABELS[choice.condition.minSkillCheck.skill]} ≥ ${choice.condition.minSkillCheck.difficulty}`}>⚡</span>
                            )}
                          </span>
                          {/* Impact preview badges — compact, show on hover for passable choices */}
                          {cond.pass && hasImpact && (
                            <div className="flex items-center gap-1 shrink-0">
                              {impact.karma !== 0 && (
                                <span className={`text-[8px] font-mono px-1 py-px rounded ${
                                  impact.karma > 0 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20' : 'text-rose-300 bg-rose-950/40 border border-rose-500/20'
                                }`}>
                                  {impact.karma > 0 ? '+' : ''}{impact.karma}☯
                                </span>
                              )}
                              {impact.energy !== 0 && (
                                <span className={`text-[8px] font-mono px-1 py-px rounded ${
                                  impact.energy > 0 ? 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20' : 'text-rose-300 bg-rose-950/40 border border-rose-500/20'
                                }`}>
                                  {impact.energy > 0 ? '+' : ''}{impact.energy}⚡
                                </span>
                              )}
                              {impact.stress !== 0 && (
                                <span className={`text-[8px] font-mono px-1 py-px rounded ${
                                  impact.stress > 0 ? 'text-rose-300 bg-rose-950/40 border border-rose-500/20' : 'text-emerald-300 bg-emerald-950/40 border border-emerald-500/20'
                                }`}>
                                  {impact.stress > 0 ? '+' : ''}{impact.stress}😤
                                </span>
                              )}
                              {impact.skills.map((s, si) => (
                                <span key={si} className="text-[8px] font-mono px-1 py-px rounded bg-violet-950/40 border border-violet-500/20 text-violet-300">
                                  +{s.value} {s.skill}
                                </span>
                              ))}
                              {impact.npcRelation && (
                                <span className={`text-[8px] font-mono px-1 py-px rounded ${
                                  impact.npcRelation.value > 0 ? 'text-amber-300 bg-amber-950/40 border border-amber-500/20' : 'text-rose-300 bg-rose-950/40 border border-rose-500/20'
                                }`}>
                                  {impact.npcRelation.value > 0 ? '+' : ''}{impact.npcRelation.value}👥
                                </span>
                              )}
                            </div>
                          )}
                          {/* ── Locked requirement indicators (compact) ── */}
                          {!cond.pass && (
                            <div className="flex flex-wrap items-center justify-end gap-0.5 shrink-0">
                              {/* Karma requirement not met */}
                              {cond.karmaNeeded && (
                                <span
                                  className="text-[8px] font-mono px-1 py-px rounded bg-rose-950/40 border border-rose-500/30 text-rose-300"
                                  title={`Текущая карма: ${cond.karmaNeeded.current}`}
                                >
                                  ☯ {cond.karmaNeeded.type === 'min' ? `≥${cond.karmaNeeded.needed}` : `≤${cond.karmaNeeded.needed}`} <span className="text-rose-400/60">({cond.karmaNeeded.current})</span>
                                </span>
                              )}
                              {/* Skill requirement not met */}
                              {cond.skillCheckNeeded && (
                                <span
                                  className="text-[8px] font-mono px-1 py-px rounded bg-rose-950/40 border border-rose-500/30 text-rose-300"
                                  title={`${SKILL_LABELS[cond.skillCheckNeeded.skill]}: ${cond.skillCheckNeeded.current}`}
                                >
                                  {SKILL_ICONS[cond.skillCheckNeeded.skill]} {cond.skillCheckNeeded.needed}+ <span className="text-rose-400/60">({cond.skillCheckNeeded.current})</span>
                                </span>
                              )}
                              {/* Skill check (probabilistic) not met */}
                              {cond.skillCheckResult && !cond.skillCheckResult.success && (
                                <span
                                  className="text-[8px] font-mono px-1 py-px rounded bg-rose-950/40 border border-rose-500/30 text-rose-300"
                                  title={`Проверка: ${SKILL_LABELS[cond.skillCheckResult.skill]} ≥ ${cond.skillCheckResult.difficulty}`}
                                >
                                  {SKILL_ICONS[cond.skillCheckResult.skill]} {cond.skillCheckResult.difficulty}+ <span className="text-rose-400/60">✗</span>
                                </span>
                              )}
                              {/* NPC relation requirement not met */}
                              {cond.relationNeeded && (
                                <span
                                  className="text-[8px] font-mono px-1 py-px rounded bg-amber-950/40 border border-amber-500/30 text-amber-300"
                                  title={`Текущие отношения: ${cond.relationNeeded.current}`}
                                >
                                  👥 {cond.relationNeeded.needed}+ <span className="text-amber-400/60">({cond.relationNeeded.current})</span>
                                </span>
                              )}
                              {/* Act requirement not met */}
                              {cond.actNeeded && (
                                <span
                                  className="text-[8px] font-mono px-1 py-px rounded bg-violet-950/40 border border-violet-500/30 text-violet-300"
                                  title={`Текущий акт: ${cond.actNeeded.current}`}
                                >
                                  📜 Акт {cond.actNeeded.needed}
                                </span>
                              )}
                            </div>
                          )}
                          {/* Keyboard shortcut display */}
                          {cond.pass && shortcutKey <= 9 && (
                            <span className="text-[8px] font-mono text-cyan-500/40 group-hover:text-cyan-400/60 transition-colors shrink-0 ml-0.5">
                              [{shortcutKey}]
                            </span>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </motion.div>
              )}
            </div>
            {/* Footer — compact */}
            <div className="px-3 py-0.5 border-t border-cyan-900/15 bg-black/20 flex items-center justify-between">
              <span className="text-[7px] text-slate-600 font-mono">volodka://dialogue</span>
              <div className="flex items-center gap-2">
                {autoAdvance && (
                  <span className="text-[7px] text-cyan-500/60 font-mono flex items-center gap-0.5">
                    <FastForward className="size-1.5" />
                    Авто
                  </span>
                )}
                <span className="text-[7px] text-slate-600 font-mono">{node.id}</span>
              </div>
            </div>
          </div>
          </motion.div>
        </FocusTrap>
      </motion.div>
    </AnimatePresence>
  );
}
