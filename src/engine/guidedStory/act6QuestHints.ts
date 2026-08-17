/** Live contextual cues for Act 6 spine quests (real quest ids only). */

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

/** Предатель в гильдии — logs → decrypt → trail → confront → fate. */
export function getTraitorInTheGuildHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('traitor_in_the_guild');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_alexander_logs')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Логи Александра где-то на заводе — ищи секретный тайник'
      : 'Секретные логи на заброшенной фабрике — начни там';
  }
  if (!objectiveDone(quest, 'decrypt_logs')) {
    return 'Расшифруй логи Александра — «Прорыв» поможет';
  }
  if (!objectiveDone(quest, 'find_mole_trail')) {
    return currentSceneId === 'office_day'
      ? 'След крота в офисных записях — копай глубже'
      : 'Офисные записи гильдии — ищи след предателя';
  }
  if (!objectiveDone(quest, 'confront_traitor')) {
    return currentSceneId === 'office_day'
      ? 'Дмитрий рядом — время столкновения [E]'
      : 'Предатель в офисе — иди к Дмитрию';
  }
  if (!objectiveDone(quest, 'decide_traitor_fate')) {
    return 'Реши судьбу предателя — простить или изгнать';
  }
  return null;
}

/** Подпольное сопротивление — street → maxim → recruit → network. */
export function getUndergroundResistanceHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('underground_resistance');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_resistance_contacts')) {
    return currentSceneId === 'street_night'
      ? 'Контакты сопротивления на ночных улицах — ищи в тени'
      : 'Ночные улицы — там собираются те, кто не хочет быть найденным';
  }
  if (!objectiveDone(quest, 'meet_resistance_leader')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Максим на фабрике — лидер сопротивления [E]'
      : 'Лидер сопротивления ждёт на заброшенной фабрике';
  }
  if (!objectiveDone(quest, 'recruit_defectors')) {
    return 'Завербуй трёх перебежчиков из гильдии';
  }
  if (!objectiveDone(quest, 'establish_safe_network')) {
    return 'Создай защищённую сеть связи для сопротивления';
  }
  return null;
}

/** Похищение данных — plan → infiltrate → hack → download → escape. */
export function getDataHeistHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('data_heist');
  if (!quest) return null;
  if (!objectiveDone(quest, 'plan_infiltration')) {
    return 'Спланируй проникновение с Максимом — сопротивление поможет [E]';
  }
  if (!objectiveDone(quest, 'infiltrate_office_night')) {
    return currentSceneId === 'office_day'
      ? 'Ты в офисе — держись тени'
      : 'Офис гильдии ночью — время проникновения';
  }
  if (!objectiveDone(quest, 'hack_mainframe')) {
    return 'Взломай главный сервер — «Сопротивление» отключит защиту';
  }
  if (!objectiveDone(quest, 'download_blackmail_data')) {
    return 'Скачай компромат с сервера';
  }
  if (!objectiveDone(quest, 'escape_through_corridor')) {
    return currentSceneId === 'volodka_corridor'
      ? 'Коридор — тихий выход, не поднимай тревогу'
      : 'Выбирайся через коридор Володки';
  }
  return null;
}

/** Секретный архив (act6 side) — hatch → door → decode → extract → seal. */
export function getAct6SecretArchiveHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('act6_secret_archive');
  if (!quest) return null;
  if (!objectiveDone(quest, 'find_hidden_hatch')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Скрытый люк под цехом — ищи гул «Голоса Улиц»'
      : 'Секретный архив под заброшенной фабрикой — найди люк';
  }
  if (!objectiveDone(quest, 'open_archive_door')) {
    return 'Открой дверь без ручки стихом «Голос Улиц»';
  }
  if (!objectiveDone(quest, 'decode_street_archive')) {
    return 'Расшифруй уличные записи — «Голос Улиц» ключ';
  }
  if (!objectiveDone(quest, 'extract_hidden_poems')) {
    return 'Извлеки спасённые стихи из архива до зачистки';
  }
  if (!objectiveDone(quest, 'seal_before_purge')) {
    return 'Запечатай люк — не оставляй след для гильдии';
  }
  return null;
}

/** Проникновение в систему — analyze → factory → guardian → core → truth. */
export function getSystemInfiltrationHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('system_infiltration');
  if (!quest) return null;
  if (!objectiveDone(quest, 'analyze_blackmail_data')) {
    return 'Проанализируй украденные данные — найди точку входа в «Надзор»';
  }
  if (!objectiveDone(quest, 'reach_nadzor_core')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Ядро «Надзора» где-то в глубинах завода — иди глубже'
      : 'Ядро «Надзора» на заброшенной фабрике — начни там';
  }
  if (!objectiveDone(quest, 'defeat_nadzor_guardian')) {
    return 'Хранитель «Надзора» блокирует путь — победи его';
  }
  if (!objectiveDone(quest, 'access_system_core')) {
    return 'Получи доступ к ядру — «Предатель» откроет путь';
  }
  if (!objectiveDone(quest, 'discover_nadzor_truth')) {
    return 'Узнай правду о происхождении «Надзора»';
  }
  return null;
}

/** Конфронтация на крыше — rooftop → ghost → battle → choice. */
export function getRooftopConfrontationHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('rooftop_confrontation');
  if (!quest) return null;
  if (!objectiveDone(quest, 'go_to_rooftop')) {
    return currentSceneId === 'rooftop_edge' || currentSceneId === 'factory_roof'
      ? 'Ты на крыше — финальная встреча близко'
      : 'Поднимись на крышу для финальной встречи';
  }
  if (!objectiveDone(quest, 'face_the_ghost')) {
    return 'Встреться лицом к лицу с тем, кто стоит за всем';
  }
  if (!objectiveDone(quest, 'battle_the_entity')) {
    return 'Сразись с могущественным противником';
  }
  if (!objectiveDone(quest, 'make_final_act6_choice')) {
    return 'Сделай выбор, который определит финал акта';
  }
  return null;
}
