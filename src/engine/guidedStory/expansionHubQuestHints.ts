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
  if (!objectiveDone(quest, 'take_cafe_envelope')) {
    return currentSceneId === 'cafe_evening'
      ? 'Бариста за стойкой — конверт только ногами [E]'
      : '«Синяя яма» — бариста ждёт курьера';
  }
  if (!objectiveDone(quest, 'deliver_office_envelope')) {
    return currentSceneId === 'office_day'
      ? 'Коллега у серверной — передай конверт [E]'
      : 'Офис, серверная — конверт из кафе';
  }
  return null;
}

/** Уличный самиздат — Zarema → CHK Bashed. */
export function getStreetChkSamizdatHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_street_chk_samizdat');
  if (!quest) return null;
  if (!objectiveDone(quest, 'receive_samizdat')) {
    return currentSceneId === 'street_night'
      ? 'Зарема у скамейки — пакет листовок [E]'
      : 'Ночная улица — Зарема у скамейки';
  }
  if (!objectiveDone(quest, 'deliver_chk_samizdat')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Басед у костра — отдай самиздат [E]'
      : 'Костёр ЧК — Басед ждёт пакет';
  }
  return null;
}

/** Частота кафе — pier Trofim → cafe poetry wall. */
export function getPierCafeFrequencyHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_pier_cafe_frequency');
  if (!quest) return null;
  if (!objectiveDone(quest, 'hear_pier_frequency')) {
    return currentSceneId === 'river_pier' || currentSceneId === 'pier_evening'
      ? 'Трофим у воды — прислушайся к частоте [E]'
      : 'Пирс — Трофим слышит гул реки';
  }
  if (!objectiveDone(quest, 'match_cafe_wall')) {
    return currentSceneId === 'cafe_evening'
      ? 'Стена стихов — сверь частоту с надписью [E]'
      : '«Синяя яма» — стена стихов у бариста';
  }
  return null;
}

/** Ночной дозор — Albert patrol across hubs. */
export function getNightCityWatchHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act2_night_city_watch');
  if (!quest) return null;
  if (!objectiveDone(quest, 'watch_street_bench')) {
    return currentSceneId === 'street_night'
      ? 'Скамейка отмечена — иди дальше по маршруту'
      : 'Ночная улица — первая точка дозора';
  }
  if (!objectiveDone(quest, 'watch_pier')) {
    return currentSceneId === 'river_pier'
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
  return null;
}
