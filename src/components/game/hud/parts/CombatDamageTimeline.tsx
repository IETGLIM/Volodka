import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { subscribeToCombat } from '@/engine/CombatSystem';
import type { CombatState } from '@/shared/types/game';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

interface DamageBar {
  turn: number;
  playerDmg: number;
  enemyDmg: number;
}

const MAX_TURNS = 12;
const BAR_WIDTH = 6;
const BAR_GAP = 3;
const MAX_BAR_HEIGHT = 28;
const CENTER_Y = 32;
const SVG_WIDTH = MAX_TURNS * (BAR_WIDTH + BAR_GAP);
const SVG_HEIGHT = CENTER_Y * 2 + 8;

export function CombatDamageTimeline() {
  const [combatState, setCombatState] = useState<CombatState | null>(null);
  const reducedMotion = useEffectiveReducedMotion();

  useEffect(() => {
    const unsub = subscribeToCombat(setCombatState);
    return unsub;
  }, []);

  const bars = useMemo((): DamageBar[] => {
    if (!combatState?.log) return [];
    const byTurn = new Map<number, { playerDmg: number; enemyDmg: number }>();

    for (const entry of combatState.log) {
      if (!entry.damage || entry.damage <= 0) continue;
      const existing = byTurn.get(entry.turn) || { playerDmg: 0, enemyDmg: 0 };
      if (entry.type === 'player_attack' || entry.type === 'combo_hit' || entry.type === 'critical_hit' || entry.type === 'poem_combo') {
        existing.playerDmg += entry.damage;
      } else if (entry.type === 'enemy_attack' || entry.type === 'enemy_special') {
        existing.enemyDmg += entry.damage;
      }
      byTurn.set(entry.turn, existing);
    }

    const all = Array.from(byTurn.entries())
      .map(([turn, data]) => ({ turn, ...data }))
      .sort((a, b) => a.turn - b.turn);

    return all.slice(-MAX_TURNS);
  }, [combatState?.log]);

  const maxDmg = useMemo(() => {
    let max = 1;
    for (const bar of bars) {
      max = Math.max(max, bar.playerDmg, bar.enemyDmg);
    }
    return max;
  }, [bars]);

  if (bars.length < 2) return null;

  return (
    <div className="combat-damage-timeline flex flex-col items-center gap-1">
      <div className="text-[7px] text-slate-500 font-mono uppercase tracking-widest">УРОН</div>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        className="w-full max-w-[200px]"
        style={{ overflow: 'visible' }}
      >
        {/* Center line */}
        <line x1={0} y1={CENTER_Y} x2={SVG_WIDTH} y2={CENTER_Y} stroke="rgba(148,163,184,0.15)" strokeWidth={0.5} />

        {bars.map((bar, i) => {
          const x = i * (BAR_WIDTH + BAR_GAP);
          const pH = (bar.playerDmg / maxDmg) * MAX_BAR_HEIGHT;
          const eH = (bar.enemyDmg / maxDmg) * MAX_BAR_HEIGHT;

          return (
            <g key={bar.turn}>
              {/* Player damage bar (upward, cyan) */}
              {bar.playerDmg > 0 && (
                <motion.rect
                  x={x}
                  y={CENTER_Y - pH}
                  width={BAR_WIDTH}
                  height={pH}
                  fill="rgba(6,182,212,0.6)"
                  rx={1}
                  initial={reducedMotion ? undefined : { height: 0, y: CENTER_Y }}
                  animate={{ height: pH, y: CENTER_Y - pH }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {/* Enemy damage bar (downward, red) */}
              {bar.enemyDmg > 0 && (
                <motion.rect
                  x={x}
                  y={CENTER_Y}
                  width={BAR_WIDTH}
                  height={eH}
                  fill="rgba(239,68,68,0.6)"
                  rx={1}
                  initial={reducedMotion ? undefined : { height: 0 }}
                  animate={{ height: eH }}
                  transition={{ duration: 0.3 }}
                />
              )}
              {/* Turn label */}
              <text
                x={x + BAR_WIDTH / 2}
                y={SVG_HEIGHT - 1}
                textAnchor="middle"
                className="text-[5px] fill-slate-600 font-mono"
              >
                {bar.turn}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}