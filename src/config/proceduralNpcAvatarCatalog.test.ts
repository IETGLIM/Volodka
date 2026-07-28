import { describe, expect, it } from 'vitest';
import { RPM_NPC_CATALOG } from '@/config/rpmNpcCatalog';
import {
  getProceduralNpcAvatar,
  listProceduralNpcAvatarIds,
  PROCEDURAL_NPC_AVATAR_CATALOG,
} from '@/config/proceduralNpcAvatarCatalog';

describe('proceduralNpcAvatarCatalog', () => {
  it('covers every legacy RPM story slot (except hero player mesh)', () => {
    const catalogNpcIds = new Set(
      PROCEDURAL_NPC_AVATAR_CATALOG
        .filter((e) => e.tier !== 'hero')
        .map((e) => e.npcId),
    );
    for (const rpm of RPM_NPC_CATALOG) {
      if (rpm.wire.kind === 'hero') continue;
      expect(catalogNpcIds.has(rpm.npcId), rpm.npcId).toBe(true);
    }
  });

  it('maps P0 cast to dedicated procedural models', () => {
    expect(getProceduralNpcAvatar('zarema')?.modelKey).toBe('zarema');
    expect(getProceduralNpcAvatar('albert')?.modelKey).toBe('albert');
  });

  it('P0 cast still has procedural avatar catalog entries', () => {
    // Even if NPCs now have GLBs, their procedural catalog entries remain
    // for fallback / low-end rendering.
    for (const id of ['albert', 'zarema', 'baba_zina']) {
      expect(getProceduralNpcAvatar(id), id).toBeDefined();
    }
  });

  it('lists unique npc ids', () => {
    const ids = listProceduralNpcAvatarIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
});
