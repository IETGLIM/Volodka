// ============================================
// ЗОЛОТОЙ ПУТЬ — основная линия к одному из финалов
// ============================================
// Опирается на:
// - узлы `STORY_NODES` + эффекты `questOperations` / `questObjective` в сюжете;
// - квесты `QUEST_DEFINITIONS` и стартовый набор в gameStore (`main_goal`, `first_words`);
// - автопрогресс по событиям в `useQuestProgress` (location_visited, npc_talked, poem_collected);
// - ветвления с `dialogueNpcId` → `DialogueRenderer` + `DialogueEngine` (processDialogueChoice / startDialogue).
//
// Канон для «один проход до титров»: финал **Создатель** (`ending_creator`).
// Условие выбора в `ending_choice`: завершён `first_words` + минимум 2 завершённых квеста всего.

/** Финал золотого пути (тип `ending` + cutscene `finale`). */
export const GOLDEN_PATH_TARGET_ENDING_NODE_ID = 'ending_creator' as const;

/** Квесты, которые золотой путь гарантированно затрагивает (старт/завершение через сюжет). */
export const GOLDEN_PATH_QUEST_SPINE: readonly string[] = ['main_goal', 'first_words', 'first_reading'];

/** Завершается веткой «Писать — до утра» в `crisis_choice` → `volunteer_read_result` (полное main_goal). */
export const GOLDEN_PATH_OPTIONAL_FULL_LEGACY_QUEST_IDS: readonly string[] = ['poetry_collection'];

/**
 * Узлы по порядку «скелета» (без альтернатив внутри узла).
 * Между соседними шагами допускаются вставки (диалоги NPC, мини-игры), если ведут в тот же `next`.
 */
export const GOLDEN_PATH_STORY_SPINE: readonly { nodeId: string; note: string }[] = [
  { nodeId: 'start', note: 'Пролог офис' },
  { nodeId: 'start_2', note: 'Алерт; любой выбор → start_diagnosis (или ветка диалога → туда же)' },
  { nodeId: 'start_diagnosis', note: 'Kibana / старт IT-квестов' },
  { nodeId: 'database_analysis', note: 'Внутренний монолог → fix_choice' },
  { nodeId: 'fix_choice', note: 'Откат / патч → fix_success' },
  { nodeId: 'fix_success', note: 'Закрытие инцидента → lunch_time' },
  { nodeId: 'lunch_time', note: 'Столовая → colleagues_talk' },
  { nodeId: 'colleagues_talk', note: 'Любой ответ → after_lunch' },
  { nodeId: 'after_lunch', note: 'Вечер: «Домой» (кратчайший путь к дому)' },
  { nodeId: 'go_home', note: 'Квартира' },
  { nodeId: 'home_alone', note: 'Внутренний голос → любой → evening_choice' },
  {
    nodeId: 'evening_choice',
    note: 'Выбрать «Писать» (first_words) или цепочку фото→стих→сон; для кафе нужен завершённый first_words',
  },
  { nodeId: 'write_evening', note: 'Мини-игра стиха' },
  { nodeId: 'write_evening_result', note: 'Завершает first_words; +1 к main_goal.write_poems' },
  { nodeId: 'sleep_alone', note: 'Сон → dream_sequence' },
  { nodeId: 'dream_sequence', note: 'Сон с Лилиан → dream_interpretation → friday_arrives' },
  { nodeId: 'friday_arrives', note: 'Выбрать «В кафе Синяя Яма»' },
  { nodeId: 'blue_cat_cafe', note: 'Старт first_reading + цель go_to_cafe' },
  { nodeId: 'cafe_atmosphere', note: 'Зал → open_mic' },
  {
    nodeId: 'open_mic',
    note: '«Поднять руку» / «готовился» → чтение; не «не сейчас» (иначе нет read_poem)',
  },
  { nodeId: 'read_poetry', note: 'Или read_poetry_confident при флаге prepared_for_reading' },
  { nodeId: 'after_reading', note: 'Аплодисменты → stranger_approach' },
  { nodeId: 'stranger_approach', note: 'Любой ответ Виктории — засчитывается meet_someone' },
  { nodeId: 'cafe_end', note: 'Выход из кафе → завершится first_reading при всех целях' },
  { nodeId: 'evening_choice_act2', note: 'Воскресенье → reflection → next_friday' },
  { nodeId: 'next_friday', note: '«Спуститься» → second_cafe_visit (линия к Акту 3)' },
  { nodeId: 'second_cafe_visit', note: 'Второй визит в «Синюю Яму»' },
  { nodeId: 'victoria_reading', note: 'Она читает → reading_reaction' },
  {
    nodeId: 'reading_reaction',
    note: 'Диалог с Викторией; кратчайший мост к act2_bridge: maria_warm → victoria_hand → cafe_evening_end',
  },
  { nodeId: 'maria_warm', note: 'Откровение Виктории → victoria_hand' },
  { nodeId: 'victoria_hand', note: 'Рука в руке → cafe_evening_end' },
  { nodeId: 'cafe_evening_end', note: 'Домой → act2_bridge' },
  { nodeId: 'act2_bridge', note: 'Мост недель → act2_dilemma' },
  {
    nodeId: 'act2_dilemma',
    note: 'Позвонить Виктории / не звонить / написать — все ведут в act3_start',
  },
  { nodeId: 'act3_start', note: 'Кризис декабря → crisis_choice' },
  {
    nodeId: 'crisis_choice',
    note: 'Для полного main_goal: «Писать до утра» → volunteer_read → poetry_collection + write_poems=10; иначе звонок маме / прошлое / IT',
  },
  { nodeId: 'volunteer_read_result', note: 'Опционально для наследия; не обязателен для ending_creator' },
  { nodeId: 'ending_choice', note: 'Выбор «Писать — это мой путь» при ≥2 завершённых квестах' },
  { nodeId: GOLDEN_PATH_TARGET_ENDING_NODE_ID, note: 'Титры Создатель' },
];

/** Явные развилки (текст выбора как в данных — для читабельности дизайнера). */
export const GOLDEN_PATH_BRANCH_HINTS: readonly { atNodeId: string; choose: string; nextNodeId: string }[] = [
  { atNodeId: 'start_2', choose: 'Начать диагностику', nextNodeId: 'start_diagnosis' },
  { atNodeId: 'after_lunch', choose: 'Домой — там привычно', nextNodeId: 'go_home' },
  { atNodeId: 'evening_choice', choose: 'Писать — настроение подходящее', nextNodeId: 'write_evening' },
  { atNodeId: 'friday_arrives', choose: 'В кафе "Синяя Яма" — литературный вечер', nextNodeId: 'blue_cat_cafe' },
  { atNodeId: 'open_mic', choose: 'Поднять руку', nextNodeId: 'read_poetry' },
  { atNodeId: 'next_friday', choose: 'Спуститься — я хочу быть здесь', nextNodeId: 'second_cafe_visit' },
  {
    atNodeId: 'reading_reaction',
    choose: '"Я ищу выход. Из одиночества, из рутины, из себя"',
    nextNodeId: 'maria_warm',
  },
  {
    atNodeId: 'crisis_choice',
    choose: 'Писать — до утра. Собрать все стихи вместе',
    nextNodeId: 'volunteer_read',
  },
  {
    atNodeId: 'ending_choice',
    choose: 'Писать — это мой путь. Мой голос',
    nextNodeId: GOLDEN_PATH_TARGET_ENDING_NODE_ID,
  },
];
