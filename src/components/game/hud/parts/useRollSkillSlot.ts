/* ─── Volodka RPG – Roll Skill Slot (v4.55.0) ───
 * P1 судьи (раунд 2): индикатор кулдауна кувырка в SkillRechargeHUD.
 *
 * Кувырок живёт в module-state движка (engine/player/playerRoll.ts) и в
 * zustand не попадает — поэтому слот строится здесь, в компонентном слое
 * (правило «Store не импортирует Engine» соблюдено: engine-импорты живут
 * в components/). Слушаем 'player:roll', на время кулдауна крутим rAF-тик,
 * вне кулдауна лупа нет вообще: ноль ре-рендеров, ноль таймеров.
 */

import { useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getRollCooldown } from '@/engine/player/playerRoll';
import { ROLL_COOLDOWN } from '@/engine/player/playerConstants';
import type { SkillSlot } from './SkillRechargeHUD';

const ROLL_ICON = '🌀';
const ROLL_NAME = 'Кувырок';

/** SkillSlot | null — не null только пока тикает кулдаун кувырка. */
export function useRollSkillSlot(): SkillSlot | null {
  const [, setTick] = useState(0);

  useEffect(() => {
    let raf: number | undefined;
    const stop = () => {
      if (raf !== undefined) {
        cancelAnimationFrame(raf);
        raf = undefined;
      }
    };
    const loop = () => {
      setTick((t) => t + 1);
      if (getRollCooldown() > 0) {
        raf = requestAnimationFrame(loop);
      } else {
        raf = undefined;
      }
    };
    const onRoll = () => {
      stop();
      // Кулдаун ставится ПОСЛЕ окончания самого кувырка (ROLL_DURATION),
      // поэтому первым кадром он ещё 0 — держим луп, пока не появится и истечёт.
      raf = requestAnimationFrame(loop);
    };
    eventBus.on('player:roll', onRoll);
    return () => {
      eventBus.off('player:roll', onRoll);
      stop();
    };
  }, []);

  const cooldownMs = getRollCooldown() * 1000;
  if (cooldownMs <= 0) return null;
  return {
    id: 'skill-roll',
    name: ROLL_NAME,
    icon: ROLL_ICON,
    keyBinding: 'Q',
    cooldownRemaining: cooldownMs,
    totalCooldown: ROLL_COOLDOWN * 1000,
    isReady: false,
    isActive: false,
  };
}
