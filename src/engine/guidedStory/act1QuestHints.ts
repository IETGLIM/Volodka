/** Live contextual cues for high-traffic Act 1–2 spine quests. */

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

/** Испытание Хранилища — colleague → terminal → poem. */
export function getVaultBackupTrialHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('vault_backup_trial');
  if (!quest) return null;
  if (!objectiveDone(quest, 'learn_about_vault')) {
    return currentSceneId === 'office_day'
      ? 'Спроси коллегу у рабочих станций о Хранилище [E]'
      : 'Вернись в офис IT-гильдии — коллега знает про Хранилище';
  }
  if (!objectiveDone(quest, 'hack_vault_terminal')) {
    return 'Взломай терминал Хранилища — мини-игра «Терминал»';
  }
  if (!objectiveDone(quest, 'get_vault_access')) {
    return 'Дождись подтверждения доступа — или обойди стихом «Прорыв»';
  }
  if (!objectiveDone(quest, 'find_backup_poem')) {
    return 'В резервной копии спрятан стих — забери его';
  }
  return null;
}

/** Посвящение в Сеть — Victoria → hack → oath. */
export function getNetworkInitiationHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('network_initiation');
  if (!quest) return null;
  if (!objectiveDone(quest, 'meet_maria_again')) {
    return currentSceneId === 'street_night' || currentSceneId === 'cafe_evening'
      ? 'Найди Викторию — она проведёт посвящение в Сеть [E]'
      : 'Виктория ждёт для посвящения — ищи её на улице или в кафе';
  }
  if (!objectiveDone(quest, 'navigate_network')) {
    return 'Пройди проверку Сети — мини-игра «Взлом»';
  }
  if (!objectiveDone(quest, 'recite_hidden_poem')) {
    return 'На тайной встрече прочитай стих по памяти';
  }
  if (!objectiveDone(quest, 'swear_oath')) {
    return 'Принеси клятву Сети — закрепи верность слову';
  }
  if (!objectiveDone(quest, 'receive_network_key')) {
    return 'Забери ключ Сети — зашифрованный канал связи';
  }
  return null;
}

/** Солныш spine — comfort → wine roof → relocation. */
export function getSolnyshSpineHint(currentSceneId: string): string | null {
  const comfort = findActiveQuest('solnysh_comfort');
  if (comfort) {
    if (!objectiveDone(comfort, 'talk_solnysh')) {
      return currentSceneId === 'volodka_corridor' || currentSceneId === 'solnysh_room'
        ? 'Подойди к Солныш и поговори [E]'
        : 'Солныш в коридоре или в своей комнате — найди её и поговори';
    }
    if (!objectiveDone(comfort, 'comfort_solnysh')) {
      return 'Выслушай Солныш и поддержи её — выбери тёплый ответ';
    }
  }

  const wine = findActiveQuest('solnysh_roof_wine');
  if (wine) {
    if (!objectiveDone(wine, 'find_wine')) {
      return currentSceneId === 'solnysh_room'
        ? 'Обыщи шкаф в комнате Солныш — там вино Лёни'
        : 'Вино спрятано в комнате Солныш — загляни в шкаф';
    }
    if (!objectiveDone(wine, 'offer_wine')) {
      return 'Предложи Алине вино и вечер на крыше [E]';
    }
    if (!objectiveDone(wine, 'roof_toast')) {
      return 'Поднимись на крышу вместе с Солныш';
    }
  }

  const relocation = findActiveQuest('solnysh_relocation');
  if (relocation) {
    if (!objectiveDone(relocation, 'discuss_move')) {
      return 'После крыши спроси Солныш о переезде [E]';
    }
    if (!objectiveDone(relocation, 'support_move')) {
      return 'Поддержи решение о другой стране — она ждёт твоего слова';
    }
  }

  return null;
}
