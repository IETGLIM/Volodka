import { describe, expect, it } from 'vitest';
import * as THREE from 'three';
import {
  findNpcClipActionByName,
  resolveNpcClipAction,
} from './npcClipResolution';

function mockActions(names: string[]): Record<string, THREE.AnimationAction> {
  const mixer = new THREE.AnimationMixer(new THREE.Object3D());
  const record: Record<string, THREE.AnimationAction> = {};
  for (const name of names) {
    const clip = new THREE.AnimationClip(name, 1, []);
    record[name] = mixer.clipAction(clip);
  }
  return record;
}

describe('npcClipResolution', () => {
  it('resolves Quaternius PascalCase idle and walk clips', () => {
    const actions = mockActions(['Idle', 'Walk', 'Wave', 'Death']);
    expect(resolveNpcClipAction('idle', actions)?.getClip().name).toBe('Idle');
    expect(resolveNpcClipAction('walk', actions)?.getClip().name).toBe('Walk');
  });

  it('maps talk and sit to Quaternius Wave and Idle_Neutral', () => {
    const actions = mockActions(['Idle', 'Walk', 'Wave', 'Idle_Neutral']);
    expect(resolveNpcClipAction('talk', actions)?.getClip().name).toBe('Wave');
    expect(resolveNpcClipAction('sit', actions)?.getClip().name).toBe('Idle_Neutral');
  });

  it('matches definition overrides case-insensitively', () => {
    const actions = mockActions(['Idle', 'Walk', 'Wave']);
    const hit = resolveNpcClipAction('idle', actions, { idle: 'idle' });
    expect(hit?.getClip().name).toBe('Idle');
  });

  it('findNpcClipActionByName is case-insensitive', () => {
    const actions = mockActions(['Walk']);
    expect(findNpcClipActionByName(actions, 'walk')?.getClip().name).toBe('Walk');
  });

  it('falls back to idle for unknown non-idle states', () => {
    const actions = mockActions(['Idle']);
    expect(resolveNpcClipAction('gesture', actions)?.getClip().name).toBe('Idle');
  });
});
