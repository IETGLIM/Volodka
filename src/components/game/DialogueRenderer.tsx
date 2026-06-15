/* ─── Volodka RPG – NPC dialogue overlay (cinematic) ───
   Full-screen AAA beats shared with story nodes and cutscene title cards.
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward, History } from 'lucide-react';
import {
  useDialogueContext,
  useSetCurrentNodeId,
  useVisitNode,
} from '@/store/selectors';
import {
  getDialogueNodes,
  findNpcById,
  findNpcByName,
  resolveNpcIdFromSpeaker,
  createInventoryItem,
  isNarrativeGameDataLoaded,
  ensureDialogueNode,
} from '@/data/gameDataLoader';
import { audioEngine } from '@/engine/AudioEngine';
import { eventBus } from '@/engine/EventBus';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { getGameStore } from '@/store/gameStore';
import type {
  DialogueChoice,
  StoryEffect,
  TrainablePlayerSkill,
  NPCRelation,
} from '@/shared/types/game';
import { checkStoryCondition, buildStoryConditionContext } from '@/shared/storyConditions';
import {
  buildDialogueLiveMessage,
  resolveDialogueText,
} from '@/engine/dialogue/resolveDialoguePresentation';
import { NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';
import {
  CinematicNarrativeChoices,
  CinematicNarrativeFrame,
  resolveCinematicNarrativePresentation,
} from '@/components/game/cinematic';
import { devWarn } from '@/shared/utils/devLog';
import { getVoiceLine } from '@/engine/audio/VoiceLineRegistry';
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';
import { useNarrativeChoiceKeyboard } from '@/hooks/useNarrativeChoiceKeyboard';
import { applyEffects } from '@/shared/utils/applyEffects';
import { recordExplorationStoryStep } from '@/shared/explorationStoryBridge';

/* ── Emotion detection from text ── */
function detectEmotion(text: string): 'calm' | 'angry' | 'sad' | 'happy' {
  if (text.includes('!') && (text.includes('ненави') || text.includes('боюсь') || text.includes('не могу'))) return 'angry';
  if (text.includes('...') && (text.includes('устал') || text.includes('потер') || text.includes('одинок') || text.includes('плачет'))) return 'sad';
  if (text.includes('!') && (text.includes('рад') || text.includes('найдём') || text.includes('обещаю') || text.includes('спасибо'))) return 'happy';
  return 'calm';
}

/* ── Relationship indicator ── */
function getRelationLevel(npcId: string, relations: NPCRelation[]): 'ally' | 'neutral' | 'enemy' {
  const rel = relations.find((r) => r.npcId === npcId);
  if (!rel) return 'neutral';
  if (rel.value >= 65) return 'ally';
  if (rel.value <= 30) return 'enemy';
  return 'neutral';
}

/* ── Relationship indicator ── */
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
  const { mode, showStoryOverlay, currentNodeId, karma, skills, flags, progression, npcRelations, timeOfDay, collectedPoems, ownedItemIdsKey } = useDialogueContext();
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
  const resolvedText = useMemo(
    () => (node ? resolveDialogueText(node, karma) : ''),
    [node, karma],
  );
  const conditionCtx = useMemo(() => {
    const npcDef = node ? findNpcByName(node.speaker) : undefined;
    return buildStoryConditionContext({ karma, skills, flags, progression }, {
      npcRelations,
      npcId: npcDef?.id ?? '',
      timeOfDay,
      ownedItemIdsKey,
    }, collectedPoems);
  }, [karma, skills, flags, progression, npcRelations, timeOfDay, node, collectedPoems, ownedItemIdsKey]);
  const { displayed, done, skip, reducedMotion } = useNarrativeTypewriter(resolvedText, 30);

  // Apply node-level effects on mount
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    if (node && appliedRef.current !== node.id) {
      if (node.condition && !checkStoryCondition(node.condition, conditionCtx).pass) {
        closeNarrativeOverlay();
        return;
      }

      appliedRef.current = node.id;

      visitNode(node.id);
      recordExplorationStoryStep(node.id);
      if (node.sceneId) {
        const currentSceneId = getGameStore().exploration.currentSceneId;
        if (currentSceneId !== node.sceneId) {
          requestSceneTransitionForStoryNode(node.id, node.sceneId);
        }
      }

      // Add to history (deferred to avoid sync setState in effect)
      if (node.text) {
        const speaker = node.speaker;
        const text = resolvedText;
        setTimeout(() => {
          setHistory((prev) => [...prev, { speaker, text, timestamp: Date.now() }]);
        }, 0);
      }

      if (node.speaker) {
        const npcId =
          resolveNpcIdFromSpeaker(node.speaker)
          ?? node.speaker.toLowerCase().replace(/\s+/g, '_');
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: node.id });
      }

      if (node.effects) {
        applyEffects(node.effects);
      }
    }
  }, [node, visitNode, conditionCtx, resolvedText]);

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

  const trySelectChoice = useCallback(
    (index: number) => {
      if (!node || !done) return;
      const choice = node.choices[index];
      if (!choice) return;

      const cond = checkStoryCondition(choice.condition, conditionCtx);
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
    },
    [node, done, conditionCtx, handleChoice],
  );

  useNarrativeChoiceKeyboard({
    active: Boolean(isOpen && node),
    done,
    choiceCount: node?.choices.length ?? 0,
    onSelectChoice: trySelectChoice,
    onSkip: skip,
    onClose: handleClose,
  });

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

  const npcData = useMemo(() => {
    const speaker = node?.speaker;
    const text = resolvedText;
    const npcDef = speaker ? findNpcByName(speaker) : undefined;
    const npcId = npcDef?.id ?? '';
    const portraitColors = npcId
      ? (NPC_PORTRAIT_COLORS[npcId] ?? NPC_PORTRAIT_COLORS.cafe_barista)
      : NPC_PORTRAIT_COLORS.cafe_barista;
    const voiceMeta = node?.id ? getVoiceLine(node.id) : undefined;
    const emotion =
      node?.emotion ??
      (voiceMeta?.emotion && voiceMeta.emotion !== 'whisper' ? voiceMeta.emotion : undefined) ??
      detectEmotion(text);
    const relationLevel = npcId ? getRelationLevel(npcId, npcRelations) : ('neutral' as const);

    return {
      npcId,
      portraitColors,
      emotion,
      relationLevel,
    };
  }, [node?.speaker, resolvedText, node?.emotion, node?.id, npcRelations]);

  if (!isOpen || !node) return null;

  const { npcId, portraitColors, emotion, relationLevel } = npcData;

  const speakerTitleId = `dialogue-speaker-${currentNodeId}`;
  const typewriterLiveMessage = node
    ? buildDialogueLiveMessage(node, displayed, done, true)
    : '';

  const relationHint =
    relationLevel === 'ally' ? ' · союзник' : relationLevel === 'enemy' ? ' · враг' : '';
  const emotionHint =
    emotion === 'angry' ? ' · гнев' : emotion === 'sad' ? ' · грусть' : emotion === 'happy' ? ' · радость' : '';
  const speakerLabel = `${node.speaker ?? 'Голос'}${emotionHint}${relationHint}`;

  const presentation = resolveCinematicNarrativePresentation(
    currentNodeId,
    'dialogue',
    node.speaker,
    portraitColors.primary,
  );

  return (
    <CinematicNarrativeFrame
      nodeKey={`dialogue-${currentNodeId}`}
      presentation={presentation}
      ariaLabel="Диалог"
      speakerTitleId={speakerTitleId}
      speakerLabel={speakerLabel}
      displayedText={displayed}
      done={done}
      reducedMotion={reducedMotion}
      liveMessage={typewriterLiveMessage}
      onSkip={skip}
      onClose={handleClose}
      toolbar={
        <>
          <button
            type="button"
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm border transition-colors ${
              autoAdvance
                ? 'bg-black/55 text-cyan-200 border-cyan-500/30'
                : 'bg-black/40 text-white/60 border-white/10 hover:text-white'
            }`}
            aria-pressed={autoAdvance}
          >
            <FastForward className="size-3" />
            Авто
          </button>
          <button
            type="button"
            onClick={() => setShowHistory(!showHistory)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm border transition-colors ${
              showHistory
                ? 'bg-black/55 text-amber-200 border-amber-500/30'
                : 'bg-black/40 text-white/60 border-white/10 hover:text-white'
            }`}
            aria-pressed={showHistory}
          >
            <History className="size-3" />
            История
          </button>
        </>
      }
      footer={
        <>
          <AnimatePresence>
            {showHistory && history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="w-full max-w-2xl max-h-36 overflow-y-auto rounded-lg border border-white/10 bg-black/45 backdrop-blur-md p-3 mb-2"
              >
                {history.slice(-8).map((line, i) => (
                  <div key={i} className="mb-1.5 last:mb-0 text-sm text-slate-300/85">
                    <span style={{ color: portraitColors.primary }}>{line.speaker}: </span>
                    {line.text}
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {skillCheckBanner && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`mb-2 px-3 py-2 rounded-lg text-sm text-center border ${
                  skillCheckBanner.success
                    ? 'border-emerald-500/40 text-emerald-200 bg-emerald-950/35'
                    : 'border-rose-500/40 text-rose-200 bg-rose-950/35'
                }`}
              >
                {skillCheckBanner.success
                  ? `✓ Проверка пройдена: ${skillCheckBanner.skill}`
                  : `✗ Проверка не пройдена: ${skillCheckBanner.skill}`}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      }
    >
      {done && (
        <CinematicNarrativeChoices
          accentColor={presentation.accentColor}
          choices={node.choices.map((choice, i) => {
            const cond = checkStoryCondition(choice.condition, conditionCtx);
            const impact = getChoiceImpact(choice.effects, npcId);
            return {
              key: `${currentNodeId}-dlg-${i}`,
              text: choice.text,
              pass: cond.pass,
              cond,
              onSelect: () => trySelectChoice(i),
              trailing:
                !cond.pass && cond.karmaNeeded ? (
                  <span className="text-[10px] font-mono text-rose-300">
                    ☯ {cond.karmaNeeded.current}/{cond.karmaNeeded.needed}
                  </span>
                ) : cond.pass && impact.karma !== 0 ? (
                  <span className="text-[10px] font-mono text-emerald-300">
                    {impact.karma > 0 ? '+' : ''}
                    {impact.karma}☯
                  </span>
                ) : undefined,
            };
          })}
        />
      )}
    </CinematicNarrativeFrame>
  );
}
