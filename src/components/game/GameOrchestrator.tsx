'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

import { TITLE_TEXT, SUBTITLE_TEXT } from '@/data/storyNodes';
import { POEMS, GAME_INTRO } from '@/data/poems';

import { useAutoSave } from '@/hooks/useAutoSave';
import { useEnergySystem } from '@/hooks/useEnergySystem';
import { useGamePanels } from '@/hooks/useGamePanels';
import { useTimedMessage } from '@/hooks/useTimedMessage';
import { useEffectNotifications } from '@/hooks/useEffectNotifications';
import { useGameScene } from '@/hooks/useGameScene';
import { useDialogProcessor } from '@/hooks/useDialogProcessor';
import { useActionHandler } from '@/hooks/useActionHandler';
import { AmbientMusicPlayer } from '@/hooks/useAmbientMusic';

import { IntroScreen } from './IntroScreen';
import { MenuScreen } from './MenuScreen';
import CyberLoadingScreen from './LoadingScreen';
import SceneRenderer from './SceneRenderer';
import StoryRenderer from './StoryRenderer';
import DialogueRenderer from './DialogueRenderer';
import HUD from './HUD';
import { AnimeCutscene, type AnimeCutsceneData } from './AnimeCutscene';
import { getCutsceneById } from '@/data/animeCutscenes';
import CoreLoopIndicator from './CoreLoopIndicator';
import ConsequenceNotification from './ConsequenceNotification';
import { CyberGameShell } from './CyberGameShell';
import {
  KernelPanicOverlay,
  PanelErrorBoundary,
  PanelWrapper,
  PoemRevealOverlay,
  SceneNPCList,
  EnergyBar,
} from './GameOrchestratorSubcomponents';

import { useGameStore } from '@/store/gameStore';
import { MiniMap } from '@/components/game/MiniMap';
import { getNPCsForScene } from '@/data/npcDefinitions';
import { SCENE_VISUALS } from '@/engine/SceneManager';

const QuestsPanel = dynamic(() => import('@/components/game/QuestsPanel'), { ssr: false });
const FactionsPanel = dynamic(() => import('@/components/game/FactionsPanel'), { ssr: false });
const Inventory = dynamic(() => import('@/components/game/Inventory'), { ssr: false });
const AchievementsPanel = dynamic(() => import('@/components/game/AchievementsPanel'), { ssr: false });
const PoetryBook = dynamic(() => import('@/components/game/PoetryBook'), { ssr: false });
const SkillsPanel = dynamic(() => import('@/components/SkillsPanel'), { ssr: false });
const ITTerminal = dynamic(() => import('@/components/game/ITTerminal'), { ssr: false });
const JournalPanel = dynamic(() => import('@/components/game/JournalPanel'), { ssr: false });
const LegacyScreen = dynamic(() => import('@/components/game/LegacyScreen'), { ssr: false });

// ============================================
// GAME ORCHESTRATOR — композиция хуков сцены, диалога и действий
// ============================================

export default function GameOrchestrator() {
  useAutoSave({ intervalMs: 120_000, saveOnSceneChange: true, saveOnChoice: false });

  const energySystem = useEnergySystem();

  const actions = useGameStore(useShallow((s) => ({
    setPhase: s.setPhase,
    setCurrentNode: s.setCurrentNode,
    addStat: s.addStat,
    addStress: s.addStress,
    reduceStress: s.reduceStress,
    clearPanicMode: s.clearPanicMode,
    collectPoem: s.collectPoem,
    unlockAchievement: s.unlockAchievement,
    setGameMode: s.setGameMode,
    updateNPCRelation: s.updateNPCRelation,
    setFlag: s.setFlag,
    unsetFlag: s.unsetFlag,
    addSkill: s.addSkill,
    addItem: s.addItem,
    removeItem: s.removeItem,
    activateQuest: s.activateQuest,
    completeQuest: s.completeQuest,
    incrementQuestObjective: s.incrementQuestObjective,
    updateQuestObjective: s.updateQuestObjective,
    saveGame: s.saveGame,
    loadGame: s.loadGame,
    resetGame: s.resetGame,
    setCurrentNPC: s.setCurrentNPC,
    incrementPlayTime: s.incrementPlayTime,
    travelToScene: s.travelToScene,
  })));

  const {
    setPhase, setCurrentNode, addStat, addStress, reduceStress, clearPanicMode,
    collectPoem, unlockAchievement, setGameMode, updateNPCRelation, setFlag,
    unsetFlag, addSkill, addItem, removeItem, activateQuest, completeQuest,
    incrementQuestObjective, updateQuestObjective, saveGame: saveGameToStore,
    loadGame: loadGameFromStore, resetGame: resetGameStore, setCurrentNPC,
    incrementPlayTime, travelToScene,
  } = actions;

  const phase = useGameStore((s) => s.phase);
  const playerState = useGameStore((s) => s.playerState);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const collectedPoems = useGameStore((s) => s.collectedPoemIds);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievementIds);
  const gameMode = useGameStore((s) => s.gameMode);
  const exploration = useGameStore(
    useShallow((s) => ({
      playerPosition: s.exploration.playerPosition,
      currentSceneId: s.exploration.currentSceneId,
      npcStates: s.exploration.npcStates,
    })),
  );
  const npcRelations = useGameStore((s) => s.npcRelations);
  const inventory = useGameStore((s) => s.inventory);

  const [mounted, setMounted] = useState(false);
  const { panels, togglePanel } = useGamePanels();
  const { message: saveNotif, showMessage: showSaveNotif } = useTimedMessage(2000);
  const { notifications: effectNotifs, showEffectNotif } = useEffectNotifications(5, 3000);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  const {
    dialogueStoreActions,
    activeDialogue,
    handleDialogueEffect,
    openNpcDialogue,
    openDialogueFromStory,
    closeDialogue,
  } = useDialogProcessor({
    setCurrentNPC,
    setGameMode,
    setCurrentNode,
    addStat,
    addStress,
    reduceStress,
    setFlag,
    unsetFlag,
    updateNPCRelation,
    addItem,
    removeItem,
    activateQuest,
    updateQuestObjective,
    collectPoem,
    addSkill,
  });

  const scene = useGameScene({
    phase,
    currentNodeId,
    playerState,
    npcRelations,
    collectedPoems,
    unlockedAchievements,
    dialogueStoreActions,
    incrementPlayTime,
    travelToScene,
    collectPoem,
    addStat,
    addSkill,
    setFlag,
    unlockAchievement,
    showEffectNotif,
  });

  const { currentNode, currentSceneId, trackQuestNpcTalk, emitQuestEvent, runtime } = scene;
  const {
    revealedPoemId,
    closePoemReveal,
    activeCutsceneId,
    completeCutscene,
    showLegacy,
    hideLegacy,
  } = runtime;

  const activeCutscene = useMemo(() => {
    if (!activeCutsceneId) return null;
    const data = getCutsceneById(activeCutsceneId);
    return data ? (data as AnimeCutsceneData) : null;
  }, [activeCutsceneId]);

  const minimapNpcs = useMemo(() => {
    if (gameMode !== 'exploration') return [];
    return getNPCsForScene(exploration.currentSceneId).map((def) => ({
      id: def.id,
      name: def.name,
      model: def.model,
      defaultPosition: def.defaultPosition,
      sceneId: def.sceneId,
      position: exploration.npcStates[def.id]?.position,
    }));
  }, [gameMode, exploration.currentSceneId, exploration.npcStates]);

  useEffect(() => {
    if (!activeCutsceneId) return;
    if (!getCutsceneById(activeCutsceneId)) {
      console.warn(`[GameOrchestrator] Cutscene "${activeCutsceneId}" not found`);
      completeCutscene();
    }
  }, [activeCutsceneId, completeCutscene]);

  const handleNPCInteraction = useCallback(
    (npcId: string) => {
      trackQuestNpcTalk(npcId);
      openNpcDialogue(npcId);
    },
    [trackQuestNpcTalk, openNpcDialogue],
  );

  const actionsBundle = useActionHandler({
    playerSkills: playerState.skills,
    energySystem,
    showEffectNotif,
    setCurrentNode,
    addStat,
    addStress,
    reduceStress,
    collectPoem,
    setFlag,
    unsetFlag,
    updateNPCRelation,
    activateQuest,
    completeQuest,
    incrementQuestObjective,
    updateQuestObjective,
    addSkill,
    addItem,
    removeItem,
    openDialogueFromStory,
    phase,
    gameMode,
    currentNodeId,
    hasCurrentNode: Boolean(currentNode),
    togglePanel,
    setPhase,
    setGameMode,
    saveGameToStore,
    loadGameFromStore,
    resetGameStore,
    showSaveNotif,
    clearPanicMode,
  });

  const {
    handleChoice,
    showStoryPanel,
    handleTogglePanel,
    hasSavedGame,
    handleLoadingReady,
    handleSaveGame,
    handleStartNewGame,
    handleLoadGame,
    handleIntroComplete,
    handleCalmDown,
  } = actionsBundle;

  if (!mounted) return <div className="fixed inset-0 bg-black" />;

  if (phase === 'loading') {
    return <CyberLoadingScreen onReady={handleLoadingReady} />;
  }
  if (phase === 'intro') {
    return (
      <IntroScreen
        titleText={TITLE_TEXT}
        subtitleText={SUBTITLE_TEXT}
        gameIntro={GAME_INTRO}
        poems={POEMS}
        onComplete={handleIntroComplete}
      />
    );
  }
  if (phase === 'menu') {
    return (
      <MenuScreen
        titleText={TITLE_TEXT}
        subtitleText={SUBTITLE_TEXT}
        hasSave={hasSavedGame}
        onNewGame={handleStartNewGame}
        onContinue={handleLoadGame}
      />
    );
  }

  return (
    <CyberGameShell sceneId={currentSceneId} stability={playerState.stability}>
      <AmbientMusicPlayer
        sceneId={currentSceneId}
        mood={playerState.mood}
        stress={playerState.stress}
        creativity={playerState.creativity}
        enabled={phase === 'game' && !activeCutscene}
      />
      <SceneRenderer sceneId={currentSceneId} playerState={playerState} />

      <SceneNPCList sceneId={currentSceneId} onInteract={handleNPCInteraction} />

      {gameMode === 'exploration' && (
        <MiniMap
          playerPosition={exploration.playerPosition}
          sceneSize={{ width: 20, depth: 20 }}
          sceneName={SCENE_VISUALS[exploration.currentSceneId]?.name ?? exploration.currentSceneId}
          npcs={minimapNpcs}
        />
      )}

      <HUD onSave={handleSaveGame} onTogglePanel={handleTogglePanel} activePanels={panels} />

      <CoreLoopIndicator />
      <ConsequenceNotification />

      <AnimatePresence>
        {showStoryPanel && (
          <StoryRenderer
            node={currentNode}
            onChoice={handleChoice}
            onPoemGameComplete={() => {
              emitQuestEvent({ type: 'poem_written', data: {} });
            }}
          />
        )}
      </AnimatePresence>

      {activeDialogue && (
        <DialogueRenderer
          isOpen={true}
          npcId={activeDialogue.npcId}
          npcName={activeDialogue.npcName}
          dialogueTree={activeDialogue.node}
          storyLinked={Boolean(activeDialogue.storyResume)}
          onClose={closeDialogue}
          playerState={playerState}
          npcRelations={npcRelations}
          flags={playerState.flags}
          inventory={inventory.map((i) => i.item.id)}
          visitedNodes={playerState.visitedNodes}
          onEffect={handleDialogueEffect}
        />
      )}

      <AnimatePresence>
        {revealedPoemId && (
          <PoemRevealOverlay poemId={revealedPoemId} onClose={closePoemReveal} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCutscene && (
          <AnimeCutscene
            key={activeCutscene.id}
            cutscene={activeCutscene}
            onComplete={completeCutscene}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {panels.skills && (
          <PanelWrapper onClose={() => handleTogglePanel('skills')}>
            <PanelErrorBoundary panelLabel="Навыки" onClose={() => handleTogglePanel('skills')}>
              <SkillsPanel skills={playerState.skills} onClose={() => handleTogglePanel('skills')} />
            </PanelErrorBoundary>
          </PanelWrapper>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panels.quests && (
          <PanelErrorBoundary panelLabel="Квесты" onClose={() => handleTogglePanel('quests')}>
            <QuestsPanel onClose={() => handleTogglePanel('quests')} />
          </PanelErrorBoundary>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panels.factions && (
          <PanelErrorBoundary panelLabel="Фракции" onClose={() => handleTogglePanel('factions')}>
            <FactionsPanel onClose={() => handleTogglePanel('factions')} />
          </PanelErrorBoundary>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panels.inventory && (
          <PanelErrorBoundary panelLabel="Инвентарь" onClose={() => handleTogglePanel('inventory')}>
            <Inventory isOpen={panels.inventory} onClose={() => handleTogglePanel('inventory')} />
          </PanelErrorBoundary>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panels.achievements && (
          <PanelErrorBoundary panelLabel="Достижения" onClose={() => handleTogglePanel('achievements')}>
            <AchievementsPanel onClose={() => handleTogglePanel('achievements')} />
          </PanelErrorBoundary>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panels.poetry && (
          <PanelErrorBoundary panelLabel="Книга стихов" onClose={() => handleTogglePanel('poetry')}>
            <PoetryBook isOpen={panels.poetry} onClose={() => handleTogglePanel('poetry')} />
          </PanelErrorBoundary>
        )}
        {panels.terminal && (
          <PanelErrorBoundary panelLabel="Терминал" onClose={() => handleTogglePanel('terminal')}>
            <ITTerminal onClose={() => handleTogglePanel('terminal')} />
          </PanelErrorBoundary>
        )}
        {panels.journal && (
          <PanelErrorBoundary panelLabel="Журнал" onClose={() => handleTogglePanel('journal')}>
            <JournalPanel key="journal-panel" onClose={() => handleTogglePanel('journal')} />
          </PanelErrorBoundary>
        )}
      </AnimatePresence>

      <KernelPanicOverlay isActive={playerState.panicMode} onCalmDown={handleCalmDown} />

      {showLegacy && currentNode?.type === 'ending' && (
        <PanelErrorBoundary panelLabel="Наследие / финал" onClose={hideLegacy}>
          <LegacyScreen
            endingType={currentNode.endingType || 'broken'}
            endingTitle={currentNode.endingTitle || 'Финал'}
            onRestart={() => {
              hideLegacy();
              resetGameStore();
            }}
          />
        </PanelErrorBoundary>
      )}

      <AnimatePresence>
        {saveNotif && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-900/95 rounded-lg border border-emerald-500/50 shadow-lg"
          >
            <span className="text-white font-medium">💾 {saveNotif}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed top-28 right-4 z-50 flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {effectNotifs.map((notif) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 40 }}
              className={`px-4 py-2 backdrop-blur-sm border ${notif.type === 'energy' ? 'max-w-[min(92vw,22rem)]' : ''}`}
              style={{
                background:
                  notif.type === 'energy' ? 'rgba(251, 191, 36, 0.15)' :
                  notif.type === 'poem' ? 'rgba(245, 158, 11, 0.15)' :
                  notif.type === 'quest' ? 'rgba(168, 85, 247, 0.15)' :
                  notif.type === 'flag' ? 'rgba(34, 197, 94, 0.15)' :
                  'rgba(0, 255, 255, 0.1)',
                borderColor:
                  notif.type === 'energy' ? 'rgba(251, 191, 36, 0.4)' :
                  notif.type === 'poem' ? 'rgba(245, 158, 11, 0.4)' :
                  notif.type === 'quest' ? 'rgba(168, 85, 247, 0.4)' :
                  notif.type === 'flag' ? 'rgba(34, 197, 94, 0.4)' :
                  'rgba(0, 255, 255, 0.3)',
                clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
              }}
            >
              <span
                className={`font-mono text-xs tracking-wider ${notif.type === 'energy' ? 'leading-snug whitespace-normal' : ''}`}
                style={{
                  color:
                    notif.type === 'energy' ? 'rgba(251, 191, 36, 0.9)' :
                    notif.type === 'poem' ? 'rgba(245, 158, 11, 0.9)' :
                    notif.type === 'quest' ? 'rgba(168, 85, 247, 0.9)' :
                    notif.type === 'flag' ? 'rgba(34, 197, 94, 0.9)' :
                    'rgba(0, 255, 255, 0.8)',
                  textShadow: `0 0 8px ${
                    notif.type === 'energy' ? 'rgba(251,191,36,0.4)' :
                    notif.type === 'poem' ? 'rgba(245,158,11,0.4)' :
                    notif.type === 'quest' ? 'rgba(168,85,247,0.4)' :
                    notif.type === 'flag' ? 'rgba(34,197,94,0.4)' :
                    'rgba(0,255,255,0.3)'
                  }`,
                }}
              >
                {notif.text}
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <EnergyBar energy={energySystem.energy} maxEnergy={energySystem.maxEnergy} energyLevel={energySystem.energyLevel} />
    </CyberGameShell>
  );
}
