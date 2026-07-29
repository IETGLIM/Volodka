/** Live contextual cues for Phase 5 expansion side quests (Acts 2–7). */

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

/** Охота на серверные стихи — office → pier → CHK. */
export function getServerPoemHuntHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act2_server_poem_hunt');
  if (!quest) return null;
  if (!objectiveDone(quest, 'scan_office_server')) {
    return currentSceneId === 'office_day'
      ? 'Офисный сервер рядом — сканируй логи ошибок'
      : 'Серверные стихи — начни с логов в офисе гильдии';
  }
  if (!objectiveDone(quest, 'scan_pier_server')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Пирсный сервер здесь — вытащи строку из логов'
      : 'Следующий фрагмент — на пирсе';
  }
  if (!objectiveDone(quest, 'scan_chk_server')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Сервер ЧК у костра — дочитай третий фрагмент'
      : 'Третий фрагмент — в ЧК на Зорге';
  }
  return null;
}

/** Неоновый архив — Based → hack sign. */
export function getChkNeonArchiveHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act2_chk_neon_archive');
  if (!quest) return null;
  if (!objectiveDone(quest, 'talk_based')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Басед у костра — спроси про «Синюю яму» [E]'
      : 'Басед у ночного костра в ЧК — поговори, затем ищи вывеску';
  }
  if (!objectiveDone(quest, 'hack_neon_sign')) {
    return 'Вывеска «Синяя яма» — вытащи цифровой архив из биллиардного интерфейса';
  }
  return null;
}

/** Кибер-цветение — α → β → γ. */
export function getParkCyberBloomHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act3_park_cyber_bloom');
  if (!quest) return null;
  if (!objectiveDone(quest, 'bloom_node_alpha')) {
    return currentSceneId === 'park_day'
      ? 'Кибер-цветок α ждёт голоса — прочти стих'
      : 'Парк днём — три кибер-цветка ждут твоего голоса';
  }
  if (!objectiveDone(quest, 'bloom_node_beta')) {
    return currentSceneId === 'park_day'
      ? 'Кибер-цветок β — следующая строка'
      : 'Вернись в парк — цветок β ещё не расцвёл';
  }
  if (!objectiveDone(quest, 'bloom_node_gamma')) {
    return currentSceneId === 'park_day'
      ? 'Кибер-цветок γ — финальный узел'
      : 'Последний кибер-цветок в парке';
  }
  return null;
}

/** Свидетельство Заремы — escort → secure. */
export function getZaremaEvidenceRunHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act3_zarema_evidence_run');
  if (!quest) return null;
  if (!objectiveDone(quest, 'escort_zarema')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Проведи Зарему в подвал — Катя прикрывает'
      : 'Встреть Зарему у библиотеки — нужно провести её в подвал';
  }
  if (!objectiveDone(quest, 'secure_evidence')) {
    return currentSceneId === 'library_basement'
      ? 'Загрузи свидетельства в защищённый узел [E]'
      : 'Свидетельства ждут загрузки в подвале библиотеки';
  }
  return null;
}

/** Антенна свободы — rooftop → repair. */
export function getRooftopBroadcastSetupHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act4_rooftop_broadcast_setup');
  if (!quest) return null;
  if (!objectiveDone(quest, 'reach_rooftop')) {
    return currentSceneId === 'rooftop_edge' || currentSceneId === 'factory_roof'
      ? 'Крыша блока 4-Б — мачта рядом'
      : 'Крыша блока 4-Б — Александр указал путь';
  }
  if (!objectiveDone(quest, 'repair_antenna')) {
    return 'Перепаяй радиомачту и настрой стих-модулятор';
  }
  return null;
}

/** Самиздат на снегу — pier → CHK → library. */
export function getStreetSamizdatHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act4_street_samizdat');
  if (!quest) return null;
  if (!objectiveDone(quest, 'drop_pier_samizdat')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Разложи самиздат у пирса — быстро и тихо'
      : 'Первая точка самиздата — пирс';
  }
  if (!objectiveDone(quest, 'drop_chk_samizdat')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Листок у костра ЧК — не попадайся патрулю'
      : 'Вторая точка — ЧК на Зорге';
  }
  if (!objectiveDone(quest, 'drop_library_samizdat')) {
    return currentSceneId === 'library_day' || currentSceneId === 'street_winter'
      ? 'Последний листок у библиотеки — бегом домой'
      : 'Третья точка — у библиотеки';
  }
  return null;
}

/** Память Зари-М (phase5) — fragment 1→2→3. */
export function getZaryaMemoryRestoreHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act5_factory_zarya_memory_restore');
  if (!quest) return null;
  if (!objectiveDone(quest, 'restore_memory_fragment_1')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Первый образ памяти — ищи цифровую тень у паяльной'
      : 'Баба Зина в цеху — начни восстановление памяти «Зари-М»';
  }
  if (!objectiveDone(quest, 'restore_memory_fragment_2')) {
    return 'Второй образ — серверные обрывки leaking-потока';
  }
  if (!objectiveDone(quest, 'restore_memory_fragment_3')) {
    return 'Третий образ — верни на паяльную станцию';
  }
  return null;
}

/** Шифр-стих — find key → break. */
export function getBunkerCodePoemBreakHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act5_bunker_code_poem_break');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_poem_key')) {
    return currentSceneId === 'underground_bunker'
      ? 'Терминал гильдейского шифра — ищи стих-ключ в leaking-потоке'
      : 'Бункер — там терминал шифра «Солныш»';
  }
  if (!objectiveDone(quest, 'break_encryption')) {
    return 'Подставь стих-ключ и пробей шифр — один неверный ритм, и архив схлопнется';
  }
  return null;
}

/** Перебежчик: ночной рейд — infiltrate → free → escape. */
export function getDefectorRescueExpandedHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act6_defector_rescue_expanded');
  if (!quest) return null;
  if (!objectiveDone(quest, 'infiltrate_checkpoint')) {
    return currentSceneId === 'underground_bunker'
      ? 'Коллектор под КПП — иди в темноте'
      : 'Максим в бункере — маршрут через коллектор под КПП';
  }
  if (!objectiveDone(quest, 'free_engineer')) {
    return 'Камера удержания — вытащи инженера до цифрового стирания';
  }
  if (!objectiveDone(quest, 'escape_sewers')) {
    return 'Уходи через подземный сток к бункеру — патруль близко';
  }
  return null;
}

/** Имена на камне — visit → inscribe. */
export function getPoetsMonumentInscriptionHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('quest_act7_poets_monument_inscription');
  if (!quest) return null;
  if (!objectiveDone(quest, 'visit_monument')) {
    return currentSceneId === 'park_day'
      ? 'Обелиск без таблички — подойди ближе'
      : 'Парк — обелиск ждёт имён тех, кого помнишь';
  }
  if (!objectiveDone(quest, 'inscribe_names')) {
    return 'Впиши имена погибших поэтов на камень — собственной рукой';
  }
  return null;
}
