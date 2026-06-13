
/* ─── Volodka RPG – Environmental Animator ─── */
/* Renders per-scene environmental animations defined in EnvironmentalAnimations.ts */

import { useGameStore } from '@/store/gameStore';
import { getSceneEnvAnimations } from '@/engine/EnvironmentalAnimations';
import { AnimationRenderer } from './environmental/AnimationRenderer';

interface EnvironmentalAnimatorProps {
  livePlayerPositionRef?: React.MutableRefObject<import('three').Vector3>;
}

/**
 * Reads the animation definitions for the current scene and renders them.
 * Place inside the Canvas/Physics tree.
 */
export function EnvironmentalAnimator({ livePlayerPositionRef: _livePlayerPositionRef }: EnvironmentalAnimatorProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId);
  const animations = getSceneEnvAnimations(sceneId);

  if (animations.length === 0) return null;

  return (
    <group key={`env-anim:${sceneId}`}>
      {animations.map((anim) => (
        <AnimationRenderer key={`${sceneId}:${anim.id}`} anim={anim} />
      ))}
    </group>
  );
}
