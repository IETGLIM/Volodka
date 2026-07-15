
/* ─── Volodka RPG – Enhanced Combat UI Overlay ─── */
/* Task 8: Complete visual overhaul with cyberpunk terminal aesthetic,
   combo counter, critical hit animations, status effects, victory/defeat screens
   Task 3-a: Improved buff/debuff display, poem power selection, combat log */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { eventBus } from '@/engine/EventBus';
import { Sword, Shield, Sparkles, LogOut, ChevronDown, Heart, Clock, Zap, Flame, Swords, HeartPulse, ShieldPlus, Skull } from 'lucide-react';
import { useUIStore } from '@/store/stores/uiStore';
import { useCutsceneStore } from '@/store/stores/cutsceneStore';
import { getGamePhase } from '@/shared/gamePhase';
import {
  playerAttack,
  playerDefend,
  playerUsePoemPower,
  playerFlee,
  getAvailableCombatPowers,
  getActiveBuffs,
  getGamepadSelectedPoemIndex,
  subscribeToCombat } from '@/engine/CombatSystem';
import type { CombatState, CombatLogEntry, CombatBuff, BuffEffect } from '@/shared/types/game';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { COMBAT_BUTTON_HINTS } from '@/engine/combat/combatGamepadMap';
import { POEM_COMBAT_ABILITIES } from '@/engine/combat/actions';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';

/* ── Buff effect descriptions for tooltips ── */
function getBuffEffectDescription(effect: BuffEffect): string {
  switch (effect.type) {
    case 'defense_reduction': return `Защита -${Math.round(effect.value * 100)}%`;
    case 'damage_multiplier': return `Урон ×${effect.value}`;
    case 'damage_reduction': return `Получаемый урон -${Math.round(effect.value * 100)}%`;
    case 'skip_turn': return 'Пропускает ход';
    case 'stat_drain': return `${effect.stat} -${effect.value}`;
    case 'defense_boost': return `Защита +${effect.value}`;
    case 'attack_boost': return `Атака +${effect.value}`;
    case 'hp_drain_percent': return `HP -${Math.round(effect.value * 100)}%/ход`;
    case 'silence_specials': return 'Спецатаки заблокированы';
    case 'defensive_verse': return 'Защитный стих: -30% урона';
    default: return '';
  }
}

/* ── Poem combat effect category for UI tags ── */
type PoemEffectCategory = 'damage' | 'heal' | 'buff' | 'debuff' | 'mixed';

function getPoemEffectCategory(poemId: string): PoemEffectCategory {
  switch (poemId) {
    case 'poem_1': return 'debuff';
    case 'poem_2': return 'heal';
    case 'poem_3': return 'debuff';
    case 'poem_4': return 'heal';
    case 'poem_5': return 'damage';
    case 'poem_6': return 'buff';
    case 'poem_7': return 'debuff';
    case 'poem_8': return 'damage';
    case 'poem_9': return 'damage';
    case 'poem_10': return 'buff';
    case 'poem_11': return 'damage';
    case 'poem_12': return 'damage';
    case 'poem_13': return 'mixed';
    case 'poem_14': return 'heal';
    case 'poem_15': return 'mixed';
    case 'poem_16': return 'mixed';
    case 'poem_17': return 'mixed';
    case 'poem_18': return 'damage';
    case 'poem_19': return 'buff';
    case 'poem_20': return 'mixed';
    case 'poem_21': return 'damage';
    case 'poem_22': return 'mixed';
    case 'poem_23': return 'damage';
    default: return 'mixed';
  }
}

function getPoemEffectLabel(category: PoemEffectCategory): string {
  switch (category) {
    case 'damage': return 'Урон';
    case 'heal': return 'Лечение';
    case 'buff': return 'Усиление';
    case 'debuff': return 'Ослабление';
    case 'mixed': return 'Комбо';
  }
}

function getPoemEffectIcon(category: PoemEffectCategory) {
  switch (category) {
    case 'damage': return Swords;
    case 'heal': return HeartPulse;
    case 'buff': return ShieldPlus;
    case 'debuff': return Skull;
    case 'mixed': return Sparkles;
  }
}

function getPoemCategoryColor(category: PoemEffectCategory): string {
  switch (category) {
    case 'damage': return 'text-red-400 bg-red-950/50 border-red-800/40';
    case 'heal': return 'text-emerald-400 bg-emerald-950/50 border-emerald-800/40';
    case 'buff': return 'text-cyan-400 bg-cyan-950/50 border-cyan-800/40';
    case 'debuff': return 'text-amber-400 bg-amber-950/50 border-amber-800/40';
    case 'mixed': return 'text-fuchsia-400 bg-fuchsia-950/50 border-fuchsia-800/40';
  }
}

/* ── Animated Health Bar with gradient & glow ── */
function AnimatedHPBar({ current, max, label, isPlayer }: {
  current: number; max: number; label: string; isPlayer: boolean;
}) {
  const pct = max > 0 ? Math.max(0, (current / max) * 100) : 0;
  const color = isPlayer
    ? pct > 60 ? 'from-emerald-500 to-cyan-400'
      : pct > 30 ? 'from-amber-500 to-yellow-400'
      : 'from-red-600 to-red-400'
    : pct > 60 ? 'from-red-600 to-rose-400'
      : pct > 30 ? 'from-orange-600 to-amber-400'
      : 'from-yellow-500 to-emerald-400';
  const glowColor = isPlayer
    ? pct > 60 ? 'shadow-emerald-500/50' : pct > 30 ? 'shadow-amber-500/50' : 'shadow-red-500/60'
    : pct > 60 ? 'shadow-red-500/50' : pct > 30 ? 'shadow-orange-500/50' : 'shadow-yellow-500/50';

  return (
    <div className={`flex flex-col ${isPlayer ? 'items-start' : 'items-end'} w-full`}>
      <div className="text-[10px] text-slate-400 mb-0.5 font-mono uppercase tracking-wider">{label}</div>
      <div className="w-full h-3.5 bg-black/80 border border-slate-700/40 rounded-sm overflow-hidden relative">
        <motion.div
          className={`h-full bg-gradient-to-r ${color} ${glowColor} shadow-sm rounded-sm`}
          style={{ boxShadow: `0 0 8px ${isPlayer ? (pct > 60 ? '#10b981' : pct > 30 ? '#f59e0b' : '#ef4444') : (pct > 60 ? '#ef4444' : pct > 30 ? '#f97316' : '#eab308')}40` }}
          initial={false}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-[9px] text-white font-mono font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
          {Math.max(0, current)} / {max}
        </div>
      </div>
    </div>
  );
}

/* ── Floating Damage Number with physics ── */
function DamageNumber({ damage, type, isCritical }: { damage: number; type: string; isCritical?: boolean }) {
  const isHeal = type === 'player_power' && damage > 0;
  const isPoemCombo = type === 'poem_combo';
  const color = type === 'enemy_attack' || type === 'enemy_special'
    ? 'text-red-400'
    : isPoemCombo
      ? 'text-fuchsia-400'
      : isHeal
        ? 'text-emerald-400'
        : isCritical
          ? 'text-yellow-300'
          : 'text-cyan-300';
  const size = isCritical ? 'text-4xl' : isPoemCombo ? 'text-3xl' : 'text-2xl';

  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: isCritical ? 1.4 : 0.8 }}
      animate={{ opacity: 0, y: -60, scale: isCritical ? 1.8 : 1.1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: isCritical ? 1.8 : 1.2, ease: [0.2, 0, 0.3, 1] }}
      className={`absolute ${size} font-bold ${color} pointer-events-none select-none ${isCritical ? 'glitch-skew' : ''}`}
      style={{ zIndex: UI_LAYERS.COMBAT, textShadow: `0 0 ${isCritical ? 16 : 8}px currentColor, 0 2px 4px rgba(0,0,0,0.8)` }}
    >
      {isHeal ? '+' : '-'}{damage}
      {isCritical && <span className="text-lg ml-1">💥</span>}
    </motion.div>
  );
}

/* ── Combo Counter ── */
function ComboCounter({ count }: { count: number }) {
  if (count < 1) return null;
  const multiplier = count >= 3 ? 2.0 : count >= 2 ? 1.5 : 1.2;
  const intensity = Math.min(count, 5);
  const colors = ['text-cyan-400', 'text-cyan-300', 'text-amber-400', 'text-orange-400', 'text-red-400', 'text-fuchsia-400'];
  const color = colors[Math.min(count, colors.length - 1)];

  return (
    <motion.div
      key={count}
      initial={{ scale: 1.6, opacity: 0.8 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex flex-col items-center"
    >
      <div className={`text-3xl font-black ${color} font-mono`}
        style={{
          textShadow: `0 0 ${8 + intensity * 4}px currentColor, 0 0 ${16 + intensity * 8}px ${count >= 3 ? '#f97316' : '#06b6d4'}40` }}
      >
        <Flame className="inline size-5 mr-0.5" />
        x{count}
      </div>
      <div className="text-[9px] text-slate-400 font-mono">×{multiplier} УРОН</div>
      {count >= 3 && (
        <motion.div
          className="text-[8px] text-orange-400 font-mono mt-0.5"
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          🔥 МАКСИМАЛЬНЫЙ КОМБО!
        </motion.div>
      )}
    </motion.div>
  );
}

/* ── Enhanced Status Effect Badge with Tooltip ── */
function StatusBadge({ buff }: { buff: CombatBuff }) {
  const isDebuff = buff.kind === 'debuff';
  const iconMap: Record<string, string> = {
    defense_reduction: '🛡️↓',
    damage_multiplier: '⚔️↑',
    damage_reduction: '🛡️',
    skip_turn: '😵',
    stat_drain: '📉',
    defense_boost: '🛡️↑',
    attack_boost: '⚔️',
    hp_drain_percent: '🦠',
    silence_specials: '🔇',
    defensive_verse: '📜' };
  const icon = iconMap[buff.effect.type] || (isDebuff ? '⬇️' : '⬆️');

  // Color coding: green for positive buffs, red for debuffs
  // On player: buffs are good (green), debuffs are bad (red)
  // On enemy: debuffs are good for player (amber), buffs are bad for player (red)
  const isOnPlayer = buff.target === 'player';
  const isPositive = isOnPlayer ? !isDebuff : isDebuff;

  const borderColor = isPositive
    ? 'border-emerald-600/60'
    : 'border-red-600/60';
  const bgColor = isPositive
    ? 'bg-emerald-950/50 text-emerald-300'
    : 'bg-red-950/50 text-red-300';
  const glowStyle = isPositive
    ? '0 0 6px rgba(16,185,129,0.2)'
    : '0 0 6px rgba(239,68,68,0.2)';
  const pulseBorderColor = isPositive ? '#10b981' : '#ef4444';

  const effectDesc = getBuffEffectDescription(buff.effect);
  const tooltipText = `${buff.name}${effectDesc ? ' — ' + effectDesc : ''} (${buff.duration} х.)`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.div
          layout
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 400, damping: 25 }}
          className={`relative inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono border ${borderColor} ${bgColor} cursor-default select-none`}
          style={{ boxShadow: glowStyle }}
        >
          <span>{icon}</span>
          <span className="truncate max-w-[60px]">{buff.name}</span>
          <span className="opacity-60">{buff.duration}х</span>
          <motion.div
            className="absolute inset-0 rounded border"
            animate={{ borderColor: [pulseBorderColor, 'transparent', pulseBorderColor] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </motion.div>
      </TooltipTrigger>
      <TooltipContent
        side="top"
        className="bg-black/90 border border-slate-700/50 text-[10px] font-mono text-slate-200 max-w-[200px]"
        sideOffset={4}
      >
        {tooltipText}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Buff/Debuff Indicator Bar ── */
function BuffDebuffBar({ buffs, label }: { buffs: CombatBuff[]; label: string }) {
  if (buffs.length === 0) return null;
  const positiveBuffs = buffs.filter(b => b.kind === 'buff');
  const negativeBuffs = buffs.filter(b => b.kind === 'debuff');

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[8px] text-slate-500 font-mono uppercase tracking-widest">{label}</div>
      <div className="flex flex-wrap gap-1">
        <AnimatePresence mode="popLayout">
          {positiveBuffs.map((b) => <StatusBadge key={b.id} buff={b} />)}
          {negativeBuffs.map((b) => <StatusBadge key={b.id} buff={b} />)}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Combat intro splash (first ~1.5s of each fight) ── */
function CombatIntroSplash({
  emoji,
  name,
  onDone }: {
  emoji: string;
  name: string;
  onDone: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onDone, 1550);
    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      className="combat-intro-overlay"
      style={{ zIndex: UI_LAYERS.COMBAT + 3 }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
    >
      <div className="combat-intro-card">
        <div className="combat-intro-slash" aria-hidden />
        <div className="combat-intro-emoji mb-2 enemy-hologram">{emoji}</div>
        <div className="combat-intro-title mb-2">БОЙ</div>
        <div className="text-sm text-red-200/90 font-mono tracking-widest uppercase">{name}</div>
        <div className="text-[10px] text-slate-500 font-mono mt-3 tracking-wide">
          1 атака · 2 защита · 3 стих · 4 побег
        </div>
      </div>
    </motion.div>
  );
}

/* ── Enemy Silhouette (CSS animated) ── */
function EnemyPortrait({ emoji, hp, maxHp }: { emoji: string; hp: number; maxHp: number }) {
  const hurt = hp / maxHp < 0.3;
  return (
    <div className="relative flex items-center justify-center enemy-hologram">
      <motion.div
        className="text-5xl sm:text-6xl select-none"
        animate={hurt ? { x: [0, -2, 2, -1, 1, 0] } : { y: [0, -4, 0] }}
        transition={hurt ? { duration: 0.3, repeat: hurt ? 3 : 0 } : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        {emoji}
      </motion.div>
      {/* Glow ring */}
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${hurt ? '#ef4444' : '#f97316'} 0%, transparent 70%)`,
          filter: 'blur(12px)',
          transform: 'scale(1.5)' }}
      />
    </div>
  );
}

/* ── Gamepad button hint badge ── */
function GamepadHint({ label }: { label: string }) {
  return (
    <span className="ml-1 text-[8px] leading-none bg-white/10 rounded px-1 py-px font-mono opacity-60 select-none">
      {label}
    </span>
  );
}

/* ── Terminal-style Action Button ── */
function TerminalButton({
  onClick, disabled, accentColor, children, gamepadHint }: {
  onClick: () => void; disabled: boolean; accentColor: string; children: React.ReactNode; gamepadHint?: string;
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string; hoverBg: string; glow: string }> = {
    cyan: { border: 'border-cyan-700/60', bg: 'bg-cyan-950/50', text: 'text-cyan-400', hoverBg: 'hover:bg-cyan-900/40', glow: '#06b6d4' },
    emerald: { border: 'border-emerald-700/60', bg: 'bg-emerald-950/50', text: 'text-emerald-400', hoverBg: 'hover:bg-emerald-900/40', glow: '#10b981' },
    amber: { border: 'border-amber-700/60', bg: 'bg-amber-950/50', text: 'text-amber-400', hoverBg: 'hover:bg-amber-900/40', glow: '#f59e0b' },
    slate: { border: 'border-slate-600/60', bg: 'bg-slate-900/50', text: 'text-slate-300', hoverBg: 'hover:bg-slate-800/40', glow: '#94a3b8' },
    rose: { border: 'border-rose-700/60', bg: 'bg-rose-950/50', text: 'text-rose-400', hoverBg: 'hover:bg-rose-900/40', glow: '#f43f5e' } };
  const c = colorMap[accentColor] || colorMap.slate;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 py-2.5 rounded border ${c.border} ${c.bg} ${c.text} ${c.hoverBg} disabled:opacity-30 disabled:cursor-not-allowed transition-all text-xs font-mono font-semibold flex items-center justify-center gap-1.5 overflow-hidden group`}
      style={!disabled ? { boxShadow: `0 0 8px ${c.glow}20, inset 0 0 8px ${c.glow}10` } : {}}
    >
      {/* Scanline overlay on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)' }}
      />
      {/* Gamepad hint */}
      {gamepadHint && <GamepadHint label={gamepadHint} />}
      {/* Corner brackets */}
      <span className="absolute top-0 left-0 text-[8px] leading-none opacity-30">┌</span>
      <span className="absolute bottom-0 right-0 text-[8px] leading-none opacity-30">┘</span>
      {children}
    </button>
  );
}

/* ── Enhanced Combat Log Entry with turn numbers & type icons ── */
function CombatLogLine({ entry, className }: { entry: CombatLogEntry; className?: string }) {
  const typeStyles: Record<string, string> = {
    player_attack: 'text-cyan-400',
    enemy_attack: 'text-red-400',
    enemy_special: 'text-orange-400 font-semibold',
    player_defend: 'text-emerald-400',
    player_power: 'text-amber-300',
    player_flee: 'text-slate-300',
    info: 'text-slate-400',
    victory: 'text-emerald-400 font-bold',
    defeat: 'text-red-400 font-bold',
    buff_expire: 'text-slate-500 italic',
    critical_hit: 'text-yellow-300 font-bold',
    combo_hit: 'text-orange-300 font-semibold',
    status_effect: 'text-purple-400',
    poem_combo: 'text-fuchsia-400 font-bold' };
  const typeIcons: Record<string, string> = {
    player_attack: '⚔️',
    enemy_attack: '💥',
    enemy_special: '⚠️',
    player_defend: '🛡️',
    player_power: '✦',
    player_flee: '🏃',
    info: '●',
    victory: '🏆',
    defeat: '💀',
    buff_expire: '⏳',
    critical_hit: '💥',
    combo_hit: '🔥',
    status_effect: '✨',
    poem_combo: '💫' };
  const style = typeStyles[entry.type] || 'text-slate-400';
  const icon = typeIcons[entry.type] || '●';

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.15 }}
      className={`text-[10px] sm:text-xs leading-relaxed font-mono ${style} ${className || ''}`}
    >
      <span className="opacity-30 mr-1 text-[8px]">Т{entry.turn}</span>
      <span className="mr-0.5">{icon}</span>
      {entry.text}
    </motion.div>
  );
}

/* ── Victory Screen ── */
function VictoryScreen({ rewards, maxCombo }: { rewards: import('@/shared/types/game').CombatReward; maxCombo: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center gap-3 py-4"
    >
      <motion.div
        animate={{ scale: [1, 1.1, 1], textShadow: ['0 0 20px #10b981', '0 0 40px #10b981', '0 0 20px #10b981'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
        className="text-4xl"
      >
        🏆
      </motion.div>
      <div className="text-xl font-bold text-emerald-400 font-mono" style={{ textShadow: '0 0 12px #10b98180' }}>
        ПОБЕДА!
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs font-mono">
        <span className="text-slate-400">ОПЫТ:</span>
        <span className="text-cyan-400">+{rewards.xp}</span>
        <span className="text-slate-400">Карма:</span>
        <span className="text-amber-400">+{rewards.karma}</span>
        <span className="text-slate-400">Кредиты:</span>
        <span className="text-yellow-300">+{rewards.credits}</span>
        {rewards.lootItems.length > 0 && (
          <>
            <span className="text-slate-400">Добыча:</span>
            <span className="text-emerald-400">✓</span>
          </>
        )}
        {maxCombo >= 2 && (
          <>
            <span className="text-slate-400">Комбо:</span>
            <span className="text-orange-400">x{maxCombo}</span>
          </>
        )}
      </div>
      {/* Skill XP */}
      {rewards.skillXp && Object.keys(rewards.skillXp).length > 0 && (
        <div className="text-[9px] text-slate-500 font-mono">
          {Object.entries(rewards.skillXp).map(([skill, xp]) => (
            <span key={skill} className="mr-2">{skill}: +{xp}</span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

/* ── Defeat Screen ── */
function DefeatScreen() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center gap-3 py-4"
    >
      <motion.div
        animate={{ rotate: [0, -5, 5, -3, 3, 0] }}
        transition={{ duration: 0.5 }}
        className="text-4xl"
      >
        💀
      </motion.div>
      <div className="text-xl font-bold text-red-400 font-mono" style={{ textShadow: '0 0 12px #ef444480' }}>
        ПОРАЖЕНИЕ
      </div>
      <div className="text-xs text-slate-400 font-mono text-center">
        Тьма поглощает... но не навсегда.
      </div>
    </motion.div>
  );
}

/* ── Poem Power Card for the enhanced submenu ── */
function PoemPowerCard({
  power,
  index,
  onCooldown,
  isGamepadSelected,
  onSelect,
  gamepadUseHint,
}: {
  power: { poemId: string; name: string; description: string; cooldownRemaining: number };
  index: number;
  onCooldown: boolean;
  isGamepadSelected: boolean;
  onSelect: () => void;
  gamepadUseHint?: string;
}) {
  const category = getPoemEffectCategory(power.poemId);
  const categoryColor = getPoemCategoryColor(category);
  const categoryLabel = getPoemEffectLabel(category);
  const CategoryIcon = getPoemEffectIcon(category);

  // Get total cooldown from POEM_COMBAT_ABILITIES
  const ability = POEM_COMBAT_ABILITIES[power.poemId];
  const totalCooldown = ability?.cooldown ?? 0;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={onSelect}
          disabled={onCooldown}
          className={`relative w-full px-3 py-2 text-left transition-all border-b border-slate-800/30 last:border-0 font-mono ${
            onCooldown
              ? 'opacity-30 cursor-not-allowed grayscale'
              : isGamepadSelected
                ? 'bg-amber-900/50 ring-1 ring-amber-400/40'
                : 'hover:bg-amber-900/30'
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              {/* Keyboard shortcut hint */}
              {!onCooldown && (
                <span className="text-[8px] text-slate-600 bg-slate-800/60 rounded px-1 py-px font-mono shrink-0">
                  {index + 1}
                </span>
              )}
              <span className="text-xs text-amber-300 font-medium truncate">{power.name}</span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Effect category tag */}
              <span className={`inline-flex items-center gap-0.5 text-[7px] px-1 py-px rounded border ${categoryColor}`}>
                <CategoryIcon className="size-2" />
                {categoryLabel}
              </span>
              {gamepadUseHint && isGamepadSelected && !onCooldown && (
                <span className="text-[8px] text-amber-500/70 font-mono">{gamepadUseHint}</span>
              )}
              {onCooldown && (
                <span className="flex items-center gap-0.5 text-[8px] text-slate-500">
                  <Clock className="size-2.5" /> {power.cooldownRemaining}х
                </span>
              )}
            </div>
          </div>
          <div className="text-[9px] text-slate-500 mt-0.5">{power.description}</div>
          {/* Cooldown progress bar */}
          {onCooldown && totalCooldown > 0 && (
            <div className="mt-1 w-full h-0.5 bg-slate-800/60 rounded overflow-hidden">
              <div
                className="h-full bg-amber-700/40 rounded transition-all"
                style={{ width: `${((totalCooldown - power.cooldownRemaining) / totalCooldown) * 100}%` }}
              />
            </div>
          )}
        </button>
      </TooltipTrigger>
      <TooltipContent
        side="left"
        className="bg-black/90 border border-slate-700/50 text-[10px] font-mono text-slate-200 max-w-[220px]"
        sideOffset={4}
      >
        <div className="font-semibold text-amber-300 mb-1">{power.name}</div>
        <div className="text-slate-400">{power.description}</div>
        <div className="mt-1 text-slate-500">Кулдаун: {totalCooldown} х.</div>
        <div className="text-slate-500">Эффект: {categoryLabel}</div>
        {onCooldown && <div className="text-red-400 mt-1">⏳ Готовность через {power.cooldownRemaining} х.</div>}
      </TooltipContent>
    </Tooltip>
  );
}

/* ── Main Component ── */
export function CombatUI() {
  // Read combatActive directly from the UI store — the facade's
  // scheduleFacadeFlush uses RAF which doesn't fire under 'demand' frameloop.
  // This ensures CombatUI unmounts immediately when combat ends.
  const combatActive = useUIStore((s) => s.combatActive);
  const mainMenuOpen = useUIStore((s) => s.mainMenuOpen);
  const introActive = useUIStore((s) => s.introActive);
  const activeCutsceneId = useCutsceneStore((s) => s.activeCutsceneId);
  const mode = getGamePhase({ mainMenuOpen, introActive, combatActive, activeCutsceneId });
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [showPowers, setShowPowers] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: number; damage: number; type: string; isCritical?: boolean }>>([]);
  const [pendingAction, setPendingAction] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [introVisible, setIntroVisible] = useState(false);
  const [introMeta, setIntroMeta] = useState<{ emoji: string; name: string } | null>(null);
  const gamepadConnected = useGamepadConnected();
  const [gamepadSelectedIdx, setGamepadSelectedIdx] = useState(0);
  const logEndRef = useRef<HTMLDivElement>(null);
  const damageIdRef = useRef(0);
  const timersRef = useRef(new Set<ReturnType<typeof setTimeout>>());

  const scheduleTimeout = useCallback((fn: () => void, ms: number) => {
    const id = setTimeout(() => {
      timersRef.current.delete(id);
      fn();
    }, ms);
    timersRef.current.add(id);
  }, []);

  useEffect(() => {
    const timers = timersRef.current;
    return () => {
      for (const id of timers) {
        clearTimeout(id);
      }
      timers.clear();
    };
  }, []);

  const dismissIntro = useCallback(() => setIntroVisible(false), []);

  useEffect(() => {
    const unsub = eventBus.on('combat:start', ({ encounterName, encounterEmoji }) => {
      setIntroMeta({
        emoji: encounterEmoji ?? '👾',
        name: encounterName ?? 'Противник' });
      setIntroVisible(true);
    });
    return unsub;
  }, []);

  // Subscribe to combat state changes
  useEffect(() => {
    const unsub = subscribeToCombat(setCombatState);
    return unsub;
  }, []);

  // Auto-scroll combat log
  useEffect(() => {
    if (logEndRef.current) {
      logEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [combatState?.log.length]);

  // Track new damage numbers from combat log
  const prevLogLen = useRef(0);
  useEffect(() => {
    if (!combatState) return;
    const currentLen = combatState.log.length;
    if (currentLen > prevLogLen.current) {
      const newEntries = combatState.log.slice(prevLogLen.current);
      for (const entry of newEntries) {
        if (entry.damage && entry.damage > 0) {
          const id = damageIdRef.current++;
          const isCrit = entry.isCritical || entry.type === 'critical_hit';
          setDamageNumbers((prev) => [...prev, { id, damage: entry.damage!, type: entry.type, isCritical: isCrit }]);
          scheduleTimeout(() => {
            setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
          }, isCrit ? 1800 : 1200);

          // Screen effects
          if (isCrit) {
            setScreenShake(true);
            setFlashColor('rgba(255,255,100,0.15)');
            scheduleTimeout(() => { setScreenShake(false); setFlashColor(null); }, 300);
          } else if (entry.type === 'enemy_attack' || entry.type === 'enemy_special') {
            setScreenShake(true);
            setFlashColor('rgba(239,68,68,0.1)');
            scheduleTimeout(() => { setScreenShake(false); setFlashColor(null); }, 300);
          }
        }
      }
    }
    prevLogLen.current = currentLen;
  }, [combatState, scheduleTimeout]);

  // Close powers menu when turn changes; unlock UI after terminal states
  useEffect(() => {
    if (combatState?.isPlayerTurn || combatState?.status !== 'active') {
      scheduleTimeout(() => setPendingAction(false), 0);
    }
  }, [combatState?.isPlayerTurn, combatState?.turn, combatState?.status, scheduleTimeout]);

  // Safety timeout: auto-clear pendingAction after 10s if stuck (combat crash / missed event)
  useEffect(() => {
    if (!pendingAction) return;
    const id = setTimeout(() => {
      setPendingAction(false);
    }, 10_000);
    return () => clearTimeout(id);
  }, [pendingAction]);

  const availablePowers = useMemo(
    () => getAvailableCombatPowers(),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [combatState?.powerCooldowns, combatState?.turn],
  );
  const playerBuffs = useMemo(
    () => getActiveBuffs('player'),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [combatState?.buffs],
  );
  const enemyBuffs = useMemo(
    () => getActiveBuffs('enemy'),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [combatState?.buffs],
  );
  const handleAttack = useCallback(() => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerAttack();
    setShowPowers(false);
  }, [pendingAction, combatState]);

  const handleDefend = useCallback(() => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerDefend();
    setShowPowers(false);
  }, [pendingAction, combatState]);

  const handlePower = useCallback((poemId: string) => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerUsePoemPower(poemId);
    setShowPowers(false);
  }, [pendingAction, combatState]);

  const handleFlee = useCallback(() => {
    if (pendingAction || !combatState?.isPlayerTurn) return;
    setPendingAction(true);
    playerFlee();
    setShowPowers(false);
  }, [pendingAction, combatState]);

  // Keyboard shortcuts for combat actions (1-4 base, 1-9 within poem submenu)
  // Must be declared AFTER handleAttack/handleDefend/handlePower/handleFlee
  useEffect(() => {
    if (mode !== 'combat' || !combatState) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      const isPlayerTurn = combatState.isPlayerTurn && combatState.status === 'active';
      if (!isPlayerTurn || pendingAction) return;

      // If poem submenu is open, 1-9 selects poem powers
      if (showPowers && availablePowers.length > 0) {
        const num = parseInt(e.key, 10);
        if (num >= 1 && num <= 9 && num <= availablePowers.length) {
          const power = availablePowers[num - 1];
          if (power && power.cooldownRemaining <= 0) {
            handlePower(power.poemId);
          }
          return;
        }
        // Escape closes the poem menu
        if (e.key === 'Escape') {
          setShowPowers(false);
          return;
        }
      }

      switch (e.key) {
        case '1': handleAttack(); break;
        case '2': handleDefend(); break;
        case '3':
          if (availablePowers.length === 1) {
            handlePower(availablePowers[0].poemId);
          } else {
            setShowPowers((p) => !p);
          }
          break;
        case '4': handleFlee(); break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, combatState, pendingAction, handleAttack, handleDefend, handlePower, handleFlee, availablePowers, showPowers]);

  // Sync gamepad poem selection index from engine → local state for UI highlighting
  useEffect(() => {
    if (!gamepadConnected) return;
    const interval = setInterval(() => {
      setGamepadSelectedIdx(getGamepadSelectedPoemIndex());
    }, 100);
    return () => clearInterval(interval);
  }, [gamepadConnected]);

  // Handle gamepad dpad navigation: up/down cycle poem selection in powers menu
  useEffect(() => {
    if (mode !== 'combat') return;
    const unsub = eventBus.on('combat:gamepad_dpad_nav', ({ direction }) => {
      if (direction === 'up' || direction === 'down') {
        setShowPowers(true);
      }
    });
    return unsub;
  }, [mode]);

  if (mode !== 'combat' || !combatState) return null;

  const enemy = combatState.enemy;
  const isActive = combatState.status === 'active';
  const isPlayerTurn = combatState.isPlayerTurn && isActive && !introVisible;

  // Check if silenced
  const isSilenced = combatState.buffs.some(b => b.target === 'player' && b.effect.type === 'silence_specials');

  return (
    <TooltipProvider delayDuration={200}>
      <div
        className={`fixed inset-0 flex flex-col pointer-events-none ${screenShake ? 'combat-shake' : ''} ${isActive ? 'combat-vignette-active' : ''}`}
        style={{ zIndex: UI_LAYERS.COMBAT }}
      >
        <AnimatePresence>
          {introVisible && introMeta && (
            <CombatIntroSplash
              key={`${introMeta.name}-${introMeta.emoji}`}
              emoji={introMeta.emoji}
              name={introMeta.name}
              onDone={dismissIntro}
            />
          )}
        </AnimatePresence>

        {/* Screen flash overlay */}
        <AnimatePresence>
          {flashColor && (
            <motion.div
              initial={{ opacity: 1 }}
              animate={{ opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="fixed inset-0 pointer-events-none"
              style={{ backgroundColor: flashColor, zIndex: UI_LAYERS.COMBAT + 1 }}
            />
          )}
        </AnimatePresence>

        {/* ── Top Section: Enemy Info ── */}
        <motion.div
          className="pointer-events-auto pt-3 px-3"
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: introVisible ? -20 : 0, opacity: introVisible ? 0.35 : 1 }}
          transition={{ delay: introVisible ? 0 : 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          <motion.div
            className="bg-black/60 backdrop-blur-sm border border-red-900/30 rounded-lg p-3 scan-line"
            style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}
          >
            {/* Enemy portrait + name */}
            <div className="flex items-center gap-3 mb-2">
              <EnemyPortrait emoji={enemy.emoji} hp={enemy.hp} maxHp={enemy.maxHp} />
              <div className="flex-1">
                <div className="text-sm text-red-300 font-mono font-semibold">{enemy.name}</div>
                {combatState.enemyDefenseReduction > 0 && (
                  <div className="text-[9px] text-amber-400 font-mono">⚠ ЗАЩИТА: -{Math.round(combatState.enemyDefenseReduction * 100)}%</div>
                )}
              </div>
              {/* Combo counter on right side */}
              {combatState.comboCount > 0 && (
                <ComboCounter count={combatState.comboCount} />
              )}
            </div>
            <AnimatedHPBar current={enemy.hp} max={enemy.maxHp} label="ENEMY" isPlayer={false} />
            {/* Enemy buffs/debuffs indicator bar */}
            {enemyBuffs.length > 0 && (
              <div className="mt-2">
                <BuffDebuffBar buffs={enemyBuffs} label="ЭФФЕКТЫ ВРАГА" />
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* ── Middle: Damage Numbers ── */}
        <div className="relative flex-1 flex items-center justify-center">
          <AnimatePresence>
            {damageNumbers.map((dn) => (
              <DamageNumber key={dn.id} damage={dn.damage} type={dn.type} isCritical={dn.isCritical} />
            ))}
          </AnimatePresence>
        </div>

        {/* ── Bottom Section ── */}
        <motion.div
          className="pointer-events-auto px-3 pb-3"
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: introVisible ? 20 : 0, opacity: introVisible ? 0.35 : 1 }}
          transition={{ delay: introVisible ? 0 : 0.4, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Player status card */}
          <div className="bg-black/60 backdrop-blur-sm border border-cyan-900/30 rounded-lg p-3 mb-2 data-pulse"
            style={{ boxShadow: '0 0 20px rgba(6,182,212,0.08)' }}>
            {/* Player HP + Buffs */}
            <div className="flex items-center gap-2 mb-2">
              <Heart className="size-4 text-cyan-500 shrink-0" />
              <div className="flex-1">
                <AnimatedHPBar
                  current={combatState.playerHp}
                  max={combatState.playerMaxHp}
                  label="ВОЛОДЬКА"
                  isPlayer={true}
                />
              </div>
            </div>
            {/* Player buffs/debuffs indicator bar */}
            {playerBuffs.length > 0 && (
              <div className="ml-6">
                <BuffDebuffBar buffs={playerBuffs} label="ВАШИ ЭФФЕКТЫ" />
              </div>
            )}
          </div>

          {/* Turn indicator / Victory / Defeat */}
          {!isActive && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={`rounded-lg mb-2 border overflow-hidden ${
                combatState.status === 'victory'
                  ? 'bg-emerald-950/70 border-emerald-700/40'
                  : combatState.status === 'defeat'
                    ? 'bg-red-950/70 border-red-700/40'
                    : 'bg-amber-950/70 border-amber-700/40'
              }`}
            >
              {combatState.status === 'victory' && combatState.rewards && (
                <VictoryScreen rewards={combatState.rewards} maxCombo={combatState.maxCombo} />
              )}
              {combatState.status === 'defeat' && <DefeatScreen />}
              {combatState.status === 'fled' && (
                <div className="text-center py-3 font-bold text-amber-400 font-mono">🏃 Побег!</div>
              )}
            </motion.div>
          )}

          {isActive && (
            <>
              {/* Turn + flee indicator */}
              <div className="text-[10px] text-center mb-1.5 text-slate-400 font-mono">
                <span className="text-slate-500">ХОД {combatState.turn}</span>
                <span className="mx-1.5 text-slate-600">│</span>
                <span className={isPlayerTurn ? 'text-cyan-400 power-up' : 'text-red-400'}>
                  {isPlayerTurn ? '▶ ВАШ ХОД' : '○ ХОД ВРАГА...'}
                </span>
                {isSilenced && (
                  <span className="ml-2 text-red-400">🔇 СПОСОБНОСТИ ЗАБЛОКИРОВАНЫ</span>
                )}
                {combatState.fleeAttempts > 0 && (
                  <span className="ml-2 text-amber-400/60">
                    <Zap className="inline size-2.5" /> Побег: +{combatState.fleeAttempts * 15}%
                  </span>
                )}
              </div>

              {/* Signal wave indicator */}
              <div className="signal-wave mb-1.5">
                <span /><span /><span /><span /><span />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-1.5 mb-2">
                <TerminalButton onClick={handleAttack} disabled={!isPlayerTurn || pendingAction} accentColor="cyan" gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.attack : undefined}>
                  <Sword className="size-3.5" />
                  АТАКА
                </TerminalButton>
                <TerminalButton onClick={handleDefend} disabled={!isPlayerTurn || pendingAction} accentColor="emerald" gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.defend : undefined}>
                  <Shield className="size-3.5" />
                  ЗАЩИТА
                </TerminalButton>
                <div className="relative flex-1">
                  <TerminalButton
                    onClick={() => setShowPowers((p) => !p)}
                    disabled={!isPlayerTurn || pendingAction || availablePowers.length === 0 || isSilenced}
                    accentColor="amber"
                    gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.poem_cycle_next : undefined}
                  >
                    <Sparkles className="size-3.5" />
                    СТИХ
                    <ChevronDown className={`size-2.5 transition-transform ${showPowers ? 'rotate-180' : ''}`} />
                  </TerminalButton>

                  {/* Enhanced Poem Powers Submenu */}
                  <AnimatePresence>
                    {showPowers && availablePowers.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-0 right-0 mb-2 bg-black/95 border border-amber-700/30 rounded-lg backdrop-blur-md overflow-hidden max-h-60 overflow-y-auto"
                        style={{ zIndex: UI_LAYERS.COMBAT, scrollbarWidth: 'thin', scrollbarColor: '#78716c transparent' }}
                      >
                        {/* Submenu header with hint */}
                        <div className="sticky top-0 bg-black/90 border-b border-amber-900/30 px-3 py-1.5 flex items-center justify-between z-10">
                          <span className="text-[9px] text-amber-400/80 font-mono font-semibold uppercase tracking-wider">
                            ⚡ Стихотворения
                          </span>
                          <span className="text-[8px] text-slate-500 font-mono">
                            [1-{Math.min(9, availablePowers.length)}] выбор · [Esc] закрыть
                          </span>
                        </div>
                        {availablePowers.map((power, idx) => {
                          const onCooldown = power.cooldownRemaining > 0;
                          const isGamepadSelected = gamepadConnected && idx === gamepadSelectedIdx;
                          return (
                            <PoemPowerCard
                              key={power.poemId}
                              power={power}
                              index={idx}
                              onCooldown={onCooldown}
                              isGamepadSelected={isGamepadSelected}
                              onSelect={() => !onCooldown && handlePower(power.poemId)}
                              gamepadUseHint={gamepadConnected ? COMBAT_BUTTON_HINTS.poem_use_selected : undefined}
                            />
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
                <TerminalButton onClick={handleFlee} disabled={!isPlayerTurn || pendingAction} accentColor="rose" gamepadHint={gamepadConnected ? COMBAT_BUTTON_HINTS.flee : undefined}>
                  <LogOut className="size-3.5" />
                  БЕЖАТЬ
                </TerminalButton>
              </div>
            </>
          )}

          {/* Combat Log — terminal output with enhanced formatting */}
          <div aria-live="polite" aria-label="Combat log" className="max-h-28 overflow-y-auto bg-black/70 border border-slate-800/30 rounded-lg p-2 font-mono"
            style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
            {combatState.log.map((entry: CombatLogEntry, i: number) => (
              <CombatLogLine key={`${i}-T${entry.turn}-${entry.type}`} entry={entry} className="typing-cursor" />
            ))}
            <div ref={logEndRef} />
          </div>
        </motion.div>

        {/* Scanlines overlay for cyberpunk feel */}
        <div
          className="fixed inset-0 pointer-events-none opacity-[0.02]"
          style={{
            zIndex: UI_LAYERS.COMBAT,
            backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)' }}
        />
      </div>
    </TooltipProvider>
  );
}
