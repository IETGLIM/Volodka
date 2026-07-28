/** Live contextual cues for Act 7 spine + epilogue (real quest ids only). */

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

/** Восстановление гильдии — cafe → charter → library → council → network. */
export function getRebuildTheGuildHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('rebuild_the_guild');
  if (!quest) return null;
  if (!objectiveDone(quest, 'gather_survivors')) {
    return currentSceneId === 'cafe_evening'
      ? 'Уцелевшие уже в кафе — собери их'
      : 'Кафе — там собираются те, кто готов строить новое';
  }
  if (!objectiveDone(quest, 'draft_new_charter')) {
    return currentSceneId === 'cafe_evening' || currentSceneId === 'office_day'
      ? 'Сергей рядом — составь новый устав гильдии [E]'
      : 'Составь новый устав с бывшими коллегами — ищи Сергея';
  }
  if (!objectiveDone(quest, 'establish_library_archive')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Архив знаний — создай публичный доступ здесь'
      : 'Публичный архив знаний — иди в библиотеку';
  }
  if (!objectiveDone(quest, 'elect_new_council')) {
    return 'Избери новый совет гильдии на демократических принципах';
  }
  if (!objectiveDone(quest, 'restore_guild_network')) {
    return 'Восстанови городскую сеть под новым управлением';
  }
  return null;
}

/** Отключение системы — team → core → defenses → shutdown → witness. */
export function getSystemTakedownHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('system_takedown');
  if (!quest) return null;
  if (!objectiveDone(quest, 'assemble_strike_team')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Максим на заводе — собери ударный отряд [E]'
      : 'Собери отряд с Максимом перед штурмом ядра';
  }
  if (!objectiveDone(quest, 'battle_to_core')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Пробивайся к ядру «Надзора» с боем'
      : 'Путь к ядру — через заброшенную фабрику';
  }
  if (!objectiveDone(quest, 'disable_core_defenses')) {
    return 'Отключи защиту ядра — «Финал — не конец» поможет';
  }
  if (!objectiveDone(quest, 'execute_shutdown')) {
    return 'Запусти процедуру отключения на терминале';
  }
  if (!objectiveDone(quest, 'witness_system_death')) {
    return 'Стань свидетелем смерти системы';
  }
  return null;
}

/** Финальное стихотворение — park → reflect → compose → rooftop → publish. */
export function getFinalPoemHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('final_poem');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_inspiration_park')) {
    return currentSceneId === 'park_day'
      ? 'Парк вокруг — найди вдохновение'
      : 'Парк днём — единственное место услышать себя';
  }
  if (!objectiveDone(quest, 'reflect_on_journey')) {
    return 'Осмысли весь пройденный путь';
  }
  if (!objectiveDone(quest, 'compose_masterpiece')) {
    return 'Напиши финальное стихотворение';
  }
  if (!objectiveDone(quest, 'recite_on_rooftop')) {
    return currentSceneId === 'rooftop_edge' || currentSceneId === 'factory_roof'
      ? 'Ты на крыше — прочитай финальное стихотворение'
      : 'Прочитай финальное стихотворение на крыше';
  }
  if (!objectiveDone(quest, 'publish_final_poem')) {
    return 'Опубликуй стихотворение в городской сети';
  }
  return null;
}

/** Наследие Володьки — room → home → street → maria → future. */
export function getVolodkaLegacyHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('volodka_legacy');
  if (!quest) return null;
  if (!objectiveDone(quest, 'return_to_room')) {
    return currentSceneId === 'volodka_room'
      ? 'Ты дома — где всё началось'
      : 'Вернись в свою комнату — где всё началось';
  }
  if (!objectiveDone(quest, 'visit_zarema_final')) {
    return currentSceneId === 'home_evening'
      ? 'Зарема дома — навести её последний раз'
      : 'Навести Зарему дома последний раз';
  }
  if (!objectiveDone(quest, 'walk_street_final')) {
    return currentSceneId === 'street_night' || currentSceneId === 'street_winter'
      ? 'Пройдись по ночной улице в последний раз'
      : 'Ночная улица — прощальная прогулка';
  }
  if (!objectiveDone(quest, 'say_goodbye_to_maria')) {
    return 'Попрощайся с Викторией [E]';
  }
  if (!objectiveDone(quest, 'choose_future')) {
    return 'Реши своё будущее — поэт, хранитель, странник';
  }
  return null;
}

/** Эпилог: письма. */
export function getEpilogueLettersHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('epilogue_letters');
  if (!quest) return null;
  if (!objectiveDone(quest, 'read_letters')) {
    return currentSceneId === 'volodka_room'
      ? 'Письма ждут на столе — прочитай их'
      : 'Вернись в комнату после финала — там письма';
  }
  return null;
}

/** Эпилог: памятник поэтам. */
export function getEpilogueMonumentHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('epilogue_monument');
  if (!quest) return null;
  if (!objectiveDone(quest, 'visit_monument')) {
    return currentSceneId === 'park_day'
      ? 'Обелиск без гильдейской таблички — добавь имя'
      : 'Парк — у обелиска без гильдейской таблички';
  }
  return null;
}
