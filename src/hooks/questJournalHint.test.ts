import { describe, expect, it, vi } from 'vitest';
import {
  buildQuestJournalContextualHint,
  buildQuestJournalRouteCta,
} from '@/hooks/questJournalHint';

vi.mock('@/engine/guidedStory/firstReadingHint', () => ({
  getFirstReadingHint: () => 'Подойди к рабочему столу и нажми [E]',
}));

vi.mock('@/engine/guidedStory/act1QuestHints', () => ({
  getMariaConnectionHint: () => 'Выйди на ночную улицу — Виктория сама тебя найдёт',
  getCafeStreetWhisperHint: () => 'Спроси баристу про ночных гостей у стойки [E]',
  getChipCafeClearanceHint: () => 'Вернись в «Синюю яму» со стихом чипа — бариста услышит эхо',
  getOfficeLobbyWatchHint: () => 'Зайди в холл офиса — у серверной стены чип отзовётся',
  getNightCityCallHint: () => 'Открой дверь в коридор [E] — город уже зовёт',
  getIncidentScrollHint: () => 'Иди в офис IT-гильдии — Александр ждёт у инцидента #4729',
  getCodePoemAftermathHint: () => 'Дочитай стих на терминале инцидента — строки уже проступают',
  getFridaySpleenHint: () => 'Зайди в «Синюю яму» к Альберту — он знает мост к Сети',
  getPoetryCollectionHint: () => 'Следующий стих: Рабочий стол',
  getVaultBackupTrialHint: () => 'Вернись в офис IT-гильдии — коллега знает про Хранилище',
  getNetworkInitiationHint: () => 'Виктория ждёт для посвящения — ищи её на улице или в кафе',
  getSolnyshSpineHint: () => 'Солныш в коридоре или в своей комнате — найди её и поговори',
}));

vi.mock('@/engine/guidedStory/act1SideQuestHints', () => ({
  getNightShiftMysteryHint: () => 'Ночные серверы гильдии — зайди в офис после заката',
  getAlbertsLessonHint: () => 'Альберт в «Синей яме» — код и стих одним языком',
  getCorridorLetterHint: () => 'Конверт без адреса — проверь ящики в коридоре',
  getZaremaRadioHint: () => 'Зарема слышит голос в статике — зайди домой',
  getMorningRitualHint: () => 'Утренний обход начинается с комнаты — терминал',
  getCafeBackroomEchoHint: () => 'Подсобка «Синей ямы» — зайди в кафе',
  getMorningSyncHint: () => 'Срочная оперативка — подойди к терминалу',
}));

vi.mock('@/engine/guidedStory/chkTolpaQuestHints', () => ({
  getTolpaWhisperHint: () => 'В офисе шепчутся о ЧК на Зорге — зайди к коллегам',
  getTolpaFirstFireHint: () => 'Из парка — тропа на север к костру ЧК, когда стемнеет',
  getTolpaPortwineOathHint: () => 'Клятва портвейна — Басед у костра ЧК',
  getTolpaQuantumFireHint: () => 'Смерть читает лекцию у костра ЧК',
  getTolpaForestGuideHint: () => 'Сталкер патрулирует опушку ЧК',
  getTolpaGuitarNightHint: () => 'Элис поёт у костра ЧК — иди в лес',
  getTolpaBondHint: () => 'Заверши ритуалы ЧК — стань членом ТОЛПА',
  getTolpaPoemFireHint: () => 'Вернись к костру после песни — стих ЧК',
  getTolpaAct3SanctuaryHint: () => 'После удара по Хранилищу — сходи к Ру в лес',
  getTolpaAct4ExfiltrationHint: () => 'Перед штурмом — маршрут Сталкера в ЧК',
  getTolpaAct4ServerHeistHint: () => 'Ру предложил саботаж — дата-центр гильдии',
}));

vi.mock('@/engine/guidedStory/act23QuestHints', () => ({
  getCafeSafehouseHint: () => 'Иди в кафе «Синяя яма» — бариста может дать явочную',
  getDmitryDefectionHint: () => 'Дмитрий в офисе гильдии — время ограничено, иди туда',
  getBasementHumHint: () => 'Ключ Трофима открывает подвал «Хрома-М» — иди на завод',
  getZaremaRescueHint: () => 'Блок задержания в гильдии — стих «Прорыв» открывает путь',
  getMariaTruthHint: () => 'Бариста в «Синей яме» знает больше, чем кажется',
  getVaultKeyFragmentsHint: () => 'Фрагмент гильдии — в офисе IT. Иди туда',
  getPoetrySmugglingHint: () => 'Стихи ждут в библиотеке — зайди тихо',
  getPierWatchmanKeyHint: () => 'Трофим на пирсе №3 — иди к воде',
  getVaultDefenseHint: () => 'Без фаервола Хранилище обречено — установи защиту',
  getThreadOf18LinesHint: () => 'Мемориал в парке — след Великого Сбоя 2029',
}));

vi.mock('@/engine/guidedStory/act4QuestHints', () => ({
  getGuildInfiltrationHint: () => 'Пропуск гильдии — ищи в офисе IT',
  getPoetryBroadcastHint: () => 'Выход на крышу — к передающей башне',
  getRoofOfTheWorldHint: () => 'Доберись до крыши — место финальной встречи',
  getLastPoemHint: () => 'Найди тихое место на краю крыши',
  getBlindSpotHint: () => 'Логи гильдии у Сергея — иди в офис',
  getArchiveOfForgottenHint: () => 'Алина знает пароль архива — ищи её в библиотеке',
  getDigitalGhostHint: () => 'Лена знает про следы удалённого ИИ — найди её',
  getVoicesOfFactoryHint: () => 'Заброшенный завод «Хром-М» — Дмитрий знает дорогу',
  getSecretsOfOldCodeHint: () => 'Живой код 2028 — терминал в подсобке кафе',
  getBankingCrashHint: () => 'Получи доступ к Bash-терминалу банковской системы',
  getBankTransferHint: () => 'Зарема дома — на её ноутбуке странный перевод',
  getNightWatchHint: () => 'Выйди на ночное патрулирование зимней улицы',
  getPoemUndercoverHint: () => 'Поэтический вечер в кафе — прикрытие для Сети',
  getBrokenTerminalHint: () => 'Три сломанных терминала в офисе гильдии',
  getVoiceOfThePastHint: () => 'Записи голоса Владимира — на заброшенной фабрике',
  getOpenstackCrisisHint: () => 'Терминал OpenStack в офисе гильдии',
}));

vi.mock('@/engine/guidedStory/aaaSideQuestHints', () => ({
  getPierMidnightFishingHint: () => 'Найди Трофима на вечернем пирсе',
  getPierRitkaStringsHint: () => 'Запасная струна в ЧК у Элис',
  getLibraryLostArchiveHint: () => 'Поговори с Катей в библиотеке, затем спустись в подвал',
  getLibraryKatyaResearchHint: () => 'Катя ждёт в библиотеке — нужна ночь на исследование',
  getFactoryZaryaMemoryHint: () => 'Найди Бабу Зину на заводе — память «Зари-М»',
  getFactoryBabaZinaTeaHint: () => 'Загляни к Бабе Зине в цех — просто чай и истории',
  getResistanceSafehouseHint: () => 'Найди бункер через контакт Жеки — убежище Сопротивления',
  getResistanceDefectorRescueHint: () => 'Максим ждёт в бункере — через два часа стирание',
  getChkPortwineDeliveryHint: () => 'Поговори с Баседом в ЧК — портвейн из «Синей ямы»',
  getChkGuitarStringsHint: () => 'Элис у костра в ЧК — струна E в офисе гильдии',
}));

vi.mock('@/engine/guidedStory/phase5SideQuestHints', () => ({
  getServerPoemHuntHint: () => 'Серверные стихи — начни с логов в офисе гильдии',
  getChkNeonArchiveHint: () => 'Басед у ночного костра в ЧК — поговори, затем ищи вывеску',
  getParkCyberBloomHint: () => 'Парк днём — три кибер-цветка ждут твоего голоса',
  getZaremaEvidenceRunHint: () => 'Встреть Зарему у библиотеки — нужно провести её в подвал',
  getRooftopBroadcastSetupHint: () => 'Крыша блока 4-Б — Александр указал путь',
  getStreetSamizdatHint: () => 'Первая точка самиздата — пирс',
  getZaryaMemoryRestoreHint: () => 'Баба Зина в цеху — начни восстановление памяти «Зари-М»',
  getBunkerCodePoemBreakHint: () => 'Бункер — там терминал шифра «Солныш»',
  getDefectorRescueExpandedHint: () => 'Максим в бункере — маршрут через коллектор под КПП',
  getPoetsMonumentInscriptionHint: () => 'Парк — обелиск ждёт имён тех, кого помнишь',
}));

vi.mock('@/engine/guidedStory/act5QuestHints', () => ({
  getFinalCodeHint: () => 'Собери всех союзников перед операцией «Занавес»',
  getMachineConfessionHint: () => 'Вернись на заброшенный завод «Хром-М» ночью',
  getEchoOfVladimirHint: () => 'Катя знает о тайнике — ищи её в библиотеке',
  getNightBeforeDawnHint: () => 'Алберт должен подтвердить сторону — найди его',
}));

vi.mock('@/engine/guidedStory/act6QuestHints', () => ({
  getTraitorInTheGuildHint: () => 'Секретные логи на заброшенной фабрике — начни там',
  getUndergroundResistanceHint: () => 'Ночные улицы — там собираются те, кто не хочет быть найденным',
  getDataHeistHint: () => 'Офис гильдии ночью — время проникновения',
  getAct6SecretArchiveHint: () => 'Секретный архив под заброшенной фабрикой',
  getSystemInfiltrationHint: () => 'Ядро «Надзора» на заброшенной фабрике — начни там',
  getRooftopConfrontationHint: () => 'Поднимись на крышу для финальной встречи',
}));

vi.mock('@/engine/guidedStory/act7QuestHints', () => ({
  getRebuildTheGuildHint: () => 'Кафе — там собираются те, кто готов строить новое',
  getSystemTakedownHint: () => 'Собери отряд с Максимом перед штурмом ядра',
  getFinalPoemHint: () => 'Парк днём — единственное место услышать себя',
  getVolodkaLegacyHint: () => 'Вернись в свою комнату — где всё началось',
  getEpilogueLettersHint: () => 'Вернись в комнату после финала — там письма',
  getEpilogueMonumentHint: () => 'Парк — у обелиска без гильдейской таблички',
}));

vi.mock('@/store/questStore', () => ({
  getNextTrackedObjective: (questId: string) =>
    questId === 'side_demo'
      ? { objectiveId: 'o1', description: 'Поговори с Катей' }
      : null,
  getQuestMarker: (questId: string) =>
    questId === 'side_demo' || questId === 'maria_connection'
      ? { sceneId: 'library_day' as const, position: [0, 0, 0] as [number, number, number] }
      : null,
}));

vi.mock('@/config/scenes', () => ({
  getSceneConfig: (id: string) => ({ id, name: id === 'library_day' ? 'Библиотека' : id }),
}));

describe('buildQuestJournalContextualHint', () => {
  it('prefers first_reading live cue', () => {
    expect(buildQuestJournalContextualHint('first_reading', 'volodka_room')).toBe(
      'Подойди к рабочему столу и нажми [E]',
    );
  });

  it('prefers maria_connection live cue', () => {
    expect(buildQuestJournalContextualHint('maria_connection', 'volodka_room')).toContain(
      'Виктория',
    );
  });

  it('prefers incident_scroll live cue', () => {
    expect(buildQuestJournalContextualHint('incident_scroll_4729', 'street_night')).toContain(
      'офис',
    );
  });

  it('prefers code_poem_aftermath live cue', () => {
    expect(buildQuestJournalContextualHint('code_poem_aftermath', 'office_day')).toContain('стих');
  });

  it('prefers friday_spleen live cue', () => {
    expect(buildQuestJournalContextualHint('friday_spleen', 'volodka_room')).toContain('Альберту');
  });

  it('prefers poetry_collection live cue', () => {
    expect(buildQuestJournalContextualHint('poetry_collection', 'volodka_room')).toContain(
      'стих',
    );
  });

  it('prefers vault_backup_trial live cue', () => {
    expect(buildQuestJournalContextualHint('vault_backup_trial', 'street_night')).toContain(
      'Хранилище',
    );
  });

  it('prefers network_initiation live cue', () => {
    expect(buildQuestJournalContextualHint('network_initiation', 'volodka_room')).toContain(
      'Виктория',
    );
  });

  it('prefers solnysh spine live cue', () => {
    expect(buildQuestJournalContextualHint('solnysh_comfort', 'street_night')).toContain(
      'Солныш',
    );
  });

  it('prefers cafe_safehouse live cue', () => {
    expect(buildQuestJournalContextualHint('cafe_safehouse', 'street_night')).toContain('явочную');
  });

  it('prefers dmitry_defection live cue', () => {
    expect(buildQuestJournalContextualHint('dmitry_defection', 'volodka_room')).toContain('Дмитрий');
  });

  it('prefers basement_hum live cue', () => {
    expect(buildQuestJournalContextualHint('basement_hum', 'street_night')).toContain('завод');
  });

  it('prefers zarema_rescue live cue', () => {
    expect(buildQuestJournalContextualHint('zarema_rescue', 'street_night')).toContain('Прорыв');
  });

  it('prefers maria_truth live cue', () => {
    expect(buildQuestJournalContextualHint('maria_truth', 'volodka_room')).toContain('яме');
  });

  it('prefers vault_key_fragments live cue', () => {
    expect(buildQuestJournalContextualHint('vault_key_fragments', 'street_night')).toContain('офис');
  });

  it('prefers poetry_smuggling live cue', () => {
    expect(buildQuestJournalContextualHint('poetry_smuggling', 'street_night')).toContain('библиотек');
  });

  it('prefers pier_watchman_key live cue', () => {
    expect(buildQuestJournalContextualHint('pier_watchman_key', 'street_night')).toContain('пирс');
  });

  it('prefers vault_defense live cue', () => {
    expect(buildQuestJournalContextualHint('vault_defense', 'street_night')).toContain('фаервол');
  });

  it('prefers thread_of_18_lines live cue', () => {
    expect(buildQuestJournalContextualHint('thread_of_18_lines', 'street_night')).toContain('парке');
  });

  it('prefers guild_infiltration live cue', () => {
    expect(buildQuestJournalContextualHint('guild_infiltration', 'street_night')).toContain('офисе');
  });

  it('prefers poetry_broadcast live cue', () => {
    expect(buildQuestJournalContextualHint('poetry_broadcast', 'street_night')).toContain('крышу');
  });

  it('prefers roof_of_the_world live cue', () => {
    expect(buildQuestJournalContextualHint('roof_of_the_world', 'street_night')).toContain('крыши');
  });

  it('prefers last_poem live cue', () => {
    expect(buildQuestJournalContextualHint('last_poem', 'street_night')).toContain('крыши');
  });

  it('prefers blind_spot live cue', () => {
    expect(buildQuestJournalContextualHint('blind_spot', 'street_night')).toContain('офис');
  });

  it('prefers final_code live cue', () => {
    expect(buildQuestJournalContextualHint('final_code', 'street_night')).toContain('союзник');
  });

  it('prefers machine_confession live cue', () => {
    expect(buildQuestJournalContextualHint('machine_confession', 'street_night')).toContain('завод');
  });

  it('prefers echo_of_vladimir live cue', () => {
    expect(buildQuestJournalContextualHint('echo_of_vladimir', 'street_night')).toContain('Катя');
  });

  it('prefers night_before_dawn live cue', () => {
    expect(buildQuestJournalContextualHint('night_before_dawn', 'street_night')).toContain('Алберт');
  });

  it('prefers archive_of_forgotten live cue', () => {
    expect(buildQuestJournalContextualHint('archive_of_forgotten', 'street_night')).toContain('архив');
  });

  it('prefers traitor_in_the_guild live cue', () => {
    expect(buildQuestJournalContextualHint('traitor_in_the_guild', 'street_night')).toContain('фабрик');
  });

  it('prefers underground_resistance live cue', () => {
    expect(buildQuestJournalContextualHint('underground_resistance', 'volodka_room')).toContain('улиц');
  });

  it('prefers data_heist live cue', () => {
    expect(buildQuestJournalContextualHint('data_heist', 'street_night')).toMatch(/офис/i);
  });

  it('prefers act6_secret_archive live cue', () => {
    expect(buildQuestJournalContextualHint('act6_secret_archive', 'street_night')).toContain('архив');
  });

  it('prefers rooftop_confrontation live cue', () => {
    expect(buildQuestJournalContextualHint('rooftop_confrontation', 'street_night')).toContain('крыш');
  });

  it('prefers system_infiltration live cue', () => {
    expect(buildQuestJournalContextualHint('system_infiltration', 'street_night')).toContain('Надзор');
  });

  it('prefers rebuild_the_guild live cue', () => {
    expect(buildQuestJournalContextualHint('rebuild_the_guild', 'street_night')).toContain('Кафе');
  });

  it('prefers system_takedown live cue', () => {
    expect(buildQuestJournalContextualHint('system_takedown', 'volodka_room')).toContain('Максим');
  });

  it('prefers final_poem live cue', () => {
    expect(buildQuestJournalContextualHint('final_poem', 'street_night')).toContain('Парк');
  });

  it('prefers volodka_legacy live cue', () => {
    expect(buildQuestJournalContextualHint('volodka_legacy', 'street_night')).toContain('комнат');
  });

  it('prefers epilogue_letters live cue', () => {
    expect(buildQuestJournalContextualHint('epilogue_letters', 'park_day')).toContain('комнат');
  });

  it('prefers epilogue_monument live cue', () => {
    expect(buildQuestJournalContextualHint('epilogue_monument', 'volodka_room')).toContain('Парк');
  });

  it('prefers act1 side live cues', () => {
    expect(buildQuestJournalContextualHint('corridor_letter', 'volodka_room')).toContain('коридор');
    expect(buildQuestJournalContextualHint('night_shift_mystery', 'volodka_room')).toContain('офис');
    expect(buildQuestJournalContextualHint('alberts_lesson', 'street_night')).toContain('яме');
  });

  it('prefers CHK Tolpa live cues', () => {
    expect(buildQuestJournalContextualHint('tolpa_whisper', 'volodka_room')).toContain('ЧК');
    expect(buildQuestJournalContextualHint('tolpa_first_fire', 'park_day')).toContain('костру');
  });

  it('prefers act4 side live cues', () => {
    expect(buildQuestJournalContextualHint('digital_ghost', 'street_night')).toContain('Лена');
    expect(buildQuestJournalContextualHint('voices_of_factory', 'volodka_room')).toContain('Хром');
    expect(buildQuestJournalContextualHint('secrets_of_old_code', 'street_night')).toContain('подсобке');
    expect(buildQuestJournalContextualHint('banking_crash', 'home_evening')).toContain('Bash');
    expect(buildQuestJournalContextualHint('bank_transfer', 'street_night')).toContain('Зарема');
    expect(buildQuestJournalContextualHint('openstack_crisis', 'street_night')).toContain('OpenStack');
  });

  it('prefers AAA + phase5 expansion live cues', () => {
    expect(buildQuestJournalContextualHint('pier_midnight_fishing', 'street_night')).toContain('Трофим');
    expect(buildQuestJournalContextualHint('library_lost_archive', 'street_night')).toContain('Катей');
    expect(buildQuestJournalContextualHint('quest_act2_server_poem_hunt', 'volodka_room')).toContain(
      'офисе',
    );
    expect(buildQuestJournalContextualHint('quest_act7_poets_monument_inscription', 'volodka_room')).toContain(
      'Парк',
    );
  });

  it('combines next objective with travel direction', () => {
    const hint = buildQuestJournalContextualHint('side_demo', 'volodka_room');
    expect(hint).toContain('Поговори с Катей');
    expect(hint).toMatch(/Перейдите:/);
  });
});

describe('buildQuestJournalRouteCta', () => {
  it('returns route CTA when marker is off-scene', () => {
    expect(buildQuestJournalRouteCta('side_demo', 'volodka_room')).toBe('Маршрут → Библиотека');
  });

  it('returns null when already on marker scene', () => {
    expect(buildQuestJournalRouteCta('side_demo', 'library_day')).toBeNull();
  });
});
