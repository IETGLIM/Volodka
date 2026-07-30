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
  ],
};
