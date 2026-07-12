/** Minimal Rapier surface for interaction LOS — duck-typed to avoid duplicate @dimforge package trees. */
export interface InteractionQueryContext {
  world: {
    castRay(ray: unknown, maxToi: number, solid: boolean): unknown | null;
  };
  rapier: {
    Ray: new (
      origin: { x: number; y: number; z: number },
      dir: { x: number; y: number; z: number },
    ) => unknown;
  };
}

let activeContext: InteractionQueryContext | null = null;

export function registerInteractionQueryContext(ctx: InteractionQueryContext): void {
  activeContext = ctx;
}

export function unregisterInteractionQueryContext(ctx: InteractionQueryContext): void {
  if (activeContext === ctx) {
    activeContext = null;
  }
}

export function getInteractionQueryContext(): InteractionQueryContext | null {
  return activeContext;
}
