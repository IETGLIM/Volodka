import type { StoryNode } from '@/shared/types/game';

/** Story beats for Алина «Солныш», Лёня, Умка and their room. */
export const STORY_NODES_SOLNYSH: Record<string, StoryNode> = {
  solnysh_door: {
    id: 'solnysh_door',
    text: 'Ты входишь в комнату Солныш и Лёни. Пахнет кофе, маслом и тёплыми коврами. На мольберте — недописанный макет, у окна — жаровня для зёрен. Умка сразу бросается к тебе, виляя хвостиком-пушком.',
    speaker: 'narrator',
    sceneId: 'solnysh_room',
    choices: [
      { text: 'Осмотреться', next: 'solnysh_explore_mode', goldenPath: true },
      { text: 'Поговорить с Солныш', next: 'solnysh_room_talk' },
      { text: 'Вернуться в коридор', next: 'corridor_explore_mode', effects: [{ type: 'transitionScene', sceneId: 'volodka_corridor' }] },
    ],
  },

  solnysh_explore_mode: {
    id: 'solnysh_explore_mode',
    text: 'Ковры на полу, акварели на стенах, на полке — фотографии из гимназии. Солныш и Лёня живут здесь уже много лет — рядом с тобой, как в детстве.',
    speaker: 'narrator',
    sceneId: 'solnysh_room',
    choices: [
      { text: 'Поговорить с Солныш', next: 'solnysh_room_talk', goldenPath: true },
      { text: 'Поговорить с Лёней', next: 'lyonya_room_talk' },
      { text: 'Вернуться в коридор', next: 'corridor_explore_mode', effects: [{ type: 'transitionScene', sceneId: 'volodka_corridor' }] },
      { text: 'Свободно исследовать', next: 'solnysh_explore_mode' },
    ],
  },

  solnysh_room_talk: {
    id: 'solnysh_room_talk',
    text: 'Солныш откладывает кисть и смотрит на тебя голубыми глазами. «Володька… Ты знаешь, иногда мне кажется, что город съедает всех нас. Но когда ты рядом — легче дышать.»',
    speaker: 'Солныш',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Всё не так плохо — тебя любят и мы рядом',
        next: 'solnysh_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'solnysh_comforted', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 8 } },
          { type: 'addKarma', value: 5 },
          { type: 'triggerQuest', questId: 'solnysh_comfort' },
        ],
      },
      {
        text: 'Расскажи, что тебя тревожит',
        next: 'solnysh_comfort_deep',
      },
      {
        text: 'У меня есть вино — пойдём на крышу?',
        next: 'solnysh_wine_offer',
        condition: { flag: 'has_solnysh_wine' },
      },
      {
        text: 'Ты думала о переезде?',
        next: 'solnysh_relocation_talk',
        condition: { flag: 'solnysh_roof_toast_done' },
      },
      { text: 'Побуду рядом молча', next: 'solnysh_explore_mode' },
    ],
  },

  solnysh_comfort_deep: {
    id: 'solnysh_comfort_deep',
    text: '«Мы с тобой прошли столько… Гимназия, первые стихи, первые падения. Иногда кажется, что я не справлюсь. Но ты всегда возвращался — и я верила снова.»',
    speaker: 'Солныш',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Я здесь. Ты не одна.',
        next: 'solnysh_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'solnysh_comforted', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 10 } },
          { type: 'addSkill', skill: 'empathy', value: 2 },
        ],
      },
    ],
  },

  lyonya_room_talk: {
    id: 'lyonya_room_talk',
    text: 'Лёня наливает свежий кофе. «Солныш сегодня тихая. Если можешь — побудь с ней. А вот бутылку вина я прятал за шкафом — на особый случай.»',
    speaker: 'Лёня',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Спасибо, Лёня',
        next: 'solnysh_explore_mode',
        effects: [{ type: 'setFlag', flag: 'lyonya_wine_hint', flagValue: true }],
      },
    ],
  },

  solnysh_wine_offer: {
    id: 'solnysh_wine_offer',
    text: 'Солныш улыбается сквозь усталость: «Вино? С тобой на крышу?.. Ладно. Только не давай мне разлить — руки дрожат от радости.»',
    speaker: 'Солныш',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Пойдём — поднимемся вместе',
        next: 'solnysh_roof_arrival',
        effects: [
          { type: 'setFlag', flag: 'solnysh_wine_offered', flagValue: true },
          { type: 'transitionScene', sceneId: 'rooftop_edge' },
        ],
      },
      { text: 'Ещё рано', next: 'solnysh_explore_mode' },
    ],
  },

  solnysh_roof_arrival: {
    id: 'solnysh_roof_arrival',
    text: 'Вы поднимаетесь на крышу. Город внизу — море огней. Алина — твоя Солныш — прижимается плечом и шепчет: «Спасибо, что ты есть, солнце!»',
    speaker: 'Солныш',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Обнять её и молчать',
        next: 'solnysh_roof_afterglow',
        effects: [
          { type: 'setFlag', flag: 'solnysh_roof_toast_done', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 12 } },
          { type: 'addKarma', value: 8 },
          { type: 'addStat', stat: 'stress', value: -15 },
        ],
      },
    ],
  },

  solnysh_roof_afterglow: {
    id: 'solnysh_roof_afterglow',
    text: 'Ветер треплет её светлые волосы. На мгновение город кажется не враждебным, а просто далёким — как фон для двух людей, которые знают друг друга с детства.',
    speaker: 'narrator',
    sceneId: 'rooftop_edge',
    choices: [
      {
        text: 'Спуститься домой',
        next: 'solnysh_explore_mode',
        effects: [{ type: 'transitionScene', sceneId: 'solnysh_room' }],
      },
    ],
  },

  solnysh_relocation_talk: {
    id: 'solnysh_relocation_talk',
    text: '«Лёня получил предложение — обжарщик в другой стране. Я боюсь. Но и хочу попробовать. Если ты скажешь, что мы не слабы — может, решимся.»',
    speaker: 'Солныш',
    sceneId: 'solnysh_room',
    choices: [
      {
        text: 'Я поддержу ваш переезд — вы справитесь',
        next: 'solnysh_explore_mode',
        effects: [
          { type: 'setFlag', flag: 'solnysh_relocation_supported', flagValue: true },
          { type: 'npcChange', npcId: 'vera', npcChange: { relation: 15 } },
          { type: 'npcChange', npcId: 'lyonya', npcChange: { relation: 10 } },
          { type: 'addKarma', value: 10 },
          { type: 'triggerQuest', questId: 'solnysh_relocation' },
        ],
      },
      {
        text: 'Останьтесь — город ещё может измениться',
        next: 'solnysh_explore_mode',
        effects: [{ type: 'npcChange', npcId: 'vera', npcChange: { relation: -3 } }],
      },
    ],
  },
};
