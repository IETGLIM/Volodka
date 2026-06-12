import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

interface ProximityGodRayProps {
  active: boolean;
  color?: string;
  beamHeight?: number;
  baseY?: number;
}

/** Soft spotlight + volumetric cone for nearby interactables (no floor ring). */
export function ProximityGodRay({
  active,
  color = '#88eeff',
  beamHeight = 2.4,
  baseY = 0.35,
}: ProximityGodRayProps) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);
  const pulseRef = useRef(0);

  useFrameTick('interaction', ({ delta }) => {
    if (!active) return;
    pulseRef.current += delta * 2.4;
    const pulse = 0.34 + Math.sin(pulseRef.current) * 0.1;
    if (spotRef.current) spotRef.current.intensity = pulse;
    if (fillRef.current) fillRef.current.intensity = pulse * 0.55;
  });

  if (!active) return null;

  return (
    <group position={[0, baseY, 0]}>
      <spotLight
        ref={spotRef}
        color={color}
        intensity={0.34}
        angle={0.42}
        penumbra={0.92}
        distance={4.5}
        position={[0, beamHeight, 0.15]}
        castShadow={false}
      >
        <object3D attach="target" position={[0, 0, 0]} />
      </spotLight>
      <mesh position={[0, beamHeight * 0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.38, beamHeight * 0.88, 14, 1, true]} />
        <meshBasicMaterial
          color={color}
          transparent
          opacity={0.09}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      <pointLight ref={fillRef} color={color} intensity={0.18} distance={2.4} position={[0, 0.25, 0]} />
    </group>
  );
}
