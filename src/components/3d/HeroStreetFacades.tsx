/* Hero street facades — bevelled massing, recessed windows, cornice, neon trim.
 * Replaces flat box-buildings that read as angular procedural placeholders.
 */

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import {
  getSharedBoxGeometry,
  getSharedPlaneGeometry,
} from '@/engine/three/moduleGeometryRegistry';
import { disposeEphemeralGpuResources } from '@/engine/three/disposeThreeResources';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { getCachedSurfaceDetailMaps } from '@/engine/graphics/proceduralSurfaceTextures';
import {
  allowsSelectiveMeshPhysicalWet,
  getWetGlassPhysicalParams,
} from '@/engine/graphics/wetStreetScenes';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { seededRand } from '@/shared/utils/seededRand';

interface FacadeSpec {
  pos: [number, number, number];
  w: number;
  h: number;
  d: number;
  seed: number;
  neon: string;
}

const FACADES: FacadeSpec[] = [
  { pos: [-12, 0, -15], w: 8, h: 18, d: 6, seed: 42, neon: '#ff2288' },
  { pos: [12, 0, -20], w: 10, h: 22, d: 6, seed: 137, neon: '#22ffdd' },
  { pos: [-15, 0, 5], w: 7, h: 15, d: 5, seed: 256, neon: '#aa44ff' },
  { pos: [14, 0, 8], w: 9, h: 20, d: 6, seed: 389, neon: '#4488ff' },
  { pos: [0, 0, -25], w: 12, h: 25, d: 8, seed: 512, neon: '#ffaa33' },
];

function createLitWindowAtlas(cols: number, rows: number, seed: number): THREE.CanvasTexture {
  const cw = cols * 16;
  const ch = rows * 20;
  const canvas = document.createElement('canvas');
  canvas.width = cw;
  canvas.height = ch;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#0a0a14';
  ctx.fillRect(0, 0, cw, ch);

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = seededRand(seed + r * 97 + c * 31) > 0.38;
      const warm = seededRand(seed + r * 13 + c * 71) > 0.55;
      const x = c * 16 + 2;
      const y = r * 20 + 3;
      if (lit) {
        const g = ctx.createLinearGradient(x, y, x, y + 14);
        if (warm) {
          g.addColorStop(0, 'rgba(255,210,140,0.95)');
          g.addColorStop(1, 'rgba(180,120,60,0.55)');
        } else {
          g.addColorStop(0, 'rgba(140,200,255,0.9)');
          g.addColorStop(1, 'rgba(40,80,140,0.5)');
        }
        ctx.fillStyle = g;
        ctx.fillRect(x, y, 12, 14);
        // Curtain / blind hint
        if (seededRand(seed + r * 5 + c) > 0.7) {
          ctx.fillStyle = 'rgba(20,20,30,0.35)';
          ctx.fillRect(x, y, 12, 4);
        }
      } else {
        ctx.fillStyle = 'rgba(20,24,40,0.85)';
        ctx.fillRect(x, y, 12, 14);
        ctx.strokeStyle = 'rgba(60,70,90,0.4)';
        ctx.strokeRect(x + 0.5, y + 0.5, 11, 13);
      }
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  tex.needsUpdate = true;
  return tex;
}

function BevelledFacade({ spec }: { spec: FacadeSpec }) {
  const { preset, selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const usePhysicalGlass = allowsSelectiveMeshPhysicalWet('street_night', selectedPreset, {
    coarsePointer,
  });
  const wetNeonFascia = useMemo(() => getWetGlassPhysicalParams('neonFascia'), []);
  const wetShopGlass = useMemo(() => getWetGlassPhysicalParams('streetShopWindow'), []);
  const maps = useMemo(
    () => getCachedSurfaceDetailMaps('concrete', preset.textureScale),
    [preset.textureScale],
  );
  const map = useMemo(() => {
    const t = maps.map.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(maps.repeat * 0.35, maps.repeat * (spec.h / 12));
    t.needsUpdate = true;
    return t;
  }, [maps, spec.h]);
  const normalMap = useMemo(() => {
    const t = maps.normalMap.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.copy(map.repeat);
    t.needsUpdate = true;
    return t;
  }, [maps, map]);
  const roughnessMap = useMemo(() => {
    const t = maps.roughnessMap.clone();
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.RepeatWrapping;
    t.repeat.copy(map.repeat);
    t.needsUpdate = true;
    return t;
  }, [maps, map]);

  const cols = Math.max(3, Math.floor(spec.w * 0.85));
  const rows = Math.max(4, Math.floor(spec.h * 0.55));
  const windowTex = useMemo(
    () => createLitWindowAtlas(cols, rows, spec.seed),
    [cols, rows, spec.seed],
  );

  useEffect(
    () => () => disposeEphemeralGpuResources(map, normalMap, roughnessMap, windowTex),
    [map, normalMap, roughnessMap, windowTex],
  );

  const bodyH = spec.h * 0.78;
  const bodyY = bodyH / 2 + 2.4;
  const corniceY = spec.h - 0.35;
  const neonY = 3.4;

  return (
    <group position={spec.pos}>
      {/* Main mass — slightly inset from ground floor arcade */}
      <mesh position={[0, bodyY, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(spec.w * 0.96, bodyH, spec.d * 0.96)}>
        <meshStandardMaterial
          color="#2c2c40"
          map={map}
          normalMap={normalMap}
          normalScale={new THREE.Vector2(0.65, 0.65)}
          roughnessMap={roughnessMap}
          roughness={0.9}
          metalness={0.06}
        />
      </mesh>

      {/* Ground-floor plinth / shop base */}
      <mesh position={[0, 1.15, 0]} castShadow receiveShadow geometry={getSharedBoxGeometry(spec.w, 2.3, spec.d)}>
        <meshStandardMaterial color="#1a1a28" roughness={0.82} metalness={0.12} />
      </mesh>

      {/* Recessed window bay plane */}
      <mesh position={[0, bodyY + 0.2, spec.d * 0.48 + 0.04]} geometry={getSharedPlaneGeometry(spec.w * 0.82, bodyH * 0.72)}>
        <meshStandardMaterial
          map={windowTex}
          emissiveMap={windowTex}
          emissive="#8899aa"
          emissiveIntensity={0.55}
          roughness={0.35}
          metalness={0.15}
          transparent
          opacity={0.98}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* Window reveal frames (horizontal bands) */}
      {Array.from({ length: Math.min(6, rows) }, (_, i) => {
        const y = 3.2 + i * (bodyH * 0.12);
        return (
          <mesh
            key={`ledge-${i}`}
            position={[0, y, spec.d * 0.5 + 0.06]}
            castShadow
            geometry={getSharedBoxGeometry(spec.w * 0.88, 0.08, 0.18)}
          >
            <meshStandardMaterial color="#3a3a52" roughness={0.7} metalness={0.2} />
          </mesh>
        );
      })}

      {/* Cornice / crown */}
      <mesh position={[0, corniceY, 0]} castShadow geometry={getSharedBoxGeometry(spec.w * 1.06, 0.45, spec.d * 1.06)}>
        <meshStandardMaterial color="#3a3a50" roughness={0.75} metalness={0.15} />
      </mesh>
      <mesh position={[0, corniceY + 0.35, 0]} geometry={getSharedBoxGeometry(spec.w * 1.02, 0.18, spec.d * 1.02)}>
        <meshStandardMaterial color="#4a4a62" roughness={0.65} metalness={0.2} />
      </mesh>

      {/* Restrained fascia strip — signage accent, not skyline-defining toy neon. */}
      <mesh position={[0, neonY, spec.d * 0.52]} geometry={getSharedBoxGeometry(spec.w * 0.55, 0.22, 0.08)}>
        {usePhysicalGlass ? (
          <meshPhysicalMaterial
            color="#101018"
            emissive={spec.neon}
            emissiveIntensity={0.72}
            roughness={wetNeonFascia.roughness}
            metalness={wetNeonFascia.metalness}
            transmission={wetNeonFascia.transmission}
            thickness={wetNeonFascia.thickness}
            clearcoat={wetNeonFascia.clearcoat}
            clearcoatRoughness={wetNeonFascia.clearcoatRoughness}
            opacity={wetNeonFascia.opacity}
          />
        ) : (
          <meshStandardMaterial
            color="#101018"
            emissive={spec.neon}
            emissiveIntensity={0.72}
            roughness={0.32}
            metalness={0.5}
          />
        )}
      </mesh>
      <pointLight position={[0, neonY, spec.d * 0.7]} color={spec.neon} intensity={0.42} distance={8} />

      {/* Shop-front warm glass */}
      <mesh position={[0, 1.15, spec.d * 0.52]} geometry={getSharedPlaneGeometry(spec.w * 0.42, 1.8)}>
        {usePhysicalGlass ? (
          <meshPhysicalMaterial
            color="#1a1008"
            emissive="#ff9944"
            emissiveIntensity={0.65}
            roughness={wetShopGlass.roughness}
            metalness={wetShopGlass.metalness}
            transmission={wetShopGlass.transmission}
            thickness={wetShopGlass.thickness}
            clearcoat={wetShopGlass.clearcoat}
            clearcoatRoughness={wetShopGlass.clearcoatRoughness}
            transparent
            opacity={wetShopGlass.opacity}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        ) : (
          <meshStandardMaterial
            color="#1a1008"
            emissive="#ff9944"
            emissiveIntensity={0.65}
            roughness={0.15}
            metalness={0.05}
            transparent
            opacity={0.9}
            polygonOffset
            polygonOffsetFactor={1}
            polygonOffsetUnits={1}
          />
        )}
      </mesh>

      {/* Vertical pier accents */}
      <mesh position={[-spec.w * 0.48, bodyY, spec.d * 0.5]} castShadow geometry={getSharedBoxGeometry(0.22, bodyH, 0.28)}>
        <meshStandardMaterial color="#242436" roughness={0.88} metalness={0.08} />
      </mesh>
      <mesh position={[spec.w * 0.48, bodyY, spec.d * 0.5]} castShadow geometry={getSharedBoxGeometry(0.22, bodyH, 0.28)}>
        <meshStandardMaterial color="#242436" roughness={0.88} metalness={0.08} />
      </mesh>
    </group>
  );
}

/** Layered, bevelled street facades for night city silhouette. */
export function HeroStreetFacades() {
  return (
    <group>
      {FACADES.map((spec) => (
        <BevelledFacade key={`facade-${spec.seed}`} spec={spec} />
      ))}
    </group>
  );
}
