/**
 * ───────────────────────────────────────────────────────────────────────────
 *  ВОЗВРАТНЫЕ ДИАЛОГИ (return-узлы)
 * ───────────────────────────────────────────────────────────────────────────
 *  Когда игрок повторно взаимодействует с NPC, движок открывает
 *  `returnDialogueNodeId` вместо основного диалога.
 *
 *  Этот файл создаёт короткие возвратные узлы для каждого NPC: короткое
 *  приветствие, подтверждающее что NPC помнит игрока, + прощальный выбор
 *  и выбор «Расскажи что-нибудь новое», который ведёт в настоящий
 *  стартовый узел диалога NPC (dialogueNodeId).
 *
 *  Все тексты на русском, в духе cyberpunk-сказки Володьки.
 * ───────────────────────────────────────────────────────────────────────────
 */
import type { DialogueNode } from '@/shared/types/game';

/**
 * Минимальный возвратный узел: одна реплика NPC + прощальный выбор
 * + выбор перехода к основному диалогу.
 *
 * @param entryId Реальный идентификатор стартового узла диалога NPC
 *   (поле `dialogueNodeId` из определения NPC). Раньше здесь использовалось
 *   `id.replace('_return', '_dialogue')`, что приводило к ссылкам на
 *   несуществующие узлы для ~28 NPC и ошибке «Не удалось загрузить диалог».
 */
function mkReturn(
  id: string,
  speaker: string,
  text: string,
  entryId: string,
  farewell = 'До встречи.',
): DialogueNode {
  return {
    id,
    speaker,
    text,
    choices: [
      { text: farewell, next: null },
      { text: 'Расскажи что-нибудь новое.', next: entryId },
    ],
  };
}

export const RETURN_DIALOGUE_NODES: Record<string, DialogueNode> = {
  // ── Основные NPC (npcDefinitions.ts) ──
  albert_return: mkReturn(
    'albert_return',
    'Альберт',
    'Снова ты, Володька? Я всё думаю о тех строках, что ты принёс. Город меняется — и мы вместе с ним. Что тревожит тебя сегодня?',
    'albert_greeting',
  ),
  zarema_return: mkReturn(
    'zarema_return',
    'Зарема',
    'Ты вернулся. Я чувствую — в твоих стихах стало больше тени. Это хорошо. Тень придаёт свету глубину. Зачем пришёл?',
    'zarema_greeting',
  ),
  cafe_barista_return: mkReturn(
    'cafe_barista_return',
    'Бариста',
    'Привычный заказ? Двойной эспрессо, как в прошлый раз. Я запоминаю тех, кто пишет за столиком у окна. Садись — сеть сегодня гудит.',
    'cafe_barista_dialogue',
  ),
  office_alexander_return: mkReturn(
    'office_alexander_return',
    'Александр',
    'Володька. Ты опять здесь. Я думал, ты уже ушел в ночь искать свои строки. Что заставило вернуться в эти стены?',
    'office_alexander_dialogue',
  ),
  office_colleague_return: mkReturn(
    'office_colleague_return',
    'Коллега',
    'Псс... снова ты. Я тут ещё копался в логах. Кое-что нашёл, но... давай не здесь. Сейчас слишком много глаз.',
    'office_colleague_dialogue',
  ),
  maria_return: mkReturn(
    'maria_return',
    'Мария',
    'Ты пришёл. Я ждала. Город шепчет мне о тебе — говорит, ты становишься тем, кем должен быть. Что хочешь узнать?',
    'maria_dialogue',
  ),
  office_dmitry_return: mkReturn(
    'office_dmitry_return',
    'Дмитрий',
    'Опять ты. Я думал, поэты не возвращаются в офисы. Видимо, я ошибался. Что на этот раз — стихи или дело?',
    'dmitry_greeting',
  ),
  viktor_return: mkReturn(
    'viktor_return',
    'Виктор',
    'Володька. Я знал, что ты вернёшься. Такие, как мы, всегда возвращаются — даже когда думают, что ушли навсегда. Садись. Поговорим.',
    'viktor_greeting',
  ),
  kira_return: mkReturn(
    'kira_return',
    'Кира',
    'Ты опять здесь. Говорят, ты собираешь стихи по кусочкам. Я могу помочь — но моя помощь имеет цену. Какую — решишь сам.',
    'kira_greeting',
  ),
  boris_return: mkReturn(
    'boris_return',
    'Борис',
    'Э, Володька! Живой ещё? Я думал, тебя уже система сожрала. Что нужно? Только быстро — у меня своих забот полно.',
    'boris_greeting',
  ),
  tamara_return: mkReturn(
    'tamara_return',
    'Тамара',
    'Снова в библиотеке? Хорошо. Здесь тишина бережёт мысли. Я нашла кое-что в старых архивах — может, тебе пригодится.',
    'tamara_greeting',
  ),
  grisha_return: mkReturn(
    'grisha_return',
    'Гриша',
    'О, поэт вернулся! Я уж думал, ты бросил нас. Садись, расскажи, где пропадал. У меня тут тоже новости есть.',
    'grisha_greeting',
  ),

  // ── Расширенные NPC (expandedNPCs.ts) ──
  solnysh_return: mkReturn(
    'solnysh_return',
    'Солныш (Алина)',
    'Ты пришёл... я заждалалась. Солнце уже садится, а я всё думаю о тебе. Расскажи мне что-нибудь. Что угодно.',
    'vera_greeting',
  ),
  lyonya_return: mkReturn(
    'lyonya_return',
    'Лёня (Леонид)',
    'Володька, старик! Снова в наших краях? Я тут тоже кое-что нарыл. Говорят, в ЧК стало тише — значит, что-то затевается.',
    'lyonya_greeting',
  ),
  sergey_return: mkReturn(
    'sergey_return',
    'Сергей',
    'Возвращаешься? Хорошо. Я как раз думал о тех строках, что ты принёс. Есть в них сила. Но и опасность.',
    'sergey_greeting',
  ),
  lena_return: mkReturn(
    'lena_return',
    'Лена',
    'Ты опять здесь. Я думала, ты уже ушёл за своими ответами. Что вернуло тебя? Надежда или страх?',
    'lena_greeting',
  ),
  oleg_return: mkReturn(
    'oleg_return',
    'Олег',
    'Володька. Ты решил заглянуть ещё разок? Я не против. Сидеть одному в тишине — то ещё удовольствие. Поговорим.',
    'oleg_greeting',
  ),
  kate_return: mkReturn(
    'kate_return',
    'Катя',
    'Снова ты. Я уже начала привыкать к твоим визитам. Это опасно — привычка. Но и приятная. Что сегодня?',
    'kate_greeting',
  ),
  maxim_return: mkReturn(
    'maxim_return',
    'Максим',
    'Володька! Ты как раз вовремя. Я тут доработал одну идею... но сначала скажи — ты сам-то как? Стихи идут?',
    'maxim_greeting',
  ),
  zeka_return: mkReturn(
    'zeka_return',
    'Жека',
    'О, поэт! Не ожидал увидеть тебя живым. Шучу. Или нет. Чего надо? Только без длинных речей — я занят.',
    'zeka_greeting',
  ),
  anya_return: mkReturn(
    'anya_return',
    'Аня',
    'Ты вернулся... Я рада. Здесь так мало тех, с кем можно говорить о настоящем. Расскажи, что нового в твоём пути.',
    'anya_greeting',
  ),
  fisherman_trofim_return: mkReturn(
    'fisherman_trofim_return',
    'Трофим',
    'Эй, поэт! Снова к пруду? Рыба сегодня молчит — чует перемену погоды. А ты как? Строки ловятся?',
    'trofim_greeting',
  ),
  baba_zina_return: mkReturn(
    'baba_zina_return',
    'Баба Зина',
    'Внучок вернулся! Сядь, отдохни. Я тебе чай заварила — липовый, с мёдом. Расскажи бабушке, как твои дела.',
    'baba_zina_greeting',
  ),
  street_poet_return: mkReturn(
    'street_poet_return',
    'Уличный поэт',
    'Брат! Снова бродишь? Я тут новую штуку сочинил. Послушаешь? Или у тебя своё есть — тоже не стесняйся.',
    'street_poet_greeting',
  ),
  marat_echo_return: mkReturn(
    'marat_echo_return',
    'Марат (эхо)',
    '...слышишь меня? Я всё ещё здесь — как эхо в старой трубе. Ты возвращаешься, значит, я ещё нужен. Говори.',
    'marat_echo_greeting',
  ),
  guild_defector_return: mkReturn(
    'guild_defector_return',
    'Перебежчик',
    'Ты опять пришёл. Осторожнее — меня могут увидеть с тобой. Но... ладно. Что нужно? Только быстро.',
    'guild_defector_greeting',
  ),

  // ── CHK NPC (chkTolpa/npcs.ts) ──
  chk_ru_return: mkReturn(
    'chk_ru_return',
    'Ру',
    'Володька. Ты знаешь дорогу сюда — значит, ты наш. Садись к костру. У нас есть время поговорить.',
    'chk_ru_greeting',
  ),
  chk_based_return: mkReturn(
    'chk_based_return',
    'Басед',
    'Снова здесь? Хорошо. Я как раз думал о старых временах. До гильдии, до всего этого. Послушаешь?',
    'chk_based_greeting',
  ),
  chk_smert_return: mkReturn(
    'chk_smert_return',
    'Смерть',
    'Ты не боишься меня. Это... странно. И приятно. Возвращайся, когда захочешь. Я никуда не денусь.',
    'chk_smert_greeting',
  ),
  chk_stalker_return: mkReturn(
    'chk_stalker_return',
    'Сталкер',
    'Тихо. Сядь. Здесь можно говорить. Я нашёл новый путь через завалы — но это потом. Сначала ты. Как ты?',
    'chk_stalker_greeting',
  ),
  chk_elis_return: mkReturn(
    'chk_elis_return',
    'Элис',
    'Ты пришёл! Я ждала. У меня тут гитара настроена — и пара новых строк в голове. Хочешь послушать?',
    'chk_elis_greeting',
  ),
  chk_guest_devops_return: mkReturn(
    'chk_guest_devops_return',
    'Гость (DevOps)',
    'О, поэт вернулся. Я тут как раз думал о деплое одной штуки... ладно, это скучно. Ты лучше расскажи — что в городе?',
    'chk_guest_devops_greeting',
  ),
  chk_guest_analyst_return: mkReturn(
    'chk_guest_analyst_return',
    'Гость (Аналитик)',
    'Снова ты. Я анализировал твои последние строки — интересная структура. Но это потом. Что привело тебя сюда?',
    'chk_guest_analyst_greeting',
  ),
  chk_ritka_pier_return: mkReturn(
    'chk_ritka_pier_return',
    'Ритка',
    'Володька! Ты пришёл. Я тут сижу, смотрю на воду. Она сегодня особенная — отражает то, чего нет. Сядь рядом.',
    'chk_ritka_greeting',
  ),
};
