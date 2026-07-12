import { describe, expect, it } from 'vitest';
import { ASSET_MANIFEST, isAssetEffectiveShipped } from '@/config/assetManifest';
import { ASSET_DISK_SHIPPED } from '@/config/assetManifestShipped.generated';

describe('assetManifest effective shipped', () => {
  it('returns false for unknown assets', () => {
    expect(isAssetEffectiveShipped('not_a_real_asset')).toBe(false);
  });

  it('returns false for manifest entries not marked shipped', () => {
    const unshippedId = Object.entries(ASSET_MANIFEST).find(([, asset]) => asset.shipped !== true)?.[0];
    if (!unshippedId) return;
    expect(isAssetEffectiveShipped(unshippedId)).toBe(false);
  });

  it('respects ASSET_DISK_SHIPPED when a flag is present', () => {
    const flaggedId = Object.keys(ASSET_DISK_SHIPPED).find(
      (id) => ASSET_MANIFEST[id]?.shipped === true,
    );
    if (!flaggedId) return;
    expect(isAssetEffectiveShipped(flaggedId)).toBe(ASSET_DISK_SHIPPED[flaggedId] === true);
  });

  it('treats missing disk flags as shipped for backward compatibility', () => {
    const shippedId = Object.entries(ASSET_MANIFEST).find(([, asset]) => asset.shipped === true)?.[0];
    if (!shippedId || shippedId in ASSET_DISK_SHIPPED) return;
    expect(isAssetEffectiveShipped(shippedId)).toBe(true);
  });
});
