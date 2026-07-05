export const QUEST_ACCEPT_CLOSE_DELAY_MS = 400;

export const QUEST_ACCEPT_DIALOG_LABELS = {
  accept: 'Принять квест',
  acceptButton: 'ПРИНЯТЬ',
  decline: 'Отклонить квест',
  declineButton: 'ОТКЛОНИТЬ',
  close: 'Закрыть диалог',
  closeButton: 'ЗАКРЫТЬ',
  dialogRegion: 'Диалог принятия квеста',
  openedAnnouncement: (title: string) => `Открыт квест: ${title}`,
  objectivesHeading: 'ЦЕЛИ:',
  rewardsHeading: 'НАГРАДЫ:',
  relationship: 'Отношения:',
  difficulty: 'Сложность:',
  giverNotFound: 'ЗАКАЗЧИК НЕ НАЙДЕН',
  selfInitiated: 'САМОСТОЯТЕЛЬНОЕ ЗАДАНИЕ',
  poemBypass: 'Можно обойти с помощью стихотворения',
  unknownGiverPortrait: 'Неизвестный заказчик',
  npcPortrait: (name: string) => `Портрет ${name}`,
  npcPortraitDesc: 'Стилизованный силуэт персонажа',
  questType: {
    main: 'ОСНОВНОЕ',
    side: 'ПОБОЧНОЕ',
    hidden: 'ТАЙНОЕ',
    daily: 'ЕЖЕДНЕВНОЕ',
  } as const,
  objectiveType: {
    npc_talked: 'Поговорить',
    location_visited: 'Посетить локацию',
    item_collected: 'Собрать предмет',
    poem_collected: 'Собрать стих',
    flag_set: 'Выполнить условие',
    minigame_completed: 'Пройти мини-игру',
    custom: 'Цель',
  } as const,
  reward: {
    addSkill: (skill: string, value: number) => `${skill} +${value}`,
    addKarma: (value: number) => `Карма +${value}`,
    addXp: (value: number) => `Опыт +${value}`,
    addCredits: (value: number) => `Кредиты +${value}`,
    addItem: (itemId: string) => `Предмет: ${itemId}`,
    setFlag: (flag: string) => `Флаг: ${flag}`,
    fallback: (type: string) => type,
  } as const,
} as const;

export const QUEST_TYPE_BADGE_COLORS: Record<'main' | 'side' | 'hidden' | 'daily', string> = {
  main: '#ff6644',
  side: '#66ccff',
  hidden: '#cc66ff',
  daily: '#aaaaaa',
};

export const QUEST_ACCEPT_ACCENT = {
  cyan: '#00ffee',
  cyanDim: 'rgba(0,255,238,0.3)',
  text: '#e0f8f8',
  description: '#aacccc',
  muted: '#888',
} as const;
