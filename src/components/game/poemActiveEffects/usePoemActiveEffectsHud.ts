import { useEffect, useMemo, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { listLivePoemTTLDisplayEntries } from '@/engine/poemEffects/poemTTLRuntime';
import type { LivePoemTTLDisplayEntry } from '@/engine/poemEffects/poemTTLRuntime';
import { ttlNow } from '@/shared/ttlClock';

const TICK_MS = 250;

export function usePoemActiveEffectsHud(): LivePoemTTLDisplayEntry[] {
  const activeTTLFlags = useGameStore((s) => s.activeTTLFlags);
  const flagCount = Object.keys(activeTTLFlags ?? {}).length;
  const [now, setNow] = useState(() => ttlNow());

  useEffect(() => {
    if (flagCount === 0) return undefined;
    setNow(ttlNow());
    const id = window.setInterval(() => setNow(ttlNow()), TICK_MS);
    return () => window.clearInterval(id);
  }, [flagCount]);

  return useMemo(
    () => listLivePoemTTLDisplayEntries(activeTTLFlags, now),
    [activeTTLFlags, now],
  );
}
