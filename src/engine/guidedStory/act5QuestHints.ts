/** Live contextual cues for Act 5 spine quests (real quest ids only). */

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

/** Последний Код — rally → virus → core → deploy → survive. */
export function getFinalCodeHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('final_code');
  if (!quest) return null;
  if (!objectiveDone(quest, 'rally_allies')) {
    return currentSceneId === 'albert_backroom' || currentSceneId === 'cafe_evening'
      ? 'Собери союзников — Алберт ждёт финальный план [E]'
      : 'Собери всех союзников перед операцией «Занавес»';
  }
  if (!objectiveDone(quest, 'write_freedom_virus')) {
    return 'Напиши вирус свободы — стихи как код (терминал OpenStack)';
  }
  if (!objectiveDone(quest, 'reach_core')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Центральный сервер рядом — прорвись к ядру'
      : 'Ядро гильдии в офисе — иди туда';
  }
  if (!objectiveDone(quest, 'deploy_virus')) {
    return 'Запусти вирус свободы из ядра сервера';
  }
  if (!objectiveDone(quest, 'survive_shutdown')) {
    return 'Удержи позицию — системы гильдии гаснут';
  }
  return null;
}

/** Исповедь Машины — factory → listen → fate. */
export function getMachineConfessionHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('machine_confession');
  if (!quest) return null;
  if (!objectiveDone(quest, 'return_to_factory')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Ты на заводе — найди «Зарю-М»'
      : 'Вернись на заброшенный завод «Хром-М» ночью';
  }
  if (!objectiveDone(quest, 'listen_to_machine')) {
    return 'Выслушай исповедь «Зари-М» [E]';
  }
  if (!objectiveDone(quest, 'decide_machine_fate')) {
    return 'Реши судьбу машины — освободить или отключить';
  }
  return null;
}

/** Эхо Владимира — kate → library → unlock → read. */
export function getEchoOfVladimirHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('echo_of_vladimir');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_kate_clue')) {
    return currentSceneId === 'library_day'
      ? 'Катя в библиотеке — спроси про тайник Владимира [E]'
      : 'Катя знает о тайнике — ищи её в библиотеке';
  }
  if (!objectiveDone(quest, 'reach_secret_room')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Секретная комната в библиотеке — спустись глубже'
      : 'Тайник Владимира в библиотеке';
  }
  if (!objectiveDone(quest, 'unlock_final_poem')) {
    return 'Разблокируй финальное стихотворение — мини-игра поэзии';
  }
  if (!objectiveDone(quest, 'read_final_poem')) {
    return 'Прочитай последнее стихотворение Владимира';
  }
  return null;
}

/** Ночь Перед Рассветом — confirm each ally. */
export function getNightBeforeDawnHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('night_before_dawn');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_albert_final')) {
    return currentSceneId === 'albert_backroom' || currentSceneId === 'cafe_evening'
      ? 'Спроси Алберта — он с тобой до конца? [E]'
      : 'Алберт должен подтвердить сторону — найди его';
  }
  if (!objectiveDone(quest, 'talk_zarema_final')) {
    return 'Спроси Зарему — верит ли она в тебя';
  }
  if (!objectiveDone(quest, 'talk_maria_final')) {
    return currentSceneId === 'cafe_evening' || currentSceneId === 'street_night'
      ? 'Спроси Марию / Викторию — готова ли к финалу [E]'
      : 'Мария должна подтвердить — ищи её на улице или в кафе';
  }
  if (!objectiveDone(quest, 'talk_dmitry_final')) {
    return currentSceneId === 'office_day'
      ? 'Спроси Дмитрия — не отступит ли он [E]'
      : 'Дмитрий в офисе гильдии — последний разговор';
  }
  return null;
}
