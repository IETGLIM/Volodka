/**
 * Full-body player avatar for cinematic third-person beats (wake-up, cutscenes, transitions).
 */

import type { MutableRefObject, RefObject } from 'react';
import type * as THREE from 'three';
import { useGameStore } from '@/store/gameStore';
import { getExplorationCharacterModelScale } from '@/config/scenes';
import { useCurrentSceneId } from '@/store/selectors';
import { CesiumPlayerModel } from './CesiumPlayerModel';

interface CinematicPlayerAvatarProps {
  groupRef?: RefObject<THREE.Group | null>;
  currentAnimRef: MutableRefObject<string>;
  rotationRef: MutableRefObject<number>;
}

function karmaGlowFromValue(karma: number): string {
  if (karma >= 60) return '#ffaa44';
  if (karma <= 30) return '#ff4444';
  return '#00ffee';
}

export function CinematicPlayerAvatar({
  groupRef,
  currentAnimRef,
  rotationRef,
}: CinematicPlayerAvatarProps) {
  const sceneId = useCurrentSceneId();
  const karma = useGameStore((s) => s.playerState.karma);
  const modelScale = getExplorationCharacterModelScale(sceneId);

  return (
    <group ref={groupRef}>
      <CesiumPlayerModel
        modelScale={modelScale}
        karmaGlow={karmaGlowFromValue(karma)}
        currentAnimRef={currentAnimRef}
        rotationRef={rotationRef}
      />
    </group>
  );
}
