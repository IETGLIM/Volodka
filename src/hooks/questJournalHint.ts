/** Contextual journal / HUD hints for active quests. */

import { getSceneConfig } from '@/config/scenes';
import { getFirstReadingHint } from '@/engine/guidedStory/firstReadingHint';
import {
  getCafeStreetWhisperHint,
  getChipCafeClearanceHint,
  getIncidentScrollHint,
  getMariaConnectionHint,
  getNightCityCallHint,
  getNetworkInitiationHint,
  getOfficeLobbyWatchHint,
  getPoetryCollectionHint,
  getSolnyshSpineHint,
  getVaultBackupTrialHint,
} from '@/engine/guidedStory/act1QuestHints';
import {
  getAlbertsLessonHint,
  getCafeBackroomEchoHint,
  getCorridorLetterHint,
  getMorningRitualHint,
  getMorningSyncHint,
  getNightShiftMysteryHint,
  getZaremaRadioHint,
} from '@/engine/guidedStory/act1SideQuestHints';
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
  getArchiveOfForgottenHint,
  getBankTransferHint,
  getBankingCrashHint,
  getBlindSpotHint,
  getBrokenTerminalHint,
  getDigitalGhostHint,
  getGuildInfiltrationHint,
  getLastPoemHint,
  getNightWatchHint,
  getOpenstackCrisisHint,
  getPoemUndercoverHint,
  getPoetryBroadcastHint,
  getRoofOfTheWorldHint,
  getSecretsOfOldCodeHint,
  getVoiceOfThePastHint,
  getVoicesOfFactoryHint,
} from '@/engine/guidedStory/act4QuestHints';
import {
  getChkGuitarStringsHint,
  getChkPortwineDeliveryHint,
  getFactoryBabaZinaTeaHint,
  getFactoryZaryaMemoryHint,
  getLibraryKatyaResearchHint,
  getLibraryLostArchiveHint,
  getPierMidnightFishingHint,
  getPierRitkaStringsHint,
  getResistanceDefectorRescueHint,
  getResistanceSafehouseHint,
} from '@/engine/guidedStory/aaaSideQuestHints';
import {
  getBunkerCodePoemBreakHint,
  getChkNeonArchiveHint,
  getDefectorRescueExpandedHint,
  getParkCyberBloomHint,
  getPoetsMonumentInscriptionHint,
  getRooftopBroadcastSetupHint,
  getServerPoemHuntHint,
  getStreetSamizdatHint,
  getZaremaEvidenceRunHint,
  getZaryaMemoryRestoreHint,
} from '@/engine/guidedStory/phase5SideQuestHints';
import {
  getEchoOfVladimirHint,
  getFinalCodeHint,
  getMachineConfessionHint,
  getNightBeforeDawnHint,
} from '@/engine/guidedStory/act5QuestHints';
import {
  getAct6SecretArchiveHint,
  getDataHeistHint,
  getRooftopConfrontationHint,
  getSystemInfiltrationHint,
  getTraitorInTheGuildHint,
  getUndergroundResistanceHint,
} from '@/engine/guidedStory/act6QuestHints';
import {
  getEpilogueLettersHint,
  getEpilogueMonumentHint,
  getFinalPoemHint,
  getRebuildTheGuildHint,
  getSystemTakedownHint,
  getVolodkaLegacyHint,
} from '@/engine/guidedStory/act7QuestHints';
import {
  getTolpaAct3SanctuaryHint,
  getTolpaAct4ExfiltrationHint,
  getTolpaAct4ServerHeistHint,
  getTolpaBondHint,
  getTolpaFirstFireHint,
  getTolpaForestGuideHint,
  getTolpaGuitarNightHint,
  getTolpaPoemFireHint,
  getTolpaPortwineOathHint,
  getTolpaQuantumFireHint,
  getTolpaWhisperHint,
} from '@/engine/guidedStory/chkTolpaQuestHints';
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
  if (questId === 'night_city_call') {
    const live = getNightCityCallHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'maria_connection') {
    const live = getMariaConnectionHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'cafe_street_whisper') {
    const live = getCafeStreetWhisperHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'chip_cafe_clearance') {
    const live = getChipCafeClearanceHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'office_lobby_watch') {
    const live = getOfficeLobbyWatchHint(currentSceneId);
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
  if (questId === 'night_shift_mystery') {
    const live = getNightShiftMysteryHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'alberts_lesson') {
    const live = getAlbertsLessonHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'corridor_letter') {
    const live = getCorridorLetterHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'zarema_radio') {
    const live = getZaremaRadioHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'morning_ritual') {
    const live = getMorningRitualHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'cafe_backroom_echo') {
    const live = getCafeBackroomEchoHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'morning_sync') {
    const live = getMorningSyncHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_whisper') {
    const live = getTolpaWhisperHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_first_fire') {
    const live = getTolpaFirstFireHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_portwine_oath') {
    const live = getTolpaPortwineOathHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_quantum_fire') {
    const live = getTolpaQuantumFireHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_forest_guide') {
    const live = getTolpaForestGuideHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_guitar_night') {
    const live = getTolpaGuitarNightHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_bond') {
    const live = getTolpaBondHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_poem_fire') {
    const live = getTolpaPoemFireHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_act3_sanctuary') {
    const live = getTolpaAct3SanctuaryHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_act4_exfiltration') {
    const live = getTolpaAct4ExfiltrationHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'tolpa_act4_server_heist') {
    const live = getTolpaAct4ServerHeistHint(currentSceneId);
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
  if (questId === 'last_poem') {
    const live = getLastPoemHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'blind_spot') {
    const live = getBlindSpotHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'final_code') {
    const live = getFinalCodeHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'machine_confession') {
    const live = getMachineConfessionHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'echo_of_vladimir') {
    const live = getEchoOfVladimirHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'night_before_dawn') {
    const live = getNightBeforeDawnHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'archive_of_forgotten') {
    const live = getArchiveOfForgottenHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'digital_ghost') {
    const live = getDigitalGhostHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'voices_of_factory') {
    const live = getVoicesOfFactoryHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'secrets_of_old_code') {
    const live = getSecretsOfOldCodeHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'banking_crash') {
    const live = getBankingCrashHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'bank_transfer') {
    const live = getBankTransferHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'night_watch') {
    const live = getNightWatchHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'poem_undercover') {
    const live = getPoemUndercoverHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'broken_terminal') {
    const live = getBrokenTerminalHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'voice_of_the_past') {
    const live = getVoiceOfThePastHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'openstack_crisis') {
    const live = getOpenstackCrisisHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'pier_midnight_fishing') {
    const live = getPierMidnightFishingHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'pier_ritka_strings') {
    const live = getPierRitkaStringsHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'library_lost_archive') {
    const live = getLibraryLostArchiveHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'library_katya_research') {
    const live = getLibraryKatyaResearchHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'factory_zarya_memory') {
    const live = getFactoryZaryaMemoryHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'factory_baba_zina_tea') {
    const live = getFactoryBabaZinaTeaHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'resistance_safehouse') {
    const live = getResistanceSafehouseHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'resistance_defector_rescue') {
    const live = getResistanceDefectorRescueHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'chk_portwine_delivery') {
    const live = getChkPortwineDeliveryHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'chk_guitar_strings') {
    const live = getChkGuitarStringsHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act2_server_poem_hunt') {
    const live = getServerPoemHuntHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act2_chk_neon_archive') {
    const live = getChkNeonArchiveHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act3_park_cyber_bloom') {
    const live = getParkCyberBloomHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act3_zarema_evidence_run') {
    const live = getZaremaEvidenceRunHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act4_rooftop_broadcast_setup') {
    const live = getRooftopBroadcastSetupHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act4_street_samizdat') {
    const live = getStreetSamizdatHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act5_factory_zarya_memory_restore') {
    const live = getZaryaMemoryRestoreHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act5_bunker_code_poem_break') {
    const live = getBunkerCodePoemBreakHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act6_defector_rescue_expanded') {
    const live = getDefectorRescueExpandedHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'quest_act7_poets_monument_inscription') {
    const live = getPoetsMonumentInscriptionHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'traitor_in_the_guild') {
    const live = getTraitorInTheGuildHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'underground_resistance') {
    const live = getUndergroundResistanceHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'data_heist') {
    const live = getDataHeistHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'act6_secret_archive') {
    const live = getAct6SecretArchiveHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'system_infiltration') {
    const live = getSystemInfiltrationHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'rooftop_confrontation') {
    const live = getRooftopConfrontationHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'rebuild_the_guild') {
    const live = getRebuildTheGuildHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'system_takedown') {
    const live = getSystemTakedownHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'final_poem') {
    const live = getFinalPoemHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'volodka_legacy') {
    const live = getVolodkaLegacyHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'epilogue_letters') {
    const live = getEpilogueLettersHint(currentSceneId);
    if (live) return live;
  }
  if (questId === 'epilogue_monument') {
    const live = getEpilogueMonumentHint(currentSceneId);
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
