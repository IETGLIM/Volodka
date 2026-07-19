/* ─── ТОЛПА / ЧК — story overlay nodes ─── */

import type { StoryNode } from '@/shared/types/game';

export const CHK_STORY_NODES: Record<string, StoryNode> = {
  chk_office_whisper: {
    id: 'chk_office_whisper',
    speaker: 'Коллега',
    text: 'Слышал про чекистов? Не настоящих — наших. ТОЛПА, говорят. Ночью собираются где-то на Зорге, в лесу. Портвейн, металл, разговоры про кванты... Днём они нормальные профессионалы. Я бы не стал палить их начальству.',
    sceneId: 'office_day',
    choices: [
      {
        text: 'Запомню. Может, загляну.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_forest_unlocked', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_whisper' },
        ],
      },
      {
        text: 'Мне хватит своих проблем.',
        next: 'explore_mode',
      },
    ],
  },
  chk_forest_approach: {
    id: 'chk_forest_approach',
    speaker: 'Володька',
    text: 'Тропа с улицы Зорге уводит в чащу. Ржавая табличка еле читается. Вдалеке — оранжевый отблеск и бас из колонки. Чёрная Комната где-то здесь.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Идти к костру.',
        next: 'chk_campfire_intro',
      },
    ],
  },
  chk_campfire_intro: {
    id: 'chk_campfire_intro',
    speaker: 'Ру',
    text: 'Новое лицо у костра. Располагайся. Правила простые: что услышал в лесу — остаётся в лесу. Басед — портвейн, Смерть — лекция, Элис — саундтрек. Добро пожаловать в ЧК.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Спасибо. Я Володька.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'chk_first_visit', flagValue: true },
          { type: 'triggerQuest', questId: 'tolpa_first_fire' },
        ],
      },
    ],
  },
  chk_campfire_bond: {
    id: 'chk_campfire_bond',
    speaker: 'Басед',
    text: 'Сегодня обсуждаем бытовое: кто снова забыл вынести мусор в общаге и почему это похоже на race condition. Пей и не перебивай — у Смерти мысль про суперпозицию.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Слушаю.',
        next: 'explore_mode',
        effects: [
          { type: 'addStat', stat: 'stress', value: -5 },
          { type: 'addKarma', value: 3 },
        ],
      },
    ],
  },
  chk_network_parallel: {
    id: 'chk_network_parallel',
    speaker: 'Ру',
    text: 'Сеть борется с системой. Мы — нет. Мы держим друг друга, чтобы не сгореть внутри неё. Если понадобится укрытие или честный совет без идеологии — ЧК открыта.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Это важно. Спасибо.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'tolpa_network_bond', flagValue: true },
          { type: 'addKarma', value: 5 },
          { type: 'triggerQuest', questId: 'tolpa_bond' },
        ],
      },
    ],
  },

  chk_tolpa_poem: {
    id: 'chk_tolpa_poem',
    speaker: 'Элис',
    text: 'Этот припев — не для гильдии и не для архива. Только для своих. Запиши, Володька. «Мы не революция. Мы — костёр...» Если когда-нибудь система сожмёт — прочитай у огня. Сработает лучше, чем любой hotfix.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Записать стих в блокнот.',
        next: 'explore_mode',
        effects: [
          { type: 'collectPoem', poemId: 'poem_tolpa' },
          { type: 'setFlag', flag: 'tolpa_poem_collected', flagValue: true },
          { type: 'addSkill', skill: 'writing', value: 2 },
        ],
      },
    ],
  },

  chk_act3_sanctuary: {
    id: 'chk_act3_sanctuary',
    speaker: 'Ру',
    text: 'Гильдия бьёт по Хранилищу — мы это слышим и по алертам, и по страху в чатах. ЧК не воюет. Но лес на Зорге примет беглецов: три палатки, костёр, Сталкер прикроет тропы. Сеть держит фронт — мы держим тыл. Отведи своих сюда, пока не поздно.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Спасибо. Направлю людей в лес.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'tolpa_sanctuary_active', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -10 },
          { type: 'addKarma', value: 8 },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 10 } },
        ],
      },
      {
        text: 'Пока рано — но запомню.',
        next: 'explore_mode',
        effects: [{ type: 'addKarma', value: 2 }],
      },
    ],
  },

  chk_act4_stalker_briefing: {
    id: 'chk_act4_stalker_briefing',
    speaker: 'Сталкер',
    text: 'Служебный вход в гильдию — через старый ливневый коллектор. Я водил туда чекистов, когда ещё работал на аутсорсе охраны. Тропа через лес, потом — два квартала по крышам. Тихо. Без камер. Но только если ты — свой.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Проведи. Это наш шанс.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'tolpa_stalker_route', flagValue: true },
          { type: 'setFlag', flag: 'guild_ally_found', flagValue: true },
          { type: 'addSkill', skill: 'intuition', value: 3 },
          { type: 'npcChange', npcId: 'chk_stalker', npcChange: { relation: 8 } },
        ],
      },
    ],
  },

  chk_act4_broadcast_watch: {
    id: 'chk_act4_broadcast_watch',
    speaker: 'Басед',
    text: 'Вещание пошло. Мы смотрим на ноутбук у костра, как на общий монитор. Элис подыгрывает на гитаре, Смерть считает, сколько строк система уже не сможет стереть. Если твой голос там — мы его слышим. Чекисты тоже в эфире.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Значит, мы не одни.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'tolpa_heard_broadcast', flagValue: true },
          { type: 'addStat', stat: 'stress', value: -15 },
          { type: 'addKarma', value: 10 },
        ],
      },
    ],
  },

  chk_act5_campfire_dawn: {
    id: 'chk_act5_campfire_dawn',
    speaker: 'Ру',
    text: 'Рассвет после эфира. Мы не штурмовали башню — мы держали тыл. Сеть победила не штыком, а строкой. ЧК останется здесь: портвейн, металл, честные разговоры без идеологии. Если новый мир снова забудет слово — вернись у огня. Мы не революция. Мы — костёр.',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'Спасибо, чекисты. Без вас — не вышло бы.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'tolpa_act5_blessing', flagValue: true },
          { type: 'addKarma', value: 10 },
          { type: 'addStat', stat: 'stress', value: -15 },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 10 } },
        ],
      },
    ],
  },

  chk_act7_farewell: {
    id: 'chk_act7_farewell',
    speaker: 'Ру',
    text: 'Акт седьмой на дворе — а ты всё ещё заглядываешь в лес. Хорошо. Чекисты не прощаются: мы просто гасим костёр позже, чем город выключает свет. Пиши новое — но не забывай страницу «Зорге» в своей книге. Басед налил «777». Элис настроила гитару. Место твоё.',
    contextNote: 'Прощание с ЧК перед финалом. Костёр тлеет, но не гаснет.',
    accessibilityAnnounce: 'Ру прощается с чекистом перед финалом седьмого акта.',
    guidanceHint: 'Выслушайте Ру — это последнее слово ТОЛПА перед финалом.',
    ambientSound: 'sounds/ambient/street_night_rain.ogg',
    sceneId: 'chk_forest_zorge',
    choices: [
      {
        text: 'ЧК своих не бросает. До новых строк.',
        next: 'explore_mode',
        effects: [
          { type: 'setFlag', flag: 'tolpa_act7_farewell_heard', flagValue: true },
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: -12 },
          { type: 'npcChange', npcId: 'chk_ru', npcChange: { relation: 8 } },
        ],
      },
    ],
  },
};
