import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { Group } from 'three';
import type { EnvAnimation } from '@/engine/EnvironmentalAnimations';

export function CurtainSwayAnim({ anim }: { anim: EnvAnimation }) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const amplitude = anim.config.amplitude ?? 0.05;
  const frequency = anim.config.frequency ?? 0.3;
  const axis = anim.config.axis ?? 2; // 0=X, 1=Y, 2=Z rotation

  useFrameTick('misc', ({ delta }) => {
    if (!groupRef.current) return;
    timeRef.current += delta;
    const sway = Math.sin(timeRef.current * frequency * Math.PI * 2) * amplitude;
    // Apply rotation based on axis
    if (axis === 0) groupRef.current.rotation.x = sway;
    else if (axis === 1) groupRef.current.rotation.y = sway;
    else groupRef.current.rotation.z = sway;
  });

  return (
    <group ref={groupRef} position={anim.position}>
      {/* Invisible anchor — the group rotates to simulate sway */}
      <mesh visible={false}>
        <boxGeometry args={[0.01, 0.01, 0.01]} />
        <meshBasicMaterial />
      </mesh>
    </group>
  );
}
