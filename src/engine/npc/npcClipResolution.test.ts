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

  it('maps talk and sit to Quaternius Wave and Interact', () => {
    const actions = mockActions(['Idle', 'Walk', 'Wave', 'Interact', 'Idle_Neutral']);
    expect(resolveNpcClipAction('talk', actions)?.getClip().name).toBe('Wave');
    expect(resolveNpcClipAction('sit', actions)?.getClip().name).toBe('Interact');
  });

  it('honors activity clip overrides for shipped Mixamo canonical names', () => {
    const actions = mockActions(['idle', 'sitting', 'working', 'sleeping']);
    expect(resolveNpcClipAction('sit', actions, { sit: 'working' })?.getClip().name).toBe('working');
    expect(resolveNpcClipAction('sit', actions, { sit: 'sitting' })?.getClip().name).toBe('sitting');
    expect(resolveNpcClipAction('idle', actions, { idle: 'sleeping' })?.getClip().name).toBe('sleeping');
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

  it('resolves gesture via shipped talking clip aliases', () => {
    const actions = mockActions(['Idle', 'talking', 'Walking']);
    expect(resolveNpcClipAction('gesture', actions)?.getClip().name).toBe('talking');
  });

  it('falls back to idle for unknown non-idle states', () => {
    const actions = mockActions(['Idle']);
    expect(resolveNpcClipAction('work', actions)?.getClip().name).toBe('Idle');
  });

  it('skips Death as idle fallback when clips are ordered Death-first', () => {
    const actions = mockActions(['Death', 'Idle', 'Walk']);
    expect(resolveNpcClipAction('idle', actions)?.getClip().name).toBe('Idle');
  });
});
