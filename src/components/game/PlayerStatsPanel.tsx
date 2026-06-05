
/* ─── Volodka RPG – Player Stats Panel ───
   Compact, detailed stats overview panel with cyberpunk styling.
   Slide-in from left with three sections: Core Attributes, Skills, Status Effects.
   Toggle via HUD button or 'S' keyboard shortcut.
*/

import { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap,
  Brain,
  Scale,
  ChevronUp,
  Swords,
  Wind,
  Heart,
  Wrench,
  Eye,
  X,
  Code2,
  Handshake,
  Lightbulb,
  PenTool,
} from 'lucide-react';
import { useStatusEffectsContext } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  type StatusEffectType,
  type StatusEffectDef,
  STATUS_EFFECTS,
  getStatusEffectById,
} from '@/data/statusEffects';
import { type WeatherType, determineWeatherType, WEATHER_EFFECTS } from '@/data/weatherEffects';
import { type TrainablePlayerSkill } from '@/shared/types/game';
import { eventBus } from '@/engine/EventBus';

/* ─── Color constants ─── */
const CYAN = '#22d3ee';
const ROSE = '#fb7185';
const EMERALD = '#34d399';
const AMBER = '#fbbf24';

/* ─── Skill display config (mapped from actual PlayerSkills) ─── */
const SKILL_CONFIG: Array<{
  key: TrainablePlayerSkill;
  name: string;
  icon: typeof Swords;
  color: string;
}> = [
  { key: 'logic', name: 'Логика', icon: Swords, color: CYAN },
  { key: 'coding', name: 'Код', icon: Code2, color: AMBER },
  { key: 'empathy', name: 'Эмпатия', icon: Heart, color: EMERALD },
  { key: 'persuasion', name: 'Убеждение', icon: Handshake, color: ROSE },
  { key: 'intuition', name: 'Интуиция', icon: Lightbulb, color: '#a78bfa' },
  { key: 'writing', name: 'Письмо', icon: PenTool, color: CYAN },
];

/* ─── Weather → status effect mapping (mirrors StatusEffectsBar) ─── */
const WEATHER_EFFECT_MAP: Record<string, StatusEffectType> = {
  rain: 'rain_debuff',
  snow: 'snow_debuff',
  fog: 'fog_debuff',
  storm: 'storm_debuff',
};

const PERK_EFFECT_MAP: Record<string, StatusEffectType> = {
  night_watch: 'night_vision',
  iron_stomach: 'iron_stomach',
  counterattack: 'counter_strike',
  poetic_trance: 'poetic_trance',
};

/* ─── Category sort order ─── */
const CATEGORY_ORDER: Record<string, number> = {
  perk: 0,
  buff: 1,
  weather: 2,
  debuff: 3,
};

/* ─── Active effect instance ─── */
interface ActiveStatusEffect {
  id: StatusEffectType;
  remainingHours?: number;
  stacks?: number;
}

/* ─── Section header component ─── */
function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-2 mb-2 mt-1">
      <div
        className="h-px flex-1"
        style={{
          background: `linear-gradient(90deg, ${CYAN}60, transparent)`,
        }}
      />
      <span
        className="text-[10px] font-mono font-semibold tracking-widest uppercase"
        style={{ color: `${CYAN}cc`, textShadow: `0 0 6px ${CYAN}40` }}
      >
        {title}
      </span>
      <div
        className="h-px flex-1"
        style={{
          background: `linear-gradient(270deg, ${CYAN}60, transparent)`,
        }}
      />
    </div>
  );
}

/* ─── Stat bar with shimmer ─── */
function StatBar({
  value,
  max,
  color,
  lowWarning = false,
  highWarning = false,
}: {
  value: number;
  max: number;
  color: string;
  lowWarning?: boolean;
  highWarning?: boolean;
}) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100));
  const isWarning = (lowWarning && value <= 25) || (highWarning && value >= 70);

  return (
    <div className="relative h-2 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full relative stats-panel-bar-fill"
        style={{
          background: `linear-gradient(90deg, ${color}cc, ${color})`,
          boxShadow: `0 0 8px ${color}40`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      />
      {/* Warning pulse overlay */}
      {isWarning && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{
            boxShadow: [
              `inset 0 0 4px ${ROSE}00`,
              `inset 0 0 8px ${ROSE}30`,
              `inset 0 0 4px ${ROSE}00`,
            ],
          }}
          transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
        />
      )}
    </div>
  );
}

/* ─── Karma ring gauge ─── */
function KarmaRing({ value }: { value: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(100, Math.max(0, value)) / 100;
  const offset = circumference * (1 - pct);

  const ringColor = value >= 70 ? EMERALD : value >= 30 ? CYAN : ROSE;

  return (
    <div className="relative flex items-center justify-center" style={{ width: 72, height: 72 }}>
      <svg width="72" height="72" className="absolute" style={{ transform: 'rotate(-90deg)' }}>
        {/* Background ring */}
        <circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="3"
        />
        {/* Value ring */}
        <motion.circle
          cx="36" cy="36" r={radius}
          fill="none"
          stroke={ringColor}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{
            filter: `drop-shadow(0 0 4px ${ringColor}60)`,
          }}
        />
      </svg>
      {/* Center icon + value */}
      <div className="flex flex-col items-center justify-center">
        <Scale className="size-4" style={{ color: ringColor, filter: `drop-shadow(0 0 4px ${ringColor}50)` }} />
        <span className="text-[10px] font-mono font-bold mt-0.5" style={{ color: ringColor }}>
          {value}
        </span>
      </div>
      {/* Breathing glow */}
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [
            `0 0 8px ${ringColor}10`,
            `0 0 16px ${ringColor}20`,
            `0 0 8px ${ringColor}10`,
          ],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}

/* ─── Mini progress bar for skills ─── */
function SkillMiniBar({ value, color }: { value: number; color: string }) {
  const maxSkill = 50; // reasonable max for display
  const pct = Math.min(100, (value / maxSkill) * 100);

  return (
    <div className="h-1 rounded-full overflow-hidden flex-1" style={{ background: 'rgba(255,255,255,0.06)' }}>
      <motion.div
        className="h-full rounded-full"
        style={{
          background: `linear-gradient(90deg, ${color}80, ${color})`,
          boxShadow: `0 0 4px ${color}30`,
        }}
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
      />
    </div>
  );
}

/* ─── Status effect row ─── */
function StatusEffectRow({
  effect,
  remainingHours,
  stacks,
}: {
  effect: StatusEffectDef;
  remainingHours?: number;
  stacks?: number;
}) {
  const isPositive = effect.category === 'buff' || effect.category === 'perk';
  const isNegative = effect.category === 'debuff' || effect.category === 'weather';
  const color = isPositive ? EMERALD : isNegative ? ROSE : '#94a3b8';

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-md"
      style={{
        background: `linear-gradient(135deg, ${color}08, ${color}03)`,
        borderLeft: `2px solid ${color}60`,
      }}
    >
      <span className="text-sm leading-none">{effect.icon}</span>
      <div className="flex-1 min-w-0">
        <span
          className="text-[10px] font-mono font-semibold block truncate"
          style={{ color, textShadow: `0 0 4px ${color}30` }}
        >
          {effect.name}
        </span>
      </div>
      {remainingHours !== undefined && (
        <span
          className="text-[9px] font-mono"
          style={{
            color: remainingHours < 1 ? ROSE : '#94a3b8',
            textShadow: remainingHours < 1 ? `0 0 4px ${ROSE}40` : 'none',
          }}
        >
          {remainingHours.toFixed(1)}ч
        </span>
      )}
      {stacks !== undefined && stacks > 1 && (
        <span className="text-[9px] font-mono font-bold" style={{ color: AMBER }}>
          ×{stacks}
        </span>
      )}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT — PlayerStatsPanel
   ══════════════════════════════════════════════════════════════ */

export function PlayerStatsPanel({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { playerState, weatherEnabled, rainIntensity, currentSceneId, timeOfDay } = useStatusEffectsContext();

  // Track snow state via eventBus
  const [snowActive, setSnowActive] = useState(false);
  useEffect(() => {
    const unsub = eventBus.on('weather:snow', (payload: { active: boolean }) => {
      setSnowActive(payload.active);
    });
    return () => { unsub(); };
  }, []);

  const { karma, energy, stress } = playerState;
  const { level, xp, xpToNextLevel, skillPoints, perkPoints, unlockedPerks } = playerState.progression;
  const skills = playerState.skills;

  // Current weather
  const currentWeather: WeatherType = useMemo(() =>
    determineWeatherType(weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay),
    [weatherEnabled, rainIntensity, snowActive, currentSceneId, timeOfDay],
  );

  // Build active effects list (mirrors StatusEffectsBar logic)
  const activeEffects: ActiveStatusEffect[] = useMemo(() => {
    const effects: ActiveStatusEffect[] = [];

    if (currentWeather !== 'clear') {
      const weatherEffectId = WEATHER_EFFECT_MAP[currentWeather];
      if (weatherEffectId) effects.push({ id: weatherEffectId });
    }

    for (const perkId of unlockedPerks) {
      const effectId = PERK_EFFECT_MAP[perkId];
      if (effectId) effects.push({ id: effectId });
    }

    if (energy < 25) {
      effects.push({ id: 'exhausted', stacks: energy < 10 ? 2 : 1 });
    }
    if (stress > 70) {
      effects.push({ id: 'stressed', stacks: stress > 90 ? 3 : stress > 80 ? 2 : 1 });
    }

    effects.sort((a, b) => {
      const defA = STATUS_EFFECTS[a.id];
      const defB = STATUS_EFFECTS[b.id];
      const orderA = CATEGORY_ORDER[defA.category] ?? 99;
      const orderB = CATEGORY_ORDER[defB.category] ?? 99;
      if (orderA !== orderB) return orderA - orderB;
      return a.id.localeCompare(b.id);
    });

    return effects;
  }, [currentWeather, unlockedPerks, energy, stress]);

  // XP progress percent
  const xpPct = xpToNextLevel > 0 ? Math.min(100, (xp / xpToNextLevel) * 100) : 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="player-stats-panel"
          className="fixed inset-y-0 left-0 pointer-events-auto stats-panel-container"
          style={{ zIndex: UI_LAYERS.PANEL, width: 'min(320px, 85vw)' }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: '-100%', opacity: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        >
          <div
            className="relative h-full flex flex-col border-r overflow-hidden"
            style={{
              background: 'linear-gradient(180deg, rgba(2,6,23,0.95) 0%, rgba(8,12,28,0.92) 50%, rgba(4,8,18,0.90) 100%)',
              backdropFilter: 'blur(16px)',
              WebkitBackdropFilter: 'blur(16px)',
              borderRight: `1px solid ${CYAN}25`,
            }}
          >
            {/* Corner bracket decorations */}
            <div className="corner-bracket corner-bracket-tl" style={{ borderColor: `${CYAN}35` }} />
            <div className="corner-bracket corner-bracket-tr" style={{ borderColor: `${CYAN}35` }} />
            <div className="corner-bracket corner-bracket-bl" style={{ borderColor: `${CYAN}35` }} />
            <div className="corner-bracket corner-bracket-br" style={{ borderColor: `${CYAN}35` }} />

            {/* Scan-line sweep overlay */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden stats-panel-scanline" />

            {/* Neon border glow (breathing) */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              animate={{
                boxShadow: [
                  `inset -1px 0 12px ${CYAN}08`,
                  `inset -1px 0 20px ${CYAN}15`,
                  `inset -1px 0 12px ${CYAN}08`,
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* ── Header ── */}
            <div className="flex items-center justify-between px-4 pt-4 pb-2 relative z-10">
              <div className="flex items-center gap-2">
                <ChevronUp className="size-4 rotate-90" style={{ color: CYAN, filter: `drop-shadow(0 0 4px ${CYAN}50)` }} />
                <h2
                  className="text-sm font-mono font-bold tracking-wider uppercase"
                  style={{ color: CYAN, textShadow: `0 0 8px ${CYAN}40` }}
                >
                  Статистика
                </h2>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 flex items-center justify-center rounded-md close-btn-glow transition-all duration-200"
                style={{ border: `1px solid ${CYAN}25`, color: '#94a3b8' }}
                aria-label="Закрыть панель статистики"
              >
                <X className="size-3.5" />
              </button>
            </div>

            {/* ── Scrollable content ── */}
            <div className="flex-1 overflow-y-auto game-scrollbar px-4 pb-6 relative z-10 space-y-4">

              {/* ═══ Section 1: Core Attributes ═══ */}
              <div>
                <SectionHeader title="Атрибуты" />

                {/* Energy */}
                <div className="flex items-center gap-2 mb-2.5">
                  <Zap className="size-3.5 shrink-0" style={{
                    color: energy <= 25 ? ROSE : CYAN,
                    filter: energy <= 25 ? `drop-shadow(0 0 4px ${ROSE}50)` : `drop-shadow(0 0 4px ${CYAN}40)`,
                  }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono text-slate-300/70">Энергия</span>
                      <span className="text-[10px] font-mono font-bold" style={{
                        color: energy <= 25 ? ROSE : CYAN,
                        textShadow: energy <= 25 ? `0 0 4px ${ROSE}40` : `0 0 4px ${CYAN}30`,
                      }}>
                        {energy}/100
                      </span>
                    </div>
                    <StatBar value={energy} max={100} color={energy <= 25 ? ROSE : CYAN} lowWarning />
                  </div>
                </div>

                {/* Stress */}
                <div className="flex items-center gap-2 mb-2.5">
                  <Brain className="size-3.5 shrink-0" style={{
                    color: stress >= 70 ? ROSE : '#a78bfa',
                    filter: stress >= 70 ? `drop-shadow(0 0 4px ${ROSE}50)` : `drop-shadow(0 0 4px #a78bfa40)`,
                  }} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-[10px] font-mono text-slate-300/70">Стресс</span>
                      <span className="text-[10px] font-mono font-bold" style={{
                        color: stress >= 70 ? ROSE : '#a78bfa',
                        textShadow: stress >= 70 ? `0 0 4px ${ROSE}40` : `0 0 4px #a78bfa30`,
                      }}>
                        {stress}/100
                      </span>
                    </div>
                    <StatBar value={stress} max={100} color={stress >= 70 ? ROSE : '#a78bfa'} highWarning />
                  </div>
                </div>

                {/* Karma + Level row */}
                <div className="flex items-center gap-3">
                  {/* Karma ring */}
                  <div className="flex flex-col items-center">
                    <KarmaRing value={karma} />
                    <span className="text-[9px] font-mono text-slate-400/70 -mt-0.5">Карма</span>
                  </div>

                  {/* Level + XP */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5 mb-1">
                      <span
                        className="text-lg font-mono font-bold"
                        style={{ color: AMBER, textShadow: `0 0 8px ${AMBER}40` }}
                      >
                        {level}
                      </span>
                      <span className="text-[9px] font-mono text-slate-400/70">УРОВЕНЬ</span>
                    </div>
                    {/* XP progress bar */}
                    <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
                      <motion.div
                        className="h-full rounded-full stats-panel-bar-fill"
                        style={{
                          background: `linear-gradient(90deg, ${AMBER}cc, ${AMBER})`,
                          boxShadow: `0 0 6px ${AMBER}30`,
                        }}
                        initial={{ width: 0 }}
                        animate={{ width: `${xpPct}%` }}
                        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </div>
                    <div className="flex items-center justify-between mt-0.5">
                      <span className="text-[8px] font-mono text-slate-500">{xp}/{xpToNextLevel} XP</span>
                      <div className="flex gap-2">
                        {skillPoints > 0 && (
                          <span className="text-[8px] font-mono font-bold" style={{ color: EMERALD }}>
                            +{skillPoints} очк.
                          </span>
                        )}
                        {perkPoints > 0 && (
                          <span className="text-[8px] font-mono font-bold" style={{ color: AMBER }}>
                            +{perkPoints} черт.
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* ═══ Section 2: Skills ═══ */}
              <div>
                <SectionHeader title="Навыки" />
                <div className="grid grid-cols-2 gap-1.5">
                  {SKILL_CONFIG.map((cfg) => {
                    const IconComp = cfg.icon;
                    const skillVal = skills[cfg.key] ?? 0;
                    return (
                      <div
                        key={cfg.key}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-md"
                        style={{
                          background: `linear-gradient(135deg, ${cfg.color}06, ${cfg.color}02)`,
                          border: `1px solid ${cfg.color}12`,
                        }}
                      >
                        <IconComp className="size-3 shrink-0" style={{ color: cfg.color, filter: `drop-shadow(0 0 3px ${cfg.color}40)` }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-mono text-slate-300/80 truncate">{cfg.name}</span>
                            <span
                              className="text-[9px] font-mono font-bold ml-1"
                              style={{ color: cfg.color, textShadow: `0 0 4px ${cfg.color}30` }}
                            >
                              {skillVal}
                            </span>
                          </div>
                          <SkillMiniBar value={skillVal} color={cfg.color} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ═══ Section 3: Status Effects ═══ */}
              <div>
                <SectionHeader title="Эффекты" />
                {activeEffects.length === 0 ? (
                  <div className="text-center py-3">
                    <span className="text-[10px] font-mono text-slate-500">Нет активных эффектов</span>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {activeEffects.map((active) => {
                      const def = getStatusEffectById(active.id);
                      return (
                        <motion.div
                          key={active.id}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        >
                          <StatusEffectRow
                            effect={def}
                            remainingHours={active.remainingHours}
                            stacks={active.stacks}
                          />
                        </motion.div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
