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
import { QUEST_DEFINITIONS } from '@/data/quests';
import { getCutsceneForNode } from '@/data/cutscenes';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { CUTSCENE_TIMINGS } from '@/shared/constants/transitionTimings';
import { VirtualControlsContext, sharedVirtualControlsRef } from '@/engine/VirtualControlsState';
import { processExpiredTTLFlags } from '@/engine/PoemPowerSystem';
import { initGuidedStoryManager, disposeGuidedStoryManager, getActQuote } from '@/engine/GuidedStoryManager';

// ──────────────────────────────────────────────────────────────────────────
// P3-TODO: CODE-SPLITTING PLAN (deferred — dev server OOM prevents React.lazy)
// ──────────────────────────────────────────────────────────────────────────
// Currently all 40+ panel components are statically imported because the
// dev server runs out of memory after the first compilation, causing
// ChunkLoadError on subsequent lazy chunk requests. In production builds,
// we should switch to React.lazy() for rarely-opened panels:
//
// Tier 1 (keep static — always-mounted or frequently opened):
//   HUD, MiniMap, MenuScreen, IntroScreen, StoryRenderer, DialogueRenderer,
//   LoadingScreen, CombatUI, NotificationToasts, FloatingTextLayer, ScreenEffects
//
// Tier 2 (React.lazy — opened occasionally):
//   QuestsPanel, Inventory, PoetryBook, JournalPanel, RestPanel,
//   SettingsPanel, SaveSlotManager, CompassHUD, MoralCompassHUD,
//   MiniGameHub, NPCRelationshipPanel, CharacterProfilePanel
//
// Tier 3 (React.lazy — rarely opened):
//   CodexPanel, DialogueHistoryPanel, AchievementDetailsPanel, SkillTreePanel,
//   FastTravelPanel, PerksPanel, QuestBoardPanel, PlayerStatsPanel,
//   DevPanel, CraftingPanel, TradingPanel, ShortcutsOverlay
//
// Implementation: wrap React.lazy imports in <Suspense fallback={null}>
// and ensure each panel has a stable key for AnimatePresence transitions.
// Production-only: use process.env.NODE_ENV === 'production' guard.
// ──────────────────────────────────────────────────────────────────────────

// Sub-orchestrator hooks
import { useCombatOrchestrator } from '@/hooks/useCombatOrchestrator';
import { useAudioOrchestrator } from '@/hooks/useAudioOrchestrator';
import { useInteractionOrchestrator } from '@/hooks/useInteractionOrchestrator';
import { useLoreDiscovery } from '@/hooks/useLoreDiscovery';
import { useQuestTracker } from '@/hooks/useQuestTracker';
import { useAchievementChecker } from '@/hooks/useAchievementChecker';
import { useWorldClock } from '@/hooks/useWorldClock';

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
// Static imports — always-mounted components (Tier 1).
// Lazy-loaded panels (Tier 2/3) are defined below via React.lazy().
import { HUD } from './HUD';
import { MiniMap } from './MiniMap';
import { MoralCompassHUD } from './MoralCompassHUD';
import { TutorialOverlay } from './TutorialOverlay';
import { FirstPlayTutorial } from './FirstPlayTutorial';
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
import { AchievementNotification } from './AchievementNotification';
import { SceneTransitionOverlay } from './SceneTransitionOverlay';
import { WeatherIndicator } from './WeatherIndicator';
import { DayNightCycleIndicator } from './DayNightCycleIndicator';
import { FloatingTextLayer } from './FloatingText';
import { InteractionHintPopup } from './InteractionHintPopup';
import { ScreenEffects } from './ScreenEffects';
import { CutsceneOverlay } from '@/components/game/CutsceneOverlay';
import { PoetryPowerBar } from '@/components/game/PoetryPowerBar';
import { PoemPowerEffect } from '@/components/game/PoemPowerEffect';
import { LevelUpEffect } from '@/components/game/LevelUpEffect';
import { DirectionalDamageIndicator } from '@/components/game/DirectionalDamageIndicator';
import { PhotoMode } from '@/components/game/PhotoMode';
import { DamageNumberFloat } from '@/components/game/DamageNumberFloat';

// Dynamic import — only RPGGameCanvas needs no SSR (WebGL canvas)
import { lazy, Suspense } from 'react';

const RPGGameCanvas = lazy(
  () => import('@/components/3d/RPGGameCanvas').then((m) => ({ default: m.RPGGameCanvas })),
);

/* ── Code-splitting: Tier 2/3 panels loaded on demand via React.lazy ── */
/* Previously all panels were statically imported due to Vite dev server OOM.  */
/* Now resolved: use NODE_OPTIONS=--max-old-space-size=4096 for dev builds.   */

// Lazy panel wrapper with null fallback (panels render instantly from cache)
function LazyPanel({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={null}>{children}</Suspense>;
}

// Tier 2 panels (opened occasionally)
const LazyQuestsPanel = lazy(() => import('./QuestsPanel').then(m => ({ default: (p: any) => <m.QuestsPanel {...p} /> })));
const LazyInventory = lazy(() => import('./Inventory').then(m => ({ default: (p: any) => <m.Inventory {...p} /> })));
const LazyPoetryBook = lazy(() => import('./PoetryBook').then(m => ({ default: (p: any) => <m.PoetryBook {...p} /> })));
const LazyJournalPanel = lazy(() => import('./JournalPanel').then(m => ({ default: () => <m.JournalPanel /> })));
const LazyRestPanel = lazy(() => import('./RestPanel').then(m => ({ default: (p: any) => <m.RestPanel {...p} /> })));
const LazySaveSlotManager = lazy(() => import('./SaveSlotManager').then(m => ({ default: (p: any) => <m.SaveSlotManager {...p} /> })));
const LazyMiniGameHub = lazy(() => import('./MiniGameHub').then(m => ({ default: (p: any) => <m.MiniGameHub {...p} /> })));
const LazyNPCRelationshipPanel = lazy(() => import('./NPCRelationshipPanel').then(m => ({ default: (p: any) => <m.NPCRelationshipPanel {...p} /> })));
const LazyCharacterProfilePanel = lazy(() => import('./CharacterProfilePanel').then(m => ({ default: (p: any) => <m.CharacterProfilePanel {...p} /> })));

// Tier 3 panels (rarely opened)
const LazyCodexPanel = lazy(() => import('./CodexPanel').then(m => ({ default: (p: any) => <m.CodexPanel {...p} /> })));
const LazyDialogueHistoryPanel = lazy(() => import('./DialogueHistoryPanel').then(m => ({ default: (p: any) => <m.DialogueHistoryPanel {...p} /> })));
const LazyAchievementDetailsPanel = lazy(() => import('./AchievementDetailsPanel').then(m => ({ default: (p: any) => <m.AchievementDetailsPanel {...p} /> })));
const LazySkillTreePanel = lazy(() => import('./SkillTreePanel').then(m => ({ default: (p: any) => <m.SkillTreePanel {...p} /> })));
const LazyFastTravelPanel = lazy(() => import('./FastTravelPanel').then(m => ({ default: (p: any) => <m.FastTravelPanel {...p} /> })));
const LazyPerksPanel = lazy(() => import('./PerksPanel').then(m => ({ default: (p: any) => <m.PerksPanel {...p} /> })));
const LazyQuestBoardPanel = lazy(() => import('./QuestBoardPanel').then(m => ({ default: (p: any) => <m.QuestBoardPanel {...p} /> })));
const LazyPlayerStatsPanel = lazy(() => import('./PlayerStatsPanel').then(m => ({ default: (p: any) => <m.PlayerStatsPanel {...p} /> })));
const LazyCraftingPanel = lazy(() => import('./CraftingPanel').then(m => ({ default: (p: any) => <m.CraftingPanel {...p} /> })));
const LazyTradingPanel = lazy(() => import('./TradingPanel').then(m => ({ default: (p: any) => <m.TradingPanel {...p} /> })));
const LazyDevPanel = lazy(() => import('./DevPanel').then(m => ({ default: () => <m.DevPanel /> })));
const LazyShortcutsOverlay = lazy(() => import('./ShortcutsOverlay').then(m => ({ default: (p: any) => <m.ShortcutsOverlay {...p} /> })));

// SettingsPanel stays static — used frequently from pause menu
import { SettingsPanel } from './SettingsPanel';

// ── Orphan integration: quest dialogs, notifications, story HUD, karma/poem, level-up ──
import { QuestAcceptDialog } from './QuestAcceptDialog';
import { QuestCompleteDialog } from './QuestCompleteDialog';
import { QuestNotificationSystem } from './QuestNotificationSystem';
import { StoryGuidanceHUD } from './StoryGuidanceHUD';
import { KarmaPoemInfoPanel } from './KarmaPoemInfoPanel';
import { LevelUpSummary } from './LevelUpSummary';
import { RewardDisplay } from './RewardDisplay';
import { MatrixRainQuote } from './MatrixRainQuote';
import { CyberpunkThemeProvider } from './CyberpunkTheme';



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
type PanelType = 'quests' | 'inventory' | 'poetry' | 'menu' | 'rest' | 'shortcuts' | 'settings' | 'saveSlot' | 'miniGameHub' | 'npcRelation' | 'characterProfile' | 'codex' | 'dialogueHistory' | 'achievements' | 'skillTree' | 'crafting' | 'trading' | 'fastTravel' | 'perks' | 'questBoard' | 'stats' | 'karmaPoem' | null;

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
  // ── World Director pattern: visual-novel is DEPRECATED ──
  // Narrative is now an overlay ON TOP of exploration mode, not a separate mode.
  // isDialogueActive checks for dialogue regardless of mode (was: mode === 'visual-novel')
  const isDialogueActive = !!DIALOGUE_NODES[currentNodeId] && showStoryOverlay;
  const isStoryActive = showStoryOverlay && !!STORY_NODES[currentNodeId];
  const isOverlayActive = isDialogueActive || isStoryActive;

  // ── Sub-orchestrators ──
  const { startCombatFromStory } = useCombatOrchestrator();
  useAudioOrchestrator();
  const interaction = useInteractionOrchestrator(startCombatFromStory);
  useLoreDiscovery();
  useQuestTracker();
  useAchievementChecker();
  // ── World Clock: single pulse for NPC schedules, weather, quests ──
  useWorldClock();

  // ── Guided Story Manager: linear story progression ──
  // Initializes once and subscribes to EventBus events to auto-advance golden path.
  // Emits 'story:guidance_update' and 'story:act_transition' events.
  useEffect(() => {
    initGuidedStoryManager();
    return () => { disposeGuidedStoryManager(); };
  }, []);

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
  // P6-FIX: Add canvasReady STATE (not just ref) so React re-renders when
  // the canvas becomes ready. Previously, canvasReadyRef was a ref only,
  // so the LoadingScreen condition `!canvasReadyRef.current` was never
  // re-evaluated, causing the loading overlay to block the menu forever.
  const [canvasReady, setCanvasReady] = useState(false);
  const canvasReadyRef = useRef(false);
  const prevModeRef = useRef(mode);
  const fallbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fadeOutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Listen for canvas:first-frame event — sets ref AND state, triggers fade-out
  useEffect(() => {
    const unsub = eventBus.on('canvas:first-frame', () => {
      canvasReadyRef.current = true;
      setCanvasReady(true);
      if (isTransitioning) {
        // Clear fallback timer
        if (fallbackTimerRef.current) { clearTimeout(fallbackTimerRef.current); fallbackTimerRef.current = null; }
        // Start fade-out
        if (fadeOutTimerRef.current) clearTimeout(fadeOutTimerRef.current);
        fadeOutTimerRef.current = setTimeout(() => setIsTransitioning(false), 300);
      }
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
      if (mode !== 'exploration' && mode !== 'cutscene' && mode !== 'combat') {
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
        setCanvasReady(false);
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
      setCanvasReady(false);
      setIsTransitioning(true);

      // SAFETY: Fallback timer — if canvas:first-frame never fires,
      // force-remove the overlay after 1.0s (reduced from 1.5s to minimize
      // the visible "stuck on black" time that players see as a "timeout").
      fallbackTimerRef.current = setTimeout(() => {
        console.warn('[GameOrchestrator] Canvas first-frame timeout — forcing transition overlay off');
        canvasReadyRef.current = true;
        setCanvasReady(true);
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

    // Don't trigger cutscenes during intro — the intro cinematic handles
    // its own flow. The 'start' node cutscene (act1_prologue) should only
    // play AFTER the intro completes, which it does because IntroScreen's
    // onComplete re-sets currentNodeId='start' after setting mode='exploration',
    // but by then act1_prologue is already in triggeredCutscenes (marked below).
    const currentMode = useGameStore.getState().mode;
    if (currentMode === 'intro' || currentMode === 'menu') return;

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

    // ── World Director: ALWAYS return to exploration after cutscene ──
    // Narrative is now an overlay, not a separate mode.
    // Before: character_intro/story_moment/revelation → visual-novel (WRONG: hides 3D world)
    // Now: ALL cutscene types → exploration + showStoryOverlay when story exists
    // This keeps the 3D canvas always visible and NPCs always moving.
    cutsceneEndTimerRef.current = setTimeout(() => {
      // Only switch back if we're still in cutscene mode
      // (player might have triggered another mode change)
      const currentStore = useGameStore.getState();
      if (currentStore.mode === 'cutscene') {
        // Clear cutscene state
        currentStore.setCutscene(null, []);
        // ALWAYS return to exploration — the 3D world is the primary game mode
        currentStore.setMode('exploration');
        // Show story overlay ONLY if the player hasn't already dismissed it.
        // Guard: currentNodeId is cleared when the player dismisses the overlay
        // (see StoryRenderer explore_mode handler), so if it's empty, the
        // player explicitly exited the story — don't re-show the overlay.
        if (currentStore.currentNodeId && (STORY_NODES[currentStore.currentNodeId] || DIALOGUE_NODES[currentStore.currentNodeId])) {
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
  const karmaPoemOpen = activePanel === 'karmaPoem';

  // ── Quest dialog state (controlled by EventBus events) ──
  const [questAcceptId, setQuestAcceptId] = useState<string | null>(null);
  const [questAcceptNpcId, setQuestAcceptNpcId] = useState<string | undefined>(undefined);
  const [questCompleteId, setQuestCompleteId] = useState<string | null>(null);
  const [questCompleteNpcId, setQuestCompleteNpcId] = useState<string | undefined>(undefined);

  // ── Quest chain unlock notification state ──
  const [questChainUnlock, setQuestChainUnlock] = useState<{
    nextQuestTitle: string;
    nextQuestType: string;
    completedQuestTitle: string;
    npcId?: string;
    actNumber: number;
  } | null>(null);

  // ── MatrixRainQuote state (act transition cinematic) ──
  const [matrixQuote, setMatrixQuote] = useState<{ text: string; actNumber: number } | null>(null);


  // ── Listen for quest dialog events ──
  useEffect(() => {
    const unsubAvailable = eventBus.on('story:quest_available', (data) => {
      setQuestAcceptId(data.questId);
      setQuestAcceptNpcId(data.npcId);
    });
    const unsubComplete = eventBus.on('quest:completed', (data) => {
      setQuestCompleteId(data.questId);
      setQuestCompleteNpcId(data.npcId);
    });
    // ── Quest chain unlock notification ──
    // When a golden path quest is completed and the next one becomes available,
    // show a prominent notification (don't auto-activate — let the player choose).
    const unsubChainUnlock = eventBus.on('story:quest_chain_unlock', (data) => {
      setQuestChainUnlock({
        nextQuestTitle: data.nextQuestTitle,
        nextQuestType: data.nextQuestType,
        completedQuestTitle: data.completedQuestTitle,
        npcId: data.npcId,
        actNumber: data.actNumber,
      });
      // Auto-dismiss after 8 seconds
      setTimeout(() => setQuestChainUnlock(null), 8000);
    });
    return () => { unsubAvailable(); unsubComplete(); unsubChainUnlock(); };
  }, []);

  // ── Listen for act transition events → show MatrixRainQuote ──
  useEffect(() => {
    const unsub = eventBus.on('story:act_transition', (data) => {
      const actNum = data.toAct;
      const quote = getActQuote(actNum);
      if (quote) {
        setMatrixQuote({ text: quote, actNumber: actNum });
      }
    });
    return unsub;
  }, []);


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

  // Mobile detection — uses touch capability + screen size so that
  // landscape phones (width > 1024 but touch device) still get mobile HUD.
  // A phone rotated to landscape still needs D-pad / touch controls.
  // v3 FIX: Also detect via pointer:coarse (tablets in landscape) and
  // screen diagonal (catches large tablets that don't report touch).
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      if (typeof window === 'undefined') return false;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      // pointer:coarse detects devices with touch/pen as primary input
      const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
      const isTouchDevice = hasTouch || hasCoarsePointer;
      const narrowPortrait = window.innerWidth < 768;
      const tabletPortrait = window.innerWidth < 1024;
      // ANY touch device with small viewport → mobile
      if (isTouchDevice && narrowPortrait) return true;
      // Touch device in landscape but small height (phone rotated) → still mobile
      if (isTouchDevice && window.innerHeight < 768) return true;
      // Non-touch small screen → mobile
      if (tabletPortrait && !isTouchDevice) return true;
      // Touch device up to 1024px width (tablet portrait)
      if (isTouchDevice && tabletPortrait) return true;
      // Any touch device with height < 500 (very wide landscape phone)
      if (isTouchDevice && window.innerHeight < 500) return true;
      // Large tablet in landscape (e.g., iPad Pro 12.9") — still touch, still needs controls
      // Use screen size as fallback: if screen < 14" diagonal ≈ 1200px shortest side
      if (isTouchDevice && Math.min(window.screen.width, window.screen.height) < 1200) return true;
      // Any coarse-pointer device that's not a desktop
      if (hasCoarsePointer && window.innerWidth < 1400) return true;
      return false;
    };
    // Schedule via microtask to avoid "setState in effect" warning from React Compiler
    queueMicrotask(() => setIsMobile(checkMobile()));
    const handleResize = () => setIsMobile(checkMobile());
    window.addEventListener('resize', handleResize);
    // Also re-check on orientation change (more reliable on mobile)
    window.addEventListener('orientationchange', handleResize);
    // matchMedia for instant orientation detection
    const mql = window.matchMedia('(orientation: landscape)');
    mql.addEventListener('change', handleResize);
    // Also re-check when pointer changes (e.g., connecting/disconnecting keyboard)
    const pql = window.matchMedia('(pointer: coarse)');
    pql.addEventListener('change', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      mql.removeEventListener('change', handleResize);
      pql.removeEventListener('change', handleResize);
    };
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

  // ── Auto-save after combat victory (L-02) ──
  useEffect(() => {
    const unsub = eventBus.on('combat:victory', () => {
      const store = useGameStore.getState();
      store.saveGame({ source: 'auto' });
    });
    return unsub;
  }, []);

  // ── Daily mission progress for crafting ──
  // Listens for item:crafted events emitted by craftItem() and
  // updates the corresponding daily mission objectives.
  useEffect(() => {
    const unsub = eventBus.on('item:crafted', ({ category }) => {
      const store = useGameStore.getState();
      const categoryToObjective: Record<string, string> = {
        equipment: 'craft_equipment',
        consumable: 'craft_consumables',
        quest: 'craft_items',
      };
      const objectiveId = categoryToObjective[category] ?? 'craft_items';

      for (const mission of store.acceptedDailyMissions) {
        if (mission.completed || mission.claimed) continue;
        // Check if this mission has the matching objective
        const hasObjective = mission.progress[objectiveId] !== undefined || objectiveId === 'craft_items';
        if (hasObjective) {
          store.updateDailyMissionProgress(mission.missionId, objectiveId, 1);
        }
      }
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
  useEffect(() => {
    panelStateRef.current = {
      activePanel,
      codebreakerOpen, openstackTerminalOpen, bashTerminalOpen, poetryGameOpen, hackingGameOpen, memoryGameOpen, quizGameOpen, rhythmGameOpen,
      examineOpen, mode,
    };
  });

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
      if (e.code === 'KeyY') { dispatchPanel('karmaPoem'); }
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
          // P5-FIX: Show story overlay if current node has a story node —
          // previously ESC-skip dumped the player into exploration without
          // showing the narrative text that was supposed to follow the cutscene.
          // Guard: only show if currentNodeId is non-empty (player hasn't dismissed it)
          if (store.currentNodeId && STORY_NODES[store.currentNodeId]) {
            store.setShowStoryOverlay(true);
          }
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

  // ── Mobile interact callback ──
  // When the mobile interact button is pressed, advance dialogue/story if active,
  // otherwise let the synthetic KeyE and EventBus handle the interaction.
  const handleMobileInteract = useCallback(() => {
    const store = useGameStore.getState();
    // If story overlay is showing, advance dialogue/story
    // (StoryRenderer/DialogueRenderer listen for KeyE keydown to advance)
    // The synthetic KeyE from ExplorationMobileHud will handle this.
    // No additional action needed here — the narrative overlay works on top of exploration.
    void store; // suppress unused warning
  }, []);

  // ── Render ──
  return (
    <VirtualControlsContext.Provider value={sharedVirtualControlsRef}>
    <CyberpunkThemeProvider>
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
          {/* P6-FIX: Use canvasReady STATE instead of canvasReadyRef.current.
              The ref doesn't trigger re-renders, so the LoadingScreen was
              blocking the menu forever. Also add pointer-events: none as a
              safety net — even if briefly visible, it won't block clicks. */}
          {mode === 'menu' && !canvasReady && (
            <div style={{ pointerEvents: 'none' }}>
              <LoadingScreen showTitle={true} message="Инициализация..." />
            </div>
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
              visibility: (mode === 'exploration' || mode === 'cutscene' || mode === 'combat' || mode === 'intro') ? 'visible' : 'hidden',
              pointerEvents: (mode === 'exploration' || mode === 'cutscene' || mode === 'combat') ? 'auto' : 'none',
            }}
          >
            <Suspense fallback={<div className="fixed inset-0 bg-black" style={{ zIndex: 100 }} />}>
              <RPGGameCanvas />
            </Suspense>
          </div>


          {/* ── Matrix Rain Quote overlay (act transitions) ── */}
          <AnimatePresence>
            {matrixQuote && (
              <MatrixRainQuote
                text={matrixQuote.text}
                actNumber={matrixQuote.actNumber}
                onDismiss={() => setMatrixQuote(null)}
              />
            )}
          </AnimatePresence>

          {/* ── Exploration / visual-novel / cutscene / combat UI layers ── */}
          {(mode === 'exploration' || mode === 'cutscene' || mode === 'combat') && (
            <>
              {/* ── Global notification toasts ── */}
              <NotificationToasts />

              {/* ── Quest notification system (auto-triggers on quest events) ── */}
              <QuestNotificationSystem />

              {/* ── Story guidance HUD (top-center, shows current objective) ── */}
              <StoryGuidanceHUD />

              {/* ── Level-up summary overlay (auto-triggers on level-up) ── */}
              <LevelUpSummary />

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
                  {/* First-play progressive tutorial — blocks gameplay until completed */}
                  <FirstPlayTutorial />
                  {/* Poetry Power quick-bar — action bar for poem powers */}
                  <PoetryPowerBar />
                </>
              )}

              {/* Player stats panel — slide-in from left (toggle with S key) */}
              <LazyPanel><LazyPlayerStatsPanel open={statsOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

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

              {/* Mobile controls — visible during ALL gameplay modes on touch devices
                  (player needs D-pad to move + interact button to advance/interact) */}
              {isMobile && <ExplorationMobileHud onInteractPress={handleMobileInteract} onOpenInventory={handleOpenInventory} />}

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
          {questsOpen && <LazyPanel><LazyQuestsPanel open={questsOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>}
          {inventoryOpen && (
            <ErrorBoundary name="inventory">
              <LazyPanel><LazyInventory open={inventoryOpen} onClose={() => dispatchPanel(null)} onOpenPoetryBook={handleOpenPoetryBook} /></LazyPanel>
            </ErrorBoundary>
          )}
          {poetryOpen && <LazyPanel><LazyPoetryBook open={poetryOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>}

          {/* ── Crafting Panel ── */}
          <LazyPanel><LazyCraftingPanel open={craftingOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Trading Panel ── */}
          <LazyPanel><LazyTradingPanel open={tradingOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Fast Travel Panel ── */}
          <LazyPanel><LazyFastTravelPanel open={fastTravelOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Rest Panel ── */}
          <LazyPanel><LazyRestPanel open={restOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Journal Panel ── */}
          <LazyPanel><LazyJournalPanel /></LazyPanel>

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
          <LazyPanel><LazySaveSlotManager open={saveSlotOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Mini Game Hub ── */}
          <LazyPanel><LazyMiniGameHub open={miniGameHubOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── NPC Relationship Panel ── */}
          <LazyPanel><LazyNPCRelationshipPanel open={npcRelationOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Character Profile Panel ── */}
          <LazyPanel><LazyCharacterProfilePanel open={characterProfileOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Codex Panel ── */}
          <LazyPanel><LazyCodexPanel open={codexOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Achievement Details Panel ── */}
          <LazyPanel><LazyAchievementDetailsPanel open={achievementsOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>
          <LazyPanel><LazySkillTreePanel open={skillTreeOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>
          <LazyPanel><LazyPerksPanel open={perksOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Quest Board Panel ── */}
          <LazyPanel><LazyQuestBoardPanel open={questBoardOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Dialogue History Panel ── */}
          <LazyPanel><LazyDialogueHistoryPanel open={dialogueHistoryOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Scene Transition Overlay ── */}
          <SceneTransitionOverlay />

          {/* ── Dev Panel (F3) ── */}
          <LazyPanel><LazyDevPanel /></LazyPanel>

          {/* ── Achievement Notifications ── */}
          <AchievementNotification />

          {/* ── Keyboard Shortcuts Help ── */}
          <LazyPanel><LazyShortcutsOverlay open={shortcutsOpen} onClose={() => dispatchPanel(null)} /></LazyPanel>

          {/* ── Quest Accept Dialog (Warcraft-style with portrait) ── */}
          <QuestAcceptDialog
            questId={questAcceptId}
            npcId={questAcceptNpcId}
            onClose={() => { setQuestAcceptId(null); setQuestAcceptNpcId(undefined); }}
            onAccept={(qid) => {
              useGameStore.getState().activateQuest(qid);
              setQuestAcceptId(null);
              setQuestAcceptNpcId(undefined);
            }}
          />

          {/* ── Quest Complete Dialog (reward display) ── */}
          <QuestCompleteDialog
            questId={questCompleteId}
            npcId={questCompleteNpcId}
            onClose={() => { setQuestCompleteId(null); setQuestCompleteNpcId(undefined); }}
          />

          {/* ── Quest Chain Unlock Notification ── */}
          {/* Prominent notification when completing a golden path quest unlocks the next */}
          <AnimatePresence>
            {questChainUnlock && (
              <motion.div
                key="quest-chain-unlock"
                initial={{ opacity: 0, y: 40, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 pointer-events-auto"
                style={{ zIndex: UI_LAYERS.TOASTS + 3 }}
                onClick={() => setQuestChainUnlock(null)}
              >
                <div
                  className="flex items-center gap-4 px-6 py-4 rounded-xl border backdrop-blur-md cursor-pointer"
                  style={{
                    background: 'linear-gradient(135deg, rgba(0,16,8,0.95) 0%, rgba(0,40,30,0.92) 50%, rgba(0,16,8,0.88) 100%)',
                    borderColor: 'rgba(0,255,238,0.4)',
                    boxShadow: '0 0 40px rgba(0,255,238,0.15), 0 0 15px rgba(0,255,238,0.08), 0 8px 32px rgba(0,0,0,0.5)',
                  }}
                >
                  {/* Icon */}
                  <div
                    className="flex items-center justify-center w-12 h-12 rounded-lg text-xl"
                    style={{
                      background: 'rgba(0,255,238,0.12)',
                      border: '1px solid rgba(0,255,238,0.3)',
                      boxShadow: '0 0 12px rgba(0,255,238,0.15)',
                    }}
                  >
                    ⚑
                  </div>
                  <div className="flex flex-col gap-1">
                    {/* Header */}
                    <div className="flex items-center gap-2">
                      <span
                        className="text-[10px] font-mono tracking-wider font-bold"
                        style={{
                          color: '#00ffee',
                          textShadow: '0 0 8px rgba(0,255,238,0.4)',
                        }}
                      >
                        НОВОЕ ЗАДАНИЕ ДОСТУПНО
                      </span>
                      {questChainUnlock.nextQuestType === 'main' && (
                        <span
                          className="text-[9px] font-mono tracking-wider px-1.5 py-0.5 rounded"
                          style={{
                            color: '#ff6644',
                            background: 'rgba(255,102,68,0.1)',
                            border: '1px solid rgba(255,102,68,0.3)',
                          }}
                        >
                          ОСНОВНОЕ
                        </span>
                      )}
                    </div>
                    {/* Quest title */}
                    <span
                      className="text-sm font-mono font-bold"
                      style={{
                        color: '#e0f8f8',
                        textShadow: '0 0 6px rgba(0,255,238,0.2)',
                      }}
                    >
                      {questChainUnlock.nextQuestTitle}
                    </span>
                    {/* Context */}
                    <span className="text-[11px] font-mono" style={{ color: '#88aaaa' }}>
                      После «{questChainUnlock.completedQuestTitle}»
                      {questChainUnlock.actNumber > 1 && ` · Акт ${questChainUnlock.actNumber}`}
                    </span>
                  </div>
                  {/* Dismiss hint */}
                  <span className="text-[9px] font-mono ml-2" style={{ color: 'rgba(0,255,238,0.3)' }}>
                    ✕
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Karma & Poem Info Panel ── */}
          <KarmaPoemInfoPanel open={karmaPoemOpen} onClose={() => dispatchPanel(null)} />
      </>
    </div>
    </CyberpunkThemeProvider>
    </VirtualControlsContext.Provider>
  );
}
