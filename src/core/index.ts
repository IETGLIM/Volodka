/**
 * Domain-oriented gameplay core (`input` → `physics` → presentation).
 * Prefer importing from `@/core/<domain>` rather than this barrel to avoid cycles.
 */
export * as game from './game';
export * as physics from './physics';
export * as input from './input';
export * as camera from './camera';
export * as interaction from './interaction';
export * as entities from './entities';
