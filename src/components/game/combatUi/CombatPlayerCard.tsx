/* Player HP / buff card extracted from CombatUI facade. */

import { Heart } from 'lucide-react';
import type { CombatBuff } from '@/shared/types/game';
import { BuffDebuffBar } from '@/components/game/combatUi/CombatStatusBadges';
import { AnimatedHPBar } from '@/components/game/combatUi/CombatHpBars';
import { ThoughtCombatBadges } from '@/components/game/combatUi/CombatThoughtBadges';

export function CombatPlayerCard({
  playerHp,
  playerMaxHp,
  playerBuffs,
}: {
  playerHp: number;
  playerMaxHp: number;
  playerBuffs: CombatBuff[];
}) {
  return (
    <div
      className="bg-black/60 backdrop-blur-sm border border-cyan-900/30 rounded-lg p-3 mb-2 data-pulse"
      style={{ boxShadow: '0 0 20px rgba(6,182,212,0.08)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Heart className="size-4 text-cyan-500 shrink-0" />
        <div className="flex-1">
          <AnimatedHPBar
            current={playerHp}
            max={playerMaxHp}
            label="ВОЛОДЬКА"
            isPlayer={true}
          />
        </div>
      </div>
      {playerBuffs.length > 0 && (
        <div className="ml-6">
          <BuffDebuffBar buffs={playerBuffs} label="ВАШИ ЭФФЕКТЫ" />
        </div>
      )}
      <ThoughtCombatBadges />
    </div>
  );
}
