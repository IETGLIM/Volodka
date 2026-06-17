import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';

// ─── 11. Radiator Steam (THREE.Points — single draw call, no per-particle Mesh) ───

interface SteamPuffData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
}

export function RadiatorSteamAnim({ anim }: { anim: EnvAnimation }) {
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
   

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  );
}
