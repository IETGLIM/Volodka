import type { MutableRefObject } from 'react';
import { Color, InstancedMesh, Matrix4 } from 'three';
import type { InteractionTargetHit } from '@/engine/interaction/interactionTargetQuery';


/** Maximum number of visible [E] prompts at once */
export const MAX_VISIBLE_PROMPTS = 2;

/** Scene exit proximity — matches SceneExitIndicator */
export const EXIT_PROXIMITY_RANGE = 2.5;

export const LMB_CLICK_DRAG_THRESHOLD_PX = 12;

/** Maximum sparkle particles per trigger zone (InstancedMesh pool size) */
export const MAX_PARTICLES = 8;

const tempMatrix = new Matrix4();
const tempColor = new Color();

/** Runtime refs for a trigger zone — updated by the central interaction tick */
export interface ZoneProximityRuntime {
  proximityRef: MutableRefObject<number>;
  pulsePhaseRef: MutableRefObject<number>;
  showIndicatorRef: MutableRefObject<boolean>;
  poemHighlightRef: MutableRefObject<boolean>;
  poemHighlightColorRef: MutableRefObject<string>;
  poemStaticHighlightRef: MutableRefObject<boolean>;
  zoneColorRef: MutableRefObject<string>;
  zoneGlowActiveRef: MutableRefObject<boolean>;
  lastPromptDistanceRef: MutableRefObject<number | null>;
  triggeredRef: MutableRefObject<boolean>;
  triggerCooldown: MutableRefObject<number>;
  particlesRef: MutableRefObject<ParticleData[]>;
  particleInstanceRef: MutableRefObject<InstancedMesh | null>;
  outlineFlashRef: MutableRefObject<boolean>;
}

/** Runtime refs for an NPC proximity highlight */
export interface NpcProximityRuntime {
  proximityRef: MutableRefObject<number>;
  pulsePhaseRef: MutableRefObject<number>;
  showIndicatorRef: MutableRefObject<boolean>;
  lastPromptDistanceRef: MutableRefObject<number | null>;
}

/** Internal particle data stored in ref — not React state to avoid per-frame re-renders */
export interface ParticleData {
  position: [number, number, number];
  velocity: [number, number, number];
  life: number;
}

/** Prompt data for centralized overlay */
export interface PromptData {
  id: string;
  label: string;
  distance: number;
  type: 'zone' | 'npc';
}

export function createZoneProximityRuntime(): ZoneProximityRuntime {
  return {
    proximityRef: { current: 0 },
    pulsePhaseRef: { current: 0 },
    showIndicatorRef: { current: false },
    poemHighlightRef: { current: false },
    poemHighlightColorRef: { current: '#ffd866' },
    poemStaticHighlightRef: { current: false },
    zoneColorRef: { current: '#88eeff' },
    zoneGlowActiveRef: { current: false },
    lastPromptDistanceRef: { current: null },
    triggeredRef: { current: false },
    triggerCooldown: { current: 0 },
    particlesRef: { current: [] },
    particleInstanceRef: { current: null },
    outlineFlashRef: { current: false },
  };
}

export function createNpcProximityRuntime(): NpcProximityRuntime {
  return {
    proximityRef: { current: 0 },
    pulsePhaseRef: { current: 0 },
    showIndicatorRef: { current: false },
    lastPromptDistanceRef: { current: null },
  };
}

export function reconcileProximityPrompt(
  id: string,
  label: string,
  type: 'zone' | 'npc',
  dist: number,
  shouldShow: boolean,
  isNear: boolean,
  runtime: {
    showIndicatorRef: MutableRefObject<boolean>;
    lastPromptDistanceRef: MutableRefObject<number | null>;
  },
  registerPrompt: (data: PromptData) => void,
  unregisterPrompt: (id: string) => void,
): void {
  const distanceChangedSignificantly =
    runtime.lastPromptDistanceRef.current === null ||
    Math.abs(dist - runtime.lastPromptDistanceRef.current) > 0.2;

  if (shouldShow !== runtime.showIndicatorRef.current) {
    runtime.showIndicatorRef.current = shouldShow;
    if (isNear) {
      registerPrompt({ id, label, distance: dist, type });
      runtime.lastPromptDistanceRef.current = dist;
    } else {
      unregisterPrompt(id);
      runtime.lastPromptDistanceRef.current = null;
    }
  } else if (shouldShow && distanceChangedSignificantly) {
    registerPrompt({ id, label, distance: dist, type });
    runtime.lastPromptDistanceRef.current = dist;
  }
}

export function updateZoneParticles(runtime: ZoneProximityRuntime, delta: number): void {
  const particles = runtime.particlesRef.current;
  const mesh = runtime.particleInstanceRef.current;
  if (particles.length === 0 || !mesh) return;

  let writeIdx = 0;
  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    p.life += delta;
    if (p.life > 0.8) continue;

    p.position[0] += p.velocity[0] * delta;
    p.position[1] += p.velocity[1] * delta;
    p.position[2] += p.velocity[2] * delta;
    p.velocity[0] *= 0.95;
    p.velocity[1] = p.velocity[1] * 0.95 - delta * 2;
    p.velocity[2] *= 0.95;

    const opacity = Math.max(0, 1 - p.life / 0.8);
    const scale = 0.06 * opacity;

    tempMatrix.makeScale(scale, scale, scale);
    tempMatrix.setPosition(p.position[0], p.position[1], p.position[2]);
    mesh.setMatrixAt(writeIdx, tempMatrix);

    tempColor.setRGB(0.27 * opacity, 1.0 * opacity, 1.0 * opacity);
    mesh.setColorAt(writeIdx, tempColor);

    if (writeIdx !== i) particles[writeIdx] = p;
    writeIdx++;
  }
  particles.length = writeIdx;

  for (let i = writeIdx; i < MAX_PARTICLES; i++) {
    tempMatrix.makeScale(0, 0, 0);
    mesh.setMatrixAt(i, tempMatrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
}

export function getTopPrompts(hits: InteractionTargetHit[]): InteractionTargetHit[] {
  return hits.slice(0, MAX_VISIBLE_PROMPTS);
}

/** Pre-computed identity matrix helpers for InstancedMesh reset (zone particle tick). */
export function resetParticleInstanceMatrices(
  mesh: InstancedMesh,
  matrix: Matrix4 = tempMatrix,
): void {
  for (let i = 0; i < MAX_PARTICLES; i++) {
    matrix.makeScale(0, 0, 0);
    mesh.setMatrixAt(i, matrix);
  }
  mesh.instanceMatrix.needsUpdate = true;
}
