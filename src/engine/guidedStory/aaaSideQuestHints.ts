/** Live contextual cues for AAA expansion side quests (pier / library / factory / resistance / CHK). */

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

/** Ночная рыбалка. */
export function getPierMidnightFishingHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('pier_midnight_fishing');
  if (!quest) return null;
  if (!objectiveDone(quest, 'fish_with_trofim')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Трофим на пирсе — удочка ждёт [E]'
      : 'Найди Трофима на вечернем пирсе';
  }
  return null;
}

/** Струны для Ритки. */
export function getPierRitkaStringsHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('pier_ritka_strings');
  if (!quest) return null;
  if (!objectiveDone(quest, 'get_strings')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Элис у костра — запасная струна у неё [E]'
      : 'Запасная струна в ЧК у Элис';
  }
  if (!objectiveDone(quest, 'deliver_strings')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Верни струны Ритке [E]'
      : 'Ритка ждёт струны на пирсе';
  }
  return null;
}

/** Утерянный архив. */
export function getLibraryLostArchiveHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('library_lost_archive');
  if (!quest) return null;
  if (!objectiveDone(quest, 'enter_basement')) {
    return currentSceneId === 'library_day'
      ? 'Спуск в подвал — Катя указала дверь'
      : currentSceneId === 'library_basement'
        ? 'Ты в подвале — ищи архив'
        : 'Поговори с Катей в библиотеке, затем спустись в подвал';
  }
  if (!objectiveDone(quest, 'recover_archive')) {
    return currentSceneId === 'library_basement'
      ? 'Утерянный архив где-то среди полок [E]'
      : 'Архив в подвале библиотеки';
  }
  return null;
}

/** Исследование Кати. */
export function getLibraryKatyaResearchHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('library_katya_research');
  if (!quest) return null;
  if (!objectiveDone(quest, 'complete_research')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Катя ждёт ночь на исследование — садись рядом [E]'
      : 'Катя ждёт в библиотеке — нужна ночь на исследование';
  }
  return null;
}

/** Память «Зари-М» (AAA side). */
export function getFactoryZaryaMemoryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('factory_zarya_memory');
  if (!quest) return null;
  if (!objectiveDone(quest, 'restore_memory')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Баба Зина у паяльной — верни три образа [E]'
      : 'Найди Бабу Зину на заводе — память «Зари-М»';
  }
  return null;
}

/** Чай с Бабой Зиной. */
export function getFactoryBabaZinaTeaHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('factory_baba_zina_tea');
  if (!quest) return null;
  if (!objectiveDone(quest, 'drink_tea')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Чай у паяльной станции — сядь с Бабой Зиной [E]'
      : 'Загляни к Бабе Зине в цех — просто чай и истории';
  }
  return null;
}

/** Обустроить убежище. */
export function getResistanceSafehouseHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('resistance_safehouse');
  if (!quest) return null;
  if (!objectiveDone(quest, 'setup_bunker')) {
    return currentSceneId === 'underground_bunker'
      ? 'Максим и Аня ждут — обустрой бункер [E]'
      : 'Найди бункер через контакт Жеки — убежище Сопротивления';
  }
  return null;
}

/** Спасти перебежчика. */
export function getResistanceDefectorRescueHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('resistance_defector_rescue');
  if (!quest) return null;
  if (!objectiveDone(quest, 'rescue_defector')) {
    return currentSceneId === 'underground_bunker'
      ? 'Максим здесь — рейд за перебежчиком [E]'
      : 'Максим ждёт в бункере — через два часа стирание';
  }
  return null;
}

/** Портвейн для ЧК. */
export function getChkPortwineDeliveryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('chk_portwine_delivery');
  if (!quest) return null;
  if (!objectiveDone(quest, 'deliver_portwine')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Ящик «777» к костру — Басед ждёт [E]'
      : 'Поговори с Баседом в ЧК — портвейн из «Синей ямы»';
  }
  return null;
}

/** Струны для Элис. */
export function getChkGuitarStringsHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('chk_guitar_strings');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_strings')) {
    return currentSceneId === 'office_day'
      ? 'Запасная струна E где-то в офисе'
      : currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
        ? 'Элис у костра — струну нужно достать из офиса'
        : 'Элис у костра в ЧК — струна E в офисе гильдии';
  }
  return null;
}
