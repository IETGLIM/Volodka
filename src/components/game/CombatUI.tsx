'use client';

/* ─── Volodka RPG – Enhanced Combat UI Overlay ─── */
/* Task 8: Complete visual overhaul with cyberpunk terminal aesthetic,
   combo counter, critical hit animations, status effects, victory/defeat screens */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { Sword, Shield, Sparkles, LogOut, ChevronDown, Heart, Clock, Zap, Flame, Skull, Trophy, RotateCcw, Eye, Bug, ShieldAlert, Music2 } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import {
  getCombatState,
  playerAttack,
  playerDefend,
  playerUsePoemPower,
  playerFlee,
  getAvailableCombatPowers,
  getActiveBuffs,
  subscribeToCombat,
} from '@/engine/CombatSystem';
import type { CombatState, CombatLogEntry, CombatBuff } from '@/shared/types/game';

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
      style={{ zIndex: 60, textShadow: `0 0 ${isCritical ? 16 : 8}px currentColor, 0 2px 4px rgba(0,0,0,0.8)` }}
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
          textShadow: `0 0 ${8 + intensity * 4}px currentColor, 0 0 ${16 + intensity * 8}px ${count >= 3 ? '#f97316' : '#06b6d4'}40`,
        }}
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

/* ── Status Effect Badge ── */
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
    defensive_verse: '📜',
  };
  const icon = iconMap[buff.effect.type] || (isDebuff ? '⬇️' : '⬆️');
  const borderColor = buff.target === 'player'
    ? isDebuff ? 'border-red-600/60' : 'border-cyan-600/60'
    : isDebuff ? 'border-amber-600/60' : 'border-red-600/60';

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono border ${borderColor} ${isDebuff ? 'bg-red-950/50 text-red-300' : 'bg-cyan-950/50 text-cyan-300'}`}
      style={{ boxShadow: isDebuff ? '0 0 6px rgba(239,68,68,0.2)' : '0 0 6px rgba(6,182,212,0.2)' }}
    >
      <span>{icon}</span>
      <span className="truncate max-w-[60px]">{buff.name}</span>
      <span className="opacity-60">{buff.duration}х</span>
      <motion.div
        className="absolute inset-0 rounded border"
        animate={{ borderColor: [isDebuff ? '#dc2626' : '#06b6d4', 'transparent', isDebuff ? '#dc2626' : '#06b6d4'] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
    </motion.div>
  );
}

/* ── Enemy Silhouette (CSS animated) ── */
function EnemyPortrait({ emoji, hp, maxHp }: { emoji: string; hp: number; maxHp: number }) {
  const hurt = hp / maxHp < 0.3;
  return (
    <div className="relative flex items-center justify-center">
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
          transform: 'scale(1.5)',
        }}
      />
    </div>
  );
}

/* ── Terminal-style Action Button ── */
function TerminalButton({
  onClick, disabled, accentColor, children,
}: {
  onClick: () => void; disabled: boolean; accentColor: string; children: React.ReactNode;
}) {
  const colorMap: Record<string, { border: string; bg: string; text: string; hoverBg: string; glow: string }> = {
    cyan: { border: 'border-cyan-700/60', bg: 'bg-cyan-950/50', text: 'text-cyan-400', hoverBg: 'hover:bg-cyan-900/40', glow: '#06b6d4' },
    emerald: { border: 'border-emerald-700/60', bg: 'bg-emerald-950/50', text: 'text-emerald-400', hoverBg: 'hover:bg-emerald-900/40', glow: '#10b981' },
    amber: { border: 'border-amber-700/60', bg: 'bg-amber-950/50', text: 'text-amber-400', hoverBg: 'hover:bg-amber-900/40', glow: '#f59e0b' },
    slate: { border: 'border-slate-600/60', bg: 'bg-slate-900/50', text: 'text-slate-300', hoverBg: 'hover:bg-slate-800/40', glow: '#94a3b8' },
    rose: { border: 'border-rose-700/60', bg: 'bg-rose-950/50', text: 'text-rose-400', hoverBg: 'hover:bg-rose-900/40', glow: '#f43f5e' },
  };
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
      {/* Corner brackets */}
      <span className="absolute top-0 left-0 text-[8px] leading-none opacity-30">┌</span>
      <span className="absolute bottom-0 right-0 text-[8px] leading-none opacity-30">┘</span>
      {children}
    </button>
  );
}

/* ── Combat Log Entry ── */
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
    poem_combo: 'text-fuchsia-400 font-bold',
  };
  const prefix: Record<string, string> = {
    player_attack: '>',
    enemy_attack: '!',
    enemy_special: '!!',
    player_defend: '#',
    player_power: '*',
    critical_hit: '>>>',
    combo_hit: '>>',
    poem_combo: '***',
    status_effect: '~',
    info: '-',
    victory: '>>>',
    defeat: '!!!',
    buff_expire: '...',
  };
  const style = typeStyles[entry.type] || 'text-slate-400';
  const pre = prefix[entry.type] || '>';

  return (
    <div className={`text-[10px] sm:text-xs leading-relaxed font-mono ${style} ${className || ''}`}>
      <span className="opacity-40 mr-1">{pre}</span>
      {entry.text}
    </div>
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

/* ── Main Component ── */
export function CombatUI() {
  const mode = useGameStore((s) => s.mode);
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const [showPowers, setShowPowers] = useState(false);
  const [damageNumbers, setDamageNumbers] = useState<Array<{ id: number; damage: number; type: string; isCritical?: boolean }>>([]);
  const [pendingAction, setPendingAction] = useState(false);
  const [screenShake, setScreenShake] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);
  const damageIdRef = useRef(0);

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
          setTimeout(() => {
            setDamageNumbers((prev) => prev.filter((d) => d.id !== id));
          }, isCrit ? 1800 : 1200);

          // Screen effects
          if (isCrit) {
            setScreenShake(true);
            setFlashColor('rgba(255,255,100,0.15)');
            setTimeout(() => { setScreenShake(false); setFlashColor(null); }, 300);
          } else if (entry.type === 'enemy_attack' || entry.type === 'enemy_special') {
            setFlashColor('rgba(239,68,68,0.1)');
            setTimeout(() => setFlashColor(null), 200);
          }
        }
      }
    }
    prevLogLen.current = currentLen;
  }, [combatState]);

  // Close powers menu when turn changes
  useEffect(() => {
    if (combatState?.isPlayerTurn) {
      setTimeout(() => setPendingAction(false), 0);
    }
  }, [combatState?.isPlayerTurn, combatState?.turn]);

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

  if (mode !== 'combat' || !combatState) return null;

  const enemy = combatState.enemy;
  const isActive = combatState.status === 'active';
  const isPlayerTurn = combatState.isPlayerTurn && isActive;

  const availablePowers = getAvailableCombatPowers();
  const playerBuffs = getActiveBuffs('player');
  const enemyBuffs = getActiveBuffs('enemy');

  // Check if silenced
  const isSilenced = combatState.buffs.some(b => b.target === 'player' && b.effect.type === 'silence_specials');

  return (
    <div
      className={`fixed inset-0 flex flex-col pointer-events-none ${screenShake ? 'animate-pulse' : ''}`}
      style={{ zIndex: UI_LAYERS.COMBAT }}
    >
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
      <div className="pointer-events-auto pt-3 px-3">
        <motion.div
          initial={{ y: -30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
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
              {enemyBuffs.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {enemyBuffs.map((b) => <StatusBadge key={b.id} buff={b} />)}
                </div>
              )}
            </div>
            {/* Combo counter on right side */}
            {combatState.comboCount > 0 && (
              <ComboCounter count={combatState.comboCount} />
            )}
          </div>
          <AnimatedHPBar current={enemy.hp} max={enemy.maxHp} label="ENEMY" isPlayer={false} />
        </motion.div>
      </div>

      {/* ── Middle: Damage Numbers ── */}
      <div className="relative flex-1 flex items-center justify-center">
        <AnimatePresence>
          {damageNumbers.map((dn) => (
            <DamageNumber key={dn.id} damage={dn.damage} type={dn.type} isCritical={dn.isCritical} />
          ))}
        </AnimatePresence>
      </div>

      {/* ── Bottom Section ── */}
      <div className="pointer-events-auto px-3 pb-3">
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
          {/* Player buffs/debuffs */}
          {playerBuffs.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-1 ml-6">
              {playerBuffs.map((b) => <StatusBadge key={b.id} buff={b} />)}
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
              <TerminalButton onClick={handleAttack} disabled={!isPlayerTurn || pendingAction} accentColor="cyan">
                <Sword className="size-3.5" />
                АТАКА
              </TerminalButton>
              <TerminalButton onClick={handleDefend} disabled={!isPlayerTurn || pendingAction} accentColor="emerald">
                <Shield className="size-3.5" />
                ЗАЩИТА
              </TerminalButton>
              <div className="relative flex-1">
                <TerminalButton
                  onClick={() => setShowPowers((p) => !p)}
                  disabled={!isPlayerTurn || pendingAction || availablePowers.length === 0 || isSilenced}
                  accentColor="amber"
                >
                  <Sparkles className="size-3.5" />
                  СТИХ
                  <ChevronDown className={`size-2.5 transition-transform ${showPowers ? 'rotate-180' : ''}`} />
                </TerminalButton>

                {/* Poem Powers Submenu */}
                <AnimatePresence>
                  {showPowers && availablePowers.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="absolute bottom-full left-0 right-0 mb-2 bg-black/95 border border-amber-700/30 rounded-lg backdrop-blur-md overflow-hidden max-h-48 overflow-y-auto"
                      style={{ zIndex: UI_LAYERS.COMBAT }}
                    >
                      {availablePowers.map((power) => {
                        const onCooldown = power.cooldownRemaining > 0;
                        return (
                          <button
                            key={power.poemId}
                            onClick={() => !onCooldown && handlePower(power.poemId)}
                            disabled={onCooldown}
                            className={`w-full px-3 py-2 text-left transition-colors border-b border-slate-800/30 last:border-0 font-mono ${
                              onCooldown ? 'opacity-30 cursor-not-allowed' : 'hover:bg-amber-900/30'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-amber-300 font-medium">{power.name}</span>
                              {onCooldown && (
                                <span className="flex items-center gap-0.5 text-[8px] text-slate-500">
                                  <Clock className="size-2.5" /> {power.cooldownRemaining}х
                                </span>
                              )}
                            </div>
                            <div className="text-[9px] text-slate-500">{power.description}</div>
                          </button>
                        );
                      })}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <TerminalButton onClick={handleFlee} disabled={!isPlayerTurn || pendingAction} accentColor="rose">
                <LogOut className="size-3.5" />
                БЕЖАТЬ
              </TerminalButton>
            </div>
          </>
        )}

        {/* Combat Log — terminal output */}
        <div className="max-h-28 overflow-y-auto bg-black/70 border border-slate-800/30 rounded-lg p-2 font-mono"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}>
          {combatState.log.map((entry: CombatLogEntry, i: number) => (
            <CombatLogLine key={i} entry={entry} className="typing-cursor" />
          ))}
          <div ref={logEndRef} />
        </div>
      </div>

      {/* Scanlines overlay for cyberpunk feel */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.02]"
        style={{
          zIndex: UI_LAYERS.COMBAT,
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.1) 2px, rgba(0,255,65,0.1) 4px)',
        }}
      />
    </div>
  );
}
