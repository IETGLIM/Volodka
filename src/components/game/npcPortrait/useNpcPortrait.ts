import { useEffect, useMemo, useState } from 'react';
import type { ColorBlindMode } from '@/engine/accessibility/accessibilityTypes';
import {
  ensureNpcPortraitCacheLifecycle,
  getCachedNpcPortrait,
  renderNpcPortraitAsync,
  setCachedNpcPortrait,
} from '@/engine/portrait/npcPortraitGeneration';
import {
  adaptPortraitAppearance,
  buildPortraitCacheKey,
  getPortraitInitial,
  resolveNpcAppearance,
} from '@/engine/portrait/npcPortraitPresentation';
import type { NPCAppearance } from '@/shared/types/game';

type UseNpcPortraitArgs = {
  npcId: string;
  name: string;
  appearance?: NPCAppearance;
  colorBlindMode: ColorBlindMode;
};

export function useNpcPortrait({
  npcId,
  name,
  appearance,
  colorBlindMode,
}: UseNpcPortraitArgs) {
  const initial = getPortraitInitial(name);
  const resolved = useMemo(
    () => adaptPortraitAppearance(resolveNpcAppearance(npcId, appearance), colorBlindMode),
    [npcId, appearance, colorBlindMode],
  );
  const cacheKey = useMemo(
    () => buildPortraitCacheKey(npcId, name, resolved, colorBlindMode),
    [npcId, name, resolved, colorBlindMode],
  );

  const [imageUrl, setImageUrl] = useState<string | null>(() => getCachedNpcPortrait(cacheKey) ?? null);

  useEffect(() => {
    ensureNpcPortraitCacheLifecycle();

    const cached = getCachedNpcPortrait(cacheKey);
    if (cached) {
      setImageUrl(cached);
      return;
    }

    let cancelled = false;
    void renderNpcPortraitAsync(npcId, initial, resolved).then((url) => {
      if (cancelled || !url) return;
      setCachedNpcPortrait(cacheKey, url);
      setImageUrl(url);
    });

    return () => {
      cancelled = true;
    };
  }, [cacheKey, npcId, initial, resolved]);

  return {
    imageUrl,
    initial,
    resolved,
  };
}
