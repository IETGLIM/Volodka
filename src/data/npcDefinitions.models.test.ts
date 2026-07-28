import { describe, expect, it } from 'vitest';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import {
  NPC_PROCEDURAL_MODEL_PLACEHOLDER,
  resolveNpcModelUrl,
  resolveNpcVisualModelUrl,
  isRpmNpcOnDisk,
} from '@/config/npcModelRegistry';
import { QUALITY_PRESETS } from '@/engine/graphics/qualityPresets';
describe('npcDefinitions model paths', () => {
  it('resolves shipped GLB paths for story NPCs with explicit models', () => {
    const withGlb = ALL_NPC_DEFINITIONS.filter(
      (npc) => npc.modelPath && npc.modelPath !== NPC_PROCEDURAL_MODEL_PLACEHOLDER,
    );
    expect(withGlb.length).toBeGreaterThan(0);
    for (const npc of withGlb) {
      const resolved = resolveNpcModelUrl(npc.id, npc.modelPath);
      if (resolved) {
        expect(resolved, npc.id).toBe(npc.modelPath);
      } else if (isRpmNpcOnDisk(npc.id)) {
        expect(resolved, npc.id).toBe(npc.modelPath);
      }
      // Pending RPM imports use procedural fallback at runtime until on disk.
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

  it('renders albert with shipped GLB now that unique model is available', () => {
    const albert = ALL_NPC_DEFINITIONS.find((npc) => npc.id === 'albert');
    expect(albert?.modelPath).toMatch(/\.glb$/);
    expect(resolveNpcModelUrl('albert', albert?.modelPath)).toBeTruthy();
    expect(resolveNpcVisualModelUrl('albert', albert?.modelPath, QUALITY_PRESETS.ultra.npcRenderMode)).toBe(albert?.modelPath);
  });
});
