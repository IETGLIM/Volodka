
/* ─── Volodka RPG – IT Guild Office procedural 3D visual ─── */

import { useEffect, useMemo, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { Plant, Radiator, Clock } from './lazyInteriorModels';
import { getEnvironmentLodProfile } from '@/engine/lod/distanceLod';
import { useEnvironmentLod } from './lod/EnvironmentLodProvider';
import { EnvironmentDetail, SceneClutterGate } from './lod/PropDistanceGate';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';

interface OfficeDayVisualProps {
  livePlayerPositionRef?: MutableRefObject<THREE.Vector3>;
}

/** Sterile corporate IT office (14×12m) — CyberPunk2077/Bank aesthetic */
export function OfficeDayVisual({ livePlayerPositionRef }: OfficeDayVisualProps) {
  const floorTexture = useCachedCanvasTexture('office_day:floor', createOfficeFloorTexture);
  const wallTexture = useCachedCanvasTexture('office_day:wall', createOfficeWallTexture);
  const { lod } = useEnvironmentLod();
  const envProfile = useMemo(() => getEnvironmentLodProfile('office_day'), []);

  const W = 14;
  const D = 12;
  const H = 3.2;

  // Shared geometry/materials for the ceiling light panel grid (12 panels)
  const lightPanel = useMemo(() => {
    const housingGeo = new THREE.BoxGeometry(2.4, 0.06, 0.34);
    const tubeGeo = new THREE.BoxGeometry(2.3, 0.03, 0.1);
    const housingMat = new THREE.MeshStandardMaterial({ color: '#aab2bc', metalness: 0.3, roughness: 0.6 });
    const tubeMat = new THREE.MeshStandardMaterial({ color: '#e8f0f8', emissive: '#f4faff', emissiveIntensity: 1.6 });
    const positions: [number, number][] = [];
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      for (const z of [-3.5, 0, 3.5]) positions.push([x, z]);
    }
    return { housingGeo, tubeGeo, housingMat, tubeMat, positions };
  }, []);

  useEffect(() => {
    return () => {
      lightPanel.housingGeo.dispose();
      lightPanel.tubeGeo.dispose();
      lightPanel.housingMat.dispose();
      lightPanel.tubeMat.dispose();
    };
  }, [lightPanel]);

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#c8d0d8"
          roughness={0.6}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#e0e8f0" roughness={0.9} />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#d0d8e0" roughness={0.7} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#d0d8e0" roughness={0.7} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#d0d8e0" roughness={0.7} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#d0d8e0" roughness={0.7} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ROWS OF DESKS WITH MONITORS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Row 1 - left side */}
      <OfficeDesk position={[-4.5, 0, -3.5]} />
      <OfficeDesk position={[-4.5, 0, -1.0]} />
      <OfficeDesk position={[-4.5, 0, 1.5]} />

      {/* Row 2 - center-left */}
      <OfficeDesk position={[-1.5, 0, -3.5]} />
      <OfficeDesk position={[-1.5, 0, -1.0]} />
      <OfficeDesk position={[-1.5, 0, 1.5]} />

      {/* Row 3 - center-right */}
      <OfficeDesk position={[1.5, 0, -3.5]} />
      <OfficeDesk position={[1.5, 0, -1.0]} />
      <OfficeDesk position={[1.5, 0, 1.5]} />

      {/* Row 4 - right side */}
      <OfficeDesk position={[4.5, 0, -3.5]} />
      <OfficeDesk position={[4.5, 0, -1.0]} />
      <OfficeDesk position={[4.5, 0, 1.5]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SERVER RACKS (back wall) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ServerRack position={[-5.5, 0, -5.5]} />
      <ServerRack position={[-4.0, 0, -5.5]} />
      <ServerRack position={[4.0, 0, -5.5]} />
      <ServerRack position={[5.5, 0, -5.5]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── GLASS MEETING ROOM (front-right) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[4.5, 0, 4.0]}>
        {/* Glass walls */}
        <mesh position={[0, H / 2, -1.5]} castShadow>
          <boxGeometry args={[3.0, H, 0.05]} />
          <meshStandardMaterial color="#b0c0d0" transparent opacity={0.25} metalness={0.1} roughness={0.05} />
        </mesh>
        <mesh position={[1.5, H / 2, 0]} castShadow>
          <boxGeometry args={[0.05, H, 3.0]} />
          <meshStandardMaterial color="#b0c0d0" transparent opacity={0.25} metalness={0.1} roughness={0.05} />
        </mesh>
        {/* Conference table */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[2.0, 0.05, 1.0]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.4} />
        </mesh>
        {/* Chairs around table */}
        {[-0.7, 0, 0.7].map((z, i) => (
          <mesh key={i} position={[-0.6, 0.25, z]}>
            <boxGeometry args={[0.4, 0.05, 0.4]} />
            <meshStandardMaterial color="#3a3a4a" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CORPORATE LOGO WALL (back center) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 2.0, -D / 2 + 0.05]}>
        <mesh>
          <boxGeometry args={[2.0, 0.5, 0.05]} />
          <meshStandardMaterial color="#001a22" emissive="#0088aa" emissiveIntensity={0.6} />
        </mesh>
        {/* Logo frame */}
        <mesh position={[0, 0, 0.01]}>
          <boxGeometry args={[2.2, 0.7, 0.02]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WATER COOLER (front-left) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
        <SceneClutterGate
          livePlayerPositionRef={livePlayerPositionRef}
          position={[-5.5, 0, 4.0]}
          maxDistance={envProfile.clutterDistance}
        >
          <group position={[0, 0, 0]}>
            <mesh position={[0, 0.6, 0]} castShadow>
              <boxGeometry args={[0.4, 1.2, 0.4]} />
              <meshStandardMaterial color="#d0d0d0" metalness={0.3} roughness={0.4} />
            </mesh>
            <mesh position={[0, 1.4, 0]}>
              <cylinderGeometry args={[0.15, 0.18, 0.4, 8]} />
              <meshStandardMaterial color="#a0d0e0" transparent opacity={0.5} roughness={0.1} />
            </mesh>
          </group>
        </SceneClutterGate>
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── POTTED PLANTS (dying) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <EnvironmentDetail currentLod={lod} minLod="standard">
        {([
          [-6.5, 0, -2.0],
          [6.5, 0, -2.0],
          [-6.5, 0, 3.0],
        ] as const).map(([x, y, z]) => (
          <SceneClutterGate
            key={`plant-${x}-${z}`}
            livePlayerPositionRef={livePlayerPositionRef}
            position={[x, y, z]}
            maxDistance={envProfile.decorativeDistance}
          >
            <DyingPlant position={[0, 0, 0]} />
          </SceneClutterGate>
        ))}
      </EnvironmentDetail>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CEILING FLUORESCENT PANEL GRID ── */}
      {/* ═══════════════════════════════════════════════ */}
      {/* Emissive-only meshes — scene lighting already comes from point lights */}
      {lightPanel.positions.map(([x, z], i) => (
        <group key={`flpanel-${i}`} position={[x, H - 0.04, z]}>
          {/* Recessed housing frame */}
          <mesh geometry={lightPanel.housingGeo} material={lightPanel.housingMat} />
          {/* Twin glowing tube strips */}
          <mesh geometry={lightPanel.tubeGeo} material={lightPanel.tubeMat} position={[0, -0.025, -0.08]} />
          <mesh geometry={lightPanel.tubeGeo} material={lightPanel.tubeMat} position={[0, -0.025, 0.08]} />
        </group>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Harsh white overhead */}
      <pointLight position={[0, 2.8, 0]} color="#e0e8f0" intensity={3.5} distance={16} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} shadow-normalBias={0.04} />

      {/* Blue monitor glow */}
      <pointLight position={[-3, 1.2, -1.0]} color="#4488ff" intensity={2.0} distance={8} />

      {/* Server rack red LEDs */}
      <pointLight position={[5.0, 1.0, -5.5]} color="#ff2244" intensity={1.0} distance={6} />

      {/* Meeting room light */}
      <pointLight position={[4.5, 2.5, 4.0]} color="#ffffff" intensity={1.5} distance={6} />

      {/* Corporate logo glow */}
      <pointLight position={[0, 2.0, -5.5]} color="#0088aa" intensity={1.2} distance={7} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Post-it notes on cubicle dividers ── */}
      {[[-3.5, 1.2, -3.5], [-1.5, 1.15, -1.0], [1.5, 1.18, 1.5], [4.5, 1.22, -3.5]].map((pos, i) => (
        <mesh key={`postit-${i}`} position={pos as [number, number, number]} rotation={[0, Math.random() * 0.3 - 0.15, 0.05]}>
          <planeGeometry args={[0.05, 0.05]} />
          <meshStandardMaterial color={['#ffdd44', '#ff8888', '#88ddff', '#88ff88'][i]} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ── Coffee mug graveyard on desk ── */}
      <group position={[-4.5, 0, -3.5]}>
        <mesh position={[0.4, 0.78, 0.2]}>
          <cylinderGeometry args={[0.035, 0.03, 0.08, 8]} />
          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
        <mesh position={[0.35, 0.78, 0.25]}>
          <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.5} />
        </mesh>
        <mesh position={[0.45, 0.76, 0.15]} rotation={[0.2, 0, 0.3]}>
          <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} />
          <meshStandardMaterial color="#8a4a4a" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Whiteboard with writing ── */}
      <group position={[-W / 2 + 0.02, 1.8, 0]} rotation-y={Math.PI / 2}>
        <mesh>
          <planeGeometry args={[2.0, 1.2]} />
          <meshStandardMaterial color="#e8e8e8" roughness={0.3} />
        </mesh>
        {/* Colored marker lines */}
        <mesh position={[0, 0.2, 0.01]}>
          <planeGeometry args={[1.2, 0.03]} />
          <meshStandardMaterial color="#cc2222" roughness={0.9} />
        </mesh>
        <mesh position={[-0.3, -0.1, 0.01]}>
          <planeGeometry args={[0.8, 0.03]} />
          <meshStandardMaterial color="#2222cc" roughness={0.9} />
        </mesh>
        <mesh position={[0.1, -0.4, 0.01]}>
          <planeGeometry args={[0.5, 0.03]} />
          <meshStandardMaterial color="#22aa22" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Paper stack on desk ── */}
      <group position={[1.5, 0, 1.5]}>
        <mesh position={[0.5, 0.76, 0.25]} rotation={[0, 0.05, 0]}>
          <boxGeometry args={[0.15, 0.015, 0.2]} />
          <meshStandardMaterial color="#e8e4dc" roughness={0.9} />
        </mesh>
        <mesh position={[0.5, 0.77, 0.25]} rotation={[0, -0.02, 0.01]}>
          <boxGeometry args={[0.14, 0.01, 0.19]} />
          <meshStandardMaterial color="#f0ece4" roughness={0.9} />
        </mesh>
      </group>

      {/* ── Server blinking lights (additional tiny emissive cubes) ── */}
      {[0.5, 0.9, 1.3, 1.7].map((y, i) => (
        <mesh key={`srv-blink-${i}`} position={[5.9, y, -5.19]}>
          <boxGeometry args={[0.015, 0.015, 0.01]} />
          <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={2.0} />
        </mesh>
      ))}

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL OFFICE DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Cubicle dividers between desk rows ── */}
      {[
        // Between row 1 and row 2 (left side)
        { pos: [-3.0, 0, -2.25] as [number, number, number], rot: 0 },
        { pos: [-3.0, 0, 0.25] as [number, number, number], rot: 0 },
        // Between row 3 and row 4 (right side)
        { pos: [3.0, 0, -2.25] as [number, number, number], rot: 0 },
        { pos: [3.0, 0, 0.25] as [number, number, number], rot: 0 },
        // Along row 2 (center-left) backs
        { pos: [-1.5, 0, -2.25] as [number, number, number], rot: 0 },
        // Along row 3 (center-right) backs
        { pos: [1.5, 0, -2.25] as [number, number, number], rot: 0 },
      ].map((div, i) => (
        <group key={`divider-${i}`} position={div.pos} rotation={[0, div.rot, 0]}>
          {/* Divider panel */}
          <mesh position={[0, 0.75, 0]} castShadow>
            <boxGeometry args={[1.4, 0.8, 0.03]} />
            <meshStandardMaterial color="#5a5a6a" roughness={0.8} />
          </mesh>
          {/* Divider top rail */}
          <mesh position={[0, 1.16, 0]}>
            <boxGeometry args={[1.42, 0.025, 0.035]} />
            <meshStandardMaterial color="#4a4a5a" metalness={0.3} roughness={0.5} />
          </mesh>
        </group>
      ))}

      {/* ── Printer/copier in corner ── */}
      <group position={[-6.0, 0, 2.0]}>
        {/* Printer body */}
        <mesh position={[0, 0.35, 0]} castShadow>
          <boxGeometry args={[0.5, 0.7, 0.5]} />
          <meshStandardMaterial color="#e0e0e0" roughness={0.6} />
        </mesh>
        {/* Paper tray top */}
        <mesh position={[0, 0.72, 0.15]}>
          <boxGeometry args={[0.4, 0.02, 0.25]} />
          <meshStandardMaterial color="#ccc" roughness={0.5} />
        </mesh>
        {/* Paper output tray */}
        <mesh position={[0, 0.5, 0.28]}>
          <boxGeometry args={[0.35, 0.01, 0.15]} />
          <meshStandardMaterial color="#bbb" roughness={0.5} />
        </mesh>
        {/* Paper sheet in output */}
        <mesh position={[0, 0.52, 0.28]} rotation={[0, 0.05, 0]}>
          <boxGeometry args={[0.18, 0.003, 0.12]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.9} />
        </mesh>
        {/* Status LED */}
        <mesh position={[0.2, 0.55, 0.26]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshStandardMaterial color="#00aa00" emissive="#00aa00" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* ── Wall clock (back wall) ── */}
      <group position={[0, 2.8, -D / 2 + 0.05]}>
        {/* Clock face */}
        <mesh>
          <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
          <meshStandardMaterial color="#f0f0f0" roughness={0.4} />
        </mesh>
        {/* Clock frame */}
        <mesh position={[0, 0, 0.01]}>
          <torusGeometry args={[0.2, 0.015, 8, 24]} />
          <meshStandardMaterial color="#4a4a5a" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Hour hand */}
        <mesh position={[0, 0, 0.02]} rotation={[0, 0, -Math.PI / 3]}>
          <boxGeometry args={[0.1, 0.012, 0.005]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Minute hand */}
        <mesh position={[0, 0, 0.025]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.14, 0.008, 0.005]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Center dot */}
        <mesh position={[0, 0, 0.03]}>
          <sphereGeometry args={[0.008, 6, 6]} />
          <meshStandardMaterial color="#aa2222" />
        </mesh>
      </group>

      {/* ── Bulletin board on right wall ── */}
      <group position={[W / 2 - 0.02, 1.8, 3.0]} rotation-y={-Math.PI / 2}>
        {/* Board */}
        <mesh>
          <boxGeometry args={[1.2, 0.9, 0.03]} />
          <meshStandardMaterial color="#8a6a3a" roughness={0.9} />
        </mesh>
        {/* Pinned papers */}
        {[-0.3, 0.0, 0.25].map((x, i) => (
          <mesh key={`pin-paper-${i}`} position={[x, 0.1 - i * 0.12, 0.02]} rotation={[0, 0.1 - i * 0.05, 0]}>
            <boxGeometry args={[0.2, 0.15, 0.002]} />
            <meshStandardMaterial color={['#e8e4dc', '#f0ece4', '#ddd8cc'][i]} roughness={0.9} />
          </mesh>
        ))}
        {/* Push pins */}
        {[-0.3, 0.0, 0.25].map((x, i) => (
          <mesh key={`pin-${i}`} position={[x, 0.17 - i * 0.12, 0.03]}>
            <sphereGeometry args={[0.008, 4, 4]} />
            <meshStandardMaterial color={['#ff3333', '#3366ff', '#ffcc00'][i]} />
          </mesh>
        ))}
      </group>

      {/* ── Coffee station area ── */}
      <group position={[-5.5, 0, 4.5]}>
        {/* Small counter/table */}
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.8, 0.04, 0.5]} />
          <meshStandardMaterial color="#4a4a5a" roughness={0.5} />
        </mesh>
        {/* Counter legs */}
        {[-0.35, 0.35].map((x, i) => (
          <mesh key={`cleg-${i}`} position={[x, 0.2, 0]}>
            <boxGeometry args={[0.04, 0.4, 0.04]} />
            <meshStandardMaterial color="#3a3a4a" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
        {/* Coffee machine */}
        <mesh position={[-0.15, 0.6, 0]} castShadow>
          <boxGeometry args={[0.2, 0.25, 0.2]} />
          <meshStandardMaterial color="#2a2a2e" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Coffee machine display */}
        <mesh position={[-0.15, 0.65, 0.105]}>
          <boxGeometry args={[0.1, 0.05, 0.005]} />
          <meshStandardMaterial color="#003300" emissive="#00aa44" emissiveIntensity={1.0} />
        </mesh>
        {/* Mug collection on counter */}
        <mesh position={[0.15, 0.46, 0.05]}>
          <cylinderGeometry args={[0.03, 0.025, 0.07, 8]} />
          <meshStandardMaterial color="#e8e0d8" roughness={0.5} />
        </mesh>
        <mesh position={[0.25, 0.46, -0.05]}>
          <cylinderGeometry args={[0.028, 0.024, 0.065, 8]} />
          <meshStandardMaterial color="#f0e8e0" roughness={0.5} />
        </mesh>
        {/* Sugar bowl */}
        <mesh position={[0.05, 0.44, -0.12]}>
          <cylinderGeometry args={[0.035, 0.03, 0.05, 8]} />
          <meshStandardMaterial color="#ffffff" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Umbrella stand near entrance ── */}
      <group position={[6.0, 0, 5.0]}>
        <mesh position={[0, 0.25, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.1, 0.5, 8]} />
          <meshStandardMaterial color="#2a2a30" metalness={0.4} roughness={0.6} />
        </mesh>
        {/* Umbrella handles sticking out */}
        <mesh position={[0.03, 0.55, 0]} rotation={[0.15, 0, 0.1]}>
          <cylinderGeometry args={[0.008, 0.008, 0.5, 4]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>
        <mesh position={[-0.04, 0.5, 0.02]} rotation={[-0.1, 0.3, -0.08]}>
          <cylinderGeometry args={[0.006, 0.006, 0.45, 4]} />
          <meshStandardMaterial color="#8b2020" roughness={0.7} />
        </mesh>
      </group>

      {/* ── Headphones on desk ── */}
      <group position={[-1.5, 0, -1.0]}>
        {/* Headband */}
        <mesh position={[0.55, 0.85, 0.15]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.06, 0.006, 4, 12, Math.PI]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.7} />
        </mesh>
        {/* Left ear cup */}
        <mesh position={[0.49, 0.8, 0.15]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
        {/* Right ear cup */}
        <mesh position={[0.61, 0.8, 0.15]} rotation={[0, Math.PI / 2, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 0.025, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
      </group>

      {/* ── More sticky notes cluster on divider ── */}
      {[
        { pos: [-3.0, 1.0, -2.2] as [number, number, number], color: '#ffff88', rot: 0.1 },
        { pos: [-3.0, 1.15, -2.2] as [number, number, number], color: '#ffaaaa', rot: -0.05 },
        { pos: [-3.0, 1.05, -2.3] as [number, number, number], color: '#aaffaa', rot: 0.15 },
        { pos: [3.0, 1.1, -2.2] as [number, number, number], color: '#88ddff', rot: -0.1 },
        { pos: [3.0, 0.95, -2.3] as [number, number, number], color: '#ffdd44', rot: 0.08 },
      ].map((note, i) => (
        <mesh key={`extra-postit-${i}`} position={note.pos} rotation={[0, 0, note.rot]}>
          <planeGeometry args={[0.06, 0.06]} />
          <meshStandardMaterial color={note.color} roughness={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* ── Phone on desk ── */}
      <group position={[1.5, 0, -3.5]}>
        <mesh position={[-0.45, 0.76, -0.2]}>
          <boxGeometry args={[0.06, 0.008, 0.12]} />
          <meshStandardMaterial color="#1a1a1a" roughness={0.6} />
        </mesh>
        {/* Phone screen */}
        <mesh position={[-0.45, 0.765, -0.2]}>
          <boxGeometry args={[0.05, 0.003, 0.08]} />
          <meshStandardMaterial color="#001133" emissive="#4466aa" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* ── Ceiling vent ── */}
      <group position={[5.0, H - 0.02, 2.0]} rotation-x={Math.PI / 2}>
        <mesh>
          <planeGeometry args={[0.6, 0.3]} />
          <meshStandardMaterial color="#c0c8d0" roughness={0.8} />
        </mesh>
        {/* Vent slats */}
        {[-0.1, -0.03, 0.04, 0.11].map((y, i) => (
          <mesh key={`vent-${i}`} position={[0, y, 0.001]}>
            <boxGeometry args={[0.55, 0.015, 0.003]} />
            <meshStandardMaterial color="#b0b8c0" roughness={0.7} />
          </mesh>
        ))}
      </group>

      {/* ── Emergency exit sign ── */}
      <group position={[6.5, 2.6, 5.5]} rotation-y={-Math.PI / 4}>
        <mesh>
          <boxGeometry args={[0.3, 0.12, 0.03]} />
          <meshStandardMaterial color="#003300" emissive="#00aa00" emissiveIntensity={1.5} />
        </mesh>
        {/* Sign light spill */}
        <pointLight position={[0, -0.2, 0.3]} color="#00aa00" intensity={0.5} distance={3} />
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── INTERIOR MODELS (from InteriorModels.tsx) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Radiator on right wall ── */}
      <Radiator position={[W / 2 - 0.06, 0.3, -3.0]} rotation={[0, -Math.PI / 2, 0]} color="#c0c0c0" />

      {/* ── Radiator on left wall ── */}
      <Radiator position={[-W / 2 + 0.06, 0.3, 1.0]} rotation={[0, Math.PI / 2, 0]} color="#c0c0c0" />

      {/* ── Additional healthy plants in meeting room ── */}
      <Plant position={[5.5, 0, 2.5]} color="#2a6a20" scale={[1.4, 1.4, 1.4]} />

      {/* ── Additional plant in entrance area ── */}
      <Plant position={[-6.5, 0, 5.0]} color="#308028" scale={[1.2, 1.2, 1.2]} />

      {/* ── Wall clock on front wall ── */}
      <Clock position={[3.0, 2.5, D / 2 - 0.05]} rotation={[0, Math.PI, 0]} color="#e8e8e8" />
    </group>
  );
}

/** Office desk with emissive blue monitor */
function OfficeDesk({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Desk top */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.04, 0.7]} />
        <meshStandardMaterial color="#4a4a5a" roughness={0.5} />
      </mesh>
      {/* Leg panel left */}
      <mesh position={[-0.65, 0.35, 0]}>
        <boxGeometry args={[0.04, 0.7, 0.65]} />
        <meshStandardMaterial color="#3a3a4a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Leg panel right */}
      <mesh position={[0.65, 0.35, 0]}>
        <boxGeometry args={[0.04, 0.7, 0.65]} />
        <meshStandardMaterial color="#3a3a4a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Monitor */}
      <mesh position={[0, 1.1, -0.15]} castShadow>
        <boxGeometry args={[0.55, 0.35, 0.03]} />
        <meshStandardMaterial color="#001122" emissive="#4488ff" emissiveIntensity={1.0} />
      </mesh>
      {/* Monitor stand */}
      <mesh position={[0, 0.85, -0.15]}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshStandardMaterial color="#333" metalness={0.6} />
      </mesh>
      {/* Keyboard */}
      <mesh position={[0, 0.75, 0.15]}>
        <boxGeometry args={[0.35, 0.015, 0.12]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Mouse */}
      <mesh position={[0.3, 0.75, 0.15]}>
        <boxGeometry args={[0.06, 0.015, 0.1]} />
        <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Chair */}
      <group position={[0, 0, 0.6]}>
        <mesh position={[0, 0.42, 0]} castShadow>
          <boxGeometry args={[0.45, 0.04, 0.45]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.7, -0.2]} castShadow>
          <boxGeometry args={[0.45, 0.45, 0.04]} />
          <meshStandardMaterial color="#2a2a3a" roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
}

/** Server rack with blinking LEDs */
function ServerRack({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Main rack body */}
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.8, 2.0, 0.6]} />
        <meshStandardMaterial color="#2a2a30" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Server units */}
      {[0.3, 0.7, 1.1, 1.5, 1.8].map((y, i) => (
        <mesh key={i} position={[0, y, 0.31]}>
          <boxGeometry args={[0.7, 0.12, 0.01]} />
          <meshStandardMaterial color="#3a3a40" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      {/* LED indicators (red dots) */}
      {[0.3, 0.7, 1.1].map((y, i) => (
        <mesh key={`led-${i}`} position={[0.3, y + 0.04, 0.32]}>
          <boxGeometry args={[0.02, 0.02, 0.01]} />
          <meshStandardMaterial color="#ff2244" emissive="#ff2244" emissiveIntensity={2.0} />
        </mesh>
      ))}
      {/* Green status LED */}
      <mesh position={[-0.3, 1.84, 0.32]}>
        <boxGeometry args={[0.02, 0.02, 0.01]} />
        <meshStandardMaterial color="#00ff44" emissive="#00ff44" emissiveIntensity={1.5} />
      </mesh>
    </group>
  );
}

/** Dying potted plant */
function DyingPlant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Pot */}
      <mesh position={[0, 0.2, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.15, 0.4, 8]} />
        <meshStandardMaterial color="#6a4a30" roughness={0.8} />
      </mesh>
      {/* Dying stems */}
      <mesh position={[0, 0.5, 0]}>
        <cylinderGeometry args={[0.01, 0.015, 0.3, 4]} />
        <meshStandardMaterial color="#4a5a2a" roughness={0.9} />
      </mesh>
      <mesh position={[0.05, 0.55, 0.03]} rotation={[0.2, 0, 0.3]}>
        <cylinderGeometry args={[0.008, 0.01, 0.2, 4]} />
        <meshStandardMaterial color="#3a4a1a" roughness={0.9} />
      </mesh>
      {/* Few sad leaves */}
      <mesh position={[0, 0.65, 0]}>
        <sphereGeometry args={[0.08, 6, 6]} />
        <meshStandardMaterial color="#3a4a1a" roughness={0.9} />
      </mesh>
    </group>
  );
}

function createOfficeFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Light tile base
  ctx.fillStyle = '#c8d0d8';
  ctx.fillRect(0, 0, size, size);

  // Grid tile pattern
  ctx.strokeStyle = '#b0b8c0';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 64) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i, size);
    ctx.stroke();
  }

  // Subtle scuff marks
  ctx.globalAlpha = 0.03;
  for (let i = 0; i < 20; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.fillStyle = '#888';
    ctx.fillRect(x, y, Math.random() * 30 + 5, 2);
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(7, 6);
  return tex;
}

function createOfficeWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Clean white wall
  ctx.fillStyle = '#d0d8e0';
  ctx.fillRect(0, 0, size, size);

  // Subtle panel lines
  ctx.strokeStyle = '#c0c8d0';
  ctx.lineWidth = 0.5;
  for (let i = 0; i < size; i += 128) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  return tex;
}
