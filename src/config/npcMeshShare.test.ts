import { describe, expect, it } from 'vitest';
import {
  NPC_UNIQUE_STAGED_RIG,
  resolveNpcMeshFileBase,
  resolveNpcMeshPublicUrl,
  resolveNpcUniqueStagedRigUrl,
} from './npcMeshShare';
import { resolveNpcModelUrl } from './npcModelRegistry';
import { ASSET_MANIFEST, getNpcManifestId } from './assetManifest';

describe('npcMeshShare unique staged rigs', () => {
  it('maps former twin aliases to exclusive _rigs meshes', () => {
    expect(resolveNpcUniqueStagedRigUrl('office_colleague')).toBe('/models/npcs/_rigs/male_01.glb');
    expect(resolveNpcUniqueStagedRigUrl('viktor')).toBe('/models/npcs/_rigs/male_02.glb');
    expect(resolveNpcUniqueStagedRigUrl('boris')).toBe('/models/npcs/_rigs/male_04.glb');
    expect(resolveNpcUniqueStagedRigUrl('grisha')).toBe('/models/npcs/_rigs/male_06.glb');
    expect(resolveNpcUniqueStagedRigUrl('kira')).toBe('/models/npcs/_rigs/female_01.glb');
    expect(resolveNpcUniqueStagedRigUrl('tamara')).toBe('/models/npcs/_rigs/female_02.glb');
  });

  it('gives each alias a distinct staged rig file', () => {
    const urls = Object.keys(NPC_UNIQUE_STAGED_RIG).map((id) => resolveNpcUniqueStagedRigUrl(id)!);
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('resolves registry + manifest URLs to the staged rig', () => {
    for (const aliasId of Object.keys(NPC_UNIQUE_STAGED_RIG)) {
      const expected = resolveNpcUniqueStagedRigUrl(aliasId)!;
      expect(resolveNpcMeshPublicUrl(aliasId)).toBe(expected);
      expect(resolveNpcModelUrl(aliasId)).toBe(expected);
      expect(resolveNpcMeshFileBase(aliasId).startsWith('_rigs/')).toBe(true);

      const manifestId = getNpcManifestId(aliasId);
      expect(manifestId, aliasId).toBeTruthy();
      const lod0 = ASSET_MANIFEST[manifestId!]?.lods[0]?.url;
      expect(lod0, aliasId).toBe(expected);
    }
  });
});
