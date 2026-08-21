/* ─── Volodka RPG – Puddle Reflections ───
 * Simple reflective ground planes with high metalness/low roughness.
 * Opacity pulses subtly between 0.6 and 0.8 for a shimmering wet look.
 */

import { useRef, useMemo, useEffect } from 'react';
import { Mesh, PlaneGeometry, MeshStandardMaterial, DoubleSide } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';

export interface PuddleProps {
  /** World position [x, y, z] — y should be slightly above the ground surface */
  position?: [number, number, number];
  /** Size [width, depth] in world units */
  size?: [number, number];
  /** Base rotation around Y axis in radians */
  rotation?: number;
}

/**
 * A simple reflective puddle on the ground.
 * Uses MeshStandardMaterial with high metalness and low roughness
 * to simulate wet reflective surfaces.
 */
export function Puddle({
  position = [0, 0.005, 0],
  size = [1.5, 1.0],
  rotation = 0,
}: PuddleProps) {
  const meshRef = useRef<Mesh>(null);
  const timeRef = useRef(0);

  const { geometry, material } = useMemo(() => {
    const geo = new PlaneGeometry(size[0], size[1]);

    const mat = new MeshStandardMaterial({
      color: '#1a2030',
      metalness: 0.92,
      roughness: 0.08,
      transparent: true,
      opacity: 0.7,
      side: DoubleSide,
      envMapIntensity: 0.6,
    });

    return { geometry: geo, material: mat };
  }, [size]); // eslint-disable-line react-hooks/exhaustive-deps

  // Dispose on unmount
  useEffect(() => {
    const geo = geometry;
    const mat = material;
    return () => {
      geo.dispose();
      mat.dispose();
    };
  }, [geometry, material]);

  // Animate opacity pulse (0.6 ↔ 0.8)
  useFrameTick('misc', ({ delta }) => {
    if (!meshRef.current) return;
    timeRef.current += delta;
    const t = timeRef.current;
    // Pulse between 0.6 and 0.8 with a slow cycle (~4 seconds)
    material.opacity = 0.7 + 0.1 * Math.sin(t * Math.PI * 0.5);
  });

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      position={position}
      rotation={[-Math.PI / 2, 0, rotation]}
    />
  );
}
