import { motion } from 'framer-motion';
import type { CombatLogEntry } from '@/shared/types/game';

const TYPE_STYLES: Record<string, string> = {
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

const TYPE_ICONS: Record<string, string> = {
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
  poem_combo: '💫',
};

/** Enhanced combat log entry with turn numbers & type icons. */
export function CombatLogLine({ entry, className }: { entry: CombatLogEntry; className?: string }) {
  const style = TYPE_STYLES[entry.type] || 'text-slate-400';
  const icon = TYPE_ICONS[entry.type] || '●';

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
