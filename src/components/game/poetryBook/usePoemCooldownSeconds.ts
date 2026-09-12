import { useEffect, useMemo, useState } from 'react';
import { getCooldownRemaining } from '@/engine/PoemPowerSystem';
import { useUiTick } from '@/hooks/useUiTick';

/* FIX (perf v4.23, этап 91): был собственный setInterval(500мс) на каждого
 * потребителя. Теперь общий UI-clock (useUiTick): один интервал на ВСЕХ
 * подписчиков частоты 500мс, гасится, когда подписчиков не остаётся. */
export function usePoemCooldownSeconds(poemId: string | null, active: boolean): number {
  const tick = useUiTick(poemId && active ? 500 : 0);

  return useMemo(() => {
    if (!poemId || !active) return 0;
    return Math.ceil(getCooldownRemaining(poemId) / 1000);
    // tick — не данные, а сигнал общего тика: перезапускает расчёт отсчёта.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poemId, active, tick]);
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
