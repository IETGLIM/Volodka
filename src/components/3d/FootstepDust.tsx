/* ─── Volodka RPG – Footstep Dust Particles ───
 *  Subtle dust puffs spawned at the player's feet on each footstep event.
 *  Uses a fixed-size particle pool (no per-frame allocation) and a single
 *  THREE.Points draw call. Honors prefers-reduced-motion (no particles spawn
 *  when reduced motion is effective).
 *
 *  Design notes:
 *  - 30-particle pool is sufficient for walk (0.4s interval) and run (0.2s)
 *    cadence — at 0.6s lifetime, max simultaneous particles ≈ 5 per foot.
 *  - Particles are tinted a warm beige by default — works for most indoor
 *    and outdoor floor materials without per-scene tuning.
 *  - Each particle has a slight upward + outward velocity that decays;
 *    opacity fades with life for a soft "puff and settle" feel.
 */

import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

const MAX_PARTICLES = 30;
const PARTICLE_LIFETIME = 0.6; // seconds
const PARTICLES_PER_STEP_MIN = 3;
const PARTICLES_PER_STEP_MAX = 5;
const PARTICLE_BASE_SIZE = 0.06;
const PARTICLE_UPWARD_VEL = 0.4;
const PARTICLE_OUTWARD_VEL = 0.35;
const PARTICLE_GRAVITY = -0.6;

const DUST_COLOR = new THREE.Color('#c8b89a');

// AAA cinematic dust — scene-aware tint for richer feel (warm indoors, cooler outdoors)
function getSceneDustColor(sceneId: string): THREE.Color {
  if (sceneId.includes('volodka') || sceneId.includes('home') || sceneId.includes('library') || sceneId.includes('albert')) {
    return new THREE.Color('#d4c3a0'); // warm beige indoor
  }
  if (sceneId.includes('factory') || sceneId.includes('bunker') || sceneId.includes('abandoned')) {
    return new THREE.Color('#a89f88'); // industrial dust
  }
  if (sceneId.includes('pier') || sceneId.includes('river') || sceneId.includes('chk')) {
    return new THREE.Color('#b8a88a'); // earthy / wooden pier
  }
  if (sceneId.includes('park') || sceneId.includes('forest')) {
    return new THREE.Color('#a8b090'); // mossy green-brown
  }
  return new THREE.Color('#c8b89a'); // default
}

interface Particle {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  /** Remaining life in seconds. 0 = dead, ready for reuse. */
  life: number;
  /** Initial life (for fade normalization). */
  initialLife: number;
}

function createParticlePool(): Particle[] {
  const pool: Particle[] = [];
  for (let i = 0; i < MAX_PARTICLES; i++) {
    pool.push({
      x: 0,
      y: 0,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      life: 0,
      initialLife: PARTICLE_LIFETIME,
    });
  }
  return pool;
}

/** Spawn `count` dust particles around the given foot position. */
function spawnBurst(
  pool: Particle[],
  footX: number,
  footY: number,
  footZ: number,
  yaw: number,
  count: number,
  upwardVel: number = PARTICLE_UPWARD_VEL,
): void {
  // Spread outward in a cone pointing away from the player's facing.
  // Player forward (world) for yaw convention matching livePlayerRotationRef
  // / +Z-facing models is (sin(yaw), 0, cos(yaw)).
  const fwdX = Math.sin(yaw);
  const fwdZ = Math.cos(yaw);
  let spawned = 0;
  for (let i = 0; i < pool.length && spawned < count; i++) {
    const p = pool[i];
    if (p.life > 0) continue; // already alive
    const angle = Math.random() * Math.PI * 2;
    const outward = (0.5 + Math.random() * 0.5) * PARTICLE_OUTWARD_VEL;
    // Mix the random outward direction with a forward bias.
    const bias = 0.6;
    p.vx = (Math.cos(angle) * outward) * (1 - bias) + fwdX * outward * bias;
    p.vz = (Math.sin(angle) * outward) * (1 - bias) + fwdZ * outward * bias;
    p.vy = upwardVel * (0.5 + Math.random() * 0.8);
    // Slight horizontal jitter so the burst isn't perfectly centered.
    p.x = footX + (Math.random() - 0.5) * 0.08;
    p.y = footY + 0.02; // tiny lift off the floor to avoid z-fighting
    p.z = footZ + (Math.random() - 0.5) * 0.08;
    p.life = PARTICLE_LIFETIME;
    p.initialLife = PARTICLE_LIFETIME;
    spawned++;
  }
}

export function FootstepDust() {
  const pointsRef = useRef<THREE.Points>(null);
  const materialRef = useRef<THREE.PointsMaterial>(null);
  const poolRef = useRef<Particle[]>(createParticlePool());
  const reducedMotionRef = useRef(false);

  // Refresh the reduced-motion flag once per render. Cheap — this is a
  // synchronous getter backed by the accessibility manager.
  reducedMotionRef.current = isEffectiveReducedMotion();

  // Pre-allocated buffer attributes — we mutate positions + colors in
  // place each frame; no new Float32Arrays are created.
  const positions = useMemo(() => {
    const pos = new Float32Array(MAX_PARTICLES * 3);
    // Park all particles far below the scene initially so the first frame
    // doesn't show a single point at the origin.
    for (let i = 0; i < MAX_PARTICLES; i++) {
      pos[i * 3 + 1] = -1000;
    }
    return pos;
  }, []);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    // Per-vertex color attribute — we fade each particle's color toward
    // black as its life decreases. THREE.PointsMaterial multiplies this
    // color by its base opacity, so black = invisible.
    const colors = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      colors[i * 3] = DUST_COLOR.r;
      colors[i * 3 + 1] = DUST_COLOR.g;
      colors[i * 3 + 2] = DUST_COLOR.b;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return geo;
  }, [positions]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  // Subscribe to footstep events. The event is emitted from
  // playerFinalizeFrame.ts ONLY when the player is grounded and moving,
  // so we can trust the payload without re-checking isGroundedRef.
  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', ({ position, yaw, speed, sceneId, isSprinting, runWeight }: any) => {
      if (reducedMotionRef.current) return;

      // AAA Phase B: rich cinematic footstep dust — fully synced with locomotion triad
      // (camera bob freq + anim timescale + body lean + audio volume/pitch).
      // runWeight (continuous 0-1 walk→run) drives count + intensity.
      const speedNorm = Math.min((speed ?? 0) / 7.0, 1);
      const rw = Math.max(0, Math.min(1, runWeight ?? (isSprinting ? 1 : speedNorm)));
      const count = Math.round(PARTICLES_PER_STEP_MIN + rw * 4.5); // up to ~8-9 on full sprint
      const upwardVel = PARTICLE_UPWARD_VEL + rw * 0.55;
      const sizeMul = 0.9 + rw * 0.55; // bigger, heavier puffs on sprint

      spawnBurst(poolRef.current, position[0], position[1], position[2], yaw, count, upwardVel);

      // Live scale the material size for sprint weight (cinematic punch)
      if (materialRef.current) {
        materialRef.current.size = PARTICLE_BASE_SIZE * sizeMul;
      }

      // AAA: scene-aware dust tint (subtle but powerful for living world)
      try {
        const col = getSceneDustColor(sceneId || '');
        if (materialRef.current) {
          materialRef.current.color.copy(col);
        }
      } catch {}
    });
    return unsub;
  }, []);

  // AAA cinematic landing dust burst — triggered from player movement on hard landings
  useEffect(() => {
    const unsub = eventBus.on('player:landed', ({ position, impact, yaw, sceneId }: any) => {
      if (reducedMotionRef.current) return;
      const strength = Math.min(1, Math.max(0.4, impact || 0.6));
      const count = Math.round(6 + strength * 7); // strong visible puff
      const upward = PARTICLE_UPWARD_VEL * (1.1 + strength * 0.6);
      spawnBurst(poolRef.current, position?.[0] ?? 0, position?.[1] ?? 0.02, position?.[2] ?? 0, yaw ?? 0, count, upward);

      // tint for landing too
      try {
        const col = getSceneDustColor(sceneId || '');
        if (materialRef.current) materialRef.current.color.copy(col);
      } catch {}
    });
    return unsub;
  }, []);

  // AAA Phase B: extra cinematic sprint-start dust kick (when player crosses into sprint)
  // This gives satisfying "launch" visual weight, synced with the locomotion system.
  let lastSprintState = false;
  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', ({ position, yaw, isSprinting, runWeight, sceneId }: any) => {
      if (reducedMotionRef.current) return;
      const nowSprinting = !!isSprinting || (runWeight ?? 0) > 0.85;
      if (nowSprinting && !lastSprintState) {
        // Big satisfying launch puff on sprint entry
        const count = 7;
        const upward = PARTICLE_UPWARD_VEL * 1.35;
        spawnBurst(poolRef.current, position[0], position[1] + 0.01, position[2], yaw, count, upward);
        try {
          const col = getSceneDustColor(sceneId || '');
          if (materialRef.current) materialRef.current.color.copy(col);
        } catch {}
      }
      lastSprintState = nowSprinting;
    });
    return unsub;
  }, []);

  // Direct 'player:sprint_start' listener — powerful cinematic launch burst
  // (more reliable on exact transition, even if footstep timing is slightly off).
  useEffect(() => {
    const unsub = eventBus.on('player:sprint_start', ({ position, yaw, sceneId }: any) => {
      if (reducedMotionRef.current) return;
      const count = 9;
      const upward = PARTICLE_UPWARD_VEL * 1.55;
      spawnBurst(poolRef.current, (position?.[0] ?? 0), (position?.[1] ?? 0.03), (position?.[2] ?? 0), yaw ?? 0, count, upward);
      try {
        const col = getSceneDustColor(sceneId || '');
        if (materialRef.current) materialRef.current.color.copy(col);
      } catch {}
    });
    return unsub;
  }, []);

  // AAA Phase B: sustained sprint "wind trail" — beautiful forward dust cone while running fast.
  // Gives the feeling of real momentum and air displacement. High-class filmic detail.
  let sprintTrailTimer = 0;
  let lastKnownYaw = 0;
  let lastKnownPos: [number, number, number] = [0, 0, 0];
  let lastRunWeight = 0;

  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', (p: any) => {
      if (p.yaw !== undefined) lastKnownYaw = p.yaw;
      if (p.position) lastKnownPos = p.position;
      lastRunWeight = Math.max(0, Math.min(1, p.runWeight ?? (p.isSprinting ? 1 : 0)));
    });
    return unsub;
  }, []);

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current || lastRunWeight < 0.65) return; // only when really sprinting

    sprintTrailTimer += delta;
    const interval = 0.095; // fast but cheap trail
    if (sprintTrailTimer > interval) {
      sprintTrailTimer = 0;

      const fwdX = Math.sin(lastKnownYaw);
      const fwdZ = Math.cos(lastKnownYaw);
      const intensity = lastRunWeight;

      // Small elegant forward-biased trail puffs (lighter than main steps)
      const trailCount = Math.round(1 + intensity * 1.8);
      const trailUp = 0.18 + intensity * 0.22;

      // Spawn a few particles slightly behind the current foot for "trailing" feel
      spawnBurst(
        poolRef.current,
        lastKnownPos[0] - fwdX * 0.18,
        (lastKnownPos[1] || 0.02) + 0.01,
        lastKnownPos[2] - fwdZ * 0.18,
        lastKnownYaw,
        trailCount,
        trailUp
      );
    }
  });

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const pool = poolRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as THREE.BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const colorAttr = pointsRef.current.geometry.getAttribute('color') as THREE.BufferAttribute;
    const colorArray = colorAttr.array as Float32Array;

    // AAA Phase B: smooth cinematic size reset — sprint puffs stay big & heavy for a moment,
    // then gently return to normal so every step feels weighty but never stuck.
    if (materialRef.current) {
      const targetSize = PARTICLE_BASE_SIZE * (0.92 + 0.08); // base + tiny breathing
      materialRef.current.size = THREE.MathUtils.lerp(
        materialRef.current.size,
        targetSize,
        1 - Math.exp(-6 * dt)
      );
    }

    for (let i = 0; i < MAX_PARTICLES; i++) {
      const p = pool[i];
      const i3 = i * 3;
      if (p.life <= 0) {
        // Park dead particles below the scene so they're invisible.
        // Keep alpha at 0 by darkening the color toward black (multiplied
        // with the material opacity to produce 0 effective opacity).
        posArray[i3 + 1] = -1000;
        colorArray[i3] = 0;
        colorArray[i3 + 1] = 0;
        colorArray[i3 + 2] = 0;
        continue;
      }
      p.life -= dt;
      if (p.life <= 0) {
        p.life = 0;
        posArray[i3 + 1] = -1000;
        colorArray[i3] = 0;
        colorArray[i3 + 1] = 0;
        colorArray[i3 + 2] = 0;
        continue;
      }
      // Apply gravity to vertical velocity, decay horizontal velocity.
      p.vy += PARTICLE_GRAVITY * dt;
      p.vx *= 1 - 2.0 * dt;
      p.vz *= 1 - 2.0 * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.z += p.vz * dt;
      // Don't sink below the spawn floor — clamp y to a small minimum.
      if (p.y < 0.02) p.y = 0.02;

      posArray[i3] = p.x;
      posArray[i3 + 1] = p.y;
      posArray[i3 + 2] = p.z;

      // Fade color toward black as life decreases. The material multiplies
      // this color by its base opacity (0.35) — black means invisible.
      const lifeRatio = p.life / p.initialLife;
      // Ease-out fade: stays bright for the first half, fades quickly at the end.
      const fade = lifeRatio * lifeRatio;
      colorArray[i3] = DUST_COLOR.r * fade;
      colorArray[i3 + 1] = DUST_COLOR.g * fade;
      colorArray[i3 + 2] = DUST_COLOR.b * fade;
    }
    posAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  });

  // Reduced motion: don't render the points at all (particles never spawn,
  // but the geometry would still draw 30 invisible points — skipping the
  // render avoids the draw call entirely).
  if (reducedMotionRef.current) return null;

  return (
    <points ref={pointsRef} geometry={geometry} frustumCulled={false}>
      <pointsMaterial
        ref={materialRef}
        size={PARTICLE_BASE_SIZE}
        transparent
        opacity={0.35}
        depthWrite={false}
        sizeAttenuation
        vertexColors
        blending={THREE.NormalBlending}
      />
    </points>
  );
}
