/** Live contextual cues for Act 2 hub connector quests (Stages 1–2). */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import type { QuestState } from '@/shared/types/game';

function findActiveQuest(questId: string): QuestState | null {
  try {
    const snap = getGameSnapshot();
    return snap.quests.find((q) => q.questId === questId && q.status === 'active') ?? null;
  } catch {
    return null;
  }
}

function objectiveDone(quest: QuestState, objectiveId: string): boolean {
  return quest.objectives[objectiveId] === true;
}

/** Кофейный релей — cafe envelope → office colleague. */
export function getCafeOfficeRelayHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_cafe_office_relay');
  if (!quest) return null;

  if (!objectiveDone(quest, 'hear_relay_brief') || !objectiveDone(quest, 'take_cafe_envelope')) {
    return currentSceneId === 'cafe_evening'
      ? 'Бариста за стойкой — конверт только ногами [E]'
      : '«Синяя яма» — бариста ждёт курьера';
  }

  if (!objectiveDone(quest, 'cross_street_with_envelope')) {
    return currentSceneId === 'street_night'
      ? 'Конверт в кармане — иди к офису через улицу'
      : 'Ночная улица — донеси конверт ногами';
  }

  if (!objectiveDone(quest, 'enter_office_with_envelope')) {
    return currentSceneId === 'office_day'
      ? 'Холл офиса — найди коллегу у серверной'
      : 'Офис гильдии — конверт из кафе';
  }

  if (!objectiveDone(quest, 'deliver_office_envelope')) {
    return currentSceneId === 'office_day'
      ? 'Коллега у серверной — передай конверт [E]'
      : 'Офис, серверная — конверт из кафе';
  }

  if (!objectiveDone(quest, 'read_relay_second_sheet')) {
    return currentSceneId === 'office_day'
      ? 'Второй лист у серверной — прочти строку'
      : 'Офис — дочитай второй лист релея';
  }

  return null;
}

/** Уличный самиздат — Zarema → CHK Bashed. */
export function getStreetChkSamizdatHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_street_chk_samizdat');
  if (!quest) return null;

  if (!objectiveDone(quest, 'meet_zarema_bench') || !objectiveDone(quest, 'receive_samizdat')) {
    return currentSceneId === 'street_night'
      ? 'Зарема у скамейки — пакет листовок [E]'
      : 'Ночная улица — Зарема у скамейки';
  }

  if (!objectiveDone(quest, 'evade_oka_patrol')) {
    return currentSceneId === 'street_night'
      ? 'Переулок — обойди патруль «Ока»'
      : 'Улица — уйди от патруля с пакетом';
  }

  if (!objectiveDone(quest, 'reach_chk_with_packet')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Костёр рядом — отдай пакет Баседу'
      : 'Костёр ЧК — донеси самиздат';
  }

  if (!objectiveDone(quest, 'deliver_chk_samizdat')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Басед у костра — отдай самиздат [E]'
      : 'Костёр ЧК — Басед ждёт пакет';
  }

  if (!objectiveDone(quest, 'archive_wall_handwritten')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Лист уходит на стену архива — смотри'
      : 'ЧК — дождись архивации листа';
  }

  return null;
}

/** Частота кафе — pier Trofim → cafe poetry wall. */
export function getPierCafeFrequencyHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_pier_cafe_frequency');
  if (!quest) return null;

  if (!objectiveDone(quest, 'meet_trofim_pier') || !objectiveDone(quest, 'hear_pier_frequency')) {
    return currentSceneId === 'river_pier' || currentSceneId === 'pier_evening'
      ? 'Трофим у воды — прислушайся к частоте [E]'
      : 'Пирс — Трофим слышит гул реки';
  }

  if (!objectiveDone(quest, 'carry_frequency_street')) {
    return currentSceneId === 'street_night'
      ? 'Частота в кармане — неси к «Синей яме»'
      : 'Ночная улица — путь к стене стихов';
  }

  if (!objectiveDone(quest, 'reach_cafe_with_frequency')) {
    return currentSceneId === 'cafe_evening'
      ? 'Стена стихов — сверь частоту с надписью'
      : '«Синяя яма» — донеси частоту до стены';
  }

  if (!objectiveDone(quest, 'match_cafe_wall')) {
    return currentSceneId === 'cafe_evening'
      ? 'Стена стихов — сверь частоту с надписью [E]'
      : '«Синяя яма» — стена стихов у бариста';
  }

  if (!objectiveDone(quest, 'feel_city_heartbeat')) {
    return currentSceneId === 'cafe_evening'
      ? 'Jukebox замер — почувствуй такт города'
      : 'Кафе — дождись совпадения ритма';
  }

  return null;
}

/** Ночной дозор — Albert patrol across hubs. */
export function getNightCityWatchHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_night_city_watch');
  if (!quest) return null;

  if (!objectiveDone(quest, 'accept_watch_brief')) {
    return currentSceneId === 'cafe_evening'
      ? 'Альберт рисует маршрут на салфетке [E]'
      : 'Кафе — возьми бриф дозора у Альберта';
  }

  if (!objectiveDone(quest, 'watch_street_bench')) {
    return currentSceneId === 'street_night'
      ? 'Скамейка отмечена — иди дальше по маршруту'
      : 'Ночная улица — первая точка дозора';
  }

  if (!objectiveDone(quest, 'watch_pier')) {
    return currentSceneId === 'river_pier' || currentSceneId === 'pier_evening'
      ? 'Пирс проверен — остался костёр ЧК'
      : 'Пирс — вторая точка дозора';
  }

  if (!objectiveDone(quest, 'watch_chk_campfire')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Костёр ЧК — последняя точка перед отчётом'
      : 'ЧК на Зорге — костёр в лесу';
  }

  if (!objectiveDone(quest, 'report_albert_cafe')) {
    return currentSceneId === 'cafe_evening'
      ? 'Альберт ждёт отчёт на салфетке [E]'
      : 'Вернись в кафе к Альберту';
  }

  if (!objectiveDone(quest, 'burn_napkin_log')) {
    return currentSceneId === 'cafe_evening'
      ? 'Салфетка сгорит — как deleted log'
      : 'Кафе — дождись сожжения салфетки';
  }

  return null;
}

const HUB_HINT_RESOLVERS = [
  getCafeOfficeRelayHint,
  getStreetChkSamizdatHint,
  getPierCafeFrequencyHint,
  getNightCityWatchHint,
] as const;

/** First active hub-connector hint for the current scene (journal HUD). */
export function getExpansionHubQuestHint(currentSceneId: string): string | null {
  for (const resolve of HUB_HINT_RESOLVERS) {
    const hint = resolve(currentSceneId);
    if (hint) return hint;
  }
  return null;
}
