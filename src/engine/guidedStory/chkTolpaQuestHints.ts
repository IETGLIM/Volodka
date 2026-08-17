/** Live contextual cues for CHK / ТОЛПА faction quests. */

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

/** Слухи о ЧК — office whisper unlocks forest. */
export function getTolpaWhisperHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_whisper');
  if (!quest) return null;
  if (!objectiveDone(quest, 'hear_whisper')) {
    return currentSceneId === 'office_day'
      ? 'Коллега шепчет о ТОЛПА у костра — послушай [E]'
      : 'В офисе шепчутся о ЧК на Зорге — зайди к коллегам';
  }
  return null;
}

/** Первый костёр — forest → Ru. */
export function getTolpaFirstFireHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_first_fire');
  if (!quest) return null;
  if (!objectiveDone(quest, 'reach_chk_forest')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Ты у леса на Зорге — иди к костру'
      : 'Из парка — тропа на север к костру ЧК, когда стемнеет';
  }
  if (!objectiveDone(quest, 'meet_ru')) {
    return currentSceneId === 'chk_campfire_night' || currentSceneId === 'chk_forest_zorge'
      ? 'Ру у костра — представься [E]'
      : 'Ру ждёт у костра ЧК — найди поляну';
  }
  return null;
}

/** Клятва портвейна — Based → oath. */
export function getTolpaPortwineOathHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_portwine_oath');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_based')) {
    return currentSceneId === 'chk_campfire_night'
      ? 'Басед у ящика с бутылками — поговори [E]'
      : 'Клятва портвейна — Басед у костра ЧК';
  }
  if (!objectiveDone(quest, 'take_oath')) {
    return 'Прими клятву портвейна у костра';
  }
  return null;
}

/** Кванты у костра — Smert lecture. */
export function getTolpaQuantumFireHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_quantum_fire');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_smert')) {
    return currentSceneId === 'chk_campfire_night'
      ? 'Смерть напротив костра — не пугайся имени [E]'
      : 'Смерть читает лекцию у костра ЧК';
  }
  if (!objectiveDone(quest, 'quantum_talk')) {
    return 'Дослушай лекцию о квантах и IT до конца';
  }
  return null;
}

/** Тропы Сталкера. */
export function getTolpaForestGuideHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_forest_guide');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_stalker')) {
    return currentSceneId === 'chk_campfire_night' || currentSceneId === 'chk_forest_zorge'
      ? 'Сталкер на опушке — поговори [E]'
      : 'Сталкер патрулирует опушку ЧК';
  }
  if (!objectiveDone(quest, 'learn_path')) {
    return 'Запомни безопасную тропу Сталкера';
  }
  return null;
}

/** Песня Элис. */
export function getTolpaGuitarNightHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_guitar_night');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_elis')) {
    return currentSceneId === 'chk_campfire_night'
      ? 'Элис у гитары слева от костра [E]'
      : 'Элис поёт у костра ЧК — иди в лес';
  }
  if (!objectiveDone(quest, 'hear_song')) {
    return 'Послушай или спой вместе с Элис';
  }
  return null;
}

/** Чекист навсегда — bond. */
export function getTolpaBondHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_bond');
  if (!quest) return null;
  if (!objectiveDone(quest, 'member_flag')) {
    return 'Заверши ритуалы ЧК — стань членом ТОЛПА';
  }
  if (!objectiveDone(quest, 'bond_scene')) {
    return currentSceneId === 'chk_campfire_night'
      ? 'Проведи вечер у костра с чекистами'
      : 'Вечер у костра ЧК — закрепи связь';
  }
  return null;
}

/** Стих у костра. */
export function getTolpaPoemFireHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_poem_fire');
  if (!quest) return null;
  if (!objectiveDone(quest, 'collect_tolpa_poem')) {
    return currentSceneId === 'chk_campfire_night'
      ? 'Запиши «Портвейн у костра» с Элис [E]'
      : 'Вернись к костру после песни — стих ЧК';
  }
  return null;
}

/** Тыл ЧК / act3 sanctuary. */
export function getTolpaAct3SanctuaryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_act3_sanctuary');
  if (!quest) return null;
  if (!objectiveDone(quest, 'visit_sanctuary')) {
    return currentSceneId === 'chk_campfire_night' || currentSceneId === 'chk_forest_zorge'
      ? 'Договорись с Ру об укрытии для беглецов [E]'
      : 'После удара по Хранилищу — сходи к Ру в лес';
  }
  return null;
}

/** Тропа Сталкера / act4 exfiltration. */
export function getTolpaAct4ExfiltrationHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_act4_exfiltration');
  if (!quest) return null;
  if (!objectiveDone(quest, 'stalker_route')) {
    return currentSceneId === 'chk_campfire_night' || currentSceneId === 'chk_forest_zorge'
      ? 'Сталкер знает служебный вход гильдии [E]'
      : 'Перед штурмом — маршрут Сталкера в ЧК';
  }
  return null;
}

/** Зеркала ТОЛПА / server heist. */
export function getTolpaAct4ServerHeistHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('tolpa_act4_server_heist');
  if (!quest) return null;
  if (!objectiveDone(quest, 'disable_guild_server')) {
    return currentSceneId === 'guild_mainframe' || currentSceneId === 'office_day'
      ? 'Отключи сервер гильдии в дата-центре'
      : 'Ру предложил саботаж — дата-центр гильдии';
  }
  return null;
}
