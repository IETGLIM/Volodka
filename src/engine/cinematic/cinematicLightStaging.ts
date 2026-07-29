/**
 * Cinematic light staging — neon surge / dim / warm practical for story beats.
 * Consumed by UniqueStreetFacades neon lights and SceneEnvironment intensity.
 */

export type CinematicLightCue = 'neon_surge' | 'dim_hold' | 'warm_practical' | null;

let activeCue: CinematicLightCue = null;
let cueUntilMs = 0;
const listeners = new Set<() => void>();

export function setCinematicLightCue(cue: CinematicLightCue, durationSec = 2.5): void {
  activeCue = cue;
  cueUntilMs = cue ? performance.now() + durationSec * 1000 : 0;
  for (const l of listeners) l();
}

export function clearCinematicLightCue(): void {
  activeCue = null;
  cueUntilMs = 0;
  for (const l of listeners) l();
}

export function getCinematicLightCue(): CinematicLightCue {
  if (activeCue && cueUntilMs > 0 && performance.now() > cueUntilMs) {
    activeCue = null;
    cueUntilMs = 0;
  }
  return activeCue;
}

/** Neon point-light intensity multiplier for street signage. */
export function getCinematicNeonIntensityScale(): number {
  switch (getCinematicLightCue()) {
    case 'neon_surge':
      return 1.85;
    case 'dim_hold':
      return 0.55;
    case 'warm_practical':
      return 1.15;
    default:
      return 1;
  }
}

export function subscribeCinematicLightCue(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
