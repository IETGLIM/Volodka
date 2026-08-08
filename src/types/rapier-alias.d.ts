/**
 * Type declarations for Vite alias shims used by the Rapier physics engine.
 *
 * In vite.config.ts, `@dimforge/rapier3d-compat` is aliased to our init shim
 * (`src/engine/physics/rapierCompat.ts`), and `@dimforge/rapier3d-compat-original`
 * is aliased to the upstream `rapier.mjs` bundle. These declarations let tsc
 * resolve the `-original` alias to the same types as the base package.
 */
declare module '@dimforge/rapier3d-compat-original' {
  export * from '@dimforge/rapier3d-compat';
}
