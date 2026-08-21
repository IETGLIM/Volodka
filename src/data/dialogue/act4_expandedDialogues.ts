import type { DialogueNode } from '@/shared/types/game';

export const DIALOGUE_ACT4_EXPANDED: Record<string, DialogueNode> = {
  /* ═══════════════════════════════════════════════════════════
     РИВАЛЬНЫЙ ПОЭТ МАКС — Поэтический Дуэлянт
     ═══════════════════════════════════════════════════════════ */

  rival_poet_max_challenge: {
    id: 'rival_poet_max_challenge',
    speaker: 'Макс',
    text: '*стоит на перевернутом ящике, толпа гудит* Так, так, так... Говорят, тут появился новый поэт. Слышал, ты даже стихи в код прячешь. Вот что я тебе скажу: код — это для машин. А стихи — для людей. Бросаю тебе вызов. Три раунда, прямо здесь, перед всеми. Покажи, что ты не просто пишишь — покажи, что ты чувствуешь.',
    choices: [
      {
        text: 'Принимаю. Готовься проиграть.',
        next: 'rival_poet_max_reaction',
        effects: [
          { type: 'triggerQuest', questId: 'poetry_duelist' },
          { type: 'addKarma', value: 1 },
          { type: 'addSkill', skill: 'writing', value: 1 },
        ],
      },
      {
        text: 'Может, лучше поговорим о стихах без толпы?',
        next: 'rival_poet_max_reaction',
        effects: [
          { type: 'triggerQuest', questId: 'poetry_duelist' },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Не interested. Найди другую мишень.',
        next: null,
        effects: [
          { type: 'addKarma', value: -1 },
        ],
      },
    ],
  },

  rival_poet_max_reaction: {
    id: 'rival_poet_max_reaction',
    speaker: 'Макс',
    text: '*усмехается* Храбрые слова. Ну что ж... *откашливается* Слушайте все! Сегодня — дуэль! Два поэта, три раунда, одна площадь! Судьи — вы! *обращается к тебе* Первый раунд — твой. Забрасывай. Только знай: я буду отвечать. И мои строки режут глубже, чем твои терминалы.',
    choices: [
      {
        text: '*читаешь первое стихотворение*',
        next: 'rival_poet_max_victory',
        effects: [
          { type: 'setFlag', flag: 'duel_poem_1_chosen', flagValue: true },
          { type: 'setFlag', flag: 'duel_poem_2_chosen', flagValue: true },
          { type: 'setFlag', flag: 'duel_poem_3_chosen', flagValue: true },
          { type: 'setFlag', flag: 'poetry_duel_completed', flagValue: true },
          { type: 'addSkill', skill: 'rhythm', value: 2 },
          { type: 'addXp', value: 150 },
        ],
      },
    ],
  },

  rival_poet_max_victory: {
    id: 'rival_poet_max_victory',
    speaker: 'Макс',
    text: '*долгая пауза. Толпа затихает* ...Хорошо. Очень хорошо. *снимает кепку, держит у сердца* Я думал, я один такой. Что только я вижу рифмы в неоновых вывесках и слыжу стихи в шуме серверов. Но ты... ты понимаешь. *протягивает руку* Респект. Отныне — мы не соперники. Мы коллеги. И если гильдия придёт за твоими словами — они пройдут через меня.',
    choices: [
      {
        text: '*жмёшь руку* Спасибо, Макс. Вместе мы сильнее.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'rival_poet_ally', flagValue: true },
        ],
      },
    ],
  },

  rival_poet_max_defeat: {
    id: 'rival_poet_max_defeat',
    speaker: 'Макс',
    text: '*качает головой* Не то. Слышал я твои строки — красивые, техничные, как хорошо написанный код. Но в них нет искры. Нет боли. Ты пишешь головой, а не сердцем. *смотрит на толпу* Ну вот, видно, не сегодня. Может, когда-нибудь вернёшься. Когда найдёшь, о чём молчать нельзя.',
    choices: [
      {
        text: '*молча отступаешь* Я ещё вернусь.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addStat', stat: 'stress', value: 5 },
          { type: 'setFlag', flag: 'poetry_duel_finished', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     СТАРЫЙ БИБЛИОТЕКАРЬ ФЁДОР — Забытый Архив
     ═══════════════════════════════════════════════════════════ */

  old_librarian_fyodor_secret: {
    id: 'old_librarian_fyodor_secret',
    speaker: 'Фёдор',
    text: '*понижает голос, оглядывается на пустые полки* Садись. Закрой дверь. ...Лет пятьдесят назад, до цензуры, до гильдии, эта библиотека была сокровищницей. Тысячи томов. Потом пришла Комиссия — и сжёгла всё, что не соответствовало «новому порядку». Но я... *трясущимися руками достаёт старый ключ* ...я успел спрятать кое-что. В подвале. Тридцать семь книг. Единственные экземпляры.',
    choices: [
      {
        text: 'Тридцать семь запрещённых книг? Покажи мне.',
        next: 'old_librarian_fyodor_puzzle_hint',
        effects: [
          { type: 'triggerQuest', questId: 'forgotten_archive' },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Это опасно. Если гильдия узнает...',
        next: 'old_librarian_fyodor_puzzle_hint',
        effects: [
          { type: 'triggerQuest', questId: 'forgotten_archive' },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Мне это не нужно. Удачи.',
        next: null,
        effects: [],
      },
    ],
  },

  old_librarian_fyodor_puzzle_hint: {
    id: 'old_librarian_fyodor_puzzle_hint',
    speaker: 'Фёдор',
    text: 'Дверь в подвал заперта не обычным замком — на ней шифр. Авторский замок. Три диска, каждый с буквой. Правильная комбинация — первые буквы имён трёх авторов, чьи книги я больше всего берёг. *пауза* Подсказка: первый — поэт, чьи строки о свободе знает каждый ребёнок. Второй — романист, изгнанный за правду. Третий — женщина, писавшая под мужским именем. Первые буквы их имён... *моргает* ...П, Б, М.',
    choices: [
      {
        text: 'П-Б-М. Запомнил. Я найду архив.',
        next: null,
        effects: [
          { type: 'setFlag', flag: 'archive_puzzle_hint_received', flagValue: true },
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
    ],
  },

  old_librarian_fyodor_books_recovered: {
    id: 'old_librarian_fyodor_books_recovered',
    speaker: 'Фёдор',
    text: '*берёт книги дрожащими руками, прижимает к груди, слёзы текут по щекам* Пятьдесят лет... пятьдесят лет я боялся, что они сгнили. Что мышь проела страницы. Что влага... *открывает первую книгу, вдыхает запах* Запах бумаги. Чернила. Жизнь. *смотрит на тебя* Ты не представляешь, что ты сделал. Это не просто книги. Это память. Наша коллективная память, которую они хотели стереть. А ты её вернул.',
    choices: [
      {
        text: 'Сохраняй их. Когда-нибудь они снова будут читаться.',
        next: 'old_librarian_fyodor_gratitude',
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addXp', value: 180 },
          { type: 'setFlag', flag: 'forgotten_archive_opened', flagValue: true },
        ],
      },
      {
        text: 'Можно мне оставить одну? Хочу прочитать.',
        next: 'old_librarian_fyodor_gratitude',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addXp', value: 180 },
          { type: 'addSkill', skill: 'writing', value: 2 },
          { type: 'setFlag', flag: 'forgotten_archive_opened', flagValue: true },
        ],
      },
    ],
  },

  old_librarian_fyodor_gratitude: {
    id: 'old_librarian_fyodor_gratitude',
    speaker: 'Фёдор',
    text: '*бережно ставит книги на стол, потом оборачивается к тебе* Знаешь, что самое страшное? Не когда сжигают книги. А когда никто не помнит, что в них было написано. Ты помог мне вспомнить. И за это... *достаёт из ящика старую тетрадь* ...возьми. Это мой личный дневник. Пятьдесят лет записей. В нём — имена, даты, места. Всё, что я помню о доцензурном мире. Может, когда-нибудь пригодится.',
    choices: [
      {
        text: 'Спасибо, Фёдор. Я буду беречь это.',
        next: null,
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'intuition', value: 2 },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     РАДИСТ КАТЯ — Сигнал из Бункера
     ═══════════════════════════════════════════════════════════ */

  radio_operator_katya_signal_discovery: {
    id: 'radio_operator_katya_signal_discovery',
    speaker: 'Катя',
    text: '*отрывает наушники, лицо бледное* Слушай, у меня проблема. Вернее — загадка. Я ловлю сигнал на военной частоте — 147.3 мегагерца. Циклический, повторяется каждые двенадцать секунд. Шифр — старый, армейский, ещё довоенный. Я частично декодировала координаты — они ведут за город, к восточным промзонам. Но там... там давно никого нет. Или так казалось.',
    choices: [
      {
        text: 'Давай проследим сигнал. Мне интересно, кто его передаёт.',
        next: 'radio_operator_katya_bunker_entry',
        effects: [
          { type: 'triggerQuest', questId: 'bunker_signal' },
          { type: 'addKarma', value: 2 },
        ],
      },
      {
        text: 'Может, это просто эхо старого передатчика?',
        next: 'radio_operator_katya_bunker_entry',
        effects: [
          { type: 'triggerQuest', questId: 'bunker_signal' },
        ],
      },
    ],
  },

  radio_operator_katya_bunker_entry: {
    id: 'radio_operator_katya_bunker_entry',
    speaker: 'Катя',
    text: '*протягивает портативный декодер и карту* Вот. Декодер настроен на их шифр — ключ «Рассвет-7», я его взломала вчера. Карта с отмеченным маршрутом. Вход в бункер — через люк в полу старого цеха, за третьей колонной. Будь осторожен: по карте там два уровня, и на нижнем — похоже, до сих пор работает энергия. Это... ненормально. Двадцать лет без обслуживания.',
    choices: [
      {
        text: 'Понял. Если что — буду на связи по рации.',
        next: 'radio_operator_katya_message_decoded',
        effects: [
          { type: 'addSkill', skill: 'coding', value: 1 },
        ],
      },
    ],
  },

  radio_operator_katya_message_decoded: {
    id: 'radio_operator_katya_message_decoded',
    speaker: 'Катя',
    text: '*читает распечатку, голос дрожит* «...координаты подтверждены. Укрытие цело. Провизии на 847 дней. Передатчик работает. Ждём. Мы здесь. Мы всё ещё здесь.» *поднимает глаза* Это... это автоматический передатчик. Но кто-то его запрограммировал. Кто-то, кто знал, что rescue может прийти. Через годы. Через десятилетия. *тихо* Ты нашёл... ты нашёл того, кто его настраивал?',
    choices: [
      {
        text: 'Нашёл. Скелет у терминала. Рядом — дневник. Он ждал до конца.',
        next: null,
        effects: [
          { type: 'addKarma', value: 12 },
          { type: 'addXp', value: 220 },
          { type: 'setFlag', flag: 'bunker_signal_resolved', flagValue: true },
          { type: 'addStat', stat: 'stress', value: 5 },
        ],
      },
      {
        text: 'Там никого. Только машина, повторяющая одно и то же.',
        next: null,
        effects: [
          { type: 'addKarma', value: 6 },
          { type: 'addXp', value: 220 },
          { type: 'setFlag', flag: 'bunker_signal_resolved', flagValue: true },
        ],
      },
    ],
  },

  /* ═══════════════════════════════════════════════════════════
     КОНТРАБАНДИСТ ГРИША — Торговый Путь
     ═══════════════════════════════════════════════════════════ */

  smuggler_grisha_deal_proposal: {
    id: 'smuggler_grisha_deal_proposal',
    speaker: 'Гриша',
    text: '*гладит усы, стреляет глазами* Слушай, у меня есть работёнка. Не для слабонервных, зато платят щедро. Община на юге — у них медикаменты, антибиотики, вещи, которые тут на вес золота. Торговый Союз на севере — у них запчасти, инструменты, электроника. Оба лагеря нуждаются друг в друге, но гордость не даёт им договориться. Я — связующее звено. А ты — ноги. Нужен курьер. Интересно?',
    choices: [
      {
        text: 'Сколько платишь и какой маршрут?',
        next: 'smuggler_grisha_route_planning',
        effects: [
          { type: 'triggerQuest', questId: 'trade_route' },
        ],
      },
      {
        text: 'А почему именно я? Наверняка есть другие кандидаты.',
        next: 'smuggler_grisha_route_planning',
        effects: [
          { type: 'triggerQuest', questId: 'trade_route' },
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Контрабанда? Нет, спасибо.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
    ],
  },

  smuggler_grisha_route_planning: {
    id: 'smuggler_grisha_route_planning',
    speaker: 'Гриша',
    text: '*разворачивает карту на столе* Вот. Синим — Община, красным — Союз. Зелёная линия — прямой маршрут. Но видишь эти серые зоны? Патрули. Они кочуют, но есть закономерность. В полночь — смена. Вот тут, между складами, пятнадцатиминутное окно. Заходишь в одиннадцать сорок пять, выходишь в ноль. Двести кредитов за доставку. Плюс... *понижает голос* ...десять процентов от будущих сделок, если всё пройдёт чисто.',
    choices: [
      {
        text: 'Двести плюс процент? По рукам. Начинаю с обеих сторон.',
        next: 'smuggler_grisha_payment',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
    ],
  },

  smuggler_grisha_payment: {
    id: 'smuggler_grisha_payment',
    speaker: 'Гриша',
    text: '*пересчитывает кредиты, протягивает пухлый конверт* Красавчик. Или красавица — не обижайся, в темноте не разберёшь. *хмыкает* Груз цел, клиенты довольны, патруль ничего не заметил. Ты — профессионал. Вот твои двести. И вот... *достаёт маленькую медную пластинку* ...это мой знак. Когда покажешь его кому-то из своих — они поймут, что ты надёжен. Короче: ты теперь часть сети. Добро пожаловать.',
    choices: [
      {
        text: 'Спасибо, Гриша. Буду на связи.',
        next: null,
        effects: [
          { type: 'addCredits', value: 200 },
          { type: 'addXp', value: 250 },
          { type: 'addSkill', skill: 'persuasion', value: 2 },
          { type: 'setFlag', flag: 'trade_route_established', flagValue: true },
          { type: 'setFlag', flag: 'smuggler_network_member', flagValue: true },
        ],
      },
      {
        text: 'Легко. Когда будет следующий рейс?',
        next: null,
        effects: [
          { type: 'addCredits', value: 200 },
          { type: 'addXp', value: 250 },
          { type: 'addSkill', skill: 'persuasion', value: 3 },
          { type: 'setFlag', flag: 'trade_route_established', flagValue: true },
          { type: 'setFlag', flag: 'smuggler_network_member', flagValue: true },
          { type: 'addKarma', value: -2 },
        ],
      },
    ],
  },
};
