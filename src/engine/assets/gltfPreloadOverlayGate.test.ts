import { describe, expect, it } from 'vitest';
import {
  isUiOverlayBlockingDeferredAssets,
  resetGltfPreloadOverlayGateForTests,
  setExamineOverlayAssetGate,
  setStoryOverlayAssetGate,
} from './gltfPreloadOverlayGate';

describe('gltfPreloadOverlayGate', () => {
  it('blocks deferred asset work while examine or story overlays are open', () => {
    resetGltfPreloadOverlayGateForTests();
    expect(isUiOverlayBlockingDeferredAssets()).toBe(false);

    setExamineOverlayAssetGate(true);
    expect(isUiOverlayBlockingDeferredAssets()).toBe(true);

    setExamineOverlayAssetGate(false);
    setStoryOverlayAssetGate(true);
    expect(isUiOverlayBlockingDeferredAssets()).toBe(true);

    setStoryOverlayAssetGate(false);
    expect(isUiOverlayBlockingDeferredAssets()).toBe(false);
  });
});
