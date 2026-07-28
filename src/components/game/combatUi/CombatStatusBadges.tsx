/* Status / buff badges extracted from CombatUI facade. */

import { motion, AnimatePresence } from 'framer-motion';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import type { CombatBuff } from '@/shared/types/game';
import { getBuffEffectDescription } from '@/components/game/combatUi/buffEffectDescription';

export function StatusBadge({ buff }: { buff: CombatBuff }) {
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

  const isOnPlayer = buff.target === 'player';
  const isPositive = isOnPlayer ? !isDebuff : isDebuff;

  const borderColor = isPositive ? 'border-emerald-600/60' : 'border-red-600/60';
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

export function BuffDebuffBar({ buffs, label }: { buffs: CombatBuff[]; label: string }) {
  if (buffs.length === 0) return null;
  const positiveBuffs = buffs.filter((b) => b.kind === 'buff');
  const negativeBuffs = buffs.filter((b) => b.kind === 'debuff');

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
