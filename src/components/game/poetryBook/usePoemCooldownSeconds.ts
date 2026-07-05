import { useEffect, useState } from 'react';
import { getCooldownRemaining } from '@/engine/PoemPowerSystem';

export function usePoemCooldownSeconds(poemId: string | null, active: boolean): number {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    if (!poemId || !active) {
      setSeconds(0);
      return;
    }

    const tick = () => {
      setSeconds(Math.ceil(getCooldownRemaining(poemId) / 1000));
    };

    tick();
    const interval = setInterval(tick, 500);
    return () => clearInterval(interval);
  }, [poemId, active]);

  return seconds;
}

/** Refreshes once per second only while any listed poem is on cooldown. */
export function usePoemPowersCooldownRefresh(poemIds: readonly string[]): number {
  const [tick, setTick] = useState(0);
  const poemKey = poemIds.join('|');

  useEffect(() => {
    if (poemIds.length === 0) return;

    const hasCooldown = () => poemIds.some((id) => getCooldownRemaining(id) > 0);
    if (!hasCooldown()) return;

    const interval = setInterval(() => {
      if (!hasCooldown()) {
        clearInterval(interval);
        return;
      }
      setTick((value) => value + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [poemKey, poemIds]);

  return tick;
}
