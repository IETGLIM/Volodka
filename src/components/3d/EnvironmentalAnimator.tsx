
/* ─── Volodka RPG – Environmental Animator ─── */
/* Renders per-scene environmental animations defined in EnvironmentalAnimations.ts */

import { useRef, useMemo, useCallback, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { getSceneEnvAnimations } from '@/engine/EnvironmentalAnimations';
import type { EnvAnimation, EnvAnimationType } from '@/engine/EnvironmentalAnimations';
import type { SceneId } from '@/shared/types/game';

// ─── Seeded random for deterministic animation ───

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// ═══════════════════════════════════════════════════
//  ANIMATION RENDERERS
// ═══════════════════════════════════════════════════

// ─── 1. Light Flicker ───

function LightFlickerAnim({ anim }: { anim: EnvAnimation }) {
  const lightRef = useRef<THREE.PointLight>(null);
  const timeRef = useRef(0);
  const rng = useMemo(() => seededRandom(hashString(anim.id)), [anim.id]);
  const nextFlickerRef = useRef(0);
  const targetIntensityRef = useRef((anim.config.minIntensity + anim.config.maxIntensity) / 2);
  const currentIntensityRef = useRef((anim.config.minIntensity + anim.config.maxIntensity) / 2);

  const minI = anim.config.minIntensity ?? 0.2;
  const maxI = anim.config.maxIntensity ?? 0.8;
  const flickerRate = anim.config.flickerRate ?? 0.03;

  useFrameTick('misc', ({ delta }) => {
    if (!lightRef.current) return;
    timeRef.current += delta;

    // Time-based flicker — pick a new target intensity at intervals
    if (timeRef.current >= nextFlickerRef.current) {
      targetIntensityRef.current = minI + rng() * (maxI - minI);
      nextFlickerRef.current = timeRef.current + 1 / (flickerRate * 60 + 1);
    }

    // Smooth interpolation toward target
    currentIntensityRef.current += (targetIntensityRef.current - currentIntensityRef.current) * Math.min(delta * 8, 1);
    lightRef.current.intensity = currentIntensityRef.current;
  });

  return (
    <pointLight
      ref={lightRef}
      position={anim.position}
      color="#ffcc88"
      intensity={(minI + maxI) / 2}
      distance={6}
    />
  );
}

// ─── 2. Monitor Scan ───

function MonitorScanAnim({ anim }: { anim: EnvAnimation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);
  const speed = anim.config.speed ?? 2;
  const intensity = anim.config.intensity ?? 0.3;

  // Create scanline texture
  const scanlineTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    // Dark screen base
    ctx.fillStyle = '#001100';
    ctx.fillRect(0, 0, 64, 256);
    // Scanlines
    ctx.fillStyle = 'rgba(0, 255, 68, 0.08)';
    for (let y = 0; y < 256; y += 4) {
      ctx.fillRect(0, y, 64, 2);
    }
    // Bright scan bar
    ctx.fillStyle = 'rgba(0, 255, 68, 0.4)';
    ctx.fillRect(0, 0, 64, 8);
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(1, 2);
    return tex;
  }, []);

  // Dispose texture on unmount
  useEffect(() => {
    const tex = scanlineTexture;
    return () => { tex.dispose(); };
  }, [scanlineTexture]);

  useFrameTick('misc', ({ delta }) => {
    timeRef.current += delta;
    // Scroll the texture to create a scanline moving down
    const offsetY = (timeRef.current * speed * 0.2) % 1;
    scanlineTexture.offset.set(0, offsetY);

    // Pulse the emissive intensity
    if (materialRef.current) {
      const pulse = 0.3 + Math.sin(timeRef.current * speed) * intensity;
      materialRef.current.emissiveIntensity = pulse;
    }
  });

  return (
    <mesh ref={meshRef} position={anim.position}>
      <planeGeometry args={[0.6, 0.4]} />
      <meshStandardMaterial
        ref={materialRef}
        map={scanlineTexture}
        emissive="#00ff44"
        emissiveIntensity={0.5}
        transparent
        opacity={0.9}
      />
    </mesh>
  );
}

// ─── 3. Curtain Sway ───

function CurtainSwayAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const amplitude = anim.config.amplitude ?? 0.05;
  const frequency = anim.config.frequency ?? 0.3;
  const axis = anim.config.axis ?? 2; // 0=X, 1=Y, 2=Z rotation

  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const sway = Math.sin(timeRef.current * frequency * Math.PI * 2) * amplitude;
    // Apply rotation based on axis
    if (axis === 0) groupRef.current.rotation.x = sway;
    else if (axis === 1) groupRef.current.rotation.y = sway;
    else groupRef.current.rotation.z = sway;
  });

  return (
    <group ref={groupRef} position={anim.position}>
      {/* Invisible anchor — the group rotates to simulate sway */}
      <mesh visible={false}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}

// ─── 4. Steam Rise (THREE.Points — single draw call, no per-particle Mesh) ───

interface SteamParticleData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
}

function SteamRiseAnim({ anim }: { anim: EnvAnimation }) {
  const maxParticles = 30;
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const spawnAccumRef = useRef(0);
  const particlesRef = useRef<SteamParticleData[]>([]);
  const rate = anim.config.rate ?? 0.5;
  const spread = anim.config.spread ?? 0.2;

  // Pre-allocate BufferGeometry + custom ShaderMaterial for per-particle opacity & size
  const { geometry, positionAttr, opacityAttr, sizeAttr, material } = useMemo(() => {
    const positions = new Float32Array(maxParticles * 3);
    const opacities = new Float32Array(maxParticles);
    const sizes = new Float32Array(maxParticles);

    // Hide all particles below the scene initially
    for (let i = 0; i < maxParticles; i++) {
      positions[i * 3 + 1] = -100;
      opacities[i] = 0;
      sizes[i] = 0;
    }

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const opacityAttr = new THREE.BufferAttribute(opacities, 1);
    const sizeAttr = new THREE.BufferAttribute(sizes, 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', positionAttr);
    geo.setAttribute('aOpacity', opacityAttr);
    geo.setAttribute('aSize', sizeAttr);
    geo.setDrawRange(0, 0); // nothing visible until first spawn

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#cccccc') },
      },
      vertexShader: `
        attribute float aOpacity;
        attribute float aSize;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 300.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        uniform vec3 uColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.15, dist) * vOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    return { geometry: geo, positionAttr, opacityAttr, sizeAttr, material: mat };
  }, []);

  // Dispose on unmount
  useEffect(() => {
    const geo = geometry;
    const mat = material;
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geometry, material]);

  /* eslint-disable react-hooks/immutability -- Three.js buffer attribute mutations are intentional WebGL patterns inside useFrame */
  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Spawn new particles
    spawnAccumRef.current += delta * rate * 10;
    while (spawnAccumRef.current >= 1 && particlesRef.current.length < maxParticles) {
      spawnAccumRef.current -= 1;
      particlesRef.current.push({
        x: anim.position[0] + (Math.random() - 0.5) * spread,
        y: anim.position[1],
        z: anim.position[2] + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 0.1,
        vy: 0.3 + Math.random() * 0.2,
        vz: (Math.random() - 0.5) * 0.1,
        life: 0,
        maxLife: 2 + Math.random() * 2,
        size: 0.02 + Math.random() * 0.03,
      });
    }

    // Update particles — compact alive particles to the front of the array
    const posArr = positionAttr.array as Float32Array;
    const opacArr = opacityAttr.array as Float32Array;
    const sizeArr = sizeAttr.array as Float32Array;
    let writeIdx = 0;
    for (let i = 0; i < particlesRef.current.length; i++) {
      const p = particlesRef.current[i];
      p.life += delta;
      if (p.life >= p.maxLife) continue; // dead — skip
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy *= 0.998;

      const lifeRatio = p.life / p.maxLife;
      posArr[writeIdx * 3] = p.x;
      posArr[writeIdx * 3 + 1] = p.y;
      posArr[writeIdx * 3 + 2] = p.z;
      opacArr[writeIdx] = 0.15 * (1 - lifeRatio);
      sizeArr[writeIdx] = p.size * (1 + lifeRatio * 2);

      particlesRef.current[writeIdx] = p;
      writeIdx++;
    }
    particlesRef.current.length = writeIdx;

    // Zero out any stale slots beyond live count (safety for drawRange)
    for (let i = writeIdx; i < maxParticles; i++) {
      opacArr[i] = 0;
      sizeArr[i] = 0;
    }

    // Only draw live particles — skip dead slots entirely
    geometry.setDrawRange(0, writeIdx);

    positionAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  );
}

// ─── 5. Neon Pulse ───

function NeonPulseAnim({ anim }: { anim: EnvAnimation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);
  const speed = anim.config.speed ?? 1.0;
  const minE = anim.config.minEmissive ?? 0.2;
  const maxE = anim.config.maxEmissive ?? 0.8;
  const colorR = anim.config.colorR ?? 0.3;
  const colorG = anim.config.colorG ?? 0.5;
  const colorB = anim.config.colorB ?? 1.0;

  const emissiveColor = useMemo(
    () => new THREE.Color(colorR, colorG, colorB),
    [colorR, colorG, colorB]
  );

  useFrameTick('misc', ({ delta }) => {
    if (!materialRef.current) return;
    timeRef.current += delta;
    const pulse = minE + (maxE - minE) * (0.5 + 0.5 * Math.sin(timeRef.current * speed * Math.PI * 2));
    materialRef.current.emissiveIntensity = pulse;
  });

  return (
    <mesh ref={meshRef} position={anim.position}>
      <boxGeometry args={[0.8, 0.15, 0.05]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#111111"
        emissive={emissiveColor}
        emissiveIntensity={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}

// ─── 6. Drip (pre-created mesh pool — no dynamic Mesh creation, no material.clone()) ───

interface DripDrop {
  y: number;
  falling: boolean;
  splashTime: number;
}

function DripAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const dripTimerRef = useRef(0);
  const dropRef = useRef<DripDrop | null>(null);
  const interval = anim.config.interval ?? 3.0;
  const splashDuration = anim.config.splashDuration ?? 0.5;
  const startY = anim.position[1];
  const endY = 0; // ground level

  // Pre-create drop mesh (reused, toggled via visibility)
  const { dropMesh, dropMat, splashRings, splashMats, splashGroup } = useMemo(() => {
    const dropGeo = new THREE.SphereGeometry(0.02, 6, 6);
    const dropMat = new THREE.MeshBasicMaterial({
      color: '#88aacc',
      transparent: true,
      opacity: 0.7,
    });
    const dropMesh = new THREE.Mesh(dropGeo, dropMat);
    dropMesh.visible = false;

    const splashGeo = new THREE.RingGeometry(0, 0.1, 8);
    const splashGroup = new THREE.Group();
    splashGroup.visible = false;
    const splashRings: THREE.Mesh[] = [];
    const splashMats: THREE.MeshBasicMaterial[] = [];
    for (let i = 0; i < 4; i++) {
      const mat = new THREE.MeshBasicMaterial({
        color: '#88aacc',
        transparent: true,
        opacity: 0.5,
        side: THREE.DoubleSide,
      });
      const ring = new THREE.Mesh(splashGeo, mat);
      const angle = (i / 4) * Math.PI * 2;
      ring.position.set(
        Math.cos(angle) * 0.05,
        0.01,
        Math.sin(angle) * 0.05,
      );
      ring.rotation.x = -Math.PI / 2;
      splashGroup.add(ring);
      splashRings.push(ring);
      splashMats.push(mat);
    }
    splashGroup.position.set(anim.position[0], endY, anim.position[2]);

    return { dropMesh, dropMat, splashRings, splashMats, splashGroup, dropGeo, splashGeo };
  }, [anim.position, endY]);

  // Add pre-created meshes to the group once
  useEffect(() => {
    if (!groupRef.current) return;
    groupRef.current.add(dropMesh);
    groupRef.current.add(splashGroup);
  }, [dropMesh, splashGroup]);

  // Dispose all geometries/materials on unmount
  useEffect(() => {
    const dMesh = dropMesh;
    const dMat = dropMat;
    const sRings = splashRings;
    const sMats = splashMats;
    const sGroup = splashGroup;
    return () => {
      dMesh.geometry.dispose();
      dMat.dispose();
      // All splash rings share the same geometry, dispose once
      if (sRings.length > 0) sRings[0].geometry.dispose();
      sMats.forEach((m) => m.dispose());
      // Remove from parent if still attached
      if (dMesh.parent) dMesh.parent.remove(dMesh);
      if (sGroup.parent) sGroup.parent.remove(sGroup);
    };
  }, [dropMesh, dropMat, splashRings, splashMats, splashGroup]);

  /* eslint-disable react-hooks/immutability -- Three.js mesh/material mutations are intentional WebGL patterns inside useFrame */
  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    dripTimerRef.current += delta;

    // Spawn a new drip at intervals
    if (!dropRef.current && dripTimerRef.current >= interval) {
      dripTimerRef.current = 0;
      dropRef.current = {
        y: startY,
        falling: true,
        splashTime: 0,
      };

      // Show drop mesh at start position
      dropMesh.position.set(anim.position[0], startY, anim.position[2]);
      dropMesh.visible = true;
      dropMat.opacity = 0.7;

      // Hide splash
      splashGroup.visible = false;
    }

    // Update falling drop
    if (dropRef.current && dropRef.current.falling) {
      dropRef.current.y -= delta * 5; // Fall speed
      dropMesh.position.y = dropRef.current.y;

      // Hit ground
      if (dropRef.current.y <= endY) {
        dropRef.current.falling = false;
        dropRef.current.splashTime = 0;

        // Hide drop, show splash
        dropMesh.visible = false;
        splashGroup.visible = true;
        // Reset splash ring scales and opacity
        for (let i = 0; i < splashRings.length; i++) {
          splashRings[i].scale.setScalar(1);
          splashMats[i].opacity = 0.5;
        }
      }
    }

    // Animate splash fade
    if (dropRef.current && !dropRef.current.falling) {
      dropRef.current.splashTime += delta;
      const progress = dropRef.current.splashTime / splashDuration;

      for (let i = 0; i < splashRings.length; i++) {
        splashMats[i].opacity = 0.5 * (1 - progress);
        const scale = 1 + progress * 3;
        splashRings[i].scale.setScalar(scale);
      }

      if (progress >= 1) {
        splashGroup.visible = false;
        dropRef.current = null;
      }
    }
  });
  /* eslint-enable react-hooks/immutability */

  // Cleanup
  useEffect(() => {
    return () => {
      dropRef.current = null;
    };
  }, []);

  return <group ref={groupRef} />;
}

// ─── 7. Fan Spin ───

function FanSpinAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const speed = anim.config.speed ?? 3.0;

  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    groupRef.current.rotation.y += delta * speed;
  });

  return (
    <group ref={groupRef} position={anim.position}>
      {/* Fan hub */}
      <mesh>
        <cylinderGeometry args={[0.05, 0.05, 0.1, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Fan blades */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]} position={[0.2, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.08]} />
          <meshStandardMaterial color="#777777" metalness={0.4} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}

// ─── 8. Neon Flicker (random on/off, like a broken neon tube) ───

function NeonFlickerAnim({ anim }: { anim: EnvAnimation }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const lightRef = useRef<THREE.PointLight>(null);
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);
  const isOnRef = useRef(true);
  const nextToggleRef = useRef(0);

  const colorR = anim.config.colorR ?? 0.3;
  const colorG = anim.config.colorG ?? 0.5;
  const colorB = anim.config.colorB ?? 1.0;
  const onProbability = anim.config.onProbability ?? 0.95;
  const flickerSpeed = anim.config.flickerSpeed ?? 8; // toggles per second when off
  const onEmissive = anim.config.onEmissive ?? 1.0;
  const offEmissive = anim.config.offEmissive ?? 0.05;

  const emissiveColor = useMemo(
    () => new THREE.Color(colorR, colorG, colorB),
    [colorR, colorG, colorB],
  );

  // Pre-allocate temp values
  const toggleInterval = 1 / flickerSpeed;

  useFrameTick('misc', ({ delta }) => {
    if (!materialRef.current) return;
    timeRef.current += delta;

    // Toggle on/off at flicker speed
    if (timeRef.current >= nextToggleRef.current) {
      nextToggleRef.current = timeRef.current + toggleInterval;
      isOnRef.current = Math.random() < onProbability;
    }

    const targetE = isOnRef.current ? onEmissive : offEmissive;
    // Smooth transition for on, instant for off (more realistic neon)
    if (!isOnRef.current) {
      materialRef.current.emissiveIntensity = offEmissive;
    } else {
      materialRef.current.emissiveIntensity += (targetE - materialRef.current.emissiveIntensity) * Math.min(delta * 15, 1);
    }

    if (lightRef.current) {
      lightRef.current.intensity = isOnRef.current ? onEmissive * 0.5 : 0;
    }
  });

  return (
    <group position={anim.position}>
      <mesh ref={meshRef}>
        <boxGeometry args={[1.5, 0.12, 0.05]} />
        <meshStandardMaterial
          ref={materialRef}
          color="#111111"
          emissive={emissiveColor}
          emissiveIntensity={onEmissive}
          toneMapped={false}
        />
      </mesh>
      <pointLight
        ref={lightRef}
        position={[0, -0.3, 0.5]}
        color={emissiveColor}
        intensity={onEmissive * 0.5}
        distance={6}
      />
    </group>
  );
}

// ─── 9. CRT Monitor (emissive intensity pulse like old CRT refresh) ───

function CRTMonitorAnim({ anim }: { anim: EnvAnimation }) {
  const materialRef = useRef<THREE.MeshStandardMaterial>(null);
  const timeRef = useRef(0);

  const baseIntensity = anim.config.baseIntensity ?? 4.0;
  const pulseAmp = anim.config.pulseAmp ?? 0.1; // ±10%
  const pulseSpeed = anim.config.pulseSpeed ?? 60; // ~60Hz CRT refresh
  const flickerChance = anim.config.flickerChance ?? 0.005; // occasional bright flicker per frame

  // Pre-allocated
  const currentEmissiveRef = useRef(baseIntensity);

  useFrameTick('misc', ({ delta }) => {
    if (!materialRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;

    // Simulate CRT refresh — rapid high-frequency intensity oscillation
    const crtPulse = Math.sin(t * pulseSpeed * Math.PI * 2) * pulseAmp * baseIntensity;

    // Occasional bright flicker
    const flickerBoost = Math.random() < flickerChance ? baseIntensity * 0.3 : 0;

    const targetE = baseIntensity + crtPulse + flickerBoost;
    // Smooth toward target to avoid jarring jumps
    currentEmissiveRef.current += (targetE - currentEmissiveRef.current) * Math.min(delta * 20, 1);
    materialRef.current.emissiveIntensity = currentEmissiveRef.current;
  });

  return (
    <mesh position={anim.position}>
      <planeGeometry args={[0.55, 0.35]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#001100"
        emissive="#00ff44"
        emissiveIntensity={baseIntensity}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}

// ─── 10. Lamp Sway (subtle position oscillation for hanging lamps) ───

function LampSwayAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const amplitude = anim.config.amplitude ?? 0.02;
  const frequency = anim.config.frequency ?? 0.5;

  // Pre-allocate position vector
  const posVec = useMemo(() => new THREE.Vector3(...anim.position), [anim.position]);

  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Subtle swing like a pendulum
    const swingX = Math.sin(timeRef.current * frequency * Math.PI * 2) * amplitude;
    const swingZ = Math.cos(timeRef.current * frequency * Math.PI * 2 * 0.7) * amplitude * 0.5;

    groupRef.current.position.set(
      posVec.x + swingX,
      posVec.y,
      posVec.z + swingZ,
    );
  });

  return (
    <group ref={groupRef} position={anim.position}>
      {/* Hanging cord */}
      <mesh position={[0, 0.3, 0]}>
        <cylinderGeometry args={[0.005, 0.005, 0.6, 4]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      {/* Lamp shade */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.12, 0.06, 0.08, 8]} />
        <meshStandardMaterial color="#554433" roughness={0.8} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial
          color="#ffdd88"
          emissive="#ffcc66"
          emissiveIntensity={2.0}
        />
      </mesh>
      <pointLight
        position={[0, -0.1, 0]}
        color="#ffcc88"
        intensity={1.5}
        distance={6}
      />
    </group>
  );
}

// ─── 11. Radiator Steam (THREE.Points — single draw call, no per-particle Mesh) ───

interface SteamPuffData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
}

function RadiatorSteamAnim({ anim }: { anim: EnvAnimation }) {
  const maxPuffsConfig = anim.config.maxPuffs ?? 10;
  // Allocate buffer for a few more than maxPuffs to avoid constant recycling
  const bufferMax = maxPuffsConfig + 5;
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);
  const spawnAccumRef = useRef(0);
  const puffsRef = useRef<SteamPuffData[]>([]);

  const rate = anim.config.rate ?? 0.5;
  const spread = anim.config.spread ?? 0.2;
  const riseSpeed = anim.config.riseSpeed ?? 0.4;
  const puffLife = anim.config.puffLife ?? 3.0;

  // Pre-allocate BufferGeometry + custom ShaderMaterial for per-particle opacity & size
  const { geometry, positionAttr, opacityAttr, sizeAttr, material } = useMemo(() => {
    const positions = new Float32Array(bufferMax * 3);
    const opacities = new Float32Array(bufferMax);
    const sizes = new Float32Array(bufferMax);

    // Hide all puffs below the scene initially
    for (let i = 0; i < bufferMax; i++) {
      positions[i * 3 + 1] = -100;
      opacities[i] = 0;
      sizes[i] = 0;
    }

    const positionAttr = new THREE.BufferAttribute(positions, 3);
    const opacityAttr = new THREE.BufferAttribute(opacities, 1);
    const sizeAttr = new THREE.BufferAttribute(sizes, 1);

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', positionAttr);
    geo.setAttribute('aOpacity', opacityAttr);
    geo.setAttribute('aSize', sizeAttr);
    geo.setDrawRange(0, 0); // nothing visible until first spawn

    const mat = new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      uniforms: {
        uColor: { value: new THREE.Color('#cccccc') },
      },
      vertexShader: `
        attribute float aOpacity;
        attribute float aSize;
        varying float vOpacity;
        void main() {
          vOpacity = aOpacity;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = aSize * 300.0 / -mvPosition.z;
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying float vOpacity;
        uniform vec3 uColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = smoothstep(0.5, 0.15, dist) * vOpacity;
          gl_FragColor = vec4(uColor, alpha);
        }
      `,
    });

    return { geometry: geo, positionAttr, opacityAttr, sizeAttr, material: mat };
  }, [bufferMax]);

  // Dispose on unmount
  useEffect(() => {
    const geo = geometry;
    const mat = material;
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geometry, material]);

  /* eslint-disable react-hooks/immutability -- Three.js buffer attribute mutations are intentional WebGL patterns inside useFrame */
  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;

    // Spawn new puffs
    spawnAccumRef.current += delta * rate;
    while (spawnAccumRef.current >= 1 && puffsRef.current.length < maxPuffsConfig) {
      spawnAccumRef.current -= 1;
      puffsRef.current.push({
        x: anim.position[0] + (Math.random() - 0.5) * spread,
        y: anim.position[1],
        z: anim.position[2] + (Math.random() - 0.5) * spread,
        vx: (Math.random() - 0.5) * 0.05,
        vy: riseSpeed * (0.5 + Math.random() * 0.5),
        vz: (Math.random() - 0.5) * 0.05,
        life: 0,
        maxLife: puffLife + Math.random() * puffLife * 0.5,
        size: 0.015 + Math.random() * 0.025,
      });
    }

    // Update puffs — compact alive puffs to the front of the array
    const posArr = positionAttr.array as Float32Array;
    const opacArr = opacityAttr.array as Float32Array;
    const sizeArr = sizeAttr.array as Float32Array;
    let writeIdx = 0;
    for (let i = 0; i < puffsRef.current.length; i++) {
      const p = puffsRef.current[i];
      p.life += delta;
      if (p.life >= p.maxLife) continue; // dead — skip
      p.x += p.vx * delta;
      p.y += p.vy * delta;
      p.z += p.vz * delta;
      p.vy *= 0.995; // slow rise

      const lifeRatio = p.life / p.maxLife;
      posArr[writeIdx * 3] = p.x;
      posArr[writeIdx * 3 + 1] = p.y;
      posArr[writeIdx * 3 + 2] = p.z;
      opacArr[writeIdx] = 0.12 * (1 - lifeRatio);
      sizeArr[writeIdx] = p.size * (1 + lifeRatio * 3);

      puffsRef.current[writeIdx] = p;
      writeIdx++;
    }
    puffsRef.current.length = writeIdx;

    // Zero out any stale slots beyond live count (safety for drawRange)
    for (let i = writeIdx; i < bufferMax; i++) {
      opacArr[i] = 0;
      sizeArr[i] = 0;
    }

    // Only draw live puffs — skip dead slots entirely
    geometry.setDrawRange(0, writeIdx);

    positionAttr.needsUpdate = true;
    opacityAttr.needsUpdate = true;
    sizeAttr.needsUpdate = true;
  });
  /* eslint-enable react-hooks/immutability */

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  );
}

// ═══════════════════════════════════════════════════
//  ANIMATION RENDERER SELECTOR
// ═══════════════════════════════════════════════════

function AnimationRenderer({ anim }: { anim: EnvAnimation }) {
  switch (anim.type) {
    case 'light_flicker':
      return <LightFlickerAnim anim={anim} />;
    case 'monitor_scan':
      return <MonitorScanAnim anim={anim} />;
    case 'curtain_sway':
      return <CurtainSwayAnim anim={anim} />;
    case 'steam_rise':
      return <SteamRiseAnim anim={anim} />;
    case 'neon_pulse':
      return <NeonPulseAnim anim={anim} />;
    case 'drip':
      return <DripAnim anim={anim} />;
    case 'fan_spin':
      return <FanSpinAnim anim={anim} />;
    case 'neon_flicker':
      return <NeonFlickerAnim anim={anim} />;
    case 'crt_monitor':
      return <CRTMonitorAnim anim={anim} />;
    case 'lamp_sway':
      return <LampSwayAnim anim={anim} />;
    case 'radiator_steam':
      return <RadiatorSteamAnim anim={anim} />;
    default:
      return null;
  }
}

// ═══════════════════════════════════════════════════
//  MAIN COMPONENT
// ═══════════════════════════════════════════════════

interface EnvironmentalAnimatorProps {
  livePlayerPositionRef?: React.MutableRefObject<THREE.Vector3>;
}

/**
 * Reads the animation definitions for the current scene and renders them.
 * Place inside the Canvas/Physics tree.
 */
export function EnvironmentalAnimator({ livePlayerPositionRef }: EnvironmentalAnimatorProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const animations = getSceneEnvAnimations(sceneId);

  if (animations.length === 0) return null;

  return (
    <group>
      {animations.map((anim) => (
        <AnimationRenderer key={anim.id} anim={anim} />
      ))}
    </group>
  );
}

// ─── Utility ───

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return Math.abs(hash);
}
