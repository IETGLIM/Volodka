import type { StoryNode } from '@/shared/types/game';

/** Стартовые ноды для QUESTS_PHASE5_SIDE — минимальные точки входа. */
export const STORY_NODES_PHASE5_QUESTS: Record<string, StoryNode> = {
  quest_act2_server_poem_hunt_start: {
    id: 'quest_act2_server_poem_hunt_start',
    text: 'Три сервера города шепчут одни и те же строки в логах ошибок. Гильдейский автоскрипт уже запущен — у тебя мало времени, чтобы снять фрагменты до затирания.',
    speaker: 'narrator',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Начать охоту на серверные стихи',
        next: 'office_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act2_server_poem_hunt_active', flagValue: true }],
      },
    ],
  },
  quest_act2_chk_neon_archive_start: {
    id: 'quest_act2_chk_neon_archive_start',
    text: 'Басед кивает на вывеску «Синяя яма»: под неоном спрятан архив, который гильдия списала. Нужно добраться до скрытого хранилища через биллиардный интерфейс.',
    speaker: 'Басед',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Искать неоновый архив',
        next: 'chk_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act2_chk_neon_archive_active', flagValue: true }],
      },
    ],
  },
  quest_act3_park_cyber_bloom_start: {
    id: 'quest_act3_park_cyber_bloom_start',
    text: 'Кибер-цветы в парке раскрываются только рядом с живым голосом, читающим строки. Три узла ждут стиха.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Искать цветочные узлы',
        next: 'park_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act3_park_cyber_bloom_active', flagValue: true }],
      },
    ],
  },
  quest_act3_zarema_evidence_run_start: {
    id: 'quest_act3_zarema_evidence_run_start',
    text: 'Зарема сжимает пакет свидетельств. Гильдия уже стёрла два узла — третий в подвале библиотеки под охраной.',
    speaker: 'Зарема',
    sceneId: 'library_day',
    choices: [
      {
        text: 'Провести Зарему в подвал',
        next: 'library_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act3_zarema_evidence_run_active', flagValue: true }],
      },
    ],
  },
  quest_act4_rooftop_broadcast_setup_start: {
    id: 'quest_act4_rooftop_broadcast_setup_start',
    text: 'Александр указывает на крышу заброшенного блока: старая радиомачта ещё жива. Если перепаять схему — стихи пойдут в эфир.',
    speaker: 'Александр',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Подняться на крышу',
        next: 'rooftop_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act4_rooftop_broadcast_setup_active', flagValue: true }],
      },
    ],
  },
  quest_act4_street_samizdat_start: {
    id: 'quest_act4_street_samizdat_start',
    text: 'Комендантский час. Под снегом — три точки, куда можно положить самиздат, пока сканеры слепы.',
    speaker: 'narrator',
    sceneId: 'street_night',
    choices: [
      {
        text: 'Разложить листки',
        next: 'street_bench_view',
        effects: [{ type: 'setFlag', flag: 'quest_act4_street_samizdat_active', flagValue: true }],
      },
    ],
  },
  quest_act5_factory_zarya_memory_restore_start: {
    id: 'quest_act5_factory_zarya_memory_restore_start',
    text: '«Заря-М» молчит — три образа памяти рассеялись по leaking-потоку. Баба Зина ждёт у паяльной станции.',
    speaker: 'Баба Зина',
    sceneId: 'abandoned_factory',
    choices: [
      {
        text: 'Восстанавливать образы',
        next: 'factory_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act5_factory_zarya_memory_restore_active', flagValue: true }],
      },
    ],
  },
  quest_act5_bunker_code_poem_break_start: {
    id: 'quest_act5_bunker_code_poem_break_start',
    text: 'Архив «Солныш» зашифрован не числом, а строкой. Максим ждёт в бункере — нужен стих-ключ из leaking-потока.',
    speaker: 'Максим',
    sceneId: 'factory_basement',
    choices: [
      {
        text: 'Искать стих-ключ',
        next: 'basement_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act5_bunker_code_poem_break_active', flagValue: true }],
      },
    ],
  },
  quest_act6_defector_rescue_expanded_start: {
    id: 'quest_act6_defector_rescue_expanded_start',
    text: 'Инженер гильдии схвачен на КПП. Максим шепчет маршрут через коллектор — два часа до цифрового стирания.',
    speaker: 'Максим',
    sceneId: 'underground_bunker',
    choices: [
      {
        text: 'Идти через коллектор',
        next: 'bunker_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act6_defector_rescue_expanded_active', flagValue: true }],
      },
    ],
  },
  quest_act7_poets_monument_inscription_start: {
    id: 'quest_act7_poets_monument_inscription_start',
    text: 'Обелиск в парке восстановлен, но имена стёрты. Ты знаешь эти имена — каждый стих в leaking-потоке был подписан.',
    speaker: 'narrator',
    sceneId: 'park_day',
    choices: [
      {
        text: 'Дописать имена на камне',
        next: 'park_explore_mode',
        effects: [{ type: 'setFlag', flag: 'quest_act7_poets_monument_inscription_active', flagValue: true }],
      },
    ],
  },
};
