import { useMemo } from 'react';
import { useGraphicsQuality } from '@/engine/graphics/useGraphicsQuality';
import { allowsGlbAssetRendering } from '@/engine/graphics/qualityPresets';
import { getSceneBackdropShell } from '@/config/sceneBackdropShells';
import type { EnvironmentMaterialMood } from '@/engine/graphics/materials/weatherEnvironmentMaterials';
import { AuthoredInteriorShell } from './AuthoredInteriorShell';
import type { SceneId } from '@/shared/types/game';

interface SceneBackdropShellProps {
  sceneId: SceneId;
}

function backdropMaterialMood(sceneId: SceneId): EnvironmentMaterialMood {
  if (sceneId === 'river_pier' || sceneId === 'pier_evening') return 'street';
  if (sceneId === 'chk_forest_zorge' || sceneId === 'chk_campfire_night') return 'plaza';
  // Factory / bunker / basement backdrops — concrete industrial, not cafe plaster.
  return 'plaza';
}

/** Kenney/CC0 backdrop shell for hero outdoor scenes (factory, pier, CHK forest). */
export function SceneBackdropShell({ sceneId }: SceneBackdropShellProps) {
  const { preset } = useGraphicsQuality();
  const placement = useMemo(() => getSceneBackdropShell(sceneId), [sceneId]);

  if (
    !placement ||
    preset.visualLite ||
    !allowsGlbAssetRendering(preset.environmentRenderMode)
  ) {
    return null;
  }

  return (
    <AuthoredInteriorShell
      sceneId={sceneId}
      url={placement.url}
      position={placement.position}
      rotationY={placement.rotationY ?? 0}
      scale={placement.scale ?? 1}
      castShadow={preset.shadows}
      materialMood={backdropMaterialMood(sceneId)}
    />
  );
}
