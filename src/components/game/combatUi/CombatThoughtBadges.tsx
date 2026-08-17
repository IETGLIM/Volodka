/* Thought combat contribution badges — amber/gold near player stats. */

import { useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEquippedThoughts } from '@/store/selectors/thoughtCabinetSelectors';
import {
  resolveThoughtCombatContributions,
  hasThoughtCombatEffects,
  resolveThoughtCombatEffects,
} from '@/engine/combat/thoughtCombatModifiers';

export function ThoughtCombatBadges() {
  const equippedThoughts = useEquippedThoughts();
  const contributions = useMemo(
    () => resolveThoughtCombatContributions(equippedThoughts),
    [equippedThoughts],
  );
  const effects = useMemo(
    () => resolveThoughtCombatEffects(equippedThoughts),
    [equippedThoughts],
  );

  if (!hasThoughtCombatEffects(effects) || contributions.length === 0) return null;

  return (
    <div className="ml-6 mt-1">
      <div className="text-[8px] text-amber-500/80 font-mono uppercase tracking-widest mb-0.5">
        🧠 МЫСЛИ
      </div>
      <div className="flex flex-wrap gap-1">
        <AnimatePresence mode="popLayout">
          {contributions.map((c) => (
            <motion.div
              key={`${c.thoughtId}-${c.field}`}
              layout
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              className="data-badge relative inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-mono border border-amber-600/40 bg-amber-950/40 text-amber-300 cursor-default select-none"
              style={{ boxShadow: '0 0 6px rgba(245,158,11,0.15)' }}
            >
              <span className="text-amber-400/70 font-semibold">[{c.thoughtName}]</span>
              <span className="text-amber-200">{c.label}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
