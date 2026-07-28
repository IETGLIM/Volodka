
/* ─── Volodka RPG – Library procedural 3D visual ─── */

import * as THREE from 'three';
import { useEnvironmentLod } from './lod/useEnvironmentLod';
import { useCachedCanvasTexture } from '@/hooks/useCachedCanvasTexture';
import { LibraryDayInterior } from './sceneChunks/libraryDay';

/** Gothic/AuthorMaterial library (16×14m) */
export function LibraryDayVisual() {
  const floorTexture = useCachedCanvasTexture('library_day:floor', createLibraryFloorTexture);
  const wallTexture = useCachedCanvasTexture('library_day:wall', createLibraryWallTexture);
  const { lod } = useEnvironmentLod();

  const W = 16;
  const D = 14;
  const H = 4.5;

  return (
    <group>
      {/* ── Floor ── */}
      <mesh rotation-x={-Math.PI / 2} receiveShadow position-y={0.001}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial
          map={floorTexture}
          color="#5a4030"
          roughness={0.85}
          polygonOffset
          polygonOffsetFactor={1}
          polygonOffsetUnits={1}
        />
      </mesh>

      {/* ── Ceiling ── */}
      <mesh position={[0, H, 0]} rotation-x={Math.PI / 2}>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial color="#3a2a18" roughness={0.95} />
      </mesh>

      {/* ── Walls ── */}
      <mesh position={[0, H / 2, -D / 2]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#4a3520" roughness={0.9} />
      </mesh>
      <mesh position={[0, H / 2, D / 2]} rotation-y={Math.PI}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial map={wallTexture} color="#4a3520" roughness={0.9} />
      </mesh>
      <mesh position={[-W / 2, H / 2, 0]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#4a3520" roughness={0.9} />
      </mesh>
      <mesh position={[W / 2, H / 2, 0]} rotation-y={-Math.PI / 2}>
        <planeGeometry args={[D, H]} />
        <meshStandardMaterial map={wallTexture} color="#4a3520" roughness={0.9} />
      </mesh>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── TALL BOOKSHELVES (3m+) ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Back wall shelves */}
      <Bookshelf position={[-6, 0, -6.5]} height={3.5} />
      <Bookshelf position={[-3.5, 0, -6.5]} height={3.5} />
      <Bookshelf position={[-1, 0, -6.5]} height={3.5} />
      <Bookshelf position={[1.5, 0, -6.5]} height={3.5} />
      <Bookshelf position={[4, 0, -6.5]} height={3.5} />
      <Bookshelf position={[6.5, 0, -6.5]} height={3.5} />

      {/* Left wall shelves */}
      <Bookshelf position={[-7.5, 0, -4]} height={3.5} rotation={Math.PI / 2} />
      <Bookshelf position={[-7.5, 0, -1]} height={3.5} rotation={Math.PI / 2} />
      <Bookshelf position={[-7.5, 0, 2]} height={3.5} rotation={Math.PI / 2} />

      {/* Right wall shelves */}
      <Bookshelf position={[7.5, 0, -4]} height={3.5} rotation={-Math.PI / 2} />
      <Bookshelf position={[7.5, 0, -1]} height={3.5} rotation={-Math.PI / 2} />
      <Bookshelf position={[7.5, 0, 2]} height={3.5} rotation={-Math.PI / 2} />

      {/* Free-standing shelf rows (center) */}
      <Bookshelf position={[-2.5, 0, -2]} height={2.5} />
      <Bookshelf position={[-2.5, 0, 1]} height={2.5} />

      <Bookshelf position={[2.5, 0, -2]} height={2.5} />
      <Bookshelf position={[2.5, 0, 1]} height={2.5} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── READING TABLES WITH GREEN BANKER LAMPS ── */}
      {/* ═══════════════════════════════════════════════ */}
      <ReadingTable position={[0, 0, -3]} />
      <ReadingTable position={[0, 0, 0]} />
      <ReadingTable position={[0, 0, 3]} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── SPIRAL STAIRCASE (back-right) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[6, 0, -5]}>
        {/* Central pillar */}
        <mesh position={[0, 2, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.08, 4, 8]} />
          <meshStandardMaterial color="#3a2818" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Stair steps (simplified as wedges/boxes) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i / 12) * Math.PI * 1.5;
          const y = (i / 12) * 3;
          return (
            <mesh key={i} position={[Math.cos(angle) * 0.6, y, Math.sin(angle) * 0.6]} rotation={[0, -angle, 0]} castShadow>
              <boxGeometry args={[0.7, 0.06, 0.3]} />
              <meshStandardMaterial color="#5a4030" roughness={0.7} />
            </mesh>
          );
        })}
        {/* Railing */}
        <mesh position={[0, 3.5, 0]} castShadow>
          <torusGeometry args={[0.7, 0.02, 6, 24, Math.PI * 1.5]} />
          <meshStandardMaterial color="#2a2a30" metalness={0.6} roughness={0.4} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── STAINED GLASS WINDOW (right wall, emissive) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[W / 2 - 0.01, 2.5, -2]}>
        <mesh rotation-y={-Math.PI / 2}>
          <planeGeometry args={[2.5, 3.0]} />
          <meshStandardMaterial
            color="#1a0a20"
            emissive="#8800aa"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Window frame */}
        <mesh rotation-y={-Math.PI / 2} position={[0.01, 0, 0]}>
          <boxGeometry args={[0.06, 3.1, 2.6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Cross bars */}
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0, 0]}>
          <boxGeometry args={[0.04, 3.0, 0.04]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0.02, 0, 0]}>
          <boxGeometry args={[0.04, 0.04, 2.5]} />
          <meshStandardMaterial color="#3a2818" />
        </mesh>
        {/* Color segments */}
        <mesh rotation-y={-Math.PI / 2} position={[0.03, 0.8, -0.6]}>
          <planeGeometry args={[0.5, 0.8]} />
          <meshStandardMaterial color="#001a00" emissive="#205030" emissiveIntensity={0.6} transparent opacity={0.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
        <mesh rotation-y={-Math.PI / 2} position={[0.03, 0.8, 0.6]}>
          <planeGeometry args={[0.5, 0.8]} />
          <meshStandardMaterial color="#1a0000" emissive="#aa2244" emissiveIntensity={0.4} transparent opacity={0.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── CARD CATALOG (left front) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[-6, 0, 5]}>
        <mesh position={[0, 0.65, 0]} castShadow>
          <boxGeometry args={[2.0, 1.3, 0.5]} />
          <meshStandardMaterial color="#5a4030" roughness={0.7} />
        </mesh>
        {/* Drawer pulls */}
        {[-0.7, -0.3, 0.1, 0.5].map((x, i) => (
          <mesh key={i} position={[x, 0.9, 0.26]}>
            <boxGeometry args={[0.12, 0.02, 0.02]} />
            <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
        {[-0.7, -0.3, 0.1, 0.5].map((x, i) => (
          <mesh key={`d2-${i}`} position={[x, 0.4, 0.26]}>
            <boxGeometry args={[0.12, 0.02, 0.02]} />
            <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
          </mesh>
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── WOODEN LECTERN (front center) ── */}
      {/* ═══════════════════════════════════════════════ */}
      <group position={[0, 0, 5.5]}>
        {/* Stand */}
        <mesh position={[0, 0.6, 0]} castShadow>
          <boxGeometry args={[0.15, 1.2, 0.15]} />
          <meshStandardMaterial color="#5a4030" roughness={0.7} />
        </mesh>
        {/* Reading surface */}
        <mesh position={[0, 1.15, 0.05]} rotation={[0.3, 0, 0]} castShadow>
          <boxGeometry args={[0.6, 0.03, 0.45]} />
          <meshStandardMaterial color="#4a3520" roughness={0.6} />
        </mesh>
        {/* Open book on lectern */}
        <mesh position={[0, 1.2, 0.08]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.35, 0.02, 0.25]} />
          <meshStandardMaterial color="#c8b898" roughness={0.95} />
        </mesh>
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── LIGHTS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* Warm green banker lamps (at reading tables) */}
      <pointLight position={[0, 1.8, -3]} color="#44aa66" intensity={2.0} distance={7} castShadow shadow-mapSize-width={256} shadow-bias={-0.003} />
      <pointLight position={[0, 1.8, 0]} color="#44aa66" intensity={1.8} distance={7} />
      <pointLight position={[0, 1.8, 3]} color="#44aa66" intensity={1.8} distance={7} />

      {/* Amber reading lights (overhead) */}
      <pointLight position={[-4, 3.5, -2]} color="#ffaa44" intensity={2.0} distance={10} />
      <pointLight position={[4, 3.5, 2]} color="#ffaa44" intensity={2.0} distance={10} />

      {/* Stained glass glow */}
      <pointLight position={[7.5, 2.5, -2]} color="#8800aa" intensity={1.2} distance={7} />

      {/* General fill */}
      <pointLight position={[0, 4, 0]} color="#c8b898" intensity={1.0} distance={16} />

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ENVIRONMENTAL CLUTTER / STORYTELLING ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Stack of books on reading table ── */}
      <group position={[-0.5, 0.76, 3.0]}>
        <mesh position={[0, 0.02, 0]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.2, 0.03, 0.15]} />
          <meshStandardMaterial color="#8b2020" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.05, 0]} rotation={[0, -0.05, 0]}>
          <boxGeometry args={[0.18, 0.03, 0.14]} />
          <meshStandardMaterial color="#204080" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.08, 0]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.19, 0.025, 0.13]} />
          <meshStandardMaterial color="#806020" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Glasses left on book ── */}
      <group position={[0.3, 0.77, 0.1]}>
        {/* Left lens */}
        <mesh position={[-0.03, 0, 0]}>
          <torusGeometry args={[0.015, 0.003, 6, 12]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Right lens */}
        <mesh position={[0.03, 0, 0]}>
          <torusGeometry args={[0.015, 0.003, 6, 12]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.3} />
        </mesh>
        {/* Bridge */}
        <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, 0.03, 4]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Coffee stain on desk ── */}
      <mesh rotation-x={-Math.PI / 2} position={[-0.8, 0.76, -2.8]}>
        <ringGeometry args={[0.03, 0.045, 16]} />
        <meshStandardMaterial color="#6a5030" transparent opacity={0.3} roughness={0.95} />
      </mesh>

      {/* ── Book cart in aisle ── */}
      <group position={[5, 0, 1.5]} rotation={[0, -0.2, 0]}>
        {/* Cart body */}
        <mesh position={[0, 0.5, 0]} castShadow>
          <boxGeometry args={[0.6, 0.5, 0.4]} />
          <meshStandardMaterial color="#5a5a5a" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Books in cart */}
        <mesh position={[0, 0.8, 0]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.4, 0.12, 0.2]} />
          <meshStandardMaterial color="#205030" roughness={0.6} />
        </mesh>
        <mesh position={[0.05, 0.88, 0]} rotation={[0, -0.1, 0.1]}>
          <boxGeometry args={[0.3, 0.1, 0.15]} />
          <meshStandardMaterial color="#806020" roughness={0.6} />
        </mesh>
        {/* Wheels */}
        {[-0.25, 0.25].map((x, i) => (
          [-0.15, 0.15].map((z, j) => (
            <mesh key={`wheel-${i}-${j}`} position={[x, 0.06, z]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.05, 0.05, 0.03, 8]} />
              <meshStandardMaterial color="#3a3a3a" roughness={0.8} />
            </mesh>
          ))
        ))}
      </group>

      {/* ═══════════════════════════════════════════════ */}
      {/* ── ADDITIONAL LIBRARY DETAILS ── */}
      {/* ═══════════════════════════════════════════════ */}

      {/* ── Rolling ladder on wheels (left wall, leaning against shelf) ── */}
      <group position={[-7.0, 0, -2.5]} rotation={[0, 0.15, 0]}>
        {/* Left rail */}
        <mesh position={[-0.2, 1.5, 0]} castShadow>
          <boxGeometry args={[0.04, 3.0, 0.04]} />
          <meshStandardMaterial color="#5a4030" roughness={0.7} />
        </mesh>
        {/* Right rail */}
        <mesh position={[0.2, 1.5, 0]} castShadow>
          <boxGeometry args={[0.04, 3.0, 0.04]} />
          <meshStandardMaterial color="#5a4030" roughness={0.7} />
        </mesh>
        {/* Rungs */}
        {[0.3, 0.7, 1.1, 1.5, 1.9, 2.3, 2.7].map((y, i) => (
          <mesh key={`rung-${i}`} position={[0, y, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
            <meshStandardMaterial color="#4a3520" roughness={0.7} />
          </mesh>
        ))}
        {/* Top rail cap */}
        <mesh position={[0, 3.02, 0]}>
          <boxGeometry args={[0.5, 0.03, 0.05]} />
          <meshStandardMaterial color="#5a4030" roughness={0.7} />
        </mesh>
        {/* Wheels at bottom */}
        {[-0.2, 0.2].map((x, i) => (
          <mesh key={`lwheel-${i}`} position={[x, 0.06, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.03, 8]} />
            <meshStandardMaterial color="#555" metalness={0.5} roughness={0.4} />
          </mesh>
        ))}
      </group>

      {/* ── Globe on stand (near reading tables) ── */}
      <group position={[5.5, 0, -4.0]}>
        {/* Stand base */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.15, 0.08, 8]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Stand pole */}
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.85, 6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Meridian ring */}
        <mesh position={[0, 0.95, 0]} rotation={[0, 0, 0.3]}>
          <torusGeometry args={[0.18, 0.005, 6, 24]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Globe sphere */}
        <mesh position={[0, 0.95, 0]}>
          <sphereGeometry args={[0.17, 12, 12]} />
          <meshStandardMaterial color="#2a5a3a" roughness={0.6} />
        </mesh>
        {/* Continent patches (rough shapes on globe) */}
        <mesh position={[0.05, 1.02, 0.12]} rotation={[0.3, 0.5, 0]}>
          <planeGeometry args={[0.1, 0.08]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.7} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
        <mesh position={[-0.08, 0.88, -0.1]} rotation={[-0.2, -0.3, 0.1]}>
          <planeGeometry args={[0.08, 0.06]} />
          <meshStandardMaterial color="#4a7a3a" roughness={0.7} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
      </group>

      {/* ── Grandfather clock (near back wall) ── */}
      <group position={[-6.0, 0, -5.0]}>
        {/* Clock body */}
        <mesh position={[0, 1.0, 0]} castShadow>
          <boxGeometry args={[0.5, 2.0, 0.3]} />
          <meshStandardMaterial color="#4a3520" roughness={0.7} />
        </mesh>
        {/* Clock top hood */}
        <mesh position={[0, 2.1, 0]} castShadow>
          <boxGeometry args={[0.55, 0.2, 0.35]} />
          <meshStandardMaterial color="#3a2510" roughness={0.7} />
        </mesh>
        {/* Clock face */}
        <mesh position={[0, 2.0, 0.16]}>
          <cylinderGeometry args={[0.15, 0.15, 0.02, 16]} />
          <meshStandardMaterial color="#f0e8d0" roughness={0.5} />
        </mesh>
        {/* Clock face frame */}
        <mesh position={[0, 2.0, 0.17]}>
          <torusGeometry args={[0.15, 0.01, 6, 24]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Clock hands */}
        <mesh position={[0, 2.0, 0.18]} rotation={[0, 0, -Math.PI / 4]}>
          <boxGeometry args={[0.08, 0.008, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        <mesh position={[0, 2.0, 0.185]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.1, 0.006, 0.003]} />
          <meshStandardMaterial color="#1a1a1a" />
        </mesh>
        {/* Clock pendulum window */}
        <mesh position={[0, 0.8, 0.16]}>
          <boxGeometry args={[0.2, 0.35, 0.005]} />
          <meshStandardMaterial color="#1a1510" roughness={0.3} />
        </mesh>
        {/* Pendulum (behind glass) */}
        <mesh position={[0, 0.7, 0.14]}>
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.85, 0.14]}>
          <cylinderGeometry args={[0.003, 0.003, 0.3, 4]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Vintage writing desk with inkwell ── */}
      <group position={[-5.0, 0, 3.0]} rotation={[0, 0.3, 0]}>
        {/* Desk top */}
        <mesh position={[0, 0.72, 0]} castShadow>
          <boxGeometry args={[0.9, 0.04, 0.5]} />
          <meshStandardMaterial color="#5a4030" roughness={0.6} />
        </mesh>
        {/* Desk legs (tapered) */}
        {[[-0.38, -0.2], [0.38, -0.2], [-0.38, 0.2], [0.38, 0.2]].map(([x, z], i) => (
          <mesh key={`dleg-${i}`} position={[x, 0.36, z]} castShadow>
            <boxGeometry args={[0.04, 0.72, 0.04]} />
            <meshStandardMaterial color="#4a3520" roughness={0.7} />
          </mesh>
        ))}
        {/* Inkwell */}
        <mesh position={[0.25, 0.76, 0.05]}>
          <cylinderGeometry args={[0.025, 0.02, 0.04, 6]} />
          <meshStandardMaterial color="#1a1a2a" roughness={0.4} />
        </mesh>
        {/* Quill pen */}
        <mesh position={[0.3, 0.78, 0.05]} rotation={[0, 0, 0.6]}>
          <cylinderGeometry args={[0.003, 0.003, 0.2, 4]} />
          <meshStandardMaterial color="#e8dcc0" roughness={0.8} />
        </mesh>
        {/* Blotting paper */}
        <mesh position={[-0.1, 0.745, 0]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.2, 0.003, 0.15]} />
          <meshStandardMaterial color="#d0c8a0" roughness={0.95} />
        </mesh>
      </group>

      {/* ── Second stained glass window (left wall) ── */}
      <group position={[-W / 2 + 0.01, 2.5, -2]}>
        <mesh rotation-y={Math.PI / 2}>
          <planeGeometry args={[2.5, 3.0]} />
          <meshStandardMaterial
            color="#0a0a20"
            emissive="#2255aa"
            emissiveIntensity={0.3}
          />
        </mesh>
        {/* Window frame */}
        <mesh rotation-y={Math.PI / 2} position={[-0.01, 0, 0]}>
          <boxGeometry args={[0.06, 3.1, 2.6]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Color segments */}
        <mesh rotation-y={Math.PI / 2} position={[-0.02, 0.5, -0.4]}>
          <planeGeometry args={[0.6, 0.8]} />
          <meshStandardMaterial color="#1a1a00" emissive="#887722" emissiveIntensity={0.5} transparent opacity={0.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
        <mesh rotation-y={Math.PI / 2} position={[-0.02, 0.5, 0.5]}>
          <planeGeometry args={[0.5, 0.7]} />
          <meshStandardMaterial color="#0a0a1a" emissive="#3344aa" emissiveIntensity={0.4} transparent opacity={0.5} polygonOffset polygonOffsetFactor={-1} polygonOffsetUnits={-1} />
        </mesh>
        {/* Window light spill */}
        <pointLight position={[1.0, 2.0, -2]} color="#2255aa" intensity={0.8} distance={6} />
      </group>

      {/* ── Framed map on wall (back wall) ── */}
      <group position={[3.0, 2.5, -D / 2 + 0.05]}>
        {/* Frame */}
        <mesh>
          <boxGeometry args={[0.8, 0.6, 0.03]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Map surface */}
        <mesh position={[0, 0, 0.016]}>
          <planeGeometry args={[0.7, 0.5]} />
          <meshStandardMaterial color="#c8b890" roughness={0.8} />
        </mesh>
        {/* Map details (lines) */}
        {[0.1, 0.0, -0.1].map((y, i) => (
          <mesh key={`mapline-${i}`} position={[0, y, 0.02]}>
            <boxGeometry args={[0.5 - i * 0.1, 0.003, 0.001]} />
            <meshStandardMaterial color="#6a5a3a" roughness={0.9} />
          </mesh>
        ))}
      </group>

      {/* ── Candle holders on reading tables ── */}
      <group position={[-0.6, 0.76, 0.1]}>
        {/* Holder base */}
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.04, 0.05, 0.06, 8]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Candle */}
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 6]} />
          <meshStandardMaterial color="#e8d8b0" roughness={0.8} />
        </mesh>
        {/* Flame (emissive) */}
        <mesh position={[0, 0.16, 0]}>
          <sphereGeometry args={[0.008, 4, 4]} />
          <meshStandardMaterial color="#ffaa44" emissive="#ffaa44" emissiveIntensity={3.0} />
        </mesh>
        {/* Candle light */}
        <pointLight position={[0, 0.2, 0]} color="#ffaa44" intensity={0.8} distance={3} />
      </group>

      {/* ── Additional books stacked on floor ── */}
      <group position={[4.0, 0, 4.0]} rotation={[0, 0.4, 0]}>
        {/* Stack of books */}
        <mesh position={[0, 0.04, 0]} rotation={[0, 0.1, 0]}>
          <boxGeometry args={[0.25, 0.04, 0.18]} />
          <meshStandardMaterial color="#4a2820" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.09, 0]} rotation={[0, -0.05, 0]}>
          <boxGeometry args={[0.22, 0.05, 0.16]} />
          <meshStandardMaterial color="#204060" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.15, 0]} rotation={[0, 0.15, 0]}>
          <boxGeometry args={[0.2, 0.04, 0.15]} />
          <meshStandardMaterial color="#604020" roughness={0.6} />
        </mesh>
        {/* Leaning book */}
        <mesh position={[0.18, 0.06, 0]} rotation={[0, 0, 0.5]}>
          <boxGeometry args={[0.18, 0.03, 0.14]} />
          <meshStandardMaterial color="#205030" roughness={0.6} />
        </mesh>
      </group>

      {/* ── Reading glasses on reading table ── */}
      <group position={[0.4, 0.76, -2.8]}>
        <mesh position={[-0.025, 0, 0]}>
          <torusGeometry args={[0.015, 0.002, 4, 12]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh position={[0.025, 0, 0]}>
          <torusGeometry args={[0.015, 0.002, 4, 12]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.3} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.002, 0.002, 0.025, 4]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.3} />
        </mesh>
      </group>

      {/* ── Rope stanchion / queue barrier ── */}
      <group position={[2.0, 0, 5.0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 1.0, 6]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Base */}
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.08, 8]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        {/* Top ball */}
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
        </mesh>
      </group>
      <group position={[4.0, 0, 5.0]}>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.02, 0.025, 1.0, 6]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.04, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.08, 8]} />
          <meshStandardMaterial color="#3a2818" roughness={0.7} />
        </mesh>
        <mesh position={[0, 1.02, 0]}>
          <sphereGeometry args={[0.025, 6, 6]} />
          <meshStandardMaterial color="#8a7a50" metalness={0.6} roughness={0.3} />
        </mesh>
        {/* Rope between stanchions */}
        <mesh position={[-1.0, 0.85, 0]} rotation={[0, 0, Math.PI * 0.03]}>
          <cylinderGeometry args={[0.008, 0.008, 2.05, 4]} />
          <meshStandardMaterial color="#6a3020" roughness={0.8} />
        </mesh>
      </group>

      {/* ── Dust particles in light beam (static representative) ── */}
      {Array.from({ length: 12 }).map((_, i) => (
        <mesh key={`dust-${i}`} position={[
          7.0 + (Math.sin(i * 2.3) * 0.5),
          1.5 + Math.cos(i * 1.7) * 1.0,
          -2.0 + Math.sin(i * 3.1) * 1.5,
        ]}>
          <sphereGeometry args={[0.008, 3, 3]} />
          <meshStandardMaterial color="#ffddbb" transparent opacity={0.3} emissive="#ffcc88" emissiveIntensity={0.5} />
        </mesh>
      ))}

      {/* ── Additional warm library lights ── */}
      {/* Overhead chandelier effect */}
      <pointLight position={[0, 4.0, 3.0]} color="#c8a878" intensity={1.5} distance={14} />

      {/* Candle warm glow at writing desk */}
      <pointLight position={[-5.0, 1.2, 3.0]} color="#ffaa44" intensity={0.6} distance={4} />

      {/* ── INTERIOR MODELS (lazy chunk) ── */}
      <LibraryDayInterior lod={lod} width={W} depth={D} />
    </group>
  );
}

/** Tall bookshelf with books */
function Bookshelf({ position, height = 3.5, rotation = 0 }: { position: [number, number, number]; height?: number; rotation?: number }) {
  const shelfCount = Math.floor(height / 0.5);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Main frame */}
      <mesh position={[0, height / 2, 0]} castShadow>
        <boxGeometry args={[1.2, height, 0.35]} />
        <meshStandardMaterial color="#5a4030" roughness={0.8} />
      </mesh>
      {/* Shelf dividers */}
      {Array.from({ length: shelfCount }).map((_, i) => {
        const y = 0.3 + i * (height - 0.3) / shelfCount;
        return (
          <mesh key={i} position={[0, y, 0.02]}>
            <boxGeometry args={[1.18, 0.03, 0.33]} />
            <meshStandardMaterial color="#4a3520" roughness={0.7} />
          </mesh>
        );
      })}
      {/* Books on shelves */}
      {Array.from({ length: shelfCount - 1 }).map((_, i) => {
        const y = 0.35 + i * (height - 0.3) / shelfCount + 0.15;
        const bookCount = 2 + (i % 3);
        return (
          <group key={`books-${i}`}>
            {Array.from({ length: bookCount }).map((_, j) => {
              const x = -0.4 + j * (0.8 / bookCount);
              return (
                <mesh key={j} position={[x, y, 0.01]}>
                  <boxGeometry args={[0.08, 0.2 + (j % 3) * 0.03, 0.18]} />
                  <meshStandardMaterial
                    color={['#8b2020', '#204080', '#205030', '#806020', '#604020', '#403060'][j % 6]}
                    roughness={0.6}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

/** Reading table with green banker lamp */
function ReadingTable({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Table top */}
      <mesh position={[0, 0.72, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.0, 0.05, 0.8]} />
        <meshStandardMaterial color="#5a4030" roughness={0.6} />
      </mesh>
      {/* Legs */}
      {[[-0.9, -0.3], [0.9, -0.3], [-0.9, 0.3], [0.9, 0.3]].map(([x, z], i) => (
        <mesh key={i} position={[x, 0.36, z]} castShadow>
          <boxGeometry args={[0.06, 0.72, 0.06]} />
          <meshStandardMaterial color="#4a3520" roughness={0.7} />
        </mesh>
      ))}
      {/* Green banker lamp */}
      <group position={[0.7, 0.75, -0.25]}>
        {/* Lamp base */}
        <mesh>
          <boxGeometry args={[0.12, 0.03, 0.12]} />
          <meshStandardMaterial color="#205030" metalness={0.4} roughness={0.5} />
        </mesh>
        {/* Lamp stem */}
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.4, 6]} />
          <meshStandardMaterial color="#205030" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* Lamp shade */}
        <mesh position={[0, 0.4, 0.05]} rotation={[0.3, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.12, 0.1, 8]} />
          <meshStandardMaterial color="#205030" side={THREE.DoubleSide} />
        </mesh>
        {/* Lamp glow */}
        <mesh position={[0, 0.38, 0.05]}>
          <sphereGeometry args={[0.04, 6, 6]} />
          <meshStandardMaterial color="#aaffaa" emissive="#44aa66" emissiveIntensity={1.5} />
        </mesh>
      </group>
      {/* Open books on table */}
      <mesh position={[-0.3, 0.77, 0.1]} rotation={[0, 0.1, 0]}>
        <boxGeometry args={[0.3, 0.02, 0.22]} />
        <meshStandardMaterial color="#c8b898" roughness={0.95} />
      </mesh>
    </group>
  );
}

function createLibraryFloorTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm wood base
  ctx.fillStyle = '#5a4030';
  ctx.fillRect(0, 0, size, size);

  // Wood plank lines
  ctx.strokeStyle = '#4a3020';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 48) {
    ctx.beginPath();
    ctx.moveTo(0, i);
    ctx.lineTo(size, i);
    ctx.stroke();
  }

  // Subtle grain
  ctx.globalAlpha = 0.06;
  for (let i = 0; i < 40; i++) {
    const y = Math.random() * size;
    ctx.strokeStyle = '#6a5040';
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 8);
    ctx.stroke();
  }
  ctx.globalAlpha = 1.0;

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(8, 7);
  return tex;
}

function createLibraryWallTexture(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d')!;

  // Warm wall
  ctx.fillStyle = '#4a3520';
  ctx.fillRect(0, 0, size, size);

  // Wainscoting pattern (lower half)
  ctx.fillStyle = '#3a2510';
  ctx.fillRect(0, size / 2, size, size / 2);

  // Panel lines
  ctx.strokeStyle = '#2a1808';
  ctx.lineWidth = 1;
  for (let i = 0; i < size; i += 64) {
    ctx.strokeRect(i + 4, size / 2 + 4, 56, size / 2 - 8);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 3);
  return tex;
}
