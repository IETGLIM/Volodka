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
import { t } from '@/i18n';

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

/** Файловый ambient story-ноды ('sounds/ambient/<name>.ogg') — v4.15.
 *  Раньше поле было мёртвыми данными: файлов не существовало, консьюмера не было.
 *  Теперь файлы сгенерированы (scripts/generate-ambient-audio.mjs), путь
 *  доставляется до SceneAudioController через AmbientPlayContext.storyAudioFile. */
export function getStoryAmbientAudioFile(
  showStoryOverlay: boolean,
  currentNodeId: string | null | undefined,
): string | null {
  if (!showStoryOverlay || !currentNodeId) return null;
  return STORY_NODES[currentNodeId]?.ambientSound ?? null;
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
    label: t(def.labelKey, def.label),
    accessibilityDescription: t(def.accessibilityDescriptionKey, def.accessibilityDescription),
  };
}
