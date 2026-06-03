
/* ─── Volodka RPG – Main story/narrative overlay (AAA+ Polish v2) ───
   Enhanced with: speaker portrait, atmospheric background tint,
   skip button, page-turn animation, stat change highlighting.
*/

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Zap, Ghost, User, SkipForward, BookOpen, Eye } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { STORY_NODES } from '@/data/storyNodes';
import { createInventoryItem } from '@/data/items';
import { audioEngine } from '@/engine/AudioEngine';
import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';
import { SCENE_CONFIG } from '@/config/scenes';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { StoryChoice, StoryEffect, PlayerSkills, TrainablePlayerSkill } from '@/shared/types/game';

/* ── Typewriter hook — shared ── */
import { useTypewriter } from '@/hooks/useTypewriter';

/* ── Apply effects — shared ── */
import { applyEffects } from '@/shared/utils/applyEffects';

/* ══════════════════════════════════════════════════════════════
   SCENE MOOD TINT MAP — atmospheric overlay based on scene
   ══════════════════════════════════════════════════════════════ */
const MOOD_TINTS: Record<string, { color: string; intensity: number }> = {
  volodka_room: { color: '0, 255, 100', intensity: 0.03 },
  volodka_corridor: { color: '255, 204, 100', intensity: 0.02 },
  home_evening: { color: '255, 170, 68', intensity: 0.04 },
  street_night: { color: '50, 100, 255', intensity: 0.03 },
  street_winter: { color: '200, 220, 255', intensity: 0.03 },
  cafe_evening: { color: '136, 68, 255', intensity: 0.03 },
  office_day: { color: '0, 150, 200', intensity: 0.02 },
  park_day: { color: '50, 200, 50', intensity: 0.03 },
  library_day: { color: '139, 92, 42', intensity: 0.03 },
  battle: { color: '255, 50, 50', intensity: 0.05 },
  sleep_dream: { color: '120, 0, 200', intensity: 0.05 },
  rooftop_edge: { color: '100, 100, 180', intensity: 0.03 },
  abandoned_factory: { color: '120, 80, 40', intensity: 0.03 },
  zarema_albert_room: { color: '200, 150, 80', intensity: 0.03 },
};

/* ══════════════════════════════════════════════════════════════
   SPEAKER PORTRAIT SILHOUETTES — SVG-based
   ══════════════════════════════════════════════════════════════ */
function SpeakerPortrait({ speaker }: { speaker: string }) {
  const isNarrator = speaker === 'narrator' || speaker === 'Голос';

  if (isNarrator) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          borderColor: 'rgba(148,163,184,0.3)',
          background: 'radial-gradient(ellipse at center, rgba(148,163,184,0.08) 0%, transparent 70%)',
          boxShadow: '0 0 16px rgba(148,163,184,0.15)',
        }}
      >
        <Ghost className="size-7 text-slate-400/60" />
      </motion.div>
    );
  }

  // Player / Володя
  if (speaker === 'Володя' || speaker === 'volodka') {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 shrink-0 flex items-center justify-center overflow-hidden"
        style={{
          borderColor: 'rgba(34,211,238,0.4)',
          background: 'radial-gradient(ellipse at center, rgba(34,211,238,0.1) 0%, transparent 70%)',
          boxShadow: '0 0 16px rgba(34,211,238,0.2)',
        }}
      >
        <User className="size-7 text-cyan-400/60" />
      </motion.div>
    );
  }

  // Generic NPC speaker — colored by name hash
  const hash = speaker.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const hue = (hash * 137) % 360;
  const accentColor = `hsl(${hue}, 60%, 60%)`;
  const accentBg = `hsla(${hue}, 60%, 60%, 0.08)`;
  const accentBorder = `hsla(${hue}, 60%, 60%, 0.4)`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
      className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl border-2 shrink-0 flex items-center justify-center overflow-hidden relative"
      style={{
        borderColor: accentBorder,
        background: `radial-gradient(ellipse at center, ${accentBg} 0%, transparent 70%)`,
        boxShadow: `0 0 16px hsla(${hue}, 60%, 60%, 0.2)`,
      }}
    >
      {/* Stylized NPC silhouette */}
      <svg viewBox="0 0 60 60" className="w-10 h-10" style={{ filter: `drop-shadow(0 0 4px ${accentColor})` }}>
        {/* Head */}
        <circle cx="30" cy="20" r="10" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.6" />
        {/* Shoulders */}
        <path d="M15 45 Q15 32 30 30 Q45 32 45 45" fill="none" stroke={accentColor} strokeWidth="1.5" opacity="0.5" />
        {/* Eyes */}
        <circle cx="26" cy="19" r="1.5" fill={accentColor} opacity="0.7" />
        <circle cx="34" cy="19" r="1.5" fill={accentColor} opacity="0.7" />
      </svg>
    </motion.div>
  );
}

/* ── Check choice conditions ── */
function checkCondition(
  condition: StoryChoice['condition'],
  playerState: { karma: number; skills: PlayerSkills; flags: Record<string, boolean>; currentAct: number },
): { pass: boolean; skillCheck?: { skill: TrainablePlayerSkill; needed: number; current: number } } {
  if (!condition) return { pass: true };

  if (condition.minKarma !== undefined && playerState.karma < condition.minKarma) return { pass: false };
  if (condition.maxKarma !== undefined && playerState.karma > condition.maxKarma) return { pass: false };
  if (condition.flag && !playerState.flags[condition.flag]) return { pass: false };
  if (condition.requiredAct !== undefined && playerState.currentAct < condition.requiredAct) return { pass: false };
  if (condition.minSkill) {
    for (const [skill, needed] of Object.entries(condition.minSkill)) {
      const current = playerState.skills[skill as TrainablePlayerSkill] ?? 0;
      if (current < (needed as number)) {
        return { pass: false, skillCheck: { skill: skill as TrainablePlayerSkill, needed: needed as number, current } };
      }
    }
  }
  return { pass: true };
}

/* ── Scene atmosphere gradient blob ── */
function SceneIllustrationBlob({ sceneId }: { sceneId: string }) {
  const sceneGradients: Record<string, { from: string; to: string; size: string }> = {
    volodka_room: { from: 'rgba(0,255,100,0.08)', to: 'rgba(0,100,50,0.02)', size: '300px' },
    volodka_corridor: { from: 'rgba(255,204,100,0.06)', to: 'rgba(100,80,0,0.02)', size: '250px' },
    home_evening: { from: 'rgba(255,170,68,0.08)', to: 'rgba(100,50,0,0.02)', size: '280px' },
    street_night: { from: 'rgba(0,100,255,0.06)', to: 'rgba(50,0,100,0.02)', size: '320px' },
    street_winter: { from: 'rgba(200,220,255,0.06)', to: 'rgba(100,120,200,0.02)', size: '300px' },
    cafe_evening: { from: 'rgba(68,136,255,0.06)', to: 'rgba(255,136,68,0.02)', size: '280px' },
    office_day: { from: 'rgba(0,150,200,0.06)', to: 'rgba(0,50,100,0.02)', size: '260px' },
    park_day: { from: 'rgba(50,200,50,0.06)', to: 'rgba(0,100,0,0.02)', size: '340px' },
    library_day: { from: 'rgba(139,92,42,0.06)', to: 'rgba(80,40,10,0.02)', size: '250px' },
    battle: { from: 'rgba(255,50,50,0.08)', to: 'rgba(100,0,0,0.02)', size: '300px' },
    sleep_dream: { from: 'rgba(80,0,120,0.08)', to: 'rgba(20,0,50,0.02)', size: '350px' },
    rooftop_edge: { from: 'rgba(100,100,150,0.06)', to: 'rgba(30,30,50,0.02)', size: '280px' },
    abandoned_factory: { from: 'rgba(100,80,60,0.06)', to: 'rgba(50,30,10,0.02)', size: '300px' },
    zarema_albert_room: { from: 'rgba(200,150,100,0.06)', to: 'rgba(100,60,30,0.02)', size: '250px' },
  };

  const gradient = sceneGradients[sceneId] ?? sceneGradients.volodka_room;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 1, ease: 'easeOut' }}
      className="absolute top-1/4 right-4 pointer-events-none"
      style={{
        width: gradient.size, height: gradient.size, borderRadius: '50%',
        background: `radial-gradient(ellipse at center, ${gradient.from} 0%, ${gradient.to} 70%, transparent 100%)`,
        filter: 'blur(40px)', transform: 'translateY(-50%)',
      }}
    />
  );
}

/* ── Stat change highlight chip ── */
function StatChangeChip({ effect }: { effect: StoryEffect }) {
  if (effect.type === 'addKarma' && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-cyan-950/40 border border-cyan-500/30 text-cyan-300"
      >
        {effect.value > 0 ? '+' : ''}{effect.value}☯
      </motion.span>
    );
  }
  if (effect.type === 'addStat' && effect.stat === 'energy' && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
          effect.value > 0 ? 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300' : 'bg-rose-950/40 border border-rose-500/30 text-rose-300'
        }`}
      >
        {effect.value > 0 ? '+' : ''}{effect.value}⚡
      </motion.span>
    );
  }
  if (effect.type === 'addStat' && effect.stat === 'stress' && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono ${
          effect.value > 0 ? 'bg-rose-950/40 border border-rose-500/30 text-rose-300' : 'bg-emerald-950/40 border border-emerald-500/30 text-emerald-300'
        }`}
      >
        {effect.value > 0 ? '+' : ''}{effect.value}😤
      </motion.span>
    );
  }
  if (effect.type === 'addSkill' && effect.skill && effect.value) {
    return (
      <motion.span
        initial={{ opacity: 0, scale: 0.5, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.5 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-mono bg-violet-950/40 border border-violet-500/30 text-violet-300"
      >
        +{effect.value} {effect.skill}
      </motion.span>
    );
  }
  return null;
}

/* ── Page turn animation variants ── */
const pageTurnVariants = {
  enter: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? 8 : -8,
    x: direction > 0 ? 30 : -30,
  }),
  center: {
    opacity: 1,
    rotateY: 0,
    x: 0,
  },
  exit: (direction: number) => ({
    opacity: 0,
    rotateY: direction > 0 ? -8 : 8,
    x: direction > 0 ? -30 : 30,
  }),
};

/* ── Component ── */
export function StoryRenderer() {
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const currentNodeId = useGameStore((s) => s.currentNodeId);
  const playerState = useGameStore((s) => s.playerState);
  const currentAct = useGameStore((s) => s.playerState.progression.currentAct);
  const setMode = useGameStore((s) => s.setMode);
  const setCurrentNodeId = useGameStore((s) => s.setCurrentNodeId);
  const setShowStoryOverlay = useGameStore((s) => s.setShowStoryOverlay);
  const visitNode = useGameStore((s) => s.visitNode);

  const [pageDirection, setPageDirection] = useState(0);
  const [appliedEffects, setAppliedEffects] = useState<StoryEffect[]>([]);

  const node = useMemo(() => STORY_NODES[currentNodeId], [currentNodeId]);

  const { displayed, done, skip } = useTypewriter(node?.text ?? '', 28);

  // Visit node on mount
  useEffect(() => {
    if (node) {
      visitNode(node.id);
      if (node.effects && node.effects.length > 0) {
        applyEffects(node.effects);
        // Show stat change chips briefly (deferred to avoid sync setState in effect)
        const effectsToShow = node.effects;
        setTimeout(() => {
          setAppliedEffects(effectsToShow);
          setTimeout(() => setAppliedEffects([]), 3000);
        }, 0);
      } else {
        setTimeout(() => setAppliedEffects([]), 0);
      }
      if (node.sceneId) {
        const store = useGameStore.getState();
        const currentScene = store.exploration.currentSceneId;
        if (node.sceneId !== currentScene) {
          store.setExplorationScene(node.sceneId);
          const spawn = SCENE_CONFIG[node.sceneId]?.spawnPoint ?? [0, 0.01, 0] as [number, number, number];
          store.setPlayerPosition(spawn);
          eventBus.emit('scene:enter', { sceneId: node.sceneId, fromSceneId: currentScene });
        }
      }
    }
  }, [node, visitNode]);

  const handleChoice = useCallback(
    (choice: StoryChoice) => {
      audioEngine.playSfx('confirm');

      if (choice.effects) {
        applyEffects(choice.effects);
        // Show stat change chips for the choice
        setAppliedEffects(choice.effects);
        setTimeout(() => setAppliedEffects([]), 3000);
      }

      // Page direction for animation
      setPageDirection(1);

      if (choice.next === 'explore_mode') {
        const store = useGameStore.getState();
        const currentScene = store.exploration.currentSceneId;
        const currentNode = STORY_NODES[store.currentNodeId];
        if (currentNode?.sceneId && currentNode.sceneId !== currentScene) {
          store.setExplorationScene(currentNode.sceneId);
          const spawn = SCENE_CONFIG[currentNode.sceneId]?.spawnPoint ?? [0, 0.01, 0] as [number, number, number];
          store.setPlayerPosition(spawn);
          eventBus.emit('scene:enter', { sceneId: currentNode.sceneId, fromSceneId: currentScene });
        }

        const hasWokeUpFlag = choice.effects?.some((e: StoryEffect) => e.type === 'setFlag' && e.flag === 'woke_up');
        if (hasWokeUpFlag) {
          setShowStoryOverlay(false);
          setCurrentNodeId(''); // Clear so cutscene/scene:enter can't re-show overlay
          // ── World Director: no need to setMode('exploration') — already in exploration ──
          // Only emit stand_up / camera events if the intro was NOT seen.
          // If the intro played, PhaseWaking already emitted these events
          // during the cinematic — emitting them again causes a double
          // stand-up animation glitch.
          if (!useGameStore.getState().introSeen) {
            setTimeout(() => {
              eventBus.emit('player:stand_up', {});
              eventBus.emit('camera:intro_wake', {});
            }, 150);
          }
          return;
        }

        setShowStoryOverlay(false);
        setCurrentNodeId(''); // Clear node ID so cutscene end handler can't re-show overlay
      } else {
        setCurrentNodeId(choice.next);
        const nextNode = STORY_NODES[choice.next];
        if (nextNode?.sceneId) {
          const store = useGameStore.getState();
          const currentScene = store.exploration.currentSceneId;
          if (nextNode.sceneId !== currentScene) {
            store.setExplorationScene(nextNode.sceneId);
            const spawn = SCENE_CONFIG[nextNode.sceneId]?.spawnPoint ?? [0, 0.01, 0] as [number, number, number];
            store.setPlayerPosition(spawn);
            eventBus.emit('scene:enter', { sceneId: nextNode.sceneId, fromSceneId: currentScene });
          }
        }
      }
    },
    [setMode, setCurrentNodeId, setShowStoryOverlay],
  );

  const handleContinue = useCallback(() => {
    audioEngine.playSfx('confirm');
    const store = useGameStore.getState();
    const currentScene = store.exploration.currentSceneId;
    const currentNode = STORY_NODES[store.currentNodeId];
    if (currentNode?.sceneId && currentNode.sceneId !== currentScene) {
      store.setExplorationScene(currentNode.sceneId);
      const spawn = SCENE_CONFIG[currentNode.sceneId]?.spawnPoint ?? [0, 0.01, 0] as [number, number, number];
      store.setPlayerPosition(spawn);
      eventBus.emit('scene:enter', { sceneId: currentNode.sceneId, fromSceneId: currentScene });
    }
    setShowStoryOverlay(false);
    // Clear currentNodeId so that cutscene end handlers and scene:enter
    // listeners in GameOrchestrator/GuidedStoryManager cannot re-show the
    // overlay after the player has explicitly dismissed it.
    setCurrentNodeId('');
  }, [setShowStoryOverlay, setCurrentNodeId]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!done || !node || node.choices.length === 0) return;

    const handleKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

      const num = parseInt(e.key);
      if (num >= 1 && num <= node.choices.length) {
        const choice = node.choices[num - 1];
        const cond = checkCondition(choice.condition, { ...playerState, currentAct });
        if (cond.pass) handleChoice(choice);
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [done, node, playerState, handleChoice]);

  if (!showStoryOverlay || !node) return null;

  const karmaLevel =
    playerState.karma >= KARMA_HIGH_THRESHOLD
      ? 'high'
      : playerState.karma <= KARMA_LOW_THRESHOLD
        ? 'low'
        : 'mid';

  const speakerColor =
    node.speaker === 'narrator'
      ? 'text-slate-300'
      : karmaLevel === 'high'
        ? 'text-cyan-400'
        : karmaLevel === 'low'
          ? 'text-rose-400'
          : 'text-slate-200';

  // Mood tint
  const moodTint = node.sceneId ? MOOD_TINTS[node.sceneId] : null;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={`story-${currentNodeId}`}
        custom={pageDirection}
        variants={pageTurnVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="fixed inset-0 flex items-center justify-center"
        style={{ zIndex: UI_LAYERS.DIALOGUE, perspective: '800px' }}
        onClick={done ? undefined : skip}
      >
        {/* Background */}
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

        {/* Atmospheric mood tint */}
        {moodTint && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 pointer-events-none"
            style={{ background: `radial-gradient(ellipse at center, rgba(${moodTint.color}, ${moodTint.intensity}) 0%, transparent 70%)` }}
          />
        )}

        {/* Cinematic letterbox bars */}
        <div className="absolute top-0 left-0 right-0 h-[10%] bg-black/90" />
        <div className="absolute bottom-0 left-0 right-0 h-[10%] bg-black/90" />

        {/* Top gradient */}
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to bottom, transparent 0%, transparent 8%, rgba(0,0,0,0.3) 15%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.1) 60%, rgba(0,0,0,0.3) 85%, transparent 92%, transparent 100%)',
          }}
        />

        {/* Scanlines */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.03]"
          style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.03) 2px, rgba(255,255,255,0.03) 4px)' }}
        />

        {/* Vignette */}
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.6) 100%)' }}
        />

        {/* Scene illustration blob */}
        {node.sceneId && <SceneIllustrationBlob sceneId={node.sceneId} />}

        {/* Content */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="relative z-10 w-full max-w-2xl mx-4 sm:mx-auto"
        >
          {/* Speaker portrait + name row */}
          {node.speaker && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4 }}
              className={`mb-4 flex items-center gap-3 ${speakerColor}`}
            >
              <SpeakerPortrait speaker={node.speaker} />
              <div>
                <span className="text-sm font-medium tracking-wider uppercase">
                  {node.speaker === 'narrator' ? 'Голос' : node.speaker}
                </span>
                {/* Skip button */}
                {!done && (
                  <button
                    onClick={(e) => { e.stopPropagation(); skip(); }}
                    className="ml-3 flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                  >
                    <SkipForward className="size-3" />
                    Пропустить
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {/* Scene mood description */}
          {node.sceneId && done && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="mb-3 text-xs text-slate-500/60 italic tracking-wide flex items-center gap-1.5"
            >
              <Eye className="size-3" />
              {node.sceneId === 'volodka_room' && 'Мерцание монитора в тишине комнаты...'}
              {node.sceneId === 'volodka_corridor' && 'Тусклый свет в пустом коридоре...'}
              {node.sceneId === 'home_evening' && 'Тёплый свет кухни и запах домашней еды...'}
              {node.sceneId === 'street_night' && 'Ночной город, неоновые вывески мерцают в тумане...'}
              {node.sceneId === 'street_winter' && 'Зимняя стужа, снег скрипит под ногами...'}
              {node.sceneId === 'cafe_evening' && 'Бархатный полумрак кафе, тихий гул голосов...'}
              {node.sceneId === 'office_day' && 'Гудение серверов и холодный свет офисных ламп...'}
              {node.sceneId === 'park_day' && 'Шелест листьев и далёкие голоса в парке...'}
              {node.sceneId === 'library_day' && 'Запах старых книг в тишине библиотеки...'}
              {node.sceneId === 'battle' && 'Электрический треск, стены дрожат...'}
              {node.sceneId === 'sleep_dream' && 'Граница между сном и явью растворяется...'}
              {node.sceneId === 'rooftop_edge' && 'Ветер на высоте, город внизу как на ладони...'}
              {node.sceneId === 'abandoned_factory' && 'Эхо в пустых цехах, ржавчина и пыль...'}
              {node.sceneId === 'zarema_albert_room' && 'Уютная комната, пахнет чаем и книгами...'}
            </motion.div>
          )}

          {/* Story text */}
          <div className="min-h-[120px] mb-4">
            <p className="text-lg sm:text-xl text-slate-100 leading-relaxed font-light">
              {displayed}
              {!done && (
                <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse ml-0.5 align-middle" />
              )}
            </p>
          </div>

          {/* Stat change highlight chips */}
          <AnimatePresence>
            {appliedEffects.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-wrap gap-1.5 mb-4"
              >
                {appliedEffects.map((effect, i) => (
                  <StatChangeChip key={i} effect={effect} />
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Choices */}
          {done && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col gap-3"
            >
              {node.choices.length > 0 ? (
                node.choices.map((choice, i) => {
                  const cond = checkCondition(choice.condition, { ...playerState, currentAct });
                  return (
                    <motion.button
                      key={`${currentNodeId}-choice-${i}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1, duration: 0.3, ease: 'easeOut' }}
                      whileHover={cond.pass ? { scale: 1.02, x: 4 } : {}}
                      whileTap={cond.pass ? { scale: 0.98 } : {}}
                      onClick={() => { if (cond.pass) handleChoice(choice); }}
                      disabled={!cond.pass}
                      className={`
                        group relative text-left px-5 py-3 rounded-lg transition-all duration-200 overflow-hidden
                        ${cond.pass
                          ? 'border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]'
                          : 'border border-slate-700/40 bg-slate-900/20 text-slate-500 cursor-not-allowed opacity-50'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`
                          inline-flex items-center justify-center w-6 h-6 rounded text-xs font-bold shrink-0
                          ${cond.pass ? 'bg-cyan-900/60 border border-cyan-500/30 text-cyan-300' : 'bg-slate-800/60 border border-slate-600/30 text-slate-500'}
                        `}>
                          {i + 1}
                        </span>
                        <span className="flex-1">{choice.text}</span>
                        {cond.skillCheck && (
                          <span className="flex items-center gap-1 text-xs text-rose-400">
                            <Zap className="size-3" />
                            {cond.skillCheck.skill} {cond.skillCheck.needed}
                          </span>
                        )}
                      </div>
                      {/* Corner accents */}
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500/50 rounded-tl" />
                      <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500/50 rounded-br" />
                    </motion.button>
                  );
                })
              ) : (
                <motion.button
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleContinue}
                  className="group relative text-left px-5 py-3 rounded-lg border border-cyan-800/60 bg-cyan-950/30 hover:bg-cyan-900/40 hover:border-cyan-500/70 text-slate-100 cursor-pointer transition-all duration-200 hover:shadow-[0_0_15px_rgba(34,211,238,0.1)]"
                >
                  <div className="flex items-center gap-3">
                    <ChevronRight className="size-4 text-cyan-500 group-hover:text-cyan-300 transition-colors" />
                    <span>Продолжить</span>
                  </div>
                </motion.button>
              )}
            </motion.div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
