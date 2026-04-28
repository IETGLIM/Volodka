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
import StoryRenderer from './StoryRenderer';
import DialogueRenderer from './DialogueRenderer';
import HUD from './HUD';
import { AriaLiveAnnouncer } from './AriaLiveAnnouncer';
import { AnimeCutscene, type AnimeCutsceneData } from './AnimeCutscene';
import { getCutsceneById } from '@/data/animeCutscenes';
import CoreLoopIndicator from './CoreLoopIndicator';
import ConsequenceNotification from './ConsequenceNotification';
import { CyberGameShell } from './CyberGameShell';
import { NarrativeDebugPanel } from './NarrativeDebugPanel';
import {
  KernelPanicOverlay,
  PanelErrorBoundary,
  PanelWrapper,
  PoemRevealOverlay,
  EnergyBar,
} from './GameOrchestratorSubcomponents';

import { useGameStore } from '@/state';
import { useAppStore } from '@/state/appStore';
import { useGamePhaseStore } from '@/state/gamePhaseStore';
import { IntroCutsceneOverlays } from '@/ui/cutscenes/IntroCutsceneOverlays';
import { eventBus } from '@/engine/EventBus';
import { useGameAudioProfile } from '@/hooks/useAudio';
import { useLoadingProgress } from '@/context/LoadingProgressContext';
import { QUEST_DEFINITIONS, getNextTrackedObjective } from '@/data/quests';
import { getExplorationSceneObjectiveLines } from '@/lib/explorationSceneQuestObjectives';
import { getNPCById, getNPCsForScene, getNpcExplorationPosition } from '@/data/npcDefinitions';
import { getSceneConfig } from '@/config/scenes';
import type { MiniMapQuestMarker } from '@/ui/game/MiniMap';
import { MoralCompassHUD } from '@/ui/game/MoralCompassHUD';
import { LevelUpCinematicOverlay } from '@/ui/game/LevelUpCinematicOverlay';
import { SceneTransition } from '@/ui/game/CinematicEffects';
import { LootNotification, SkillUpNotification } from '@/ui/game/LootNotification';
import { TutorialOverlay } from '@/ui/game/TutorialOverlay';
import { HackingWireMinigameOverlay } from '@/ui/3d/exploration/HackingWireMinigameOverlay';
import { ItGlitchPulseOverlay } from '@/ui/game/ItGlitchPulseOverlay';
import { ExplorationRackConsoleOverlay } from '@/ui/3d/exploration/ExplorationRackConsoleOverlay';
import { MiniMap } from '@/ui/game/MiniMap';
import { ExplorationObjectiveStrip } from '@/ui/game/ExplorationObjectiveStrip';
import { SCENE_VISUALS } from '@/engine/SceneManager';
import type { VisualState } from '@/data/types';
import { EXPLORATION_GAME_VIEWPORT_CLASS } from '@/ui/3d/Scene';
import { initGameCore } from '@/game/core/gameCoreBootstrap';
import { getWorldStateModifiers } from '@/game/world/worldReactivity';
import MemoryLog from '@/ui/primitives/MemoryLog';
import QuestTracker from '@/ui/primitives/QuestTracker';

const QuestsPanel = dynamic(() => import('@/ui/game/QuestsPanel'), { ssr: false });
const FactionsPanel = dynamic(() => import('@/ui/game/FactionsPanel'), { ssr: false });
const Inventory = dynamic(() => import('@/ui/game/Inventory'), { ssr: false });
const AchievementsPanel = dynamic(() => import('@/ui/game/AchievementsPanel'), { ssr: false });
const PoetryBook = dynamic(() => import('@/ui/game/PoetryBook'), { ssr: false });
const SkillsPanel = dynamic(() => import('@/ui/SkillsPanel'), { ssr: false });
const ITTerminal = dynamic(() => import('@/ui/game/ITTerminal'), { ssr: false });
const JournalPanel = dynamic(() => import('@/ui/game/JournalPanel'), { ssr: false });
const LegacyScreen = dynamic(() => import('@/ui/game/LegacyScreen'), { ssr: false });
/** Длительность кинематографического оверлея при смене 3D-локации (должна покрывать фазы `SceneTransition`). */
const EXPLORATION_SCENE_GLITCH_MS = 2700;
const EXPLORATION_SCENE_TRANSITION_DURATION_SEC = 1.65;

const RPGGameCanvas = dynamic(
  () => import('@/ui/game/RPGGameCanvas').then((m) => m.RPGGameCanvas),
  {
    ssr: false,
    loading: () => (
      <div
        className={`${EXPLORATION_GAME_VIEWPORT_CLASS} flex flex-col items-center justify-center bg-[#030308]/92 font-mono`}
      >
        <div className="text-lg tracking-[0.25em] text-cyan-400/85 animate-pulse">SYNC // 3D</div>
        <div className="mt-2 text-[10px] uppercase tracking-[0.4em] text-cyan-600/50">камера · физика · GLB</div>
      </div>
    ),
  },
);

// ============================================
// GAME ORCHESTRATOR — композиция хуков сцены, диалога и действий
// ============================================

export default function GameOrchestrator() {
  useAutoSave({
    intervalMs: 120_000,
    saveOnSceneChange: true,
    saveOnChoice: false,
    minDelayMs: 30_000,
    debounceMs: 5_000,
  });

  const energySystem = useEnergySystem();

  const actions = useGameStore(useShallow((s) => ({
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
    setCurrentNode, addStat, addStress, reduceStress, clearPanicMode,
    collectPoem, unlockAchievement, setGameMode, updateNPCRelation, setFlag,
    unsetFlag, addSkill, addItem, removeItem, activateQuest, completeQuest,
    incrementQuestObjective, updateQuestObjective, saveGame: saveGameToStore,
    loadGame: loadGameFromStore, resetGame: resetGameStore, setCurrentNPC,
    incrementPlayTime, travelToScene,
  } = actions;

  const phase = useAppStore((s) => s.phase);
  const setPhase = useAppStore((s) => s.setPhase);
  const playerState = useGameStore((s) => s.playerState);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const collectedPoems = useGameStore((s) => s.collectedPoemIds);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievementIds);
  const gameMode = useGameStore((s) => s.gameMode);
  const exploration = useGameStore(
    useShallow((s) => ({
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
  const explorationIntroPhase = useGamePhaseStore((s) => s.phase);
  const introOpening3dActive =
    phase === 'game' && gameMode === 'exploration' && explorationIntroPhase === 'intro_cutscene';

  const [mounted, setMounted] = useState(false);
  /** Короткий matrix/glitch-переход при смене 3D-локации (`lastSceneTransition`). */
  const [explorationSceneGlitch, setExplorationSceneGlitch] = useState(false);
  /** Диалог открыт из 3D-обхода: оставляем `RPGGameCanvas` смонтированным под оверлеем + кадр камеры. */
  const [explorationDialogueLayout, setExplorationDialogueLayout] = useState(false);
  const explorationTransitionReadyRef = useRef(false);
  const prevSceneTransitionTsRef = useRef<number | null>(null);
  const explorationGlitchClearRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { panels, togglePanel } = useGamePanels();
  const { message: manualSaveMsg, showMessage: showManualSave } = useTimedMessage(2400);
  const { message: autoSaveMsg, showMessage: showAutoSave } = useTimedMessage(900);
  const { message: loadMsg, showMessage: showLoadPulse } = useTimedMessage(1100);
  const { notifications: effectNotifs, showEffectNotif } = useEffectNotifications(5, 3000);
  const { setProgress } = useLoadingProgress();

  useEffect(() => {
    setProgress(22, 'МОДУЛЬ ИГРЫ');
    const id = requestAnimationFrame(() => {
      setMounted(true);
    });
    return () => cancelAnimationFrame(id);
  }, [setProgress]);

  useEffect(() => {
    if (phase === 'loading') {
      setProgress(72, 'СИСТЕМА ЗАГРУЗКИ');
    } else if (phase === 'menu') {
      setProgress(100, 'МЕНЮ');
    } else if (phase === 'intro') {
      setProgress(100, 'ИНТРО');
    } else if (phase === 'game') {
      setProgress(100, 'ИГРА');
    }
  }, [phase, setProgress]);

  useEffect(() => {
    const unsub = eventBus.on('ui:exploration_message', ({ text }) => {
      showEffectNotif(text, 'system');
    });
    return unsub;
  }, [showEffectNotif]);

  useEffect(() => {
    return eventBus.on('ui:effect_notif', ({ text, type, durationMs, priority }) => {
      showEffectNotif(text, type, durationMs, priority);
    });
  }, [showEffectNotif]);

  useEffect(() => {
    return initGameCore();
  }, []);

  useEffect(() => {
    const offSaved = eventBus.on('game:saved', ({ source }) => {
      if (source === 'manual') showManualSave('Игра сохранена');
      else showAutoSave('Синхронизация');
    });
    const offLoaded = eventBus.on('game:loaded', () => {
      showLoadPulse('Прогресс загружен');
    });
    return () => {
      offSaved();
      offLoaded();
    };
  }, [showManualSave, showAutoSave, showLoadPulse]);

  /** Glitch-переход при смене 3D-локации (store `lastSceneTransition`); без вспышки при первом входе в обход. */
  useEffect(() => {
    if (phase !== 'game' || gameMode !== 'exploration') {
      explorationTransitionReadyRef.current = false;
      prevSceneTransitionTsRef.current = null;
      if (explorationGlitchClearRef.current) {
        clearTimeout(explorationGlitchClearRef.current);
        explorationGlitchClearRef.current = null;
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- сброс оверлея при выходе из режима exploration
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
      explorationGlitchClearRef.current = setTimeout(() => {
        explorationGlitchClearRef.current = null;
        setExplorationSceneGlitch(false);
      }, EXPLORATION_SCENE_GLITCH_MS);
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

  const closeDialogueAndLayout = useCallback(() => {
    setExplorationDialogueLayout(false);
    closeDialogue();
  }, [closeDialogue]);

  const dialogueSubjectPosition = useMemo(() => {
    if (!activeDialogue) return null;
    const npc = getNPCById(activeDialogue.npcId);
    if (!npc) return null;
    return getNpcExplorationPosition(
      npc,
      exploration.currentSceneId,
      exploration.timeOfDay,
      exploration.npcStates[activeDialogue.npcId]?.position,
    );
  }, [
    activeDialogue,
    exploration.currentSceneId,
    exploration.timeOfDay,
    exploration.npcStates,
  ]);

  const scene = useGameScene({
    phase,
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

  const { currentNode, trackQuestNpcTalk, emitQuestEvent, runtime } = scene;

  /** Диалог из сюжета (`dialogueNpcId`) — тоже считается разговором для 📋 / `npc_talked`. */
  const openDialogueFromStoryWithQuest = useCallback(
    (p: { npcId: string; nextNodeId: string; fromNodeId: string; choiceText: string }) => {
      setExplorationDialogueLayout(useGameStore.getState().gameMode === 'exploration');
      trackQuestNpcTalk(p.npcId);
      openDialogueFromStory(p);
    },
    [trackQuestNpcTalk, openDialogueFromStory],
  );

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
      } else if (obj.mapHint) {
        markers.push({
          id: `${qid}-${obj.id}-hint`,
          position: { x: obj.mapHint.x, z: obj.mapHint.z },
          type: 'target',
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

  const explorationObjectiveLines = useMemo(
    () =>
      gameMode === 'exploration'
        ? getExplorationSceneObjectiveLines(activeQuestIds, questProgress, exploration.currentSceneId)
        : [],
    [gameMode, activeQuestIds, questProgress, exploration.currentSceneId],
  );

  useEffect(() => {
    if (!activeCutsceneId) return;
    if (!getCutsceneById(activeCutsceneId)) {
      console.warn(`[GameOrchestrator] Cutscene "${activeCutsceneId}" not found`);
      completeCutscene();
    }
  }, [activeCutsceneId, completeCutscene]);

  const handleNPCInteraction = useCallback(
    (npcId: string) => {
      setExplorationDialogueLayout(useGameStore.getState().gameMode === 'exploration');
      trackQuestNpcTalk(npcId);
      openNpcDialogue(npcId);
    },
    [trackQuestNpcTalk, openNpcDialogue],
  );

  const displaySceneId = exploration.currentSceneId;

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

  const actionsBundle = useActionHandler({
    currentNodeId,
    playerState,
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
    openDialogueFromStory: openDialogueFromStoryWithQuest,
    phase,
    gameMode,
    hasCurrentNode: Boolean(currentNode),
    currentNode,
    togglePanel,
    setPhase,
    setGameMode,
    saveGameToStore,
    loadGameFromStore,
    resetGameStore,
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

  /** Не дублировать компактный трекер 📋 со сюжетным оверлеем, заставками `AnimeCutscene` и 3D-интро. */
  const suppressQuestStrip = Boolean(activeCutsceneId) || Boolean(showStoryOverlay) || introOpening3dActive;

  useEffect(() => {
    if (phase !== 'game') return;
    return eventBus.on('cinematic:ended', ({ completionKey }) => {
      if (!completionKey || completionKey.startsWith('__transient__::')) return;
      if (!completionKey.includes('cinematic::quest::')) return;
      const state = useGameStore.getState();
      for (const questId of state.activeQuestIds) {
        const def = QUEST_DEFINITIONS[questId] ?? state.aiQuestDefinitions[questId];
        if (!def) continue;
        const next = getNextTrackedObjective(def, state.questProgress[questId] || {});
        if (next) {
          const sub = next.hint ? ` — ${next.hint}` : '';
          showEffectNotif(
            `📋 Следующий шаг: ${next.text}${sub} · ${def.title}`,
            'quest',
            7500,
          );
          return;
        }
      }
    });
  }, [phase, showEffectNotif]);

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
      <AriaLiveAnnouncer />
      <AmbientMusicPlayer
        sceneId={displaySceneId}
        mood={playerState.mood}
        stress={playerState.stress}
        creativity={playerState.creativity}
        enabled={phase === 'game' && !activeCutscene}
        forceBattleMusic={playerState.stress > 80 || displaySceneId === 'battle'}
        narrativeMusic={getWorldStateModifiers().music}
      />
      {phase === 'game' && gameMode === 'exploration' && (
        <SceneTransition
          isActive={explorationSceneGlitch}
          type="glitch"
          duration={EXPLORATION_SCENE_TRANSITION_DURATION_SEC}
          sceneTitle={getSceneConfig(exploration.currentSceneId).name}
          sceneTagline="Кинематографический переход · поток.sync"
        />
      )}

      {phase === 'game' && (
        <div className={EXPLORATION_GAME_VIEWPORT_CLASS}>
          <RPGGameCanvas
            sceneId={exploration.currentSceneId}
            visualState={explorationVisualState}
            isDialogueActive={Boolean(activeDialogue) || Boolean(activeCutsceneId)}
            dialogueSubjectPosition={dialogueSubjectPosition}
            onTriggerEnter={handleExplorationStoryTrigger}
            onNPCInteraction={handleNPCInteraction}
          />
        </div>
      )}

      {gameMode === 'exploration' && <ExplorationRackConsoleOverlay />}
      {gameMode === 'exploration' && <HackingWireMinigameOverlay />}

      {gameMode === 'exploration' && !introOpening3dActive && !activeCutsceneId && (
        <ExplorationObjectiveStrip lines={explorationObjectiveLines} />
      )}

      {gameMode === 'exploration' && !introOpening3dActive && (
        <MiniMap
          sceneSize={minimapSceneSize}
          sceneName={SCENE_VISUALS[exploration.currentSceneId]?.name ?? exploration.currentSceneId}
          npcs={minimapNpcs}
          questMarkers={minimapQuestMarkers}
        />
      )}

      {introOpening3dActive && <IntroCutsceneOverlays />}

      {phase === 'game' && <LevelUpCinematicOverlay />}
      <MoralCompassHUD />
      <LootNotification />
      <SkillUpNotification />
      <TutorialOverlay gameMode={gameMode} isDialogue={Boolean(activeDialogue)} />

      {phase === 'game' && !activeCutsceneId && <QuestTracker />}
      {phase === 'game' && <MemoryLog />}

      <HUD
        onSave={handleSaveGame}
        onTogglePanel={handleTogglePanel}
        activePanels={panels}
        suppressQuestStrip={suppressQuestStrip}
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
          explorationLayout={explorationDialogueLayout}
          npcId={activeDialogue.npcId}
          npcName={activeDialogue.npcName}
          npcRole={activeDialogue.npcRole}
          portraitUrl={activeDialogue.portraitUrl}
          holoGradientClass={activeDialogue.holoGradientClass}
          holoNeonClass={activeDialogue.holoNeonClass}
          dialogueTree={activeDialogue.node}
          storyLinked={Boolean(activeDialogue.storyResume)}
          onClose={closeDialogueAndLayout}
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

      <ItGlitchPulseOverlay />

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
        {manualSaveMsg && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-900/95 rounded-lg border border-emerald-500/50 shadow-lg"
          >
            <span className="text-white font-medium">💾 {manualSaveMsg}</span>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(autoSaveMsg || loadMsg) && (
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="fixed bottom-24 right-4 z-50 px-3 py-1.5 rounded border border-slate-600/50 bg-slate-950/80 text-[11px] font-mono tracking-wide text-slate-300 shadow-md pointer-events-none"
          >
            {autoSaveMsg ? `◆ ${autoSaveMsg}` : `◇ ${loadMsg}`}
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
              className={`px-4 py-2 backdrop-blur-sm border ${notif.type === 'energy' ? 'max-w-[min(92vw,22rem)]' : ''} ${
                notif.displayStyle === 'strong'
                  ? 'ring-1 ring-cyan-400/35 shadow-[0_0_14px_rgba(34,211,238,0.14)]'
                  : notif.displayStyle === 'subtle'
                    ? 'opacity-[0.82] py-1.5 scale-[0.98]'
                    : ''
              }`}
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
                className={`font-mono tracking-wider ${
                  notif.displayStyle === 'strong'
                    ? 'text-sm'
                    : notif.displayStyle === 'subtle'
                      ? 'text-[10px] opacity-90'
                      : 'text-xs'
                } ${notif.type === 'energy' ? 'leading-snug whitespace-normal' : ''}`}
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
      <NarrativeDebugPanel />
    </CyberGameShell>
  );
}
