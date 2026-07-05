import { describe, expect, it } from 'vitest';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { RPM_NPC_CATALOG } from '@/config/rpmNpcCatalog';
import {
  getProceduralNpcAvatar,
  listProceduralNpcAvatarIds,
  PROCEDURAL_NPC_AVATAR_CATALOG,
} from '@/config/proceduralNpcAvatarCatalog';
import { resolveNpcVisualModelUrl } from '@/config/npcModelRegistry';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';

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

  it('story NPCs with GLB paths still render procedurally in-world', () => {
    const p0 = ALL_NPC_DEFINITIONS.filter((npc) => ['zarema', 'albert', 'baba_zina', 'chk_ritka'].includes(npc.id));
    for (const npc of p0) {
      expect(
        resolveNpcVisualModelUrl(npc.id, npc.modelPath, QUALITY_PRESETS.ultra.npcRenderMode),
        npc.id,
      ).toBeUndefined();
    }
  });

  it('lists unique npc ids', () => {
    const ids = listProceduralNpcAvatarIds();
    expect(new Set(ids).size).toBe(ids.length);
  });
});
