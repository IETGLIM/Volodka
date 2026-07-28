/** Live contextual cues for high-traffic Act 1 spine quests. */

import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { QUEST_DEFINITIONS } from '@/data/quests';
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

/** Связь с Викторией — street meet → chip → poem. */
export function getMariaConnectionHint(): string | null {
  const quest = findActiveQuest('maria_connection');
  if (!quest) return null;
  if (!objectiveDone(quest, 'meet_maria')) {
    return 'Выйди на ночную улицу — Виктория сама тебя найдёт';
  }
  if (!objectiveDone(quest, 'accept_chip')) {
    return 'Прими чип данных у Виктории [E] — это ключ к её стиху';
  }
  if (!objectiveDone(quest, 'read_maria_poem')) {
    return 'Открой чип в инвентаре / журнале стихов и прочитай стихотворение';
  }
  return null;
}

/** Инцидент #4729 — office → Alexander → codebreaker. */
export function getIncidentScrollHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('incident_scroll_4729');
  if (!quest) return null;
  if (!objectiveDone(quest, 'visit_office')) {
    return currentSceneId === 'office_day'
      ? 'Ты в офисе — найди Александра у терминалов'
      : 'Иди в офис IT-гильдии — Александр ждёт у инцидента #4729';
  }
  if (!objectiveDone(quest, 'talk_alexander')) {
    return 'Поговори с Александром о шифре инцидента [E]';
  }
  if (!objectiveDone(quest, 'crack_the_code')) {
    return 'Запусти мини-игру «Взломщик кода» на терминале гильдии';
  }
  if (!objectiveDone(quest, 'start_diagnosis')) {
    return 'Начни диагностику кода — подтверди расшифровку у терминала';
  }
  if (!objectiveDone(quest, 'discover_poem_in_code')) {
    return 'Дочитай расшифровку — в коде спрятаны стихи';
  }
  return null;
}

/** Собрание стихов — nudge toward next poem target label. */
export function getPoetryCollectionHint(): string | null {
  const quest = findActiveQuest('poetry_collection');
  if (!quest) return null;
  const def = QUEST_DEFINITIONS.find((q) => q.id === 'poetry_collection');
  if (!def) return null;
  const next = def.objectives.find((o) => quest.objectives[o.id] !== true);
  if (!next) return null;
  return `Следующий стих: ${next.description.replace(/^Стихотворение\s+[IVXLC]+\s*—\s*/i, '')}`;
}
