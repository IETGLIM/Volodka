// src/app/GameClient.tsx
'use client';

import { 
  useState, 
  useEffect, 
  useRef, 
  useCallback, 
  useMemo, 
  memo, 
  Suspense,
  useTransition
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import dynamic from 'next/dynamic';

// ============================================
// ТИПЫ
// ============================================
import type { 
  StoryNode, 
  StoryChoice, 
  StoryEffect,
  PlayerState, 
  VisualState,
  SceneId
} from '../data/types';
import type { Poem } from '../data/poems';
import type { GameMode } from '../data/rpgTypes';

import { 
  SCENE_CONFIG, 
  getNPCsForScene, 
  getInteractiveObjectsForScene,
  type NPCConfig,
  type InteractiveObjectConfig
} from '@/config/scenes';

// ============================================
// ДАННЫЕ
// ============================================
import { STORY_NODES, TITLE_TEXT, SUBTITLE_TEXT } from '../data/storyNodes';
import { POEMS, getPoemById, GAME_INTRO } from '../data/poems';
import { ACHIEVEMENTS, checkAchievement } from '../data/achievements';
import { ANIME_CUTSCENES, getCutsceneById } from '../data/animeCutscenes';

// ============================================
// КОМПОНЕНТЫ
// ============================================
import SkillsPanel from '../components/SkillsPanel';
import StressIndicator, { KernelPanicOverlay } from '../components/StressIndicator';
import { PhysicsGameModeSwitcher } from '../components/game/PhysicsRPGCanvas';
import { DialogueManager } from '../components/game/DialogueWindow';
import IntroScreen from '../components/game/IntroScreen';
import MenuScreen from '../components/game/MenuScreen';
import QuestsPanel from '../components/game/QuestsPanel';

const AnimeCutscene = dynamic(() => import('../components/game/AnimeCutscene'), {
  ssr: false,
  loading: () => null
});
const PoemReveal = dynamic(() => import('../components/game/PoemReveal'), {
  ssr: false
});
const SSHTerminal = dynamic(() => import('../components/game/SSHTerminal'), {
  ssr: false
});
const MiniMap = dynamic(() => import('../components/game/MiniMap'), {
  ssr: false
});

// ============================================
// STORE
// ============================================
import { useGameStore } from '../store/gameStore';

// ============================================
// HOOKS
// ============================================
import { useAudioManager } from '../hooks/useAudioManager';
import { suppressResizeObserverErrors, fixMobileViewportHeight } from '../utils/gameUtils';

// ============================================
// УТИЛИТЫ
// ============================================
const calculateVisualState = (state: PlayerState): VisualState => ({
  glitchIntensity: state.stability < 30 ? (30 - state.stability) / 30 : state.stress > 70 ? (state.stress - 70) / 30 : 0,
  saturation: 0.5 + (state.mood / 200) - (state.stress / 400),
  contrast: 0.7 + (state.stability / 100) * 0.8,
  colorTint: state.stress > 70 ? '#ff0000' : state.creativity > 70 ? '#ffd700' : state.stability < 30 ? '#1a1a2e' : 'transparent',
  particles: state.creativity > 40,
});

interface AchievementCheckState {
  poemsCount: number;
  karma: number;
  poemsCollected: string[];
  flags: Record<string, boolean>;
  playTime: number;
  completedQuests?: string[];
  relations?: Record<string, number>;
  visitedLocations?: string[];
  endingsSeen?: string[];
}

// ============================================
// ПОДКОМПОНЕНТЫ
// ============================================

// --- Story Panel ---
interface StoryPanelProps {
  node: StoryNode;
  onChoice: (choice: StoryChoice) => void;
  isTyping: boolean;
  displayedText: string;
  onSkipTyping: () => void;
}

const StoryPanel = memo(function StoryPanel({ 
  node, 
  onChoice, 
  isTyping, 
  displayedText,
  onSkipTyping 
}: StoryPanelProps) {
  const choices = useMemo(() => {
    if (!node.choices) return [];
    return node.choices.filter(choice => {
      if (!choice.condition) return true;
      return true;
    });
  }, [node.choices]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-0 left-0 right-0 z-40 p-4"
    >
      <div 
        className="max-w-4xl mx-auto bg-slate-950/95 backdrop-blur-md rounded-t-2xl border-t border-slate-600/30 p-6 shadow-2xl"
        onClick={onSkipTyping}
      >
        {node.speaker && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-3">
            <span className="px-4 py-2 bg-purple-600 rounded-lg text-white text-sm font-semibold shadow-lg">
              {node.speaker}
            </span>
          </motion.div>
        )}
        <div className="min-h-[80px] mb-4">
          <p className="text-xl md:text-2xl text-white/90 leading-relaxed whitespace-pre-line">
            {displayedText}
            {isTyping && <span className="animate-pulse text-purple-400">|</span>}
          </p>
        </div>
        <div className="flex justify-end gap-2 mb-4">
          {isTyping && (
            <button
              onClick={(e) => { e.stopPropagation(); onSkipTyping(); }}
              className="px-3 py-1.5 bg-slate-700/90 hover:bg-slate-600 rounded text-sm text-slate-300 transition-colors"
            >
              Пропустить ▶
            </button>
          )}
        </div>
        <AnimatePresence>
          {!isTyping && choices.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
              {choices.map((choice, index) => (
                <motion.button
                  key={String(node.id) + '-' + String(index)}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.08 }}
                  onClick={(e) => { e.stopPropagation(); onChoice(choice); }}
                  className="w-full text-left px-4 py-3 bg-slate-800/90 hover:bg-slate-700/90 border border-slate-600/50 hover:border-purple-500/50 rounded-lg text-white text-lg font-medium transition-all shadow-md hover:shadow-lg hover:shadow-purple-500/10"
                >
                  <span className="text-purple-400 mr-2">{index + 1}.</span>
                  {choice.text}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
});

// --- State Bars ---
const StateBars = memo(function StateBars({ state }: { state: PlayerState }) {
  const formatTime = useCallback((seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return String(hrs) + 'ч ' + String(mins) + 'м';
  }, []);
  const stats = useMemo(() => [
    { icon: '😊', value: state.mood, colors: 'from-emerald-500 to-cyan-400' },
    { icon: '🎨', value: state.creativity, colors: 'from-purple-500 to-pink-400' },
    { icon: '🧠', value: state.stability, colors: 'from-green-500 to-emerald-400' },
  ], [state.mood, state.creativity, state.stability]);
  return (
    <div className="flex flex-wrap gap-3 items-center">
      {stats.map((stat, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <span className="text-sm">{stat.icon}</span>
          <div className="w-12 h-1.5 bg-slate-700 rounded-full overflow-hidden">
            <div className={"h-full bg-gradient-to-r " + stat.colors + " transition-all duration-500"} style={{ width: String(stat.value) + '%' }} />
          </div>
        </div>
      ))}
      <div className="flex items-center gap-1.5">
        <span className="text-sm">⚡</span>
        <div className="flex gap-0.5">
          {[...Array(10)].map((_, i) => (
            <div key={i} className={"w-1 h-2.5 rounded-sm transition-all duration-300 " + (i < state.energy ? 'bg-amber-400' : 'bg-slate-600')} />
          ))}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <div className="px-2 py-1 bg-slate-800/70 rounded text-xs text-slate-400">Акт {state.act}</div>
        <div className="px-2 py-1 bg-slate-800/70 rounded text-xs text-slate-400">{formatTime(state.playTime)}</div>
      </div>
    </div>
  );
});

// --- Loading Screen ---
const LoadingScreen = memo(function LoadingScreen() {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const dotsInterval = setInterval(() => setDots(prev => prev.length >= 3 ? '' : prev + '.'), 500);
    const progressInterval = setInterval(() => setProgress(prev => Math.min(prev + 5, 90)), 100);
    return () => { clearInterval(dotsInterval); clearInterval(progressInterval); };
  }, []);
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
        <div className="text-5xl mb-6">📜</div>
        <div className="text-slate-400 text-xl mb-2">Загрузка{dots}</div>
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div className="h-full bg-gradient-to-r from-purple-500 to-pink-500" initial={{ width: 0 }} animate={{ width: String(progress) + '%' }} transition={{ duration: 0.3 }} />
        </div>
      </motion.div>
    </div>
  );
});

// ============================================
// ГЛАВНЫЙ КОМПОНЕНТ
// ============================================

export default function GameClient() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // --- STORE ---
  const phase = useGameStore((s) => s.phase);
  const setPhase = useGameStore((s) => s.setPhase);
  const playerState = useGameStore((s) => s.playerState);
  const addStat = useGameStore((s) => s.addStat);
  const addStress = useGameStore((s) => s.addStress);
  const reduceStress = useGameStore((s) => s.reduceStress);
  const clearPanicMode = useGameStore((s) => s.clearPanicMode);
  const incrementPlayTime = useGameStore((s) => s.incrementPlayTime);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const setCurrentNode = useGameStore((s) => s.setCurrentNode);
  const collectedPoems = useGameStore((s) => s.collectedPoemIds);
  const collectPoem = useGameStore((s) => s.collectPoem);
  const unlockAchievement = useGameStore((s) => s.unlockAchievement);
  const unlockedAchievements = useGameStore((s) => s.unlockedAchievementIds);
  const gameMode = useGameStore((s) => s.gameMode);
  const setGameMode = useGameStore((s) => s.setGameMode);
  const playerPosition = useGameStore((s) => s.exploration.playerPosition);
  const setPlayerPosition = useGameStore((s) => s.setPlayerPosition);
  const npcRelations = useGameStore((s) => s.npcRelations);
  const unlockedLocations = useGameStore((s) => s.unlockedLocations);
  const updateNPCRelation = useGameStore((s) => s.updateNPCRelation);
  const saveGameToStore = useGameStore((s) => s.saveGame);
  const loadGameFromStore = useGameStore((s) => s.loadGame);
  const resetGameStore = useGameStore((s) => s.resetGame);
  const setCurrentNPC = useGameStore((s) => s.setCurrentNPC);
  const currentNPCId = useGameStore((s) => s.currentNPCId);

  // --- LOCAL STATE ---
  const [isTyping, setIsTyping] = useState(false);
  const [displayedText, setDisplayedText] = useState('');
  const typingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [showSkillsPanel, setShowSkillsPanel] = useState(false);
  const [showQuestsPanel, setShowQuestsPanel] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [saveNotification, setSaveNotification] = useState<string | null>(null);
  const [activeCutsceneId, setActiveCutsceneId] = useState<string | null>(null);
  const [revealedPoemId, setRevealedPoemId] = useState<string | null>(null);
  const [activeDialogue, setActiveDialogue] = useState<{ npcId: string; npcName: string; node: unknown } | null>(null);
  const [skipIntro, setSkipIntro] = useState(false);

  // --- MEMOIZED ---
  const currentNode = useMemo(() => STORY_NODES[currentNodeId] || STORY_NODES['start'], [currentNodeId]);
  const visualState = useMemo(() => calculateVisualState(playerState), [playerState]);
  const hasSavedGame = useMemo(() => {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('volodka_save_v3');
  }, []);
  const currentSceneId = useMemo((): SceneId => {
    if (currentNodeId === 'explore_mode') return 'kitchen_night';
    return (currentNode?.scene as SceneId) || 'kitchen_night';
  }, [currentNode, currentNodeId]);

  const sceneNPCs = useMemo(() => getNPCsForScene(currentSceneId, playerState.flags), [currentSceneId, playerState.flags]);
  const sceneInteractiveObjects = useMemo(() => getInteractiveObjectsForScene(currentSceneId), [currentSceneId]);
  const currentSceneConfig = useMemo(() => SCENE_CONFIG[currentSceneId] || SCENE_CONFIG.kitchen_night, [currentSceneId]);

  // --- AUDIO ---
  const { playClick } = useAudioManager({
    stress: playerState.stress,
    panicMode: playerState.panicMode,
    sceneId: currentSceneId,
    enabled: phase === 'game',
  });

  // --- EFFECTS ---
  useEffect(() => {
    suppressResizeObserverErrors();
    fixMobileViewportHeight();
    if (phase === 'loading') {
      const timer = setTimeout(() => setPhase('menu'), 1500);
      return () => clearTimeout(timer);
    }
  }, [phase, setPhase]);

  useEffect(() => {
    if (phase !== 'game') return;
    const interval = setInterval(() => incrementPlayTime(), 1000);
    return () => clearInterval(interval);
  }, [phase, incrementPlayTime]);

  useEffect(() => {
    if (phase !== 'game') return;
    ACHIEVEMENTS.forEach(achievement => {
      if (unlockedAchievements.includes(achievement.id)) return;
      const checkState: AchievementCheckState = {
        poemsCount: collectedPoems.length,
        karma: playerState.karma,
        poemsCollected: collectedPoems,
        flags: playerState.flags,
        playTime: playerState.playTime,
        completedQuests: [],
        relations: npcRelations.reduce((acc, rel) => { acc[rel.id] = rel.value; return acc; }, {} as Record<string, number>),
        visitedLocations: unlockedLocations,
        endingsSeen: []
      };
      if (checkAchievement(achievement, checkState as AchievementCheckState)) unlockAchievement(achievement.id);
    });
  }, [phase, playerState, collectedPoems, unlockedAchievements, unlockAchievement, npcRelations, unlockedLocations]);

  // --- TYPEWRITER ---
  const startTyping = useCallback((text: string, onComplete?: () => void) => {
    setIsTyping(true);
    setDisplayedText('');
    let i = 0;
    if (typingIntervalRef.current) clearInterval(typingIntervalRef.current);
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayedText(text.slice(0, i + 1)); i++; }
      else { clearInterval(interval); typingIntervalRef.current = null; setIsTyping(false); onComplete?.(); }
    }, 25);
    typingIntervalRef.current = interval;
  }, []);

  const skipTyping = useCallback(() => {
    if (typingIntervalRef.current) { clearInterval(typingIntervalRef.current); typingIntervalRef.current = null; }
    if (currentNode?.text) { setDisplayedText(currentNode.text); setIsTyping(false); }
  }, [currentNode]);

  useEffect(() => {
    if (phase !== 'game' || !currentNode) return;
    if (currentNodeId === 'explore_mode') return;
    if (currentNode.cutscene && !activeCutsceneId) { setActiveCutsceneId(currentNode.cutscene); return; }
    const poem = POEMS.find(p => p.unlocksAt === currentNodeId);
    if (poem && !collectedPoems.includes(poem.id)) { collectPoem(poem.id); setRevealedPoemId(poem.id); }
    if (currentNode.text) startTyping(currentNode.text);
    else if (currentNode.autoNext) {
      const timer = setTimeout(() => setCurrentNode(currentNode.autoNext!), 500);
      return () => clearTimeout(timer);
    }
  }, [currentNodeId, phase, currentNode, collectedPoems, collectPoem, setCurrentNode, startTyping, activeCutsceneId]);

  useEffect(() => {
    return () => { if (typingIntervalRef.current) clearInterval(typingIntervalRef.current); };
  }, []);

  // --- HANDLERS ---
  const handleChoice = useCallback((choice: StoryChoice) => {
    playClick();
    if (choice.effect) {
      if (choice.effect.mood) addStat('mood', choice.effect.mood);
      if (choice.effect.creativity) addStat('creativity', choice.effect.creativity);
      if (choice.effect.stability) addStat('stability', choice.effect.stability);
      if (choice.effect.stress) choice.effect.stress > 0 ? addStress(choice.effect.stress) : reduceStress(-choice.effect.stress);
      if (choice.effect.poemId) collectPoem(choice.effect.poemId);
    }
    if (choice.next) setCurrentNode(choice.next);
  }, [playClick, addStat, addStress, reduceStress, collectPoem, setCurrentNode]);

  const handleIntroComplete = useCallback(() => {
    setPhase('game');
  }, [setPhase]);

  const handleStartNewGame = useCallback(() => {
    resetGameStore();
    const initialScene = 'kitchen_night';
    const config = SCENE_CONFIG[initialScene];
    if (config) {
      setPlayerPosition(config.spawnPoint);
    }
    setGameMode('exploration');
    setSkipIntro(false);
    setPhase('intro');
  }, [resetGameStore, setGameMode, setPhase, setPlayerPosition]);

  const handleLoadGame = useCallback(() => {
    if (loadGameFromStore()) {
      setPhase('game');
    }
  }, [loadGameFromStore, setPhase]);

  const handleSaveGame = useCallback(() => {
    saveGameToStore();
    setSaveNotification('Игра сохранена!');
    setTimeout(() => setSaveNotification(null), 2000);
  }, [saveGameToStore]);

  const handleCutsceneComplete = useCallback(() => {
    setActiveCutsceneId(null);
    if (currentNode?.text) startTyping(currentNode.text);
  }, [currentNode, startTyping]);

  const handleCalmDown = useCallback(() => { clearPanicMode(); reduceStress(10); }, [clearPanicMode, reduceStress]);

  const handleNPCRelationChange = useCallback((npcId: string, delta: number) => updateNPCRelation(npcId, delta), [updateNPCRelation]);

  const handleObjectInteract = useCallback((objectId: string, action: string) => {
    const obj = sceneInteractiveObjects.find(o => o.id === objectId);
    if (!obj) return;
    if (action === 'collect_poem' || action === 'interact') {
      if (obj.poemId && !collectedPoems.includes(obj.poemId)) {
        collectPoem(obj.poemId);
        setRevealedPoemId(obj.poemId);
      }
    }
  }, [sceneInteractiveObjects, collectedPoems, collectPoem]);

  const handlePlayerPositionChange = useCallback((pos: { x: number; y: number; z: number }) => {
    setPlayerPosition({ ...pos, rotation: playerPosition.rotation });
  }, [setPlayerPosition, playerPosition.rotation]);

  const handleNPCInteraction = useCallback((npcId: string) => {
    const npc = sceneNPCs.find(n => n.id === npcId);
    if (!npc) return;
    setCurrentNPC(npcId);
    setActiveDialogue({
      npcId: npc.id,
      npcName: npc.name,
      node: { id: 'test', text: 'Привет, я ' + npc.name + '. Это тестовый диалог.' }
    });
    setGameMode('dialogue');
  }, [sceneNPCs, setCurrentNPC, setGameMode]);

  const closeDialogue = useCallback(() => {
    setActiveDialogue(null);
    setCurrentNPC(null);
    setGameMode('exploration');
  }, [setCurrentNPC, setGameMode]);

  // --- RENDER ---
  if (!mounted) return <div className="fixed inset-0 bg-black" />;
  if (phase === 'loading') return <LoadingScreen />;
  
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

  const showStoryPanel = phase === 'game' && gameMode === 'visual-novel' && currentNode && !activeCutsceneId && currentNodeId !== 'explore_mode';

  const glitchBg = 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,' + String(visualState.glitchIntensity * 0.1) + ') 2px, rgba(0,255,255,' + String(visualState.glitchIntensity * 0.1) + ') 4px)';
  const glitchAnim = 'glitch ' + String(0.5 - visualState.glitchIntensity * 0.3) + 's infinite';

  return (
    <div className="fixed inset-0 bg-slate-900 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <PhysicsGameModeSwitcher
          sceneId={currentSceneId}
          isExplorationMode={gameMode === 'exploration'}
          stressLevel={playerState.stress}
          panicMode={playerState.panicMode}
          visualParams={{
            glitchIntensity: visualState.glitchIntensity,
            saturation: visualState.saturation,
            contrast: visualState.contrast,
            creativity: playerState.creativity,
            stability: playerState.stability,
          }}
          npcs={sceneNPCs}
          interactiveObjects={sceneInteractiveObjects}
          playerPosition={playerPosition}
          onNPCRelationChange={handleNPCRelationChange}
          onObjectInteract={handleObjectInteract}
          onPlayerPositionChange={handlePlayerPositionChange}
          onNPCInteraction={handleNPCInteraction}
        >
          <></>
        </PhysicsGameModeSwitcher>
      </div>

      {visualState.glitchIntensity > 0 && (
        <div className="fixed inset-0 pointer-events-none z-40" style={{ background: glitchBg, animation: glitchAnim }} />
      )}

      <div className="relative z-30 p-3 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
        <div className="flex justify-between items-start pointer-events-auto">
          <StateBars state={playerState} />
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => setShowTerminal(!showTerminal)} className={"px-3 py-1.5 " + (showTerminal ? 'bg-green-600' : 'bg-slate-600/80 hover:bg-slate-500') + " text-white rounded-lg text-sm transition-colors shadow-md font-mono"}>💻 Терминал</button>
            <button onClick={() => setShowSkillsPanel(!showSkillsPanel)} className="px-3 py-1.5 bg-teal-600/80 hover:bg-teal-500 text-white rounded-lg text-sm transition-colors shadow-md">🎯 Навыки</button>
            <button onClick={() => setShowQuestsPanel(!showQuestsPanel)} className={"px-3 py-1.5 " + (showQuestsPanel ? 'bg-purple-600' : 'bg-purple-600/80 hover:bg-purple-500') + " text-white rounded-lg text-sm transition-colors shadow-md"}>📋 Квесты</button>
            <button onClick={handleSaveGame} className="px-3 py-1.5 bg-emerald-600/80 hover:bg-emerald-500 text-white rounded-lg text-sm transition-colors shadow-md">💾 Сохранить</button>
          </div>
        </div>
        <div className="mt-2 pointer-events-auto">
          <StressIndicator stress={playerState.stress} panicMode={playerState.panicMode} resilience={playerState.skills.resilience} />
        </div>
        <AnimatePresence>
          {showSkillsPanel && (
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="absolute top-20 left-4 z-40 pointer-events-auto">
              <SkillsPanel skills={playerState.skills} onClose={() => setShowSkillsPanel(false)} />
            </motion.div>
          )}
        </AnimatePresence>
        
        <AnimatePresence>
          {showQuestsPanel && (
            <QuestsPanel
              activeQuestIds={['main_goal', 'first_words']}
              completedQuestIds={[]}
              onClose={() => setShowQuestsPanel(false)}
            />
          )}
        </AnimatePresence>
      </div>

      <AnimatePresence>
        {showStoryPanel && (
          <StoryPanel node={currentNode} onChoice={handleChoice} isTyping={isTyping} displayedText={displayedText} onSkipTyping={skipTyping} />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeCutsceneId && (
          <Suspense fallback={null}>
            <AnimeCutscene cutscene={getCutsceneById(activeCutsceneId)!} onComplete={handleCutsceneComplete} skipable={true} />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {revealedPoemId && (
          <Suspense fallback={null}>
            <PoemReveal poem={getPoemById(revealedPoemId)!} onClose={() => setRevealedPoemId(null)} />
          </Suspense>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showTerminal && (
          <Suspense fallback={null}>
            <SSHTerminal isOpen={showTerminal} onClose={() => setShowTerminal(false)} onCompleteTask={(taskId) => console.log('Task:', taskId)} />
          </Suspense>
        )}
      </AnimatePresence>

      <KernelPanicOverlay isActive={playerState.panicMode} onCalmDown={handleCalmDown} />

      <AnimatePresence>
        {saveNotification && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-emerald-900/95 rounded-lg border border-emerald-500/50 shadow-lg">
            <div className="flex items-center gap-2"><span className="text-2xl">💾</span><span className="text-white font-medium">{saveNotification}</span></div>
          </motion.div>
        )}
      </AnimatePresence>

      {phase === 'game' && currentSceneConfig && (
        <Suspense fallback={null}>
          <MiniMap
            playerPosition={playerPosition}
            sceneSize={{ width: currentSceneConfig.size[0], depth: currentSceneConfig.size[1] }}
            sceneName={currentSceneConfig.name}
            npcs={sceneNPCs.map(npc => ({
              id: npc.id,
              name: npc.name,
              model: npc.model,
              defaultPosition: { x: npc.position[0], y: npc.position[1], z: npc.position[2] },
              sceneId: currentSceneId,
            })) as unknown[]}
          />
        </Suspense>
      )}

      {activeDialogue && (
        <DialogueManager
          isOpen={true}
          npcId={activeDialogue.npcId}
          npcName={activeDialogue.npcName}
          dialogueTree={activeDialogue.node}
          onClose={closeDialogue}
          playerState={playerState}
          npcRelations={npcRelations}
          flags={playerState.flags}
          inventory={[]}
          visitedNodes={playerState.visitedNodes}
          onEffect={() => {}}
          onDialogueStart={() => {}}
        />
      )}

    </div>
  );
}
