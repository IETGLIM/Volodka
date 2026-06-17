import { describe, expect, it } from 'vitest';
import {
  MIXAMO_ANIMATION_CATALOG,
  getMixamoAnimationSpec,
  listMixamoClipIds,
  getMixamoClipAliasesByNpcState,
} from './mixamoAnimationCatalog';
import { MIXAMO_CLIP_IDS_ON_DISK } from './mixamoClipsOnDisk';

describe('mixamoAnimationCatalog', () => {
  it('lists four core locomotion/social clips', () => {
    expect(listMixamoClipIds()).toEqual(['idle', 'walking', 'talking', 'sitting']);
    expect(MIXAMO_ANIMATION_CATALOG).toHaveLength(4);
  });

  it('resolves specs by clip id', () => {
    const idle = getMixamoAnimationSpec('idle');
    expect(idle?.publicUrl).toBe('/models/animations/idle.glb');
    expect(idle?.npcState).toBe('idle');
    expect(getMixamoAnimationSpec('missing')).toBeUndefined();
  });

  it('maps clip aliases to npc animation states', () => {
    const byState = getMixamoClipAliasesByNpcState();
    expect(byState.walk).toContain('walking');
    expect(byState.sit).toContain('sitting');
    expect(byState.talk).toContain('talking');
  });

  it('starts with no on-disk clips until import', () => {
    expect(MIXAMO_CLIP_IDS_ON_DISK).toEqual([]);
  });
});
