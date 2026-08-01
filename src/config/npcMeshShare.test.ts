import { describe, expect, it } from 'vitest';
import {
  NPC_MESH_FILE_SHARE,
  resolveNpcMeshFileBase,
  resolveNpcMeshPublicUrl,
} from './npcMeshShare';
import { resolveNpcModelUrl } from './npcModelRegistry';
import { ASSET_MANIFEST, getNpcManifestId } from './assetManifest';

describe('npcMeshShare', () => {
  it('maps known Quaternius twin NPCs to canonical file bases', () => {
    expect(resolveNpcMeshFileBase('viktor')).toBe('chk_based');
    expect(resolveNpcMeshFileBase('office_colleague')).toBe('chk_based');
    expect(resolveNpcMeshFileBase('boris')).toBe('zeka');
    expect(resolveNpcMeshFileBase('tamara')).toBe('anya');
    expect(resolveNpcMeshFileBase('grisha')).toBe('office_alexander');
    expect(resolveNpcMeshFileBase('kira')).toBe('chk_ritka');
    expect(resolveNpcMeshFileBase('chk_based')).toBe('chk_based');
  });

  it('resolves registry + manifest URLs to the canonical mesh file', () => {
    for (const [aliasId, fileBase] of Object.entries(NPC_MESH_FILE_SHARE)) {
      const expected = `/models/npcs/${fileBase}.glb`;
      expect(resolveNpcMeshPublicUrl(aliasId)).toBe(expected);
      expect(resolveNpcModelUrl(aliasId)).toBe(expected);

      const manifestId = getNpcManifestId(aliasId);
      expect(manifestId, aliasId).toBeTruthy();
      const lod0 = ASSET_MANIFEST[manifestId!]?.lods[0]?.url;
      expect(lod0, aliasId).toBe(expected);
    }
  });
});
