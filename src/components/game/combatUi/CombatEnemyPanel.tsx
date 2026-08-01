import { motion } from 'framer-motion';
import { EnemyWeaknessDisplay } from '@/components/game/hud/parts/EnemyWeaknessDisplay';
import { BuffDebuffBar } from '@/components/game/combatUi/CombatStatusBadges';
import { AnimatedHPBar } from '@/components/game/combatUi/CombatHpBars';
import { ComboCounter } from '@/components/game/combatUi/CombatDamageFx';
import { EnemyPortrait } from '@/components/game/combatUi/CombatEnemyPortrait';
import { ENEMY_TEMPLATES } from '@/engine/combat/enemies';
import type { CombatBuff, CombatState } from '@/shared/types/game';

type CombatEnemyPanelProps = {
  combatState: CombatState;
  enemyBuffs: CombatBuff[];
  introVisible: boolean;
};

export function CombatEnemyPanel({
  combatState,
  enemyBuffs,
  introVisible,
}: CombatEnemyPanelProps) {
  const enemy = combatState.enemy;

  return (
    <motion.div
      className="pointer-events-auto pt-3 px-3"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: introVisible ? -20 : 0, opacity: introVisible ? 0.35 : 1 }}
      transition={{ delay: introVisible ? 0 : 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className="bg-black/60 backdrop-blur-sm border border-red-900/30 rounded-lg p-3 scan-line combat-enemy-card"
        style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <EnemyPortrait emoji={enemy.emoji} hp={enemy.hp} maxHp={enemy.maxHp} />
          <div className="flex-1">
            <div className="text-sm text-red-300 font-mono font-semibold">{enemy.name}</div>
            {ENEMY_TEMPLATES[enemy.type]?.description && (
              <div className="text-[8px] text-slate-500 font-mono leading-snug mt-0.5 line-clamp-1">
                {ENEMY_TEMPLATES[enemy.type].description}
              </div>
            )}
            {combatState.enemyDefenseReduction > 0 && (
              <div className="text-[9px] text-amber-400 font-mono">
                ⚠ ЗАЩИТА: -{Math.round(combatState.enemyDefenseReduction * 100)}%
              </div>
            )}
            <div className="mt-1">
              <EnemyWeaknessDisplay />
            </div>
          </div>
          {combatState.comboCount > 0 && <ComboCounter count={combatState.comboCount} />}
        </div>
        <AnimatedHPBar current={enemy.hp} max={enemy.maxHp} label="ENEMY" isPlayer={false} />
        {enemyBuffs.length > 0 && (
          <div className="mt-2">
            <BuffDebuffBar buffs={enemyBuffs} label="ЭФФЕКТЫ ВРАГА" />
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}
