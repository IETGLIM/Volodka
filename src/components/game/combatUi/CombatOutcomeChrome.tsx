/* Victory / defeat / flee outcome chrome extracted from CombatUI facade. */

import { motion } from 'framer-motion';
import type { CombatReward, CombatState } from '@/shared/types/game';
import { VictoryScreen, DefeatScreen } from '@/components/game/combatUi/CombatOutcomeScreens';

export function CombatOutcomeChrome({
  status,
  rewards,
  maxCombo,
}: {
  status: CombatState['status'];
  rewards?: CombatReward;
  maxCombo: number;
}) {
  if (status === 'active') return null;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className={`rounded-lg mb-2 border overflow-hidden ${
        status === 'victory'
          ? 'border-breathe bg-emerald-950/70 border-emerald-700/40'
          : status === 'defeat'
            ? 'bg-red-950/70 border-red-700/40'
            : 'bg-amber-950/70 border-amber-700/40'
      }`}
    >
      {status === 'victory' && rewards && (
        <VictoryScreen rewards={rewards} maxCombo={maxCombo} />
      )}
      {status === 'defeat' && <DefeatScreen />}
      {status === 'fled' && (
        <div className="text-center py-3 font-bold text-amber-400 font-mono">🏃 Побег!</div>
      )}
    </motion.div>
  );
}
