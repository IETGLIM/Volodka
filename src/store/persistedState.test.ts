import { describe, expect, it } from 'vitest';
import { SAVE_VERSION } from '@/shared/validation/saveSchema';
import { createDefaultPersistedState, storePatchFromSave } from './persistedState';

function buildValidSavePayload() {
  return {
    saveVersion: SAVE_VERSION,
    savedAt: Date.now(),
    ...createDefaultPersistedState(),
  };
}

describe('storePatchFromSave closed-overlay hubs', () => {
  it.each(['cafe_explore_mode', 'home_evening_explore_mode'])(
    'forces overlay closed when resuming at closed-overlay hub %s',
    (hubId) => {
      const patch = storePatchFromSave({
        ...buildValidSavePayload(),
        currentNodeId: hubId,
        showStoryOverlay: true,
        narrativeKind: 'story',
      });
      expect(patch.showStoryOverlay).toBe(false);
      expect(patch.narrativeKind).toBeNull();
      expect(patch.currentNodeId).toBe(hubId);
    },
  );

  it('preserves overlay state for open-overlay hub nodes', () => {
    const patch = storePatchFromSave({
      ...buildValidSavePayload(),
      currentNodeId: 'park_explore_mode',
      showStoryOverlay: true,
      narrativeKind: 'story',
    });
    expect(patch.showStoryOverlay).toBe(true);
    expect(patch.narrativeKind).toBe('story');
  });
});
