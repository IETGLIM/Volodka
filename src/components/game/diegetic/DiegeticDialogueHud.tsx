/* ─── Diegetic dialogue HUD — compact bottom panel, world stays visible ─── */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History } from 'lucide-react';
import {
  useDialogueContext,
  useDiegeticNarrativeState,
  useStoryContext,
} from '@/store/selectors';
import { useDialogueHistoryStore } from '@/store/stores/dialogueHistoryStore';
import {
  getDialogueNodes,
  getStoryNodes,
  ensureDialogueNode,
  ensureStoryNode,
  isNarrativeGameDataLoaded,
  findNpcByName,
  resolveNpcIdFromSpeaker,
} from '@/data/gameDataLoader';
import { closeDiegeticNarrative } from '@/engine/scene/narrativeOverlay';
import {
  executeDialogueChoice,
  executeStoryChoice,
  applyDialogueNodeMountEffects,
  applyStoryNodeMountEffects,
} from '@/engine/narrative/narrativeChoiceExecutor';
import { checkStoryCondition, buildStoryConditionContext } from '@/shared/storyConditions';
import { consumePoemSkillCheckFlag } from '@/engine/poemPower/poemSkillCheckModifiers';
import { useNarrativeTypewriter } from '@/hooks/useNarrativeTypewriter';
import { useNarrativeChoiceKeyboard } from '@/hooks/useNarrativeChoiceKeyboard';
import { NarrativeChoiceList } from './NarrativeChoiceList';
import { DialogueRelationBar } from '../dialogue/DialogueRelationBar';
import { DialogueHistoryPanel } from '../dialogue/DialogueHistoryPanel';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { diegeticDialogueBottomPadCss, EXPLORATION_HUD_LAYOUT } from '@/shared/constants/hudLayout';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { useSuppressExplorationBottomHud } from '@/hooks/useExplorationBottomHud';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';
import {
  resolveDialogueText,
  buildDialogueLiveMessage,
} from '@/engine/dialogue/resolveDialoguePresentation';
import {
  resolveNarrativeText,
  buildNarrativeLiveMessage,
} from '@/shared/narrativePresentation';
import {
  formatNarrativeControlHint,
} from '@/engine/exploration/explorationUxPresentation';
import { playVoiceLineForNode, stopVoiceLinePlayback } from '@/engine/audio/voiceLinePlayer';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { STORY_NODE_TO_NPC_ID } from '@/data/goldenPath';
import { recordExplorationStoryStep } from '@/shared/explorationStoryBridge';
import { devWarn } from '@/shared/utils/devLog';
import { NPCPortrait, NPC_PORTRAIT_COLORS } from '@/components/game/shared/NPCPortrait';
import type { SceneId } from '@/shared/types/game';

const ACCENT = 'rgba(196, 181, 160, 0.9)';

export function DiegeticDialogueHud() {
  const isTouchDevice = useTouchDevice();
  const suppressBottomHud = useSuppressExplorationBottomHud();
  const diegetic = useDiegeticNarrativeState();
  const storyCtx = useStoryContext();
  const dialogueCtx = useDialogueContext();

  const isOpen = diegetic != null;
  const nodeId = diegetic?.nodeId ?? '';
  const kind = diegetic?.kind ?? 'story';

  const [packVersion, setPackVersion] = useState(0);
  const appliedRef = useRef<string | null>(null);
  const [skillCheckBanner, setSkillCheckBanner] = useState<{
    skill: string;
    success: boolean;
  } | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const dialogueHistoryEntries = useDialogueHistoryStore((s) => s.dialogueHistory);

  useEffect(() => {
    if (!nodeId || !isNarrativeGameDataLoaded()) return;
    let cancelled = false;
    const loader = kind === 'dialogue' ? ensureDialogueNode(nodeId) : ensureStoryNode(nodeId);
    void loader
      .then(() => {
        if (!cancelled) setPackVersion((v) => v + 1);
      })
      .catch((error) => {
        devWarn('[DiegeticDialogueHud] Failed to load node:', nodeId, error);
      });
    return () => {
      cancelled = true;
    };
  }, [nodeId, kind]);

  const storyNode = useMemo(() => {
    if (!isNarrativeGameDataLoaded() || kind !== 'story') return undefined;
    return getStoryNodes()[nodeId];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, kind, packVersion]);

  const dialogueNode = useMemo(() => {
    if (!isNarrativeGameDataLoaded() || kind !== 'dialogue') return undefined;
    return getDialogueNodes()[nodeId];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nodeId, kind, packVersion]);

  const karma = kind === 'dialogue' ? dialogueCtx.karma : storyCtx.karma;
  const skills = kind === 'dialogue' ? dialogueCtx.skills : storyCtx.skills;
  const flags = kind === 'dialogue' ? dialogueCtx.flags : storyCtx.flags;
  const progression = kind === 'dialogue' ? dialogueCtx.progression : storyCtx.progression;
  const collectedPoems = kind === 'dialogue' ? dialogueCtx.collectedPoems : storyCtx.collectedPoems;
  const activeTTLFlags = kind === 'dialogue' ? dialogueCtx.activeTTLFlags : storyCtx.activeTTLFlags;

  const conditionCtx = useMemo(() => {
    const npcDef = dialogueNode ? findNpcByName(dialogueNode.speaker) : undefined;
    return buildStoryConditionContext(
      { karma, skills, flags, progression },
      kind === 'dialogue'
        ? {
            npcRelations: dialogueCtx.npcRelations,
            npcId: npcDef?.id ?? '',
            timeOfDay: dialogueCtx.timeOfDay,
            ownedItemIdsKey: dialogueCtx.ownedItemIdsKey,
            activeTTLFlags,
          }
        : { activeTTLFlags },
      collectedPoems,
    );
  }, [
    karma,
    skills,
    flags,
    progression,
    collectedPoems,
    activeTTLFlags,
    dialogueNode,
    kind,
    dialogueCtx.npcRelations,
    dialogueCtx.timeOfDay,
    dialogueCtx.ownedItemIdsKey,
  ]);

  const resolvedText = useMemo(() => {
    if (kind === 'dialogue' && dialogueNode) {
      const npcRel = dialogueNode.speakerId
        ? dialogueCtx.npcRelations.find((r) => r.npcId === dialogueNode.speakerId)?.value
        : undefined;
      return resolveDialogueText(dialogueNode, karma, npcRel);
    }
    if (kind === 'story' && storyNode) {
      return resolveNarrativeText(storyNode, karma);
    }
    return '';
  }, [kind, dialogueNode, storyNode, karma, dialogueCtx.npcRelations]);

  const choices = useMemo(() => {
    if (kind === 'dialogue') return dialogueNode?.choices ?? [];
    return storyNode?.choices ?? [];
  }, [kind, dialogueNode, storyNode]);
  const speaker =
    kind === 'dialogue'
      ? dialogueNode?.speaker ?? 'Голос'
      : storyNode?.speaker && storyNode.speaker !== 'narrator'
        ? storyNode.speaker
        : 'Голос';

  const { displayed, done, skip, reducedMotion } = useNarrativeTypewriter(resolvedText, isOpen ? 28 : 0);

  useEffect(() => {
    if (!isOpen || !nodeId) {
      stopVoiceLinePlayback();
      return;
    }
    if (kind === 'dialogue') {
      playVoiceLineForNode(nodeId);
    }
    return () => stopVoiceLinePlayback();
  }, [isOpen, nodeId, kind]);

  useEffect(() => {
    if (!isOpen) {
      appliedRef.current = null;
      return;
    }
    if (kind === 'story' && storyNode && appliedRef.current !== storyNode.id) {
      if (storyNode.condition && !checkStoryCondition(storyNode.condition, conditionCtx).pass) {
        closeDiegeticNarrative();
        return;
      }
      appliedRef.current = storyNode.id;
      applyStoryNodeMountEffects(storyNode);
      if (storyNode.soundEffect) audioEngine.playSfx(storyNode.soundEffect);
      if (storyNode.musicCue) audioEngine.playStinger(storyNode.musicCue);
      const mappedNpcId = STORY_NODE_TO_NPC_ID[storyNode.id];
      if (mappedNpcId) {
        eventBus.emit('npc:talked', { npcId: mappedNpcId, dialogueNodeId: storyNode.id });
      }
    }
    if (kind === 'dialogue' && dialogueNode && appliedRef.current !== dialogueNode.id) {
      if (dialogueNode.condition && !checkStoryCondition(dialogueNode.condition, conditionCtx).pass) {
        closeDiegeticNarrative();
        return;
      }
      appliedRef.current = dialogueNode.id;
      applyDialogueNodeMountEffects(dialogueNode);
      recordExplorationStoryStep(dialogueNode.id);
      if (dialogueNode.speaker) {
        const npcId =
          resolveNpcIdFromSpeaker(dialogueNode.speaker, dialogueNode.speakerId)
          ?? dialogueNode.speaker.toLowerCase().replace(/\s+/g, '_');
        eventBus.emit('npc:talked', { npcId, dialogueNodeId: dialogueNode.id });
      }
    }
  }, [isOpen, kind, storyNode, dialogueNode, conditionCtx, resolvedText]);

  const handleClose = useCallback(() => {
    audioEngine.playSfx('ui_close');
    closeDiegeticNarrative();
  }, []);

  const handleStoryChoice = useCallback(
    (index: number) => {
      if (!storyNode || !done) return;
      const choice = storyNode.choices[index];
      if (!choice) return;
      const cond = checkStoryCondition(choice.condition, conditionCtx);
      if (!cond.pass) return;
      executeStoryChoice(choice, {
        currentNodeId: nodeId,
        nodeSceneId: storyNode.sceneId as SceneId | undefined,
      });
    },
    [storyNode, done, conditionCtx, nodeId],
  );

  const handleDialogueChoice = useCallback(
    (index: number) => {
      if (!dialogueNode || !done) return;
      const choice = dialogueNode.choices[index];
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
      if (cond.consumedFlag) {
        consumePoemSkillCheckFlag(cond.consumedFlag, { critical: cond.skillCheckResult?.critical });
      }
      executeDialogueChoice(choice);
    },
    [dialogueNode, done, conditionCtx],
  );

  const trySelectChoice = kind === 'dialogue' ? handleDialogueChoice : handleStoryChoice;

  useNarrativeChoiceKeyboard({
    active: isOpen && Boolean(storyNode || dialogueNode),
    done,
    choiceCount: choices.length,
    onSelectChoice: trySelectChoice,
    onSkip: skip,
    onClose: handleClose,
  });

  const choiceItems = useMemo(() => {
    return choices.map((choice, i) => {
      const cond = checkStoryCondition(choice.condition, conditionCtx);
      return {
        key: `${nodeId}-choice-${i}`,
        text: choice.text || '…',
        pass: cond.pass,
        cond,
        onSelect: () => trySelectChoice(i),
      };
    });
  }, [choices, conditionCtx, nodeId, trySelectChoice]);

  const liveMessage =
    kind === 'dialogue' && dialogueNode
      ? buildDialogueLiveMessage(dialogueNode, displayed, done, true)
      : storyNode
        ? buildNarrativeLiveMessage(storyNode, displayed, done)
        : '';

  const npcDef = dialogueNode ? findNpcByName(dialogueNode.speaker) : undefined;
  const npcId = npcDef?.id ?? '';
  const accentColor = npcId
    ? (NPC_PORTRAIT_COLORS[npcId]?.primary ?? ACCENT)
    : ACCENT;
  // Relation with the current speaker (dialogue kind only). Shown as a color-coded
  // bar in the dialogue header — Disco Elysium-style relationship feedback.
  const speakerRelationValue = kind === 'dialogue' && dialogueNode?.speakerId
    ? dialogueCtx.npcRelations.find((r) => r.npcId === dialogueNode.speakerId)?.value
    : undefined;

  const hasContinueOnly = done && choices.length === 0;

  const handleTextAdvance = useCallback(() => {
    if (!done) {
      skip();
      return;
    }
    if (hasContinueOnly) {
      handleClose();
    }
  }, [done, skip, hasContinueOnly, handleClose]);

  if (!isOpen || (!storyNode && !dialogueNode)) return null;

  const controlHint = formatNarrativeControlHint({
    done,
    choiceCount: choices.length,
  });

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={nodeId || 'diegetic-dialogue-hud'}
        id="diegetic-dialogue-hud"
        data-testid="diegetic-dialogue-hud"
        role="dialog"
        aria-modal="true"
        aria-label={speaker}
        initial={reducedMotion ? false : { opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 16 }}
        transition={{ duration: reducedMotion ? 0 : 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="fixed left-0 right-0 bottom-0 pointer-events-auto px-3 sm:px-6"
        style={{
          zIndex: UI_LAYERS.DIALOGUE,
          paddingBottom: diegeticDialogueBottomPadCss(isTouchDevice, !suppressBottomHud),
          maxHeight: '100dvh',
        }}
      >
        <FocusTrap>
        <div
          className="mx-auto max-w-3xl hud-filmic-dialogue-plate hud-filmic-dialogue-breath hud-filmic-depth-shimmer overflow-hidden flex flex-col"
          style={{ maxHeight: 'calc(100dvh - 32px - env(safe-area-inset-bottom, 0px))' }}
        >
          <div className="px-4 pt-3 pb-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {npcId && (
                <NPCPortrait npcId={npcId} size="mini" className="!w-8 !h-8 !rounded-sm" />
              )}
              <p
                className="hud-filmic-kicker hud-filmic-npc-name-plate truncate"
                style={{ color: accentColor, letterSpacing: '0.18em' }}
                id={`diegetic-speaker-${nodeId}`}
              >
                {speaker}
              </p>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowHistory(true)}
                className="hud-filmic-kicker hud-filmic-icon-btn px-2 py-1 rounded-sm transition-colors flex items-center gap-1"
                aria-label="История диалога"
                title="История диалога"
              >
                <History className="size-3" aria-hidden="true" />
                <span className="hidden sm:inline">История</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="hud-filmic-kicker hud-filmic-icon-btn px-2 py-1 shrink-0"
                aria-label="Закрыть"
              >
                Esc
              </button>
            </div>
          </div>

          {npcId && speakerRelationValue !== undefined ? (
            <div className="px-4">
              <DialogueRelationBar
                npcId={npcId}
                relationValue={speakerRelationValue}
                reducedMotion={reducedMotion}
                accentColor={accentColor}
              />
            </div>
          ) : null}

          {skillCheckBanner && (
            <p
              className="px-4 text-xs font-mono"
              style={{ color: skillCheckBanner.success ? 'rgba(167,243,208,0.85)' : 'var(--hud-filmic-warn)' }}
            >
              {skillCheckBanner.success ? '✓' : '✗'} {skillCheckBanner.skill}
            </p>
          )}

          <button
            type="button"
            onClick={handleTextAdvance}
            className="w-full text-left px-4 pb-2 font-serif text-sm sm:text-base leading-relaxed hover:bg-white/[0.03] transition-colors overflow-y-auto hud-filmic-dialogue-reveal"
            style={{
              maxHeight: `min(${EXPLORATION_HUD_LAYOUT.DIEGETIC_DIALOGUE_TEXT_MAX_HEIGHT}px, 35dvh)`,
              color: 'var(--hud-filmic-ink)',
              textShadow: 'var(--hud-filmic-shadow)',
            }}
            aria-label={controlHint}
          >
            {displayed}
            {!done && !reducedMotion ? <span className="animate-pulse opacity-50">▌</span> : null}
          </button>

          {!hasContinueOnly ? (
            <p className="px-4 pb-2 hud-filmic-kicker" style={{ letterSpacing: '0.14em' }}>
              {controlHint}
            </p>
          ) : null}

          {done && (
            <div className="px-3 pb-3 flex min-h-0 flex-col gap-1 overflow-y-auto" style={{ maxHeight: 'min(12rem, 40dvh)' }}>
              <NarrativeChoiceList
                choices={choiceItems.filter((c) => c.text.trim().length > 0)}
                accentColor={accentColor}
                compact
                continueLabel="Закрыть"
                continueHint={hasContinueOnly ? controlHint : undefined}
                onContinue={hasContinueOnly ? handleClose : undefined}
              />
            </div>
          )}
        </div>
        </FocusTrap>
        <AriaLiveRegion message={liveMessage} priority="polite" />
      </motion.div>
      {/* Full dialogue history overlay — opened via the "История" button in the header.
          Entries are persisted in dialogueHistoryStore (FIFO capped at 100). */}
      <DialogueHistoryPanel
        open={showHistory}
        onClose={() => setShowHistory(false)}
        entries={dialogueHistoryEntries}
      />
    </AnimatePresence>
  );
}
