/* ─── Volodka RPG – Audio engine (re-export barrel) ───
 * All audio functionality has been split into focused modules under ./audio/.
 * This file re-exports the public API for backward compatibility.
 */

export { audioEngine } from './audio/AudioEngine';
export { default } from './audio/AudioEngine';
