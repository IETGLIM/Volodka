import { describe, expect, it } from 'vitest';

import { SCENE_CONFIG, type InteractiveObjectConfig } from '@/config/scenes';

import { getPropDefinition, PROP_DEFINITIONS } from './propsManifest';

describe('propsManifest coverage', () => {
  it('every propId on interactive objects resolves to a manifest entry', () => {
    for (const scene of Object.values(SCENE_CONFIG)) {
      for (const obj of scene.interactiveObjects ?? []) {
        const o = obj as InteractiveObjectConfig;
        if (!o.propId) continue;
        const def = getPropDefinition(o.propId);
        expect(def, `scene ${scene.id} object ${o.id} propId=${o.propId}`).toBeDefined();
        expect(def!.id).toBe(o.propId);
      }
    }
  });

  it('manifest keys match definition.id', () => {
    for (const [key, def] of Object.entries(PROP_DEFINITIONS)) {
      expect(key).toBe(def.id);
    }
  });
});
