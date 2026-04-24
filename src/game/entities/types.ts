import type { Vector3 } from 'three';

export type EntityId = string;

/**
 * Lightweight entity record (not a full ECS runtime).
 */
export type Entity = {
  id: EntityId;
  position: Vector3;
  components: Record<string, unknown>;
};
