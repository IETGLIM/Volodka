/* ─── AAA Poem Cinematic VFX — each poem has a soul, not just TTL flag ───
 * When a poem power is activated / discovered, we emit rich audiovisual
 * feedback: screen tint, particle aura, camera dolly, sound motif.
 * Free, no external assets — pure Three.js + CSS + WebAudio.
 */

import type { PoemId } from '@/shared/types/brands';
import { eventBus } from '@/engine/EventBus';

export interface PoemCinematicVfxProfile {
  id: string;
  bloomBoost: number;
  vignetteBoost: number;
  tint: string; // CSS color for screen tint
  particle: 'embers' | 'petals' | 'dust' | 'ink' | 'frost' | 'code';
  cameraShake: number;
  cameraDolly: number; // meters to push camera back during reading
  soundMotif: 'warm' | 'cold' | 'ethereal' | 'glitch' | 'choir';
  durationMs: number;
}

const POEM_VFX: Record<string, PoemCinematicVfxProfile> = {
  poem_1: { id: 'poem_1', bloomBoost: 0.18, vignetteBoost: 0.08, tint: 'rgba(255, 80, 60, 0.08)', particle: 'embers', cameraShake: 0.12, cameraDolly: 0.22, soundMotif: 'warm', durationMs: 4200 },
  poem_2: { id: 'poem_2', bloomBoost: 0.22, vignetteBoost: 0.12, tint: 'rgba(40, 20, 60, 0.12)', particle: 'ink', cameraShake: 0.18, cameraDolly: 0.32, soundMotif: 'choir', durationMs: 4800 },
  poem_3: { id: 'poem_3', bloomBoost: 0.16, vignetteBoost: 0.05, tint: 'rgba(120, 200, 255, 0.07)', particle: 'dust', cameraShake: 0.08, cameraDolly: 0.18, soundMotif: 'ethereal', durationMs: 3800 },
  poem_4: { id: 'poem_4', bloomBoost: 0.14, vignetteBoost: 0.06, tint: 'rgba(255, 230, 160, 0.07)', particle: 'petals', cameraShake: 0.06, cameraDolly: 0.14, soundMotif: 'warm', durationMs: 3600 },
  poem_5: { id: 'poem_5', bloomBoost: 0.20, vignetteBoost: 0.09, tint: 'rgba(160, 220, 120, 0.07)', particle: 'dust', cameraShake: 0.10, cameraDolly: 0.24, soundMotif: 'ethereal', durationMs: 4000 },
  poem_6: { id: 'poem_6', bloomBoost: 0.18, vignetteBoost: 0.07, tint: 'rgba(90, 180, 255, 0.08)', particle: 'frost', cameraShake: 0.09, cameraDolly: 0.20, soundMotif: 'cold', durationMs: 3800 },
  poem_7: { id: 'poem_7', bloomBoost: 0.24, vignetteBoost: 0.10, tint: 'rgba(255, 180, 200, 0.08)', particle: 'petals', cameraShake: 0.14, cameraDolly: 0.28, soundMotif: 'choir', durationMs: 4400 },
  poem_8: { id: 'poem_8', bloomBoost: 0.15, vignetteBoost: 0.06, tint: 'rgba(200, 200, 210, 0.06)', particle: 'dust', cameraShake: 0.07, cameraDolly: 0.16, soundMotif: 'ethereal', durationMs: 3600 },
  poem_9: { id: 'poem_9', bloomBoost: 0.19, vignetteBoost: 0.08, tint: 'rgba(255, 200, 80, 0.07)', particle: 'embers', cameraShake: 0.11, cameraDolly: 0.22, soundMotif: 'warm', durationMs: 3900 },
  poem_10: { id: 'poem_10', bloomBoost: 0.26, vignetteBoost: 0.11, tint: 'rgba(120, 120, 140, 0.10)', particle: 'dust', cameraShake: 0.16, cameraDolly: 0.30, soundMotif: 'choir', durationMs: 4600 },
  poem_11: { id: 'poem_11', bloomBoost: 0.17, vignetteBoost: 0.07, tint: 'rgba(160, 255, 200, 0.07)', particle: 'petals', cameraShake: 0.08, cameraDolly: 0.18, soundMotif: 'ethereal', durationMs: 3700 },
  poem_12: { id: 'poem_12', bloomBoost: 0.21, vignetteBoost: 0.09, tint: 'rgba(255, 120, 120, 0.08)', particle: 'ink', cameraShake: 0.13, cameraDolly: 0.26, soundMotif: 'warm', durationMs: 4200 },
  poem_13: { id: 'poem_13', bloomBoost: 0.23, vignetteBoost: 0.10, tint: 'rgba(80, 220, 255, 0.09)', particle: 'code', cameraShake: 0.15, cameraDolly: 0.28, soundMotif: 'glitch', durationMs: 4400 },
};

export const DEFAULT_POEM_VFX: PoemCinematicVfxProfile = {
  id: 'default',
  bloomBoost: 0.16,
  vignetteBoost: 0.06,
  tint: 'rgba(220, 215, 210, 0.06)',
  particle: 'dust',
  cameraShake: 0.08,
  cameraDolly: 0.18,
  soundMotif: 'ethereal',
  durationMs: 3600,
};

const lastTriggerAt = new Map<string, number>();

export function getPoemVfxProfile(poemId: string): PoemCinematicVfxProfile {
  return POEM_VFX[poemId] ?? { ...DEFAULT_POEM_VFX, id: poemId };
}

export function triggerPoemCinematicVfx(poemId: string, mode: 'discovery' | 'power_ritual' | 'combat' = 'discovery'): void {
  const now = Date.now();
  const last = lastTriggerAt.get(poemId);
  if (last && now - last < 900) return; // debounce 0.9s — avoid spam during rapid ritual triggers
  lastTriggerAt.set(poemId, now);
  // Resolve the per-poem cinematic profile (soul of the poem's VFX)
  const profile = getPoemVfxProfile(poemId);
  // EventBus for other systems to listen (postfx, camera, particles)
  eventBus.emit('poem:cinematic_vfx', {
    poemId: poemId as any,
    mode,
    tint: profile.tint,
    particle: profile.particle,
    bloomBoost: profile.bloomBoost,
    vignetteBoost: profile.vignetteBoost,
    durationMs: profile.durationMs,
  } as any);

  // Camera shake + dolly for tactile reading
  if (mode !== 'combat') {
    eventBus.emit('camera:poem_reading_start', {} as any);
    eventBus.emit('cutscene:camera_shake', {
      intensity: profile.cameraShake,
      duration: profile.durationMs * 0.4,
    } as any);
  } else {
    eventBus.emit('combat:bullet_time', {
      duration: profile.durationMs / 1000 * 0.35,
      intensity: 0.32,
      reason: 'poem_power',
    });
    eventBus.emit('camera:combat_impact', {
      intensity: profile.cameraShake * 1.4,
    } as any);
  }
}
