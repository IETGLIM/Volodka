/** Live contextual cues for AAA expansion side quests (pier / library / factory / resistance / CHK). */

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

/** Ночная рыбалка. */
export function getPierMidnightFishingHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('pier_midnight_fishing');
  if (!quest) return null;
  const onPier = currentSceneId === 'pier_evening' || currentSceneId === 'river_pier';
  if (!objectiveDone(quest, 'accept_midnight_fishing') || !objectiveDone(quest, 'take_spare_float')) {
    return onPier
      ? 'Трофим на пирсе — возьми второй поплавок [E]'
      : 'Найди Трофима на вечернем пирсе';
  }
  if (!objectiveDone(quest, 'sit_with_rod')) {
    return onPier ? 'Сядь с удочкой у свай' : 'Вернись на пирс — удочка ждёт';
  }
  if (!objectiveDone(quest, 'hear_factory_bass')) {
    return onPier ? 'Прислушайся — завод гудит под водой' : 'На пирсе слышен гул завода — вернись';
  }
  if (!objectiveDone(quest, 'learn_third_pile')) {
    return onPier ? 'Трофим расскажет про третью сваю [E]' : 'Трофим на пирсе — ключ под сваей';
  }
  if (!objectiveDone(quest, 'fish_with_trofim')) {
    return onPier
      ? 'Запомни про третью сваю — ночь почти закончена'
      : 'Заверши ночную рыбалку с Трофимом на пирсе';
  }
  return null;
}

/** Струны для Ритки — promise → Elis → office → pack → deliver → song. */
export function getPierRitkaStringsHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('pier_ritka_strings');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_ritka_strings')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Ритка на ящике — пообещай найти струны [E]'
      : 'Ритка на пирсе ждёт обещания про струны';
  }
  if (!objectiveDone(quest, 'ask_elis_strings')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Элис у костра — спроси про запасную струну [E]'
      : 'Спроси Элис в ЧК — где запасная E';
  }
  if (!objectiveDone(quest, 'get_strings')) {
    return currentSceneId === 'office_day'
      ? 'Коллега в офисе — струна в ящике [E]'
      : 'Запасная струна у коллеги в офисе';
  }
  if (!objectiveDone(quest, 'elis_pack_ready')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Верни струну Элис — соберёт комплект [E]'
      : 'Элис в ЧК соберёт комплект для Ритки';
  }
  if (!objectiveDone(quest, 'deliver_strings') || !objectiveDone(quest, 'hear_ritka_bars')) {
    return currentSceneId === 'pier_evening' || currentSceneId === 'river_pier'
      ? 'Верни струны Ритке — послушай четыре такта [E]'
      : 'Ритка ждёт струны на пирсе';
  }
  return null;
}

/** Утерянный архив — Фонд → ключ → подвал → решётка → оцифровка. */
export function getLibraryLostArchiveHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('library_lost_archive');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_archive')) {
    return currentSceneId === 'library_day'
      ? 'Катя у картотеки — согласись помочь с архивом [E]'
      : 'Поговори с Катей в библиотеке про утерянный архив';
  }
  if (!objectiveDone(quest, 'find_fund_key')) {
    return currentSceneId === 'library_day'
      ? 'Запретный Фонд — достань механический ключ [E]'
      : 'Ключ к архиву в Запретном Фонде библиотеки';
  }
  if (!objectiveDone(quest, 'enter_basement')) {
    return currentSceneId === 'library_day'
      ? 'Спуск в подвал — Катя указала дверь'
      : currentSceneId === 'library_basement'
        ? 'Ты в подвале — открой решётку ключом'
        : 'Спустись в подвал библиотеки с ключом';
  }
  if (!objectiveDone(quest, 'unlock_gate')) {
    return currentSceneId === 'library_basement'
      ? 'Механическая скважина у RFID — вставь ключ [E]'
      : 'Решётка архива в подвале библиотеки';
  }
  if (!objectiveDone(quest, 'recover_archive')) {
    return currentSceneId === 'library_basement'
      ? 'Нижний ряд коробок «УТИЛЬ» — открой [E]'
      : 'Архив за решёткой в подвале';
  }
  if (!objectiveDone(quest, 'digitize_secret')) {
    return currentSceneId === 'library_basement'
      ? 'Помоги Кате оцифровать архив тайно [E]'
      : 'Оцифровка архива — с Катей в подвале';
  }
  return null;
}

/** Исследование Кати — схема → прошивки → ночь → Марат → распечатка. */
export function getLibraryKatyaResearchHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('library_katya_research');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_research') || !objectiveDone(quest, 'open_schema')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Катя у схемы — отметь петлю связей [E]'
      : 'Катя ждёт в библиотеке — схема связей поэтов';
  }
  if (!objectiveDone(quest, 'crossref_firmware')) {
    return currentSceneId === 'library_day'
      ? 'Сверь схему с прошивочными хешами [E]'
      : 'Катя в библиотеке — кросс-сверка прошивок';
  }
  if (!objectiveDone(quest, 'night_pass') || !objectiveDone(quest, 'marat_node')) {
    return currentSceneId === 'library_day' || currentSceneId === 'library_basement'
      ? 'Ночной проход — найди узел «Марат» [E]'
      : 'Вернись к Кате — ночь на исследование';
  }
  if (!objectiveDone(quest, 'complete_research')) {
    return currentSceneId === 'library_day'
      ? 'Забери распечатку со следом Марата [E]'
      : 'Катя ждёт с распечаткой в библиотеке';
  }
  return null;
}

/** Память «Зари-М» (AAA side) — снежинка → гроза → фото → шина. */
export function getFactoryZaryaMemoryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('factory_zarya_memory');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_restore') || !objectiveDone(quest, 'snowflake')) {
    return currentSceneId === 'abandoned_factory' ||
      currentSceneId === 'factory_basement' ||
      currentSceneId === 'factory_roof'
      ? 'Снежинка на периле крыши — первый образ [E]'
      : 'Найди Бабу Зину на заводе — память «Зари-М»';
  }
  if (!objectiveDone(quest, 'storm_tape')) {
    return currentSceneId === 'factory_basement' || currentSceneId === 'abandoned_factory'
      ? 'Кассета с грозой у паяльной — второй образ [E]'
      : 'Вернись в подвал завода — кассета с грозой';
  }
  if (!objectiveDone(quest, 'solnysh_photo') || !objectiveDone(quest, 'restore_memory')) {
    return currentSceneId === 'factory_basement' || currentSceneId === 'abandoned_factory'
      ? 'Фото Солныш на шину — верни память [E]'
      : 'Баба Зина у паяльной — положи образы на шину';
  }
  return null;
}

/** Чай с Бабой Зиной — чайник → мята → гул → история → допить. */
export function getFactoryBabaZinaTeaHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('factory_baba_zina_tea');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_tea') || !objectiveDone(quest, 'kettle_ready')) {
    return currentSceneId === 'abandoned_factory' || currentSceneId === 'factory_basement'
      ? 'Чайник у паяльной — дождись свиста [E]'
      : 'Загляни к Бабе Зине в цех — чайник на горелке';
  }
  if (!objectiveDone(quest, 'mint_brew') || !objectiveDone(quest, 'share_hum')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Сядь с чаем — послушай гул 50 Гц [E]'
      : 'Вернись к Зине — чай и гул машины';
  }
  if (!objectiveDone(quest, 'hear_history') || !objectiveDone(quest, 'drink_tea')) {
    return currentSceneId === 'abandoned_factory'
      ? 'Допей чай — Зина расскажет про 1987-й [E]'
      : 'Баба Зина ждёт у паяльной — допить и поблагодарить';
  }
  return null;
}

/** Обустроить убежище: список → фильтры → 433 → стихи → матрасы → дом. */
export function getResistanceSafehouseHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('resistance_safehouse');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_list')) {
    return currentSceneId === 'underground_bunker'
      ? 'Аня ждёт — прими список для убежища [E]'
      : 'Найди бункер через контакт Жеки — убежище Сопротивления';
  }
  if (!objectiveDone(quest, 'install_filters')) {
    return 'Установи воздушные фильтры в вентиляции бункера';
  }
  if (!objectiveDone(quest, 'tune_radio')) {
    return 'Настрой радиомолчание на частоте 433';
  }
  if (!objectiveDone(quest, 'poem_mesh')) {
    return 'Развесь стихи на стене — маскировка для сканеров';
  }
  if (!objectiveDone(quest, 'make_beds') || !objectiveDone(quest, 'setup_bunker')) {
    return currentSceneId === 'underground_bunker'
      ? 'Разложи матрасы — бункер станет домом [E]'
      : 'Вернись в бункер — доделай угол для сна';
  }
  return null;
}

/** Спасти перебежчика: брифинг → тоннель → стих → эвакуация → Олег. */
export function getResistanceDefectorRescueHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('resistance_defector_rescue');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_rescue')) {
    return currentSceneId === 'underground_bunker'
      ? 'Максим здесь — рейд за перебежчиком [E]'
      : 'Максим ждёт в бункере — через два часа стирание';
  }
  if (!objectiveDone(quest, 'tunnel_approach')) {
    return currentSceneId === 'street_night'
      ? 'Тоннель вывел к засаде — выйди к офисному входу'
      : 'Аня ведёт по тоннелю — спустись к засаде';
  }
  if (!objectiveDone(quest, 'poem_stun')) {
    return 'Прочти стих вслух — дроны должны замереть';
  }
  if (!objectiveDone(quest, 'extract_defector')) {
    return 'Беги в тоннель с инженером — патруль близко';
  }
  if (!objectiveDone(quest, 'rescue_defector')) {
    return currentSceneId === 'underground_bunker'
      ? 'Максим примет Олега — операция почти закрыта [E]'
      : 'Поднимись в бункер с перебежчиком';
  }
  return null;
}

/** Портвейн для ЧК — Басед → Альберт → улица → костёр → тост. */
export function getChkPortwineDeliveryHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('chk_portwine_delivery');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_portwine')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Басед у костра — возьми поручение на «777» [E]'
      : 'Поговори с Баседом в ЧК — портвейн из «Синей ямы»';
  }
  if (!objectiveDone(quest, 'ask_albert') || !objectiveDone(quest, 'carry_crate')) {
    return currentSceneId === 'albert_backroom' || currentSceneId === 'cafe_evening'
      ? 'Альберт в подсобке — ящик «777» [E]'
      : 'Забери ящик у Альберта в подсобке «Синей ямы»';
  }
  if (!objectiveDone(quest, 'street_safe')) {
    return 'Донеси ящик до ЧК — не открывая по дороге';
  }
  if (!objectiveDone(quest, 'deliver_portwine')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Ящик «777» к костру — Басед ждёт [E]'
      : 'Отнеси ящик к ночному костру ЧК';
  }
  if (!objectiveDone(quest, 'campfire_toast')) {
    return currentSceneId === 'chk_campfire_night' || currentSceneId === 'chk_forest_zorge'
      ? 'Сядь у костра — тост за доставку [E]'
      : 'Басед ждёт тост у ночного костра';
  }
  return null;
}

/** Струны для Элис — ЧК → офис → возврат → аккорд. */
export function getChkGuitarStringsHint(currentSceneId: string): string | null {
  const quest = findActiveQuest('chk_guitar_strings');
  if (!quest) return null;
  if (!objectiveDone(quest, 'accept_elis_strings')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Элис у костра — струна E оборвалась [E]'
      : 'Элис у костра в ЧК — нужна запасная E';
  }
  if (!objectiveDone(quest, 'reach_office') || !objectiveDone(quest, 'take_string')) {
    return currentSceneId === 'office_day'
      ? 'Коллега у ящика — струна «для костра» [E]'
      : 'Достань струну E у коллеги в офисе гильдии';
  }
  if (!objectiveDone(quest, 'return_elis') || !objectiveDone(quest, 'hear_blind_song')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Верни струну Элис — слушай аккорд [E]'
      : 'Неси струну Элис к костру ЧК';
  }
  if (!objectiveDone(quest, 'find_strings')) {
    return currentSceneId === 'chk_forest_zorge' || currentSceneId === 'chk_campfire_night'
      ? 'Поблагодари Элис — струны закрыты [E]'
      : 'Элис ждёт у костра — закрыть дело струн';
  }
  return null;
}
