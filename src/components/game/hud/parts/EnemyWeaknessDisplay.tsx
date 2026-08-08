import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { subscribeToCombat } from '@/engine/CombatSystem';
import type { CombatState, CombatEnemy } from '@/shared/types/game';

const STAT_INFO: Record<string, { label: string; icon: string; color: string }> = {
  logic: { label: 'ЛОГИКА', icon: '🧠', color: 'text-cyan-400' },
  energy: { label: 'ЭНЕРГИЯ', icon: '⚡', color: 'text-amber-400' },
  karma: { label: 'КАРМА', icon: '🕊️', color: 'text-emerald-400' },
  empathy: { label: 'ЭМПАТИЯ', icon: '❤️', color: 'text-rose-400' },
};

const STAT_GRADIENT: Record<string, string> = {
  logic: '#06b6d4',
  energy: '#f59e0b',
  karma: '#10b981',
  empathy: '#f43f5e',
};

const TYPE_COLORS: Record<string, string> = {
  system_daemon: 'border-red-500/40',
  corporate_golem: 'border-amber-500/40',
  shadow_agent: 'border-purple-500/40',
  data_phantom: 'border-blue-500/40',
  code_inquisitor: 'border-rose-500/40',
  guild_enforcer: 'border-orange-500/40',
  data_wraith: 'border-violet-500/40',
  censor_drone: 'border-slate-400/40',
  poetry_hunter: 'border-fuchsia-500/40',
  nexus_guardian: 'border-cyan-500/40',
  void_echo: 'border-indigo-500/40',
  corporate_drone: 'border-yellow-500/40',
  memory_wraith: 'border-pink-500/40',
  firewall_guardian: 'border-emerald-500/40',
};

export function EnemyWeaknessDisplay() {
  const [enemy, setEnemy] = useState<CombatEnemy | null>(null);

  useEffect(() => {
    const unsub = subscribeToCombat((state: CombatState | null) => {
      setEnemy(state?.enemy ?? null);
    });
    return unsub;
  }, []);

  const statInfo = enemy ? STAT_INFO[enemy.targetsStat] : null;
  const typeBorder = enemy ? TYPE_COLORS[enemy.type] || 'border-slate-500/40' : '';

  if (!enemy || !statInfo) return null;

  const gradientColor = STAT_GRADIENT[enemy.targetsStat] ?? '#f43f5e';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{ duration: 0.3 }}
        className={`enemy-weakness-card hud-filmic-weakness-reveal flex flex-col gap-1.5 px-3 py-2 rounded border bg-black/70 backdrop-blur-sm font-mono ${typeBorder}`}
      >
        {/* Target stat warning */}
        <div className="flex items-center gap-1.5">
          <span className="text-xs">{statInfo.icon}</span>
          <span className={`text-[9px] font-mono font-semibold uppercase tracking-wider ${statInfo.color}`}>
            Цель: {statInfo.label}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-[8px] font-mono text-slate-400">
          <span>ATK <span className="text-red-400">{enemy.attack}</span></span>
          <span>DEF <span className="text-cyan-400">{enemy.defense}</span></span>
          <span>SPD <span className="text-amber-400">{enemy.speed}</span></span>
        </div>

        {/* Weakness hint bar */}
        <div className="enemy-weakness-hint-bar w-full h-0.5 rounded bg-slate-800/60 overflow-hidden">
          <motion.div
            className="h-full rounded"
            style={{ background: `linear-gradient(90deg, ${gradientColor}, transparent)` }}
            initial={{ width: '0%' }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}