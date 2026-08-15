
/* ─── Volodka RPG – Winter Street procedural 3D visual ─── */

import { useMemo } from 'react';
import { BackSide, CanvasTexture, RepeatWrapping, Vector3 } from 'three';
import { CANONICAL_SHADOW_BIAS, CANONICAL_SHADOW_NORMAL_BIAS } from '@/components/3d/Lighting';
import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { EnvironmentDetail, PropDistanceGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { createStreetWinterColdSkyTexture } from '@/engine/graphics/proceduralSkyTextures';
import {
  allowsSelectiveMeshPhysicalWet,
  getWetGlassPhysicalParams,
  getWinterIceSheenSettings,
} from '@/engine/graphics/wetStreetScenes';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useIsMobileVisual } from '@/hooks/use-mobile';
import { WetStreetGround } from './WetStreetGround';

interface StreetWinterVisualProps {
  livePlayerPositionRef?: React.MutableRefObject<Vector3>;
}

/** Gothic/Noir winter street (25×25m) */
export function StreetWinterVisual({ livePlayerPositionRef }: StreetWinterVisualProps) {
  const groundTexture = useCachedCanvasTexture('street_winter:ground', createWinterGroundTexture);
  const envProfile = useMemo(() => getEnvironmentLodProfile('street_winter'), []);
  const iceSheen = useMemo(() => getWinterIceSheenSettings(), []);
  const { selectedPreset } = useGraphicsQuality();
  const coarsePointer = useIsMobileVisual();
  const useFrostGlass = allowsSelectiveMeshPhysicalWet('street_winter', selectedPreset, {
    coarsePointer,
  });
  const frostGlass = useMemo(() => getWetGlassPhysicalParams('winterShopWindow'), []);
  const sidewalkRoughness = Math.max(0.14, iceSheen.dryRoughness - iceSheen.sheenBoost);
  const sidewalkMetalness = Math.min(0.62, iceSheen.dryMetalness + iceSheen.sheenBoost);
  const snowOverlayRoughness = Math.min(0.72, iceSheen.dryRoughness + 0.12);
  const snowOverlayMetalness = Math.max(0.12, iceSheen.dryMetalness - 0.12);
  const icePuddleRoughness = Math.max(0.06, iceSheen.dryRoughness - iceSheen.sheenBoost * 1.5);
  const icePuddleMetalness = Math.min(0.72, iceSheen.dryMetalness + iceSheen.sheenBoost * 1.4);

  const W = 25;
  const D = 25;

  return (
    <group>
      {/* ── Snow ground + icy sheen (no planar reflector) ── */}
      <WetStreetGround
        sceneId="street_winter"
        isWinter
        rainIntensity={0}
        size={Math.max(W, D)}
        groundColor="#d0d8e8"
      />
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.004}>
        <planeGeometry args={[W, D]} />
        <meshPhysicalMaterial
          map={groundTexture}
          color="#d0d8e8"
          roughness={snowOverlayRoughness}
          metalness={snowOverlayMetalness}
          clearcoat={0.5}
          clearcoatRoughness={0.05}
          ior={1.31}
          sheen={0.15}
          sheenColor="#ffffff"
          sheenRoughness={0.5}
          transparent
          opacity={0.92}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
          /* WS20-C: upgraded to MeshPhysicalMaterial for PBR clearcoat */
          /* WS26-C: capped clearcoat 0.9 → 0.5 (sane bound) + added sheen=0.15 frost sparkle */
        />
      </mesh>

      {/* ── Sidewalk — packed ice via getWinterIceSheenSettings ── */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]} receiveShadow>
        <planeGeometry args={[5, 30]} />
        <meshPhysicalMaterial
          color={iceSheen.groundColor}
          roughness={sidewalkRoughness}
          metalness={sidewalkMetalness}
          clearcoat={0.9}
          clearcoatRoughness={0.05}
          ior={1.31}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
          /* WS20-C: upgraded to MeshPhysicalMaterial for PBR clearcoat */
        />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SNOW-COVERED BUILDINGS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Building 1 - left side */}
      <WinterBuilding position={[-9, 0, -8]} width={6} height={12} depth={5} useFrostGlass={useFrostGlass} frostGlass={frostGlass} />
      {/* Building 2 - left far */}
      <WinterBuilding position={[-10, 0, 4]} width={5} height={10} depth={5} />
      {/* Building 3 - right side */}
      <WinterBuilding position={[9, 0, -5]} width={7} height={14} depth={5} useFrostGlass={useFrostGlass} frostGlass={frostGlass} />
      {/* Building 4 - right far */}
      <WinterBuilding position={[10, 0, 6]} width={6} height={11} depth={5} />
      {/* Building 5 - back */}
      <WinterBuilding position={[0, 0, -12]} width={8} height={16} depth={5} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── BARE TREES ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="standard" position={[0, 0, -3]}>
      <BareTree position={[-4, 0, -5]} />
      <BareTree position={[4, 0, -3]} />
      <BareTree position={[-3, 0, 5]} />
      <BareTree position={[5, 0, 7]} />
      <BareTree position={[-6, 0, 0]} />
      <BareTree position={[2, 0, -8]} />
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ICICLES (on building edges) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail minLod="full" position={[-5, 12, -6]}>
      {[
        [-6, 12, -8], [-5, 12, -8], [-4, 12, -8],
        [5.5, 14, -5], [6.5, 14, -5], [7.5, 14, -5],
        [-4, 10, 4], [-3, 10, 4],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]} rotation={[0.1, 0, 0]}>
          <coneGeometry args={[0.02, 0.4, 4]} />
          <meshStandardMaterial color="#c0d8e8" transparent opacity={0.7} metalness={0.1} roughness={0.1} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── FROZEN PUDDLES ── */}
      {/* ═══════════════════════════════════════════════ */}
      {[
        [1, 0.02, 2], [-2, 0.02, -1], [3, 0.02, 4],
      ].map((pos, i) => (
        <mesh key={i} rotation-x={-Math.PI / 2} position={pos as [number, number, number]}>
          <circleGeometry args={[0.5 + i * 0.15, 12]} />
          {useFrostGlass && i === 0 ? (
            <meshPhysicalMaterial
              color="#8a9ab0"
              metalness={icePuddleMetalness}
              roughness={icePuddleRoughness}
              clearcoat={0.55}
              clearcoatRoughness={0.2}
              transparent
              opacity={0.55}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          ) : (
            <meshStandardMaterial
              color="#8a9ab0"
              metalness={icePuddleMetalness}
              roughness={icePuddleRoughness}
              transparent
              opacity={0.5}
              polygonOffset
              polygonOffsetFactor={1}
              polygonOffsetUnits={1}
            />
          )}
        </mesh>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SMOKE FROM CHIMNEYS ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Chimney on building 1 */}
      <group position={[-8, 12, -8]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
        </mesh>
        {/* Smoke particles (static representation) */}
        {[0.3, 0.7, 1.2, 1.8].map((y, i) => (
          <mesh key={i} position={[0, y + 1, 0]}>
            <sphereGeometry args={[0.15 + i * 0.08, 6, 6]} />
            <meshStandardMaterial color="#aaa" transparent opacity={0.15 - i * 0.03} />
          </mesh>
        ))}
      </group>

      {/* Chimney on building 3 */}
      <group position={[10, 14, -5]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.4, 1.0, 0.4]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.8} />
        </mesh>
        {[0.3, 0.7, 1.2].map((y, i) => (
          <mesh key={i} position={[0, y + 1, 0]}>
            <sphereGeometry args={[0.12 + i * 0.07, 6, 6]} />
            <meshStandardMaterial color="#aaa" transparent opacity={0.12 - i * 0.03} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SNOWDRIFTS ── */}
      {/* ═══════════════════════════════════════════════ */}
      {[
        [-5, 0.15, -2], [4, 0.12, 3], [-2, 0.1, 7],
        [6, 0.15, -6], [-7, 0.12, 2],
      ].map((pos, i) => (
        <mesh key={i} position={pos as [number, number, number]}>
          <sphereGeometry args={[0.8 + (i * 0.618) * 0.4, 8, 4]} />
          <meshStandardMaterial color="#d8e0f0" roughness={0.95} />
        </mesh>
      ))}

      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WINTER STREET LAMPS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <WinterLamp position={[-2.5, 0, -6]} />
      <WinterLamp position={[2.5, 0, -2]} />
      <WinterLamp position={[-2.5, 0, 4]} />
      <WinterLamp position={[2.5, 0, 8]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Warm window lights from buildings */}
      <pointLight position={[-9, 6, -8]} color="#ffaa44" intensity={2.0} distance={10} />
      <pointLight position={[9, 5, -5]} color="#ffaa44" intensity={1.5} distance={8} />
      <pointLight position={[-10, 4, 4]} color="#ffaa44" intensity={1.5} distance={8} />

      {/* Blue moonlight */}
      <pointLight position={[0, 15, 0]} color="#8a9ab0" intensity={2.0} distance={35} castShadow shadow-mapSize-width={256} shadow-bias={CANONICAL_SHADOW_BIAS} shadow-normalBias={CANONICAL_SHADOW_NORMAL_BIAS} />

      {/* Street lamp warm glow */}
      <pointLight position={[-2.5, 4.5, -6]} color="#ffdd80" intensity={2.5} distance={12} />
      <pointLight position={[2.5, 4.5, -2]} color="#ffdd80" intensity={2.0} distance={12} />
      <pointLight position={[-2.5, 4.5, 4]} color="#ffdd80" intensity={2.0} distance={12} />
      <pointLight position={[2.5, 4.5, 8]} color="#ffdd80" intensity={2.0} distance={12} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Snow-covered bench ── */}
      <WinterClutterGate livePlayerPositionRef={livePlayerPositionRef} position={[3, 0, 0]} maxDistance={envProfile.clutterDistance}>
      <group rotation={[0, 0.3, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[1.2, 0.08, 0.4]} />
          <meshStandardMaterial color="#5a5a5a" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[1.1, 0.05, 0.35]} />
          <meshStandardMaterial color="#e0e8f0" roughness={0.95} />
        </mesh>
        <mesh position={[-0.5, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.35]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
        </mesh>
        <mesh position={[0.5, 0.2, 0]}>
          <boxGeometry args={[0.1, 0.4, 0.35]} />
          <meshStandardMaterial color="#4a4a4a" roughness={0.85} />
        </mesh>
      </group>
      </WinterClutterGate>

      {/* ── Abandoned sled ── */}
      <WinterClutterGate livePlayerPositionRef={livePlayerPositionRef} position={[-3, 0, -2]} maxDistance={envProfile.clutterDistance}>
      <group rotation={[0, 0.6, 0.1]}>
        <mesh position={[0, 0.08, 0]} castShadow>
          <boxGeometry args={[0.4, 0.03, 0.6]} />
          <meshStandardMaterial color="#6a4a30" roughness={0.8} />
        </mesh>
        <mesh position={[-0.18, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 4]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0.18, 0.03, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 4]} />
          <meshStandardMaterial color="#4a4a4a" metalness={0.6} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.116, 0]}>
          <boxGeometry args={[0.35, 0.03, 0.5]} />
          <meshStandardMaterial color="#e0e8f0" roughness={0.95} />
        </mesh>
      </group>
      </WinterClutterGate>

      {/* ── Footprints in snow (3D depressions) ── */}
      <EnvironmentDetail minLod="full" position={[0, 0, -2]}>
      {[
        [0, 0.005, -3], [0.2, 0.005, -2.5], [-0.1, 0.005, -2.0], [0.15, 0.005, -1.5],
      ].map((pos, i) => (
        <mesh key={`footprint-${i}`} rotation-x={-Math.PI / 2} position={pos as [number, number, number]}>
          <planeGeometry args={[0.08, 0.16]} />
          <meshStandardMaterial color="#b8c0d0" roughness={0.8} transparent opacity={0.5} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
        </mesh>
      ))}
      </EnvironmentDetail>

      <StreetWinterSkyDome />
    </group>
  );
}

/** Cold overcast winter sky dome — fog-exempt horizon depth for street_winter. */
function StreetWinterSkyDome() {
  const skyTexture = useCachedCanvasTexture(
    'street_winter:cold-sky',
    createStreetWinterColdSkyTexture,
  );

  return (
    <mesh position={[0, 10, 0]} renderOrder={-10}>
      <sphereGeometry args={[62, 28, 14, 0, Math.PI * 2, 0, Math.PI * 0.55]} />
      <meshBasicMaterial
        map={skyTexture}
        side={BackSide}
        fog={false}
        depthWrite={false}
      />
    </mesh>
  );
}

function WinterClutterGate({
  livePlayerPositionRef,
  position,
  maxDistance,
  children,
}: {
  livePlayerPositionRef?: React.MutableRefObject<Vector3>;
  position: [number, number, number];
  maxDistance: number;
  children: React.ReactNode;
}) {
  if (!livePlayerPositionRef) {
    return <group position={position}>{children}</group>;
  }
  return (
    <PropDistanceGate
      livePlayerPositionRef={livePlayerPositionRef}
      position={position}
      maxDistance={maxDistance}
    >
      {children}
    </PropDistanceGate>
  );
}

/** Snow-covered building */
function WinterBuilding({
  position,
  width,
  height,
  depth,
  useFrostGlass = false,
  frostGlass,
}: {
  position: [number, number, number];
  width: number;
  height: number;
  depth: number;
  useFrostGlass?: boolean;
  frostGlass?: ReturnType<typeof getWetGlassPhysicalParams>;
}) {
  return (
    <group position={position}>
      {/* Building body */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[width, height, depth]} />
        <meshStandardMaterial color="#2a2a30" roughness={0.9} />
      </mesh>
      {/* Snow cap on roof */}
      <mesh position={[0, height + 0.105, 0]} castShadow>
        <boxGeometry args={[width + 0.2, 0.2, depth + 0.2]} />
        <meshStandardMaterial color="#e0e8f0" roughness={0.95} />
      </mesh>
      {/* Snow on ledges */}
      <mesh position={[0, height * 0.6, depth / 2 + 0.01]}>
        <boxGeometry args={[width + 0.1, 0.08, 0.15]} />
        <meshStandardMaterial color="#d8e0f0" roughness={0.95} />
      </mesh>
      {/* Windows with warm glow — ground-floor frost glass when quality allows */}
      {Array.from({ length: Math.floor(height / 3) }).map((_, row) => {
        const windowCount = Math.floor(width / 2);
        return Array.from({ length: windowCount }).map((_, col) => {
          const wx = (col - (windowCount - 1) / 2) * 2;
          const wy = (row + 1) * 3;
          const frostPane = useFrostGlass && frostGlass && row === 0 && col === 0;
          return (
            <mesh key={`${row}-${col}`} position={[wx, wy, depth / 2 + 0.01]}>
              <planeGeometry args={[0.8, 1.0]} />
              {frostPane ? (
                <meshPhysicalMaterial
                  color="#1a2030"
                  emissive="#ffaa44"
                  emissiveIntensity={0.35}
                  roughness={frostGlass.roughness}
                  metalness={frostGlass.metalness}
                  transmission={frostGlass.transmission}
                  thickness={frostGlass.thickness}
                  clearcoat={frostGlass.clearcoat}
                  clearcoatRoughness={frostGlass.clearcoatRoughness}
                  transparent
                  opacity={frostGlass.opacity}
                />
              ) : (
                <meshStandardMaterial
                  color="#000000"
                  emissive="#ffaa44"
                  emissiveIntensity={((row * 7 + col * 13) % 10) > 3 ? 0.8 : 0.1}
                />
              )}
            </mesh>
          );
        });
      })}
    </group>
  );
}

/** Bare winter tree */
function BareTree({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.15, 3, 6]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Branches */}
      <mesh position={[0.4, 2.8, 0]} rotation={[0, 0, 0.7]} castShadow>
        <cylinderGeometry args={[0.02, 0.04, 1.2, 4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 2.5, 0.2]} rotation={[0.2, 0, -0.6]} castShadow>
        <cylinderGeometry args={[0.02, 0.03, 1.0, 4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      <mesh position={[0.1, 3.0, -0.3]} rotation={[-0.3, 0, 0.4]} castShadow>
        <cylinderGeometry args={[0.015, 0.025, 0.8, 4]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Snow on branches */}
      <mesh position={[0.5, 3.2, 0]}>
        <sphereGeometry args={[0.1, 6, 4]} />
        <meshStandardMaterial color="#e0e8f0" roughness={0.95} />
      </mesh>
      <mesh position={[-0.35, 2.8, 0.2]}>
        <sphereGeometry args={[0.08, 6, 4]} />
        <meshStandardMaterial color="#e0e8f0" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Winter street lamp */
function WinterLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 2.5, 0]} castShadow>
        <cylinderGeometry args={[0.03, 0.05, 5, 6]} />
        <meshStandardMaterial color="#444" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Lamp arm */}
      <mesh position={[0.3, 4.8, 0]} rotation={[0, 0, 0.4]}>
        <cylinderGeometry args={[0.02, 0.02, 0.7, 4]} />
        <meshStandardMaterial color="#555" metalness={0.6} />
      </mesh>
      {/* Lamp head */}
      <mesh position={[0.5, 4.85, 0]}>
        <boxGeometry args={[0.25, 0.12, 0.18]} />
        <meshStandardMaterial color="#555" metalness={0.6} />
      </mesh>
      {/* Light glow */}
      <mesh position={[0.5, 4.78, 0]}>
        <sphereGeometry args={[0.06, 6, 6]} />
        <meshStandardMaterial color="#ffe8a0" emissive="#ffdd80" emissiveIntensity={2} />
      </mesh>
      {/* Snow on lamp */}
      <mesh position={[0.5, 4.95, 0]}>
        <boxGeometry args={[0.3, 0.06, 0.22]} />
        <meshStandardMaterial color="#e0e8f0" roughness={0.95} />
      </mesh>
    </group>
  );
}

function createWinterGroundTexture(): CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Snow base
  ctx.fillStyle = '#d0d8e8';
  ctx.fillRect(0, 0, size, size);

  // Subtle snow variation
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = Math.random() > 0.5 ? '#e0e8f8' : '#c0c8d8';
    ctx.fillRect(x, y, Math.random() * 30 + 5, Math.random() * 15 + 5);
  }

  // Footprints
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#b0b8c8';
    ctx.beginPath();
    ctx.ellipse(x, y, 4, 7, Math.random() * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1.0;

  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(8, 8);
  return tex;
}
