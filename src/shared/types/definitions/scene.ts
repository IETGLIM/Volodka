/* ─── Scene / location definitions ─── */

import type { SceneId } from '@/config/sceneDefinitions';
import type { SceneAmbienceConfig } from '@/shared/types/ambientSound';
import type { FloorMaterial } from '../sceneDefinition';
import type { ChoiceCondition } from '../common/conditions';
import type { LocationCategory } from '../locationCategory';

export type ExitDirection = 'north' | 'south' | 'east' | 'west' | 'door';

export interface SceneExit {
  readonly targetScene: SceneId;
  readonly label: string;
  readonly spawnAt: [number, number, number];
  /** World-space position of the exit indicator in the current scene */
  readonly position: [number, number, number];
  /** Unified gate — preferred over legacy fields below */
  readonly condition?: ChoiceCondition;
  /** @deprecated Prefer condition.flag */
  readonly requiredFlag?: string;
  /** @deprecated Prefer condition.minKarma */
  readonly minKarma?: number;
  /** @deprecated Prefer condition.maxKarma */
  readonly maxKarma?: number;
}

export interface SceneConfig {
  readonly id: SceneId;
  readonly name: string;
  readonly size: [number, number];
  readonly spawnPoint: [number, number, number];
  readonly initialRotation: number;
  readonly floorY: number;
  readonly explorationCharacterModelScale: number;
  readonly explorationLocomotionScale: number;
  readonly hasCeiling: boolean;
  readonly floorMaterial: FloorMaterial;
  readonly fogNear?: number;
  readonly fogFar?: number;
  readonly ambientColor?: string;
  readonly ambientIntensity?: number;
  readonly groundColor?: string;
  readonly exits?: SceneExit[];
  readonly lights?: Array<{
    readonly position: [number, number, number];
    readonly intensity: number;
    readonly color: string;
    readonly distance: number;
  }>;
  readonly transitionStyle?: 'wipe' | 'flash' | 'darken' | 'ripple' | 'dissolve';
  /** Schedule timeline color category — explicit, not derived from scene id strings. */
  readonly locationCategory: LocationCategory;
  /** Procedural ambient bed for exploration (day/night profiles). */
  readonly ambience?: SceneAmbienceConfig;
}
