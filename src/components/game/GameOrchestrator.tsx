'use client';

import { useState, useEffect, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// Types
import type { StoryChoice, StoryEffect, SceneId } from '@/data/types';

// Data
import { STORY_NODES, TITLE_TEXT, SUBTITLE_TEXT } from '@/data/storyNodes';
import { POEMS, GAME_INTRO } from '@/data/poems';
import { NPC_DEFINITIONS } from '@/data/npcDefinitions';

// Engine
import { coreLoop } from '@/engine/CoreLoop';
import { statsEngine } from '@/engine/StatsEngine';

// Hooks
import { useAutoSave } from '@/hooks/useAutoSave';
import { useEnergySystem, ENERGY_COSTS } from '@/hooks/useEnergySystem';
import { useGamePanels } from '@/hooks/useGamePanels';
import { useTimedMessage } from '@/hooks/useTimedMessage';
import { useEffectNotifications } from '@/hooks/useEffectNotifications';
import { useGameRuntime } from '@/hooks/useGameRuntime';
import { useStoryChoiceHandler } from '@/hooks/useStoryChoiceHandler';
import { useDialogueFlow } from '@/hooks/useDialogueFlow';
import { useGameSessionFlow } from '@/hooks/useGameSessionFlow';
import { usePanicFlow } from '@/hooks/usePanicFlow';
import { useGameUiLayout } from '@/hooks/useGameUiLayout';

// Components (eager)
import { IntroScreen } from './IntroScreen';
import { MenuScreen } from './MenuScreen';
import CyberLoadingScreen from './LoadingScreen';
import SceneRenderer from './SceneRenderer';
import StoryRenderer from './StoryRenderer';
import DialogueRenderer from './DialogueRenderer';
import HUD from './HUD';
import { PoemReveal } from './PoemComponents';
import { AnimeCutsceneOverlay } from './AnimeCutsceneOverlay';
import CoreLoopIndicator from './CoreLoopIndicator';
import ConsequenceNotification from './ConsequenceNotification';
import { CyberGameShell } from './CyberGameShell';

// Lazy components for panels
const QuestsPanel = dynamic(() => import('@/components/game/QuestsPanel'), { ssr: false });
const FactionsPanel = dynamic(() => import('@/components/game/FactionsPanel'), { ssr: false });
const Inventory = dynamic(() => import('@/components/game/Inventory'), { ssr: false });
const AchievementsPanel = dynamic(() => import('@/components/game/AchievementsPanel'), { ssr: false });
const PoetryBook = dynamic(() => import('@/components/game/PoetryBook'), { ssr: false });
const SkillsPanel = dynamic(() => import('@/components/SkillsPanel'), { ssr: false });
const ITTerminal = dynamic(() => import('@/components/game/ITTerminal'), { ssr: false });
const JournalPanel = dynamic(() => import('@/components/game/JournalPanel'), { ssr: false });
const LegacyScreen = dynamic(() => import('@/components/game/LegacyScreen'), { ssr: false });

// Store
import { useGameStore } from '@/store/gameStore';

// ============================================
// KERNEL PANIC OVERLAY
// ============================================

function KernelPanicOverlay({ isActive, onCalmDown }: { isActive: boolean; onCalmDown: () => void }) {
  if (!isActive) return null;

  return (
    <div className="fixed inset-0 z-[60] kernel-panic-overlay flex items-center justify-center">
      <div className="text-center p-8">
        <h2 className="text-4xl font-bold text-red-500 kernel-panic-text mb-4">
          ⚠️ KERNEL PANIC ⚠️
        </h2>
        <p className="text-red-300/80 text-lg mb-8 kernel-panic-text">
          Критический уровень стресса. Система нестабильна.
        </p>
        <button
          onClick={onCalmDown}
          className="px-8 py-3 bg-red-900/80 hover:bg-red-800/80 border border-red-600/50 text-red-200 rounded-lg text-lg transition-colors"
        >
          🧘 Успокоиться
        </button>
      </div>
    </div>
  );
}

// ============================================
// GAME ORCHESTRATOR — Main Game Component
// ============================================
// Refactored: extracted useCoreLoopPhase and useEnergySystem hooks
// to remove God Object pattern and make the Core Loop visible to the player.
// ============================================

export default function GameOrchestrator() {
  // Auto-save hook — saves every 2 min + on scene change
  useAutoSave({ intervalMs: 120_000, saveOnSceneChange: true, saveOnChoice: false });

  // Energy system hook — manages energy consumption and regeneration
  const energySystem = useEnergySystem();

  // Store selectors — OPTIMIZED with useShallow
  const actions = useGameStore(useShallow(s => ({
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
    setCurrentScene: s.setCurrentScene,
  })));
  const {
    setPhase, setCurrentNode, addStat, addStress, reduceStress, clearPanicMode,
    collectPoem, unlockAchievement, setGameMode, updateNPCRelation, setFlag,
    unsetFlag, addSkill, addItem, removeItem, activateQuest, completeQuest,
    incrementQuestObjective, updateQuestObjective, saveGame: saveGameToStore,
    loadGame: loadGameFromStore, resetGame: resetGameStore, setCurrentNPC,
    incrementPlayTime, setCurrentScene,
  } = actions;

  // Data selectors
  const phase = useGameStore(s => s.phase);
  const playerState = useGameStore(s => s.playerState);
  const currentNodeId = useGameStore(s => s.currentNodeId);
  const collectedPoems = useGameStore(s => s.collectedPoemIds);
  const unlockedAchievements = useGameStore(s => s.unlockedAchievementIds);
  const gameMode = useGameStore(s => s.gameMode);
  const npcRelations = useGameStore(s => s.npcRelations);
  const inventory = useGameStore(s => s.inventory);

  // Local state
  const [mounted, setMounted] = useState(false);
  const { panels, togglePanel } = useGamePanels();
  const { message: saveNotif, showMessage: showSaveNotif } = useTimedMessage(2000);
  const { notifications: effectNotifs, showEffectNotif } = useEffectNotifications(5, 3000);

  // Initialize — client-only mount check
  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  // Derived state
  const currentNode = useMemo(() => STORY_NODES[currentNodeId] || STORY_NODES['start'], [currentNodeId]);
  const currentSceneId = useMemo((): SceneId => (currentNode?.scene as SceneId) || 'kitchen_night', [currentNode]);
  // Dialogue store actions adapter
  const dialogueStoreActions = useMemo(() => ({
    addStat, addStress, reduceStress, setFlag, unsetFlag,
    updateNPCRelation, addItem, removeItem, activateQuest,
    updateQuestObjective, collectPoem, addSkill: (s: string, a: number) => addSkill(s as 'writing', a),
  }), [addStat, addStress, reduceStress, setFlag, unsetFlag, updateNPCRelation, addItem, removeItem, activateQuest, updateQuestObjective, collectPoem, addSkill]);

  const {
    revealedPoemId,
    closePoemReveal,
    activeCutsceneId,
    completeCutscene,
    showLegacy,
    hideLegacy,
  } = useGameRuntime({
    phase,
    currentNodeId,
    currentSceneId,
    playerState,
    npcRelations,
    collectedPoems,
    unlockedAchievements,
    dialogueStoreActions,
    incrementPlayTime,
    setCurrentScene,
    collectPoem,
    addStat,
    addSkill,
    setFlag,
    unlockAchievement,
    showEffectNotif,
  });

  // ---- Handlers ----

  const {
    activeDialogue,
    handleDialogueEffect,
    handleNPCInteraction,
    openDialogueFromStory,
    closeDialogue,
  } = useDialogueFlow({
    setCurrentNPC,
    setGameMode,
    dialogueStoreActions,
    setCurrentNode,
  });

  const { handleChoice } = useStoryChoiceHandler({
    playerSkills: playerState.skills as Record<string, number>,
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
  });

  const { showStoryPanel, handleTogglePanel } = useGameUiLayout({
    phase,
    gameMode,
    currentNodeId,
    hasCurrentNode: Boolean(currentNode),
    togglePanel,
  });

  const {
    hasSavedGame,
    handleLoadingReady,
    handleSaveGame,
    handleStartNewGame,
    handleLoadGame,
    handleIntroComplete,
  } = useGameSessionFlow({
    setPhase,
    setGameMode,
    setCurrentNode,
    saveGameToStore,
    loadGameFromStore,
    resetGameStore,
    showSaveNotif,
  });

  const { handleCalmDown } = usePanicFlow({
    clearPanicMode,
    reduceStress,
    getCurrentStress: () => useGameStore.getState().playerState.stress,
  });

  // ---- Render ----

  if (!mounted) return <div className="fixed inset-0 bg-black" />;

  // Pre-game phases
  if (phase === 'loading') return (
    <CyberLoadingScreen onReady={handleLoadingReady} />
  );
  if (phase === 'intro') return (
    <IntroScreen
      titleText={TITLE_TEXT}
      subtitleText={SUBTITLE_TEXT}
      gameIntro={GAME_INTRO}
      poems={POEMS}
      onComplete={handleIntroComplete}
    />
  );
  if (phase === 'menu') return (
    <MenuScreen
      titleText={TITLE_TEXT}
      subtitleText={SUBTITLE_TEXT}
      hasSave={hasSavedGame}
      onNewGame={handleStartNewGame}
      onContinue={handleLoadGame}
    />
  );

  // ---- Game Phase ----
  return (
    <CyberGameShell sceneId={currentSceneId} stability={playerState.stability}>
      {/* 2D Scene background */}
      <SceneRenderer
        sceneId={currentSceneId}
        playerState={playerState}
      />

      {/* Interactive NPCs for current scene */}
      <SceneNPCList sceneId={currentSceneId} onInteract={handleNPCInteraction} />

      {/* HUD overlay */}
      <HUD
        onSave={handleSaveGame}
        onTogglePanel={handleTogglePanel}
        activePanels={panels}
      />

      {/* Core Loop Phase Indicator — top right HUD element */}
      <CoreLoopIndicator />

      {/* Consequence Notifications — right side, below indicator */}
      <ConsequenceNotification />

      {/* Story panel */}
      <AnimatePresence>
        {showStoryPanel && (
          <StoryRenderer
            node={currentNode}
            onChoice={handleChoice}
          />
        )}
      </AnimatePresence>

      {/* Dialogue window */}
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
          inventory={inventory.map(i => i.item.id)}
          visitedNodes={playerState.visitedNodes}
          onEffect={handleDialogueEffect}
        />
      )}

      {/* Poem reveal */}
      <AnimatePresence>
        {revealedPoemId && (
          <PoemRevealOverlay
            poemId={revealedPoemId}
            onClose={closePoemReveal}
          />
        )}
      </AnimatePresence>

      {/* Anime cutscene */}
      <AnimatePresence>
        {activeCutsceneId && (
          <AnimeCutsceneOverlay
            key={activeCutsceneId}
            cutsceneId={activeCutsceneId}
            onComplete={completeCutscene}
          />
        )}
      </AnimatePresence>

      {/* Panel overlays */}
      <AnimatePresence>
        {panels.skills && (
          <PanelWrapper onClose={() => handleTogglePanel('skills')}>
            <SkillsPanel skills={playerState.skills} onClose={() => handleTogglePanel('skills')} />
          </PanelWrapper>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {panels.quests && <QuestsPanel onClose={() => handleTogglePanel('quests')} />}
      </AnimatePresence>
      <AnimatePresence>
        {panels.factions && <FactionsPanel onClose={() => handleTogglePanel('factions')} />}
      </AnimatePresence>
      <AnimatePresence>
        {panels.inventory && <Inventory isOpen={panels.inventory} onClose={() => handleTogglePanel('inventory')} />}
      </AnimatePresence>
      <AnimatePresence>
        {panels.achievements && <AchievementsPanel onClose={() => handleTogglePanel('achievements')} />}
      </AnimatePresence>
      <AnimatePresence>
        {panels.poetry && <PoetryBook isOpen={panels.poetry} onClose={() => handleTogglePanel('poetry')} />}
        {panels.terminal && <ITTerminal onClose={() => handleTogglePanel('terminal')} />}
        {panels.journal && (
          <JournalPanel key="journal-panel" onClose={() => handleTogglePanel('journal')} />
        )}
      </AnimatePresence>

      {/* Kernel panic overlay */}
      <KernelPanicOverlay isActive={playerState.panicMode} onCalmDown={handleCalmDown} />

      {/* Legacy screen — shown after ending */}
      {showLegacy && currentNode?.type === 'ending' && (
        <LegacyScreen
          endingType={currentNode.endingType || 'broken'}
          endingTitle={currentNode.endingTitle || 'Финал'}
          onRestart={() => {
            hideLegacy();
            resetGameStore();
          }}
        />
      )}

      {/* Save notification */}
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

      {/* Cyberpunk effect notifications (now includes 'energy' type) */}
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

      {/* Energy indicator — bottom-right subtle bar */}
      <EnergyBar energy={energySystem.energy} maxEnergy={energySystem.maxEnergy} energyLevel={energySystem.energyLevel} />
    </CyberGameShell>
  );
}

// ============================================
// SUB-COMPONENTS
// ============================================

/** Panel wrapper with backdrop */
function PanelWrapper({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 max-h-[85vh] max-w-[95vw] overflow-y-auto overflow-x-hidden">
        {children}
      </div>
    </motion.div>
  );
}

/** Poem reveal overlay */
function PoemRevealOverlay({ poemId, onClose }: { poemId: string; onClose: () => void }) {
  const poem = POEMS.find(p => p.id === poemId);
  if (!poem) return null;

  return (
    <PoemReveal
      poem={poem}
      intro={poem.intro}
      onClose={onClose}
    />
  );
}

/** Scene NPC list — clickable NPC indicators for current scene */
function SceneNPCList({ sceneId, onInteract }: { sceneId: SceneId; onInteract: (npcId: string) => void }) {
  const npcsForScene = useMemo(() => {
    return Object.values(NPC_DEFINITIONS).filter(npc => npc.sceneId === sceneId);
  }, [sceneId]);

  if (npcsForScene.length === 0) return null;

  return (
    <div className="absolute bottom-32 left-4 z-20 flex flex-col gap-2">
      {npcsForScene.map(npc => (
        <motion.button
          key={npc.id}
          onClick={() => onInteract(npc.id)}
          className="px-3 py-2 bg-slate-800/80 hover:bg-slate-700/80 backdrop-blur-sm border border-slate-600/30 rounded-lg text-sm text-slate-300 transition-all flex items-center gap-2"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="w-6 h-6 rounded-full bg-gradient-to-br from-slate-600 to-slate-700 flex items-center justify-center text-xs text-white font-bold">
            {npc.name.charAt(0)}
          </span>
          {npc.name}
        </motion.button>
      ))}
    </div>
  );
}

/** Energy bar — subtle bottom-right energy indicator */
function EnergyBar({ energy, maxEnergy, energyLevel }: {
  energy: number;
  maxEnergy: number;
  energyLevel: 'exhausted' | 'tired' | 'normal' | 'energized';
}) {
  const percentage = (energy / maxEnergy) * 100;

  const levelColor = {
    exhausted: 'bg-red-500',
    tired: 'bg-amber-500',
    normal: 'bg-cyan-400',
    energized: 'bg-emerald-400',
  }[energyLevel];

  const levelGlow = {
    exhausted: 'shadow-red-500/50',
    tired: 'shadow-amber-500/40',
    normal: 'shadow-cyan-400/30',
    energized: 'shadow-emerald-400/40',
  }[energyLevel];

  const levelLabel = {
    exhausted: 'Истощение',
    tired: 'Усталость',
    normal: 'Бодрость',
    energized: 'Энергия',
  }[energyLevel];

  return (
    <div className="fixed bottom-4 right-4 z-40 pointer-events-none select-none">
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700/30 rounded-sm"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 4px) 0, 100% 4px, 100% 100%, 4px 100%, 0 calc(100% - 4px))',
        }}
      >
        {/* Label */}
        <span className="text-[10px] font-mono text-slate-400 tracking-widest uppercase">
          {levelLabel}
        </span>

        {/* Bar container */}
        <div className="w-16 h-1.5 bg-slate-800/80 rounded-full overflow-hidden">
          <motion.div
            className={`h-full ${levelColor} rounded-full ${levelGlow}`}
            style={{ boxShadow: `0 0 6px currentColor` }}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>

        {/* Number */}
        <span className="text-[10px] font-mono text-slate-300">
          {energy}/{maxEnergy}
        </span>
      </div>
    </div>
  );
}
