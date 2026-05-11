'use client';

/* ─── Volodka RPG – RhythmGame "КИБЕР-РИТМ" ─── */
/* A rhythm game where notes fall down 4 lanes (D, F, J, K) and the player
 * must press the correct key when a note reaches the hit zone at the bottom.
 * Timing matters: Perfect (±30ms) = 300pts, Great (±60ms) = 200pts,
 * Good (±100ms) = 100pts, Miss = 0.
 * Combo system with multiplier (×1 base, +0.5 per 10 combo).
 * 3 difficulty levels with varying note speed and density. */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/* ─── Accent colors (pink/magenta theme) ─── */
const ACCENT_RGB = '236, 72, 153';
const ACCENT_COLOR = `rgba(${ACCENT_RGB}, 0.9)`;
const ACCENT_GLOW = `rgba(${ACCENT_RGB}, 0.3)`;

/* Lane neon colors */
const LANE_COLORS = [
  { rgb: '0, 229, 255',   name: 'cyan',    key: 'D', code: 'KeyD' },
  { rgb: '236, 72, 153',  name: 'magenta', key: 'F', code: 'KeyF' },
  { rgb: '251, 191, 36',  name: 'amber',   key: 'J', code: 'KeyJ' },
  { rgb: '52, 211, 153',  name: 'emerald', key: 'K', code: 'KeyK' },
];

/* ─── Types ─── */
type Difficulty = 'novice' | 'operator' | 'master';
type GamePhase = 'setup' | 'playing' | 'results';

interface RhythmGameProps {
  onClose: () => void;
}

interface Note {
  id: number;
  lane: number;       // 0-3
  targetTime: number; // ms timestamp when note should be hit
  hit: boolean;
  missed: boolean;
  result?: 'perfect' | 'great' | 'good' | 'miss';
}

interface HitFeedback {
  id: number;
  lane: number;
  result: 'perfect' | 'great' | 'good' | 'miss';
  timestamp: number;
}

/* ─── Difficulty configurations ─── */
const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string;
  description: string;
  noteSpeed: number;       // pixels per second
  spawnInterval: number;   // ms between note spawns
  songDuration: number;    // seconds
  accentColor: string;
}> = {
  novice: {
    label: 'Новичок',
    description: 'Медленный ритм, мало нот — 30 сек',
    noteSpeed: 250,
    spawnInterval: 800,
    songDuration: 30,
    accentColor: 'rgba(52, 211, 153, 0.9)',
  },
  operator: {
    label: 'Оператор',
    description: 'Средний темп, больше нот — 45 сек',
    noteSpeed: 350,
    spawnInterval: 600,
    songDuration: 45,
    accentColor: 'rgba(56, 189, 248, 0.9)',
  },
  master: {
    label: 'Мастер',
    description: 'Быстрый ритм, плотный поток — 60 сек',
    noteSpeed: 480,
    spawnInterval: 420,
    songDuration: 60,
    accentColor: 'rgba(244, 63, 94, 0.9)',
  },
};

/* Timing windows in ms */
const PERFECT_WINDOW = 30;
const GREAT_WINDOW = 60;
const GOOD_WINDOW = 100;

/* Score values */
const SCORE_MAP = { perfect: 300, great: 200, good: 100, miss: 0 };

/* ─── Rating calculation ─── */
function getRating(accuracy: number, maxCombo: number): { label: string; color: string; icon: string } {
  if (accuracy >= 95 && maxCombo >= 30) return { label: 'Виртуоз', color: `rgba(${ACCENT_RGB}, 0.95)`, icon: '🎵' };
  if (accuracy >= 80) return { label: 'Маэстро', color: 'rgba(56, 189, 248, 0.9)', icon: '🎶' };
  if (accuracy >= 60) return { label: 'Оператор', color: 'rgba(251, 191, 36, 0.9)', icon: '🎧' };
  return { label: 'Новичок', color: 'rgba(148, 163, 184, 0.7)', icon: '🎼' };
}

/* ─── Hit Lane component (for rendering each lane) ─── */
function HitLane({
  laneIndex,
  activeKey,
  notes,
  noteSpeed,
  trackHeight,
  hitZoneY,
  feedback,
}: {
  laneIndex: number;
  activeKey: boolean;
  notes: Note[];
  noteSpeed: number;
  trackHeight: number;
  hitZoneY: number;
  feedback: HitFeedback | null;
}) {
  const lane = LANE_COLORS[laneIndex];
  const nowRef = useRef(performance.now());
  const [renderNotes, setRenderNotes] = useState<{ id: number; y: number; hit: boolean; missed: boolean }[]>([]);

  useEffect(() => {
    let rafId: number;
    const animate = () => {
      nowRef.current = performance.now();
      const now = nowRef.current;
      const visible = notes
        .filter((n) => !n.hit && !n.missed)
        .map((n) => {
          // Time until this note should arrive at hit zone
          const timeDelta = n.targetTime - now;
          // Convert time to position: hitZoneY is where timeDelta=0
          // notes travel from top (timeDelta > 0) to hitZone (timeDelta = 0) to bottom (timeDelta < 0)
          const pixelsPerMs = noteSpeed / 1000;
          const y = hitZoneY - timeDelta * pixelsPerMs;
          return { id: n.id, y, hit: n.hit, missed: n.missed };
        })
        .filter((n) => n.y > -30 && n.y < trackHeight + 30);
      setRenderNotes(visible);
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [notes, noteSpeed, trackHeight, hitZoneY]);

  return (
    <div
      className="relative flex-1"
      style={{
        borderLeft: laneIndex > 0 ? '1px solid rgba(51, 65, 85, 0.3)' : 'none',
      }}
    >
      {/* Lane background glow when key pressed */}
      <div
        className="absolute inset-0 transition-opacity duration-75"
        style={{
          background: `linear-gradient(180deg, transparent 0%, rgba(${lane.rgb}, ${activeKey ? '0.08' : '0.02'}) 70%, rgba(${lane.rgb}, ${activeKey ? '0.15' : '0.04'}) 100%)`,
          opacity: activeKey ? 1 : 0.5,
        }}
      />

      {/* Key label at top */}
      <div
        className="absolute top-1 left-0 right-0 text-center font-mono text-[10px] font-bold uppercase tracking-wider z-10"
        style={{
          color: activeKey ? `rgba(${lane.rgb}, 0.9)` : `rgba(${lane.rgb}, 0.3)`,
          textShadow: activeKey ? `0 0 8px rgba(${lane.rgb}, 0.5)` : 'none',
        }}
      >
        {lane.key}
      </div>

      {/* Falling notes */}
      {renderNotes.map((n) => (
        <div
          key={n.id}
          className="absolute left-1 right-1 z-10"
          style={{
            top: `${n.y}px`,
            height: '12px',
            borderRadius: '3px',
            background: `linear-gradient(90deg, rgba(${lane.rgb}, 0.7), rgba(${lane.rgb}, 0.9), rgba(${lane.rgb}, 0.7))`,
            boxShadow: `0 0 10px rgba(${lane.rgb}, 0.5), 0 0 3px rgba(${lane.rgb}, 0.8)`,
            border: `1px solid rgba(${lane.rgb}, 0.6)`,
            transition: 'none',
          }}
        />
      ))}

      {/* Hit zone indicator */}
      <div
        className="absolute left-0 right-0 z-20"
        style={{
          top: `${hitZoneY}px`,
          height: '3px',
          background: `rgba(${lane.rgb}, ${activeKey ? '0.8' : '0.3'})`,
          boxShadow: activeKey
            ? `0 0 15px rgba(${lane.rgb}, 0.5), 0 0 5px rgba(${lane.rgb}, 0.3)`
            : `0 0 5px rgba(${lane.rgb}, 0.2)`,
          borderRadius: '1px',
        }}
      />

      {/* Hit feedback text */}
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            className="absolute left-0 right-0 text-center font-mono text-xs font-bold z-30 pointer-events-none"
            style={{
              top: `${hitZoneY - 24}px`,
              color: feedback.result === 'perfect'
                ? `rgba(${lane.rgb}, 1)`
                : feedback.result === 'great'
                  ? 'rgba(56, 189, 248, 0.9)'
                  : feedback.result === 'good'
                    ? 'rgba(251, 191, 36, 0.9)'
                    : 'rgba(244, 63, 94, 0.9)',
              textShadow: `0 0 10px currentColor`,
            }}
            initial={{ opacity: 1, y: 0, scale: 1.2 }}
            animate={{ opacity: 0, y: -20, scale: 0.8 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            {feedback.result === 'perfect' ? 'ИДЕАЛЬНО' :
             feedback.result === 'great' ? 'ОТЛИЧНО' :
             feedback.result === 'good' ? 'ХОРОШО' : 'ПРОМАХ'}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ─── Main Component ─── */
export function RhythmGame({ onClose }: RhythmGameProps) {
  const [difficulty, setDifficulty] = useState<Difficulty>('operator');
  const [gamePhase, setGamePhase] = useState<GamePhase>('setup');
  const [notes, setNotes] = useState<Note[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [perfectCount, setPerfectCount] = useState(0);
  const [greatCount, setGreatCount] = useState(0);
  const [goodCount, setGoodCount] = useState(0);
  const [missCount, setMissCount] = useState(0);
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set());
  const [laneFeedback, setLaneFeedback] = useState<(HitFeedback | null)[]>([null, null, null, null]);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [songProgress, setSongProgress] = useState(0);
  const [rewardsClaimed, setRewardsClaimed] = useState(false);

  const config = DIFFICULTY_CONFIG[difficulty];
  const noteIdRef = useRef(0);
  const gameStartRef = useRef(0);
  const gameEndRef = useRef(0);
  const spawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const rafRef = useRef<number>(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const [trackHeight, setTrackHeight] = useState(400);
  const hitZoneY = trackHeight - 50;
  const notesRef = useRef<Note[]>([]);
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // ── Calculate combo multiplier ──
  const comboMultiplier = 1 + Math.floor(combo / 10) * 0.5;

  // ── Measure track height ──
  useEffect(() => {
    const measure = () => {
      if (trackRef.current) {
        setTrackHeight(trackRef.current.clientHeight);
      }
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [gamePhase]);

  // ── Generate notes for the song ──
  const generateSong = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    const songNotes: Note[] = [];
    const durationMs = cfg.songDuration * 1000;
    let t = 2000; // start 2 seconds in
    let id = 0;

    while (t < durationMs - 2000) {
      // Choose a lane — sometimes 1 note, sometimes 2 simultaneous
      const lane = Math.floor(Math.random() * 4);
      songNotes.push({
        id: id++,
        lane,
        targetTime: t,
        hit: false,
        missed: false,
      });

      // Occasionally add a double note (chord)
      if (Math.random() < 0.2) {
        let lane2 = Math.floor(Math.random() * 4);
        while (lane2 === lane) lane2 = Math.floor(Math.random() * 4);
        songNotes.push({
          id: id++,
          lane: lane2,
          targetTime: t,
          hit: false,
          missed: false,
        });
      }

      // Add some variation to spawn interval
      const variation = (Math.random() - 0.5) * cfg.spawnInterval * 0.4;
      t += cfg.spawnInterval + variation;
    }

    noteIdRef.current = id;
    return songNotes;
  }, []);

  // ── Start game ──
  const startGame = useCallback((diff: Difficulty) => {
    const cfg = DIFFICULTY_CONFIG[diff];
    const songNotes = generateSong(diff);

    setDifficulty(diff);
    setNotes(songNotes);
    setScore(0);
    setCombo(0);
    setMaxCombo(0);
    setPerfectCount(0);
    setGreatCount(0);
    setGoodCount(0);
    setMissCount(0);
    setActiveKeys(new Set());
    setLaneFeedback([null, null, null, null]);
    setTimeRemaining(cfg.songDuration);
    setSongProgress(0);
    setRewardsClaimed(false);
    setGamePhase('playing');

    const now = performance.now();
    gameStartRef.current = now;
    gameEndRef.current = now + cfg.songDuration * 1000;
  }, [generateSong]);

  // ── Game loop: check for missed notes and time ──
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - gameStartRef.current;
      const totalDuration = gameEndRef.current - gameStartRef.current;
      const remaining = Math.max(0, (totalDuration - elapsed) / 1000);
      setTimeRemaining(remaining);
      setSongProgress(Math.min(1, elapsed / totalDuration));

      // Check for missed notes (past the hit window)
      setNotes((prev) => {
        let changed = false;
        const updated = prev.map((n) => {
          if (!n.hit && !n.missed && now > n.targetTime + GOOD_WINDOW) {
            changed = true;
            return { ...n, missed: true, result: 'miss' as const };
          }
          return n;
        });
        if (changed) {
          // Count new misses
          const newMisses = updated.filter((n) => n.missed && n.result === 'miss').length
            - prev.filter((n) => n.missed).length;
          if (newMisses > 0) {
            setMissCount((c) => c + newMisses);
            setCombo(0);
          }
        }
        return changed ? updated : prev;
      });

      // Check if song is over
      if (now > gameEndRef.current + 1500) {
        setGamePhase('results');
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gamePhase]);

  // ── Handle key press ──
  useEffect(() => {
    if (gamePhase !== 'playing') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return;

      const laneIdx = LANE_COLORS.findIndex((l) => l.code === e.code);
      if (laneIdx === -1) return;

      e.preventDefault();

      setActiveKeys((prev) => new Set(prev).add(e.code));

      const now = performance.now();
      const currentNotes = notesRef.current;

      // Find the closest unhit note in this lane
      let closestNote: Note | null = null;
      let closestDelta = Infinity;

      for (const note of currentNotes) {
        if (note.lane !== laneIdx || note.hit || note.missed) continue;
        const delta = Math.abs(now - note.targetTime);
        if (delta < closestDelta) {
          closestDelta = delta;
          closestNote = note;
        }
      }

      if (closestNote && closestDelta <= GOOD_WINDOW) {
        // Determine hit quality
        let result: 'perfect' | 'great' | 'good';
        if (closestDelta <= PERFECT_WINDOW) result = 'perfect';
        else if (closestDelta <= GREAT_WINDOW) result = 'great';
        else result = 'good';

        const points = Math.round(SCORE_MAP[result] * comboMultiplier);

        setNotes((prev) =>
          prev.map((n) =>
            n.id === closestNote!.id ? { ...n, hit: true, result } : n
          )
        );

        setScore((s) => s + points);
        setCombo((c) => {
          const newCombo = c + 1;
          setMaxCombo((m) => Math.max(m, newCombo));
          return newCombo;
        });

        if (result === 'perfect') setPerfectCount((c) => c + 1);
        else if (result === 'great') setGreatCount((c) => c + 1);
        else setGoodCount((c) => c + 1);

        // Show feedback
        setLaneFeedback((prev) => {
          const next = [...prev];
          next[laneIdx] = { id: closestNote!.id, lane: laneIdx, result, timestamp: now };
          return next;
        });

        // Clear feedback after animation
        setTimeout(() => {
          setLaneFeedback((prev) => {
            const next = [...prev];
            if (next[laneIdx]?.id === closestNote!.id) {
              next[laneIdx] = null;
            }
            return next;
          });
        }, 500);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      setActiveKeys((prev) => {
        const next = new Set(prev);
        next.delete(e.code);
        return next;
      });
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [gamePhase, comboMultiplier]);

  // ── ESC to close ──
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (gamePhase === 'playing') {
          cancelAnimationFrame(rafRef.current);
        }
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, gamePhase]);

  // ── Calculate rewards ──
  const calculateRewards = useCallback(() => {
    const totalHits = perfectCount + greatCount + goodCount;
    const totalNotes = totalHits + missCount;
    const accuracy = totalNotes > 0 ? (totalHits / totalNotes) * 100 : 0;

    const xpReward = Math.min(Math.round(score / 8) + 15, 35);
    const karmaReward = Math.min(Math.round(accuracy / 10), 12);
    const rhythmSkill = accuracy >= 80 ? 2 : 1;

    return { xpReward, karmaReward, rhythmSkill, accuracy };
  }, [score, perfectCount, greatCount, goodCount, missCount]);

  // ── Claim rewards ──
  const handleClaimRewards = useCallback(() => {
    if (rewardsClaimed) return;
    const rewards = calculateRewards();
    const store = useGameStore.getState();

    store.addXp(rewards.xpReward);
    store.addKarma(rewards.karmaReward);
    store.addSkill('rhythm', rewards.rhythmSkill);
    store.setFlag('rhythm_game_complete', true);

    eventBus.emit('minigame:complete', {
      gameType: 'rhythm',
      success: rewards.accuracy >= 60,
      reward: [
        { type: 'addXp', value: rewards.xpReward },
        { type: 'addKarma', value: rewards.karmaReward },
        { type: 'addSkill', skill: 'rhythm', value: rewards.rhythmSkill },
      ],
    });

    setRewardsClaimed(true);
    onClose();
  }, [calculateRewards, onClose, rewardsClaimed]);

  /* ═══════════════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════════════ */

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center font-mono"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
    >
      {/* ── Backdrop ── */}
      <motion.div
        className="absolute inset-0 backdrop-blur-md"
        style={{
          background: 'linear-gradient(180deg, rgba(0, 0, 0, 0.88) 0%, rgba(5, 8, 18, 0.92) 100%)',
        }}
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* ── Scanlines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px)',
        }}
      />

      {/* ── Main panel ── */}
      <motion.div
        className="relative z-10 w-full max-w-lg mx-4"
        initial={{ scale: 0.92, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
      >
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
            borderColor: `rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `0 0 60px rgba(${ACCENT_RGB}, 0.06), 0 8px 40px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(${ACCENT_RGB}, 0.05)`,
            clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
          }}
        >
          {/* ── Terminal Header ── */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{
              borderColor: `rgba(${ACCENT_RGB}, 0.15)`,
              background: 'rgba(0, 0, 0, 0.4)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full" style={{ background: `rgba(${ACCENT_RGB}, 0.8)` }} />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" />
              <span className="h-2 w-2 rounded-full bg-red-500/80" />
              <span
                className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: `rgba(${ACCENT_RGB}, 0.35)` }}
              >
                🎵 КИБЕР-РИТМ
              </span>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
              aria-label="Закрыть игру"
            >
              ✕
            </button>
          </div>

          {/* ── Content ── */}
          <div className="relative">
            {/* Scanlines on content */}
            <div
              className="absolute inset-0 pointer-events-none z-20"
              style={{
                background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${ACCENT_RGB}, 0.008) 2px, rgba(${ACCENT_RGB}, 0.008) 4px)`,
              }}
            />

            <AnimatePresence mode="wait">
              {/* ════════════════════════════════════════════════════════
                  SETUP PHASE
                  ════════════════════════════════════════════════════════ */}
              {gamePhase === 'setup' && (
                <motion.div
                  key="setup"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="px-5 py-6 relative z-10"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                    className="text-4xl mb-4 text-center"
                  >
                    🎵
                  </motion.div>

                  <h3
                    className="text-xl font-bold tracking-widest uppercase text-center mb-2"
                    style={{ color: ACCENT_COLOR, textShadow: `0 0 20px ${ACCENT_GLOW}` }}
                  >
                    Кибер-ритм
                  </h3>
                  <p className="text-xs text-center mb-6" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                    Нажимайте клавиши в такт музыке
                  </p>

                  {/* Difficulty selection */}
                  <div className="space-y-3 mb-6">
                    {(Object.entries(DIFFICULTY_CONFIG) as [Difficulty, typeof DIFFICULTY_CONFIG[Difficulty]][]).map(
                      ([key, cfg]) => (
                        <motion.button
                          key={key}
                          onClick={() => setDifficulty(key)}
                          className="w-full px-4 py-3 rounded-md text-left transition-all duration-200"
                          style={{
                            background: difficulty === key ? `rgba(${ACCENT_RGB}, 0.12)` : 'rgba(0, 0, 0, 0.3)',
                            border: `1.5px solid ${difficulty === key ? `rgba(${ACCENT_RGB}, 0.5)` : 'rgba(71, 85, 105, 0.2)'}`,
                            boxShadow: difficulty === key ? `0 0 15px rgba(${ACCENT_RGB}, 0.15)` : 'none',
                          }}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className="font-mono text-sm font-bold tracking-wider uppercase"
                              style={{
                                color: difficulty === key ? ACCENT_COLOR : 'rgba(148, 163, 184, 0.6)',
                              }}
                            >
                              {cfg.label}
                            </span>
                            <span className="font-mono text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.35)' }}>
                              {cfg.songDuration} сек
                            </span>
                          </div>
                          <p className="font-mono text-[10px] mt-1" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                            {cfg.description}
                          </p>
                        </motion.button>
                      ),
                    )}
                  </div>

                  {/* Key bindings display */}
                  <div
                    className="rounded-md p-3 mb-6"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
                    }}
                  >
                    <div className="text-[10px] font-mono uppercase tracking-wider mb-2 text-center" style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}>
                      Управление
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      {LANE_COLORS.map((lane, i) => (
                        <div key={i} className="flex flex-col items-center gap-1">
                          <kbd
                            className="inline-flex items-center justify-center w-8 h-8 rounded-md font-mono text-sm font-bold"
                            style={{
                              background: `rgba(${lane.rgb}, 0.1)`,
                              border: `1px solid rgba(${lane.rgb}, 0.3)`,
                              color: `rgba(${lane.rgb}, 0.8)`,
                              boxShadow: `0 0 8px rgba(${lane.rgb}, 0.15)`,
                            }}
                          >
                            {lane.key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Start button */}
                  <motion.button
                    onClick={() => startGame(difficulty)}
                    className="w-full py-3 rounded-md font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-200"
                    style={{
                      background: `rgba(${ACCENT_RGB}, 0.15)`,
                      border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
                      color: ACCENT_COLOR,
                      boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
                      e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
                      e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
                    }}
                  >
                    Начать ритм
                  </motion.button>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════════
                  PLAYING PHASE
                  ════════════════════════════════════════════════════════ */}
              {gamePhase === 'playing' && (
                <motion.div
                  key="playing"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="relative z-10"
                >
                  {/* ── Top HUD ── */}
                  <div
                    className="flex items-center justify-between px-4 py-2 border-b"
                    style={{
                      background: 'rgba(0, 0, 0, 0.3)',
                      borderColor: `rgba(${ACCENT_RGB}, 0.1)`,
                    }}
                  >
                    {/* Score */}
                    <div className="flex items-center gap-3">
                      <motion.span
                        key={score}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="font-mono text-sm font-bold"
                        style={{ color: ACCENT_COLOR, textShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)` }}
                      >
                        {score}
                      </motion.span>
                    </div>

                    {/* Combo */}
                    <div className="flex items-center gap-2">
                      {combo > 0 && (
                        <motion.div
                          key={combo}
                          initial={{ scale: 1.3 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-1"
                        >
                          <span className="text-xs">🔥</span>
                          <span
                            className="font-mono text-xs font-bold"
                            style={{
                              color: combo >= 30 ? 'rgba(236, 72, 153, 0.9)' :
                                     combo >= 20 ? 'rgba(251, 191, 36, 0.9)' :
                                     combo >= 10 ? 'rgba(56, 189, 248, 0.9)' :
                                     'rgba(148, 163, 184, 0.7)',
                              textShadow: combo >= 20 ? `0 0 8px currentColor` : 'none',
                            }}
                          >
                            ×{combo}
                          </span>
                          <span
                            className="font-mono text-[10px]"
                            style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
                          >
                            (×{comboMultiplier.toFixed(1)})
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Timer */}
                    <div className="flex items-center gap-2">
                      <span
                        className="font-mono text-xs"
                        style={{ color: timeRemaining <= 5 ? 'rgba(244, 63, 94, 0.9)' : 'rgba(148, 163, 184, 0.7)' }}
                      >
                        {Math.ceil(timeRemaining)}с
                      </span>
                      <span
                        className="font-mono text-[10px] px-1.5 py-0.5 rounded"
                        style={{
                          background: `rgba(${ACCENT_RGB}, 0.08)`,
                          border: `1px solid rgba(${ACCENT_RGB}, 0.2)`,
                          color: `rgba(${ACCENT_RGB}, 0.6)`,
                        }}
                      >
                        {config.label}
                      </span>
                    </div>
                  </div>

                  {/* ── Progress bar ── */}
                  <div className="h-0.5" style={{ background: 'rgba(15, 23, 42, 0.8)' }}>
                    <div
                      className="h-full transition-all duration-300"
                      style={{
                        width: `${songProgress * 100}%`,
                        background: `linear-gradient(90deg, rgba(${ACCENT_RGB}, 0.4), rgba(${ACCENT_RGB}, 0.8))`,
                        boxShadow: `0 0 8px rgba(${ACCENT_RGB}, 0.3)`,
                      }}
                    />
                  </div>

                  {/* ── Note track ── */}
                  <div
                    ref={trackRef}
                    className="relative flex"
                    style={{ height: '340px', background: 'rgba(0, 0, 0, 0.2)' }}
                  >
                    {/* Background lane dividers and hit zone line */}
                    <div
                      className="absolute left-0 right-0 z-5 pointer-events-none"
                      style={{
                        top: `${hitZoneY}px`,
                        height: '1px',
                        background: `linear-gradient(90deg, rgba(0, 229, 255, 0.3), rgba(236, 72, 153, 0.3), rgba(251, 191, 36, 0.3), rgba(52, 211, 153, 0.3))`,
                        boxShadow: `0 0 10px rgba(${ACCENT_RGB}, 0.15)`,
                      }}
                    />

                    {/* Hit zone glow band */}
                    <div
                      className="absolute left-0 right-0 z-0 pointer-events-none"
                      style={{
                        top: `${hitZoneY - 20}px`,
                        height: '40px',
                        background: `linear-gradient(180deg, transparent, rgba(${ACCENT_RGB}, 0.03), transparent)`,
                      }}
                    />

                    {LANE_COLORS.map((_, i) => (
                      <HitLane
                        key={i}
                        laneIndex={i}
                        activeKey={activeKeys.has(LANE_COLORS[i].code)}
                        notes={notes.filter((n) => n.lane === i)}
                        noteSpeed={config.noteSpeed}
                        trackHeight={trackHeight}
                        hitZoneY={hitZoneY}
                        feedback={laneFeedback[i]}
                      />
                    ))}
                  </div>

                  {/* ── Bottom key indicators ── */}
                  <div
                    className="flex border-t"
                    style={{ borderColor: `rgba(${ACCENT_RGB}, 0.1)` }}
                  >
                    {LANE_COLORS.map((lane, i) => (
                      <div
                        key={i}
                        className="flex-1 flex items-center justify-center py-2"
                        style={{
                          borderLeft: i > 0 ? '1px solid rgba(51, 65, 85, 0.3)' : 'none',
                          background: activeKeys.has(lane.code)
                            ? `rgba(${lane.rgb}, 0.15)`
                            : 'rgba(0, 0, 0, 0.2)',
                        }}
                      >
                        <kbd
                          className="inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold font-mono transition-all duration-75"
                          style={{
                            background: activeKeys.has(lane.code)
                              ? `rgba(${lane.rgb}, 0.2)`
                              : `rgba(${lane.rgb}, 0.05)`,
                            border: `1px solid rgba(${lane.rgb}, ${activeKeys.has(lane.code) ? '0.6' : '0.2'})`,
                            color: `rgba(${lane.rgb}, ${activeKeys.has(lane.code) ? '0.9' : '0.4'})`,
                            boxShadow: activeKeys.has(lane.code)
                              ? `0 0 12px rgba(${lane.rgb}, 0.3)`
                              : 'none',
                          }}
                        >
                          {lane.key}
                        </kbd>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ════════════════════════════════════════════════════════
                  RESULTS PHASE
                  ════════════════════════════════════════════════════════ */}
              {gamePhase === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                  className="px-5 py-5 relative z-10"
                >
                  {(() => {
                    const rewards = calculateRewards();
                    const rating = getRating(rewards.accuracy, maxCombo);

                    return (
                      <>
                        {/* Rating */}
                        <div className="text-center mb-4">
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                            className="text-4xl mb-2"
                          >
                            {rating.icon}
                          </motion.div>
                          <motion.h3
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 }}
                            className="text-lg font-bold tracking-widest uppercase"
                            style={{ color: rating.color, textShadow: `0 0 15px ${rating.color}` }}
                          >
                            {rating.label}
                          </motion.h3>
                        </div>

                        {/* Score */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.4 }}
                          className="text-center mb-4"
                        >
                          <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}>
                            Итого очков
                          </div>
                          <motion.div
                            className="text-3xl font-bold"
                            style={{ color: ACCENT_COLOR, textShadow: `0 0 20px rgba(${ACCENT_RGB}, 0.4)` }}
                            initial={{ scale: 0.5 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', stiffness: 150, damping: 10, delay: 0.5 }}
                          >
                            {score}
                          </motion.div>
                        </motion.div>

                        {/* Stats grid */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.6 }}
                          className="grid grid-cols-2 gap-2 mb-4"
                        >
                          <div
                            className="rounded-md p-2.5 text-center"
                            style={{ background: 'rgba(236, 72, 153, 0.06)', border: '1px solid rgba(236, 72, 153, 0.15)' }}
                          >
                            <div className="text-sm font-bold" style={{ color: 'rgba(236, 72, 153, 0.9)' }}>
                              {perfectCount}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(236, 72, 153, 0.5)' }}>
                              Идеально
                            </div>
                          </div>
                          <div
                            className="rounded-md p-2.5 text-center"
                            style={{ background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.15)' }}
                          >
                            <div className="text-sm font-bold" style={{ color: 'rgba(56, 189, 248, 0.9)' }}>
                              {greatCount}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(56, 189, 248, 0.5)' }}>
                              Отлично
                            </div>
                          </div>
                          <div
                            className="rounded-md p-2.5 text-center"
                            style={{ background: 'rgba(251, 191, 36, 0.06)', border: '1px solid rgba(251, 191, 36, 0.15)' }}
                          >
                            <div className="text-sm font-bold" style={{ color: 'rgba(251, 191, 36, 0.9)' }}>
                              {goodCount}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(251, 191, 36, 0.5)' }}>
                              Хорошо
                            </div>
                          </div>
                          <div
                            className="rounded-md p-2.5 text-center"
                            style={{ background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.15)' }}
                          >
                            <div className="text-sm font-bold" style={{ color: 'rgba(244, 63, 94, 0.9)' }}>
                              {missCount}
                            </div>
                            <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(244, 63, 94, 0.5)' }}>
                              Промах
                            </div>
                          </div>
                        </motion.div>

                        {/* Accuracy + Max Combo */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.7 }}
                          className="rounded-md p-3 mb-4 space-y-1.5"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
                          }}
                        >
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Точность</span>
                            <span style={{ color: ACCENT_COLOR }}>{rewards.accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Макс. комбо</span>
                            <span style={{ color: 'rgba(251, 146, 60, 0.9)' }}>{maxCombo}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs font-mono">
                            <span style={{ color: 'rgba(148, 163, 184, 0.5)' }}>Множитель (макс.)</span>
                            <span style={{ color: 'rgba(56, 189, 248, 0.9)' }}>
                              ×{(1 + Math.floor(maxCombo / 10) * 0.5).toFixed(1)}
                            </span>
                          </div>
                        </motion.div>

                        {/* Rewards */}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.8 }}
                          className="rounded-md p-3 mb-4"
                          style={{
                            background: 'rgba(0, 0, 0, 0.3)',
                            border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
                          }}
                        >
                          <span
                            className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2 text-center"
                            style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
                          >
                            Награды
                          </span>
                          <div className="flex items-center justify-center gap-4 text-xs font-mono">
                            <span style={{ color: '#00ffee' }}>+{rewards.xpReward} XP</span>
                            <span style={{ color: '#ffcc00' }}>+{rewards.karmaReward} карма</span>
                            <span style={{ color: ACCENT_COLOR }}>+{rewards.rhythmSkill} ритм</span>
                          </div>
                        </motion.div>

                        {/* Claim button */}
                        <motion.button
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.9 }}
                          onClick={handleClaimRewards}
                          disabled={rewardsClaimed}
                          className="w-full py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200 mb-2"
                          style={{
                            background: rewardsClaimed ? 'rgba(71, 85, 105, 0.1)' : `rgba(${ACCENT_RGB}, 0.15)`,
                            border: `1px solid ${rewardsClaimed ? 'rgba(71, 85, 105, 0.2)' : `rgba(${ACCENT_RGB}, 0.4)`}`,
                            color: rewardsClaimed ? 'rgba(148, 163, 184, 0.3)' : ACCENT_COLOR,
                            boxShadow: rewardsClaimed ? 'none' : `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
                            cursor: rewardsClaimed ? 'default' : 'pointer',
                          }}
                          whileHover={!rewardsClaimed ? { scale: 1.02 } : {}}
                          whileTap={!rewardsClaimed ? { scale: 0.98 } : {}}
                          onMouseEnter={(e) => {
                            if (!rewardsClaimed) {
                              e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
                              e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!rewardsClaimed) {
                              e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
                              e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
                            }
                          }}
                        >
                          {rewardsClaimed ? 'Награды получены' : 'Забрать награды'}
                        </motion.button>

                        {/* Retry */}
                        <motion.button
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 1.0 }}
                          onClick={() => startGame(difficulty)}
                          className="w-full py-2 rounded-md font-mono text-xs tracking-[0.1em] uppercase transition-all duration-200"
                          style={{
                            background: 'rgba(0, 0, 0, 0.2)',
                            border: '1px solid rgba(71, 85, 105, 0.2)',
                            color: 'rgba(148, 163, 184, 0.5)',
                          }}
                          whileHover={{ scale: 1.01, borderColor: 'rgba(71, 85, 105, 0.4)' }}
                          whileTap={{ scale: 0.99 }}
                        >
                          Играть снова
                        </motion.button>
                      </>
                    );
                  })()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* ── Footer ── */}
          <div
            className="px-5 py-2 border-t flex items-center justify-center"
            style={{ borderColor: `rgba(${ACCENT_RGB}, 0.1)` }}
          >
            <div className="flex items-center gap-1.5">
              <kbd
                className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
                style={{
                  background: 'rgba(15, 23, 42, 0.6)',
                  borderColor: 'rgba(100, 116, 139, 0.25)',
                  color: 'rgba(148, 163, 184, 0.5)',
                }}
              >
                Esc
              </kbd>
              <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
                выйти
              </span>
            </div>
          </div>
        </div>

        {/* ── Corner glow decorations ── */}
        <div
          className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `-2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
        />
        <div
          className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
        />
        <div
          className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `-2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
        />
        <div
          className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
        />
      </motion.div>
    </motion.div>
  );
}
