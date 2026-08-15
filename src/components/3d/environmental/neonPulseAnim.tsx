import { useRef, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Color, Mesh, MeshStandardMaterial } from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';

export function NeonPulseAnim({ anim }: { anim: EnvAnimation }) {
  const meshRef = useRef<Mesh>(null);
  const materialRef = useRef<MeshStandardMaterial>(null);
  const timeRef = useRef(0);
  const speed = anim.config.speed ?? 1.0;
  const minE = anim.config.minEmissive ?? 0.2;
  const maxE = anim.config.maxEmissive ?? 0.8;
  const colorR = anim.config.colorR ?? 0.3;
  const colorG = anim.config.colorG ?? 0.5;
  const colorB = anim.config.colorB ?? 1.0;

  const emissiveColor = useMemo(
    () => new Color(colorR, colorG, colorB),
    [colorR, colorG, colorB]
  );

  useFrameTick('misc', ({ delta }) => {
    if (!materialRef.current) return;
    timeRef.current += delta;
    const pulse = minE + (maxE - minE) * (0.5 + 0.5 * Math.sin(timeRef.current * speed * Math.PI * 2));
    materialRef.current.emissiveIntensity = pulse;
  }, { visibilityRef: meshRef });

  return (
    <mesh ref={meshRef} position={anim.position}>
      <boxGeometry args={[0.8, 0.15, 0.05]} />
      <meshStandardMaterial
        ref={materialRef}
        color="#111111"
        emissive={emissiveColor}
        emissiveIntensity={0.5}
        toneMapped={false}
      />
    </mesh>
  );
}
