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
