/* ─── Volodka RPG – NPC dialogue overlay (cinematic) ───
   Full-screen AAA beats shared with story nodes and cutscene title cards.
*/

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { motion, AnimatePresence } from 'framer-motion';
import { FastForward, History } from 'lucide-react';
import {
  useDialogueContext,
  useVisitNode } from '@/store/selectors';
import {
  getDialogueNodes,
  findNpcByName,
  resolveNpcIdFromSpeaker,
  isNarrativeGameDataLoaded,
  ensureDialogueNode,
  prefetchDialogueFrontier,
} from '@/data/gameDataLoader';
import { audioEngine } from '@/engine/AudioEngine';
import { consumePoemSkillCheckFlag } from '@/engine/poemPower/poemSkillCheckModifiers';
import { eventBus } from '@/engine/EventBus';
import { closeNarrativeOverlay } from '@/engine/scene/narrativeOverlay';
import { requestSceneTransitionForStoryNode } from '@/engine/scene/sceneTransition';
import { getGameStore as _getGameStore } from '@/store/gameStore';
import { getLiveCurrentSceneId } from '@/store/stores/explorationStore';
import { getNPCGroup } from '@/engine/interaction/npcRegistry';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type {
  DialogueChoice,
  StoryEffect,
  TrainablePlayerSkill,
  NPCRelation } from '@/shared/types/game';
import { checkStoryCondition, buildStoryConditionContext } from '@/shared/storyConditions';
import {
  buildDialogueLiveMessage,
  resolveDialogueText } from '@/engine/dialogue/resolveDialoguePresentation';
import { NPC_PORTRAIT_COLORS } from './shared/NPCPortrait';
import {
  CinematicNarrativeChoices,
  CinematicNarrativeFrame,
  resolveCinematicNarrativePresentation } from '@/components/game/cinematic';
import { devWarn } from '@/shared/utils/devLog';
import { getVoiceLine } from '@/engine/audio/VoiceLineRegistry';
import { playVoiceLineForNode, stopVoiceLinePlayback } from '@/engine/audio/voiceLinePlayer';
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNarrativeChoiceKeyboard } from '@/hooks/useNarrativeChoiceKeyboard';
import { applyEffects } from '@/shared/utils/applyEffects';
import { recordExplorationStoryStep } from '@/shared/explorationStoryBridge';
import { DialogueRelationBar } from './dialogue/DialogueRelationBar';
import { SkillCheckAnimation } from './SkillCheckAnimation';
import { DialogueHistoryPanel } from './dialogue/DialogueHistoryPanel';
import { useDialogueHistoryStore } from '@/store/stores/dialogueHistoryStore';
import type { DialogueHistoryEntry as _DialogueHistoryEntry } from '@/store/slices/dialogueHistorySlice';
import { executeDialogueChoice } from '@/engine/narrative/narrativeChoiceExecutor';
import {
  performDiceRoll,
  DICE_SKILL_LABELS,
  type DiceRollResult,
} from '@/engine/skillCheck';
import { useThoughtSkillModifiers, useEquippedThoughts } from '@/store/selectors/thoughtCabinetSelectors';
import { useClothingDialogueModifier } from '@/store/selectors/clothingSelectors';
import { resolveThoughtInterjections, type ThoughtInterjection } from '@/engine/narrative/thoughtInterjection';
import {
  recordFailedCheck,
  hasFailedCheckForChoice,
  type CheckType,
} from '@/engine/narrative/whiteRedCheckSystem';

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
   Spatial bark — positional procedural voice for NPCs
   ══════════════════════════════════════════════════════════════ */

/** Pre-allocated temp for NPC world position reads (avoid alloc per bark). */
const _barkNpcPos = new Vector3();

/** Per-speaker debounce: skip barks within 1.5s of the last bark from the
 *  same speaker. Prevents spamming during rapid line transitions (e.g.
 *  typewriter skip + advance). Keyed by npcId (or speaker string fallback). */
const SPATIAL_BARK_DEBOUNCE_MS = 1500;
const _barkLastSpokenAt = new Map<string, number>();

/**
 * Resolve the 3D world position of the current speaker for spatial bark.
 * Falls back to the player's position when the NPC group isn't registered
 * (e.g. mid-scene-transition, cutscene-only speakers); falls back to world
 * origin only when the player position is also unavailable.
 *
 * Returns null only when both lookups fail catastrophically — the caller
 * should treat null as "skip the bark" rather than play at origin.
 */
function getCurrentSpeakerPosition(npcId: string | null): [number, number, number] | null {
  if (npcId) {
    const group = getNPCGroup(npcId);
    if (group) {
      group.getWorldPosition(_barkNpcPos);
      return [_barkNpcPos.x, _barkNpcPos.y, _barkNpcPos.z];
    }
  }
  try {
    const pp = getGameSnapshot().exploration.playerPosition;
    if (pp && Number.isFinite(pp[0]) && Number.isFinite(pp[1]) && Number.isFinite(pp[2])) {
      return [pp[0], pp[1], pp[2]];
    }
  } catch {
    /* snapshot unavailable during early boot */
  }
  return null;
}

/**
 * Emit a spatial bark for the current speaker, with debounce + safe fallback.
 * Caller passes the resolved dialogue text (used by AudioEngine to vary the
 * bark's formant frequency per line). Missing position is non-fatal — the
 * bark is simply skipped (no positional anchor → silent rather than origin).
 */
function playSpatialBarkForSpeaker(
  npcId: string | null,
  speakerLabel: string | null,
  text: string,
): void {
  const debounceKey = npcId ?? speakerLabel ?? '_unknown';
  const now = Date.now();
  const last = _barkLastSpokenAt.get(debounceKey);
  if (last !== undefined && now - last < SPATIAL_BARK_DEBOUNCE_MS) return;
  _barkLastSpokenAt.set(debounceKey, now);

  try {
    const pos = getCurrentSpeakerPosition(npcId);
    if (!pos) return; // No positional anchor — skip rather than play at origin.
    audioEngine.playSpatialBark(text ?? '', pos);
  } catch {
    /* Missing position must never crash dialogue. */
  }
}

/* ══════════════════════════════════════════════════════════════
   Thought Interjection display — inner voice lines
   ══════════════════════════════════════════════════════════════ */
function ThoughtInterjectionLine({ interjection, accentColor }: {
  interjection: ThoughtInterjection;
  accentColor: string;
}) {
  const emotionColorMap: Record<string, string> = {
    calm: 'text-amber-300/90',
    angry: 'text-red-300/90',
    sad: 'text-blue-300/80',
    whisper: 'text-amber-200/70',
    insight: 'text-emerald-300/90',
  };
  const colorClass = emotionColorMap[interjection.emotion ?? 'calm'] ?? 'text-amber-300/90';

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.15 }}
      className={`my-1.5 px-3 py-1.5 rounded-md border border-amber-500/20 bg-amber-950/15 backdrop-blur-sm hud-filmic-interjection ${colorClass} italic text-sm font-light`}
      style={{ boxShadow: `0 0 8px ${accentColor}15` }}
    >
      <span className="font-mono text-xs text-amber-400/70 not-italic mr-1">
        [{interjection.thoughtName}]
      </span>
      {interjection.text}
    </motion.div>
  );
}

/* ── White/Red check badge for choices ── */
function CheckTypeBadge({ checkType, isRetryable }: {
  checkType: CheckType;
  isRetryable: boolean;
}) {
  if (checkType === 'red') {
    return (
      <span className="text-[10px] font-mono text-red-400 border border-red-500/30 rounded px-1 py-0.5">
        ✗ закрыта
      </span>
    );
  }
  if (isRetryable) {
    return (
      <span className="text-[10px] font-mono text-emerald-400 border border-emerald-500/30 rounded px-1 py-0.5">
        ↻ повтор
      </span>
    );
  }
  return null;
}

/* ══════════════════════════════════════════════════════════════
   DIALOGUE HISTORY — tracks previous lines for scrolling
   ══════════════════════════════════════════════════════════════ */

/* ── Component ── */
export function DialogueRenderer() {
  const { mode: _mode, showStoryOverlay, currentNodeId, karma, skills, flags, progression, npcRelations, timeOfDay, collectedPoems, activeTTLFlags, ownedItemIdsKey } = useDialogueContext();
  const visitNode = useVisitNode();
  const thoughtModifiers = useThoughtSkillModifiers();
  const equippedThoughts = useEquippedThoughts();
  const clothingDialogueMod = useClothingDialogueModifier();

  const [skillCheckBanner, setSkillCheckBanner] = useState<{
    skill: TrainablePlayerSkill;
    success: boolean;
  } | null>(null);

  // ── Dice-roll skill check state ──
  const [diceRollState, setDiceRollState] = useState<{
    result: DiceRollResult;
    skill: TrainablePlayerSkill;
    skillLevel: number;
    thoughtBonus: number;
  } | null>(null);
  const pendingDiceChoiceRef = useRef<{ choice: DialogueChoice; index: number } | null>(null);
  const diceRollActiveRef = useRef(false);

  // ── Dialogue history (local for in-session scrollback) ──
  // Note: local history state removed — the persistent dialogue history slice
  // (useDialogueHistoryStore / addDialogueEntry) is the canonical record and
  // powers the showFullHistory overlay. The local copy was written but never read.
  // ── Persistent dialogue history overlay (from slice store) ──
  const dialogueHistoryEntries = useDialogueHistoryStore((s) => s.dialogueHistory);
  const [showFullHistory, setShowFullHistory] = useState(false);
  const addDialogueEntry = useDialogueHistoryStore((s) => s.addDialogueEntry);

  // ── Auto-advance mode ──
  const [autoAdvance, setAutoAdvance] = useState(false);
  const autoAdvanceDelay = 2500; // ms

  // ── World Director: dialogue is now an overlay, not a separate mode ──
  // Before: isOpen = mode === 'visual-novel' (requires switching away from exploration)
  // Now: isOpen = showStoryOverlay + has dialogue node (narrative overlay on 3D world)
  const [dialoguePackVersion, setDialoguePackVersion] = useState(0);
  const [isLoadingNode, setIsLoadingNode] = useState(false);
  const errorRef = useRef<string | null>(null);
  const skillCheckTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  // ── Reset error when dialogue node changes (prevents stale errors) ──
  const prevNodeIdRef = useRef<string | undefined>(undefined);
  useEffect(() => {
    if (currentNodeId !== prevNodeIdRef.current) {
      prevNodeIdRef.current = currentNodeId;
      errorRef.current = null;
    }
  }, [currentNodeId]);

  useEffect(() => {
    if (!currentNodeId || !isNarrativeGameDataLoaded()) return;
    let cancelled = false;
    errorRef.current = null;

    // If the node isn't already cached, show a loading indicator
    const alreadyCached = Boolean(getDialogueNodes()[currentNodeId]);
    if (!alreadyCached) setIsLoadingNode(true);

    void ensureDialogueNode(currentNodeId)
      .then(() => {
        if (!cancelled) {
          setIsLoadingNode(false);
          setDialoguePackVersion((v) => v + 1);
          const loaded = getDialogueNodes()[currentNodeId];
          if (loaded?.choices?.length) {
            prefetchDialogueFrontier([
              currentNodeId,
              ...loaded.choices.map((c) => c.next),
            ]);
          }
        }
      })
      .catch((error) => {
        if (!cancelled) {
          setIsLoadingNode(false);
          errorRef.current = error instanceof Error ? error.message : String(error);
          devWarn('[DialogueRenderer] Failed to load dialogue node:', currentNodeId, error);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [currentNodeId, retryCount]);

  const dialogueNodes = isNarrativeGameDataLoaded() ? getDialogueNodes() : null;
  const isOpen = showStoryOverlay && (!!dialogueNodes?.[currentNodeId] || isLoadingNode || !!errorRef.current);
  const node = useMemo(
    () => (dialogueNodes ? dialogueNodes[currentNodeId] : undefined),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [dialogueNodes, currentNodeId, dialoguePackVersion],
  );
  const resolvedText = useMemo(
    () => {
      if (!node) return '';
      const npcRel = node.speakerId
        ? npcRelations.find((r) => r.npcId === node.speakerId)?.value
        : undefined;
      return resolveDialogueText(node, karma, npcRel);
    },
    [node, karma, npcRelations],
  );
  const conditionCtx = useMemo(() => {
    const npcDef = node ? findNpcByName(node.speaker) : undefined;
    return buildStoryConditionContext({ karma, skills, flags, progression }, {
      npcRelations,
      npcId: npcDef?.id ?? '',
      timeOfDay,
      ownedItemIdsKey,
      activeTTLFlags,
      clothingUnlockTags: clothingDialogueMod.unlockTags,
      clothingLockTags: clothingDialogueMod.lockTags }, collectedPoems);
  }, [karma, skills, flags, progression, npcRelations, timeOfDay, node, collectedPoems, activeTTLFlags, ownedItemIdsKey, clothingDialogueMod]);

  // ── Thought interjections for current node ──
  const thoughtInterjections = useMemo(() => {
    if (!node || equippedThoughts.length === 0) return [] as ThoughtInterjection[];
    return resolveThoughtInterjections(node, equippedThoughts, skills);
  }, [node, equippedThoughts, skills]);
  const isMobile = useIsMobile();
  // Typewriter: faster on mobile (impatience accommodation)
  const { displayed, done, skip, reducedMotion } = useNarrativeTypewriter(resolvedText, isMobile ? 22 : 30);

  // Reset dice roll state when dialogue node changes
  useEffect(() => {
    setDiceRollState(null);
    pendingDiceChoiceRef.current = null;
    diceRollActiveRef.current = false;
    setSkillCheckBanner(null);
  }, [currentNodeId]);

  // Auto-focus first choice button when typewriter completes and choices appear
  const firstChoiceRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (done && node && node.choices.length > 0 && !diceRollActiveRef.current) {
      // Small delay to allow motion animation to mount the button
      const id = setTimeout(() => {
        firstChoiceRef.current?.focus();
      }, 100);
      return () => clearTimeout(id);
    }
  }, [done, node]);

  // Apply node-level effects on mount
  const appliedRef = useRef<string | null>(null);
  useEffect(() => {
    const pendingTimers: ReturnType<typeof setTimeout>[] = [];
    if (node && appliedRef.current !== node.id) {
      if (node.condition && !checkStoryCondition(node.condition, conditionCtx).pass) {
        closeNarrativeOverlay();
        return;
      }

      appliedRef.current = node.id;

      visitNode(node.id);
      recordExplorationStoryStep(node.id);
      if (node.sceneId) {
        const currentSceneId = getLiveCurrentSceneId();
        if (currentSceneId !== node.sceneId) {
          requestSceneTransitionForStoryNode(node.id, node.sceneId);
        }
      }

      // Add to history (deferred to avoid sync setState in effect)
      if (node.text) {
        const speaker = node.speaker;
        const text = resolvedText;
        const sceneId = getLiveCurrentSceneId();
        const historyTimer = setTimeout(() => {
          // Persist to the global dialogue history slice (canonical record).
          const isPlayerChoice = false;
          addDialogueEntry({ speaker: speaker ?? '', text, timestamp: Date.now(), sceneId, isPlayerChoice });
        }, 0);
        pendingTimers.push(historyTimer);
      }

      if (node.speaker) {
        const npcId =
          resolveNpcIdFromSpeaker(node.speaker, node.speakerId)
          ?? node.speaker.toLowerCase().replace(/\s+/g, '_');
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: node.id });
      }

      if (node.effects) {
        applyEffects(node.effects);
      }
    }
    return () => {
      for (const t of pendingTimers) clearTimeout(t);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [node, visitNode, conditionCtx, resolvedText]);

  useEffect(() => {
    if (!isOpen || !node?.id) {
      stopVoiceLinePlayback();
      return;
    }
    playVoiceLineForNode(node.id);
    // Spatial bark — gives NPCs a positional procedural voice. Replaces the
    // silent 404 fallback (public/audio/vo/*.ogg doesn't exist) with a
    // formant-filtered tone anchored at the NPC's world position. PannerNode
    // in AudioEngine handles distance + cone attenuation; AudioListener (wired
    // in applyCameraFrame) tracks the camera so the bark pans as the player
    // turns. Debounced per-speaker (1.5s) inside playSpatialBarkForSpeaker.
    // playVoiceLineForNode above is kept as a fallback for when real VO ships.
    const speakerNpcId = node.speakerId
      ?? (node.speaker
        ? (resolveNpcIdFromSpeaker(node.speaker, node.speakerId)
          ?? node.speaker.toLowerCase().replace(/\s+/g, '_'))
        : null);
    playSpatialBarkForSpeaker(speakerNpcId, node.speaker ?? null, resolvedText);
    return () => stopVoiceLinePlayback();
  }, [isOpen, node?.id, node?.speaker, node?.speakerId, resolvedText]);

  // Cleanup skill-check banner timer on unmount
  useEffect(() => () => {
    if (skillCheckTimerRef.current !== null) clearTimeout(skillCheckTimerRef.current);
  }, []);

  const handleClose = useCallback(() => {
    audioEngine.playSfx('ui_close');
    closeNarrativeOverlay();
  }, []);

  const handleRetry = useCallback(() => {
    errorRef.current = null;
    setRetryCount((c) => c + 1);
  }, []);

  // Called after DiceRollDisplay animation finishes
  const handleDiceRollComplete = useCallback(() => {
    if (!diceRollState || !pendingDiceChoiceRef.current) return;
    const pending = pendingDiceChoiceRef.current;
    const result = diceRollState.result;
    pendingDiceChoiceRef.current = null;
    diceRollActiveRef.current = false;

    if (result.success) {
      setDiceRollState(null);
      executeDialogueChoice(pending.choice);
    } else {
      // Record the failed check for retry tracking
      const checkType: CheckType = pending.choice.condition?.checkType ?? 'white';
      const skill = diceRollState.skill;
      const dc = result.dc;
      recordFailedCheck(
        currentNodeId ?? '',
        pending.index,
        skill,
        dc,
        result.total + result.modifier,
        false,
        checkType,
      );

      // Keep the result visible briefly, then clear
      if (skillCheckTimerRef.current !== null) clearTimeout(skillCheckTimerRef.current);
      skillCheckTimerRef.current = setTimeout(() => {
        setDiceRollState(null);
      }, 1200);
    }
  }, [diceRollState, currentNodeId]);

  const handleChoice = useCallback(
    (choice: DialogueChoice) => {
      // Use the shared executor — handles explore-hub routing, Act1 diegetic
      // presentation, scene transitions, and atomic overlay open/close.
      executeDialogueChoice(choice);
    },
    [],
  );

  const trySelectChoice = useCallback(
    (index: number) => {
      if (!node || !done || diceRollActiveRef.current) return;
      const choice = node.choices[index];
      if (!choice) return;

      const cond = checkStoryCondition(choice.condition, conditionCtx);
      if (!cond.pass) return;

      // ── Skill check: dice roll (Disco Elysium style) ──
      if (choice.condition?.minSkillCheck && cond.skillCheckResult) {
        const { skill, difficulty } = choice.condition.minSkillCheck;

        // If a poem flag auto-passes, use existing flat-check behavior
        if (cond.skillCheckResult.autoPass) {
          setSkillCheckBanner({ skill, success: true });
          if (cond.consumedFlag) {
            consumePoemSkillCheckFlag(cond.consumedFlag, { critical: cond.skillCheckResult.critical });
          }
          if (skillCheckTimerRef.current !== null) clearTimeout(skillCheckTimerRef.current);
          skillCheckTimerRef.current = setTimeout(() => setSkillCheckBanner(null), 1500);
          handleChoice(choice);
          return;
        }

        // Perform the dice roll
        // Clothing modifiers: DC adjustment and skill bonuses from outfit
        const clothingDcAdjust = clothingDialogueMod.dcAdjustment;
        const clothingSkillBonus = clothingDialogueMod.skillBonus[skill] ?? 0;
        const result = performDiceRoll({
          skill,
          skillLevel: skills[skill] ?? 0,
          dc: difficulty - clothingDcAdjust + ((_getGameStore() as any).difficulty?.skillCheckThreshold || 0),
          thoughtModifiers,
          situationalModifier: clothingSkillBonus,
        });

        diceRollActiveRef.current = true;
        pendingDiceChoiceRef.current = { choice, index };
        setDiceRollState({
          result,
          skill,
          skillLevel: skills[skill] ?? 0,
          thoughtBonus: thoughtModifiers[skill] ?? 0,
        });
        return;
      }

      if (cond.consumedFlag) {
        consumePoemSkillCheckFlag(cond.consumedFlag, { critical: cond.skillCheckResult?.critical });
      }

      // Log player choice to persistent dialogue history
      addDialogueEntry({
        speaker: 'Володька',
        text: choice.text,
        timestamp: Date.now(),
        sceneId: getLiveCurrentSceneId(),
        isPlayerChoice: true,
      });

      handleChoice(choice);
    },
    [node, done, conditionCtx, handleChoice, skills, thoughtModifiers, clothingDialogueMod, addDialogueEntry],
  );

  useNarrativeChoiceKeyboard({
    active: Boolean(isOpen && node),
    done,
    choiceCount: node?.choices.length ?? 0,
    onSelectChoice: trySelectChoice,
    onSkip: skip,
    onClose: handleClose });

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
      relationLevel };
  }, [node?.speaker, resolvedText, node?.emotion, node?.id, npcRelations]);

  // Resolve numeric relation value for the dialogue relation bar (must be before early return — hooks rule)
  const currentRelationValue = useMemo(() => {
    const rel = npcRelations.find((r) => r.npcId === npcData.npcId);
    return rel?.value ?? 50;
  }, [npcData.npcId, npcRelations]);

  if (!isOpen) return null;

  // Loading state: dialogue-shaped skeleton (portrait + text bars + choice stubs)
  if (isLoadingNode && !node) {
    return (
      <div
        className="fixed inset-0 flex items-end sm:items-center justify-center bg-black/55 backdrop-blur-[2px] p-3 sm:p-6"
        style={{ zIndex: UI_LAYERS.DIALOGUE }}
        role="status"
        aria-live="polite"
        aria-busy="true"
        aria-label="Загрузка диалога"
        {...(isMobile ? { 'data-mobile-dialogue': 'true' as const } : {})}
      >
        <div className="w-full max-w-2xl rounded-xl border border-stone-700/40 bg-black/80 shadow-[0_8px_32px_rgba(0,0,0,0.45)] overflow-hidden glass-panel">
          <div className="flex gap-3 p-4 border-b border-stone-800/40">
            <div className="size-14 shrink-0 rounded-lg bg-slate-800/80 border border-slate-700/50 animate-pulse" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-3 w-28 rounded bg-stone-800/50 animate-pulse" />
              <div className="h-2.5 w-full rounded bg-slate-800/70 animate-pulse" />
              <div className="h-2.5 w-5/6 rounded bg-slate-800/50 animate-pulse" />
            </div>
          </div>
          <div className="px-4 py-3 space-y-2">
            <div className="h-2.5 w-full rounded bg-slate-800/60 animate-pulse" />
            <div className="h-2.5 w-11/12 rounded bg-slate-800/45 animate-pulse" />
            <div className="h-2.5 w-4/5 rounded bg-slate-800/35 animate-pulse" />
          </div>
          <div className="px-4 pb-4 pt-1 flex flex-col gap-2">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="h-9 rounded border border-stone-800/30 bg-stone-950/30 animate-pulse"
                style={{ animationDelay: `${i * 120}ms` }}
              />
            ))}
          </div>
          <p className="px-4 pb-3 text-[10px] text-slate-500 font-mono tracking-wide">
            Синхронизация узла диалога…
          </p>
        </div>
      </div>
    );
  }
  // Error state: dialogue node fetch failed
  if (errorRef.current && !node) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm" style={{ zIndex: UI_LAYERS.DIALOGUE }}
        {...(isMobile ? { 'data-mobile-dialogue': 'true' as const } : {})}
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-red-400 text-lg font-mono">Не удалось загрузить диалог</p>
          <button
            type="button"
            onClick={handleRetry}
            className="px-4 py-2 rounded border border-stone-500/40 text-stone-200 text-sm font-mono bg-black/40 hover:bg-stone-900/50 hover:border-stone-400/50 transition-colors cyber-hover-lift"
          >
            Повторить
          </button>
        </div>
      </div>
    );
  }
  if (!node) return null;

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
    <>
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
      mobileDialogue={isMobile}
      toolbar={
        <>
          <button
            type="button"
            onClick={() => setAutoAdvance(!autoAdvance)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm border transition-colors cyber-hover-lift ${
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
            onClick={() => setShowFullHistory(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs backdrop-blur-sm border transition-colors cyber-hover-lift bg-black/40 text-white/60 border-white/10 hover:text-white"
          >
            <History className="size-3" />
            История
          </button>
        </>
      }
      footer={
        <>
          {/* Relationship indicator bar — shown for NPC dialogues */}
          {npcId && (
            <DialogueRelationBar
              npcId={npcId}
              relationValue={currentRelationValue}
              reducedMotion={reducedMotion}
              accentColor={portraitColors.primary}
            />
          )}
          <AnimatePresence>
            {diceRollState && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mb-2"
              >
                <SkillCheckAnimation
                  result={diceRollState.result}
                  skill={diceRollState.skill}
                  skillLevel={diceRollState.skillLevel}
                  thoughtBonus={diceRollState.thoughtBonus}
                  successDegree={diceRollState.result.degree}
                  onComplete={handleDiceRollComplete}
                  autoDismissMs={2000}
                />
              </motion.div>
            )}
          </AnimatePresence>
          {/* Thought interjections — inner voice lines */}
          {thoughtInterjections.length > 0 && (
            <div className="mb-2 w-full max-w-2xl">
              {thoughtInterjections
                .filter((ti) => ti.timing === 'after_npc' || ti.timing === 'on_skill_check')
                .map((ti) => (
                  <ThoughtInterjectionLine
                    key={`${ti.thoughtId}-${ti.timing}`}
                    interjection={ti}
                    accentColor={portraitColors.primary}
                  />
                ))}
            </div>
          )}
          <AnimatePresence>
            {skillCheckBanner && !diceRollState && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className={`mb-2 px-3 py-2 rounded-lg text-sm text-center border dialogue-skill-check ${
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
      {done && !diceRollActiveRef.current && (
        <CinematicNarrativeChoices
          accentColor={presentation.accentColor}
          firstChoiceRef={firstChoiceRef}
          choices={node.choices.map((choice, i) => {
            const cond = checkStoryCondition(choice.condition, conditionCtx);
            const impact = getChoiceImpact(choice.effects, npcId);
            // Thought-gated choices: only visible if required thought is equipped
            const thoughtRequired = choice.condition?.thoughtRequired;
            const thoughtGatedPass = thoughtRequired
              ? equippedThoughts.some((t) => t.id === thoughtRequired)
              : true;
            // minSkillCheck choices are always clickable (dice determines outcome)
            const isDiceCheck = Boolean(
              choice.condition?.minSkillCheck &&
              cond.skillCheckResult &&
              !cond.skillCheckResult.autoPass,
            );
            const effectivePass = isDiceCheck ? thoughtGatedPass : (cond.pass && thoughtGatedPass);
            // White/red check type
            const checkType: CheckType = choice.condition?.checkType ?? 'white';
            const isRedCheck = checkType === 'red';
            const hasFailedBefore = currentNodeId
              ? hasFailedCheckForChoice(currentNodeId, i)
              : false;
            return {
              key: `${currentNodeId}-dlg-${i}`,
              text: choice.text,
              pass: effectivePass,
              cond,
              onSelect: () => trySelectChoice(i),
              consequences: cond.pass ? { karma: impact.karma, energy: impact.energy, stress: impact.stress } : undefined,
              wasPreviousChoice: currentNodeId
                ? dialogueHistoryEntries.some(
                    (e) => e.sceneId === getLiveCurrentSceneId() && e.isPlayerChoice && e.text === choice.text,
                  )
                : false,
              skillDifficulty: choice.condition?.minSkillCheck?.difficulty,
              trailing:
                isDiceCheck && cond.skillCheckResult ? (
                  <span className="flex items-center gap-1 text-xs shrink-0">
                    <span>🎲</span>
                    <span className={isRedCheck ? 'text-red-300 neon-text-rose' : 'text-cyan-300 text-neon-cyan'}>
                      {DICE_SKILL_LABELS[cond.skillCheckResult.skill]} {cond.skillCheckResult.difficulty}
                    </span>
                    {hasFailedBefore && (
                      <CheckTypeBadge checkType={checkType} isRetryable={checkType === 'white'} />
                    )}
                  </span>
                ) : !cond.pass && cond.karmaNeeded ? (
                  <span className="text-[10px] font-mono text-rose-300">
                    ☯ {cond.karmaNeeded.current}/{cond.karmaNeeded.needed}
                  </span>
                ) : undefined };
          })}
        />
      )}
    </CinematicNarrativeFrame>
    {/* Full dialogue history overlay */}
    <DialogueHistoryPanel
      open={showFullHistory}
      onClose={() => setShowFullHistory(false)}
      entries={dialogueHistoryEntries}
    />
    </>);
}
