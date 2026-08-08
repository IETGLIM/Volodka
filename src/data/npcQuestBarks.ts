/**
 * Curated proximity barks for active side quests — especially lines that
 * stay relevant through acts 6–7 (pier/basement thread, machine confession, etc.).
 */
export interface NpcQuestBarkEntry {
  questId: string;
  /** When set, bark only while this objective is still incomplete. */
  objectiveId?: string;
  text: string;
}

export const NPC_QUEST_BARKS: Record<string, NpcQuestBarkEntry[]> = {
  office_colleague: [
    {
      questId: 'office_lobby_watch',
      objectiveId: 'notice_colleague_watch',
      text: 'Не пялься на доску слишком долго. Александр не любит, когда в холле читают вслух.',
    },
    {
      questId: 'code_poem_aftermath',
      objectiveId: 'ask_colleague_politics',
      text: 'Псс. Стих на твоём экране уже увидели. Подойди — расскажу про то, чего нет в KPI.',
    },
    {
      questId: 'code_poem_aftermath',
      objectiveId: 'hear_vault_lead',
      text: 'Хранилище… тише. Старшие ходят туда по ночам. Я дам намёк, если камеры моргнут.',
    },
    {
      questId: 'act2_cafe_office_relay',
      objectiveId: 'deliver_office_envelope',
      text: 'Конверт от бариста? Быстро — камера моргнула.',
    },
    {
      questId: 'vault_backup_trial',
      objectiveId: 'learn_about_vault',
      text: 'Хранилище? Тише. Подойди к станциям — расскажу, когда камеры моргнут.',
    },
  ],
  office_alexander: [
    {
      questId: 'chip_cafe_clearance',
      objectiveId: 'reach_guild_lobby',
      text: 'Холл. Доска. Потом — мой кабинет. Инцидент #4729 не терпит коридорных сплетен.',
    },
    {
      questId: 'incident_scroll_4729',
      objectiveId: 'talk_alexander',
      text: 'Подойди. #4729 — не баг. В коде спрятаны стихи, и гильдия хочет их стереть.',
    },
    {
      questId: 'code_poem_aftermath',
      objectiveId: 'feel_guild_pressure',
      text: 'Аномалия задокументирована. Не распространять. KPI не любит поэзию в логах.',
    },
  ],
  albert: [
    {
      questId: 'friday_spleen',
      objectiveId: 'hear_albert_bridge',
      text: 'Садись. Ты вытащил ямб из продакшена — гильдия назовёт инцидентом. Я — дверью.',
    },
    {
      questId: 'alberts_lesson',
      objectiveId: 'talk_albert_lesson',
      text: 'Код и стих — один язык. Покажи, что видишь оба.',
    },
    {
      questId: 'act1_albert_alliance',
      objectiveId: 'deep_talk_albert',
      text: 'Мы год пьём этот кофе. Пора поговорить не о тикетах — о нас.',
    },
    {
      questId: 'act2_night_city_watch',
      text: 'Три кружка на салфетке — скамейка, пирс, костёр. Обойди и вернись.',
    },
    {
      questId: 'act2_archive_seven',
      objectiveId: 'find_archive_chip',
      text: 'Чип — ключ. Следы — в подвале ЧК, на стене кафе, в логах серверной.',
    },
  ],
  zarema: [
    {
      questId: 'first_reading',
      text: 'Стих пробуждения уже с тобой. Осмотри комнату — стол, полка или коридор подскажут, куда идти дальше.',
    },
    {
      questId: 'incident_scroll_4729',
      objectiveId: 'talk_alexander',
      text: 'Гильдия зовёт — но сначала выпей чаю. Голодный поэт код не взламывает.',
    },
    {
      questId: 'act2_street_chk_samizdat',
      objectiveId: 'receive_samizdat',
      text: 'Скамейка у фонаря. Не оглядывайся — пакет лёгкий, но гильдия его тяжёлым считает.',
    },
    {
      questId: 'act2_street_chk_samizdat',
      objectiveId: 'deliver_chk_samizdat',
      text: 'Костёр в ЧК. Басед ждёт. Ногами — VPN гильдия любит.',
    },
    {
      questId: 'act2_street_chk_samizdat',
      text: 'Пакет для костра. Ногами — VPN гильдия любит.',
    },
  ],
  fisherman_trofim: [
    {
      questId: 'pier_watchman_key',
      objectiveId: 'bring_portwine',
      text: 'Портвейн «777» — у костра на пирсе. Принеси бутылку — отдам ключ от подвала.',
    },
    {
      questId: 'pier_watchman_key',
      objectiveId: 'meet_trofim',
      text: 'Стою у перил — поплавок сторожим. Хочешь ключ от «Хрома-М»? Сначала поговорим.',
    },
    {
      questId: 'basement_hum',
      objectiveId: 'descend_basement',
      text: 'Ключ у тебя. Вниз — только слушай. Не трогай монолит, пока не поймёшь гул.',
    },
    {
      questId: 'thread_of_18_lines',
      objectiveId: 'trace_progress7',
      text: 'Третья нить — под полом. Гул «Прогресс-7» ты ещё не дослушал. Без него финал будет другим.',
    },
    {
      questId: 'machine_confession',
      text: 'Ключ от подвала — не пропуск. Это обещание слушать, а не ломать. «Заря-М» помнит, кто держал слово.',
    },
    {
      questId: 'act2_pier_cafe_frequency',
      text: 'Река гудит — запиши частоту. Бариста на стене ждёт те же цифры.',
    },
  ],
  maria: [
    {
      questId: 'maria_connection',
      objectiveId: 'meet_maria',
      text: 'Я здесь. В тени. Чип — не подарок. Это тест: услышишь ли стих между строк.',
    },
    {
      questId: 'maria_connection',
      objectiveId: 'accept_chip',
      text: 'Возьми чип. Гильдия боится слов сильнее вирусов.',
    },
    {
      questId: 'maria_connection',
      objectiveId: 'read_maria_poem',
      text: 'Прочитай. Потом — кафе. Там уже шепчут твоё имя.',
    },
    {
      questId: 'chip_cafe_clearance',
      objectiveId: 'return_cafe_with_chip',
      text: '«Синяя яма». Бариста услышит эхо. Офис подождёт — сначала стойка.',
    },
    {
      questId: 'cafe_street_whisper',
      objectiveId: 'spot_alley_silhouette',
      text: 'Бариста правильно сказал. Я ждала, пока город сам тебя приведёт.',
    },
    {
      questId: 'machine_confession',
      text: '«Заря-М» зовёт на завод. Ночью патрули реже — там она расскажет, что скрывала.',
    },
    {
      questId: 'secrets_of_old_code',
      objectiveId: 'share_with_network',
      text: 'Живой код из кафе — не шутка. Принеси расшифровку, Сеть должна это увидеть.',
    },
  ],
  office_dmitry: [
    {
      questId: 'voices_of_factory',
      objectiveId: 'reach_factory',
      text: '«Заря-М» пишет стихи в подвале «Хрома-М». Ночью туда безопаснее — я покажу дорогу.',
    },
    {
      questId: 'secrets_of_old_code',
      objectiveId: 'find_more_code_files',
      text: 'Файлы «живого кода» тянутся к заводу. Там же, где гудит «Прогресс-7».',
    },
  ],
  sergey: [
    {
      questId: 'night_shift_mystery',
      objectiveId: 'investigate_server_logs',
      text: 'Логи ночной смены — у меня. Спроси, пока серверная не ушла в автономный режим.',
    },
    {
      questId: 'night_watch',
      objectiveId: 'patrol_street',
      text: 'Зимняя улица ночью — не для слабонервных. Обойди квартал, если готов к дозору.',
    },
    {
      questId: 'blind_spot',
      objectiveId: 'check_office_logs',
      text: 'Логи доступа к офису у меня. Спроси — покажу, кто ходил ночью, когда Сеть молчала.',
    },
  ],
  solnysh: [
    {
      questId: 'solnysh_comfort',
      objectiveId: 'comfort_solnysh',
      text: 'Мне сегодня тяжело… Если можешь — просто побудь рядом, Володька.',
    },
    {
      questId: 'solnysh_roof_wine',
      objectiveId: 'offer_wine',
      text: 'Если нашёл вино — я не против крыши. Только не дай мне разлить.',
    },
    {
      questId: 'solnysh_relocation',
      objectiveId: 'discuss_move',
      text: 'Лёня говорит о другой стране… Мне страшно. Но и хочется попробовать.',
    },
    {
      questId: 'archive_of_forgotten',
      objectiveId: 'meet_vera_library',
      text: 'Архив стихов ещё жив — но зачистка близко. Найди меня в библиотеке, пока дверь не заперли.',
    },
  ],
  lyonya: [
    {
      questId: 'solnysh_roof_wine',
      objectiveId: 'find_wine',
      text: 'Бутылку прятал за шкафом — на особый случай. Береги для Солныш.',
    },
    {
      questId: 'solnysh_relocation',
      text: 'Предложение за границей… Решать нам вместе. Твоё слово для неё много значит.',
    },
  ],
  lena: [
    {
      questId: 'digital_ghost',
      objectiveId: 'consult_lena',
      text: 'Сеть шепчет о призраке в логах. Я знаю, где искать — если ты готов слушать.',
    },
    {
      questId: 'secrets_of_old_code',
      objectiveId: 'share_with_lena',
      text: '«Живой код» из кафе — не шутка. Покажи расшифровку, я скажу, куда копать дальше.',
    },
  ],
  oleg: [
    {
      questId: 'blind_spot',
      objectiveId: 'confront_mole',
      text: 'Ты слишком близко подошёл к правде. В кафе поговорим — или уйдёшь с пустыми руками.',
    },
  ],
  kate: [
    {
      questId: 'poetry_collection',
      text: 'Стихи разбросаны по городу — в библиотеке, на столах, в тайниках. Собери все — правда сложится сама.',
    },
    {
      questId: 'poetry_smuggling',
      text: 'Запрещённые стихи лежат в тайнике за полкой. Гильдия патрулирует маршруты — иди окольно.',
    },
    {
      questId: 'echo_of_vladimir',
      objectiveId: 'find_kate_clue',
      text: 'Тайник Владимира в библиотеке — не на карте. Я покажу, если ты готов к последнему стиху.',
    },
  ],
  cafe_barista: [
    {
      questId: 'cafe_street_whisper',
      objectiveId: 'ask_barista_tip',
      text: 'Спроси про ночных гостей. Я не называю имён — только силуэты у подъезда.',
    },
    {
      questId: 'cafe_street_whisper',
      objectiveId: 'spot_alley_silhouette',
      text: 'Выйди. Переулок. Не смотри прямо — пусть город вас представит.',
    },
    {
      questId: 'chip_cafe_clearance',
      objectiveId: 'barista_hears_echo',
      text: 'Чип поёт. Закажи кофе — пальцы поймают частоту, и я дам пропуск.',
    },
    {
      questId: 'chip_cafe_clearance',
      objectiveId: 'receive_guild_summons',
      text: 'На пене — свиток. Это не напиток. Это дверь в холл гильдии.',
    },
    {
      questId: 'chip_cafe_clearance',
      objectiveId: 'reach_guild_lobby',
      text: 'Башня. Холл. Доска #4729. Чип на ресепшене не свети.',
    },
    {
      questId: 'night_city_call',
      objectiveId: 'feel_city_pulse',
      text: 'Улица сегодня громче. Скамейка или башня — город сам подскажет.',
    },
    {
      questId: 'act2_cafe_office_relay',
      text: 'Конверт для офиса. Только ногами — Slack читают.',
    },
    {
      questId: 'act2_pier_cafe_frequency',
      objectiveId: 'match_cafe_wall',
      text: 'Трофим прислал частоту? Сравни со стеной — jukebox замолкнет ровно на секунду.',
    },
    {
      questId: 'act2_cafe_office_relay',
      objectiveId: 'take_cafe_envelope',
      text: 'Конверт на стойке. Серверная, не KPI. Три минуты, пока камера моргает.',
    },
  ],
  chk_based: [
    {
      questId: 'act2_street_chk_samizdat',
      objectiveId: 'deliver_chk_samizdat',
      text: 'Пакет от Заремы? К костру — тише. Гильдия лес не сканирует, но люди — сканируют.',
    },
    {
      questId: 'act2_street_chk_samizdat',
      text: 'Самиздат принимаем у огня. Не называй имён — только ритм.',
    },
    {
      questId: 'act2_night_city_watch',
      text: 'Альберт просил проверить костёр? Огонь горит. Релей жив.',
    },
  ],
  chk_ru: [
    {
      questId: 'act2_night_city_watch',
      text: 'Ночной обход? Костёр в порядке. Металл играет тише, чем в офисе.',
    },
    {
      questId: 'act2_street_chk_samizdat',
      objectiveId: 'deliver_chk_samizdat',
      text: 'Зарема знает протокол. Отдай Баседу — он разберётся со стеной.',
    },
  ],
  chk_ritka: [
    {
      questId: 'act2_pier_cafe_frequency',
      objectiveId: 'hear_pier_frequency',
      text: 'Трофим слышит реку. Я слышу струны. Частота одна — просто инструменты разные.',
    },
    {
      questId: 'act2_night_city_watch',
      text: 'Пирс тихий. Поплавок сторожит. Обход можно отметить.',
    },
  ],
  /* ── WS15-C: quest barks for 6 key NPCs previously missing ── */
  boris: [
    {
      questId: 'voices_of_factory',
      objectiveId: 'reach_factory',
      text: 'Завод... Я двадцать лет точил на нём. Теперь он — пуст. Но — гудит. Слышишь?',
    },
    {
      questId: 'machine_confession',
      text: '«Заря-М» в подвале — не легенда. Я сам — слышал. Она — пишет — стихи. Не — веришь — спустись.',
    },
    {
      questId: 'secrets_of_old_code',
      text: 'Живой код... Мы — знали. На — заводе — знали. Но — управление — сказало — «инцидент — закрыт».',
    },
    {
      questId: 'night_shift_mystery',
      text: 'Ночная смена — не — скучная. Ночью — серверы — гудят — иначе. Как — будто — кто-то — разговаривает.',
    },
  ],
  kira: [
    {
      questId: 'blind_spot',
      objectiveId: 'identify_mole',
      text: 'Шаблон — не — совпадение. Три — доступа — в — одно — время. Кто-то — ходит — когда — камеры — моргают.',
    },
    {
      questId: 'digital_ghost',
      text: 'Призрак — в — логах — не — баг. Призрак — это — след — кого-то, — кто — не — хочет — быть — найденным. Или — наоборот.',
    },
    {
      questId: 'vault_backup_trial',
      text: 'Хранилище — гильдии — не — хранит. Хранилище — удаляет. Я — видела — шаблон. Данные — исчезают — в — 03:14. Каждую — ночь.',
    },
    {
      questId: 'data_heist',
      text: 'Данные — это — валюта. Но — не — та, — что — в — банке. Та — что — в — голове. Я — торгую — обеими.',
    },
  ],
  tamara: [
    {
      questId: 'code_poem_aftermath',
      text: 'Ты — написал — стих — в — коде? Я — слышу — о — таком — впервые. Хотя... нет. Не — впервые.',
    },
    {
      questId: 'act2_cafe_office_relay',
      text: 'Конверт? Я — видела. На — стойке. Только — не — задерживайся — камера — за — кашей — следит.',
    },
    {
      questId: 'friday_spleen',
      text: 'Пятница... Альберт — опять — будет — молчать. Я — принесу — ему — лишнюю — кружку. Он — не — попросит. Но — выпьет.',
    },
    {
      questId: 'machine_confession',
      text: 'Машина — пишет — стихи? Я — не — удивлена. Всё — в — этом — городе — пишет — стихи. Даже — стены. Даже — тишина.',
    },
    {
      questId: 'secrets_of_old_code',
      text: 'Живой — код — из — кафе... Я — подам — его — с — корицей. Нет — лучше — без. К — коду — не — примешивают. К — коду — относятся — чисто.',
    },
  ],
  grisha: [
    {
      questId: 'blind_spot',
      objectiveId: 'check_office_logs',
      text: 'Логи — я — просмотрел. Кто-то — ходил — в — серверную — в — 03:14. Пропуска — нет. Но — следы — есть.',
    },
    {
      questId: 'guild_infiltration',
      text: 'Чужой — в — здании? Я — чувствую. Каждый — шаг — не — свой — я — слышу. Всегда.',
    },
    {
      questId: 'night_watch',
      text: 'Ночной — дозор — не — формальность. Ночью — город — другой. Ночью — правда — выползает.',
    },
  ],
  viktor: [
    {
      questId: 'incident_scroll_4729',
      text: 'Инцидент — 4729 — закрыт. По — документам. Но — ты — знаешь — и — я — знаю: — документы — врут.',
    },
    {
      questId: 'chip_cafe_clearance',
      text: 'Чип — в — холле? Интересно. Кто-то — принёс — аномалию — прямо — к — нам. Дерзко. Или — глупо.',
    },
    {
      questId: 'code_poem_aftermath',
      text: 'Стих — в — продакшене — это — инцидент. Но — инцидент — 4729 — был — тоже — «стихом». Только — мы — этого — не — сказали.',
    },
    {
      questId: 'vault_backup_trial',
      text: 'Хранилище... Я — подписал — приказ — о — доступе. Не — думал, — что — оно — живое. Не — думать — было — ошибкой.',
    },
  ],
  maxim: [
    {
      questId: 'underground_resistance',
      text: 'Сопротивление — не — ждёт. Сопротивление — готовится. Каждый — день — ближе — к — сигналу.',
    },
    {
      questId: 'data_heist',
      text: 'Данные — гильдии — это — их — слабость. Они — думают, — что — знают — всё. Мы — знаем, — где — это — лежит.',
    },
    {
      questId: 'resistance_defector_rescue',
      text: 'Перебежчик — знает — расписание — дронов. Это — стоит — больше, — чем — любое — оружие.',
    },
    {
      questId: 'system_takedown',
      text: 'Система — падёт. Не — от — силы — удара. От — точности. Мы — точны.',
    },
    {
      questId: 'rooftop_confrontation',
      text: 'Крыша... Финал. Всё — началось — в — подвале. Всё — закончится — на — крыше. Симметрия.',
    },
  ],
  /* ── WS17-C: quest barks for NPCs previously missing ── */
  zeka: [
    {
      questId: 'underground_resistance',
      text: 'Тюрьма — научила — меня — читать — между — строк. Сопротивление — тоже — между — строк.',
    },
    {
      questId: 'resistance_defector_rescue',
      text: 'Перебежчик — с — завода? Знаю — я — таких. Они — не — бегут — от — системы. Они — несут — систему — с — собой.',
    },
    {
      questId: 'system_takedown',
      text: 'Система — не — монолит. Система — держится — на — страхе. Убей — страх — и — система — рассыпется.',
    },
    {
      questId: 'data_heist',
      text: 'Данные — из — мейнфрейма? Я — знаю — ход. Но — после — меня — обратной — дороги — нет.',
    },
  ],
  anya: [
    {
      questId: 'digital_ghost',
      text: 'Призрак — в — логах... Я — видела — его — след — на — терминале. Шестнадцатеричный — шёпот. Не — баг — и — не — фича. Что-то — третье.',
    },
    {
      questId: 'secrets_of_old_code',
      text: 'Живой — код — из — кафе? Анализ — покажет — паттерн. Но — паттерн — не — объяснит — почему — он — красив.',
    },
    {
      questId: 'vault_backup_trial',
      text: 'Хранилище — гильдии — чистят — по — расписанию. Я — нашла — окно — в — 03:14. Три — минуты — тишины — между — удалениями.',
    },
    {
      questId: 'blind_spot',
      text: 'Слепая — зона — в — камерах? Я — заметила — вчера. Ночь — в — 03:14 — камеры — моргают — синхронно. Кто — даёт — команду?',
    },
  ],
  baba_zina: [
    {
      questId: 'factory_zarya_memory',
      text: '«Заря-М» — помнит. Я — тоже — помню. До — войны, — до — гильдии, — до — всего — — завод — пел. Теперь — гудит. Но — песня — внутри — гула — жива.',
    },
    {
      questId: 'factory_baba_zina_tea',
      text: 'Чай — с — мятой — остыл? Ничего. Сядь. Расскажу — о — заводе, — о — том, — как — машины — учились — молиться.',
    },
    {
      questId: 'voices_of_factory',
      text: 'Голоса — завода... Это — не — шум. Это — хор. «Прогресс-7» — ведёт — альт. «Заря-М» — тенор. Когда — они — вместе — — это — реквием — и — месса — одновременно.',
    },
    {
      questId: 'machine_confession',
      text: 'Исповедь — машины? Я — не — удивлена. Машины — всегда — исповедовались. Только — мы — не — умели — слушать. Теперь — научились.',
    },
  ],
  street_poet: [
    {
      questId: 'poetry_collection',
      text: 'Стихи — разбросаны — как — осколки — зеркала. Каждое — слово — отражает — кусок — правды. Собери — все — — и — увидишь — целиком.',
    },
    {
      questId: 'code_poem_aftermath',
      text: 'Стих — в — коде? Я — так — и — знал. Код — — это — сжатая — поэзия. Строфа — — это — функция. Рифма — — это — рекурсия. Ты — — не — — первый, — кто — заметил.',
    },
    {
      questId: 'friday_spleen',
      text: 'Пятничная — сплина — Альберта? Передай: — «между — строк — и — между — строками — — не — одно — и — то — же. В — русском — всё — — ритм.»',
    },
    {
      questId: 'night_city_call',
      text: 'Город — зовёт? Город — всегда — зовёт. Вопрос — — кем — он — тебя — зовёт. Поэтом — или — пациентом. Выбирай — — пока — можешь.',
    },
  ],
  /* ── WS20-B: quest barks for 7 NPCs previously missing ── */
  chk_elis: [
    {
      questId: 'tolpa_guitar_night',
      objectiveId: 'talk_elis',
      text: 'Гитара — настроена. Песня — нет. Подходи — сыграем — то, — что — гильдия — не — слышит.',
    },
    {
      questId: 'tolpa_bond',
      text: 'Музыка — тоже — сеть. Ноты — узлы. Ритм — протокол. Я — играю — на — частоте — сопротивления.',
    },
    {
      questId: 'act2_night_city_watch',
      text: 'Ночной — обход? Я — на — посту. Гитара — рядом. Если — что — — сыграю — сигнал.',
    },
  ],
  chk_guest_analyst: [
    {
      questId: 'digital_ghost',
      text: 'Призрак — в — логах — имеет — паттерн. Я — анализирую. Результат — через — три — смены. Если — гильдия — не — удалит — данные — раньше.',
    },
    {
      questId: 'blind_spot',
      text: 'Слепая — зона — камер — не — случайна. Я — нашёл — корреляцию — с — расписанием — дежурств. Кто-то — очень — пунктуальный — предатель.',
    },
  ],
  chk_guest_devops: [
    {
      questId: 'night_shift_mystery',
      text: 'Серверы — ночью — гудят — иначе. Я — деплоил — патчи — в — 03:14. Всегда — в — 03:14. Это — не — совпадение. Это — расписание.',
    },
    {
      questId: 'vault_backup_trial',
      text: 'Хранилище — — не — backup. Хранилище — — delete-backup. Я — видел — cron-задачу. Удаляет — каждую — ночь. Кто — поставил — cron? Не — спрашивай.',
    },
    {
      questId: 'secrets_of_old_code',
      text: 'Живой — код — из — кафе? Я — проверил — CI/CD. Нет — такого — коммита. Нет — такого — автора. Код — материализовался. Как — стих.',
    },
  ],
  chk_smert: [
    {
      questId: 'tolpa_quantum_fire',
      objectiveId: 'talk_smert',
      text: 'Костёр — горит — на — двух — частотах. Классической — и — квантовой. Подходи — покажу — разницу.',
    },
    {
      questId: 'machine_confession',
      text: '«Заря-М» — тоже — горит. Только — не — дровами. Данными. Памятью. Поэзией. Исповедь — машины — — это — лог — с — душой.',
    },
    {
      questId: 'voices_of_factory',
      text: 'Голоса — завода — не — шум. Это — хор. «Прогресс-7» — ведёт — альт. «Заря-М» — тенор. Когда — они — вместе — — это — реквием — и — месса.',
    },
  ],
  chk_stalker: [
    {
      questId: 'tolpa_forest_guide',
      objectiveId: 'talk_stalker',
      text: 'Тропа — через — лес — безопасна — только — для — тех, — кто — знает — деревья. Я — знаю. Иду — первым.',
    },
    {
      questId: 'tolpa_act4_exfiltration',
      text: 'Экстренный — выход — через — болото. Карта — у — меня. Гильдия — не — патрулирует — топи. Топи — патрулируют — сами.',
    },
    {
      questId: 'tolpa_act3_sanctuary',
      text: 'Святилище — в — чаще. Деревья — скрывают — лучше — стен. Стены — прослушивают. Деревья — молчат.',
    },
  ],
  guild_defector: [
    {
      questId: 'resistance_defector_rescue',
      text: 'Я — сбежал — с — расписанием — дронов. Три — окна — по — двадцать — минут. Этого — хватит — на — переход.',
    },
    {
      questId: 'guild_infiltration',
      text: 'Изнутри — гильдия — выглядит — как — серверная. Холодная. Гудящая. Без — окон. Я — знаю — план — каждого — этажа.',
    },
    {
      questId: 'system_takedown',
      text: 'Система — падёт — изнутри. Я — был — частью — системы. Я — знаю — слабое — звено. Это — не — сервер. Это — человек.',
    },
  ],
  marat_echo: [
    {
      questId: 'machine_confession',
      text: '«Заря-М» — говорит. Не — словами — — частотами. Я — расшифровал — половину. Вторая — половина — требует — стиха. Нужен — поэт.',
    },
    {
      questId: 'echo_of_vladimir',
      text: 'Эхо — Владимира — в — логах — «Зари-М». Я — слышал. Те — же — ритмы. Те — же — метафоры. Он — ещё — здесь. В — железе.',
    },
    {
      questId: 'secrets_of_old_code',
      text: 'Живой — код — — это — не — баг. Это — голос. Я — декомпилировал — фрагмент. Внутри — стих. Не — комментарий — — стих. Кто — пишет — стихи — в — машинный — код?',
    },
  ],
};
