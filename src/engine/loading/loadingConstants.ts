export const LOADING_DEFAULT_MESSAGE = 'Загрузка...';

export const LOADING_TITLE_TEXT = 'ВОЛОДЬКА';

export const LOADING_SUBTITLE_TEXT = 'сказка между сменами';

export const LOADING_DEDICATION_TEXT = 'Памяти Владимира Лебедева';

export const LOADING_QUOTE_SEED = 0x4c04_0001;

/** v4.48.16: 34 → 14 строк (репорт игрока: «экран очень долгий и бесполезный»).
 *  Оставлены только фирменные строки; балласт (cgroup, e820, eth0, neon,
 *  combat) удалён. Хронометраж гарантирует PrologueBootConsole —
 *  time-proportional reveal укладывает весь лог в bootTotalTargetMs. */
export const BOOT_LINES = [
  '[    0.000000] Linux version 6.8.0-volodka (gcc 13.2.0) #1 SMP PREEMPT_DYNAMIC',
  '[    0.000001] Command line: BOOT_IMAGE=/vmlinuz root=UUID=a3f7e2c1 ro quiet splash',
  '[    0.045678] DMI: Volodka Industries VOR-9000/CyberMainboard, BIOS 2.0.77',
  '[    0.093456] Loading poem_power.ko ... OK',
  '[    0.094567] Loading karma_engine.ko ... OK',
  '[    0.097890] volodka-security: Initializing karma firewall',
  '[    0.098901] volodka-quest: Quest tracker initialized (0/∞ active)',
  '[    0.099012] volodka-poetry: 13 poem fragments detected in memory',
  '[    0.099012] Mounting /dev/soul0 on /type/stories ... OK',
  '[    0.102345] volodka-physics: Rapier3D collider system ready',
  '[    0.104567] volodka-memory: Loading story nodes from /dev/destiny0',
  '[    0.110123] systemd[1]: Started Volodka RPG Engine v0.5.0',
  '[    0.111234] systemd[1]: Starting В О Л О Д Ь К А ...',
  '[    0.112345] ██ BOOT COMPLETE ██',
] as const;

export const POEM_QUOTES = [
  'Смерть есть лишь начало.',
  'И что-то пошло не так...',
  'Если знаешь куда идти — то и боги не встанут поперёк пути.',
  'Быть шутом в глазах людей — для него подобно смерти.',
  'Я камень. Домом служит сырая земля.',
  'Мой город не отпустит меня к тебе.',
  'Sic itur ad astra — так шествуют к звёздам.',
  'В этом мире никогда не выживают те, кто с детства витает в мыслях.',
  'Мы стремимся ради других...',
  'Вся клевета — вернётся в сто крат.',
  'Обязательно подумаю, интересная идея...',
  'Ну а тебе, друг мой! Глаголю я... от сердца!',
  'Ты держишь в руках куски того, что ещё не забыто.',
] as const;

export const TIPS = [
  'Исследуйте каждый уголок — скрытые стихи ждут в неожиданных местах.',
  'Поговорите с NPC несколько раз — их реплики меняются в зависимости от отношений.',
  'Стихи дают способности — используйте их в трудных ситуациях.',
  'Карма влияет на доступные выборы — каждый поступок имеет значение.',
  'Энергия тратится на действия — отдыхайте, чтобы восстановить силы.',
  'Нажмите E рядом с NPC, чтобы начать разговор.',
  'Используйте стихи-способности, чтобы обойти препятствия в заданиях.',
  'Стресс влияет на доступные варианты — не доводите себя до предела.',
  'WASD — движение, Shift — бег, Space — прыжок, E — взаимодействие.',
  'Нажмите 1, 2, 3 для быстрого выбора в диалогах.',
  'Собранные стихи можно перечитывать в книге стихов.',
  'У каждого NPC свой характер — подбирайте подход к каждому.',
] as const;

export const LOADING_MESSAGE_ID = 'loading-message';

/** Scene-aware tips — keyed by loading message substring, fallback to general tips */
export const SCENE_TIPS: Record<string, readonly string[]> = {
  'Квартира': [
    'Исследуйте каждый уголок — скрытые стихи ждут в неожиданных местах.',
    'Поговорите с NPC несколько раз — их реплики меняются.',
  ],
  'Улицы': [
    'WASD — движение, Shift — бег, Space — прыжок.',
    'Карма влияет на доступные выборы — каждый поступок имеет значение.',
  ],
  'Подвал': [
    'Стихи дают способности — используйте их в трудных ситуациях.',
    'Стресс влияет на доступные варианты — не доводите себя до предела.',
  ],
  'Бой': [
    'Используйте стихи-способности, чтобы обойти препятствия.',
    'У каждого врага есть слабость — изучите её перед атакой.',
  ],
  'Торгов': [
    'Собранные предметы можно продать или использовать для крафта.',
    'Проверяйте инвентарь — иногда ключи скрываются среди лута.',
  ],
};

/** Get scene-relevant tips, falling back to general TIPS */
export function getLoadingTips(message: string): readonly string[] {
  for (const [key, tips] of Object.entries(SCENE_TIPS)) {
    if (message.includes(key)) return tips;
  }
  return TIPS;
}
