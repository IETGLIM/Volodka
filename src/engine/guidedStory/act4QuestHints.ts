/** Live contextual cues for Act 4 spine quests (real quest ids only). */

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

/** Проникновение в гильдию — disguise → ally → core → evidence → escape. */
export function getGuildInfiltrationHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('guild_infiltration');
  if (!quest) return null;
  if (!objectiveDone(quest, 'acquire_disguise')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Достань форму / пропуск сотрудника гильдии [E]'
      : 'Пропуск гильдии — ищи в офисе IT';
  }
  if (!objectiveDone(quest, 'find_ally_inside')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Завоюй доверие Олега — союзник внутри [E]'
      : 'Олег внутри гильдии — без него не пройти';
  }
  if (!objectiveDone(quest, 'access_core_server')) {
    return currentSceneId === 'guild_mainframe'
      ? 'Доберись до центрального сервера — «Прорыв» поможет'
      : 'Центральный сервер в mainframe гильдии';
  }
  if (!objectiveDone(quest, 'download_evidence')) {
    return 'Скачай доказательства цензуры с сервера';
  }
  if (!objectiveDone(quest, 'escape_headquarters')) {
    return 'Выберись из штаб-квартиры живым';
  }
  return null;
}

/** Эфир свободы — poems → tower → hack → transmit. */
export function getPoetryBroadcastHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('poetry_broadcast');
  if (!quest) return null;
  if (!objectiveDone(quest, 'gather_all_poems')) {
    return 'Подготовь стихи для эфира — собери полный набор';
  }
  if (!objectiveDone(quest, 'reach_broadcast_tower')) {
    return currentSceneId === 'rooftop_edge' || currentSceneId === 'factory_roof'
      ? 'Передающая башня на крыше — займи позицию'
      : 'Выход на крышу — к передающей башне';
  }
  if (!objectiveDone(quest, 'hack_broadcast_system')) {
    return 'Взломай систему городского вещания';
  }
  if (!objectiveDone(quest, 'transmit_poetry')) {
    return 'Передай стихи в эфир на весь город';
  }
  return null;
}

/** Крыша мира — rooftop → confront → ending. */
export function getRoofOfTheWorldHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('roof_of_the_world');
  if (!quest) return null;
  if (!objectiveDone(quest, 'reach_rooftop')) {
    return currentSceneId === 'rooftop_edge' || currentSceneId === 'factory_roof'
      ? 'Ты на крыше — финальная встреча близко'
      : 'Доберись до крыши — место финальной встречи';
  }
  if (!objectiveDone(quest, 'confront_alexander')) {
    return currentSceneId === 'rooftop_edge'
      ? 'Противостой Александру на краю [E]'
      : 'Александр ждёт на краю крыши';
  }
  if (!objectiveDone(quest, 'choose_ending')) {
    return 'Выбери исход — слова сильнее оружия';
  }
  return null;
}

/** Последнее Стихотворение — phrases → quiet place → compose → recite. */
export function getLastPoemHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('last_poem');
  if (!quest) return null;
  if (!objectiveDone(quest, 'collect_all_phrases')) {
    return 'Собери все фразы из предыдущих заданий — материал для финала';
  }
  if (!objectiveDone(quest, 'find_quiet_place')) {
    return currentSceneId === 'rooftop_edge'
      ? 'Тихое место найдено — садись писать'
      : 'Найди тихое место на краю крыши';
  }
  if (!objectiveDone(quest, 'compose_poem')) {
    return 'Составь собственное стихотворение из собранных фрагментов';
  }
  if (!objectiveDone(quest, 'recite_final')) {
    return 'Продекламируй финальное стихотворение — каждое слово решает исход';
  }
  return null;
}

/** Слепое Пятно — logs → cafe → identify → confront. */
export function getBlindSpotHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('blind_spot');
  if (!quest) return null;
  if (!objectiveDone(quest, 'check_office_logs')) {
    return currentSceneId === 'office_day'
      ? 'Сергей и логи доступа — проверь посещения офиса [E]'
      : 'Логи гильдии у Сергея — иди в офис';
  }
  if (!objectiveDone(quest, 'interrogation_round')) {
    return currentSceneId === 'cafe_evening'
      ? 'Допрос подозреваемых в кафе — слушай внимательно'
      : 'Допрос в кафе «Синяя яма» — выйди туда';
  }
  if (!objectiveDone(quest, 'identify_mole')) {
    return 'Вычисли шпиона — стих «Ну а тебе, друг мой!» поможет увидеть скрытое';
  }
  if (!objectiveDone(quest, 'confront_mole')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Столкнись с Олегом — предатель рядом [E]'
      : 'Олег — цель конфронтации; найди его в гильдии';
  }
  return null;
}

/** Архив Забытых — solnysh → basement → unlock → save → escape. */
export function getArchiveOfForgottenHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('archive_of_forgotten');
  if (!quest) return null;
  if (!objectiveDone(quest, 'meet_vera_library')) {
    return currentSceneId === 'library_day'
      ? 'Алина (Солныш) в библиотеке — спроси про архив [E]'
      : 'Алина знает пароль архива — ищи её в библиотеке';
  }
  if (!objectiveDone(quest, 'find_hidden_archive')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Тайный архив в подвале библиотеки — спустись'
      : 'Архив забытых стихов — подвал библиотеки';
  }
  if (!objectiveDone(quest, 'unlock_archive')) {
    return 'Разблокируй архив — взлом кода (codebreaker)';
  }
  if (!objectiveDone(quest, 'save_poems_archive')) {
    return 'Сохрани все стихи из архива до зачистки';
  }
  if (!objectiveDone(quest, 'escape_before_purge')) {
    return currentSceneId === 'street_night'
      ? 'Ты на улице — архив спасён вовремя'
      : 'Покинь библиотеку до зачистки — на ночную улицу';
  }
  return null;
}
