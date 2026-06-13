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
  ],
  maria: [
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
      questId: 'blind_spot',
      objectiveId: 'check_office_logs',
      text: 'Логи доступа к офису у меня. Спроси — покажу, кто ходил ночью, когда Сеть молчала.',
    },
  ],
  vera: [
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
      questId: 'poetry_smuggling',
      text: 'Запрещённые стихи лежат в тайнике за полкой. Гильдия патрулирует маршруты — иди окольно.',
    },
    {
      questId: 'echo_of_vladimir',
      objectiveId: 'find_kate_clue',
      text: 'Тайник Владимира в библиотеке — не на карте. Я покажу, если ты готов к последнему стиху.',
    },
  ],
};
