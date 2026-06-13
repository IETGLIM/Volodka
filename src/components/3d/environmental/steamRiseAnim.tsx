import { useRef, useMemo, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';
import { seededRandom, hashString } from './seededRandom';

interface SteamParticleData {
  x: number; y: number; z: number;
  vx: number; vy: number; vz: number;
  life: number; maxLife: number; size: number;
}

export function SteamRiseAnim({ anim }: { anim: EnvAnimation }) {
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
   

  return (
    <group ref={groupRef}>
      <points geometry={geometry} material={material} />
    </group>
  );
}
