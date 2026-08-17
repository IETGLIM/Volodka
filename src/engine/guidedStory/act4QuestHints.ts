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

/** Цифровой Призрак — Lena → server room → traces → firewall → fragment. */
export function getDigitalGhostHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('digital_ghost');
  if (!quest) return null;
  if (!objectiveDone(quest, 'consult_lena')) {
    return currentSceneId === 'office_day' || currentSceneId === 'library_day'
      ? 'Спроси Лену о цифровых следах в сети [E]'
      : 'Лена знает про следы удалённого ИИ — найди её';
  }
  if (!objectiveDone(quest, 'find_server_room')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Серверная комната в офисе гильдии — найди вход'
      : 'Серверная гильдии — ищи в офисе или mainframe';
  }
  if (!objectiveDone(quest, 'detect_ai_traces')) {
    return 'Обнаружь следы удалённого ИИ в старых логах';
  }
  if (!objectiveDone(quest, 'bypass_firewall')) {
    return 'Обойди фаервол — «Прорыв» пробьёт защиту';
  }
  if (!objectiveDone(quest, 'recover_ai_fragment')) {
    return 'Восстанови фрагмент сознания удалённого ИИ';
  }
  return null;
}

/** Голоса завода — factory → Zarya-M → poem → protect. */
export function getVoicesOfFactoryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('voices_of_factory');
  if (!quest) return null;
  if (!objectiveDone(quest, 'reach_factory')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Ты на «Хром-М» — ищи вход в подвал'
      : 'Заброшенный завод «Хром-М» — Дмитрий знает дорогу';
  }
  if (!objectiveDone(quest, 'find_zarya_m')) {
    return currentSceneId === 'factory_basement' || currentSceneId === 'abandoned_factory'
      ? 'Квантовый вычислитель «Заря-М» в подвале'
      : '«Заря-М» — в подвале завода';
  }
  if (!objectiveDone(quest, 'read_machine_poem')) {
    return 'Прочитай стихотворение, написанное машиной — «Прорыв» поможет';
  }
  if (!objectiveDone(quest, 'protect_machine')) {
    return 'Убедись, что гильдия не узнает о «Заре-М»';
  }
  return null;
}

/** Тайны старого кода — living code file → decode → factory → Lena. */
export function getSecretsOfOldCodeHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('secrets_of_old_code');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_living_code_file')) {
    return currentSceneId === 'albert_backroom' || currentSceneId === 'cafe_evening'
      ? 'Старый терминал в подсобке — файл «живой_код_v0.1.dat»'
      : 'Живой код 2028 — терминал в подсобке кафе';
  }
  if (!objectiveDone(quest, 'decode_poetic_code')) {
    return 'Расшифруй поэтический код — «Прорыв» или Альберт помогут';
  }
  if (!objectiveDone(quest, 'find_more_code_files')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Ищи другие файлы «живого кода» на заводе'
      : 'Другие файлы живого кода — на заброшенном заводе';
  }
  if (!objectiveDone(quest, 'share_with_lena')) {
    return 'Покажи Лене расшифрованный «живой код» [E]';
  }
  return null;
}

/** Банковская Авария — bash → investigate → verify → Zarema. */
export function getBankingCrashHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('banking_crash');
  if (!quest) return null;
  if (!objectiveDone(quest, 'access_bash_terminal')) {
    return 'Получи доступ к Bash-терминалу банковской системы';
  }
  if (!objectiveDone(quest, 'investigate_crash')) {
    return 'Исследуй логи через терминал — найди причину сбоя';
  }
  if (!objectiveDone(quest, 'verify_recovery')) {
    return 'Убедись, что banking-daemon снова отвечает';
  }
  if (!objectiveDone(quest, 'inform_zarema')) {
    return currentSceneId === 'home_evening'
      ? 'Сообщи Зареме о восстановлении системы [E]'
      : 'Зарема ждёт новости о банке — зайди домой';
  }
  return null;
}

/** Банковский Перевод — discover → trace → confront → moral. */
export function getBankTransferHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('bank_transfer');
  if (!quest) return null;
  if (!objectiveDone(quest, 'discover_bank_issue')) {
    return currentSceneId === 'home_evening'
      ? 'Ноутбук Заремы — подозрительная транзакция [E]'
      : 'Зарема дома — на её ноутбуке странный перевод';
  }
  if (!objectiveDone(quest, 'trace_transaction')) {
    return 'Отследи путь украденных средств через банковскую систему';
  }
  if (!objectiveDone(quest, 'confront_culprit')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Корпоративный счёт гильдии — виновный рядом'
      : 'Следы ведут к офису гильдии';
  }
  if (!objectiveDone(quest, 'moral_choice_return')) {
    return 'Вернуть деньги Зареме или оставить себе — выбор за тобой';
  }
  return null;
}

/** Ночной Дозор — patrol → mugger → child → friend. */
export function getNightWatchHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('night_watch');
  if (!quest) return null;
  if (!objectiveDone(quest, 'patrol_street')) {
    return currentSceneId === 'street_winter' || currentSceneId === 'street_night'
      ? 'Патруль начат — иди по тёмным переулкам'
      : 'Выйди на ночное патрулирование зимней улицы';
  }
  if (!objectiveDone(quest, 'encounter_mugger')) {
    return 'Тёмный переулок — грабитель где-то в тени';
  }
  if (!objectiveDone(quest, 'find_lost_child')) {
    return 'Потерявшийся ребёнок на улице — прислушайся';
  }
  if (!objectiveDone(quest, 'meet_old_friend')) {
    return 'Старый знакомый в ночном городе — узнай его';
  }
  return null;
}

/** Стих под Прикрытием — spot → infiltrate → identify → extract. */
export function getPoemUndercoverHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('poem_undercover');
  if (!quest) return null;
  if (!objectiveDone(quest, 'spot_poetry_reading')) {
    return currentSceneId === 'cafe_evening'
      ? 'Подозрительное чтение в кафе — присмотрись'
      : 'Поэтический вечер в кафе — прикрытие для Сети';
  }
  if (!objectiveDone(quest, 'infiltrate_reading')) {
    return currentSceneId === 'cafe_evening'
      ? 'Проникни на чтение под прикрытием [E]'
      : 'Кафе «Синяя яма» — вечер уже идёт';
  }
  if (!objectiveDone(quest, 'identify_network_agents')) {
    return 'Опознай агентов Сети — «Прорыв» поможет выглядеть своим';
  }
  if (!objectiveDone(quest, 'extract_intel')) {
    return 'Вытяни разведданные о планах Сети';
  }
  return null;
}

/** Сломанный Терминал — fix 1→2→3. */
export function getBrokenTerminalHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('broken_terminal');
  if (!quest) return null;
  if (!objectiveDone(quest, 'fix_terminal_1')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Терминал #1 — ошибка «СТИХ_НЕ_НАЙДЕН»'
      : 'Три сломанных терминала в офисе гильдии';
  }
  if (!objectiveDone(quest, 'fix_terminal_2')) {
    return 'Терминал #2 — обрывки стихотворных строк';
  }
  if (!objectiveDone(quest, 'fix_terminal_3')) {
    return 'Терминал #3 — фрагмент скрытого стиха; «Прорыв» ускорит диагностику';
  }
  return null;
}

/** Голос Прошлого — find → listen ×3. */
export function getVoiceOfThePastHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('voice_of_the_past');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_recordings')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Аудио-модуль Владимира где-то на заводе'
      : 'Записи голоса Владимира — на заброшенной фабрике';
  }
  if (!objectiveDone(quest, 'listen_first_recording')) {
    return 'Первая запись — прощание. Слушай';
  }
  if (!objectiveDone(quest, 'listen_second_recording')) {
    return 'Вторая запись — стихотворение';
  }
  if (!objectiveDone(quest, 'listen_final_recording')) {
    return 'Последняя запись — завещание';
  }
  return null;
}

/** Кризис OpenStack — access → diagnose → report. */
export function getOpenstackCrisisHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('openstack_crisis');
  if (!quest) return null;
  if (!objectiveDone(quest, 'access_openstack_terminal')) {
    return currentSceneId === 'office_day' || currentSceneId === 'guild_mainframe'
      ? 'Терминал OpenStack рядом — получи доступ'
      : 'Терминал OpenStack в офисе гильдии';
  }
  if (!objectiveDone(quest, 'diagnose_servers')) {
    return 'Диагностика через nova list — восстанови VM до коллапса';
  }
  if (!objectiveDone(quest, 'report_server_status')) {
    return currentSceneId === 'office_day'
      ? 'Доложи Александру о результатах [E]'
      : 'Александр ждёт доклад о серверах — иди в офис';
  }
  return null;
}
