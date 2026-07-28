/** Live contextual cues for high-traffic Act 1 side quests. */

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

/** Тайна ночной смены — servers → Sergey → packets → Dmitry. */
export function getNightShiftMysteryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('night_shift_mystery');
  if (!quest) return null;
  if (!objectiveDone(quest, 'witness_night_activity')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Прислушайся к пульсации серверов — ночная активность'
      : 'Ночные серверы гильдии — зайди в офис после заката';
  }
  if (!objectiveDone(quest, 'investigate_server_logs')) {
    return currentSceneId === 'office_day'
      ? 'Сергей у логов — спроси про ночные процессы [E]'
      : 'Сергей знает про серверные логи — ищи в офисе';
  }
  if (!objectiveDone(quest, 'find_encrypted_packets')) {
    return 'Найди зашифрованные пакеты в потоке данных гильдии';
  }
  if (!objectiveDone(quest, 'report_to_dmitry')) {
    return currentSceneId === 'office_day'
      ? 'Доложи Дмитрию о находке [E]'
      : 'Дмитрий ждёт доклад — вернись в офис';
  }
  return null;
}

/** Урок Альберта — talk → riddle → poetry-code link. */
export function getAlbertsLessonHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('alberts_lesson');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_albert_lesson')) {
    return currentSceneId === 'cafe_evening' || currentSceneId === 'albert_backroom'
      ? 'Альберт здесь — попроси урок [E]'
      : 'Альберт в «Синей яме» — код и стих одним языком';
  }
  if (!objectiveDone(quest, 'solve_code_riddle')) {
    return 'Разгадай кодовую загадку Альберта — «Прорыв» поможет';
  }
  if (!objectiveDone(quest, 'show_poem_understanding')) {
    return 'Покажи, что видишь связь кода и стихов';
  }
  return null;
}

/** Письмо без адреса — open → keep → Zarema. */
export function getCorridorLetterHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('corridor_letter');
  if (!quest) return null;
  if (!objectiveDone(quest, 'open_letter')) {
    return currentSceneId === 'volodka_corridor'
      ? 'Почтовые ящики — третий сверху, конверт без марки [E]'
      : 'Конверт без адреса — проверь ящики в коридоре';
  }
  if (!objectiveDone(quest, 'keep_letter')) {
    return 'Сохрани письмо — оно ещё пригодится';
  }
  if (!objectiveDone(quest, 'show_letter_zarema')) {
    return currentSceneId === 'home_evening'
      ? 'Покажи письмо Зареме [E]'
      : 'Зарема на кухне — покажи ей письмо';
  }
  return null;
}

/** Голос в белом шуме — agree → tune radio. */
export function getZaremaRadioHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('zarema_radio');
  if (!quest) return null;
  if (!objectiveDone(quest, 'start_radio_quest')) {
    return currentSceneId === 'home_evening'
      ? 'Зарема у радио «Океан» — согласись помочь [E]'
      : 'Зарема слышит голос в статике — зайди домой';
  }
  if (!objectiveDone(quest, 'fix_radio')) {
    return currentSceneId === 'home_evening'
      ? 'Крути приёмник у окна — поймай голос в эфире'
      : 'Радиоприёмник дома у Заремы — настрой частоту';
  }
  return null;
}

/** Утренний обход — terminal → wardrobe → intercom. */
export function getMorningRitualHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('morning_ritual');
  if (!quest) return null;
  if (!objectiveDone(quest, 'ritual_terminal')) {
    return currentSceneId === 'volodka_room'
      ? 'Проверь терминал или рабочий стол [E]'
      : 'Утренний обход начинается с комнаты — терминал';
  }
  if (!objectiveDone(quest, 'ritual_wardrobe')) {
    return currentSceneId === 'volodka_room'
      ? 'Загляни в платяной шкаф'
      : 'Шкаф в комнате — следующая точка обхода';
  }
  if (!objectiveDone(quest, 'ritual_intercom')) {
    return currentSceneId === 'volodka_corridor' || currentSceneId === 'volodka_room'
      ? 'Домофон шепчет — прислушайся [E]'
      : 'Домофон в коридоре — услышь утренний шёпот';
  }
  return null;
}

/** Эхо подсобки — notice door → hear terminal. */
export function getCafeBackroomEchoHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('cafe_backroom_echo');
  if (!quest) return null;
  if (!objectiveDone(quest, 'notice_backroom')) {
    return currentSceneId === 'cafe_evening' || currentSceneId === 'albert_backroom'
      ? 'Дверь за стеллажом с зёрнами — или спроси бариста [E]'
      : 'Подсобка «Синей ямы» — зайди в кафе';
  }
  if (!objectiveDone(quest, 'hear_echo')) {
    return currentSceneId === 'albert_backroom' || currentSceneId === 'cafe_evening'
      ? 'Терминал в нише дописывает строки сам — прислушайся'
      : 'Эхо терминала — в подсобке кафе';
  }
  return null;
}

/** Присутствие на синке — approach → connect → complete. */
export function getMorningSyncHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('morning_sync');
  if (!quest) return null;
  if (!objectiveDone(quest, 'approach_terminal')) {
    return currentSceneId === 'volodka_room' || currentSceneId === 'office_day'
      ? 'Подойди к рабочей станции для синка [E]'
      : 'Срочная оперативка — подойди к терминалу';
  }
  if (!objectiveDone(quest, 'connect_sync')) {
    return 'Подключись к конференции — [E] или «Прорыв»';
  }
  if (!objectiveDone(quest, 'complete_sync')) {
    return 'Досиди синк до конца';
  }
  return null;
}
