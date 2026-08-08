/* ─── Volodka RPG – AAA Cinematic Atmosphere ───
 * Luxurious, filmi atmosphere layer: volumetric dust motes,
 * soft light scattering, air dust, subtle bokeh, god-ray dust.
 * Designed to make every scene feel alive, not sterile plastic.
 *
 * Gated on quality preset + reduced motion.
 */

import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { isHeroScene } from '@/config/sceneVisualProfiles';
import type { SceneId } from '@/shared/types/game';

interface DustMote {
  x: number; y: number; z: number;
  size: number;
  drift: number;
  phase: number;
  opacity: number;
}

function generateMotes(count: number, sceneId: string): DustMote[] {
  const seed = sceneId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const motes: DustMote[] = [];
  for (let i = 0; i < count; i++) {
    const r1 = Math.sin((seed + i * 137.5) % 100) * 0.5 + 0.5;
    const r2 = Math.cos((seed + i * 271.3) % 100) * 0.5 + 0.5;
    const r3 = Math.sin((seed + i * 91.7) % 100 + 1.2) * 0.5 + 0.5;
    const isIndoor = !sceneId.includes('street') && !sceneId.includes('park') && !sceneId.includes('pier') && !sceneId.includes('rooftop');
    motes.push({
      x: (r1 - 0.5) * (isIndoor ? 8 : 18),
      y: r2 * (isIndoor ? 2.6 : 5.5) + 0.1,
      z: (r3 - 0.5) * (isIndoor ? 8 : 18),
      size: 0.012 + r1 * 0.028,
      drift: 0.08 + r2 * 0.22,
      phase: r3 * Math.PI * 2,
      opacity: 0.12 + r2 * 0.24,
    });
  }
  return motes;
}

export function AaaCinematicAtmosphere() {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId) as SceneId;
  const { preset } = useGraphicsQuality();
  const reducedMotion = useEffectiveReducedMotion();

  const isLow = preset.id === 'low';
  if (isLow || reducedMotion) return null;

  const isHero = isHeroScene(sceneId);
  // AAA boost: much denser, luxurious dust for hero scenes (feels like real air + light)
  const count = isHero 
    ? (preset.id === 'ultra' ? 92 : preset.id === 'high' ? 68 : 38) 
    : (preset.id === 'ultra' ? 52 : 28);

  return (
    <group key={`aaa-atmo-${sceneId}`}>
      <DustMoteCloud sceneId={sceneId} count={count} />
      <SoftVolumetricGlow sceneId={sceneId} />
      {/* Extra subtle god-ray dust layer on hero interiors for maximum cinematic depth */}
      {isHero && (preset.id === 'high' || preset.id === 'ultra') && (
        <HeroGodRayDust sceneId={sceneId} />
      )}
    </group>
  );
}

function DustMoteCloud({ sceneId, count }: { sceneId: string; count: number }) {
  const motes = useMemo(() => generateMotes(count, sceneId), [sceneId, count]);
  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    const g = groupRef.current;
    if (!g) return;
    timeRef.current += delta;
    const t = timeRef.current;
    // gentle drift
    for (let i = 0; i < g.children.length; i++) {
      const child = g.children[i] as THREE.Mesh;
      const m = motes[i];
      if (!m) continue;
      child.position.y = m.y + Math.sin(t * m.drift * 0.3 + m.phase) * 0.12;
      child.position.x = m.x + Math.sin(t * m.drift * 0.14 + m.phase * 1.3) * 0.08;
      child.position.z = m.z + Math.cos(t * m.drift * 0.11 + m.phase * 0.7) * 0.08;
      const mat = child.material as THREE.MeshBasicMaterial;
      if (mat) {
        mat.opacity = m.opacity * (0.7 + 0.3 * Math.sin(t * 0.4 + m.phase));
      }
    }
  });

  return (
    <group ref={groupRef}>
      {motes.map((m, i) => (
        <mesh key={i} position={[m.x, m.y, m.z]}>
          <sphereGeometry args={[m.size, 4, 4]} />
          <meshBasicMaterial
            color={sceneId.includes('volodka_room') || sceneId.includes('library') ? '#ffddb0' : sceneId.includes('cafe') || sceneId.includes('home') ? '#ffcc88' : '#d8e0f0'}
            transparent
            opacity={m.opacity}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}

function SoftVolumetricGlow({ sceneId }: { sceneId: string }) {
  const isIndoor = !sceneId.includes('street') && !sceneId.includes('park') && !sceneId.includes('pier') && !sceneId.includes('river') && !sceneId.includes('rooftop');
  if (!isIndoor) return null;

  // Very soft volumetric glow cards — cheap fog planes that catch light
  return (
    <group>
      <mesh position={[0, 1.6, 0]} rotation-x={-0.15}>
        <planeGeometry args={[12, 12]} />
        <meshBasicMaterial color="#0a0a16" transparent opacity={0.04} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.02, 0]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[9, 24]} />
        <meshBasicMaterial color={sceneId === 'volodka_room' ? '#1a1420' : '#0c0c18'} transparent opacity={0.06} depthWrite={false} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Extra god-ray dust for hero interiors — makes light shafts feel alive and thick (AAA) */
function HeroGodRayDust({ sceneId }: { sceneId: string }) {
  void sceneId;
  const count = 18;
  const motes = useMemo(() => {
    return Array.from({ length: count }, (_, i) => ({
      x: (Math.sin(i * 1.7) * 2.2),
      y: 0.8 + (i % 3) * 0.7,
      z: (Math.cos(i * 2.1) * 1.8),
      size: 0.018 + (i % 5) * 0.004,
      phase: i * 1.3,
    }));
  }, []);

  const groupRef = useRef<THREE.Group>(null);
  const timeRef = useRef(0);

  useFrameTick('misc', ({ delta }) => {
    const g = groupRef.current;
    if (!g) return;
    timeRef.current += delta;
    const t = timeRef.current;

    g.children.forEach((child, i) => {
      const m = motes[i];
      if (!m) return;
      const mesh = child as THREE.Mesh;
      mesh.position.y = m.y + Math.sin(t * 0.7 + m.phase) * 0.25;
      mesh.position.x = m.x + Math.sin(t * 0.4 + m.phase * 1.6) * 0.1;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (mat) mat.opacity = 0.22 + Math.sin(t * 1.1 + m.phase) * 0.12;
    });
  });

  return (
    <group ref={groupRef}>
      {motes.map((m, i) => (
        <mesh key={i} position={[m.x, m.y, m.z]}>
          <sphereGeometry args={[m.size, 3, 3]} />
          <meshBasicMaterial
            color="#e8d8b0"
            transparent
            opacity={0.22}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  );
}
