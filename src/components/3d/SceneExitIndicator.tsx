
/* ─── Volodka RPG – Scene exit indicators with proximity detection ─── */

import { useRef, useState, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { SceneExit } from '@/shared/types/game';
import { useSceneExitState } from '@/store/selectors';
import { getSceneExits } from '@/config/scenes';

/* ─── Constants ─── */
const EXIT_PROXIMITY_RANGE = 2.5; // Distance to show subtle foot glow

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
      if (glowRef.current) {
        glowRef.current.intensity = 0.28 + Math.sin(pulsePhaseRef.current) * 0.12;
      }
    }
  });

  const markerColor = exit.requiredFlag ? '#ff7755' : '#22eebb';

  return (
    <group position={exit.position}>
      {showIndicator && (
        <pointLight
          ref={glowRef}
          color={markerColor}
          intensity={0.3}
          distance={2.2}
          position={[0, 0.55, 0]}
        />
      )}
    </group>
  );
}
