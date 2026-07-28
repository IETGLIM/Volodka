/** Live contextual cues for high-traffic Act 2–3 spine quests. */

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

/** Тихая гавань — barista → Albert → terminal → channel. */
export function getCafeSafehouseHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('cafe_safehouse');
  if (!quest) return null;
  if (!objectiveDone(quest, 'convince_barista')) {
    return currentSceneId === 'cafe_evening'
      ? 'Убеди баристу отдать заднюю комнату [E]'
      : 'Иди в кафе «Синяя яма» — бариста может дать явочную';
  }
  if (!objectiveDone(quest, 'ask_albert_secrecy')) {
    return currentSceneId === 'cafe_evening' || currentSceneId === 'albert_backroom'
      ? 'Попроси Альберта держать рот на замке [E]'
      : 'Альберт в кафе — убеди его хранить тайну Сети';
  }
  if (!objectiveDone(quest, 'install_secret_terminal')) {
    return 'Установи защищённый терминал в подсобке кафе';
  }
  if (!objectiveDone(quest, 'test_secure_channel')) {
    return 'Протестируй зашифрованный канал — проверка явочной';
  }
  return null;
}

/** Дезертирство Дмитрия — hear → plan → escort. */
export function getDmitryDefectionHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('dmitry_defection');
  if (!quest) return null;
  if (!objectiveDone(quest, 'hear_dmitry_story')) {
    return currentSceneId === 'office_day'
      ? 'Найди Дмитрия у рабочих станций и выслушай его [E]'
      : 'Дмитрий в офисе гильдии — время ограничено, иди туда';
  }
  if (!objectiveDone(quest, 'plan_escape')) {
    return 'Спланируй побег Дмитрия — выбери маршрут в диалоге';
  }
  if (!objectiveDone(quest, 'escort_dmitry')) {
    return 'Сопроводи Дмитрия до безопасного места Сети';
  }
  return null;
}

/** Гул под полом — basement → Zarya → terminal. */
export function getBasementHumHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('basement_hum');
  if (!quest) return null;
  if (!objectiveDone(quest, 'descend_basement')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Спустись в подвал — дверь в дальнем углу цеха'
      : 'Ключ Трофима открывает подвал «Хрома-М» — иди на завод';
  }
  if (!objectiveDone(quest, 'examine_zarya')) {
    return 'Осмотри монолит «Зари-М» — не трогай, послушай гул';
  }
  if (!objectiveDone(quest, 'hack_entry_terminal')) {
    return 'Взломай терминал «Прогресс-7» у входа в катакомбы';
  }
  return null;
}

/** Спасение Заремы — arrest → infiltrate → free → escape. */
export function getZaremaRescueHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('zarema_rescue');
  if (!quest) return null;
  if (!objectiveDone(quest, 'learn_zarema_arrested')) {
    return 'Узнай о задержании Заремы — слухи в коридоре или у Сети';
  }
  if (!objectiveDone(quest, 'infiltrate_detention')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Проникни в блок задержания — стих «Прорыв» поможет [E]'
      : 'Блок задержания в гильдии — стих «Прорыв» открывает путь';
  }
  if (!objectiveDone(quest, 'free_zarema')) {
    return 'Освободи Зарему из камеры — время на исходе';
  }
  if (!objectiveDone(quest, 'escape_together')) {
    return 'Выберитесь вместе из здания гильдии';
  }
  return null;
}

/** Правда Виктории — records → barista → confront → accept. */
export function getMariaTruthHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('maria_truth');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_maria_records')) {
    return 'Найди записи о Виктории в архивах Хранилища';
  }
  if (!objectiveDone(quest, 'ask_barista_about_maria')) {
    return currentSceneId === 'cafe_evening'
      ? 'Расспроси баристу о прошлом Виктории [E]'
      : 'Бариста в «Синей яме» знает больше, чем кажется';
  }
  if (!objectiveDone(quest, 'confront_maria')) {
    return 'Предоставь Виктории доказательства и потребуй правду [E]';
  }
  if (!objectiveDone(quest, 'accept_truth')) {
    return 'Прими правду о природе Виктории — выбор необратим';
  }
  return null;
}
