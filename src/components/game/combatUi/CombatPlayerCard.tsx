/* Player HP / buff card extracted from CombatUI facade. */

import { Heart, ShieldPlus } from 'lucide-react';
import type { CombatBuff } from '@/shared/types/game';
import { BuffDebuffBar } from '@/components/game/combatUi/CombatStatusBadges';
import { AnimatedHPBar } from '@/components/game/combatUi/CombatHpBars';
import { ThoughtCombatBadges } from '@/components/game/combatUi/CombatThoughtBadges';
import { useGameSelector } from '@/store/selectors/hooks';
import { getTotalEquipmentBonusSummary } from '@/engine/combat/EquipmentBonusCalculator';

export function CombatPlayerCard({
  playerHp,
  playerMaxHp,
  playerBuffs,
}: {
  playerHp: number;
  playerMaxHp: number;
  playerBuffs: CombatBuff[];
}) {
  const equipBonusTotal = useGameSelector((s) => {
    const eq = s.playerState.equippedItems;
    if (!eq) return 0;
    const { skills } = s.playerState;
    const codingBonus = getTotalEquipmentBonusSummary(eq, 'coding', skills.coding);
    const logicBonus = getTotalEquipmentBonusSummary(eq, 'logic', skills.logic);
    return codingBonus + logicBonus;
  });

  return (
    <div
      className="glass-panel bg-black/60 backdrop-blur-sm border border-cyan-900/30 rounded-lg p-3 mb-2 data-pulse"
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
        {equipBonusTotal > 0 && (
          <div
            className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono text-amber-400 bg-amber-900/30 border border-amber-700/30 shrink-0"
            title={`Бонус экипировки: +${equipBonusTotal}`}
          >
            <ShieldPlus className="size-3" />
            +{equipBonusTotal}
          </div>
        )}
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