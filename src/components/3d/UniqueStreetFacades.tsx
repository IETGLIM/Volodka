/* Unique per-archetype street facades — designed city-block silhouette, not GLB clone grid. */

import { Suspense, useMemo, useEffect, useState, useRef } from 'react';
import * as THREE from 'three';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getCachedSurfaceDetailMaps } from '@/engine/graphics/proceduralSurfaceTextures';
import { PolyHavenStandardMaterial } from './PolyHavenStandardMaterial';
import {
  STREET_NIGHT_UNIQUE_BLOCK,
  getUniqueBuildingGeometry,
  type UniqueBuildingSpec,
} from '@/engine/graphics/uniqueStreetBuildings';
import { seededRand } from '@/shared/utils/seededRand';
import {
  getCinematicNeonIntensityScale,
  subscribeCinematicLightCue,
} from '@/engine/cinematic/cinematicLightStaging';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { disposeEphemeralGpuResources } from '@/engine/three/disposeThreeResources';

function createWeatheringAtlas(seed: number): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a3a48';
  ctx.fillRect(0, 0, size, size);
  // Dirt streaks
  for (let i = 0; i < 40; i++) {
    const x = seededRand(seed + i * 17) * size;
    const w = 4 + seededRand(seed + i * 23) * 14;
    const g = ctx.createLinearGradient(x, 0, x, size);
    g.addColorStop(0, 'rgba(20,18,16,0)');
    g.addColorStop(0.4, `rgba(30,24,18,${0.15 + seededRand(seed + i) * 0.25})`);
    g.addColorStop(1, 'rgba(10,10,12,0.35)');
    ctx.fillStyle = g;
    ctx.fillRect(x, 0, w, size);
  }
  // Graffiti / decal blotches
  for (let i = 0; i < 12; i++) {
    const x = seededRand(seed + i * 41) * size;
    const y = seededRand(seed + i * 43) * size;
    ctx.fillStyle = `hsla(${(seededRand(seed + i * 7) * 360) | 0},40%,45%,0.18)`;
    ctx.beginPath();
    ctx.ellipse(x, y, 8 + seededRand(seed + i * 9) * 20, 4 + seededRand(seed + i * 11) * 10, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Window grit noise
  for (let i = 0; i < 800; i++) {
    const x = seededRand(seed + i * 3) * size;
    const y = seededRand(seed + i * 5) * size;
    ctx.fillStyle = `rgba(0,0,0,${0.04 + seededRand(seed + i * 13) * 0.08})`;
    ctx.fillRect(x, y, 1, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(2.2, 3.5);
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function createLitWindowPlane(seed: number, cols: number, rows: number): THREE.CanvasTexture {
  const cw = cols * 14;
  const ch = rows * 18;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#080810';
  ctx.fillRect(0, 0, cw, ch);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = seededRand(seed + r * 97 + c * 31) > 0.42;
      const x = c * 14 + 2;
      const y = r * 18 + 2;
      if (lit) {
        const warm = seededRand(seed + r * 13 + c) > 0.5;
        ctx.fillStyle = warm ? 'rgba(255,200,120,0.9)' : 'rgba(120,180,255,0.85)';
        ctx.fillRect(x, y, 10, 13);
      } else {
        ctx.fillStyle = 'rgba(18,22,36,0.9)';
        ctx.fillRect(x, y, 10, 13);
      }
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function UniqueBuilding({ spec }: { spec: UniqueBuildingSpec }) {
  const { preset } = useGraphicsQuality();
  const geo = useMemo(() => getUniqueBuildingGeometry(spec.archetype), [spec.archetype]);
  const weather = useMemo(() => createWeatheringAtlas(spec.id.length * 97 + spec.archetype.length * 13), [spec.id, spec.archetype]);
  const windows = useMemo(() => createLitWindowPlane(spec.id.charCodeAt(0) * 17, 6, 8), [spec.id]);
  const detail = useMemo(
    () => getCachedSurfaceDetailMaps('concrete', preset.textureScale),
    [preset.textureScale],
  );
  const lightRef = useRef<THREE.PointLight>(null);
  const [, bump] = useState(0);

  useEffect(() => subscribeCinematicLightCue(() => bump((n) => n + 1)), []);

  useFrameTick('misc', () => {
    if (lightRef.current) {
      lightRef.current.intensity = 0.75 * getCinematicNeonIntensityScale();
    }
  });

  useEffect(
    () => () => disposeEphemeralGpuResources(weather, windows),
    [weather, windows],
  );

  const scale = spec.scale ?? 1;
  const frontZ = 3.4 * scale;

  return (
    <group position={spec.position} rotation={[0, spec.rotationY, 0]} scale={scale}>
      <mesh geometry={geo} castShadow receiveShadow>
        {/* WS23-C: PBR upgrade */}
        <meshPhysicalMaterial
          color="#4a4a58"
          map={weather}
          normalMap={detail.normalMap}
          normalScale={new THREE.Vector2(0.55, 0.55)}
          roughnessMap={detail.roughnessMap}
          roughness={0.92}
          metalness={0.08}
          aoMapIntensity={0.7}
          clearcoat={0.15}
          clearcoatRoughness={0.6}
        />
      </mesh>

      <mesh position={[0, 9 * scale, frontZ]} scale={[1 / scale, 1 / scale, 1]}>
        <planeGeometry args={[5.5, 10]} />
        <meshStandardMaterial
          map={windows}
          emissiveMap={windows}
          emissive="#aab8c8"
          emissiveIntensity={0.5}
          roughness={0.4}
          metalness={0.12}
          transparent
          opacity={0.95}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      <Suspense fallback={null}>
        <group position={[0, 3.6, frontZ + 0.15]}>
          <mesh>
            <boxGeometry args={[3.2, 0.55, 0.12]} />
            <PolyHavenStandardMaterial materialId="metal_plate" repeatScale={2.4} color="#1a1a22" metalness={0.55} roughness={0.48} />
          </mesh>
          <mesh position={[0, 0, 0.08]}>
            <boxGeometry args={[2.8, 0.14, 0.04]} />
            <meshStandardMaterial
              color="#080810"
              emissive={spec.neon}
              emissiveIntensity={0.62 * getCinematicNeonIntensityScale()}
              roughness={0.55}
              metalness={0.15}
              toneMapped={false}
            />
          </mesh>
          <pointLight ref={lightRef} position={[0, -0.2, 0.6]} color={spec.neon} intensity={0.42} distance={10} decay={2} />
        </group>
      </Suspense>
    </group>
  );
}

/** Plaza-facing unique architecture setpiece for street_night. */
export function UniqueStreetFacades() {
  return (
    <group>
      {STREET_NIGHT_UNIQUE_BLOCK.map((spec) => (
        <UniqueBuilding key={spec.id} spec={spec} />
      ))}
    </group>
  );
}
