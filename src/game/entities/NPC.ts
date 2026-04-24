import * as THREE from 'three';
import type { Entity } from './types';

export type NpcAiState = 'idle';

export type NpcEntity = Entity & {
  components: Entity['components'] & {
    ai: { state: NpcAiState };
    interaction?: { range: number; interactionId: string };
  };
};

export function createNpcEntity(input: {
  id: string;
  position: THREE.Vector3;
  interaction?: { range: number; interactionId: string };
}): NpcEntity {
  const components: NpcEntity['components'] = {
    ai: { state: 'idle' },
    ...(input.interaction ? { interaction: input.interaction } : {}),
  };
  return {
    id: input.id,
    position: input.position.clone(),
    components,
  };
}
