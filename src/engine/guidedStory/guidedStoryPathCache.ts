import type { GuidedStoryPathConfig } from '@/engine/guidedStory/guidedStoryTypes';

/** Isolated cache — imported without gameDataLoader to avoid circular-init TDZ. */
export const guidedPathCache: { current: GuidedStoryPathConfig | null } = { current: null };

export function invalidateGuidedStoryPathConfig(): void {
  guidedPathCache.current = null;
}
