import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

interface ProximityGodRayProps {
  active: boolean;
  color?: string;
  beamHeight?: number;
  baseY?: number;
  /** Per-frame proximity factor (0–1) — avoids React re-renders */
  proximityRef?: React.RefObject<number>;
  /** Brief intensity spike on interact — parent sets true for ~200ms */
  flashRef?: React.RefObject<boolean>;
  /** Hover pulse phase in radians — synced from parent distance loop */
  pulsePhaseRef?: React.RefObject<number>;
}

/** Soft spotlight + volumetric cone for nearby interactables (no floor ring). */
export function ProximityGodRay({
  active,
  color = '#88eeff',
  beamHeight = 2.4,
  baseY = 0.35,
  proximityRef,
  flashRef,
  pulsePhaseRef,
}: ProximityGodRayProps) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);
  const coneMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const pulseRef = useRef(0);

  useFrameTick('interaction', ({ delta }) => {
    if (!active) return;

    pulseRef.current += delta * 2.8;
    const prox = Math.max(0.25, Math.min(1, proximityRef?.current ?? 1));
    const phase = pulsePhaseRef?.current ?? pulseRef.current;
    const hoverPulse = Math.sin(phase) * 0.14;
    const flashBoost = flashRef?.current ? 0.42 : 0;
    const intensity = (0.4 + hoverPulse + flashBoost) * prox;

    if (spotRef.current) spotRef.current.intensity = intensity;
    if (fillRef.current) fillRef.current.intensity = intensity * 0.62;
    if (coneMatRef.current) {
      coneMatRef.current.opacity = (0.1 + hoverPulse * 0.04 + flashBoost * 0.06) * prox;
    }
  });

  if (!active) return null;

  return (
    <group position={[0, baseY, 0]}>
      <spotLight
        ref={spotRef}
        color={color}
        intensity={0.4}
        angle={0.38}
        penumbra={0.94}
        distance={5}
        decay={2}
        position={[0, beamHeight, 0.12]}
        castShadow={false}
      >
        <object3D attach="target" position={[0, 0, 0]} />
      </spotLight>
      <mesh position={[0, beamHeight * 0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.34, beamHeight * 0.9, 16, 1, true]} />
        <meshBasicMaterial
          ref={coneMatRef}
          color={color}
          transparent
          opacity={0.1}
          depthWrite={false}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <pointLight ref={fillRef} color={color} intensity={0.22} distance={2.8} decay={2} position={[0, 0.25, 0]} />
    </group>
  );
}
