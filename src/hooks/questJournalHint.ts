/** Contextual journal / HUD hints for active quests. */

import { getSceneConfig } from '@/config/scenes';
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import {
  getIncidentScrollHint,
  getMariaConnectionHint,
  getNetworkInitiationHint,
  getPoetryCollectionHint,
  getSolnyshSpineHint,
  getVaultBackupTrialHint,
} from '@/engine/guidedStory/act1QuestHints';
import {
  getBasementHumHint,
  getCafeSafehouseHint,
  getDmitryDefectionHint,
  getMariaTruthHint,
  getPierWatchmanKeyHint,
  getPoetrySmugglingHint,
  getThreadOf18LinesHint,
  getVaultDefenseHint,
  getVaultKeyFragmentsHint,
  getZaremaRescueHint,
} from '@/engine/guidedStory/act23QuestHints';
import {
  getGuildInfiltrationHint,
  getPoetryBroadcastHint,
  getRoofOfTheWorldHint,
} from '@/engine/guidedStory/act4QuestHints';
import { buildGuidanceDirectionHint } from '@/engine/guidedStory/guidanceLocation';
import {
  getNextTrackedObjective,
  getQuestMarker,
} from '@/store/questStore';
import type { SceneId } from '@/shared/types/game';

const SOLNYSH_SPINE_QUEST_IDS = new Set([
  'solnysh_comfort',
  'solnysh_roof_wine',
  'solnysh_relocation',
]);

/**
 * Prefer live Act-1/2/3 spine cues; otherwise next objective + scene travel hint.
 */
export function buildQuestJournalContextualHint(
  questId: string,
  currentSceneId: SceneId,
): string | null {
  if (questId === 'first_reading') {
    const early = getFirstReadingHint();
    if (early) return early;
  }
  if (questId === 'maria_connection') {
    const live = getMariaConnectionHint();
    if (live) return live;
  }
  if (questId === 'incident_scroll_4729') {
    const live = getIncidentScrollHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'poetry_collection') {
    const live = getPoetryCollectionHint();
    if (live) return live;
  }
  if (questId === 'vault_backup_trial') {
    const live = getVaultBackupTrialHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'network_initiation') {
    const live = getNetworkInitiationHint(currentSceneId);
    if (live) return live;
  }
  if (SOLNYSH_SPINE_QUEST_IDS.has(questId)) {
    const live = getSolnyshSpineHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'cafe_safehouse') {
    const live = getCafeSafehouseHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'dmitry_defection') {
    const live = getDmitryDefectionHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'basement_hum') {
    const live = getBasementHumHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'zarema_rescue') {
    const live = getZaremaRescueHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'maria_truth') {
    const live = getMariaTruthHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'vault_key_fragments') {
    const live = getVaultKeyFragmentsHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'poetry_smuggling') {
    const live = getPoetrySmugglingHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'pier_watchman_key') {
    const live = getPierWatchmanKeyHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'vault_defense') {
    const live = getVaultDefenseHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'thread_of_18_lines') {
    const live = getThreadOf18LinesHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'guild_infiltration') {
    const live = getGuildInfiltrationHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'poetry_broadcast') {
    const live = getPoetryBroadcastHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'roof_of_the_world') {
    const live = getRoofOfTheWorldHint(currentSceneId);
    if (live) return live;
  }

  const next = getNextTrackedObjective(questId);
  if (!next) return null;

  const marker = getQuestMarker(questId);
  const direction = buildGuidanceDirectionHint(marker?.sceneId, currentSceneId);

  if (direction && marker?.sceneId && marker.sceneId !== currentSceneId) {
    return `${next.description} · ${direction}`;
  }
  if (direction && marker?.sceneId === currentSceneId) {
    return `${next.description} · ${direction}`;
  }
  if (marker?.sceneId && marker.sceneId !== currentSceneId) {
    const name = getSceneConfig(marker.sceneId).name;
    return `${next.description} · Перейдите: ${name}`;
  }
  return next.description;
}

/** Short route CTA when the quest marker is off-scene. */
export function buildQuestJournalRouteCta(
  questId: string,
  currentSceneId: SceneId,
): string | null {
  const marker = getQuestMarker(questId);
  if (!marker?.sceneId || marker.sceneId === currentSceneId) return null;
  const name = getSceneConfig(marker.sceneId).name;
  return `Маршрут → ${name}`;
}
