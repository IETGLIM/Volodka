
/* ─── Volodka RPG – Scene exit indicators with proximity detection ─── */

import { useRef, useState, useMemo } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';
import type { SceneExit } from '@/shared/types/game';
import { useSceneExitState } from '@/store/selectors';
import { getSceneExits } from '@/config/scenes';
import { ProximityGodRay } from './ProximityGodRay';

/* ─── Constants ─── */
const EXIT_PROXIMITY_RANGE = 2.5; // Distance to show subtle foot glow

interface SceneExitIndicatorProps {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}

/** Renders exit markers at scene boundaries and triggers scene transitions */
export function SceneExitIndicator({ livePlayerPositionRef }: SceneExitIndicatorProps) {
  const {
    sceneId,
    playerFlags,
    playerKarma,
    playerSkills,
    collectedPoems,
    currentAct,
    timeOfDay,
  } = useSceneExitState();

  const exits = useMemo(
    () =>
      getSceneExits(sceneId, playerFlags, playerKarma, {
        skills: playerSkills,
        collectedPoems,
        currentAct,
        timeOfDay,
      }),
    [sceneId, playerFlags, playerKarma, playerSkills, collectedPoems, currentAct, timeOfDay],
  );

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
  const showIndicatorRef = useRef(false);
  const _exitPosRef = useRef(new THREE.Vector3());
  const proximityRef = useRef(0);
  const pulsePhaseRef = useRef(0);
  const [showIndicator, setShowIndicator] = useState(false);

  useFrameTick('interaction', ({ delta }) => {
    const playerPos = livePlayerPositionRef.current;
    _exitPosRef.current.set(exit.position[0], exit.position[1], exit.position[2]);
    const dist = playerPos.distanceTo(_exitPosRef.current);

    const isNear = dist < EXIT_PROXIMITY_RANGE;
    proximityRef.current = isNear ? Math.max(0.4, 1 - dist / (EXIT_PROXIMITY_RANGE + 0.5)) : 0;
    if (isNear) pulsePhaseRef.current += delta * 2.6;
    if (isNear !== showIndicatorRef.current) {
      showIndicatorRef.current = isNear;
      setShowIndicator(isNear);
    }
  });

  const markerColor = exit.requiredFlag ? '#ff7755' : '#22eebb';

  return (
    <group position={exit.position}>
      <ProximityGodRay
        active={showIndicator}
        color={markerColor}
        beamHeight={2.3}
        baseY={0.15}
        proximityRef={proximityRef}
        pulsePhaseRef={pulsePhaseRef}
      />
    </group>
  );
}
