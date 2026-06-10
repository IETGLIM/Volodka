
/* ─── Volodka RPG – Scene exit indicators with proximity detection ─── */

import { useRef, useState, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { SceneExit } from '@/shared/types/game';
import { useSceneExitState } from '@/store/selectors';
import { getSceneExits } from '@/config/scenes';

/* ─── Constants ─── */
const EXIT_PROXIMITY_RANGE = 2.5; // Distance to show subtle foot glow

/** Small ground ring — fixed size, not scene-scale */
const FOOT_RING_INNER = 0.28;
const FOOT_RING_OUTER = 0.4;

interface SceneExitIndicatorProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Renders exit markers at scene boundaries and triggers scene transitions */
export function SceneExitIndicator({ livePlayerPositionRef }: SceneExitIndicatorProps) {
  const { sceneId, playerFlags, playerKarma } = useSceneExitState();

  const exits = useMemo(() => getSceneExits(sceneId, playerFlags, playerKarma), [sceneId, playerFlags, playerKarma]);

  return (
    <group key={`exits:${sceneId}`}>
      {exits.map((exit, idx) => (
        <ExitMarker
          key={`${exit.targetScene}-${idx}`}
          exit={exit}
          livePlayerPositionRef={livePlayerPositionRef}
        />
      ))}
    </group>
  );
}

/** Single exit marker with proximity glow (transitions via InteractiveTriggers). */
function ExitMarker({
  exit,
  livePlayerPositionRef,
}: {
  exit: SceneExit;
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const footRingMatRef = useRef<THREE.MeshBasicMaterial>(null);
  const glowRef = useRef<THREE.PointLight>(null);
  const showIndicatorRef = useRef(false);
  const _exitPosRef = useRef(new THREE.Vector3()); // P3-FIX: pre-allocated for proximity calc
  const [showIndicator, setShowIndicator] = useState(false);
  const pulsePhaseRef = useRef(0);

  useFrameTick('interaction', ({ delta }) => {
    const playerPos = livePlayerPositionRef.current;
    _exitPosRef.current.set(exit.position[0], exit.position[1], exit.position[2]);
    const dist = playerPos.distanceTo(_exitPosRef.current);

    const isNear = dist < EXIT_PROXIMITY_RANGE;
    if (isNear !== showIndicatorRef.current) {
      showIndicatorRef.current = isNear;
      setShowIndicator(isNear);
    }

    if (isNear) {
      pulsePhaseRef.current += delta * 2.5;
      const pulse = 0.22 + Math.sin(pulsePhaseRef.current) * 0.1;
      if (footRingMatRef.current) {
        footRingMatRef.current.opacity = pulse;
      }
      if (glowRef.current) {
        glowRef.current.intensity = 0.35 + Math.sin(pulsePhaseRef.current) * 0.15;
      }
    }
  });

  const markerColor = exit.requiredFlag ? '#ff7755' : '#22eebb';

  return (
    <group position={exit.position}>
      {showIndicator && (
        <>
          <mesh rotation-x={-Math.PI / 2} position={[0, 0.02, 0]}>
            <ringGeometry args={[FOOT_RING_INNER, FOOT_RING_OUTER, 24]} />
            <meshBasicMaterial
              ref={footRingMatRef}
              color={markerColor}
              transparent
              opacity={0.25}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
          <pointLight
            ref={glowRef}
            color={markerColor}
            intensity={0.4}
            distance={3}
            position={[0, 0.4, 0]}
          />
        </>
      )}
    </group>
  );
}
