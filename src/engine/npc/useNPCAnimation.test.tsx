import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import * as THREE from 'three';
import { useNPCAnimation } from './useNPCAnimation';

vi.mock('@/engine/npc/npcEventRouter', () => ({
  onNpcAnimation: () => () => {},
}));

function mockActions(names: string[]): Record<string, THREE.AnimationAction> {
  const mixer = new THREE.AnimationMixer(new THREE.Object3D());
  const record: Record<string, THREE.AnimationAction> = {};
  for (const name of names) {
    const clip = new THREE.AnimationClip(name, 1, []);
    record[name] = mixer.clipAction(clip);
  }
  return record;
}

describe('useNPCAnimation', () => {
  it('plays idle on mount even when initial state is already idle', () => {
    const actions = mockActions(['Idle', 'Walk']);
    const playSpy = vi.spyOn(actions.Idle, 'play');

    renderHook(() => useNPCAnimation('test_npc', actions));

    expect(playSpy).toHaveBeenCalled();
  });

  it('crossfades to walk without replaying idle when state changes', () => {
    const actions = mockActions(['Idle', 'Walk']);
    const idlePlaySpy = vi.spyOn(actions.Idle, 'play');
    const walkPlaySpy = vi.spyOn(actions.Walk, 'play');

    const { result } = renderHook(() => useNPCAnimation('test_npc', actions));
    idlePlaySpy.mockClear();

    act(() => {
      result.current.crossfadeTo('walk');
    });

    expect(walkPlaySpy).toHaveBeenCalled();
    expect(idlePlaySpy).not.toHaveBeenCalled();
  });
});
