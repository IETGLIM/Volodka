import type { DialogueNode } from '@/shared/types/game';

/* ═════════════════════════════════════════════════════════════════════════════
   ВИКТОРИЯ — хранительница одноразовых ключей к Хранилищу гильдии.

   FIX (аудит, этап 95): NPC `victoria` (EXPANSION_NPC_STUBS) была зарегистрирована
   в реестре, но без dialogueNodeId / расписания никогда не появлялась в мире.
   Этот пак — её живой диалог у мейнфрейма гильдии (guild_mainframe):
   первая встреча, философия «стёртые — не мёртвые», история ошибки с ключом,
   легенда о Первом Архивариусе и короткий return-разговор для повторных визитов.

   Важно: узлы задают speakerId: 'victoria' — канонический id реестра NPC.
   Без speakerId русский speaker «Виктория» резолвится в maria (легаси-алиас
   из актов 1–5, где Виктория — ИИ-сознание Марии). Это ДРУГАЯ Виктория —
   физическая хранительница ключей из expansion-контента (акты 3–4+).
   ═════════════════════════════════════════════════════════════════════════════ */

export const DIALOGUE_VICTORIA: Record<string, DialogueNode> = {
  /* ── Первая встреча: серверная гильдии, стеллажи ключ-карт ── */
  victoria_greeting: {
    id: 'victoria_greeting',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Серверная гильдии. Виктория перебирает ключ-карты Хранилища.',
    text: '*не оборачиваясь, слышит шаги по металлическому полу* Стой, где стоишь. *пауза. медленно поворачивается; в руке — стопка ключ-карт, как колода* Так. Инженер. Походка не охраны, взгляд не аудита. Ты — тот, кто пишет стихи в комментариях к коду. Слухи сюда доходят быстрее, чем свет. *постукивает карту по стойке* Я — Виктория. Хранительница ключей Хранилища. Не спрашивай, можно ли войти. Спрашивай — стоит ли.',
    emotion: 'calm',
    cameraShot: 'medium',
    choices: [
      {
        text: 'Спросить про Хранилище — что там, за её ключами?',
        next: 'victoria_vault_lesson',
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
        ],
      },
      {
        text: 'Спросить, кто она такая — и почему гильдия доверяет ей ключи',
        next: 'victoria_who_she_is',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: 'Молчать. Иногда тишина — лучший пароль.',
        next: null,
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 3 } },
          { type: 'setFlag', flag: 'met_victoria', flagValue: true },
          {
            type: 'showThought',
            thought: 'Она оценивает меня. Не по рангу, не по карме — по паузам. Я выдержал паузу. Кажется, это здесь ценится дороже подписи.',
            thoughtDuration: 6000,
          },
        ],
      },
    ],
    effects: [
      { type: 'setFlag', flag: 'met_victoria', flagValue: true },
    ],
  },

  /* ── Философия: стёртые — не мёртвые ── */
  victoria_vault_lesson: {
    id: 'victoria_vault_lesson',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Виктория говорит о разнице между мёртвыми и стёртыми.',
    text: '*ведёт ладонью по стойке мейнфрейма, как по надгробию* Гильдия хранит там не только удалённые стихи. Там — личности. Стерлинги. *смотрит сквозь тебя* Мёртвый — остаётся в памяти. Стёртый — не существовал. Понимаешь разницу? Мёртвого можно оплакать. Стёртого — нельзя даже вспомнить: воспоминание удалено вместе с ним. Я раздаю ключи к этому….backward-архиву. Одноразовые. Один ключ — одна запись. Один взгляд. Один возврат. *усмехается без веселья* Поэты считают, что пишут вечное. Гильдия доказывает обратное — за семь секунд.',
    emotion: 'sad',
    cameraShot: 'close',
    choices: [
      {
        text: '«Стёртые — не мёртвые. Помню разницу.»',
        next: 'victoria_keys_question',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 5 } },
          { type: 'setFlag', flag: 'victoria_philosophy_agreed', flagValue: true },
          { type: 'discoverLore', loreId: 'lore_guild_first_archivist' },
        ],
      },
      {
        text: 'Спросить про Первого Архивариуса — легенду этой комнаты',
        next: 'victoria_archivist_story',
        condition: { minSkillCheck: { skill: 'intuition', difficulty: 14 } },
        effects: [
          { type: 'addSkill', skill: 'intuition', value: 1 },
          { type: 'discoverLore', loreId: 'lore_guild_first_archivist' },
        ],
      },
      {
        text: '«Архив личностей — это кладбище с круглосуточным доступом.»',
        next: 'victoria_keys_question',
        condition: { maxKarma: 25 },
        effects: [
          { type: 'addKarma', value: -2 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: -4 } },
          { type: 'addStat', stat: 'stress', value: 2 },
        ],
      },
    ],
  },

  /* ── Кто она: история доверия, оплаченного стиранием ── */
  victoria_who_she_is: {
    id: 'victoria_who_she_is',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Виктория о себе — коротко, как отчёт.',
    text: '*кладёт карты на стойку ровной стопкой* Кто я? Функция. Хранитель одноразовых ключей. Гильдия доверяет мне не потому, что верит. Потому что я видела, что бывает с теми, кто ошибается с ключом. *долгая пауза* Я раздам все ключи — и останусь ни с чем. Может, это и есть — цель. А может — приговор. Ещё не решила. *поднимает взгляд* Я молчу, пока не убедлюсь, что ты не повторишь мою ошибку. Так что не повторяй.',
    emotion: 'whisper',
    choices: [
      {
        text: '«Какая ошибка? Что случилось?»',
        next: 'victoria_key_mistake',
        effects: [
          { type: 'addSkill', skill: 'empathy', value: 1 },
        ],
      },
      {
        text: '«Значит, ты — часть машины Гильдии. Замок, а не человек.»',
        next: null,
        condition: { maxKarma: 30 },
        effects: [
          { type: 'addKarma', value: -3 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: -8 } },
        ],
      },
      {
        text: '«Стихи тоже пишут одноразовыми чернилами. Но кто-то же их помнит.»',
        next: null,
        condition: { minKarma: 45 },
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 7 } },
          { type: 'setFlag', flag: 'victoria_trusted', flagValue: true },
        ],
      },
    ],
  },

  /* ── История ошибки: ключ, имя, семь секунд ── */
  victoria_key_mistake: {
    id: 'victoria_key_mistake',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Виктория рассказывает про ключ, который доверила не тому.',
    text: '*берёт одну карту — потёртую, с трещиной по краю — и держит между нами* Эта — не в счёт. Она моя. Личная. *вдох* Пять лет назад я дала ключ человеку, которого любила. Он хотел только посмотреть — одно имя. Всего одно. Кто-то из стёртых, кто-то из тех, кого он помнил, хотя помнить было нельзя. Он посмотрел. Гильдия увидела запрос мгновенно — ключи сигналят при вскрытии, как сигналят стихи при удалении. За семь секунд его профиль стал пустым. Не мёртвым. Пустым. *кладёт карту на стойку* Я держу эту треснувшую карту, чтобы помнить: доступ — это не доверие. Доверие — это когда ты НЕ открываешь, хотя можешь.',
    emotion: 'sad',
    cameraShot: 'close',
    choices: [
      {
        text: '«Из null — в exist. Вернём их. Не из мёртвых — из удалённых.»',
        next: 'victoria_keys_question',
        condition: { minKarma: 55 },
        effects: [
          { type: 'addKarma', value: 6 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 12 } },
          { type: 'setFlag', flag: 'victoria_trusted', flagValue: true },
          {
            type: 'showThought',
            thought: 'Она смотрит так, будто я только что предложил взорвать солнце. И — соглашается. «Ты — сумасшедший», — говорит она. «Я — знаю», — отвечаю. Кажется, здесь это комплимент.',
            thoughtDuration: 6500,
          },
        ],
      },
      {
        text: '«Ключ одноразовый. Значит, выбор — один. Как строка в стихе: пишется один раз.»',
        next: 'victoria_keys_question',
        effects: [
          { type: 'addKarma', value: 2 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 5 } },
        ],
      },
      {
        text: '«Тебе нельзя было давать ключи после этого.»',
        next: null,
        condition: { maxKarma: 20 },
        effects: [
          { type: 'addKarma', value: -4 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: -10 } },
          { type: 'setFlag', flag: 'victoria_offended', flagValue: true },
        ],
      },
    ],
  },

  /* ── Легенда о Первом Архивариусе (лор guild_mainframe) ── */
  victoria_archivist_story: {
    id: 'victoria_archivist_story',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Легенда о 4729-А — архивариусе без имени.',
    text: '*смотрит на дальнюю стойку, где мигает одинокий индикатор* Ты заметил. Да — эта комната помнит того, у кого не было имени. Первый архивариус. Номер договора: 4729-А. Он стёр сам себя — добровольно, чернильно, подписавшись сажей и солью. Ни Гильдия, ни НейроСис не могли давить на человека, которого нет. Сорок семь томов от руки. Цифре он не верил — прав был, как видишь. *полушёпот* В 2034-м он исчез из закрытой комнаты без дверей. На столе — записка. Одно слово: «Зачитано». *поворачивается* Дмитрий носит ключ от той комнаты. Не открывает. Теперь ты знаешь почему: некоторые хранилища не хранят. Они — могилы для звука. Я — не могила. Пока — не могила.',
    emotion: 'whisper',
    cameraShot: 'medium',
    choices: [
      {
        text: '«Зачитано…» — как эпитафия, которой хватит на всех стёртых.',
        next: 'victoria_keys_question',
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 4 } },
          { type: 'discoverLore', loreId: 'lore_guild_founding_secret' },
        ],
      },
      {
        text: '«Кто-то должен открыть ту комнату. Не сегодня. Но — кто-то должен.»',
        next: 'victoria_keys_question',
        condition: { minKarma: 40 },
        effects: [
          { type: 'addKarma', value: 4 },
          { type: 'addSkill', skill: 'logic', value: 1 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 6 } },
        ],
      },
      {
        text: 'Отступить на шаг. Эту тишину не стоит перебивать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 2 } },
        ],
      },
    ],
  },

  /* ── Механика ключей: одноразовость как этика ── */
  victoria_keys_question: {
    id: 'victoria_keys_question',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Виктория объясняет правила одноразовых ключей.',
    text: '*собирает карты в колоду и режет её одним движением* Правила простые. Ключ — одноразовый. Использовал — гильдия узнала. Мгновенно. Не «записала в лог» — узнала. Алгоритмы допуска не спят. *пауза* Поэтому я говорю с тобой, а не выдаю доступ: сначала — подумай, что ты собираешься вернуть. Имя? Стих? Или просто — посмотреть, как выглядят чужие пустоты? *тихо* Смотреть — дешевле. Возвращать — дороже. Но только возвращение они не могут отнять: это уже не запись. Это — память. Гильдия бессильна против того, кто помнит.',
    emotion: 'calm',
    cameraShot: 'medium',
    choices: [
      {
        text: '«Когда придёт время — я приду за ключом. Не раньше.»',
        next: null,
        effects: [
          { type: 'addKarma', value: 3 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 6 } },
          { type: 'setFlag', flag: 'victoria_key_promise', flagValue: true },
        ],
      },
      {
        text: '«Память против базы данных. Значит, поэты — единственные хакеры, которых не забанить.»',
        next: null,
        condition: { minKarma: 50 },
        effects: [
          { type: 'addKarma', value: 5 },
          { type: 'addSkill', skill: 'writing', value: 1 },
          { type: 'addSkill', skill: 'coding', value: 1 },
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 8 } },
        ],
      },
      {
        text: 'Кивнуть и уйти. Ключи подождут. Они одноразовые — они умеют ждать.',
        next: null,
        effects: [
          { type: 'addKarma', value: 1 },
        ],
      },
    ],
  },

  /* ── Повторные визиты: короткий разговор ── */
  victoria_return: {
    id: 'victoria_return',
    speaker: 'Виктория',
    speakerId: 'victoria',
    sceneId: 'guild_mainframe',
    contextNote: 'Виктория за стойкой мейнфрейма. Повторный визит.',
    text: 'Снова ты. *не отрывается от карт* Хранилище на месте. Ключи — тоже. Ничего не изменилось, кроме тебя. Это — комплимент: меняться здесь — привилегия живых.',
    textVariants: {
      highRelation: 'Володька. *почти улыбается, поднимая взгляд от карт* Я ждала кого-то вроде тебя. Из null — в exist — помнишь? Ключи на месте. И один из них давно смотрит в твою сторону. Бери. Но запомни имя того, кого вернёшь.',
      lowRelation: '*не поворачиваясь* Ещё раз. Что нужно? Ключей не дам. Разговора — тоже. Ты уже слышал всё, что я могу сказать бесплатно.',
      highKarma: '*откладывает колоду, впервые за смену* Хорошие вести доходят и сюда: ты пишешь, а не стираешь. Продолжай. Для стирания у гильдии есть штат. Для стихов — только ты.',
      lowKarma: '*холодно, не поднимая глаз* Не подходи ближе. Я раздаю ключи тем, кто возвращает. Не тем, кто забирает. Пока — ты забираешь.',
    },
    karmaThresholds: { high: 55, low: 20 },
    emotion: 'calm',
    cameraShot: 'medium',
    choices: [
      {
        text: 'Спросить про ключи — правила всё те же?',
        next: 'victoria_keys_question',
        effects: [
          { type: 'addSkill', skill: 'logic', value: 1 },
        ],
      },
      {
        text: '«Просто мимо. Нестиховое настроение.»',
        next: null,
        effects: [
          { type: 'npcChange', npcId: 'victoria', npcChange: { relation: 1 } },
        ],
      },
    ],
  },
};
