
/* ─── Volodka RPG – Environmental Animator ─── */
/* Renders per-scene environmental animations defined in EnvironmentalAnimations.ts */

import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getSceneEnvAnimations } from '@/engine/EnvironmentalAnimations';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { resolveEnvAnimationsForTier } from '@/engine/world/resolveEnvAnimationBudget';
import type { SceneId } from '@/shared/types/game';
import { AnimationRenderer } from './environmental/AnimationRenderer';

interface EnvironmentalAnimatorProps {
  livePlayerPositionRef?: React.MutableRefObject<import('three').Vector3>;
}

/**
 * Reads the animation definitions for the current scene and renders them.
 * Place inside the Canvas/Physics tree.
 */
export function EnvironmentalAnimator({ livePlayerPositionRef: _livePlayerPositionRef }: EnvironmentalAnimatorProps) {
  const sceneId = useGameStore((s) => s.exploration.currentSceneId) as SceneId;
  const { preset } = useGraphicsQuality();

  const animations = useMemo(() => {
    const all = getSceneEnvAnimations(sceneId);
    return resolveEnvAnimationsForTier(sceneId, all, preset.id);
  }, [sceneId, preset.id]);

  if (animations.length === 0) return null;

  return (
    <group key={`env-anim:${sceneId}`}>
      {animations.map((anim) => (
        <AnimationRenderer key={`${sceneId}:${anim.id}`} anim={anim} />
      ))}
    </group>
  );
}
