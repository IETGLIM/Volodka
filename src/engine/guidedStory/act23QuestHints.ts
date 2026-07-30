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

/** Фрагменты ключа — guild → network → factory → assemble. */
export function getVaultKeyFragmentsHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('vault_key_fragments');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_guild_fragment')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Ищи фрагмент ключа в офисе гильдии [E]'
      : 'Фрагмент гильдии — в офисе IT. Иди туда';
  }
  if (!objectiveDone(quest, 'find_network_fragment')) {
    return 'Получи фрагмент ключа у Виктории и Сети [E]';
  }
  if (!objectiveDone(quest, 'find_neutral_fragment')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Отыщи последний фрагмент в цеху завода'
      : 'Последний фрагмент — на заброшенном заводе «Хром-М»';
  }
  if (!objectiveDone(quest, 'assemble_key')) {
    return 'Собери полный ключ Хранилища из трёх фрагментов';
  }
  return null;
}

/** Контрабанда стихов — library → park → rooftop → cafe. */
export function getPoetrySmugglingHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('poetry_smuggling');
  if (!quest) return null;
  if (!objectiveDone(quest, 'retrieve_poems_library')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Забери стихи из тайника в библиотеке'
      : 'Стихи ждут в библиотеке — зайди тихо';
  }
  if (!objectiveDone(quest, 'evade_guild_patrol_park')) {
    return currentSceneId === 'park_day'
      ? 'Пройди парк, обходя патруль гильдии'
      : 'Следующий этап — парк. Избегай патруля';
  }
  if (!objectiveDone(quest, 'cross_rooftops')) {
    return currentSceneId === 'rooftop_edge'
      ? 'Переберись по крышам к кафе'
      : 'Маршрут через крыши — выход на rooftop edge';
  }
  if (!objectiveDone(quest, 'deliver_poems_cafe')) {
    return currentSceneId === 'cafe_evening' || currentSceneId === 'albert_backroom'
      ? 'Отдай стихи баристе в безопасной комнате [E]'
      : 'Доставь стихи в «Синюю яму» — явочная ждёт';
  }
  return null;
}

/** Ключ сторожа — Trofim → portwine → key. */
export function getPierWatchmanKeyHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('pier_watchman_key');
  if (!quest) return null;
  if (!objectiveDone(quest, 'meet_trofim')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Поговори с Трофимом у перил [E]'
      : 'Трофим на пирсе №3 — иди к воде';
  }
  if (!objectiveDone(quest, 'bring_portwine')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'chk_campfire_night'
      ? 'Принеси портвейн «777» — ящик у костра'
      : 'Нужен портвейн «777» из ящика ЧК у костра';
  }
  if (!objectiveDone(quest, 'receive_key')) {
    return 'Получи ключ сторожа у Трофима [E]';
  }
  return null;
}

/** Защита Хранилища — alert → rally → firewall → hold. */
export function getVaultDefenseHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('vault_defense');
  if (!quest) return null;
  if (!objectiveDone(quest, 'receive_vault_alert')) {
    return 'Жди сигнал тревоги от Хранилища — гильдия уже в пути';
  }
  if (!objectiveDone(quest, 'rally_defenders')) {
    return 'Собери защитников Сети — Альберт и явочная';
  }
  if (!objectiveDone(quest, 'deploy_firewall')) {
    return currentSceneId === 'underground_bunker' || currentSceneId === 'library_basement'
      ? 'Установи фаервол на серверы Хранилища'
      : 'Без фаервола Хранилище обречено — установи защиту';
  }
  if (!objectiveDone(quest, 'hold_the_line')) {
    return 'Удержи Хранилище — не дай гильдии пройти';
  }
  return null;
}

/** Нить из 18 строк — crash → 4729 → progress-7. */
export function getThreadOf18LinesHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('thread_of_18_lines');
  if (!quest) return null;
  if (!objectiveDone(quest, 'trace_crash')) {
    return currentSceneId === 'park_day'
      ? 'Узнай о Великом Сбое 2029 у мемориала'
      : 'Мемориал в парке — след Великого Сбоя 2029';
  }
  if (!objectiveDone(quest, 'trace_4729')) {
    return currentSceneId === 'office_day'
      ? 'Свяжи Инцидент #4729 со стихами в коде'
      : 'Инцидент #4729 — расшифровка в офисе гильдии';
  }
  if (!objectiveDone(quest, 'trace_progress7')) {
    return currentSceneId === 'factory_basement' || currentSceneId === 'abandoned_factory'
      ? 'Услышь гул «Прогресс-7» под заводом'
      : 'Подвал «Хрома-М» — последний след нити';
  }
  return null;
}

/** Act 3 hub relay mesh — pier → library → café → office → guild → factory (flag-driven, no quest). */
export function getAct3HubRelayHint(currentSceneId: string): string | null {
  try {
    const flags = getGameSnapshot().playerState.flags;
    if (flags.act3_hub_relay_mesh_closed) return null;
    if (!flags.zarema_arrested) return null;

    if (!flags.act3_pier_relay_whisper_done) {
      return currentSceneId === 'river_pier'
        ? 'Поговори с Трофимом у гирлянды — relay начинается на пирсе [E]'
        : 'Пирс №3 — Трофим передаёт первый relay после ареста Заремы';
    }
    if (!flags.act3_library_relay_echo_done) {
      return currentSceneId === 'library_day'
        ? 'Прислушайся к каталогу — карточка «777» [E]'
        : 'Библиотека — каталог откликается на relay с пирса';
    }
    if (!flags.act3_cafe_relay_ack_done) {
      return currentSceneId === 'cafe_evening'
        ? 'Спроси бариста о релее — салфетка уже на стойке [E]'
        : '«Синяя яма» — бариста подтверждает relay из библиотеки';
    }
    if (!flags.act3_office_relay_ack_done) {
      return currentSceneId === 'office_day'
        ? 'Спроси коллегу о релее — монитор мигает ритмом [E]'
        : 'Офис — серверная замыкает relay из кафе';
    }
    if (!flags.act3_guild_relay_ack_done) {
      return currentSceneId === 'guild_mainframe'
        ? 'Прислушайся к мейнфрейму — «777 / OFFICE / ACK» [E]'
        : 'Серверная гильдии — мейнфрейм помнит relay из офиса';
    }
    if (!flags.act3_factory_relay_ack_done) {
      return currentSceneId === 'abandoned_factory'
        ? 'Прислушайся к реле у паяльной станции — кольцо замкнётся [E]'
        : 'Завод «Хром-М» — последний узел hub-mesh под полом';
    }
  } catch {
    return null;
  }
  return null;
}
