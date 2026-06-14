import { eventBus } from '@/engine/EventBus';
import { NPC_PORTRAIT_CACHE_MAX } from '@/engine/portrait/npcPortraitConstants';
import { NPC_PORTRAIT_SIZE } from '@/engine/portrait/npcPortraitConstants';
import {
  createPortraitCanvas,
  exportPortraitCanvas,
  exportPortraitCanvasSyncDataUrl,
  renderNoirTerminalPortrait,
} from '@/engine/portrait/noirTerminalPortraitRenderer';
import { revokePortraitUrl } from '@/engine/portrait/npcPortraitPresentation';
import type { NPCAppearance } from '@/shared/types/game';
import { LRUCache } from '@/shared/utils/LRUCache';

const portraitCache = new LRUCache<string, string>(NPC_PORTRAIT_CACHE_MAX);
let lifecycleBound = false;

function evictPortraitUrl(url: string): void {
  revokePortraitUrl(url);
}

export function getCachedNpcPortrait(cacheKey: string): string | undefined {
  return portraitCache.get(cacheKey);
}

export function setCachedNpcPortrait(cacheKey: string, url: string): void {
  portraitCache.set(cacheKey, url, evictPortraitUrl);
}

export function clearNpcPortraitCache(): void {
  portraitCache.clear(evictPortraitUrl);
}

export function ensureNpcPortraitCacheLifecycle(): void {
  if (lifecycleBound) return;
  lifecycleBound = true;
  eventBus.on('scene:enter', () => {
    clearNpcPortraitCache();
  });
}

export function renderNpcPortraitSync(
  npcId: string,
  initial: string,
  appearance: NPCAppearance,
): string | null {
  if (typeof document === 'undefined') return null;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = NPC_PORTRAIT_SIZE;
    canvas.height = NPC_PORTRAIT_SIZE;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    renderNoirTerminalPortrait(ctx, npcId, initial, appearance);
    return exportPortraitCanvasSyncDataUrl(canvas);
  } catch {
    return null;
  }
}

export function renderNpcPortraitAsync(
  npcId: string,
  initial: string,
  appearance: NPCAppearance,
): Promise<string | null> {
  return new Promise((resolve) => {
    const run = () => {
      try {
        const canvas = createPortraitCanvas();
        if (!canvas) {
          resolve(null);
          return;
        }
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(null);
          return;
        }
        renderNoirTerminalPortrait(ctx, npcId, initial, appearance);
        void exportPortraitCanvas(canvas)
          .then(resolve)
          .catch(() => resolve(null));
      } catch {
        resolve(null);
      }
    };

    if (typeof requestIdleCallback !== 'undefined') {
      requestIdleCallback(run, { timeout: 48 });
    } else {
      setTimeout(run, 0);
    }
  });
}

/** Test-only access to cache size. */
export function getNpcPortraitCacheSizeForTests(): number {
  return portraitCache.size;
}

/** Test-only reset. */
export function resetNpcPortraitCacheForTests(): void {
  clearNpcPortraitCache();
  lifecycleBound = false;
}
