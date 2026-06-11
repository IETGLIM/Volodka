import type * as RAPIER from '@dimforge/rapier3d-compat-original';

/** Rapier kinematic character controller returned by `World.createCharacterController`. */
export type RapierCharacterController = ReturnType<RAPIER.World['createCharacterController']>;
