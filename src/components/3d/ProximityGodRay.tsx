import { useRef } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

interface ProximityGodRayProps {
  /** Static active flag — omit when using activeRef */
  active?: boolean;
  /** Imperative active flag — avoids React re-renders when toggled from central tick */
  activeRef?: React.RefObject<boolean>;
  color?: string;
  /** Imperative beam color — updated without React re-render */
  colorRef?: React.RefObject<string>;
  beamHeight?: number;
  baseY?: number;
  /** Per-frame proximity factor (0–1) — avoids React re-renders */
  proximityRef?: React.RefObject<number>;
  /** Brief intensity spike on interact — parent sets true for ~200ms */
  flashRef?: React.RefObject<boolean>;
  /** Hover pulse phase in radians — synced from parent distance loop */
  pulsePhaseRef?: React.RefObject<number>;
  /** Steady glow (no sin pulse) — reduced-motion poem highlights */
  staticHighlightRef?: React.RefObject<boolean>;
}

/** Soft spotlight + volumetric cone for nearby interactables (no floor ring). */
export function ProximityGodRay({
  active = false,
  activeRef,
  color = '#88eeff',
  colorRef,
  beamHeight = 2.8,
  baseY = 0.35,
  proximityRef,
  flashRef,
  pulsePhaseRef,
  staticHighlightRef,
}: ProximityGodRayProps) {
  const spotRef = useRef<THREE.SpotLight>(null);
  const fillRef = useRef<THREE.PointLight>(null);
  const coneMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const coneMeshRef = useRef<THREE.Mesh>(null);
  const pulseRef = useRef(0);
  const usesActiveRef = activeRef !== undefined;
  const resolvedColor = colorRef?.current ?? color;

  useFrameTick('interaction', ({ delta }) => {
    const liveActive = usesActiveRef ? (activeRef?.current ?? false) : active;
    const liveColor = colorRef?.current ?? color;
    if (!liveActive) {
      if (spotRef.current) spotRef.current.intensity = 0;
      if (fillRef.current) fillRef.current.intensity = 0;
      if (coneMatRef.current) coneMatRef.current.opacity = 0;
      if (coneMeshRef.current) coneMeshRef.current.visible = false;
      return;
    }

    if (coneMeshRef.current) coneMeshRef.current.visible = true;
    if (!pulsePhaseRef) pulseRef.current += delta * 3.4;
    const prox = Math.max(0.25, Math.min(1, proximityRef?.current ?? 1));
    const phase = pulsePhaseRef?.current ?? pulseRef.current;
    const hoverPulse = staticHighlightRef?.current ? 0 : Math.sin(phase) * 0.14;
    const flashBoost = flashRef?.current ? 0.55 : 0;
    const intensity = (0.4 + hoverPulse + flashBoost) * prox;

    if (spotRef.current) {
      spotRef.current.intensity = intensity;
      spotRef.current.color.set(liveColor);
    }
    if (fillRef.current) {
      fillRef.current.intensity = intensity * 0.62;
      fillRef.current.color.set(liveColor);
    }
    if (coneMatRef.current) {
      coneMatRef.current.opacity = (0.1 + hoverPulse * 0.04 + flashBoost * 0.06) * prox;
      coneMatRef.current.color.set(liveColor);
    }
  });

  if (!usesActiveRef && !active) return null;

  return (
    <group position={[0, baseY, 0]}>
      <spotLight
        ref={spotRef}
        color={resolvedColor}
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
      <mesh ref={coneMeshRef} position={[0, beamHeight * 0.42, 0]} rotation={[Math.PI, 0, 0]}>
        <coneGeometry args={[0.38, beamHeight * 0.9, 16, 1, true]} />
        <meshBasicMaterial
          ref={coneMatRef}
          color={resolvedColor}
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
