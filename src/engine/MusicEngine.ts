/* ─── Volodka RPG – Music engine (re-export barrel) ───
 * Implementation lives under ./audio/MusicEngine.ts (+ musicConfigs / musicTheory / proceduralMusic).
 * This file re-exports the public API for backward compatibility.
 */

export {
  musicEngine,
  disposeMusicEngine,
  reviveMusicEngine,
} from './audio/MusicEngine';
export { default } from './audio/MusicEngine';
