'use client';

/* ─── Volodka RPG – Main game orchestrator (thin coordinator) ─── */

import { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/AudioEngine';
import { musicEngine } from '@/engine/MusicEngine';
import { SCENE_CONFIG } from '@/config/scenes';
import { AUTO_SAVE_INTERVAL_MS } from '@/data/constants';
import { STORY_NODES } from '@/data/storyNodes';
import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { getCutsceneForNode } from '@/data/cutscenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';
import { VirtualControlsContext, sharedVirtualControlsRef } from '@/engine/VirtualControlsState';
import { processExpiredTTLFlags } from '@/engine/PoemPowerSystem';

// ── GLB model preloading is handled inside GLBPlayerModel.tsx ──
// (single preload call for the player model — CesiumMan)
// Previously this file also did a duplicate preload via dynamic import,
// which was removed to avoid double-fetching the same model.

// Sub-orchestrator hooks
import { useCombatOrchestrator } from '@/hooks/useCombatOrchestrator';
import { useAudioOrchestrator } from '@/hooks/useAudioOrchestrator';
import { useInteractionOrchestrator } from '@/hooks/useInteractionOrchestrator';
import { useLoreDiscovery } from '@/hooks/useLoreDiscovery';
import { useQuestTracker } from '@/hooks/useQuestTracker';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';

// Direct imports
import { CodeBreakerGame } from './CodeBreakerGame';
import { OpenStackTerminalGame } from './OpenStackTerminalGame';
import { BashTerminalGame } from './BashTerminalGame';
import { PoetryCompositionGame } from './PoetryCompositionGame';
import { HackingGame } from './HackingGame';
import { MemoryPuzzleGame } from './MemoryPuzzleGame';
import { QuizGame } from './QuizGame';
import { RhythmGame } from './RhythmGame';
import { MenuScreen } from './MenuScreen';
import { IntroScreen } from './IntroScreen';
import { StoryRenderer } from './StoryRenderer';
import { DialogueRenderer } from './DialogueRenderer';
import { LootNotification } from './LootNotification';
import { LoadingScreen } from './LoadingScreen';
import { CombatUI } from './CombatUI';
import { NotificationToasts } from './NotificationToasts';
import { ExaminePanel } from './ExaminePanel';
import { ErrorBoundary } from '@/components/ErrorBoundary';
// ShortcutsOverlay

// Static imports — frequently-used panels & always-mounted components.
// All panels are statically imported to avoid ChunkLoadError in dev.
import { HUD } from './HUD';
import { MiniMap } from './MiniMap';
import { MoralCompassHUD } from './MoralCompassHUD';
import { TutorialOverlay } from './TutorialOverlay';
import { StressIndicator } from './StressIndicator';
import { QuickAccessToolbar } from './QuickAccessToolbar';
import { AutoSaveIndicator } from './AutoSaveIndicator';
import { AmbientSoundMixer } from './AmbientSoundMixer';
import { SceneTransitionProgress } from './SceneTransitionProgress';
import { QuickUseBar } from './QuickUseBar';
import { EventNotificationPopup } from './EventNotificationPopup';
import { WeatherAlertNotification } from './WeatherAlertNotification';
import { CraftingDiscoveryToast } from './CraftingDiscoveryToast';
import { CompassHUD } from './CompassHUD';
import { ExplorationMobileHud } from './ExplorationMobileHud';
import { QuestsPanel } from './QuestsPanel';
import { Inventory } from './Inventory';
import { PoetryBook } from './PoetryBook';
import { JournalPanel } from './JournalPanel';
import { RestPanel } from './RestPanel';
// DevPanel, SettingsPanel
import { AchievementNotification } from './AchievementNotification';
// SaveSlotManager
import { SceneTransitionOverlay } from './SceneTransitionOverlay';
// MiniGameHub, NPCRelationshipPanel, CharacterProfilePanel
import { WeatherIndicator } from './WeatherIndicator';
import { DayNightCycleIndicator } from './DayNightCycleIndicator';
// CodexPanel, DialogueHistoryPanel, AchievementDetailsPanel, SkillTreePanel
import { CraftingPanel } from './CraftingPanel';
import { TradingPanel } from './TradingPanel';
import { FloatingTextLayer } from './FloatingText';
import { InteractionHintPopup } from './InteractionHintPopup';
import { ScreenEffects } from './ScreenEffects';
// FastTravelPanel, PerksPanel, QuestBoardPanel
import { CinematicTransition } from '@/components/3d/CinematicTransition';
import { CutsceneOverlay } from '@/components/game/CutsceneOverlay';
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
import { LevelUpEffect } from '@/components/game/LevelUpEffect';
import { DirectionalDamageIndicator } from '@/components/game/DirectionalDamageIndicator';
import { PhotoMode } from '@/components/game/PhotoMode';
import { DamageNumberFloat } from '@/components/game/DamageNumberFloat';

// Dynamic import — only RPGGameCanvas needs ssr: false (WebGL canvas)
import dynamic from 'next/dynamic';

const RPGGameCanvas = dynamic(
  () => import('@/components/3d/RPGGameCanvas').then((m) => m.RPGGameCanvas),
  { ssr: false, loading: () => <div className="fixed inset-0 bg-black" style={{ zIndex: 100 }} /> },
);

/* ── Static imports — all panels loaded eagerly to avoid ChunkLoadError ── */
/* Previously these were React.lazy() for code-splitting, but the dev server ── */
/* OOMs after first compilation, causing subsequent chunk requests to fail.  ── */
import { ShortcutsOverlay } from './ShortcutsOverlay';
import { DevPanel } from './DevPanel';
import { SettingsPanel } from './SettingsPanel';
import { SaveSlotManager } from './SaveSlotManager';
import { MiniGameHub } from './MiniGameHub';
import { NPCRelationshipPanel } from './NPCRelationshipPanel';
import { CharacterProfilePanel } from './CharacterProfilePanel';
import { CodexPanel } from './CodexPanel';
import { DialogueHistoryPanel } from './DialogueHistoryPanel';
import { AchievementDetailsPanel } from './AchievementDetailsPanel';
import { SkillTreePanel } from './SkillTreePanel';
import { FastTravelPanel } from './FastTravelPanel';
import { PerksPanel } from './PerksPanel';
import { QuestBoardPanel } from './QuestBoardPanel';
import { PlayerStatsPanel } from './PlayerStatsPanel';



/* ── Helper: Auto-skip intro via useEffect (avoids render-phase mutation) ── */
function IntroAutoSkip() {
  const introSeen = useGameStore((s) => s.introSeen);
  const mode = useGameStore((s) => s.mode);

  useEffect(() => {
    if (mode === 'intro' && introSeen) {
      useGameStore.getState().setMode('exploration');
    }
  }, [mode, introSeen]);

  return null;
}

/* ── Panel state types & reducer (P0-2.5) ── */
type PanelType = 'quests' | 'inventory' | 'poetry' | 'menu' | 'rest' | 'shortcuts' | 'settings' | 'saveSlot' | 'miniGameHub' | 'npcRelation' | 'characterProfile' | 'codex' | 'dialogueHistory' | 'achievements' | 'skillTree' | 'crafting' | 'trading' | 'fastTravel' | 'perks' | 'questBoard' | 'stats' | null;

function panelReducer(prev: PanelType, next: PanelType): PanelType {
  return prev === next ? null : next;
}

/* ── Component ── */
export function GameOrchestrator() {
  const mode = useGameStore((s) => s.mode);
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const introSeen = useGameStore((s) => s.introSeen);

  // Compute which overlay is active to enforce mutual exclusivity
  const isDialogueActive = mode === 'visual-novel' && !!DIALOGUE_NODES[currentNodeId];
  const isStoryActive = showStoryOverlay && !!STORY_NODES[currentNodeId];
  const isOverlayActive = isDialogueActive || isStoryActive;

  // ── Sub-orchestrators ──
  const { startCombatFromStory } = useCombatOrchestrator();
  useAudioOrchestrator();
  const interaction = useInteractionOrchestrator(startCombatFromStory);
  useLoreDiscovery();
  useQuestTracker();
  useAchievementChecker();

  // Destructure interaction state for convenience
  const {
    codebreakerOpen, setCodebreakerOpen,
    openstackTerminalOpen, setOpenstackTerminalOpen,
    bashTerminalOpen, setBashTerminalOpen,
    poetryGameOpen, setPoetryGameOpen,
    hackingGameOpen, setHackingGameOpen,
    memoryGameOpen, setMemoryGameOpen,
    quizGameOpen, setQuizGameOpen,
    rhythmGameOpen, setRhythmGameOpen,
    examineOpen, setExamineOpen,
    examineData, setExamineData,
    examineHasLinkedContent, setExamineHasLinkedContent,
    handleExamineContinue,
    clearPendingTriggerZone,
  } = interaction;

  // ── Mode transition overlay — persistent black backdrop that fades only when
  //    the 3D canvas signals it has rendered its first valid frame ──
  // Uses refs instead of state to avoid cascading re-renders:
  //   setCanvasReady(false) → canvas:first-frame → setCanvasReady(true) →
  //   setIsTransitioning(false) → mode change effect → setCanvasReady(false) → LOOP
  //   By using refs, we break the cycle — React state changes only once (isTransitioning).
  const [isTransitioning, setIsTransitioning] = useState(false);
  const canvasReadyRef = useRef(false);
  const prevModeRef = useRef(mode);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for canvas:first-frame event — sets ref, triggers fade-out
  useEffect(() => {
    const unsub = eventBus.on('canvas:first-frame', () => {
      if (!canvasReadyRef.current && isTransitioning) {
        canvasReadyRef.current = true;
        // Clear fallback timer
        if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
        // Start fade-out
        if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = setTimeout(() => setIsTransitioning(false), 300);
      }
      canvasReadyRef.current = true;
    });
    return unsub;
  }, [isTransitioning]);

  useEffect(() => {
    if (mode !== prevModeRef.current) {
      const prevMode = prevModeRef.current;
      prevModeRef.current = mode;

      // Clear previous timers
      if (fallbackTimerRef.current) clearTimeout(fallbackTimerRef.current);
      if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);

      // For non-exploration mode changes (light transitions), use a short timer
      if (mode !== 'exploration' && mode !== 'visual-novel' && mode !== 'cutscene' && mode !== 'combat') {
        const timer = setTimeout(() => setIsTransitioning(false), 300);
        return () => clearTimeout(timer);
      }

      // When transitioning FROM menu TO cutscene/exploration, the canvas
      // was previously hidden and may need a fresh first-frame signal. Reset
      // canvasReadyRef so we wait for the canvas to actually render before
      // removing the transition overlay. This prevents showing a blank/black
      // frame when the 3D scene hasn't rendered yet.
      // NOTE: 'intro' mode is excluded because the canvas is now visible
      // during intro (so PhaseWaking can reveal it). No need to reset.
      const isComingFromHiddenCanvas = prevMode === 'menu';
      if (isComingFromHiddenCanvas) {
        canvasReadyRef.current = false;
      }

      // Check if canvas is already ready (e.g. already rendered a frame)
      // This avoids unnecessary transition overlay for mode changes when canvas is already visible
      if (canvasReadyRef.current) {
        // Canvas already rendered — minimal transition
        setIsTransitioning(true);
        fadeOutTimerRef.current = setTimeout(() => setIsTransitioning(false), 300);
        return;
      }

      // Canvas not ready yet — show overlay until first frame
      canvasReadyRef.current = false;
      setIsTransitioning(true);

      // SAFETY: Fallback timer — if canvas:first-frame never fires,
      // force-remove the overlay after 1.0s (reduced from 1.5s to minimize
      // the visible "stuck on black" time that players see as a "timeout").
      fallbackTimerRef.current = setTimeout(() => {
        console.warn('[GameOrchestrator] Canvas first-frame timeout — forcing transition overlay off');
        canvasReadyRef.current = true;
        if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = setTimeout(() => setIsTransitioning(false), 200);
      }, CUTSCENE_TIMINGS.CANVAS_TIMEOUT_MS);
    }
  }, [mode]);

  // ── Cutscene trigger: watch for story node changes ──
  const cutsceneOverlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cutsceneEndTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!currentNodeId) return;

    const cutscene = getCutsceneForNode(currentNodeId);
    if (!cutscene) return;

    // Don't trigger the same cutscene twice
    const store = useGameStore.getState();
    if (store.triggeredCutscenes.includes(cutscene.id)) return;
    store.markCutsceneTriggered(cutscene.id);

    // Trigger the cutscene: set store state + emit events

    // Switch to cutscene mode — this locks player movement and enables camera control
    store.setMode('cutscene');

    // Set cutscene camera waypoints in the store
    store.setCutscene(cutscene.id, cutscene.waypoints);

    // Emit camera cutscene start event for the 3D camera system
    eventBus.emit('camera:cutscene_start', {
      cutsceneId: cutscene.id,
      waypoints: cutscene.waypoints,
    });

    // Show the text overlay after a brief delay (let fade-to-black start first)
    cutsceneOverlayTimerRef.current = setTimeout(() => {
      eventBus.emit('cutscene:overlay', {
        text: cutscene.textOverlay,
        subtitle: cutscene.subtitle,
        accentColor: cutscene.textAccentColor,
        durationMs: cutscene.textDurationMs,
        type: cutscene.type,
        letterboxStyle: cutscene.letterboxStyle,
        showEmbers: cutscene.showEmbers,
        glitchIntensity: cutscene.glitchIntensity,
      });
    }, 800);

    // Play a dramatic stinger based on cutscene type
    if (cutscene.type === 'revelation') {
      audioEngine.playStinger('discovery');
    } else if (cutscene.type === 'character_intro') {
      audioEngine.playStinger('emotional');
    } else {
      audioEngine.playStinger('mystery');
    }

    // Return to previous mode after the cutscene text + camera finish
    // Text duration + buffer for camera animation to complete
    const totalDuration = cutscene.textDurationMs + 2000;

    // Determine which mode to return to after cutscene:
    // - For character_intro / story_moment / revelation: return to visual-novel so story text is shown
    // - For act_transition: return to exploration (story was already read before transition)
    const returnMode = (cutscene.type === 'character_intro' || cutscene.type === 'story_moment' || cutscene.type === 'revelation')
      ? 'visual-novel' as const
      : 'exploration' as const;

    cutsceneEndTimerRef.current = setTimeout(() => {
      // Only switch back if we're still in cutscene mode
      // (player might have triggered another mode change)
      const currentStore = useGameStore.getState();
      if (currentStore.mode === 'cutscene') {
        // Clear cutscene state
        currentStore.setCutscene(null, []);
        // Return to the appropriate mode
        currentStore.setMode(returnMode);
        // For story-driven cutscenes, show the story overlay so the player can read the narrative
        if (returnMode === 'visual-novel') {
          currentStore.setShowStoryOverlay(true);
        }
      }
    }, totalDuration);

    // Cleanup: clear timers on unmount or if currentNodeId changes before
    // the cutscene finishes — prevents stuck cutscene mode
    return () => {
      if (cutsceneOverlayTimerRef.current) {
        clearTimeout(cutsceneOverlayTimerRef.current);
        cutsceneOverlayTimerRef.current = null;
      }
      if (cutsceneEndTimerRef.current) {
        clearTimeout(cutsceneEndTimerRef.current);
        cutsceneEndTimerRef.current = null;
      }
    };
  }, [currentNodeId]);

  // Panel states (local to orchestrator — coordinate between sub-orchestrators)
  // P0-2.5: Single useReducer replaces 14 independent useState calls for panel open/close.
  // Only one panel can be active at a time (mutual exclusivity), so a single union type
  // is sufficient. dispatchPanel toggles: same value → null (close), different value → switch.
  const [activePanel, dispatchPanel] = useReducer(panelReducer, null as PanelType);

  // Derive boolean variables from activePanel for readability
  const questsOpen = activePanel === 'quests';
  const inventoryOpen = activePanel === 'inventory';
  const poetryOpen = activePanel === 'poetry';
  const menuOpen = activePanel === 'menu';
  const restOpen = activePanel === 'rest';
  const shortcutsOpen = activePanel === 'shortcuts';
  const settingsOpen = activePanel === 'settings';
  const saveSlotOpen = activePanel === 'saveSlot';
  const miniGameHubOpen = activePanel === 'miniGameHub';
  const npcRelationOpen = activePanel === 'npcRelation';
  const characterProfileOpen = activePanel === 'characterProfile';
  const codexOpen = activePanel === 'codex';
  const dialogueHistoryOpen = activePanel === 'dialogueHistory';
  const achievementsOpen = activePanel === 'achievements';
  const skillTreeOpen = activePanel === 'skillTree';
  const craftingOpen = activePanel === 'crafting';
  const tradingOpen = activePanel === 'trading';
  const fastTravelOpen = activePanel === 'fastTravel';
  const perksOpen = activePanel === 'perks';
  const questBoardOpen = activePanel === 'questBoard';
  const statsOpen = activePanel === 'stats';

  // ── Close all panels (used for mutual exclusivity) ──
  const closeAllPanels = useCallback(() => {
    dispatchPanel(null);
    useGameStore.getState().setJournalOpen(false);
  }, []);

  // ── Mutual exclusivity: close ExaminePanel and other overlays when dialogue/story opens ──
  useEffect(() => {
    if (isOverlayActive) {
      // Close examine panel when dialogue/story becomes active
      setExamineOpen(false);
      setExamineData(null);
      setExamineHasLinkedContent(false);
      // Close mini-games too
      setCodebreakerOpen(false);
      setOpenstackTerminalOpen(false);
      setBashTerminalOpen(false);
      setPoetryGameOpen(false);
      setHackingGameOpen(false);
      setMemoryGameOpen(false);
      setQuizGameOpen(false);
      setRhythmGameOpen(false);
      // Close all panels — dialogue/story takes priority
      closeAllPanels();
    }
  }, [isOverlayActive, closeAllPanels]);

  // ── Close lower overlays when panels (inventory/journal/quests/poetry) open ──
  useEffect(() => {
    if (activePanel !== null || useGameStore.getState().journalOpen) {
      setExamineOpen(false);
      setExamineData(null);
      setExamineHasLinkedContent(false);
    }
  }, [activePanel]);

  // Scene transition tracking
  const prevSceneId = useRef(useGameStore.getState().exploration.currentSceneId);

  // Mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(typeof window !== 'undefined' && window.innerWidth < 1024);
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scene name banner
  const [sceneBanner, setSceneBanner] = useState<string | null>(null);
  const sceneBannerTimeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // ── Scene transition glitch (via EventBus) ──
  useEffect(() => {
    const unsub = useGameStore.subscribe((state) => {
      const newScene = state.exploration.currentSceneId;
      if (newScene !== prevSceneId.current) {
        prevSceneId.current = newScene;

        // Trigger glitch effect via EventBus instead of local state
        eventBus.emit('fx:glitch', { duration: 300, intensity: 0.5 });

        // Auto-regen between scenes
        useGameStore.getState().autoRegenBetweenScenes();

        // Auto-discover the scene for fast travel
        useGameStore.getState().discoverScene(newScene);

        // Show scene name banner
        const sceneName = SCENE_CONFIG[newScene]?.name ?? '';
        if (sceneName) {
          if (sceneBannerTimeout.current) clearTimeout(sceneBannerTimeout.current);
          setSceneBanner(sceneName);
          sceneBannerTimeout.current = setTimeout(() => setSceneBanner(null), 2500);
        }
      }
    });
    return () => {
      unsub();
      if (sceneBannerTimeout.current) clearTimeout(sceneBannerTimeout.current);
    };
  }, []);

  // ── EventBus lifecycle: DO NOT dispose on unmount ──
  // eventBus is a global singleton shared by ALL systems (QuestTracker, CombatSystem, etc).
  // Disposing it here would clear ALL subscribers from ALL components — catastrophic.
  // Each useEffect subscription already returns its own unsub for proper cleanup.

  // ── MusicEngine cleanup on unmount (P1-3.5) ──
  useEffect(() => {
    return () => {
      musicEngine.dispose();
    };
  }, []);

  // ── Auto-save timer (only in exploration mode — never during combat, cutscenes, or menus) ──
  useEffect(() => {
    if (mode !== 'exploration') return;

    const interval = setInterval(() => {
      const store = useGameStore.getState();
      // Double-check we're still in exploration (mode may have changed between ticks)
      if (store.mode !== 'exploration') return;
      store.saveGame({ source: 'auto' });
    }, AUTO_SAVE_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [mode]);

  // ── Auto-save on scene transition ──
  useEffect(() => {
    const unsub = eventBus.on('scene:enter', () => {
      const store = useGameStore.getState();
      // Only auto-save on scene entry when in exploration mode
      if (store.mode === 'exploration') {
        store.saveGame({ source: 'auto' });
      }
    });
    return unsub;
  }, []);

  // ── Auto-save after combat ends (L-02) ──
  // Save on combat:end (not combat:victory) so mode is exploration/visual-novel,
  // not combat — saving during victory left mode=combat and softlocked on reload.
  useEffect(() => {
    const unsub = eventBus.on('combat:end', () => {
      const store = useGameStore.getState();
      if (store.mode === 'combat') return;
      store.saveGame({ source: 'auto' });
    });
    return unsub;
  }, []);

  // ── TTL flag cleanup (PoemPowerSystem) — runs once per second ──
  useEffect(() => {
    const ttlInterval = setInterval(() => {
      processExpiredTTLFlags();
    }, 1000);

    return () => clearInterval(ttlInterval);
  }, []);

  // ── Keyboard shortcuts (stable listener — no dependency churn) ──
  // Keep a ref in sync with all panel states so the keydown handler
  // (registered once) always reads fresh values without needing them
  // as useEffect dependencies. This avoids removing/re-adding the
  // listener on every panel toggle.
  const panelStateRef = useRef({
    activePanel,
    codebreakerOpen, openstackTerminalOpen, bashTerminalOpen, poetryGameOpen, hackingGameOpen, memoryGameOpen, quizGameOpen, rhythmGameOpen,
    examineOpen, mode,
  });
  panelStateRef.current = {
    activePanel,
    codebreakerOpen, openstackTerminalOpen, bashTerminalOpen, poetryGameOpen, hackingGameOpen, memoryGameOpen, quizGameOpen, rhythmGameOpen,
    examineOpen, mode,
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      // Read latest panel state from ref (always up-to-date)
      const ps = panelStateRef.current;

      // ── Panel toggles with mutual exclusivity ──
      // dispatchPanel handles toggle (same value → null) and mutual exclusivity (different value → switch).
      if (e.code === 'KeyJ') {
        const store = useGameStore.getState();
        if (!store.journalOpen) dispatchPanel(null);
        store.toggleJournal();
      }
      if (e.code === 'KeyQ') { dispatchPanel('quests'); }
      if (e.code === 'KeyI' || e.code === 'Tab') { e.preventDefault(); dispatchPanel('inventory'); }
      if (e.code === 'KeyP' && !e.ctrlKey && !e.shiftKey) { eventBus.emit('photo:toggle', {}); }
      if (e.code === 'KeyP' && e.shiftKey) { e.preventDefault(); dispatchPanel('poetry'); }
      if (e.code === 'KeyM') { dispatchPanel('miniGameHub'); }
      if (e.code === 'KeyN') { dispatchPanel('npcRelation'); }
      if (e.code === 'KeyC') { dispatchPanel('characterProfile'); }
      if (e.code === 'KeyK') { dispatchPanel('codex'); }
      if (e.code === 'KeyL') { dispatchPanel('dialogueHistory'); }
      if (e.code === 'KeyH') { dispatchPanel('achievements'); }
      if (e.code === 'KeyT' && !e.shiftKey) { dispatchPanel('skillTree'); }
      if (e.code === 'KeyG') { dispatchPanel('crafting'); }
      if (e.code === 'KeyF') { dispatchPanel('fastTravel'); }
      if (e.code === 'KeyV') { dispatchPanel('perks'); }
      if (e.code === 'KeyB') { dispatchPanel('questBoard'); }
      if (e.code === 'KeyS' && e.shiftKey && !e.ctrlKey) { e.preventDefault(); dispatchPanel('stats'); }
      if (e.shiftKey && e.code === 'KeyT') { e.preventDefault(); dispatchPanel('trading'); }
      if (e.code === 'KeyR') {
        const store = useGameStore.getState();
        if (store.exploration.currentSceneId === 'volodka_room' || store.exploration.currentSceneId === 'home_evening') {
          dispatchPanel('rest');
        }
      }
      if (e.code === 'F1' || (e.code === 'Slash' && e.shiftKey)) {
        e.preventDefault();
        dispatchPanel('shortcuts');
      }
      if (e.code === 'Escape') {
        // ── Skip cutscene on ESC ── (L-01)
        const store = useGameStore.getState();
        if (store.mode === 'cutscene') {
          // Clear any pending cutscene timers
          if (cutsceneOverlayTimerRef.current) { clearTimeout(cutsceneOverlayTimerRef.current); cutsceneOverlayTimerRef.current = null; }
          if (cutsceneEndTimerRef.current) { clearTimeout(cutsceneEndTimerRef.current); cutsceneEndTimerRef.current = null; }
          // Clear cutscene state and return to exploration
          store.setCutscene(null, []);
          store.setMode('exploration');
          eventBus.emit('cutscene:overlay_end', {});
          eventBus.emit('camera:cutscene_end', {});
          return;
        }
        // Close any active panel (managed by useReducer — mutual exclusivity)
        if (ps.activePanel !== null) { dispatchPanel(null); return; }
        // Close journal (managed by gameStore)
        if (store.journalOpen) {
          store.setJournalOpen(false);
        } else if (ps.examineOpen) {
          setExamineOpen(false); setExamineData(null); setExamineHasLinkedContent(false);
        }
        else if (ps.codebreakerOpen) setCodebreakerOpen(false);
        else if (ps.openstackTerminalOpen) setOpenstackTerminalOpen(false);
        else if (ps.bashTerminalOpen) setBashTerminalOpen(false);
        else if (ps.poetryGameOpen) setPoetryGameOpen(false);
        else if (ps.hackingGameOpen) setHackingGameOpen(false);
        else if (ps.memoryGameOpen) setMemoryGameOpen(false);
        else if (ps.quizGameOpen) setQuizGameOpen(false);
        else if (ps.rhythmGameOpen) setRhythmGameOpen(false);
        else if (ps.mode === 'exploration') dispatchPanel('menu');
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []); // dispatchPanel is stable (from useReducer); all other reads use refs

  // ── HUD callbacks (with mutual exclusivity) ──
  const handleOpenQuests = useCallback(() => { dispatchPanel('quests'); useGameStore.getState().setJournalOpen(false); }, []);
  const handleOpenInventory = useCallback(() => { dispatchPanel('inventory'); useGameStore.getState().setJournalOpen(false); }, []);
  const handleOpenPoetry = useCallback(() => { dispatchPanel('poetry'); useGameStore.getState().setJournalOpen(false); }, []);
  const handleOpenPoetryBook = useCallback(() => {
    dispatchPanel('poetry');
    useGameStore.getState().setJournalOpen(false);
  }, []);
  const handleToggleTutorials = useCallback(() => {
    const store = useGameStore.getState();
    store.setFlag('tutorialsDisabled', !store.tutorialFlags.tutorialsDisabled);
  }, []);
  const handleOpenMenu = useCallback(() => dispatchPanel('menu'), []);

  // ── Render ──
  return (
    <VirtualControlsContext.Provider value={sharedVirtualControlsRef}>
    <div className="fixed inset-0 bg-black overflow-hidden" style={{ touchAction: 'none' }}>
      <>
          {/* ── Mode transition overlay — persistent black backdrop that ONLY fades
              when the 3D canvas has rendered its first valid frame ── */}
          <AnimatePresence>
            {isTransitioning && (
              <motion.div
                key="mode-transition"
                className="fixed inset-0 bg-black"
                style={{ zIndex: UI_LAYERS.LOADING }}
                initial={{ opacity: 1 }}
                animate={{ opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
              />
            )}
          </AnimatePresence>

          {/* ── Menu mode ── */}
          {mode === 'menu' && <MenuScreen />}

          {/* ── Initial loading — canvas warming up ── */}
          {mode === 'menu' && !canvasReadyRef.current && (
            <LoadingScreen showTitle={true} message="Инициализация..." />
          )}

          {/* ── Intro mode — skip if already seen ── */}
          {mode === 'intro' && !introSeen && <IntroScreen />}
          {mode === 'intro' && introSeen && (
            <div className="fixed inset-0 bg-black" style={{ zIndex: UI_LAYERS.LOADING }} />
          )}
          {/* ── Intro auto-skip effect ── */}
          <IntroAutoSkip />

          {/* ── 3D Canvas — ALWAYS MOUNTED, hidden with CSS when not needed ──
              CRITICAL: We must NOT conditionally render RPGGameCanvas, because
              unmounting destroys the WebGL context, and remounting creates a new one.
              This causes white screen: old context is gone, new one may fail to
              initialize (race condition with EffectComposer, postprocessing, etc.).
              Instead, we use CSS visibility/opacity to hide the canvas when not
              in exploration/combat/cutscene/visual-novel mode. The Canvas keeps
              its WebGL context alive across mode transitions.

              NOTE: Canvas is also visible during 'intro' mode so that the
              PhaseWaking cutscene can reveal the 3D scene through its fading
              overlay WITHOUT switching mode to 'cutscene'. Previously, switching
              to cutscene unmounted IntroScreen, which cleared PhaseWaking's
              stage-5 timer — the game got stuck forever in cutscene mode. ── */}
          <div
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: UI_LAYERS.CANVAS,
              visibility: (mode === 'exploration' || mode === 'visual-novel' || mode === 'cutscene' || mode === 'combat' || mode === 'intro') ? 'visible' : 'hidden',
              pointerEvents: (mode === 'exploration' || mode === 'visual-novel' || mode === 'cutscene' || mode === 'combat') ? 'auto' : 'none',
            }}
          >
            <RPGGameCanvas />
          </div>

          {/* ── Exploration / visual-novel / cutscene / combat UI layers ── */}
          {(mode === 'exploration' || mode === 'visual-novel' || mode === 'cutscene' || mode === 'combat') && (
            <>
              {/* ── Global notification toasts ── */}
              <NotificationToasts />

              {/* ── Event notification popups (combat, scene, quest, achievement) ── */}
              <EventNotificationPopup />

              {/* ── Weather alert notifications ── */}
              <WeatherAlertNotification />

              {/* ── Crafting discovery toast ── */}
              <CraftingDiscoveryToast />

              {/* ── Floating text numbers (XP, karma, damage, etc.) ── */}
              <FloatingTextLayer />

              {/* ── Interaction hint popup (contextual action hints near interactive objects) ── */}
              <InteractionHintPopup />

              {/* ── Screen effects (flash, shake, vignette, chromatic aberration) ── */}
              <ScreenEffects />

              {/* Cinematic transition overlay (fade to black / fade in) — renders OUTSIDE canvas */}
              <CinematicTransition />

              {/* Cutscene text overlay — shows act transition text during cutscenes */}
              <CutsceneOverlay />

              {/* Scene name banner — animated fade in/out */}
              <AnimatePresence>
                {sceneBanner && (
                  <motion.div
                    key={sceneBanner}
                    className="fixed inset-0 flex items-center justify-center pointer-events-none"
                    style={{ zIndex: UI_LAYERS.SCENE_BANNER }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                  >
                    <motion.div
                      className="px-12 py-6 rounded-lg"
                      style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        background: 'rgba(0, 0, 0, 0.35)',
                      }}
                      initial={{ scale: 0.9, y: 10 }}
                      animate={{ scale: 1, y: 0 }}
                      exit={{ scale: 1.05, y: -5 }}
                      transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
                    >
                      <motion.h2
                        className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-wider text-center"
                        style={{
                          fontFamily: '"Georgia", "Times New Roman", serif',
                          color: 'rgba(220, 230, 250, 0.9)',
                          textShadow: '0 0 30px rgba(150, 180, 255, 0.3), 0 0 60px rgba(100, 130, 200, 0.15)',
                        }}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.6, ease: 'easeOut' }}
                      >
                        {sceneBanner}
                      </motion.h2>
                      {/* Decorative line below scene name */}
                      <motion.div
                        className="mt-3 mx-auto w-24 h-px"
                        style={{
                          background: 'linear-gradient(90deg, transparent, rgba(150, 180, 255, 0.4), transparent)',
                        }}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: 1 }}
                        exit={{ scaleX: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                      />
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Stress indicator */}
              <StressIndicator />

              {/* Quick use bar — consumable slots above toolbar */}
              <QuickUseBar />

              {/* Quick access toolbar — compact stat bars at bottom center */}
              <QuickAccessToolbar />

              {/* Auto-save indicator — bottom-right corner */}
              <AutoSaveIndicator />

              {/* Ambient sound mixer — above AutoSaveIndicator, exploration only */}
              {mode === 'exploration' && <AmbientSoundMixer />}

              {/* Scene transition progress bar — top of screen */}
              <SceneTransitionProgress />

              {/* Compass HUD — top center, exploration only */}
              <CompassHUD />

              {/* HUD — always visible during exploration, even when story/dialogue overlays are active */}
              {mode === 'exploration' && (
                <>
                  <HUD
                    onOpenQuests={handleOpenQuests}
                    onOpenInventory={handleOpenInventory}
                    onOpenPoetry={handleOpenPoetry}
                    onToggleTutorials={handleToggleTutorials}
                    onOpenMenu={handleOpenMenu}
                    onOpenMiniGames={() => dispatchPanel('miniGameHub')}
                    onOpenCharacterProfile={() => dispatchPanel('characterProfile')}
                    onOpenNPCRelations={() => dispatchPanel('npcRelation')}
                    onOpenCodex={() => dispatchPanel('codex')}
                    onOpenDialogueHistory={() => dispatchPanel('dialogueHistory')}
                    onOpenAchievements={() => dispatchPanel('achievements')}
                    onOpenSkillTree={() => dispatchPanel('skillTree')}
                    onOpenCrafting={() => dispatchPanel('crafting')}
                    onOpenTrading={() => dispatchPanel('trading')}
                    onOpenFastTravel={() => dispatchPanel('fastTravel')}
                    onOpenPerks={() => dispatchPanel('perks')}
                    onOpenQuestBoard={() => dispatchPanel('questBoard')}
                    onOpenStats={() => dispatchPanel('stats')}
                  />
                  <MiniMap />
                  <MoralCompassHUD />
                  <WeatherIndicator />
                  <DayNightCycleIndicator />
                  <TutorialOverlay />
                  {/* Poetry Power quick-bar — action bar for poem powers */}
                  <PoetryPowerBar />
                </>
              )}

              {/* Player stats panel — slide-in from left (toggle with S key) */}
              <PlayerStatsPanel open={statsOpen} onClose={() => dispatchPanel(null)} />

              {/* Poem power visual effects — visible in all game modes */}
              <PoemPowerEffect />

              {/* Level-up full-screen effect — visible in all game modes */}
              <LevelUpEffect />

              {/* Directional damage/heal indicators — red flash on damage, emerald on heal */}
              <DirectionalDamageIndicator />

              {/* Photo mode — screenshot capture with viewfinder overlay */}
              <PhotoMode />

              {/* Floating damage/heal numbers — combat & exploration */}
              <DamageNumberFloat />

              {/* Mobile controls — always visible during exploration */}
              {mode === 'exploration' && isMobile && <ExplorationMobileHud onOpenInventory={handleOpenInventory} />}

              {/* Story overlay — mutually exclusive with dialogue */}
              {!isDialogueActive && (
                <ErrorBoundary name="story">
                  <StoryRenderer />
                </ErrorBoundary>
              )}

              {/* Dialogue overlay — mutually exclusive with story */}
              {!isStoryActive && (
                <ErrorBoundary name="dialogue">
                  <DialogueRenderer />
                </ErrorBoundary>
              )}

              {/* Loot notifications */}
              <LootNotification />

              {/* Mini-games */}
              <AnimatePresence>
                {codebreakerOpen && (
                  <CodeBreakerGame onClose={() => setCodebreakerOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {openstackTerminalOpen && (
                  <OpenStackTerminalGame onClose={() => setOpenstackTerminalOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {bashTerminalOpen && (
                  <BashTerminalGame onClose={() => setBashTerminalOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {poetryGameOpen && (
                  <PoetryCompositionGame onClose={() => setPoetryGameOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {hackingGameOpen && (
                  <HackingGame onClose={() => setHackingGameOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {memoryGameOpen && (
                  <MemoryPuzzleGame onClose={() => setMemoryGameOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {quizGameOpen && (
                  <QuizGame onClose={() => setQuizGameOpen(false)} />
                )}
              </AnimatePresence>
              <AnimatePresence>
                {rhythmGameOpen && (
                  <RhythmGame onClose={() => setRhythmGameOpen(false)} />
                )}
              </AnimatePresence>

              {/* Combat UI overlay */}
              <ErrorBoundary name="combat">
                <CombatUI />
              </ErrorBoundary>

              {/* Examine Panel */}
              <ExaminePanel
                open={examineOpen}
                data={examineData}
                hasLinkedContent={examineHasLinkedContent}
                onContinue={handleExamineContinue}
                onClose={() => {
                  setExamineOpen(false); setExamineData(null); setExamineHasLinkedContent(false);
                  // Clear pending trigger zone so it doesn't trigger later
                  clearPendingTriggerZone();
                }}
              />
            </>
          )}

          {/* ── Panels ── */}
          {questsOpen && <QuestsPanel open={questsOpen} onClose={() => dispatchPanel(null)} />}
          {inventoryOpen && (
            <ErrorBoundary name="inventory">
              <Inventory open={inventoryOpen} onClose={() => dispatchPanel(null)} onOpenPoetryBook={handleOpenPoetryBook} />
            </ErrorBoundary>
          )}
          {poetryOpen && <PoetryBook open={poetryOpen} onClose={() => dispatchPanel(null)} />}

          {/* ── Crafting Panel ── */}
          <CraftingPanel open={craftingOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Trading Panel ── */}
          <TradingPanel open={tradingOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Fast Travel Panel ── */}
          <FastTravelPanel open={fastTravelOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Rest Panel ── */}
          <RestPanel open={restOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Journal Panel ── */}
          <JournalPanel />

          {/* ── Pause menu ── */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 flex items-center justify-center"
                style={{ zIndex: UI_LAYERS.MENU }}
              >
                <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => dispatchPanel(null)} />
                <motion.div
                  initial={{ scale: 0.95, y: 10 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 10 }}
                  transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                  className="relative z-10 w-80 bg-slate-950/95 border border-cyan-500/20 p-0 backdrop-blur-md overflow-hidden"
                  style={{
                    clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
                    boxShadow: '0 0 40px rgba(0, 255, 255, 0.06), 0 8px 32px rgba(0, 0, 0, 0.5), inset 0 1px 0 rgba(255,255,255,0.03)',
                  }}
                >
                  {/* Header with terminal style */}
                  <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
                    <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
                    <span className="h-2 w-2 rounded-full bg-amber-400/80" />
                    <span className="h-2 w-2 rounded-full bg-red-500/80" />
                    <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://pause</span>
                  </div>

                  <div className="p-5 flex flex-col gap-2.5">
                    <h2 className="text-lg font-semibold text-slate-100 mb-1 font-mono tracking-wide">ПАУЗА</h2>
                    <button
                      onClick={() => {
                        useGameStore.getState().saveGame({ source: 'manual' });
                        dispatchPanel(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-cyan-500">💾</span> Быстрое сохранение
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('saveSlot');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 hover:border-cyan-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-cyan-500">📂</span> Управление сохранениями
                    </button>
                    <button
                      onClick={() => {
                        useGameStore.getState().loadGame();
                        dispatchPanel(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-700/40 bg-slate-900/30 text-slate-300 hover:bg-slate-800/30 hover:border-slate-600/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-slate-400">📂</span> Загрузить
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('characterProfile');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-emerald-800/40 bg-emerald-950/30 text-emerald-300 hover:bg-emerald-900/30 hover:border-emerald-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-emerald-500">👤</span> Профиль персонажа
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('npcRelation');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-violet-800/40 bg-violet-950/30 text-violet-300 hover:bg-violet-900/30 hover:border-violet-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-violet-500">👥</span> Отношения
                    </button>
                    <button
                      onClick={() => {
                        dispatchPanel('settings');
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-amber-800/40 bg-amber-950/30 text-amber-300 hover:bg-amber-900/30 hover:border-amber-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-amber-500">⚙</span> Настройки
                    </button>
                    <div className="h-px bg-slate-800/50 my-1" />
                    <button
                      onClick={() => {
                        useGameStore.getState().resetGame();
                        dispatchPanel(null);
                      }}
                      className="w-full px-4 py-2.5 rounded-lg border border-rose-800/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/30 hover:border-rose-700/50 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-rose-500">⏻</span> В главное меню
                    </button>
                    <button
                      onClick={() => dispatchPanel(null)}
                      className="w-full px-4 py-2.5 rounded-lg border border-slate-700/30 bg-slate-900/20 text-slate-500 hover:bg-slate-800/30 hover:text-slate-300 text-sm transition-all flex items-center gap-2 font-mono"
                    >
                      <span className="text-slate-600">✕</span> Закрыть
                    </button>
                    <span className="text-[10px] text-slate-600 font-mono mt-1 text-center">ESC — закрыть</span>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Settings Panel ── */}
          <SettingsPanel open={settingsOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Save Slot Manager ── */}
          <SaveSlotManager open={saveSlotOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Mini Game Hub ── */}
          <MiniGameHub open={miniGameHubOpen} onClose={() => dispatchPanel(null)} />

          {/* ── NPC Relationship Panel ── */}
          <NPCRelationshipPanel open={npcRelationOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Character Profile Panel ── */}
          <CharacterProfilePanel open={characterProfileOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Codex Panel ── */}
          <CodexPanel open={codexOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Achievement Details Panel ── */}
          <AchievementDetailsPanel open={achievementsOpen} onClose={() => dispatchPanel(null)} />
          <SkillTreePanel open={skillTreeOpen} onClose={() => dispatchPanel(null)} />
          <PerksPanel open={perksOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Quest Board Panel ── */}
          <QuestBoardPanel open={questBoardOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Dialogue History Panel ── */}
          <DialogueHistoryPanel open={dialogueHistoryOpen} onClose={() => dispatchPanel(null)} />

          {/* ── Scene Transition Overlay ── */}
          <SceneTransitionOverlay />

          {/* ── Dev Panel (F3) ── */}
          <DevPanel />

          {/* ── Achievement Notifications ── */}
          <AchievementNotification />

          {/* ── Keyboard Shortcuts Help ── */}
          <ShortcutsOverlay open={shortcutsOpen} onClose={() => dispatchPanel(null)} />
      </>
    </div>
    </VirtualControlsContext.Provider>
  );
}
