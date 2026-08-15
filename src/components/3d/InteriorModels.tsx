
/* ─── Volodka RPG – Reusable procedural interior model components ─── */
/* Low-poly furniture, electronics, decorations, and kitchen items     */
/* Each component accepts position, rotation, scale, and color props   */

import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { BoxGeometry, CylinderGeometry, DoubleSide, PlaneGeometry, SphereGeometry, TorusGeometry } from 'three';
import { registerModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
/* ─── Shared geometries (module-level, reused across renders) ─── */

const geo_box_1 = new BoxGeometry(1.4, 0.05, 0.7);
const geo_box_2 = new BoxGeometry(0.04, 0.75, 0.04);
const geo_box_3 = new BoxGeometry(0.45, 0.05, 0.45);
const geo_box_4 = new BoxGeometry(0.45, 0.45, 0.04);
const geo_box_5 = new BoxGeometry(0.03, 0.45, 0.03);
const geo_box_6 = new BoxGeometry(0.8, 2, 0.35);
const geo_box_7 = new BoxGeometry(0.78, 0.03, 0.33);
const geo_box_8 = new BoxGeometry(1, 0.3, 2);
const geo_box_9 = new BoxGeometry(1, 0.5, 0.08);
const geo_box_10 = new BoxGeometry(0.5, 0.1, 0.3);
const geo_box_11 = new BoxGeometry(0.9, 0.05, 1.2);
const geo_box_12 = new BoxGeometry(2, 0.35, 0.9);
const geo_box_13 = new BoxGeometry(2, 0.5, 0.15);
const geo_box_14 = new BoxGeometry(0.15, 0.3, 0.9);
const geo_box_15 = new BoxGeometry(0.9, 0.35, 0.6);
const geo_box_16 = new BoxGeometry(0.9, 0.4, 0.12);
const geo_box_17 = new BoxGeometry(1.2, 0.04, 0.7);
const geo_box_18 = new BoxGeometry(0.04, 0.72, 0.04);
const geo_box_19 = new BoxGeometry(0.8, 2, 0.55);
const geo_box_20 = new BoxGeometry(0.84, 0.03, 0.58);
const geo_box_21 = new BoxGeometry(0.02, 1.94, 0.01);
const geo_cyl_22 = new CylinderGeometry(0.008, 0.008, 0.1, 6);
const geo_box_23 = new BoxGeometry(2.5, 0.9, 0.7);
const geo_box_24 = new BoxGeometry(2.55, 0.03, 0.75);
const geo_cyl_25 = new CylinderGeometry(0.15, 0.15, 0.04, 8);
const geo_cyl_26 = new CylinderGeometry(0.02, 0.02, 0.4, 6);
const geo_box_27 = new BoxGeometry(0.55, 0.35, 0.03);
const geo_box_28 = new BoxGeometry(0.06, 0.12, 0.06);
const geo_box_29 = new BoxGeometry(0.35, 0.015, 0.25);
const geo_box_30 = new BoxGeometry(0.28, 0.002, 0.12);
const geo_box_31 = new BoxGeometry(0.35, 0.25, 0.008);
const geo_box_32 = new BoxGeometry(1.4, 0.8, 0.05);
const geo_box_33 = new BoxGeometry(1.25, 0.65, 0.002);
const geo_box_34 = new BoxGeometry(0.07, 0.008, 0.14);
const geo_box_35 = new BoxGeometry(0.06, 0.003, 0.12);
const geo_cyl_36 = new CylinderGeometry(0.06, 0.08, 0.04, 8);
const geo_cyl_37 = new CylinderGeometry(0.012, 0.012, 0.35, 6);
const geo_cyl_38 = new CylinderGeometry(0.04, 0.1, 0.1, 8);
const geo_sph_39 = new SphereGeometry(0.025, 6, 6);
const geo_cyl_40 = new CylinderGeometry(0.12, 0.14, 0.04, 8);
const geo_cyl_41 = new CylinderGeometry(0.015, 0.015, 1.55, 6);
const geo_cyl_42 = new CylinderGeometry(0.06, 0.15, 0.15, 8);
const geo_sph_43 = new SphereGeometry(0.03, 6, 6);
const geo_cyl_44 = new CylinderGeometry(0.08, 0.06, 0.24, 8);
const geo_cyl_45 = new CylinderGeometry(0.075, 0.075, 0.01, 8);
const geo_sph_46 = new SphereGeometry(0.12, 6, 5);
const geo_sph_47 = new SphereGeometry(0.08, 5, 4);
const geo_pln_48 = new PlaneGeometry(2, 1.5);
const geo_pln_49 = new PlaneGeometry(1.85, 1.35);
const geo_box_50 = new BoxGeometry(0.4, 0.5, 0.02);
const geo_pln_51 = new PlaneGeometry(0.32, 0.4);
const geo_cyl_52 = new CylinderGeometry(0.2, 0.2, 0.03, 16);
const geo_tor_53 = new TorusGeometry(0.2, 0.015, 8, 24);
const geo_box_54 = new BoxGeometry(0.1, 0.012, 0.005);
const geo_box_55 = new BoxGeometry(0.14, 0.008, 0.005);
const geo_pln_56 = new PlaneGeometry(1.2, 1);
const geo_box_57 = new BoxGeometry(0.05, 1.05, 1.25);
const geo_box_58 = new BoxGeometry(0.04, 1, 0.03);
const geo_box_59 = new BoxGeometry(0.03, 0.03, 1.2);
const geo_box_60 = new BoxGeometry(0.9, 2.15, 0.04);
const geo_box_61 = new BoxGeometry(0.05, 2.2, 0.06);
const geo_box_62 = new BoxGeometry(1, 0.05, 0.06);
const geo_cyl_63 = new CylinderGeometry(0.012, 0.012, 0.08, 6);
const geo_box_64 = new BoxGeometry(0.8, 0.5, 0.1);
const geo_box_65 = new BoxGeometry(0.02, 0.48, 0.003);
const geo_box_66 = new BoxGeometry(0.8, 0.02, 0.06);
const geo_cyl_67 = new CylinderGeometry(0.012, 0.012, 0.02, 6);
const geo_box_68 = new BoxGeometry(0.3, 0.3, 0.25);
const geo_sph_69 = new SphereGeometry(0.12, 6, 4, 0, Math.PI * 2, 0, Math.PI / 2);
const geo_box_70 = new BoxGeometry(0.08, 0.02, 0.04);
const geo_sph_71 = new SphereGeometry(0.008, 4, 4);
const geo_box_72 = new BoxGeometry(1, 0.8, 0.5);
const geo_box_73 = new BoxGeometry(1.02, 0.5, 0.52);
const geo_cyl_74 = new CylinderGeometry(0.06, 0.06, 0.04, 8);
const geo_cyl_75 = new CylinderGeometry(0.05, 0.05, 0.03, 8);
const geo_box_76 = new BoxGeometry(0.1, 0.04, 0.06);
const geo_cyl_77 = new CylinderGeometry(0.4, 0.4, 0.04, 8);
const geo_cyl_78 = new CylinderGeometry(0.03, 0.03, 0.7, 6);
const geo_box_79 = new BoxGeometry(0.38, 0.04, 0.38);
const geo_box_80 = new BoxGeometry(0.38, 0.45, 0.04);
const geo_box_81 = new BoxGeometry(0.7, 0.9, 0.65);
const geo_box_82 = new BoxGeometry(0.72, 0.02, 0.67);
const geo_tor_83 = new TorusGeometry(0.06, 0.008, 6, 16);
const geo_box_84 = new BoxGeometry(0.6, 0.45, 0.02);
const geo_box_85 = new BoxGeometry(0.68, 1.78, 0.5);
const geo_box_86 = new BoxGeometry(0.72, 0.03, 0.72);
const geo_box_87 = new BoxGeometry(0.64, 0.02, 0.005);
const geo_box_88 = new BoxGeometry(0.02, 0.25, 0.04);
const geo_box_89 = new BoxGeometry(0.6, 0.1, 0.5);
const geo_cyl_90 = new CylinderGeometry(0.02, 0.02, 0.4, 8);
const geo_cyl_91 = new CylinderGeometry(0.01, 0.01, 0.15, 6);
const geo_box_book_h0 = new BoxGeometry(0.05, 0.18, 0.18);
const geo_box_book_h1 = new BoxGeometry(0.05, 0.20, 0.18);
const geo_box_book_h2 = new BoxGeometry(0.05, 0.22, 0.18);
const BOOK_GEOS = [geo_box_book_h0, geo_box_book_h1, geo_box_book_h2] as const;

registerModuleGeometries([geo_box_1, geo_box_2, geo_box_3, geo_box_4, geo_box_5, geo_box_6, geo_box_7, geo_box_8, geo_box_9, geo_box_10, geo_box_11, geo_box_12, geo_box_13, geo_box_14, geo_box_15, geo_box_16, geo_box_17, geo_box_18, geo_box_19, geo_box_20, geo_box_21, geo_cyl_22, geo_box_23, geo_box_24, geo_cyl_25, geo_cyl_26, geo_box_27, geo_box_28, geo_box_29, geo_box_30, geo_box_31, geo_box_32, geo_box_33, geo_box_34, geo_box_35, geo_cyl_36, geo_cyl_37, geo_cyl_38, geo_sph_39, geo_cyl_40, geo_cyl_41, geo_cyl_42, geo_sph_43, geo_cyl_44, geo_cyl_45, geo_sph_46, geo_sph_47, geo_pln_48, geo_pln_49, geo_box_50, geo_pln_51, geo_cyl_52, geo_tor_53, geo_box_54, geo_box_55, geo_pln_56, geo_box_57, geo_box_58, geo_box_59, geo_box_60, geo_box_61, geo_box_62, geo_cyl_63, geo_box_64, geo_box_65, geo_box_66, geo_cyl_67, geo_box_68, geo_sph_69, geo_box_70, geo_sph_71, geo_box_72, geo_box_73, geo_cyl_74, geo_cyl_75, geo_box_76, geo_cyl_77, geo_cyl_78, geo_box_79, geo_box_80, geo_box_81, geo_box_82, geo_tor_83, geo_box_84, geo_box_85, geo_box_86, geo_box_87, geo_box_88, geo_box_89, geo_cyl_90, geo_cyl_91, geo_box_book_h0, geo_box_book_h1, geo_box_book_h2, ...BOOK_GEOS]);

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
      <mesh position={[0, 0.75, 0]} castShadow receiveShadow geometry={geo_box_1}>
                <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[[-0.65, -0.3], [0.65, -0.3], [-0.65, 0.3], [0.65, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.375, z]} geometry={geo_box_2}>
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
      <mesh position={[0, 0.45, 0]} castShadow geometry={geo_box_3}>
                <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.7, -0.2]} castShadow geometry={geo_box_4}>
                <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[[-0.18, -0.18], [0.18, -0.18], [-0.18, 0.18], [0.18, 0.18]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.225, z]} geometry={geo_box_5}>
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
      <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_6}>
                <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {[0.5, 1.0, 1.5].map((y, i) => (
        <mesh key={i} position={[0, y, 0.02]} geometry={geo_box_7}>
                    <meshStandardMaterial color={color} roughness={0.85} />
        </mesh>
      ))}
      {/* Books on shelves */}
      {[0.27, 0.77, 1.27, 1.77].map((y, si) => (
        Array.from({ length: 3 + (si % 2) }).map((_, j) => (
          <mesh key={`b-${si}-${j}`} position={[-0.25 + j * 0.18, y, 0.02]} geometry={BOOK_GEOS[j % 3]}>
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
      <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_8}>
                <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.6, -0.95]} castShadow geometry={geo_box_9}>
                <meshStandardMaterial color="#3a2a20" roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.55, -0.7]} geometry={geo_box_10}>
                <meshStandardMaterial color="#aaaacc" roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.52, 0.2]} geometry={geo_box_11}>
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
      <mesh position={[0, 0.35, 0]} castShadow geometry={geo_box_12}>
                {/* WS23-C: PBR upgrade */}
                <meshPhysicalMaterial color={color} roughness={0.9} sheen={0.2} sheenRoughness={0.5} />
      </mesh>
      {/* Back */}
      <mesh position={[0, 0.6, -0.4]} castShadow geometry={geo_box_13}>
                {/* WS23-C: PBR upgrade */}
                <meshPhysicalMaterial color={color} roughness={0.9} sheen={0.2} sheenRoughness={0.5} />
      </mesh>
      {/* Armrests */}
      <mesh position={[-0.95, 0.5, 0]} castShadow geometry={geo_box_14}>
                <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0.95, 0.5, 0]} castShadow geometry={geo_box_14}>
                <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      {/* L extension */}
      <mesh position={[1.15, 0.35, 0.6]} castShadow geometry={geo_box_15}>
                <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[1.15, 0.6, 0.85]} castShadow geometry={geo_box_16}>
                <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Rectangular table */
export function Table({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a4030' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow geometry={geo_box_17}>
                <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {[[-0.55, -0.3], [0.55, -0.3], [-0.55, 0.3], [0.55, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} geometry={geo_box_18}>
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
      <mesh position={[0, 1.0, 0]} castShadow geometry={geo_box_19}>
                <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 2.01, 0]} geometry={geo_box_20}>
                <meshStandardMaterial color={color} roughness={0.8} />
      </mesh>
      {/* Door line */}
      <mesh position={[0, 1.0, 0.29]} geometry={geo_box_21}>
                <meshStandardMaterial color="#3a2818" />
      </mesh>
      {/* Handles */}
      <mesh position={[-0.08, 1.0, 0.3]} geometry={geo_cyl_22}>
                <meshStandardMaterial color="#aaa" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[0.08, 1.0, 0.3]} geometry={geo_cyl_22}>
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
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow geometry={geo_box_23}>
                <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      {/* Counter top */}
      <mesh position={[0, 0.91, 0]} geometry={geo_box_24}>
                <meshStandardMaterial color="#888" metalness={0.3} roughness={0.2} />
      </mesh>
      {/* Bar stool 1 */}
      <group position={[-0.7, 0, 0.8]}>
        <mesh position={[0, 0.4, 0]} castShadow geometry={geo_cyl_25}>
                    <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} geometry={geo_cyl_26}>
                    <meshStandardMaterial color="#333" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      {/* Bar stool 2 */}
      <group position={[0.7, 0, 0.8]}>
        <mesh position={[0, 0.4, 0]} castShadow geometry={geo_cyl_25}>
                    <meshStandardMaterial color="#3a3a3a" roughness={0.7} />
        </mesh>
        <mesh position={[0, 0.2, 0]} geometry={geo_cyl_26}>
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
      <mesh position={[0, 0.38, 0]} geometry={geo_box_27}>
                <meshStandardMaterial color={color} emissive="#4488ff" emissiveIntensity={1.0} />
      </mesh>
      <mesh position={[0, 0.15, 0]} geometry={geo_box_28}>
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
      <mesh position={[0, 0.01, 0]} geometry={geo_box_29}>
                <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Keyboard glow strip */}
      <mesh position={[0, 0.02, 0.02]} geometry={geo_box_30}>
                <meshStandardMaterial color="#001122" emissive="#4488cc" emissiveIntensity={0.3} />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.15, -0.12]} rotation={[0.2, 0, 0]} geometry={geo_box_31}>
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
      <mesh geometry={geo_box_32}>
                <meshStandardMaterial color={color} emissive="#111133" emissiveIntensity={0.5} />
      </mesh>
      {/* Screen glow */}
      <mesh position={[0, 0, 0.026]} geometry={geo_box_33}>
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
      <mesh geometry={geo_box_34}>
                <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.005, 0]} geometry={geo_box_35}>
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
      <mesh position={[0, 0.02, 0]} geometry={geo_cyl_36}>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Stem */}
      <mesh position={[0, 0.2, 0]} geometry={geo_cyl_37}>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 0.38, 0.05]} rotation={[0.2, 0, 0]} geometry={geo_cyl_38}>
                <meshStandardMaterial color="#e8d8b0" roughness={0.8} side={DoubleSide} />
      </mesh>
      {/* Bulb glow */}
      <mesh position={[0, 0.35, 0.05]} geometry={geo_sph_39}>
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
      <mesh position={[0, 0.02, 0]} geometry={geo_cyl_40}>
                <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      {/* Pole */}
      <mesh position={[0, 0.8, 0]} geometry={geo_cyl_41}>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Shade */}
      <mesh position={[0, 1.6, 0]} geometry={geo_cyl_42}>
                <meshStandardMaterial color="#e8d8b0" roughness={0.8} side={DoubleSide} />
      </mesh>
      {/* Bulb */}
      <mesh position={[0, 1.55, 0]} geometry={geo_sph_43}>
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
      <mesh position={[0, 0.12, 0]} geometry={geo_cyl_44}>
                <meshStandardMaterial color="#8a5a3a" roughness={0.8} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.23, 0]} geometry={geo_cyl_45}>
                <meshStandardMaterial color="#3a2a1a" roughness={0.95} />
      </mesh>
      {/* Foliage */}
      <mesh position={[0, 0.4, 0]} geometry={geo_sph_46}>
                <meshStandardMaterial color={color} roughness={0.85} />
      </mesh>
      <mesh position={[0.06, 0.45, 0.04]} geometry={geo_sph_47}>
                <meshStandardMaterial color="#308028" roughness={0.85} />
      </mesh>
    </group>
  );
}

/** Flat rectangle on floor with color */
export function Rug({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#4a3040' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation-x={-Math.PI / 2} receiveShadow geometry={geo_pln_48}>
                <meshStandardMaterial color={color} roughness={0.95} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
      </mesh>
      {/* Border — pull FORWARD of the body (negative factor = closer to camera) so it
          always wins z-order at grazing angles. Prior +2 pushed it BACKWARD into the
          body, causing the border edge to dip behind the rug at oblique camera views. */}
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.001, 0]} geometry={geo_pln_49}>
                <meshStandardMaterial color={color} roughness={0.95} polygonOffset polygonOffsetFactor={-2} polygonOffsetUnits={-2} emissive={color} emissiveIntensity={0.1} />
      </mesh>
    </group>
  );
}

/** Frame on wall */
export function Picture({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#5a3a20' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo_box_50}>
                <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0, 0.011]} geometry={geo_pln_51}>
                <meshStandardMaterial color="#8a7a60" roughness={0.9} />
      </mesh>
    </group>
  );
}

/** Wall clock */
export function Clock({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#f0f0f0' }: BaseProps) {
  const timeRef = useRef(0);
  useFrameTick('misc', ({ delta }) => {
    timeRef.current += delta;
  });
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh geometry={geo_cyl_52}>
                <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0, 0.01]} geometry={geo_tor_53}>
                <meshStandardMaterial color="#4a4a5a" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Hour hand */}
      <mesh position={[0, 0, 0.02]} rotation={[0, 0, -Math.PI / 3]} geometry={geo_box_54}>
                <meshStandardMaterial color="#1a1a1a" />
      </mesh>
      {/* Minute hand */}
      <mesh position={[0, 0, 0.025]} rotation={[0, 0, -Math.PI / 6]} geometry={geo_box_55}>
                <meshStandardMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

/** Window frame with emissive "sky" plane */
export function Window({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#3366dd' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0, 0.01]} geometry={geo_pln_56}>
                <meshStandardMaterial color="#0a0a30" emissive={color} emissiveIntensity={2.5} />
      </mesh>
      {/* Frame */}
      <mesh position={[0, 0, 0.01]} geometry={geo_box_57}>
                <meshStandardMaterial color="#444" roughness={0.7} />
      </mesh>
      {/* Cross bars */}
      <mesh position={[0.01, 0, 0]} geometry={geo_box_58}>
                <meshStandardMaterial color="#444" roughness={0.7} />
      </mesh>
      <mesh position={[0.01, 0, 0]} geometry={geo_box_59}>
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
      <mesh position={[0, 1.1, 0]} geometry={geo_box_60}>
                <meshStandardMaterial color={color} roughness={0.75} />
      </mesh>
      {/* Frame sides */}
      <mesh position={[-0.48, 1.1, 0]} geometry={geo_box_61}>
                <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      <mesh position={[0.48, 1.1, 0]} geometry={geo_box_61}>
                <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      {/* Frame top */}
      <mesh position={[0, 2.2, 0]} geometry={geo_box_62}>
                <meshStandardMaterial color="#5a4838" roughness={0.8} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.32, 1.05, 0.03]} rotation={[0, 0, Math.PI / 2]} geometry={geo_cyl_63}>
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
      <mesh position={[0, 0.3, 0]} castShadow geometry={geo_box_64}>
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Fins */}
      {[-0.32, -0.22, -0.12, -0.02, 0.08, 0.18, 0.28].map((x, i) => (
        <mesh key={i} position={[x, 0.3, 0.051]} geometry={geo_box_65}>
                    <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
      {/* Top rail */}
      <mesh position={[0, 0.56, 0.02]} geometry={geo_box_66}>
                <meshStandardMaterial color={color} metalness={0.3} roughness={0.5} />
      </mesh>
      {/* Control knobs */}
      <mesh position={[0.35, 0.15, 0.06]} geometry={geo_cyl_67}>
                <meshStandardMaterial color="#fff" metalness={0.5} roughness={0.3} />
      </mesh>
      <mesh position={[0.35, 0.25, 0.06]} geometry={geo_cyl_67}>
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
      <mesh position={[0, 0.15, 0]} geometry={geo_box_68}>
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.32, 0]} geometry={geo_sph_69}>
                <meshStandardMaterial color="#333" roughness={0.3} metalness={0.7} />
      </mesh>
      <mesh position={[0, 0.08, 0.14]} geometry={geo_box_70}>
                <meshStandardMaterial color="#555" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0.12, 0.2, 0.13]} geometry={geo_sph_71}>
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
      <mesh position={[0, 0.4, 0]} castShadow geometry={geo_box_72}>
                <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {/* Glass top */}
      <mesh position={[0, 0.85, 0]} geometry={geo_box_73}>
                <meshStandardMaterial color="#c0d0e0" transparent opacity={0.2} metalness={0.1} roughness={0.05} />
      </mesh>
      {/* Pastry shapes inside */}
      <mesh position={[-0.25, 0.65, 0]} geometry={geo_cyl_74}>
                <meshStandardMaterial color="#c8a050" roughness={0.8} />
      </mesh>
      <mesh position={[0.1, 0.65, 0.05]} geometry={geo_cyl_75}>
                <meshStandardMaterial color="#8a4020" roughness={0.8} />
      </mesh>
      <mesh position={[0.3, 0.65, -0.05]} geometry={geo_box_76}>
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
      <mesh position={[0, 0.7, 0]} castShadow geometry={geo_cyl_77}>
                <meshStandardMaterial color={color} roughness={0.6} />
      </mesh>
      {/* Table leg */}
      <mesh position={[0, 0.35, 0]} geometry={geo_cyl_78}>
                <meshStandardMaterial color="#3a2818" roughness={0.7} />
      </mesh>
      {/* Chair 1 */}
      <group position={[-0.55, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow geometry={geo_box_79}>
                    <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, -0.17]} castShadow geometry={geo_box_80}>
                    <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
      </group>
      {/* Chair 2 */}
      <group position={[0.55, 0, 0]}>
        <mesh position={[0, 0.4, 0]} castShadow geometry={geo_box_79}>
                    <meshStandardMaterial color={color} roughness={0.8} />
        </mesh>
        <mesh position={[0, 0.65, 0.17]} castShadow geometry={geo_box_80}>
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
      <mesh position={[0, 0.45, 0]} castShadow geometry={geo_box_81}>
                <meshStandardMaterial color={color} metalness={0.4} roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.91, 0]} geometry={geo_box_82}>
                <meshStandardMaterial color="#2a2a2a" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Burner rings */}
      {[[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.93, z]} rotation-x={-Math.PI / 2} geometry={geo_tor_83}>
                    <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {/* Oven door */}
      <mesh position={[0, 0.3, 0.33]} geometry={geo_box_84}>
                <meshStandardMaterial color="#333" metalness={0.3} roughness={0.4} />
      </mesh>
    </group>
  );
}

/** Refrigerator */
export function Fridge({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#c8c8c8' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.9, 0]} castShadow geometry={geo_box_85}>
                <meshStandardMaterial color={color} metalness={0.4} roughness={0.3} />
      </mesh>
      <mesh position={[0, 1.81, 0]} geometry={geo_box_86}>
                <meshStandardMaterial color="#bbb" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Freezer door line */}
      <mesh position={[0, 1.3, 0.26]} geometry={geo_box_87}>
                <meshStandardMaterial color="#aaa" metalness={0.3} />
      </mesh>
      {/* Handle */}
      <mesh position={[0.3, 0.9, 0.27]} geometry={geo_box_88}>
                <meshStandardMaterial color="#888" metalness={0.8} />
      </mesh>
    </group>
  );
}

/** Kitchen sink */
export function Sink({ position = [0, 0, 0], rotation = [0, 0, 0], scale = [1, 1, 1], color = '#707070' }: BaseProps) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh position={[0, 0.05, 0]} geometry={geo_box_89}>
                <meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
      </mesh>
      {/* Faucet */}
      <mesh position={[0, 0.25, -0.2]} geometry={geo_cyl_90}>
                <meshStandardMaterial color="#bbb" metalness={0.8} roughness={0.2} />
      </mesh>
      {/* Faucet spout */}
      <mesh position={[0, 0.42, -0.08]} rotation={[0.5, 0, 0]} geometry={geo_cyl_91}>
                <meshStandardMaterial color="#bbb" metalness={0.8} roughness={0.2} />
      </mesh>
    </group>
  );
}
