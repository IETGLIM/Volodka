import { describe, expect, it } from 'vitest';
import { getAssetLod0Url } from '@/config/assetManifest';
import { getDefaultPlayerModelPath, MODEL_URLS } from '@/config/modelUrls';
import {
  getPlayerVolodkaManifestUrls,
  getPlayerVolodkaModelUrl,
  PLAYER_VOLODKA_MANIFEST_ID,
} from '@/config/playerModelUrl';
import { getRpmNpcByRegistryId, RPM_HERO_LOD_URLS } from '@/config/rpmNpcCatalog';
import { QUATERNIUS_RIG_FALLBACK_URLS } from '@/config/quaterniusRigCatalog';

describe('player model single source of truth', () => {
  const manifestUrl = getAssetLod0Url(PLAYER_VOLODKA_MANIFEST_ID);

  it('playerModelUrl reads ASSET_MANIFEST LOD0', () => {
    expect(manifestUrl).toBeTruthy();
    expect(getPlayerVolodkaModelUrl()).toBe(manifestUrl);
  });

  it('modelUrls facade agrees with playerModelUrl', () => {
    expect(getDefaultPlayerModelPath()).toBe(getPlayerVolodkaModelUrl());
    expect(MODEL_URLS.volodka).toBe(getPlayerVolodkaModelUrl());
  });

  it('RPM hero + Quaternius male_01 use the same manifest URL', () => {
    expect(getRpmNpcByRegistryId('player_volodka')?.publicUrl).toBe(getPlayerVolodkaModelUrl());
    expect(QUATERNIUS_RIG_FALLBACK_URLS.male_01).toBe(getPlayerVolodkaModelUrl());
  });

  it('RPM hero LOD list is subset of / derived from manifest', () => {
    const manifestUrls = new Set(getPlayerVolodkaManifestUrls());
    for (const url of RPM_HERO_LOD_URLS) {
      expect(manifestUrls.has(url)).toBe(true);
    }
  });
});
