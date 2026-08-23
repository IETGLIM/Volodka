import { motion, AnimatePresence } from 'framer-motion';
import { EnemyWeaknessDisplay } from '@/components/game/hud/parts/EnemyWeaknessDisplay';
import { BuffDebuffBar } from '@/components/game/combatUi/CombatStatusBadges';
import { AnimatedHPBar } from '@/components/game/combatUi/CombatHpBars';
import { ComboCounter } from '@/components/game/combatUi/CombatDamageFx';
import { EnemyPortrait } from '@/components/game/combatUi/CombatEnemyPortrait';
import type { CombatBuff, CombatState } from '@/shared/types/game';
import { getEnemyWeaknesses } from '@/engine/combat/combatAffinities';

/* ── Telegraph indicator (Task 3.3-b1, стилизован в v4.7.1) ──
 * Shown while the enemy is CHARGING a special attack (chargingSpecial).
 * The special fires guaranteed next turn — defending during the charge
 * window cuts its damage hard (extra ×0.4).
 *
 * Подача: двухслойный «заряжающийся» индикатор — пульсирующая рамка
 * опасности + полоса зарядки с бегущим бликом; иконка ⚡ в пульсирующем
 * кольце. Подсказка о контр-окне видна и на мобильных (короткая форма). */
function TelegraphIndicator({ name }: { name: string }) {
  return (
    <motion.div
      className="relative mt-1 overflow-hidden rounded border border-rose-500/70 bg-gradient-to-r from-rose-950/80 via-rose-900/50 to-rose-950/80 px-2 py-1"
      style={{ boxShadow: '0 0 14px rgba(244,63,94,0.35), inset 0 0 10px rgba(244,63,94,0.12)' }}
      initial={{ opacity: 0, y: -6, scaleX: 0.9 }}
      animate={{ opacity: [0.8, 1, 0.8], y: 0, scaleX: 1 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{
        opacity: { duration: 0.9, repeat: Infinity, ease: 'easeInOut' },
        y: { duration: 0.25, ease: 'easeOut' },
        scaleX: { duration: 0.3, ease: 'easeOut' },
      }}
      role="status"
      aria-live="polite"
      aria-label={`Враг готовит атаку: ${name}`}
    >
      {/* Полоса зарядки: бегущий блик слева направо — «накопление» атаки. */}
      <motion.div
        className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-rose-400/25 to-transparent"
        initial={{ x: '-120%' }}
        animate={{ x: '420%' }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        aria-hidden="true"
      />
      <div className="relative flex items-center gap-1.5">
        {/* Иконка в пульсирующем кольце. */}
        <motion.span
          className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-rose-400/70 bg-rose-950/90"
          animate={{ boxShadow: ['0 0 4px rgba(251,113,133,0.4)', '0 0 10px rgba(251,113,133,0.9)', '0 0 4px rgba(251,113,133,0.4)'] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut' }}
          aria-hidden="true"
        >
          <span className="text-[9px] leading-none">⚡</span>
        </motion.span>
        <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-rose-200 truncate drop-shadow-[0_0_6px_rgba(244,63,94,0.6)]">
          Готовит: {name}!
        </span>
        <span className="ml-auto whitespace-nowrap font-mono text-[9px] text-rose-300/90">
          <span className="hidden sm:inline">🛡 Защита ослабит удар</span>
          <span className="sm:hidden">🛡 Защитись!</span>
        </span>
      </div>
      {/* Тонкая нижняя линия «до удара» — доля заполнения растёт к удару. */}
      <motion.div
        className="absolute bottom-0 left-0 h-[2px] rounded-full bg-rose-400/80"
        style={{ boxShadow: '0 0 6px rgba(251,113,133,0.8)' }}
        initial={{ width: '12%' }}
        animate={{ width: ['12%', '100%'] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeIn' }}
        aria-hidden="true"
      />
    </motion.div>
  );
}

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

  // Determine strongest weakness channel for affinity border indicator
  const weaknesses = getEnemyWeaknesses(enemy.type);
  const primaryWeakness = weaknesses[0];
  const enemyAffinityClass = primaryWeakness
    ? `combat-enemy-affinity-${primaryWeakness.channel}`
    : '';

  return (
    <motion.div
      className="pointer-events-auto pt-3 px-3"
      initial={{ y: -40, opacity: 0 }}
      animate={{ y: introVisible ? -20 : 0, opacity: introVisible ? 0.35 : 1 }}
      transition={{ delay: introVisible ? 0 : 0.35, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      <motion.div
        className={`glass-panel-dark bg-black/60 backdrop-blur-sm border border-red-900/30 rounded-lg p-3 scan-line combat-enemy-card ${enemyAffinityClass}`}
        style={{ boxShadow: '0 0 20px rgba(239,68,68,0.1)' }}
      >
        <div className="flex items-center gap-3 mb-2">
          <EnemyPortrait emoji={enemy.emoji} hp={enemy.hp} maxHp={enemy.maxHp} />
          <div className="flex-1">
            <div className="text-sm text-red-300 font-mono font-semibold">{enemy.name}</div>
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
        {/* Telegraph: enemy is charging a special — counter-window cue */}
        <AnimatePresence>
          {enemy.chargingSpecial && (
            <TelegraphIndicator key={enemy.chargingSpecial.attackId} name={enemy.chargingSpecial.name} />
          )}
        </AnimatePresence>
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
