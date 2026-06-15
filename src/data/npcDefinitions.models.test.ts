import { describe, expect, it } from 'vitest';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { NPC_PROCEDURAL_MODEL_PLACEHOLDER } from '@/config/npcModelRegistry';
import { resolveNpcModelUrl } from '@/config/npcModelRegistry';

describe('npcDefinitions model paths', () => {
  it('resolves shipped GLB paths for story NPCs with explicit models', () => {
    const withGlb = ALL_NPC_DEFINITIONS.filter(
      (npc) => npc.modelPath && npc.modelPath !== NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    );
    expect(withGlb.length).toBeGreaterThan(0);
    for (const npc of withGlb) {
      expect(resolveNpcModelUrl(npc.id, npc.modelPath), npc.id).toBe(npc.modelPath);
    }
  });

  it('falls back to procedural silhouettes when no GLB is shipped', () => {
    const procedural = ALL_NPC_DEFINITIONS.filter(
      (npc) => npc.modelPath === NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    );
    expect(procedural.length).toBeGreaterThan(0);
    for (const npc of procedural) {
      expect(resolveNpcModelUrl(npc.id, npc.modelPath)).toBeUndefined();
    }
  });
});
