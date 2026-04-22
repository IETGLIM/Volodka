'use client';

import { memo, useEffect, useMemo } from 'react';
import * as THREE from 'three';

/**
 * Кабина лифта на финале интро: металл, неон этажа, направляющие — пока активен DOM-оверлей спуска.
 */
export const IntroElevatorShaftVisual = memo(function IntroElevatorShaftVisual({
  active,
}: {
  active: boolean;
}) {
  const floorLabelTex = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 160;
    const ctx = c.getContext('2d');
    if (!ctx) {
      throw new Error('2D context unavailable for elevator label');
    }
    const g = ctx.createLinearGradient(0, 0, c.width, c.height);
    g.addColorStop(0, '#0b1220');
    g.addColorStop(1, '#1e293b');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.35)';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, c.width - 8, c.height - 8);
    ctx.fillStyle = '#22c55e';
    ctx.font = 'bold 44px ui-monospace, monospace';
    ctx.fillText('10 → 3  ЖИЛ', 28, 62);
    ctx.fillStyle = 'rgba(148, 163, 184, 0.95)';
    ctx.font = '22px ui-monospace, monospace';
    ctx.fillText('LIFT / NODE-B / SYNC', 28, 108);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    return tex;
  }, []);

  useEffect(() => {
    return () => {
      floorLabelTex.dispose();
    };
  }, [floorLabelTex]);

  if (!active) return null;

  const railPositions: [number, number, number][] = [
    [-0.95, 0.2, 0.95],
    [0.95, 0.2, 0.95],
    [-0.95, 0.2, -0.95],
    [0.95, 0.2, -0.95],
  ];

  return (
    <group position={[0.35, 1.15, 3.12]} name="IntroElevatorShaftVisual" userData={{ noCameraCollision: true }}>
      <mesh>
        <boxGeometry args={[2.35, 2.45, 2.35]} />
        <meshStandardMaterial
          color="#1a222c"
          metalness={0.78}
          roughness={0.36}
          side={THREE.BackSide}
        />
      </mesh>
      {railPositions.map((p, i) => (
        <mesh key={`rail-${i}`} position={p}>
          <boxGeometry args={[0.06, 2.25, 0.06]} />
          <meshStandardMaterial color="#334155" metalness={0.55} roughness={0.42} />
        </mesh>
      ))}
      <mesh position={[0, -0.82, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.95, 1.95]} />
        <meshStandardMaterial
          map={floorLabelTex}
          roughness={0.55}
          metalness={0.15}
          emissive="#064e3b"
          emissiveIntensity={0.35}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0.35, 1.12]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[1.8, 0.14]} />
        <meshStandardMaterial
          color="#0f172a"
          emissive="#22c55e"
          emissiveIntensity={0.85}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>
      <pointLight position={[0, 1.05, 0.4]} intensity={0.62} color="#38bdf8" distance={4} decay={2} />
      <pointLight position={[0.55, 0.35, -0.55]} intensity={0.28} color="#f59e0b" distance={3} decay={2} />
      <pointLight position={[-0.45, 1.25, -0.35]} intensity={0.18} color="#a7f3d0" distance={3.5} decay={2} />
    </group>
  );
});
