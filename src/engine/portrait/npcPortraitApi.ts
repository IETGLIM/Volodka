import type { ColorBlindMode } from '@/engine/accessibility/accessibilityTypes';
import {
  getCachedNpcPortrait,
  renderNpcPortraitSync,
  setCachedNpcPortrait,
} from '@/engine/portrait/npcPortraitGeneration';
import {
  adaptPortraitAppearance,
  buildPortraitCacheKey,
  getPortraitInitial,
  resolveNpcAppearance,
} from '@/engine/portrait/npcPortraitPresentation';
import type { NPCAppearance } from '@/shared/types/game';

/** Synchronous portrait URL for legacy callers — prefers cache, falls back to data URL. */
export function getNpcPortraitDataUrl(
  npcId: string,
  name: string,
  appearance?: NPCAppearance,
  colorBlindMode: ColorBlindMode = 'none',
): string | null {
  const resolved = adaptPortraitAppearance(resolveNpcAppearance(npcId, appearance), colorBlindMode);
  const cacheKey = buildPortraitCacheKey(npcId, name, resolved, colorBlindMode);
  const cached = getCachedNpcPortrait(cacheKey);
  if (cached) return cached;

  const dataUrl = renderNpcPortraitSync(npcId, getPortraitInitial(name), resolved);
  if (dataUrl) setCachedNpcPortrait(cacheKey, dataUrl);
  return dataUrl;
}
