import { STORY_NODES } from '@/data/storyNodes';
import {
  resolveAmbienceForScene,
  getAmbientSoundDef,
  type AmbienceResolveOptions,
  type ResolvedSceneAmbience,
} from '@/data/ambientSounds';
import { deriveSceneWeather } from '@/shared/weather/deriveSceneWeather';
import type { SceneId } from '@/config/sceneDefinitions';
import type { AmbientSoundType } from '@/shared/types/ambientSound';

export interface AmbientPresentationState {
  resolved: ResolvedSceneAmbience | null;
  label: string | null;
  accessibilityDescription: string | null;
}

export function getStoryProceduralAmbientOverride(
  showStoryOverlay: boolean,
  currentNodeId: string | null | undefined,
): AmbientSoundType | undefined {
  if (!showStoryOverlay || !currentNodeId) return undefined;
  return STORY_NODES[currentNodeId]?.proceduralAmbientOverride;
}

export function buildAmbienceResolveOptions(
  showStoryOverlay: boolean,
  currentNodeId: string | null | undefined,
  sceneId: SceneId,
  timeOfDay: number,
): AmbienceResolveOptions {
  const proceduralOverride = getStoryProceduralAmbientOverride(showStoryOverlay, currentNodeId);
  return {
    proceduralOverride,
    weather: deriveSceneWeather(sceneId, timeOfDay).type,
  };
}

export function resolveAmbientPresentation(
  sceneId: SceneId,
  timeOfDay: number,
  showStoryOverlay: boolean,
  currentNodeId: string | null | undefined,
): AmbientPresentationState {
  const resolved = resolveAmbienceForScene(
    sceneId,
    timeOfDay,
    buildAmbienceResolveOptions(showStoryOverlay, currentNodeId, sceneId, timeOfDay),
  );

  if (!resolved) {
    return { resolved: null, label: null, accessibilityDescription: null };
  }

  const def = getAmbientSoundDef(resolved.sound);
  return {
    resolved,
    label: def.label,
    accessibilityDescription: def.accessibilityDescription,
  };
}
