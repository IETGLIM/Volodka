import { describe, expect, it } from 'vitest';
import {
  MIXAMO_ANIMATION_CATALOG,
  getMixamoAnimationSpec,
  listMixamoClipIds,
  getMixamoClipAliasesByNpcState,
} from './mixamoAnimationCatalog';
import { MIXAMO_CLIP_IDS_ON_DISK } from './mixamoClipsOnDisk';

describe('mixamoAnimationCatalog', () => {
  it('lists six core locomotion/social/activity clips', () => {
    expect(listMixamoClipIds()).toEqual([
      'idle',
      'walking',
      'talking',
      'sitting',
      'sleeping',
      'working',
    ]);
    expect(MIXAMO_ANIMATION_CATALOG).toHaveLength(6);
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
    expect(byState.sit).toContain('working');
    expect(byState.talk).toContain('talking');
    expect(byState.gesture).toContain('talking');
    expect(byState.gesture).toContain('Gesture');
    expect(byState.idle).toContain('sleeping');
  });

  it('tracks on-disk clip ids after Quaternius extraction', () => {
    expect(MIXAMO_CLIP_IDS_ON_DISK.length).toBeGreaterThan(0);
  });
});
