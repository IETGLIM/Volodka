import type { StoryChoice, StoryNode } from '@/shared/types/game';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';

/** Act 1 already defines explore_mode, corridor_explore_mode, street_bench_view. */
const ACT1_HUB_IDS = new Set(['explore_mode', 'corridor_explore_mode', 'street_bench_view']);

/** Explore hubs with richer definitions in act story packs — skip auto-generation. */
const ACT_PACK_DEFINED_HUB_IDS = new Set([
  'pier_explore_mode',
  'factory_explore_mode',
  'basement_explore_mode',
  'solnysh_explore_mode',
]);

/** Golden-path continuation from auto-generated explore hubs (matches GOLDEN_PATH_STORY_SPINE). */
const GOLDEN_PATH_HUB_CONTINUE: Partial<
  Record<string, { next: string; text: string }>
> = {
  cafe_explore_mode: { next: 'cafe_barista', text: 'Подойти к баристе' },
  office_explore_mode: { next: 'start_diagnosis', text: 'Сесть за терминал Александра' },
  park_explore_mode: { next: 'act3_zarema_warning', text: 'Осторожно очистить надпись на камне' },
  street_winter_explore_mode: {
    next: 'act4_peaceful_march',
    text: 'Присоединиться к мирному маршу',
  },
  rooftop_explore_mode: {
    next: 'act4_rooftop_broadcast',
    text: 'Настроить передающую антенну',
  },
  library_explore_mode: {
    next: 'act7_library_archive',
    text: 'Открыть городской архив стихов',
  },
  chk_explore_mode: {
    next: 'chk_act5_campfire_dawn',
    text: 'Подойти к Ру — рассвет после эфира',
  },
  dream_explore_mode: {
    next: 'sleep_dream_entrance',
    text: 'Запомнить стихотворение из сна',
  },
  zarema_room_explore_mode: {
    next: 'zarema_bank_discovery',
    text: 'Зафиксировать следы и начать расследование',
  },
  zarema_room_solo_explore_mode: {
    next: 'act4_quiet_zarema_room',
    text: 'Заглянуть к Зареме',
  },
  pier_evening_explore_mode: {
    next: 'pier_story_intro',
    text: 'Поговорить с Трофимом и Риткой',
  },
  library_basement_explore_mode: {
    next: 'library_lost_archive_start',
    text: 'Искать утерянный архив с Катей — ключ, решётка, оцифровка',
  },
  bunker_explore_mode: {
    next: 'resistance_bunker_hub',
    text: 'Встретиться с Максимом',
  },
  albert_backroom_explore_mode: {
    next: 'act4_quiet_albert_backroom',
    text: 'Заглянуть к Альберту в подсобку',
  },
  mainframe_explore_mode: {
    next: 'act4_quiet_mainframe',
    text: 'Заглянуть в серверную гильдии',
  },
  factory_roof_explore_mode: {
    next: 'factory_roof_lookout',
    text: 'Подняться к Жеке на крышу',
  },
  city_square_explore_mode: {
    next: 'act4_public_leader',
    text: 'Выйти на площадь — обратиться к людям',
  },
};

function buildSceneExploreHubNode(def: (typeof SCENE_EXPLORE_HUB_DEFS)[number]): StoryNode {
  const continueChoice = GOLDEN_PATH_HUB_CONTINUE[def.hubId];
  const choices: StoryChoice[] = [];

  if (continueChoice) {
    if (def.hubId === 'park_explore_mode') {
      choices.push({
        text: continueChoice.text,
        next: continueChoice.next,
        goldenPath: true,
        condition: {
          requiredAct: 3,
          missingFlag: 'zarema_arrested',
        },
      });
    } else {
      choices.push({
        text: continueChoice.text,
        next: continueChoice.next,
        goldenPath: true,
      });
    }
  }

  if (def.hubId === 'park_explore_mode') {
    choices.push(
      {
        text: 'Подойти к кибер-цветку α — голос раскрывает узел',
        next: 'quest_act3_park_cyber_bloom_start',
        condition: {
          requiredAct: 3,
          missingFlag: 'quest_act3_park_cyber_bloom_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act3_park_cyber_bloom' }],
      },
      {
        text: 'Дочитать у цветка α',
        next: 'quest_act3_park_cyber_bloom_alpha',
        condition: {
          flag: 'quest_act3_park_cyber_bloom_active',
          missingFlag: 'park_cyber_bloom_alpha_done',
        },
      },
      {
        text: 'Идти к цветку β — следующая строка',
        next: 'quest_act3_park_cyber_bloom_beta',
        condition: {
          flag: 'park_cyber_bloom_alpha_done',
          missingFlag: 'park_cyber_bloom_beta_done',
        },
      },
      {
        text: 'Идти к цветку γ — последний узел',
        next: 'quest_act3_park_cyber_bloom_gamma',
        condition: {
          flag: 'park_cyber_bloom_beta_done',
          missingFlag: 'park_cyber_bloom_gamma_done',
        },
      },
      {
        text: 'Подойти к обелиску поэтов — табличка чужая',
        next: 'quest_act7_poets_monument_inscription_start',
        condition: {
          requiredAct: 7,
          missingFlag: 'quest_act7_poets_monument_inscription_active',
        },
        effects: [{ type: 'triggerQuest', questId: 'quest_act7_poets_monument_inscription' }],
      },
      {
        text: 'Соскрести гильдейскую табличку с обелиска',
        next: 'quest_act7_poets_monument_plate',
        condition: {
          flag: 'quest_act7_poets_monument_inscription_active',
          missingFlag: 'quest_act7_poets_monument_plate_cleared',
        },
      },
      {
        text: 'Дорезать имена на камне',
        next: 'quest_act7_poets_monument_recall',
        condition: {
          flag: 'quest_act7_poets_monument_plate_cleared',
          missingFlag: 'quest_act7_poets_monument_inscription_done',
        },
      },
      {
        text: 'Сесть на скамейку — финальное стихотворение',
        next: 'act7_final_poem_creation',
        condition: {
          flag: 'nadzor_shutdown_complete',
          missingFlag: 'journey_reflected',
        },
      },
      {
        text: 'Стих готов — на крышу читать',
        next: 'act7_poem_written',
        condition: {
          flag: 'journey_reflected',
          missingFlag: 'final_poem_written',
        },
      },
      {
        text: 'Памятник поэтам — добавить своё имя',
        next: 'epilogue_monument_start',
        condition: {
          flag: 'volodka_legacy_complete',
          missingFlag: 'epilogue_monument_done',
        },
        effects: [{ type: 'triggerQuest', questId: 'epilogue_monument' }],
      },
    );
  }

  if (def.hubId === 'zarema_room_explore_mode') {
    choices.push(
      {
        text: 'Отследить транзакции на ноутбуке Заремы',
        next: 'bank_transfer_trace',
        condition: { flag: 'found_zarema_bank', missingFlag: 'traced_bank_transfer' },
      },
      {
        text: 'Сверить корпоративный счёт гильдии',
        next: 'bank_transfer_culprit',
        condition: { flag: 'traced_bank_transfer', missingFlag: 'identified_bank_culprit' },
      },
      {
        text: 'Решить судьбу украденных денег',
        next: 'bank_transfer_moral',
        condition: { flag: 'identified_bank_culprit', missingFlag: 'bank_moral_choice_made' },
      },
    );
  }

  if (def.hubId === 'office_explore_mode') {
    choices.push(
      {
        text: 'Проникнуть в блок задержания — Зарема внутри',
        next: 'act3_detention_infiltration',
        condition: {
          flag: 'zarema_arrested',
          missingFlag: 'detention_breached',
        },
      },
      {
        text: 'Открыть камеру — Зарема ждёт',
        next: 'act3_zarema_cell',
        condition: {
          flag: 'detention_breached',
          missingFlag: 'zarema_rescued',
        },
      },
      {
        text: 'Сверить корпоративный счёт гильдии — банковский след',
        next: 'bank_transfer_culprit',
        condition: { flag: 'traced_bank_transfer', missingFlag: 'identified_bank_culprit' },
      },
      {
        text: 'Столкнуться с Олегом — крот Сети',
        next: 'blind_spot_confront',
        condition: { flag: 'mole_identified', missingFlag: 'mole_confronted' },
      },
      {
        text: 'Копать логи на следы удалённого ИИ',
        next: 'digital_ghost_traces',
        condition: { flag: 'found_server_room', missingFlag: 'detected_ai_traces' },
      },
      {
        text: 'Пробить фаервол стёртых данных',
        next: 'digital_ghost_firewall',
        condition: { flag: 'detected_ai_traces', missingFlag: 'firewall_bypassed' },
      },
      {
        text: 'Собрать фрагмент сознания ИИ',
        next: 'digital_ghost_recover',
        condition: { flag: 'firewall_bypassed', missingFlag: 'ai_fragment_recovered' },
      },
      {
        text: 'Спросить коллегу про струну E для Элис',
        next: 'chk_guitar_office_pickup',
        condition: {
          flag: 'chk_guitar_strings_active',
          missingFlag: 'chk_guitar_string_taken',
        },
        effects: [{ type: 'setFlag', flag: 'chk_guitar_office_reached', flagValue: true }],
      },
      {
        text: 'Забрать запасную струну у коллеги — для Ритки',
        next: 'pier_ritka_office_string',
        condition: {
          flag: 'pier_ritka_elis_asked',
          missingFlag: 'pier_ritka_get_strings_done',
        },
      },
      {
        text: 'Потребовать правду у Дмитрия — крот',
        next: 'act6_office_confrontation',
        condition: { flag: 'traitor_revealed', missingFlag: 'traitor_fate_decided' },
      },
      {
        text: 'Взломать сервер гильдии — компромат',
        next: 'act6_heist_execution',
        condition: { flag: 'act6_heist_planned', missingFlag: 'mainframe_hacked' },
      },
      {
        text: 'Скачать компромат и уйти коридором',
        next: 'act6_heist_success',
        condition: {
          flag: 'mainframe_hacked',
          missingFlag: 'data_heist_completed',
        },
      },
    );
  }

  if (def.hubId === 'albert_backroom_explore_mode') {
    choices.push(
      {
        text: 'Попросить у Альберта ящик «777» для Баседа',
        next: 'chk_portwine_albert_ask',
        condition: {
          flag: 'chk_portwine_active',
          missingFlag: 'chk_portwine_albert_asked',
        },
      },
      {
        text: 'Забрать ящик портвейна из угла',
        next: 'chk_portwine_pickup',
        condition: {
          flag: 'chk_portwine_albert_asked',
          missingFlag: 'chk_portwine_carried',
        },
      },
    );
  }

  if (def.hubId === 'chk_explore_mode') {
    choices.push(
      {
        text: 'Басед — про портвейн «777»',
        next: 'chk_portwine_delivery_start',
        condition: { missingFlag: 'chk_portwine_active' },
        effects: [{ type: 'triggerQuest', questId: 'chk_portwine_delivery' }],
      },
      {
        text: 'Донести ящик к костру',
        next: 'chk_portwine_street',
        condition: {
          flag: 'chk_portwine_carried',
          missingFlag: 'chk_portwine_delivery_done',
        },
      },
      {
        text: 'Поднять тост у костра',
        next: 'chk_portwine_toast',
        condition: {
          flag: 'chk_portwine_delivery_done',
          missingFlag: 'chk_portwine_toast_shared',
        },
      },
      {
        text: 'Элис — про запасную струну E',
        next: 'chk_guitar_strings_start',
        condition: { missingFlag: 'chk_guitar_strings_active' },
        effects: [{ type: 'triggerQuest', questId: 'chk_guitar_strings' }],
      },
      {
        text: 'Отдать струну Элис',
        next: 'chk_guitar_return_elis',
        condition: {
          flag: 'chk_guitar_string_taken',
          missingFlag: 'chk_guitar_string_returned',
        },
      },
      {
        text: 'Спросить Элис про струны для Ритки',
        next: 'pier_ritka_elis_ask',
        condition: {
          flag: 'pier_ritka_strings_active',
          missingFlag: 'pier_ritka_elis_asked',
        },
      },
      {
        text: 'Отнести струну Элис — собрать комплект',
        next: 'pier_ritka_elis_pack',
        condition: {
          flag: 'pier_ritka_get_strings_done',
          missingFlag: 'pier_ritka_elis_pack_ready',
        },
        effects: [{ type: 'transitionScene', sceneId: 'chk_campfire_night' }],
      },
    );
  }

  if (def.hubId === 'chk_campfire_night_explore_mode') {
    choices.push(
      {
        text: 'Отдать ящик «777» Баседу',
        next: 'chk_portwine_delivered',
        condition: {
          flag: 'chk_portwine_street_safe',
          missingFlag: 'chk_portwine_delivery_done',
        },
      },
      {
        text: 'Поднять тост у ночного костра',
        next: 'chk_portwine_toast',
        condition: {
          flag: 'chk_portwine_delivery_done',
          missingFlag: 'chk_portwine_toast_shared',
        },
      },
      {
        text: 'Отдать струну Элис',
        next: 'chk_guitar_return_elis',
        condition: {
          flag: 'chk_guitar_string_taken',
          missingFlag: 'chk_guitar_string_returned',
        },
      },
      {
        text: 'Слушать аккорд Элис',
        next: 'chk_guitar_blind_song',
        condition: {
          flag: 'chk_guitar_string_returned',
          missingFlag: 'chk_guitar_song_heard',
        },
      },
      {
        text: 'Собрать комплект струн для Ритки',
        next: 'pier_ritka_elis_pack',
        condition: {
          flag: 'pier_ritka_get_strings_done',
          missingFlag: 'pier_ritka_elis_pack_ready',
        },
      },
    );
  }

  if (def.hubId === 'cafe_explore_mode') {
    choices.push(
      {
        text: 'Записи о Виктории — дочитать нить',
        next: 'act3_maria_mystery',
        condition: {
          flag: 'maria_truth_started',
          missingFlag: 'found_maria_records',
        },
      },
      {
        text: 'Правда Виктории — потребовать ответ',
        next: 'act3_maria_revelation',
        condition: {
          flag: 'found_maria_records',
          missingFlag: 'maria_truth_revealed',
        },
      },
      {
        text: 'Сесть на поэтическое чтение под прикрытием',
        next: 'poem_undercover_infiltrate',
        condition: { flag: 'spotted_network_reading', missingFlag: 'infiltrated_poetry_reading' },
      },
      {
        text: 'Опознать агентов на чтении',
        next: 'poem_undercover_identify',
        condition: { flag: 'infiltrated_poetry_reading', missingFlag: 'identified_network_agents' },
      },
      {
        text: 'Вытянуть разведданные с чтения',
        next: 'poem_undercover_extract',
        condition: { flag: 'identified_network_agents', missingFlag: 'extracted_network_intel' },
      },
      {
        text: 'Свести улики по кроту Сети',
        next: 'blind_spot_approach',
        condition: { flag: 'blind_spot_active', missingFlag: 'mole_identified' },
      },
      {
        text: 'Терминал в подсобке — живой код 2028',
        next: 'old_code',
        condition: {
          flag: 'cafe_safehouse_established',
          missingFlag: 'found_living_code',
        },
      },
      {
        text: 'Расшифровать живой код на терминале',
        next: 'old_code_read',
        condition: {
          flag: 'found_living_code',
          missingFlag: 'decoded_poetic_code',
        },
      },
      {
        text: 'План проникновения — с сопротивлением',
        next: 'act6_data_heist_planning',
        condition: {
          flag: 'three_defectors_recruited',
          missingFlag: 'act6_heist_planned',
        },
      },
      {
        text: 'Собрать уцелевших — новый устав гильдии',
        next: 'act7_guild_rebuilding',
        condition: {
          flag: 'rooftop_confrontation_done',
          missingFlag: 'new_council_elected',
        },
      },
      {
        text: 'Совет восстановлен — ударный отряд',
        next: 'act7_guild_restored',
        condition: {
          flag: 'guild_restored',
          missingFlag: 'path_to_core_cleared',
        },
      },
    );
  }

  if (def.hubId === 'street_winter_explore_mode') {
    choices.push(
      {
        text: 'Помочь ребёнку у фонаря',
        next: 'night_watch_child',
        condition: { flag: 'spotted_mugger_alley', missingFlag: 'found_lost_child' },
      },
      {
        text: 'Встретить Сергея у ларька',
        next: 'night_watch_friend',
        condition: { flag: 'found_lost_child', missingFlag: 'met_old_friend_night' },
      },
    );
  }

  if (def.hubId === 'home_evening_explore_mode') {
    choices.push(
      {
        text: 'Решить судьбу украденных денег с Заремой',
        next: 'bank_transfer_moral',
        condition: { flag: 'identified_bank_culprit', missingFlag: 'bank_moral_choice_made' },
      },
      {
        text: 'Подтвердить восстановление banking-daemon',
        next: 'banking_crash_verify',
        condition: { flag: 'bash_terminal_solved', missingFlag: 'banking_system_recovered' },
      },
    );
  }

  if (def.hubId === 'rooftop_explore_mode') {
    choices.push(
      {
        text: 'Подойти к Александру на краю',
        next: 'roof_of_the_world_approach',
        condition: { flag: 'rooftop_unlocked', missingFlag: 'confronted_alexander_roof' },
      },
      {
        text: 'Финальный выбор на краю — слово, сила или стих',
        next: 'roof_of_the_world_ending',
        condition: { flag: 'confronted_alexander_roof', missingFlag: 'roof_ending_chosen' },
      },
      {
        text: 'Сесть писать последнее стихотворение',
        next: 'last_poem_approach',
        condition: { flag: 'all_poems_collected', missingFlag: 'poem_composed' },
      },
      {
        text: 'Продекламировать готовое стихотворение',
        next: 'last_poem_recite',
        condition: { flag: 'poem_composed', missingFlag: 'final_poem_recited' },
      },
      {
        text: 'Прочитать финальный стих на краю',
        next: 'act7_rooftop_recital',
        condition: {
          flag: 'final_poem_written',
          missingFlag: 'final_poem_published',
        },
      },
    );
  }

  if (def.hubId === 'factory_roof_explore_mode') {
    choices.push(
      {
        text: 'Тень на краю — финальная встреча',
        next: 'act6_rooftop_showdown',
        condition: {
          flag: 'nadzor_guardian_defeated',
          missingFlag: 'rooftop_entity_met',
        },
      },
      {
        text: 'Выбор на крыше — хранитель или освободитель',
        next: 'act6_final_confrontation',
        condition: {
          flag: 'rooftop_entity_met',
          missingFlag: 'act6_final_choice_made',
        },
      },
    );
  }

  if (def.hubId === 'library_explore_mode') {
    choices.push(
      {
        text: 'Архив забытых стихов — спросить Алину',
        next: 'archive_forgotten_meet',
        condition: { missingFlag: 'archive_of_forgotten_active' },
        effects: [{ type: 'triggerQuest', questId: 'archive_of_forgotten' }],
      },
      {
        text: 'Тайный архив — к люку с замком',
        next: 'archive_forgotten_approach',
        condition: {
          flag: 'archive_of_forgotten_active',
          missingFlag: 'archive_vault_accessed',
        },
      },
      {
        text: 'Сохранить стихи из тайного архива',
        next: 'archive_forgotten_save',
        condition: {
          flag: 'archive_vault_accessed',
          missingFlag: 'archive_poems_saved',
        },
      },
      {
        text: 'Помочь Кате — утерянный архив в Фонде',
        next: 'library_lost_archive_start',
        condition: { missingFlag: 'library_lost_archive_active' },
        effects: [{ type: 'triggerQuest', questId: 'library_lost_archive' }],
      },
      {
        text: 'Спуститься в подвал — ключ уже в кармане',
        next: 'library_archive_descent',
        condition: {
          flag: 'library_archive_key_found',
          missingFlag: 'library_lost_archive_done',
        },
        effects: [{ type: 'transitionScene', sceneId: 'library_basement' }],
      },
      {
        text: 'Сесть к схеме Кати — исследование поэтов',
        next: 'library_katya_research_start',
        condition: { missingFlag: 'library_katya_research_active' },
        effects: [{ type: 'triggerQuest', questId: 'library_katya_research' }],
      },
      {
        text: 'Продолжить схему — кросс-сверка с прошивкой',
        next: 'library_katya_crossref',
        condition: {
          flag: 'library_katya_schema_open',
          missingFlag: 'library_katya_firmware_cross',
        },
      },
      {
        text: 'Ночная смена у схемы — дожать узел',
        next: 'library_katya_night',
        condition: {
          flag: 'library_katya_firmware_cross',
          missingFlag: 'library_katya_night_pass',
        },
      },
      {
        text: 'Открыть публичный архив — Катя ждёт',
        next: 'act7_library_archive',
        condition: {
          flag: 'new_council_elected',
          missingFlag: 'guild_restored',
        },
      },
    );
  }

  if (def.hubId === 'library_basement_explore_mode') {
    choices.push(
      {
        text: 'Вставить ключ в механическую скважину',
        next: 'library_archive_gate',
        condition: {
          flag: 'library_basement_entered',
          missingFlag: 'library_archive_gate_open',
        },
      },
      {
        text: 'Открыть нижний ряд коробок «УТИЛЬ»',
        next: 'library_lost_archive_found',
        condition: {
          flag: 'library_archive_gate_open',
          missingFlag: 'library_archive_recovered',
        },
      },
      {
        text: 'Оцифровать архив тайно с Катей',
        next: 'library_archive_digitize',
        condition: {
          flag: 'library_archive_recovered',
          missingFlag: 'library_lost_archive_done',
        },
      },
      {
        text: 'Терминал мигает — след Марата',
        next: 'library_marat_echo',
        condition: {
          flag: 'marat_trace_found',
          missingFlag: 'marat_echo_answered',
        },
      },
    );
  }

  if (def.hubId === 'pier_evening_explore_mode') {
    choices.push(
      {
        text: 'Сесть с Трофимом — ночная рыбалка',
        next: 'pier_midnight_fishing_start',
        condition: { missingFlag: 'pier_midnight_fishing_done' },
        effects: [{ type: 'triggerQuest', questId: 'pier_midnight_fishing' }],
      },
      {
        text: 'Прислушаться к гулу под сваей',
        next: 'pier_midnight_fishing_bass',
        condition: {
          flag: 'pier_fishing_seated',
          missingFlag: 'pier_factory_bass_heard',
        },
      },
      {
        text: 'Спросить Ритку про струны',
        next: 'pier_ritka_strings_start',
        condition: { missingFlag: 'pier_ritka_strings_active' },
        effects: [{ type: 'triggerQuest', questId: 'pier_ritka_strings' }],
      },
      {
        text: 'Отдать комплект струн Ритке',
        next: 'pier_ritka_strings_delivered',
        condition: {
          flag: 'pier_ritka_elis_pack_ready',
          missingFlag: 'pier_ritka_strings_done',
        },
      },
    );
  }

  choices.push({ text: 'Свободно исследовать', next: def.hubId });

  return {
    id: def.hubId,
    text: def.hubText ?? '',
    hubIntroText: def.hubText,
    hubRevisitText: def.hubTextRevisit,
    speaker: 'narrator',
    sceneId: def.sceneId,
    choices,
  };
}

/** Explore-hub story nodes for scenes beyond act 1. */
export const STORY_NODES_SCENE_EXPLORE_HUBS: Record<string, StoryNode> = Object.fromEntries(
  SCENE_EXPLORE_HUB_DEFS
    .filter(
      (def) => !ACT1_HUB_IDS.has(def.hubId) && !ACT_PACK_DEFINED_HUB_IDS.has(def.hubId),
    )
    .map((def) => [def.hubId, buildSceneExploreHubNode(def)]),
);
