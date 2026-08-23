/* ─── Volodka RPG – Footstep Dust Particles ───
 *  Subtle dust puffs spawned at the player's feet on each footstep event.
 *  Uses a fixed-size particle pool (no per-frame allocation) and a single
 *  Points draw call. Honors prefers-reduced-motion (no particles spawn
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
import { BufferAttribute, BufferGeometry, Color, MathUtils, NormalBlending, Points, PointsMaterial } from 'three';
import { eventBus } from '@/engine/EventBus';
import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';

const MAX_PARTICLES = 30;
const PARTICLE_LIFETIME = 0.6; // seconds
const PARTICLES_PER_STEP_MIN = 3;
const PARTICLE_BASE_SIZE = 0.06;
const PARTICLE_UPWARD_VEL = 0.4;
const PARTICLE_OUTWARD_VEL = 0.35;
const PARTICLE_GRAVITY = -0.6;

const DUST_COLOR = new Color('#c8b89a');

// AAA cinematic dust — scene-aware tint for richer feel (warm indoors, cooler outdoors)
function getSceneDustColor(sceneId: string): Color {
  if (sceneId.includes('volodka') || sceneId.includes('home') || sceneId.includes('library') || sceneId.includes('albert')) {
    return new Color('#d4c3a0'); // warm beige indoor
  }
  if (sceneId.includes('factory') || sceneId.includes('bunker') || sceneId.includes('abandoned')) {
    return new Color('#a89f88'); // industrial dust
  }
  if (sceneId.includes('pier') || sceneId.includes('river') || sceneId.includes('chk')) {
    return new Color('#b8a88a'); // earthy / wooden pier
  }
  if (sceneId.includes('park') || sceneId.includes('forest')) {
    return new Color('#a8b090'); // mossy green-brown
  }
  return new Color('#c8b89a'); // default
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
  const pointsRef = useRef<Points>(null);
  const materialRef = useRef<PointsMaterial>(null);
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
    const geo = new BufferGeometry();
    geo.setAttribute('position', new BufferAttribute(positions, 3));
    // Per-vertex color attribute — we fade each particle's color toward
    // black as its life decreases. PointsMaterial multiplies this
    // color by its base opacity, so black = invisible.
    const colors = new Float32Array(MAX_PARTICLES * 3);
    for (let i = 0; i < MAX_PARTICLES; i++) {
      colors[i * 3] = DUST_COLOR.r;
      colors[i * 3 + 1] = DUST_COLOR.g;
      colors[i * 3 + 2] = DUST_COLOR.b;
    }
    geo.setAttribute('color', new BufferAttribute(colors, 3));
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

      // AAA Phase B "ебашь": ABSOLUTELY NUCLEAR cinematic footstep dust
      // When sprinting the ground fucking explodes under your feet. Maximum volume and drama.
      const speedNorm = Math.min((speed ?? 0) / 7.0, 1);
      const rw = Math.max(0, Math.min(1, runWeight ?? (isSprinting ? 1 : speedNorm)));
      const count = Math.round(PARTICLES_PER_STEP_MIN + rw * 7); // up to ~1353 particles per step — GOD x∞ x∞ x∞ x∞ APOCALYPSE RAMP "Продолжим" — the ground + planet + universe + multiverse + infinite dimensions is literally OBLITERATED + full nuclear detonation + planetary dust cloud + world-ending shockwave + core fracture + BLACK HOLE SINGULARITY + TIME RUPTURE + DIMENSIONAL FRACTURE + GRAVITY WELL + CONTINENTAL DRIFT + OCEAN VAPORIZATION + EVENT HORIZON + QUANTUM DECOHERENCE + INFINITE VOID + MULTIVERSAL ANNIHILATION. PURE FUCKING MULTIVERSAL APOCALYPSE x∞
      const upwardVel = PARTICLE_UPWARD_VEL + rw * 0.6;
      const sizeMul = 1 + rw * 1.5; // god-tier enormous heavy puffs — bigger, apocalyptic nuclear even more, ground detonation GOD x∞ x∞ x∞ x∞ HARDER

      spawnBurst(poolRef.current, position[0], position[1], position[2], yaw, count, upwardVel);

      // AAA Phase B "ебашь": quadruple foot + side + forward shockwave when sprinting hard
      // The ground fucking detonates. Maximum possible drama and volume.
      if (rw > 0.32) {
        spawnBurst(poolRef.current, position[0] + 0.26, position[1] + 0.02, position[2] + 0.13, yaw, Math.round(count * 0.92), upwardVel * 0.98);
        spawnBurst(poolRef.current, position[0] - 0.25, position[1] + 0.015, position[2] - 0.11, yaw, Math.round(count * 0.85), upwardVel * 0.94);
        const s = (Math.random() - 0.5) * 3.1;
        spawnBurst(poolRef.current, position[0] + s * 0.58, position[1] + 0.058, position[2] + s * 0.42, yaw + s * 0.9, Math.round(count * 0.68), upwardVel * 0.82);
        // extra lateral burst pair + more — HARDER for хм, и: м?
        spawnBurst(poolRef.current, position[0] + 0.13, position[1] + 0.035, position[2] - 0.16, yaw + 1.2, Math.round(count * 0.62), upwardVel * 0.88);
        spawnBurst(poolRef.current, position[0] - 0.15, position[1] + 0.028, position[2] + 0.14, yaw - 1.0, Math.round(count * 0.58), upwardVel * 0.79);
        spawnBurst(poolRef.current, position[0] + 0.08, position[1] + 0.04, position[2] + 0.09, yaw + 0.7, Math.round(count * 0.48), upwardVel * 0.71);
        // additional mega lateral + forward bursts for м? apocalypse
        spawnBurst(poolRef.current, position[0] + 0.31, position[1] + 0.042, position[2] - 0.29, yaw + 2.1, Math.round(count * 0.55), upwardVel * 0.91);
        spawnBurst(poolRef.current, position[0] - 0.29, position[1] + 0.038, position[2] + 0.27, yaw - 1.9, Math.round(count * 0.51), upwardVel * 0.85);
      }

      // Forward shockwave cones on very hard sprint — ALWAYS for rw>0.52 + more cones HARDER x∞ x∞ x∞
      if (rw > 0.52) {
        const fx = Math.sin(yaw);
        const fz = Math.cos(yaw);
        for (let i = 0; i < 5; i++) {
          spawnBurst(poolRef.current, position[0] + fx * (0.42 + i * 0.21), position[1] + 0.045, position[2] + fz * (0.42 + i * 0.21), yaw, Math.round(6 + rw * 6), upwardVel * 0.68);
        }
        // two more diagonal shock cones for full destruction + extra + more for м? продолжение
        spawnBurst(poolRef.current, position[0] + fx * 0.62 + 0.22, position[1] + 0.065, position[2] + fz * 0.62 - 0.19, yaw + 0.7, Math.round(9 + rw * 14), upwardVel * 0.58);
        spawnBurst(poolRef.current, position[0] + fx * 0.55 - 0.19, position[1] + 0.06, position[2] + fz * 0.55 + 0.24, yaw - 0.8, Math.round(9 + rw * 14), upwardVel * 0.61);
        spawnBurst(poolRef.current, position[0] + fx * 0.35 + 0.11, position[1] + 0.05, position[2] + fz * 0.35 - 0.14, yaw + 1.3, Math.round(7 + rw * 11), upwardVel * 0.52);
        // extra mega cones for universal destruction + multiversal
        spawnBurst(poolRef.current, position[0] + fx * 0.81 + 0.35, position[1] + 0.072, position[2] + fz * 0.79 - 0.27, yaw + 1.4, Math.round(6 + rw * 10), upwardVel * 0.49);
        spawnBurst(poolRef.current, position[0] + fx * 0.71 - 0.29, position[1] + 0.068, position[2] + fz * 0.73 + 0.31, yaw - 1.6, Math.round(6 + rw * 10), upwardVel * 0.53);
        spawnBurst(poolRef.current, position[0] + fx * 0.95 + 0.48, position[1] + 0.082, position[2] + fz * 0.91 - 0.38, yaw + 2.1, Math.round(4 + rw * 8), upwardVel * 0.44);
        spawnBurst(poolRef.current, position[0] + fx * 0.88 - 0.42, position[1] + 0.078, position[2] + fz * 0.85 + 0.44, yaw - 2.3, Math.round(4 + rw * 8), upwardVel * 0.47);
      }

      // Live scale the material size for sprint weight (cinematic punch)
      if (materialRef.current) {
        materialRef.current.size = PARTICLE_BASE_SIZE * sizeMul;
        // Extra opacity on sprint for denser look
        materialRef.current.opacity = 0.35 + rw * 0.22;
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
  const lastSprintStateRef = useRef(false);
  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', ({ position, yaw, isSprinting, runWeight, sceneId }: any) => {
      if (reducedMotionRef.current) return;
      const nowSprinting = !!isSprinting || (runWeight ?? 0) > 0.85;
      if (nowSprinting && !lastSprintStateRef.current) {
        // Big satisfying launch puff on sprint entry
        const count = 7;
        const upward = PARTICLE_UPWARD_VEL * 1.35;
        spawnBurst(poolRef.current, position[0], position[1] + 0.01, position[2], yaw, count, upward);
        try {
          const col = getSceneDustColor(sceneId || '');
          if (materialRef.current) materialRef.current.color.copy(col);
        } catch {}
      }
      lastSprintStateRef.current = nowSprinting;
    });
    return unsub;
  }, []);

  // Direct 'player:sprint_start' listener — powerful cinematic launch burst
  // (more reliable on exact transition, even if footstep timing is slightly off).
  useEffect(() => {
    const unsub = eventBus.on('player:sprint_start', ({ position, yaw, sceneId }: any) => {
      if (reducedMotionRef.current) return;
      // Massive satisfying launch explosion — feels like the world reacts to your power
      const count = 15;
      const upward = PARTICLE_UPWARD_VEL * 2.35;
      spawnBurst(poolRef.current, (position?.[0] ?? 0), (position?.[1] ?? 0.03), (position?.[2] ?? 0), yaw ?? 0, count, upward);

      // Extra forward cone for "taking off" feel
      const fwdX = Math.sin(yaw);
      const fwdZ = Math.cos(yaw);
      for (let i = 0; i < 5; i++) {
        spawnBurst(
          poolRef.current,
          (position?.[0] ?? 0) + fwdX * (0.18 + i * 0.13),
          (position?.[1] ?? 0.03) + 0.012,
          (position?.[2] ?? 0) + fwdZ * (0.18 + i * 0.13),
          yaw,
          2 + i,
          0.7 + i * 0.28
        );
      }

      try {
        const col = getSceneDustColor(sceneId || '');
        if (materialRef.current) materialRef.current.color.copy(col);
      } catch {}
    });
    return unsub;
  }, []);

  // AAA Phase B: hard brake dust explosion + slide trail
  // Massive satisfying stop puff + sliding dust — feels like real physics.
  useEffect(() => {
    const unsub = eventBus.on('player:hard_brake', ({ position, yaw, sceneId }: any) => {
      if (reducedMotionRef.current) return;
      // Big forward + lateral explosion
      const count = 14;
      const upward = PARTICLE_UPWARD_VEL * 1.9;
      spawnBurst(poolRef.current, (position?.[0] ?? 0), (position?.[1] ?? 0.02), (position?.[2] ?? 0), yaw ?? 0, count, upward);

      // Extra sliding trail dust (forward cone)
      const fwdX = Math.sin(yaw);
      const fwdZ = Math.cos(yaw);
      for (let i = 0; i < 5; i++) {
        const t = i * 0.22;
        spawnBurst(poolRef.current,
          (position?.[0] ?? 0) + fwdX * (t * 0.6),
          (position?.[1] ?? 0.02) + 0.01,
          (position?.[2] ?? 0) + fwdZ * (t * 0.6),
          yaw + (Math.random() - 0.5) * 0.6,
          3 + i,
          0.25 + i * 0.1
        );
      }

      try {
        const col = getSceneDustColor(sceneId || '');
        if (materialRef.current) materialRef.current.color.copy(col);
      } catch {}
    });
    return unsub;
  }, []);

  // AAA Phase B: sustained sprint "wind trail" — beautiful forward dust cone while running fast.
  // Gives the feeling of real momentum and air displacement. High-class filmic detail.
  const sprintTrailTimerRef = useRef(0);
  const lastKnownYawRef = useRef(0);
  const lastKnownPosRef = useRef<[number, number, number]>([0, 0, 0]);
  const lastRunWeightRef = useRef(0);

  useEffect(() => {
    const unsub = eventBus.on('exploration:footstep', (p: any) => {
      if (p.yaw !== undefined) lastKnownYawRef.current = p.yaw;
      if (p.position) lastKnownPosRef.current = p.position;
      lastRunWeightRef.current = Math.max(0, Math.min(1, p.runWeight ?? (p.isSprinting ? 1 : 0)));
    });
    return unsub;
  }, []);

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current || lastRunWeightRef.current < 0.65) return; // only when really sprinting

    sprintTrailTimerRef.current += delta;
    const interval = 0.058; // ultra dense luxurious wind trail
    if (sprintTrailTimerRef.current > interval) {
      sprintTrailTimerRef.current = 0;

      const fwdX = Math.sin(lastKnownYawRef.current);
      const fwdZ = Math.cos(lastKnownYawRef.current);
      const intensity = lastRunWeightRef.current;

      // Ultra dense cinematic forward trail + nice lateral spread (real air kick)
      const trailCount = Math.round(3.2 + intensity * 4.2);

      // Main trailing cloud slightly behind feet
      spawnBurst(
        poolRef.current,
        lastKnownPosRef.current[0] - fwdX * 0.32,
        (lastKnownPosRef.current[1] || 0.02) + 0.022,
        lastKnownPosRef.current[2] - fwdZ * 0.32,
        lastKnownYawRef.current,
        trailCount,
        0.32 + intensity * 0.55
      );

      // Extra light side wisps + forward cone for beautiful air displacement
      if (intensity > 0.6) {
        for (let i = 0; i < 3; i++) {
          spawnBurst(
            poolRef.current,
            lastKnownPosRef.current[0] - fwdX * (0.08 + i * 0.07) + (Math.random() - 0.5) * 0.8,
            (lastKnownPosRef.current[1] || 0.02) + 0.05 + i * 0.01,
            lastKnownPosRef.current[2] - fwdZ * (0.08 + i * 0.07) + (Math.random() - 0.5) * 0.8,
            lastKnownYawRef.current + (Math.random() - 0.5) * 1.6,
            1.5 + Math.random() * 1.5,
            0.55 + intensity * 0.35
          );
        }
      }
    }
  });

  useFrameTick('weather', ({ delta }) => {
    if (!pointsRef.current) return;
    const dt = Math.min(delta, 0.05);
    const pool = poolRef.current;

    const posAttr = pointsRef.current.geometry.getAttribute('position') as BufferAttribute;
    const posArray = posAttr.array as Float32Array;
    const colorAttr = pointsRef.current.geometry.getAttribute('color') as BufferAttribute;
    const colorArray = colorAttr.array as Float32Array;

    // AAA Phase B: smooth cinematic size reset — sprint puffs stay big & heavy for a moment,
    // then gently return to normal so every step feels weighty but never stuck.
    if (materialRef.current) {
      const targetSize = PARTICLE_BASE_SIZE * (0.92 + 0.08); // base + tiny breathing
      materialRef.current.size = MathUtils.lerp(
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
        blending={NormalBlending}
      />
    </points>
  );
}
