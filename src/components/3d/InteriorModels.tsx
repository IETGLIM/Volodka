'use client';

/* ─── Volodka RPG – Reusable procedural interior model components ─── */
/* Low-poly furniture, electronics, decorations, and kitchen items     */
/* Each component accepts position, rotation, scale, and color props   */

import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

/* ─── Shared prop types ─── */

interface BaseProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ── FURNITURE ──                                                    */
/* ═══════════════════════════════════════════════════════════════════ */

/** Simple desk with legs and surface */
export function Desk({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#4a3a28' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.4, 0.05, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.375, z]} castShadow>
          <boxGeometry args={[0.04, 0.75, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/** Office chair with seat, back, legs */
export function Chair({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#2a2a30' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.45, 0.05, 0.45]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, -0.2]} castShadow>
        <boxGeometry args={[0.45, 0.45, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.225, z]}>
          <boxGeometry args={[0.03, 0.45, 0.03]} />
          <meshStandardMaterial color="#333" roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Tall shelf with book-like colored boxes */
export function Bookshelf({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a4030' }: BaseProps) {
  const bookColors = ['#8b2020', '#204080', '#208020', '#806020', '#602080', '#804020', '#208080'];
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.8, 2.0, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[0.5, 1.0, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]}>
          <boxGeometry args={[0.78, 0.03, 0.33]} />
          <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}
      {/* Books on shelves */}
      {[0.27, 0.77, 1.27, 1.77].map((y, si) => (
        Array.from({ length: 3 + (si % 2) }).map((_, j) => (
          <mesh key={`b-${si}-${j}`} position={[-0.25 + j * 0.18, y, 0.02]}>
            <boxGeometry args={[0.05, 0.18 + (j % 3) * 0.02, 0.18]} />
            <meshStandardMaterial color={bookColors[(si + j) % bookColors.length]} roughness={0.6} />
          </mesh>
        ))
      ))}
    </group>
  );
}

/** Bed frame with mattress and pillow */
export function Bed({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#2a3040' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[1.0, 0.3, 2.0]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, -0.95]} castShadow>
        <boxGeometry args={[1.0, 0.5, 0.08]} />
        <meshStandardMaterial color="#3a2a20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, -0.7]}>
        <boxGeometry args={[0.5, 0.1, 0.3]} />
        <meshStandardMaterial color="#aaaacc" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.52, 0.2]}>
        <boxGeometry args={[0.9, 0.05, 1.2]} />
        <meshStandardMaterial color="#303050" roughness={0.95} />
      </mesh>
    </group>
  );
}

/** Simple L-shaped couch */
export function Couch({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#4a3020' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main seat */}
      <mesh position={[0, 0.35, 0]} castShadow>
        <boxGeometry args={[2.0, 0.35, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.6, -0.4]} castShadow>
        <boxGeometry args={[2.0, 0.5, 0.15]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* Armrests */}
      <mesh position={[-0.95, 0.5, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.95, 0.5, 0]} castShadow>
        <boxGeometry args={[0.15, 0.3, 0.9]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* L extension */}
      <mesh position={[1.15, 0.35, 0.6]} castShadow>
        <boxGeometry args={[0.9, 0.35, 0.6]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[1.15, 0.6, 0.85]} castShadow>
        <boxGeometry args={[0.9, 0.4, 0.12]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Rectangular table */
export function Table({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a4030' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.2, 0.04, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.04, 0.72, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

/** Tall closet / wardrobe */
export function Wardrobe({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#4a3828' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 1.0, 0]} castShadow>
        <boxGeometry args={[0.8, 2.0, 0.55]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.01, 0]}>
        <boxGeometry args={[0.84, 0.03, 0.58]} />
        <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Door line */}
      <mesh position={[0, 1.0, 0.29]}>
        <boxGeometry args={[0.02, 1.94, 0.01]} />
        <meshStandardMaterial color="#3a2818" />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.08, 1.0, 0.3]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 1.0, 0.3]}>
        <cylinderGeometry args={[0.008, 0.008, 0.1, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Kitchen counter with bar stools */
export function KitchenCounter({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#606060' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Counter body */}
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.5, 0.9, 0.7]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 0.91, 0]}>
        <boxGeometry args={[2.55, 0.03, 0.75]} />
        <meshStandardMaterial color="#888" metalness={0.3} roughness={0.2} />
      </mesh>
      {/* Bar stool 1 */}
      <group position={[-0.7, 0, 0.8]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 8]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      {/* Bar stool 2 */}
      <group position={[0.7, 0, 0.8]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <cylinderGeometry args={[0.15, 0.15, 0.04, 8]} />
          <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
          <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ── ELECTRONICS ──                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

/** Computer monitor on stand with glowing screen */
export function Monitor({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#001122' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.38, 0]} castShadow>
        <boxGeometry args={[0.55, 0.35, 0.03]} />
        <meshStandardMaterial color={color} emissive="#4488ff" emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[0.06, 0.12, 0.06]} />
        <meshStandardMaterial color="#222" metalness={0.6} roughness={0.4} />
      </mesh>
      <pointLight position={[0, 0.35, 0.15]} color="#4488ff" intensity={0.5} distance={3} />
    </group>
  );
}

/** Open laptop with glowing keyboard */
export function Laptop({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#2a2a2a' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.01, 0]} castShadow>
        <boxGeometry args={[0.35, 0.015, 0.25]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Keyboard glow strip */}
      <mesh position={[0, 0.02, 0.02]}>
        <boxGeometry args={[0.28, 0.002, 0.12]} />
        <meshStandardMaterial color="#001122" emissive="#4488cc" emissiveIntensity={0.3} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.15, -0.12]} rotation={[0.2, 0, 0]} castShadow>
        <boxGeometry args={[0.35, 0.25, 0.008]} />
        <meshStandardMaterial color="#001122" emissive="#4488cc" emissiveIntensity={0.6} />
      </mesh>
      <pointLight position={[0, 0.15, 0.05]} color="#4488cc" intensity={0.3} distance={2} />
    </group>
  );
}

/** Flat screen TV on wall mount */
export function TV({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#0a0a0a' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[1.4, 0.8, 0.05]} />
        <meshStandardMaterial color={color} emissive="#111133" emissiveIntensity={0.5} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0, 0.026]}>
        <boxGeometry args={[1.25, 0.65, 0.002]} />
        <meshStandardMaterial color="#001133" emissive="#223366" emissiveIntensity={0.8} />
      </mesh>
      <pointLight position={[0, -0.3, 0.4]} color="#4466aa" intensity={0.8} distance={4} />
    </group>
  );
}

/** Small phone on desk with glowing screen */
export function Phone({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#1a1a1a' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh castShadow>
        <boxGeometry args={[0.07, 0.008, 0.14]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.005, 0]}>
        <boxGeometry args={[0.06, 0.003, 0.12]} />
        <meshStandardMaterial color="#001122" emissive="#3355aa" emissiveIntensity={0.5} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ── DECORATIONS ──                                                  */
/* ═══════════════════════════════════════════════════════════════════ */

/** Desk lamp with point light */
export function Lamp({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#8a7a50' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.06, 0.08, 0.04, 8]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.012, 0.012, 0.35, 6]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 0.38, 0.05]} rotation={[0.2, 0, 0]}>
        <cylinderGeometry args={[0.04, 0.1, 0.1, 8]} />
        <meshStandardMaterial color="#e8d8b0" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, 0.35, 0.05]}>
        <sphereGeometry args={[0.025, 6, 6]} />
        <meshStandardMaterial color="#ffddaa" emissive="#ffcc80" emissiveIntensity={2.0} />
      </mesh>
      <pointLight position={[0, 0.4, 0.05]} color="#ffcc80" intensity={2.5} distance={5} />
    </group>
  );
}

/** Tall floor lamp with light */
export function FloorLamp({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#8a7a50' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 8]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.8, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 1.55, 6]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 1.6, 0]}>
        <cylinderGeometry args={[0.06, 0.15, 0.15, 8]} />
        <meshStandardMaterial color="#e8d8b0" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, 1.55, 0]}>
        <sphereGeometry args={[0.03, 6, 6]} />
        <meshStandardMaterial color="#ffddaa" emissive="#ffcc80" emissiveIntensity={2.5} />
      </mesh>
      <pointLight position={[0, 1.6, 0]} color="#ffcc80" intensity={3.0} distance={6} />
    </group>
  );
}

/** Potted plant (cylinder pot + sphere foliage) */
export function Plant({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#2a6a20' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Pot */}
      <mesh position={[0, 0.12, 0]} castShadow>
        <cylinderGeometry args={[0.08, 0.06, 0.24, 8]} />
        <meshStandardMaterial color="#8a5a3a" roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.23, 0]}>
        <cylinderGeometry args={[0.075, 0.075, 0.01, 8]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.4, 0]}>
        <sphereGeometry args={[0.12, 6, 5]} />
        <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.06, 0.45, 0.04]}>
        <sphereGeometry args={[0.08, 5, 4]} />
        <meshStandardMaterial color="#308028" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Flat rectangle on floor with color */
export function Rug({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#4a3040' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2.0, 1.5]} />
        <meshStandardMaterial color={color} roughness={0.95} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} />
      </mesh>
      {/* Border */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]}>
        <planeGeometry args={[1.85, 1.35]} />
        <meshStandardMaterial color={color} roughness={0.95} polygonOffset polygonOffsetFactor={1} polygonOffsetUnits={1} emissive={color} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

/** Frame on wall */
export function Picture({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a3a20' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <boxGeometry args={[0.4, 0.5, 0.02]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.011]}>
        <planeGeometry args={[0.32, 0.4]} />
        <meshStandardMaterial color="#8a7a60" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Wall clock */
export function Clock({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#f0f0f0' }: BaseProps) {
  const timeRef = useRef(0);
  useFrame((_, delta) => {
    timeRef.current += delta;
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <cylinderGeometry args={[0.2, 0.2, 0.03, 16]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
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
    </group>
  );
}

/** Window frame with emissive "sky" plane */
export function Window({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#3366dd' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <planeGeometry args={[1.2, 1.0]} />
        <meshStandardMaterial color="#0a0a30" emissive={color} emissiveIntensity={2.5} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0, 0.01]}>
        <boxGeometry args={[0.05, 1.05, 1.25]} />
        <meshStandardMaterial color="#444" roughness={0.7} />
      </mesh>
      {/* Cross bars */}
      <mesh position={[0.01, 0, 0]}>
        <boxGeometry args={[0.04, 1.0, 0.03]} />
        <meshStandardMaterial color="#444" roughness={0.7} />
      </mesh>
      <mesh position={[0.01, 0, 0]}>
        <boxGeometry args={[0.03, 0.03, 1.2]} />
        <meshStandardMaterial color="#444" roughness={0.7} />
      </mesh>
      <pointLight position={[0, 0, 0.5]} color={color} intensity={1.0} distance={4} />
    </group>
  );
}

/** Door frame with door */
export function Door({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a4030' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Door panel */}
      <mesh position={[0, 1.1, 0]}>
        <boxGeometry args={[0.9, 2.15, 0.04]} />
        <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Frame sides */}
      <mesh position={[-0.48, 1.1, 0]}>
        <boxGeometry args={[0.05, 2.2, 0.06]} />
        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      <mesh position={[0.48, 1.1, 0]}>
        <boxGeometry args={[0.05, 2.2, 0.06]} />
        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      {/* Frame top */}
      <mesh position={[0, 2.2, 0]}>
        <boxGeometry args={[1.0, 0.05, 0.06]} />
        <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.32, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 0.08, 6]} />
        <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}

/** Wall-mounted radiator / heater */
export function Radiator({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#c8c8c8' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Main body */}
      <mesh position={[0, 0.3, 0]} castShadow>
        <boxGeometry args={[0.8, 0.5, 0.1]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Fins */}
      {[-0.32, -0.22, -0.12, -0.02, 0.08, 0.18, 0.28].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0.051]}>
          <boxGeometry args={[0.02, 0.48, 0.003]} />
          <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, 0.56, 0.02]}>
        <boxGeometry args={[0.8, 0.02, 0.06]} />
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Control knobs */}
      <mesh position={[0.35, 0.15, 0.06]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 6]} />
        <meshStandardMaterial color="#fff" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.35, 0.25, 0.06]}>
        <cylinderGeometry args={[0.012, 0.012, 0.02, 6]} />
        <meshStandardMaterial color="#fff" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ── CAFE-SPECIFIC ──                                                */
/* ═══════════════════════════════════════════════════════════════════ */

/** Espresso machine */
export function CoffeeMachine({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#2a2a2e' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.15, 0]} castShadow>
        <boxGeometry args={[0.3, 0.3, 0.25]} />
        <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 0.14]}>
        <boxGeometry args={[0.08, 0.02, 0.04]} />
        <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.12, 0.2, 0.13]}>
        <sphereGeometry args={[0.008, 4, 4]} />
        <meshStandardMaterial color="#ff3333" emissive="#ff3333" emissiveIntensity={2.0} />
      </mesh>
    </group>
  );
}

/** Glass display case for pastries */
export function PastryCase({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#d0c8b0' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.4, 0]} castShadow>
        <boxGeometry args={[1.0, 0.8, 0.5]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Glass top */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[1.02, 0.5, 0.52]} />
        <meshStandardMaterial color="#c0d0e0" transparent opacity={0.2} metalness={0.1} roughness={0.05} />
      </mesh>
      {/* Pastry shapes inside */}
      <mesh position={[-0.25, 0.65, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.04, 8]} />
        <meshStandardMaterial color="#c8a050" roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.65, 0.05]}>
        <cylinderGeometry args={[0.05, 0.05, 0.03, 8]} />
        <meshStandardMaterial color="#8a4020" roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.65, -0.05]}>
        <boxGeometry args={[0.1, 0.04, 0.06]} />
        <meshStandardMaterial color="#d0a060" roughness={0.8} />
      </mesh>
    </group>
  );
}

/** Small round cafe table with 2 chairs */
export function CafeTable({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a4030' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      {/* Round table top */}
      <mesh position={[0, 0.7, 0]} castShadow>
        <cylinderGeometry args={[0.4, 0.4, 0.04, 8]} />
        <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.7, 6]} />
        <meshStandardMaterial color="#3a2818" roughness={0.7} />
      </mesh>
      {/* Chair 1 */}
      <group position={[-0.55, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.38, 0.04, 0.38]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, -0.17]} castShadow>
          <boxGeometry args={[0.38, 0.45, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
      {/* Chair 2 */}
      <group position={[0.55, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow>
          <boxGeometry args={[0.38, 0.04, 0.38]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, 0.17]} castShadow>
          <boxGeometry args={[0.38, 0.45, 0.04]} />
          <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
    </group>
  );
}

/* ═══════════════════════════════════════════════════════════════════ */
/* ── KITCHEN ──                                                      */
/* ═══════════════════════════════════════════════════════════════════ */

/** 4-burner stove */
export function Stove({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#3a3a3a' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.7, 0.9, 0.65]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.91, 0]}>
        <boxGeometry args={[0.72, 0.02, 0.67]} />
        <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Burner rings */}
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.93, z]} rotation-x={-Math.PI / 2}>
          <torusGeometry args={[0.06, 0.008, 6, 16]} />
          <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Oven door */}
      <mesh position={[0, 0.3, 0.33]}>
        <boxGeometry args={[0.6, 0.45, 0.02]} />
        <meshStandardMaterial color="#333" metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Refrigerator */
export function Fridge({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#c8c8c8' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.68, 1.78, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.81, 0]}>
        <boxGeometry args={[0.72, 0.03, 0.72]} />
        <meshStandardMaterial color="#bbb" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Freezer door line */}
      <mesh position={[0, 1.3, 0.26]}>
        <boxGeometry args={[0.64, 0.02, 0.005]} />
        <meshStandardMaterial color="#aaa" metalness={0.3} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.3, 0.9, 0.27]}>
        <boxGeometry args={[0.02, 0.25, 0.04]} />
        <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
    </group>
  );
}

/** Kitchen sink */
export function Sink({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#707070' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.6, 0.1, 0.5]} />
        <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Faucet */}
      <mesh position={[0, 0.25, -0.2]}>
        <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
        <meshStandardMaterial color="#bbb" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Faucet spout */}
      <mesh position={[0, 0.42, -0.08]} rotation={[0.5, 0, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.15, 6]} />
        <meshStandardMaterial color="#bbb" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
