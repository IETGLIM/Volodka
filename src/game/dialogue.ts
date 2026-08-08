/**
 * Диалоги. Данные — чистые, эффекты — строковые id, которые исполняет движок.
 */
import type { GameState } from './quests';
import { hasStanza } from './quests';

export interface DL {
  text: string;
  choices?: { label: string; effect: string }[];
}

export interface DialogueDef {
  speaker: string;
  portrait: string;
  lines: DL[];
}

export const PORTRAITS = {
  starets: 'art/portrait-starets.png',
  milica: 'art/portrait-milica.png',
  melnik: 'art/portrait-melnik.png',
  kot: 'art/portrait-kot.png',
};

export function staretsDialogue(s: GameState): DialogueDef {
  const lines: DL[] = [];
  if (!s.metStarets) {
    lines.push(
      { text: 'Здравствуй, Володька. Я ждал тебя — дуб сказал, что ты проснёшься сегодня. Ты спал долго, мальчик мой.' },
      { text: 'В ночь, когда луна погасла, твои стихи разлетелись по долине, как искры костра. Без них ты — как книга без букв: помнишь, что слова были, а прочесть не можешь.' },
      { text: 'Начни с колодца. Вода помнит всё, что ты ей шептал на рассвете. Первая строка ждёт тебя на дне — в отражении.', choices: [{ label: 'Иду к колодцу', effect: 'metStarets' }] },
    );
  } else if (s.stanzas.length >= 5 && !s.finale) {
    lines.push(
      { text: 'Пять строк — почти вся баллада. Осталась последняя: та, что всегда была с тобой.' },
      { text: 'Луна уже поднимается над дальней поляной. Ступай, Володька. Я посторожу долину.', choices: [{ label: 'Спасибо, Старец', effect: 'thanks' }] },
    );
  } else if (s.finale) {
    lines.push(
      { text: 'Ты вернул долине её голос. Слушай, как поют строки в твоём журнале — это теперь навсегда.' },
      { text: 'А теперь иди. Мир живой, и он твой. Приходи рассказывать.', choices: [{ label: 'Приду', effect: 'thanks' }] },
    );
  } else {
    lines.push(
      { text: `У тебя уже ${s.stanzas.length} строка. Долина оживает с каждым словом — светлячки поют, ветер гуляет в крыльях.`, choices: [{ label: 'Продолжу путь', effect: 'thanks' }] },
    );
  }
  return { speaker: 'Старец', portrait: PORTRAITS.starets, lines };
}

export function milicaDialogue(s: GameState): DialogueDef {
  const lines: DL[] = [];
  if (!s.catBack) {
    lines.push(
      { text: 'Володька! Ты ли это? Говорят, ты потерял свои стихи... Держись, я верю, что они найдутся.' },
      { text: 'Только у меня беда: Барсик убежал к пруду и не возвращается. Он всегда чует грусть — а в пруду сейчас грустно.', choices: [{ label: 'Найду Барсика', effect: 'catQuest' }] },
    );
  } else if (!hasStanza(s, 1)) {
    lines.push(
      { text: 'Спасибо за Барсика! Держи пряник — бабушкин рецепт, с мёдом.' },
      { text: 'А ещё я знаю: на поляне за деревней светлячки ловят чьи-то слова, как искры. Собери 12 огоньков — быть может, это твои строки?', choices: [{ label: 'Соберу', effect: 'fireflyQuest' }] },
    );
  } else if (!s.fireflyReward && s.fireflies >= 12) {
    lines.push(
      { text: 'Двенадцать светлячков! Ты слышал, как они пели твою строку?' },
      { text: 'Вот твоя награда — банка света. Она пригодится в лунную ночь, когда будешь дописывать балладу.', choices: [{ label: 'Спасибо, Милица', effect: 'fireflyReward' }] },
    );
  } else {
    lines.push(
      { text: 'Долина улыбается, Володька. Приходи ещё — Барсик будет рад.', choices: [{ label: 'Обязательно', effect: 'thanks' }] },
    );
  }
  return { speaker: 'Милица', portrait: PORTRAITS.milica, lines };
}

export function melnikDialogue(s: GameState): DialogueDef {
  const lines: DL[] = [];
  if (s.lanterns < 5) {
    lines.push(
      { text: 'Володька! Ветер умер, слышишь? Крылья молчат третий день, и моя строка спит в жерновах.' },
      { text: 'Зажги пять фонарей вдоль дороги к мельнице — огонь разбудит ветер. А ветер принесёт строку.', choices: [{ label: 'Зажгу фонари', effect: 'millQuest' }] },
    );
  } else if (!hasStanza(s, 2)) {
    lines.push(
      { text: 'Слышишь? Крылья скрипят! Ветер вернулся в долину...' },
      { text: 'Ступай внутрь мельницы — там, в лучах пыли, ждёт твоя строка.', choices: [{ label: 'Иду', effect: 'thanks' }] },
    );
  } else {
    lines.push(
      { text: 'Муку мелю, ветер хвалю. Строка твоя в жерновах не затерялась — она теперь в балладе.', choices: [{ label: 'Спасибо, Пахом', effect: 'thanks' }] },
    );
  }
  return { speaker: 'Мельник Пахом', portrait: PORTRAITS.melnik, lines };
}

export function kotDialogue(s: GameState): DialogueDef {
  const choices: { label: string; effect: string }[] = [];
  if (!s.catBack) choices.push({ label: 'Взять на руки', effect: 'takeCat' });
  choices.push({ label: 'Погладить', effect: 'petCat' });
  return {
    speaker: 'Барсик',
    portrait: PORTRAITS.kot,
    lines: [
      { text: 'Муррр...', choices },
    ],
  };
}

export function kozaDialogue(): DialogueDef {
  return {
    speaker: 'Коза Маланья',
    portrait: '',
    lines: [
      { text: 'Ме-е-е! (Маланья смотрит на тебя с глубочайшим одобрением)', choices: [{ label: 'Погладить', effect: 'petKoza' }] },
    ],
  };
}

const VILLAGER_LINES = [
  'Добрый вечер, Володька. Долина скучала по тебе.',
  'Слышал, твои стихи по полям гуляют? Поймаешь — прочитай нам.',
  'Дуб видел, как луна гасла. Спроси его — он помнит всё.',
  'Светлячки нынче поют. Говорят, к добру.',
  'Милица всё ищет своего Барсика. Кот — он хитрый, вернётся.',
];

export function villagerDialogue(): DialogueDef {
  return {
    speaker: 'Житель долины',
    portrait: '',
    lines: [{ text: VILLAGER_LINES[Math.floor(Math.random() * VILLAGER_LINES.length)], choices: [{ label: 'Бывай', effect: 'thanks' }] }],
  };
}
