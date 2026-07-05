import { useEffect, useRef, useState } from 'react';

/** Poem ids added since the previous collectedPoems snapshot — for one-shot list enter animations. */
export function useNewlyCollectedPoemIds(collectedPoems: readonly string[]): ReadonlySet<string> {
  const prevRef = useRef<ReadonlySet<string>>(new Set(collectedPoems));
  const [newlyCollected, setNewlyCollected] = useState<ReadonlySet<string>>(() => new Set());

  useEffect(() => {
    const prev = prevRef.current;
    const added = collectedPoems.filter((id) => !prev.has(id));
    prevRef.current = new Set(collectedPoems);

    if (added.length === 0) return;

    setNewlyCollected(new Set(added));
    const timer = setTimeout(() => setNewlyCollected(new Set()), 400);
    return () => clearTimeout(timer);
  }, [collectedPoems]);

  return newlyCollected;
}
