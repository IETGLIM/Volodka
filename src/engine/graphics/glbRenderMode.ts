import type { AssetRenderMode, QualityPreset } from '@/engine/graphics/qualityPresets';
import type { NpcLodLevel } from '@/engine/lod/distanceLod';

export function isGlbRenderMode(mode: AssetRenderMode): boolean {
  return mode === 'glb' || mode === 'hybrid';
}

/** Hero GLB on high/ultra when preset enables hybrid or glb asset paths. */
export function shouldUseGlbPlayer(preset: QualityPreset): boolean {
  if (preset.id !== 'high' && preset.id !== 'ultra') return false;
  return (
    isGlbRenderMode(preset.npcRenderMode) || isGlbRenderMode(preset.environmentRenderMode)
  );
}

/** Story NPC GLB when preset allows and LOD is full detail. */
export function shouldUseGlbNpc(preset: QualityPreset, lodLevel: NpcLodLevel): boolean {
  if (lodLevel !== 'full') return false;
  return isGlbRenderMode(preset.npcRenderMode);
}
