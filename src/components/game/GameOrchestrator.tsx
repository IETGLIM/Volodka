'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
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
import { eventBus } from '@/engine/EventBus';
import { useGameAudioProfile } from '@/hooks/useAudio';
import { QUEST_DEFINITIONS, getNextTrackedObjective } from '@/data/quests';
import { getNPCsForScene, getNpcExplorationPosition } from '@/data/npcDefinitions';
import { getSceneConfig, getInteractiveObjectsForScene } from '@/config/scenes';
import { homeApartmentInspectLine, tryHomeApartmentUse } from '@/lib/homeApartmentInteract';
import type { MiniMapQuestMarker } from '@/components/game/MiniMap';
import { MoralCompassHUD } from '@/components/game/MoralCompassHUD';
import { SceneTransition } from '@/components/game/CinematicEffects';
import { LootNotification, SkillUpNotification } from '@/components/game/LootNotification';
import { TutorialOverlay } from '@/components/game/TutorialOverlay';
import { MiniMap } from '@/components/game/MiniMap';
import { SCENE_VISUALS } from '@/engine/SceneManager';
import type { VisualState } from '@/data/types';
import { storyNodeShowsStoryOverlay } from '@/lib/storyOverlayEligibility';

const QuestsPanel = dynamic(() => import('@/components/game/QuestsPanel'), { ssr: false });
const FactionsPanel = dynamic(() => import('@/components/game/FactionsPanel'), { ssr: false });
const Inventory = dynamic(() => import('@/components/game/Inventory'), { ssr: false });
const AchievementsPanel = dynamic(() => import('@/components/game/AchievementsPanel'), { ssr: false });
const PoetryBook = dynamic(() => import('@/components/game/PoetryBook'), { ssr: false });
const SkillsPanel = dynamic(() => import('@/components/SkillsPanel'), { ssr: false });
const ITTerminal = dynamic(() => import('@/components/game/ITTerminal'), { ssr: false });
const JournalPanel = dynamic(() => import('@/components/game/JournalPanel'), { ssr: false });
const LegacyScreen = dynamic(() => import('@/components/game/LegacyScreen'), { ssr: false });
const RPGGameCanvas = dynamic(
  () => import('@/components/game/RPGGameCanvas').then((m) => m.RPGGameCanvas),
  {
    ssr: false,
    loading: () => (
      <div className="fixed inset-0 z-[12] flex items-center justify-center bg-black/50 font-mono text-sm text-cyan-500/70">
        SYNC // 3D…
      </div>
    ),
  },
);

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
      timeOfDay: s.exploration.timeOfDay,
      npcStates: s.exploration.npcStates,
      lastSceneTransition: s.exploration.lastSceneTransition,
    })),
  );
  const activeQuestIds = useGameStore((s) => s.activeQuestIds);
  const questProgress = useGameStore((s) => s.questProgress);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const inventory = useGameStore((s) => s.inventory);

  const [mounted, setMounted] = useState(false);
  /** Короткий matrix/glitch-переход при смене 3D-локации (`lastSceneTransition`). */
  const [explorationSceneGlitch, setExplorationSceneGlitch] = useState(false);
  const explorationTransitionReadyRef = useRef(false);
  const prevSceneTransitionTsRef = useRef<number | null>(null);
  const explorationGlitchClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { panels, togglePanel } = useGamePanels();
  const { message: saveNotif, showMessage: showSaveNotif } = useTimedMessage(2000);
  const { notifications: effectNotifs, showEffectNotif } = useEffectNotifications(5, 3000);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('ui:exploration_message', ({ text }) => {
      showEffectNotif(text, 'system');
    });
    return unsub;
  }, [showEffectNotif]);

  /** Glitch-переход при смене 3D-локации (store `lastSceneTransition`); без вспышки при первом входе в обход. */
  useEffect(() => {
    if (phase !== 'game' || gameMode !== 'exploration') {
      explorationTransitionReadyRef.current = false;
      prevSceneTransitionTsRef.current = null;
      if (explorationGlitchClearRef.current) {
        clearTimeout(explorationGlitchClearRef.current);
        explorationGlitchClearRef.current = null;
      }
      setExplorationSceneGlitch(false);
      return;
    }
    const ts = exploration.lastSceneTransition;
    if (!explorationTransitionReadyRef.current) {
      explorationTransitionReadyRef.current = true;
      prevSceneTransitionTsRef.current = ts;
      return;
    }
    if (prevSceneTransitionTsRef.current !== ts && ts !== 0) {
      if (explorationGlitchClearRef.current) clearTimeout(explorationGlitchClearRef.current);
      setExplorationSceneGlitch(true);
      const duration = 0.55;
      explorationGlitchClearRef.current = setTimeout(() => {
        explorationGlitchClearRef.current = null;
        setExplorationSceneGlitch(false);
      }, duration * 1500);
      prevSceneTransitionTsRef.current = ts;
      return () => {
        if (explorationGlitchClearRef.current) {
          clearTimeout(explorationGlitchClearRef.current);
          explorationGlitchClearRef.current = null;
        }
      };
    }
    prevSceneTransitionTsRef.current = ts;
  }, [phase, gameMode, exploration.lastSceneTransition]);

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
    gameMode,
    explorationCurrentSceneId: exploration.currentSceneId,
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

  useEffect(() => {
    return eventBus.on('object:interact', ({ objectId, action }) => {
      const sid = useGameStore.getState().exploration.currentSceneId;
      const objects = getInteractiveObjectsForScene(sid);
      const obj = objects.find((o) => o.id === objectId);
      const toast = (text: string) => eventBus.emit('ui:exploration_message', { text });

      if (!obj) {
        toast('Объект не найден в этой сцене.');
        return;
      }

      const store = useGameStore.getState();
      switch (action) {
        case 'inspect': {
          const homeLine = sid === 'home_evening' ? homeApartmentInspectLine(obj) : null;
          if (homeLine) {
            toast(homeLine);
          } else if (obj.canBeRead && obj.poemId) {
            toast(`«${obj.type}»: можно прочитать — действие «Использовать».`);
          } else {
            toast(`Объект «${obj.id}» (${obj.type}).`);
          }
          break;
        }
        case 'take': {
          if (obj.itemId) {
            store.addItem(obj.itemId, 1);
          } else {
            toast('С объекта нечего взять.');
          }
          break;
        }
        case 'use': {
          if (sid === 'home_evening' && tryHomeApartmentUse(obj, store, toast, emitQuestEvent)) {
            break;
          }
          toast('Использование привязано к сюжету — скоро.');
          break;
        }
        case 'drop': {
          if (obj.itemId) {
            store.removeItem(obj.itemId, 1);
            toast(`Выброшено: ${obj.itemId}`);
          } else {
            toast('Нельзя выбросить привязку к этому объекту.');
          }
          break;
        }
        default:
          toast(`Действие «${action}» не обработано.`);
      }
    });
  }, [emitQuestEvent]);

  const {
    revealedPoemId,
    closePoemReveal,
    activeCutsceneId,
    requestCutscene,
    completeCutscene,
    showLegacy,
    hideLegacy,
  } = runtime;

  const pendingStoryAfterExplorationCutsceneRef = useRef<string | null>(null);

  useEffect(() => {
    if (activeCutsceneId) return;
    const pending = pendingStoryAfterExplorationCutsceneRef.current;
    if (!pending) return;
    pendingStoryAfterExplorationCutsceneRef.current = null;
    setCurrentNode(pending);
  }, [activeCutsceneId, setCurrentNode]);

  const activeCutscene = useMemo(() => {
    if (!activeCutsceneId) return null;
    const data = getCutsceneById(activeCutsceneId);
    return data ? (data as AnimeCutsceneData) : null;
  }, [activeCutsceneId]);

  const minimapNpcs = useMemo(() => {
    if (gameMode !== 'exploration') return [];
    const sid = exploration.currentSceneId;
    const t = exploration.timeOfDay;
    return getNPCsForScene(sid, t).map((def) => ({
      id: def.id,
      name: def.name,
      model: def.model,
      defaultPosition: def.defaultPosition,
      sceneId: def.sceneId,
      position: getNpcExplorationPosition(def, sid, t, exploration.npcStates[def.id]?.position),
    }));
  }, [gameMode, exploration.currentSceneId, exploration.timeOfDay, exploration.npcStates]);

  const minimapSceneSize = useMemo(() => {
    const cfg = getSceneConfig(exploration.currentSceneId);
    return { width: cfg.size[0], depth: cfg.size[1] };
  }, [exploration.currentSceneId]);

  const minimapQuestMarkers = useMemo((): MiniMapQuestMarker[] => {
    if (gameMode !== 'exploration') return [];
    const sid = exploration.currentSceneId;
    const markers: MiniMapQuestMarker[] = [];

    for (const qid of activeQuestIds) {
      const quest = QUEST_DEFINITIONS[qid];
      if (!quest) continue;
      const prog = questProgress[qid] || {};
      const next = getNextTrackedObjective(quest, prog);
      const obj = next ?? quest.objectives.find((o) => !o.hidden);
      if (!obj?.targetLocation || obj.targetLocation !== sid) continue;

      if (obj.targetNPC) {
        const t = exploration.timeOfDay;
        const npc = getNPCsForScene(sid, t).find((n) => n.id === obj.targetNPC);
        if (npc) {
          const p = getNpcExplorationPosition(
            npc,
            sid,
            t,
            exploration.npcStates[npc.id]?.position,
          );
          markers.push({ id: `${qid}-${obj.id}`, position: { x: p.x, z: p.z }, type: 'target' });
        }
      } else {
        markers.push({
          id: `${qid}-${obj.id}-area`,
          position: { x: 0, z: 0 },
          type: 'area',
        });
      }
    }

    return markers;
  }, [
    gameMode,
    exploration.currentSceneId,
    exploration.timeOfDay,
    exploration.npcStates,
    activeQuestIds,
    questProgress,
  ]);

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

  const displaySceneId = gameMode === 'exploration' ? exploration.currentSceneId : currentSceneId;

  useGameAudioProfile(displaySceneId, playerState.stress);

  const explorationVisualState = useMemo((): VisualState => {
    const stressGlitch = Math.min(
      1,
      (playerState.stress / 100) * 0.45 + (playerState.panicMode ? 0.35 : 0),
    );
    const panelDistrict =
      exploration.currentSceneId === 'street_night' ||
      exploration.currentSceneId === 'street_winter';
    return {
      glitchIntensity: Math.min(1, stressGlitch + (panelDistrict ? 0.12 : 0)),
      saturation: 0.78 + (playerState.stability / 100) * 0.2 + (panelDistrict ? -0.06 : 0),
      contrast: 0.9 + (playerState.mood / 100) * 0.12 + (panelDistrict ? 0.04 : 0),
      colorTint: panelDistrict ? '#0d3d28' : 'transparent',
      particles: playerState.creativity > 55 || panelDistrict,
    };
  }, [
    playerState.stress,
    playerState.stability,
    playerState.mood,
    playerState.creativity,
    playerState.panicMode,
    exploration.currentSceneId,
  ]);

  const storyOverlayEligible = useMemo(() => storyNodeShowsStoryOverlay(currentNode), [currentNode]);

  const handleExplorationStoryTrigger = useCallback(
    (triggerId: string, storyNodeId?: string, cutsceneId?: string) => {
      if (cutsceneId) {
        requestCutscene(cutsceneId, `explore::${triggerId}::${cutsceneId}`);
        pendingStoryAfterExplorationCutsceneRef.current = storyNodeId ?? null;
        return;
      }
      if (storyNodeId) setCurrentNode(storyNodeId);
    },
    [setCurrentNode, requestCutscene],
  );

  const handleEnterExplorationMode = useCallback(() => {
    travelToScene(currentSceneId, { narrativeDriven: true });
    setCurrentNode('explore_mode');
    setGameMode('exploration');
  }, [travelToScene, currentSceneId, setCurrentNode, setGameMode]);

  const handleEnterVisualNovelMode = useCallback(() => {
    setGameMode('visual-novel');
  }, [setGameMode]);

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
    storyOverlayEligible,
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
    showStoryOverlay,
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
    <CyberGameShell sceneId={displaySceneId} stability={playerState.stability}>
      <AmbientMusicPlayer
        sceneId={displaySceneId}
        mood={playerState.mood}
        stress={playerState.stress}
        creativity={playerState.creativity}
        enabled={phase === 'game' && !activeCutscene}
        forceBattleMusic={playerState.stress > 80 || displaySceneId === 'battle'}
      />
      {gameMode !== 'exploration' && (
        <SceneRenderer sceneId={currentSceneId} playerState={playerState} />
      )}

      {gameMode !== 'exploration' && (
        <SceneNPCList sceneId={currentSceneId} onInteract={handleNPCInteraction} />
      )}

      {phase === 'game' && gameMode === 'exploration' && (
        <>
          <SceneTransition isActive={explorationSceneGlitch} type="glitch" duration={0.55} />
          {explorationSceneGlitch && (
            <div className="pointer-events-none fixed inset-0 z-[51] flex justify-center pt-5 font-mono text-[10px] uppercase tracking-[0.35em] text-cyan-400/75 mix-blend-screen">
              link // {exploration.currentSceneId.replace(/_/g, '.')}
            </div>
          )}
        </>
      )}

      {gameMode === 'exploration' && (
        <div className="fixed inset-0 z-[12]">
          <RPGGameCanvas
            sceneId={exploration.currentSceneId}
            visualState={explorationVisualState}
            isDialogueActive={Boolean(activeDialogue) || Boolean(activeCutsceneId)}
            onTriggerEnter={handleExplorationStoryTrigger}
            onNPCInteraction={handleNPCInteraction}
          />
        </div>
      )}

      {gameMode === 'exploration' && (
        <MiniMap
          playerPosition={exploration.playerPosition}
          sceneSize={minimapSceneSize}
          sceneName={SCENE_VISUALS[exploration.currentSceneId]?.name ?? exploration.currentSceneId}
          npcs={minimapNpcs}
          questMarkers={minimapQuestMarkers}
        />
      )}

      <MoralCompassHUD />
      <LootNotification />
      <SkillUpNotification />
      <TutorialOverlay gameMode={gameMode} isDialogue={Boolean(activeDialogue)} />

      <HUD
        onSave={handleSaveGame}
        onTogglePanel={handleTogglePanel}
        activePanels={panels}
        gameMode={gameMode}
        onEnterExploration={handleEnterExplorationMode}
        onEnterVisualNovel={handleEnterVisualNovelMode}
      />

      <CoreLoopIndicator />
      <ConsequenceNotification />

      <AnimatePresence>
        {showStoryOverlay && (
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
                  notif.type === 'system' ? 'rgba(148, 163, 184, 0.18)' :
                  'rgba(0, 255, 255, 0.1)',
                borderColor:
                  notif.type === 'energy' ? 'rgba(251, 191, 36, 0.4)' :
                  notif.type === 'poem' ? 'rgba(245, 158, 11, 0.4)' :
                  notif.type === 'quest' ? 'rgba(168, 85, 247, 0.4)' :
                  notif.type === 'flag' ? 'rgba(34, 197, 94, 0.4)' :
                  notif.type === 'system' ? 'rgba(148, 163, 184, 0.45)' :
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
                    notif.type === 'system' ? 'rgba(226, 232, 240, 0.92)' :
                    'rgba(0, 255, 255, 0.8)',
                  textShadow: `0 0 8px ${
                    notif.type === 'energy' ? 'rgba(251,191,36,0.4)' :
                    notif.type === 'poem' ? 'rgba(245,158,11,0.4)' :
                    notif.type === 'quest' ? 'rgba(168,85,247,0.4)' :
                    notif.type === 'flag' ? 'rgba(34,197,94,0.4)' :
                    notif.type === 'system' ? 'rgba(148,163,184,0.35)' :
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
