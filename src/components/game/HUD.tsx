'use client';

/* ─── Volodka RPG – Exploration HUD (AAA+ Cyberpunk Polish v2) ───
   Enhanced with: smooth counter animations, quest notification badge,
   karma breathing animation, XP gain floating text, achievement popup,
   better mobile responsive layout.
*/

import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';
import {
  Save,
  Menu,
  Zap,
  Sun,
  Moon,
  CloudSun,
  Cloud,
  CloudRain,
  Snowflake,
  CloudFog,
  CloudLightning,
  BookOpen,
  Package,
  Lightbulb,
  ScrollText,
  Clock,
  Activity,
  Shield,
  Gamepad2,
  User,
  Users,
  BookMarked,
  Trophy,
  MessageCircle,
  MoreVertical,
  Sparkles,
  Hammer,
  ShoppingCart,
  Star,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Camera,
} from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { SCENE_CONFIG } from '@/config/scenes';
import { KARMA_LOW_THRESHOLD, KARMA_HIGH_THRESHOLD } from '@/data/constants';
import { useNextTrackedObjective, useActiveQuests } from '@/store/questStore';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { POEMS } from '@/data/poems';
import { eventBus } from '@/engine/EventBus';
import { floatXP, floatKarma, floatEnergy, floatStress, floatLevelUp, floatSkill } from '@/components/game/FloatingText';
import { type WeatherType, determineWeatherType, WEATHER_EFFECTS } from '@/data/weatherEffects';
import { StatusEffectsBar } from '@/components/game/StatusEffectsBar';

const TOTAL_POEMS = POEMS.length;

/* ── Weather icon from WeatherType ── */
function WeatherIcon({ type, className = 'size-4' }: { type: WeatherType; className?: string }) {
  const weatherEffect = WEATHER_EFFECTS[type];
  const color = weatherEffect?.color ?? '#f0c040';
  switch (type) {
    case 'rain': return <CloudRain className={className} style={{ color }} />;
    case 'snow': return <Snowflake className={className} style={{ color }} />;
    case 'fog': return <CloudFog className={className} style={{ color }} />;
    case 'storm': return <CloudLightning className={className} style={{ color }} />;
    default: return <Sun className={className} style={{ color }} />;
  }
}

/* ── Ambient particles for status panel background ── */
function AmbientParticles() {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- client-only mount guard to prevent hydration mismatch
  useEffect(() => { setMounted(true); }, []);

  const particles = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => {
      // Use seeded random to avoid hydration mismatch
      const s = (seed: number) => { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); };
      return {
        id: i,
        left: `${(10 + s(i * 7 + 100) * 80).toFixed(1)}%`,
        top: `${(20 + s(i * 11 + 200) * 70).toFixed(1)}%`,
        delay: `${(s(i * 13 + 300) * 6).toFixed(1)}s`,
        duration: `${(4 + s(i * 17 + 400) * 4).toFixed(1)}s`,
        size: `${(1 + s(i * 19 + 500) * 1.5).toFixed(1)}px`,
      };
    }),
  []);

  if (!mounted) return null;

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((p) => (
        <div
          key={p.id}
          className="ambient-particle"
          style={{
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            animationDelay: p.delay,
            animationDuration: p.duration,
          }}
        />
      ))}
    </div>
  );
}

/* ── Time of day icon ── */
function TimeIcon({ hour }: { hour: number }) {
  if (hour >= 6 && hour < 10) return <CloudSun className="size-4 text-amber-400" />;
  if (hour >= 10 && hour < 18) return <Sun className="size-4 text-amber-300" />;
  if (hour >= 18 && hour < 21) return <CloudSun className="size-4 text-orange-400" />;
  return <Moon className="size-4 text-slate-300" />;
}

/* ── Time of day label ── */
function timeLabel(hour: number): string {
  if (hour >= 6 && hour < 10) return 'Утро';
  if (hour >= 10 && hour < 18) return 'День';
  if (hour >= 18 && hour < 21) return 'Вечер';
  return 'Ночь';
}

/* ── Karma color ── */
function karmaColor(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return 'text-cyan-400';
  if (karma <= KARMA_LOW_THRESHOLD) return 'text-rose-400';
  return 'text-amber-400';
}

function karmaStroke(karma: number): string {
  if (karma >= KARMA_HIGH_THRESHOLD) return '#22d3ee';
  if (karma <= KARMA_LOW_THRESHOLD) return '#fb7185';
  return '#fbbf24';
}

/* ══════════════════════════════════════════════════════════════
   SMOOTH ANIMATED COUNTER — rolls from old to new value
   ══════════════════════════════════════════════════════════════ */
function AnimatedCounter({ value, className, style }: { value: number; className?: string; style?: React.CSSProperties }) {
  const spring = useSpring(value, { stiffness: 120, damping: 30 });
  const display = useTransform(spring, (v) => Math.round(v));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  return (
    <motion.span className={className} style={style}>
      <motion.span>{display}</motion.span>
    </motion.span>
  );
}

/* ══════════════════════════════════════════════════════════════
   KARMA RING — with breathing animation
   ══════════════════════════════════════════════════════════════ */
function KarmaRing({ karma }: { karma: number }) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (karma / 100) * circumference;
  const color = karmaStroke(karma);

  return (
    <div className="relative breathe-glow">
      <motion.svg
        width="36" height="36" viewBox="0 0 36 36"
        className="shrink-0"
        animate={{ scale: [1, 1.04, 1] }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      >
        <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(100,116,139,0.25)" strokeWidth="3" />
        <circle
          cx="18" cy="18" r={radius} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
          transform="rotate(-90 18 18)"
          style={{ transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease', filter: `drop-shadow(0 0 4px ${color}60)` }}
        />
        <text x="18" y="20" textAnchor="middle" fontSize="12" fill={color} className="select-none"
          style={{ filter: 'drop-shadow(0 0 3px currentColor)', transition: 'fill 0.5s ease' }}>☯</text>
      </motion.svg>
      {/* Breathing glow ring */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [`0 0 0px ${color}00`, `0 0 12px ${color}40`, `0 0 0px ${color}00`],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ── Pulse indicator for stat changes ── */
function StatPulse({ active, color = 'cyan' }: { active: boolean; color?: 'cyan' | 'emerald' | 'rose' | 'amber' }) {
  const colorMap = { cyan: 'bg-cyan-400/30', emerald: 'bg-emerald-400/30', rose: 'bg-rose-400/30', amber: 'bg-amber-400/30' };
  const glowMap = { cyan: 'shadow-[0_0_8px_rgba(34,211,238,0.5)]', emerald: 'shadow-[0_0_8px_rgba(52,211,153,0.5)]', rose: 'shadow-[0_0_8px_rgba(251,113,133,0.5)]', amber: 'shadow-[0_0_8px_rgba(251,191,36,0.5)]' };
  return (
    <AnimatePresence>
      {active && (
        <motion.span
          initial={{ scale: 0.5, opacity: 1 }} animate={{ scale: 2.5, opacity: 0 }} exit={{ opacity: 0 }}
          transition={{ duration: 0.8 }}
          className={`absolute inset-0 rounded-full ${colorMap[color]} ${glowMap[color]} pointer-events-none`}
        />
      )}
    </AnimatePresence>
  );
}

/* ── Animated stat bar with glow and segment marks ── */
function CyberStatBar({
  value,
  max = 100,
  color,
  glowColor,
  showSegments = true,
  shimmer = false,
}: {
  value: number;
  max?: number;
  color: string;
  glowColor: string;
  showSegments?: boolean;
  /** When true, applies a one-shot shimmer sweep effect via CSS */
  shimmer?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  // Use key to re-trigger the shimmer animation when shimmer toggles true
  const shimmerKey = shimmer ? `shimmer-${Date.now()}` : undefined;
  return (
    <div className={`relative h-2.5 bg-slate-800/80 rounded-full overflow-hidden ${value / max < 0.3 ? (color.includes('#ef4444') || color.includes('red') ? 'low-bar-pulse' : 'low-bar-pulse-amber') : ''} ${shimmer ? 'stat-shimmer' : ''}`} style={{ boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.3)' }} key={shimmerKey}>
      {showSegments && (
        <div className="absolute inset-0 flex items-center pointer-events-none">
          {[25, 50, 75].map((mark) => (
            <div key={mark} className="absolute top-0 bottom-0 w-px bg-slate-700/40" style={{ left: `${mark}%` }} />
          ))}
        </div>
      )}
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full"
        style={{ background: color, boxShadow: `0 0 10px ${glowColor}, 0 0 3px ${glowColor}, inset 0 1px 0 rgba(255,255,255,0.15)` }}
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
      />
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full overflow-hidden"
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        style={{ background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)' }}
      >
        <motion.div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)' }}
          animate={{ x: ['-100%', '200%'] }}
          transition={{ duration: 2, repeat: Infinity, repeatDelay: 3, ease: 'linear' }}
        />
      </motion.div>
    </div>
  );
}

/* ── Level badge with level-up flash + perk count + XP mini-bar ── */
function LevelBadge({ level, perkCount = 0, xp = 0, xpToNext = 100 }: { level: number; perkCount?: number; xp?: number; xpToNext?: number }) {
  const [justLeveled, setJustLeveled] = useState(false);
  const prevLevel = useRef(level);
  const xpPct = Math.min(100, Math.max(0, (xp / xpToNext) * 100));

  useEffect(() => {
    if (level > prevLevel.current) {
      prevLevel.current = level;
      const t = setTimeout(() => {
        setJustLeveled(true);
        floatLevelUp(level);
        setTimeout(() => setJustLeveled(false), 1500);
      }, 0);
      return () => clearTimeout(t);
    }
  }, [level]);

  return (
    <div className="flex flex-col gap-0.5 relative">
      <div className="flex items-center gap-1.5">
        <motion.div
          className={`flex items-center justify-center w-7 h-7 rounded border text-[11px] font-bold font-mono ${justLeveled ? 'level-pulse-anim' : ''}`}
          animate={justLeveled ? { scale: [1, 1.3, 1], borderColor: ['rgba(251,191,36,0.6)', 'rgba(251,191,36,0.8)', 'rgba(34,211,238,0.3)'] } : {}}
          transition={{ duration: 0.6 }}
          style={{
            borderColor: justLeveled ? 'rgba(251,191,36,0.6)' : 'rgba(34,211,238,0.35)',
            background: justLeveled ? 'rgba(251,191,36,0.15)' : 'rgba(34,211,238,0.1)',
            color: justLeveled ? '#fbbf24' : '#22d3ee',
            textShadow: justLeveled ? '0 0 8px rgba(251,191,36,0.6)' : '0 0 6px rgba(34,211,238,0.5)',
            boxShadow: justLeveled ? '0 0 12px rgba(251,191,36,0.3)' : '0 0 8px rgba(34,211,238,0.15)',
          }}
        >
          {level}
        </motion.div>
        <span className="text-[10px] text-cyan-400/80 font-mono uppercase tracking-wider font-semibold">УР</span>
        {/* Perk count badge */}
        {perkCount > 0 && (
          <span
            className="text-[9px] font-mono font-bold text-amber-400/80"
            style={{ textShadow: '0 0 6px rgba(251,191,36,0.3)' }}
          >
            ★{perkCount}
          </span>
        )}
        {/* Level-up flash */}
        <AnimatePresence>
          {justLeveled && (
            <motion.div
              initial={{ opacity: 0.8, scale: 1 }}
              animate={{ opacity: 0, scale: 2.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="absolute -inset-2 rounded-full bg-amber-400/20 pointer-events-none"
            />
          )}
        </AnimatePresence>
      </div>
      {/* Mini XP progress bar (2px) below level number */}
      <div
        className="h-[2px] w-full rounded-full overflow-hidden"
        style={{ background: 'rgba(30,41,59,0.6)' }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: justLeveled
              ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
              : 'linear-gradient(90deg, #0891b2, #22d3ee)',
            boxShadow: justLeveled
              ? '0 0 4px rgba(251,191,36,0.4)'
              : '0 0 3px rgba(34,211,238,0.2)',
          }}
          initial={false}
          animate={{ width: `${xpPct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MINI ACHIEVEMENT POPUP — appears when skill levels up
   ══════════════════════════════════════════════════════════════ */
function AchievementPopup() {
  const [achievement, setAchievement] = useState<{ title: string; description: string; icon?: string } | null>(null);

  useEffect(() => {
    const unsub = eventBus.on('fx:achievement', (payload) => {
      setAchievement(payload);
      setTimeout(() => setAchievement(null), 3000);
    });

    // Also listen for skill level-ups and show achievement
    const unsubSkill = eventBus.on('skill:level_up', (payload) => {
      setAchievement({
        title: `${payload.skill} ур.${payload.level}`,
        description: `Навык улучшен!`,
        icon: '⬆',
      });
      setTimeout(() => setAchievement(null), 3000);
    });

    return () => { unsub(); unsubSkill(); };
  }, []);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.9 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-28 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ zIndex: UI_LAYERS.TOASTS + 2 }}
        >
          <div
            className="flex items-center gap-3 px-5 py-3 rounded-xl border backdrop-blur-md"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,0.15) 0%, rgba(15,23,42,0.92) 50%, rgba(0,0,0,0.85) 100%)',
              borderColor: 'rgba(251,191,36,0.4)',
              boxShadow: '0 0 30px rgba(251,191,36,0.15), 0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {/* Icon */}
            <div className="size-10 rounded-lg flex items-center justify-center text-xl"
              style={{
                background: 'rgba(251,191,36,0.15)',
                boxShadow: '0 0 12px rgba(251,191,36,0.2)',
              }}
            >
              {achievement.icon ? achievement.icon : <Star className="size-5 text-amber-400" />}
            </div>
            <div>
              <div className="text-sm font-semibold text-amber-200 font-mono">{achievement.title}</div>
              <div className="text-xs text-slate-400">{achievement.description}</div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ── Secondary menu item for "More" dropdown ── */
interface SecondaryAction {
  icon: React.ReactNode;
  label: string;
  shortcut?: string;
  onClick?: () => void;
  badge?: number; // notification badge count
}

function HUDMenuItem({ icon, label, shortcut, onClick, badge }: SecondaryAction) {
  return (
    <button
      onClick={() => { onClick?.(); }}
      className="flex items-center gap-3 w-full px-3 py-2 text-left text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors duration-150 rounded-md relative"
    >
      <span className="shrink-0 relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-[8px] font-bold text-black flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="flex-1 text-xs font-medium">{label}</span>
      {shortcut && (
        <kbd className="text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-700/40 bg-slate-800/50 text-slate-500">
          {shortcut}
        </kbd>
      )}
    </button>
  );
}

/* ══════════════════════════════════════════════════════════════
   QUEST NOTIFICATION BADGE — tracks new/unread quests
   ══════════════════════════════════════════════════════════════ */
function useQuestNotificationCount() {
  const activeQuests = useActiveQuests();
  // Count recently activated quests (activated in last 30 seconds)
  const [newCount, setNewCount] = useState(0);
  const seenQuests = useRef<Set<string>>(new Set());
  const recentQueue = useRef<{ questId: string; time: number }[]>([]);

  useEffect(() => {
    for (const q of activeQuests) {
      if (!seenQuests.current.has(q.questId)) {
        seenQuests.current.add(q.questId);
        recentQueue.current.push({ questId: q.questId, time: Date.now() });
      }
    }

    const now = Date.now();
    const recent = recentQueue.current.filter((r) => now - r.time < 30000);
    recentQueue.current = recent;
    setNewCount(recent.length);

    // Cleanup old entries every 5s
    const timer = setInterval(() => {
      const n = Date.now();
      const r = recentQueue.current.filter((e) => n - e.time < 30000);
      recentQueue.current = r;
      setNewCount(r.length);
    }, 5000);

    return () => clearInterval(timer);
  }, [activeQuests]);

  return newCount;
}

/* ── Component ── */
interface HUDProps {
  onOpenQuests?: () => void;
  onOpenInventory?: () => void;
  onOpenPoetry?: () => void;
  onToggleTutorials?: () => void;
  onOpenMenu?: () => void;
  onOpenMiniGames?: () => void;
  onOpenCharacterProfile?: () => void;
  onOpenNPCRelations?: () => void;
  onOpenCodex?: () => void;
  onOpenDialogueHistory?: () => void;
  onOpenAchievements?: () => void;
  onOpenSkillTree?: () => void;
  onOpenCrafting?: () => void;
  onOpenTrading?: () => void;
  onOpenFastTravel?: () => void;
  onOpenPerks?: () => void;
  onOpenQuestBoard?: () => void;
  onOpenStats?: () => void;
}

export function HUD({ onOpenQuests, onOpenInventory, onOpenPoetry, onToggleTutorials, onOpenMenu, onOpenMiniGames, onOpenCharacterProfile, onOpenNPCRelations, onOpenCodex, onOpenDialogueHistory, onOpenAchievements, onOpenSkillTree, onOpenCrafting, onOpenTrading, onOpenFastTravel, onOpenPerks, onOpenQuestBoard, onOpenStats }: HUDProps) {
  const currentSceneId = useGameStore((s) => s.exploration.currentSceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const weatherEnabled = useGameStore((s) => s.exploration.weatherEnabled);
  const rainIntensity = useGameStore((s) => s.exploration.rainIntensity);
  const playerState = useGameStore((s) => s.playerState);
  const saveGame = useGameStore((s) => s.saveGame);
  const collectedPoems = useGameStore((s) => s.collectedPoems);

  // ── Weather type computation ──
  const [snowActive, setSnowActive] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload: { active: boolean }) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  const currentWeather: WeatherType = useMemo(() =>
    determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay],
  );

  const sceneConfig = SCENE_CONFIG[currentSceneId];
  const sceneName = sceneConfig?.name ?? 'Неизвестно';

  const activeQuests = useActiveQuests();
  const firstQuestId = activeQuests.length > 0 ? activeQuests[0].questId : '';
  const nextObjective = useNextTrackedObjective(firstQuestId);
  const questNotificationCount = useQuestNotificationCount();

  // ── Quick-save indicator ──
  const [showSaveIndicator, setShowSaveIndicator] = useState(false);

  const handleSave = useCallback(() => {
    saveGame({ source: 'manual' });
    setShowSaveIndicator(true);
    setTimeout(() => setShowSaveIndicator(false), 2000);
  }, [saveGame]);

  const { karma, energy, stress } = playerState;
  const level = playerState.progression?.level ?? 1;
  const xp = playerState.progression?.xp ?? 0;
  const xpToNext = playerState.progression?.xpToNextLevel ?? 100;
  const perkCount = playerState.progression?.unlockedPerks?.length ?? 0;

  // ── Active status effects count (mirrors StatusEffectsBar logic) ──
  const activeStatusEffectCount = useMemo(() => {
    let count = 0;
    if (currentWeather !== 'clear') count += 1;
    const unlockedPerks = playerState.progression?.unlockedPerks ?? [];
    const PERK_EFFECT_MAP: Record<string, boolean> = {
      night_watch: true, iron_stomach: true, counterattack: true, poetic_trance: true,
    };
    for (const perkId of unlockedPerks) {
      if (PERK_EFFECT_MAP[perkId]) count += 1;
    }
    if (energy < 25) count += 1;
    if (stress > 70) count += 1;
    return count;
  }, [currentWeather, playerState.progression?.unlockedPerks, energy, stress]);

  // ── Karma direction indicator ──
  const [karmaDirection, setKarmaDirection] = useState<'up' | 'down' | null>(null);
  const karmaDirectionTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Pulse animation on stat changes
  const [karmaPulse, setKarmaPulse] = useState(false);
  const [energyPulse, setEnergyPulse] = useState(false);
  const [stressPulse, setStressPulse] = useState(false);
  const prevKarma = useRef(karma);
  const prevEnergy = useRef(energy);
  const prevStress = useRef(stress);
  const prevLevel = useRef(level);
  const prevXp = useRef(xp);

  // Stat change tracking — also spawns floating text
  useEffect(() => {
    if (karma !== prevKarma.current) {
      const delta = karma - prevKarma.current;
      prevKarma.current = karma;
      if (delta !== 0) floatKarma(delta);
      // Karma direction indicator — deferred to avoid synchronous setState in effect
      const dirTimeout = setTimeout(() => {
        if (delta > 0) setKarmaDirection('up');
        else if (delta < 0) setKarmaDirection('down');
        if (karmaDirectionTimeout.current) clearTimeout(karmaDirectionTimeout.current);
        karmaDirectionTimeout.current = setTimeout(() => setKarmaDirection(null), 2000);
      }, 0);
      const t = setTimeout(() => setKarmaPulse(true), 0);
      const t2 = setTimeout(() => setKarmaPulse(false), 600);
      return () => { clearTimeout(t); clearTimeout(t2); clearTimeout(dirTimeout); };
    }
  }, [karma]);

  useEffect(() => {
    if (energy !== prevEnergy.current) {
      const delta = energy - prevEnergy.current;
      prevEnergy.current = energy;
      if (delta !== 0) floatEnergy(delta);
      const t = setTimeout(() => setEnergyPulse(true), 0);
      const t2 = setTimeout(() => setEnergyPulse(false), 600);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [energy]);

  useEffect(() => {
    if (stress !== prevStress.current) {
      const delta = stress - prevStress.current;
      prevStress.current = stress;
      if (delta !== 0) floatStress(delta);
      const t = setTimeout(() => setStressPulse(true), 0);
      const t2 = setTimeout(() => setStressPulse(false), 600);
      return () => { clearTimeout(t); clearTimeout(t2); };
    }
  }, [stress]);

  // Track XP changes and spawn floating text
  useEffect(() => {
    if (xp !== prevXp.current) {
      const delta = xp - prevXp.current;
      prevXp.current = xp;
      if (delta > 0) floatXP(delta);
    }
  }, [xp]);

  // Track level changes
  useEffect(() => {
    if (level > prevLevel.current) {
      prevLevel.current = level;
      // floatLevelUp is handled in LevelBadge
    }
  }, [level]);

  // ── "More" dropdown state ──
  const [moreMenuOpen, setMoreMenuOpen] = useState(false);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setMoreMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [moreMenuOpen]);

  // Close on Escape
  useEffect(() => {
    if (!moreMenuOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMoreMenuOpen(false);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [moreMenuOpen]);

  // Secondary actions for the "More" dropdown
  const secondaryActions: SecondaryAction[] = useMemo(() => [
    { icon: <span className="size-4 flex items-center justify-center text-sm">🧭</span>, label: 'Быстрый переход', shortcut: 'F', onClick: onOpenFastTravel },
    { icon: <Sparkles className="size-4" />, label: 'Навыки', shortcut: 'T', onClick: onOpenSkillTree },
    { icon: <Sparkles className="size-4" />, label: 'Черты', shortcut: 'V', onClick: onOpenPerks },
    { icon: <ScrollText className="size-4" />, label: 'Доска заданий', shortcut: 'B', onClick: onOpenQuestBoard },
    { icon: <ShoppingCart className="size-4" />, label: 'Торговля', shortcut: '⇧T', onClick: onOpenTrading },
    { icon: <Gamepad2 className="size-4" />, label: 'Мини-игры', shortcut: 'M', onClick: onOpenMiniGames },
    { icon: <User className="size-4" />, label: 'Профиль', shortcut: 'C', onClick: onOpenCharacterProfile },
    { icon: <Users className="size-4" />, label: 'Отношения', shortcut: 'N', onClick: onOpenNPCRelations },
    { icon: <BookMarked className="size-4" />, label: 'Кодекс', shortcut: 'K', onClick: onOpenCodex },
    { icon: <MessageCircle className="size-4" />, label: 'История диалогов', shortcut: 'L', onClick: onOpenDialogueHistory },
    { icon: <Trophy className="size-4" />, label: 'Достижения', shortcut: 'H', onClick: onOpenAchievements },
    { icon: <Lightbulb className="size-4" />, label: 'Подсказки', onClick: onToggleTutorials },
    { icon: <Menu className="size-4" />, label: 'Меню', onClick: onOpenMenu },
  ], [onOpenFastTravel, onOpenSkillTree, onOpenPerks, onOpenQuestBoard, onOpenTrading, onOpenMiniGames, onOpenCharacterProfile, onOpenNPCRelations, onOpenCodex, onOpenDialogueHistory, onOpenAchievements, onToggleTutorials, onOpenMenu]);

  // ── Photo mode: hide HUD when active ──
  const [photoModeOn, setPhotoModeOn] = useState(false);
  useEffect(() => {
    const activeSub = eventBus.on('photo:active', () => setPhotoModeOn(true));
    const inactiveSub = eventBus.on('photo:inactive', () => setPhotoModeOn(false));
    return () => { activeSub(); inactiveSub(); };
  }, []);

  // Warning states
  const isLowEnergy = energy < 25;
  const isHighStress = stress > 70;

  if (photoModeOn) return null;

  return (
    <div
      data-exploration-ui
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: UI_LAYERS.HUD }}
    >
      {/* ── Achievement popup ── */}
      <AchievementPopup />

      {/* ── Center: Crosshair ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div className="relative">
          <div className="w-1 h-1 rounded-full bg-white/30 mx-auto" style={{ boxShadow: '0 0 3px rgba(255,255,255,0.4)' }} />
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2.5 h-[3px] border-t border-l border-r border-white/[0.08] rounded-t-sm" />
          <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-2.5 h-[3px] border-b border-l border-r border-white/[0.08] rounded-b-sm" />
          <div className="absolute top-1/2 -left-2 -translate-y-1/2 w-[3px] h-2.5 border-t border-l border-b border-white/[0.08] rounded-l-sm" />
          <div className="absolute top-1/2 -right-2 -translate-y-1/2 w-[3px] h-2.5 border-t border-r border-b border-white/[0.08] rounded-r-sm" />
        </div>
      </div>

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-auto">
        <div
          className="flex items-center justify-between px-2 py-1.5 sm:px-4 sm:py-2.5 hud-scanline-bar"
          style={{
            background: 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(0,0,0,0.7) 60%, transparent 100%)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
          }}
        >
          {/* Left: Scene name + time */}
          <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
            <div className="flex items-center gap-1 shrink-0">
              <div className="w-1.5 h-1.5 rounded-full" style={{ background: karmaStroke(karma), boxShadow: `0 0 6px ${karmaStroke(karma)}40` }} />
            </div>
            <TimeIcon hour={timeOfDay} />
            <div className="flex flex-col min-w-0">
              <div className="flex items-center gap-1 sm:gap-1.5">
                <span className="text-slate-100 text-sm sm:text-base font-semibold tracking-wide truncate neon-text-cyan">{sceneName}</span>
                <span className="text-[9px] text-slate-500 font-mono hidden sm:inline">●</span>
                <span className="text-[10px] text-slate-300/80 font-mono hidden sm:inline">{timeLabel(timeOfDay)}</span>
              </div>
            </div>
            <div className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded border ml-0.5"
              style={{ borderColor: 'rgba(34,211,238,0.15)', background: 'rgba(34,211,238,0.05)' }}
            >
              <Clock className="size-2.5 text-cyan-500/60" />
              <span className="text-cyan-400/80 text-[11px] font-mono tabular-nums">{Math.floor(timeOfDay).toString().padStart(2, '0')}:{((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')}</span>
            </div>
            <span className="sm:hidden text-cyan-400/70 text-[10px] font-mono tabular-nums">
              {Math.floor(timeOfDay).toString().padStart(2, '0')}:{((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')}
            </span>
          </div>

          {/* Right: Level + XP + Poem + Quest + Buttons + More */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            <LevelBadge level={level} perkCount={perkCount} xp={xp} xpToNext={xpToNext} />

            {/* XP progress mini-bar */}
            <div className="hidden md:flex flex-col items-center gap-0 w-16">
              <div className="h-1 w-full bg-slate-800/60 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: 'linear-gradient(90deg, from-cyan-600/60 to-cyan-400/60)' }}
                  initial={false}
                  animate={{ width: `${(xp / xpToNext) * 100}%` }}
                  transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
                />
              </div>
              <span className="text-[8px] text-slate-400 font-mono tabular-nums">{xp}/{xpToNext} XP</span>
            </div>

            <div className="w-px h-5 bg-slate-700/30 mx-0.5 hidden md:block" />

            {/* Poem count badge */}
            <button
              onClick={onOpenPoetry}
              className="flex items-center gap-1 sm:gap-1.5 px-1.5 sm:px-2.5 py-1 rounded-md text-xs border transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400/60"
              title="Стихи [⇧P]"
              style={{
                background: 'rgba(120,60,10,0.25)',
                borderColor: 'rgba(251,191,36,0.35)',
                boxShadow: '0 0 12px rgba(251,191,36,0.15), inset 0 0 6px rgba(251,191,36,0.05)',
              }}
            >
              <span className="text-sm">📖</span>
              <span className="text-amber-200 font-semibold hidden sm:inline" style={{ textShadow: '0 0 8px rgba(251,191,36,0.4)' }}>Стихи:</span>
              <AnimatedCounter value={collectedPoems.length} className="text-amber-300 font-bold" style={{ textShadow: '0 0 6px rgba(251,191,36,0.5)' }} />
              <span className="text-amber-500/60 hidden sm:inline">/</span>
              <span className="text-amber-400/70 hidden sm:inline">{TOTAL_POEMS}</span>
            </button>

            <div className="w-px h-4 bg-slate-700/25 mx-0.5" />

            {/* Status effects count badge */}
            {activeStatusEffectCount > 0 && (
              <div
                className="flex items-center gap-1 px-1.5 py-0.5 rounded-md border cyber-tooltip"
                data-tooltip={`Эффекты: ${activeStatusEffectCount}`}
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: 'rgba(100,116,139,0.2)',
                }}
              >
                <Activity className="size-3 text-slate-400" />
                <span className="text-[9px] text-slate-300/70 font-mono font-semibold">{activeStatusEffectCount}</span>
              </div>
            )}

            {/* Quest button with notification badge */}
            <div className="relative">
              <HUDButton icon={<ScrollText className="size-3.5 sm:size-4" />} label="Задания [Q]" onClick={onOpenQuests} tooltip="Задания [Q]" />
              {/* Notification badge */}
              <AnimatePresence>
                {questNotificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                    className="absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-amber-500 text-[8px] font-bold text-black flex items-center justify-center px-1"
                    style={{ boxShadow: '0 0 8px rgba(251,191,36,0.5)' }}
                  >
                    {questNotificationCount > 9 ? '9+' : questNotificationCount}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>

            <HUDButton icon={<BookOpen className="size-3.5 sm:size-4" />} label="Журнал [J]" onClick={() => useGameStore.getState().toggleJournal()} tooltip="Журнал [J]" />
            <HUDButton icon={<Package className="size-3.5 sm:size-4" />} label="Инвентарь [I]" onClick={onOpenInventory} tooltip="Инвентарь [I]" />

            {/* Hide some buttons on small screens */}
            <div className="hidden sm:block">
              <HUDButton icon={<ShoppingCart className="size-3.5 sm:size-4" />} label="Торговля [⇧T]" onClick={onOpenTrading} tooltip="Торговля [⇧T]" />
            </div>
            <div className="hidden md:block">
              <HUDButton icon={<Hammer className="size-3.5 sm:size-4" />} label="Крафт [G]" onClick={onOpenCrafting} tooltip="Крафт [G]" />
            </div>
            <HUDButton icon={<Save className="size-3.5 sm:size-4" />} label="Сохранить" onClick={handleSave} tooltip="Сохранить [F5]" />
            <HUDButton icon={<Camera className="size-3.5 sm:size-4" />} label="Фото" onClick={() => eventBus.emit('photo:toggle', {})} tooltip="Фото [P]" />
            <HUDButton icon={<BarChart3 className="size-3.5 sm:size-4" />} label="Статистика" onClick={onOpenStats} tooltip="Статистика [S]" />

            {/* Weather status indicator */}
            {currentWeather !== 'clear' && (
              <div
                className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 rounded-md border"
                style={{
                  background: 'rgba(0,0,0,0.3)',
                  borderColor: 'rgba(100,116,139,0.2)',
                }}
                title={WEATHER_EFFECTS[currentWeather]?.description ?? ''}
              >
                <WeatherIcon type={currentWeather} className="size-3 weather-icon-bob" />
              </div>
            )}

            {/* More dropdown trigger */}
            <div className="relative" ref={moreMenuRef}>
              <HUDButton
                icon={<MoreVertical className="size-3.5 sm:size-4" />}
                label="Ещё"
                onClick={() => setMoreMenuOpen((prev) => !prev)}
                active={moreMenuOpen}
                tooltip="Ещё [...]"
              />

              <AnimatePresence>
                {moreMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute right-0 top-full mt-1.5 w-52 rounded-lg border backdrop-blur-xl overflow-hidden"
                    style={{
                      background: 'linear-gradient(145deg, rgba(0,0,0,0.92) 0%, rgba(15,23,42,0.88) 50%, rgba(0,0,0,0.85) 100%)',
                      borderColor: 'rgba(34,211,238,0.2)',
                      boxShadow: '0 0 20px rgba(34,211,238,0.08), 0 8px 32px rgba(0,0,0,0.5)',
                      zIndex: UI_LAYERS.HUD + 5,
                    }}
                  >
                    <div className="px-3 py-2 border-b border-slate-700/30">
                      <span className="text-[10px] text-slate-500 font-mono uppercase tracking-widest">Действия</span>
                    </div>
                    <div className="py-1 px-1 max-h-64 overflow-y-auto">
                      {secondaryActions.map((action) => (
                        <HUDMenuItem
                          key={action.label}
                          icon={action.icon}
                          label={action.label}
                          shortcut={action.shortcut}
                          badge={action.label === 'Задания' ? questNotificationCount : undefined}
                          onClick={() => { setMoreMenuOpen(false); action.onClick?.(); }}
                        />
                      ))}
                    </div>
                    <div className="px-3 py-1.5 border-t border-slate-700/30">
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-slate-400 font-mono">volodka://actions</span>
                        <div className="flex items-center gap-1">
                          <kbd className="text-[8px] text-slate-500 font-mono px-1 py-0.5 rounded border border-slate-700/30 bg-slate-800/40">Esc</kbd>
                          <span className="text-[8px] text-slate-500">закрыть</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="hidden lg:flex items-center px-1.5 py-0.5 rounded border border-slate-700/20 bg-slate-900/30">
              <kbd className="text-[9px] text-slate-400 font-mono">F1</kbd>
              <span className="text-[9px] text-slate-400 ml-1">Справка</span>
            </div>
          </div>
        </div>

        {/* Bottom edge glow line */}
        <motion.div
          className="h-px mx-4"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.2) 30%, rgba(34,211,238,0.35) 50%, rgba(34,211,238,0.2) 70%, transparent)' }}
        />
      </div>

      {/* ── Quest objective indicator (top-center) ── */}
      <AnimatePresence>
        {nextObjective && (() => {
          const questDef = QUEST_DEFINITIONS.find((d) => d.id === firstQuestId);
          const questTitle = questDef?.title ?? '';
          return (
            <motion.div
              key={`quest-indicator-${firstQuestId}`}
              initial={{ opacity: 0, y: -12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="absolute top-14 sm:top-16 left-1/2 -translate-x-1/2 pointer-events-auto"
              style={{ zIndex: UI_LAYERS.HUD + 1 }}
            >
              <button
                onClick={onOpenQuests}
                className="flex flex-col items-center gap-0.5 px-5 py-2.5 rounded-lg border border-amber-500/30 backdrop-blur-md transition-colors hover:border-amber-400/50"
                style={{
                  background: 'linear-gradient(180deg, rgba(15,12,5,0.88) 0%, rgba(10,8,3,0.92) 100%)',
                  boxShadow: '0 0 20px rgba(251,191,36,0.08), 0 2px 8px rgba(0,0,0,0.4)',
                }}
              >
                <div className="flex items-center gap-2">
                  <ScrollText className="size-3.5 text-amber-400" />
                  <span className="text-xs font-semibold text-amber-300 tracking-wide">{questTitle}</span>
                  {/* Quest notification dot */}
                  {questNotificationCount > 0 && (
                    <motion.span
                      animate={{ scale: [1, 1.2, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                      className="w-2 h-2 rounded-full bg-amber-400"
                      style={{ boxShadow: '0 0 6px rgba(251,191,36,0.6)' }}
                    />
                  )}
                </div>
                <span className="text-[11px] text-slate-300/90 leading-tight text-center">{nextObjective.description}</span>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-[10px] text-amber-400/50 font-mono">Q — Задания</span>
                </div>
              </button>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Quick-save indicator ── */}
      <AnimatePresence>
        {showSaveIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.9 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            className="absolute top-16 right-3 sm:top-20 sm:right-4 z-20 flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-900/80 border border-cyan-900/30 backdrop-blur-md shadow-[0_0_15px_rgba(34,211,238,0.1)]"
          >
            <Save className="size-3.5 text-cyan-400" />
            <span className="text-xs text-cyan-300 font-medium">💾 Сохранено</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bottom-left: Stats panel (desktop) — AAA Overhaul ── */}
      <div className="absolute left-3 sm:left-4 pointer-events-auto hidden lg:block" style={{ bottom: 96 }}>
        <div
          className={`relative rounded-2xl p-4 sm:p-5 border backdrop-blur-xl min-w-[260px] overflow-hidden panel-scanlines hex-grid-bg ${isLowEnergy || isHighStress ? 'warning-pulse' : ''}`}
          style={{
            background: 'linear-gradient(145deg, rgba(2,6,23,0.95) 0%, rgba(8,12,28,0.92) 40%, rgba(4,8,18,0.88) 100%)',
            borderColor: isLowEnergy || isHighStress ? 'rgba(251, 113, 133, 0.5)' : 'rgba(34,211,238,0.2)',
            boxShadow: isLowEnergy || isHighStress
              ? '0 0 30px rgba(251,113,133,0.15), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(251,113,133,0.1)'
              : '0 0 20px rgba(34,211,238,0.06), 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(34,211,238,0.08)',
          }}
        >
          {/* Animated circuit-trace border at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl overflow-hidden circuit-trace-line pointer-events-none" />

          {/* Accent glow spots */}
          <div className="absolute inset-0 rounded-2xl pointer-events-none" style={{ background: 'radial-gradient(ellipse at 20% 20%, rgba(34,211,238,0.04) 0%, transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(251,191,36,0.03) 0%, transparent 50%)' }} />
          <div className="absolute top-0 right-0 w-20 h-20 pointer-events-none" style={{ background: 'radial-gradient(circle at 100% 0%, rgba(34,211,238,0.08) 0%, transparent 70%)' }} />

          {/* Ambient floating particles */}
          <AmbientParticles />

          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-5 h-5 rounded-md flex items-center justify-center" style={{ background: 'rgba(34,211,238,0.1)', boxShadow: '0 0 8px rgba(34,211,238,0.15)' }}>
                <Shield className="size-3 text-cyan-400" />
              </div>
              <span className="text-[11px] text-cyan-400/70 font-mono uppercase tracking-[0.2em]" style={{ textShadow: '0 0 8px rgba(34,211,238,0.3)' }}>СТАТУС</span>
            </div>
            <LevelBadge level={level} perkCount={perkCount} xp={xp} xpToNext={xpToNext} />
          </div>

          <div className="h-px mb-4" style={{ background: 'linear-gradient(90deg, rgba(34,211,238,0.3), rgba(34,211,238,0.08) 40%, transparent)' }} />

          {/* Karma with breathing ring — ENHANCED */}
          <div className="flex items-center gap-3 mb-4 relative">
            <div className="relative">
              <KarmaRing karma={karma} />
              <StatPulse active={karmaPulse} color="cyan" />
            </div>
            <div className="flex flex-col flex-1">
              <div className="flex items-center justify-between">
                <span className={`text-sm font-semibold ${karmaColor(karma)}`} style={{ textShadow: '0 0 6px currentColor' }}>Карма</span>
                <div className="flex items-center gap-1.5">
                  <AnimatedCounter value={karma} className={`text-base font-bold font-mono ${karmaColor(karma)}`}
                    style={{ textShadow: karmaPulse ? '0 0 12px currentColor' : '0 0 4px currentColor', transition: 'text-shadow 0.3s ease' }}
                  />
                  {/* Karma direction indicator */}
                  <AnimatePresence>
                    {karmaDirection && (
                      <motion.span
                        initial={{ opacity: 0, scale: 0.5, x: -5 }}
                        animate={{ opacity: 1, scale: 1, x: 0 }}
                        exit={{ opacity: 0, scale: 0.5 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 400, damping: 20 }}
                        className={`text-xs ${karmaDirection === 'up' ? 'text-emerald-400' : 'text-rose-400'}`}
                        style={{ textShadow: karmaDirection === 'up' ? '0 0 8px rgba(52,211,153,0.6)' : '0 0 8px rgba(251,113,133,0.6)' }}
                      >
                        {karmaDirection === 'up' ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              <span className="text-[10px] text-slate-400/80 font-mono mt-0.5">
                {karma >= 70 ? 'Светлая сторона' : karma <= 30 ? 'Тёмная сторона' : 'Баланс'}
              </span>
              <div className="h-1.5 bg-slate-800/70 rounded-full mt-1.5 overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: `linear-gradient(90deg, ${karmaStroke(karma)}60, ${karmaStroke(karma)})`, boxShadow: `0 0 6px ${karmaStroke(karma)}50` }}
                  initial={false} animate={{ width: `${karma}%` }} transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          </div>

          {/* Energy bar — ENHANCED with bigger fonts and glow */}
          <div className="mb-3">
            <div className="flex items-center gap-2 mb-1.5 relative">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isLowEnergy ? 'bg-rose-500/10' : 'bg-emerald-500/10'}`}
                style={{ boxShadow: isLowEnergy ? '0 0 8px rgba(244,63,94,0.2)' : '0 0 8px rgba(52,211,153,0.2)' }}
              >
                <Zap className={`size-3 ${isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}`} />
              </div>
              <span className={`text-sm font-semibold ${isLowEnergy ? 'text-rose-300 neon-text-rose' : 'text-emerald-300'}`}>Энергия</span>
              <AnimatedCounter value={energy} className={`text-sm font-bold font-mono ml-auto relative ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`}
                style={{ textShadow: energyPulse ? '0 0 12px rgba(52,211,153,0.6)' : '0 0 4px rgba(52,211,153,0.3)', transition: 'text-shadow 0.3s ease' }}
              />
              <StatPulse active={energyPulse} color={isLowEnergy ? 'rose' : 'emerald'} />
            </div>
            <CyberStatBar
              value={energy}
              color={isLowEnergy ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #059669, #34d399)'}
              glowColor={isLowEnergy ? 'rgba(244,63,94,0.4)' : 'rgba(52,211,153,0.4)'}
              shimmer={energyPulse}
            />
            {isLowEnergy && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-[10px] text-rose-400/80 font-mono mt-1 block energy-critical"
                style={{ textShadow: '0 0 6px rgba(251,113,133,0.3)' }}
              >
                ⚠ Низкая энергия — найдите место для отдыха
              </motion.span>
            )}
          </div>

          {/* Stress bar — ENHANCED with bigger fonts and glow */}
          <div>
            <div className="flex items-center gap-2 mb-1.5 relative">
              <div className={`w-5 h-5 rounded-md flex items-center justify-center ${isHighStress ? 'bg-rose-500/10' : 'bg-amber-500/10'}`}
                style={{ boxShadow: isHighStress ? '0 0 8px rgba(244,63,94,0.2)' : '0 0 8px rgba(245,158,11,0.2)' }}
              >
                <Activity className={`size-3 ${isHighStress ? 'text-rose-400' : 'text-amber-400'}`} />
              </div>
              <span className={`text-sm font-semibold ${isHighStress ? 'text-rose-300 neon-text-rose' : 'text-amber-300'}`}>Стресс</span>
              <AnimatedCounter value={stress} className={`text-sm font-bold font-mono ml-auto relative ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`}
                style={{ textShadow: stressPulse ? '0 0 12px rgba(251,113,133,0.6)' : '0 0 4px rgba(245,158,11,0.3)', transition: 'text-shadow 0.3s ease' }}
              />
              <StatPulse active={stressPulse} color={isHighStress ? 'rose' : 'amber'} />
            </div>
            <CyberStatBar
              value={stress}
              color={isHighStress ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #b45309, #f59e0b)'}
              glowColor={isHighStress ? 'rgba(244,63,94,0.4)' : 'rgba(245,158,11,0.4)'}
              shimmer={stressPulse}
            />
            {isHighStress && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-[10px] text-rose-400/80 font-mono mt-1 block" style={{ textShadow: '0 0 6px rgba(251,113,133,0.3)' }}>
                ⚠ Высокий стресс — отдохните или найдите стихи
              </motion.span>
            )}
          </div>

          <div className="h-px mt-4" style={{ background: 'linear-gradient(90deg, transparent, rgba(34,211,238,0.15), transparent)' }} />
          <div className="flex items-center justify-between mt-2.5">
            <span className="text-[10px] text-slate-500/60 font-mono">volodka://status</span>
            <div className="flex items-center gap-2">
              {currentWeather !== 'clear' && (
                <div className="flex items-center gap-1" title={WEATHER_EFFECTS[currentWeather]?.description ?? ''}>
                  <WeatherIcon type={currentWeather} className="size-3 weather-icon-bob" />
                </div>
              )}
              <span className="text-[10px] text-cyan-400/50 font-mono tabular-nums" style={{ textShadow: '0 0 4px rgba(34,211,238,0.2)' }}>{Math.floor(timeOfDay).toString().padStart(2, '0')}:{((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0')}</span>
            </div>
          </div>
          {/* Version indicator */}
          <div className="absolute bottom-1.5 right-3 pointer-events-none">
            <span className="text-[8px] text-slate-600/50 font-mono">v2.1.0</span>
          </div>
        </div>
      </div>

      {/* ── Mobile compact stats bar — ENHANCED ── */}
      <div className="absolute top-12 left-2 right-2 pointer-events-auto lg:hidden">
        <div
          className={`flex items-center gap-2.5 px-3 py-2 rounded-xl border backdrop-blur-xl ${isLowEnergy || isHighStress ? 'warning-pulse' : ''}`}
          style={{
            background: 'linear-gradient(180deg, rgba(2,6,23,0.92) 0%, rgba(8,12,28,0.88) 100%)',
            borderColor: isLowEnergy || isHighStress ? 'rgba(251,113,133,0.3)' : 'rgba(34,211,238,0.15)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.4)',
          }}
        >
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-mono" style={{ color: karmaStroke(karma), textShadow: `0 0 6px ${karmaStroke(karma)}40` }}>☯</span>
            <AnimatedCounter value={karma} className={`text-xs font-mono font-bold ${karmaColor(karma)}`} style={{ textShadow: '0 0 4px currentColor' }} />
          </div>
          <div className="w-px h-4 bg-slate-700/30" />
          <div className="flex items-center gap-1.5 flex-1">
            <Zap className={`size-3.5 ${isLowEnergy ? 'text-rose-400' : 'text-emerald-400'}`} />
            <div className="flex-1 h-2 bg-slate-800/70 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${energy}%` }}
                transition={{ duration: 0.5 }}
                style={{ background: isLowEnergy ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #059669, #34d399)', boxShadow: isLowEnergy ? '0 0 6px rgba(244,63,94,0.3)' : '0 0 6px rgba(52,211,153,0.3)' }}
              />
            </div>
            <AnimatedCounter value={energy} className={`text-xs font-mono font-bold ${isLowEnergy ? 'text-rose-300' : 'text-emerald-300'}`} style={{ textShadow: '0 0 3px currentColor' }} />
          </div>
          <div className="w-px h-4 bg-slate-700/30" />
          <div className="flex items-center gap-1.5 flex-1">
            <Activity className={`size-3.5 ${isHighStress ? 'text-rose-400' : 'text-amber-400'}`} />
            <div className="flex-1 h-2 bg-slate-800/70 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                initial={false}
                animate={{ width: `${stress}%` }}
                transition={{ duration: 0.5 }}
                style={{ background: isHighStress ? 'linear-gradient(90deg, #9f1239, #f43f5e)' : 'linear-gradient(90deg, #b45309, #f59e0b)', boxShadow: isHighStress ? '0 0 6px rgba(244,63,94,0.3)' : '0 0 6px rgba(245,158,11,0.3)' }}
              />
            </div>
            <AnimatedCounter value={stress} className={`text-xs font-mono font-bold ${isHighStress ? 'text-rose-300' : 'text-amber-300'}`} style={{ textShadow: '0 0 3px currentColor' }} />
          </div>
        </div>
      </div>

      {/* ── Status Effects Bar (desktop: bottom-right, mobile: bottom-center) ── */}
      <div className="absolute right-3 sm:right-4 pointer-events-auto hidden lg:block" style={{ bottom: 52 }}>
        <StatusEffectsBar />
      </div>
      <div className="absolute left-1/2 -translate-x-1/2 pointer-events-auto lg:hidden" style={{ bottom: 52 }}>
        <StatusEffectsBar />
      </div>

      {/* ── Interaction hint ── */}
      <div className="absolute bottom-16 right-3 pointer-events-none hidden lg:block">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2, duration: 0.5 }}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-700/20 bg-black/40 backdrop-blur-sm"
        >
          <kbd className="text-[10px] text-slate-400 font-mono px-1 py-0.5 rounded border border-slate-700/30 bg-slate-800/50">E</kbd>
          <span className="text-[10px] text-slate-400 font-mono">Взаимодействие</span>
        </motion.div>
      </div>
    </div>
  );
}

/* ── HUD icon button ── */
function HUDButton({
  icon,
  label,
  onClick,
  active = false,
  tooltip,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`group w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-black transition-all duration-200 relative overflow-hidden hud-btn-shimmer ${active ? 'bg-cyan-950/40 text-cyan-300' : ''} ${tooltip ? 'cyber-tooltip' : ''}`}
      aria-label={label}
      title={label}
      data-tooltip={tooltip}
    >
      <div className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 12px rgba(34,211,238,0.15), 0 0 8px rgba(34,211,238,0.1)' }}
      />
      <div className="absolute inset-0 rounded-md opacity-0 group-active:opacity-100 transition-opacity duration-100 pointer-events-none bg-cyan-500/10" />
      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute inset-0" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(34,211,238,0.12) 50%, transparent 60%)', backgroundSize: '200% 100%', animation: 'shimmer 2s ease-in-out infinite' }} />
      </div>
      <span className="relative z-10">{icon}</span>
    </button>
  );
}
