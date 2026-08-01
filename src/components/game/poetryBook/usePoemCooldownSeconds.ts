import { useEffect, useState } from 'react';
import { getCooldownRemaining } from '@/engine/PoemPowerSystem';
import { useGameStore } from '@/store/gameStore';

export function usePoemCooldownSeconds(poemId: string | null, active: boolean): number {
  const [seconds, setSeconds] = useState(0);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);

  useEffect(() => {
    if (!poemId || !active) {
      setSeconds(0);
      return;
    }
    setSeconds(Math.ceil(getCooldownRemaining(poemId) / 1000));
  }, [poemId, active, timeOfDay]);

  return seconds;
}

/** Refreshes tick while any listed poem is on cooldown, driven by game time changes. */
export function usePoemPowersCooldownRefresh(poemIds: readonly string[]): number {
  const [tick, setTick] = useState(0);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const poemKey = poemIds.join('|');

  useEffect(() => {
    if (poemIds.length === 0) return;
    const hasCooldown = poemIds.some((id) => getCooldownRemaining(id) > 0);
    if (!hasCooldown) return;
    setTick((v) => v + 1);
  }, [poemKey, poemIds, timeOfDay]);

  return tick;
}
