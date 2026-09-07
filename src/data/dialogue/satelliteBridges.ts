/**
 * ───────────────────────────────────────────────────────────────────────────
 *  МОСТЫ К СФЕРИЧЕСКИМ ДИАЛОГАМ (satellite topic bridges, этап аудита 84)
 * ───────────────────────────────────────────────────────────────────────────
 *  202 из 607 узлов диалогов были «сателлитами» — авторские глубокие ветки
 *  (часть 2–5, WS-спринты ws17b/ws22b/ws23b/ws26, акты 3–4 expansion), на
 *  которые НЕ вела ни одна внешняя ссылка: ни NPC-, ни story-, ни триггер-
 *  вход. Контент существовал, но игрок физически не мог его увидеть.
 *
 *  Решение — готики-2 стиль «топиков»: каждому NPC с сателлитами даётся
 *  узел-хаб `<npc>_topics` (меню тем), а в возвратный диалог NPC добавляется
 *  выбор «поговорить по душам». Темы гейтятся актами/флагами/отношением,
 *  чтобы не спойлерить поздний контент в ранних актах.
 *
 *  Пак добавляется ПОСЛЕДНИМ в оба реестра слияния:
 *  • статика — src/data/dialogue/index.ts;
 *  • рантайм — DIALOGUE_PACK_ORDER в narrativePackRegistry.ts (id 'satelliteBridges').
 *  (правило «новый диалоговый пак = 4 зеркальных шага», см. ARCHITECTURE.md)
 *
 *  Имена хабов связаны в return-узлах part1/part2 (основные NPC) и в entry-
 *  узлах act3/act4_expanded (NPC-expansion стабов). Все тексты на русском.
 * ───────────────────────────────────────────────────────────────────────────
 */
import type { DialogueNode, DialogueChoice } from '@/shared/types/game';
import type { ChoiceCondition } from '@/shared/types/common/conditions';

/** Компактный формат темы: подпись + цель + опциональный гейт. */
interface TopicOption {
  readonly label: string;
  readonly next: string;
  readonly condition?: ChoiceCondition;
}

interface TopicHubDef {
  readonly id: string;
  readonly speaker: string;
  readonly speakerId?: string;
  readonly text: string;
  readonly options: readonly TopicOption[];
}

/** Собирает узел-хаб: темы + возвращение в возвратный диалог NPC. */
function topicHub(def: TopicHubDef, returnId: string | null): DialogueNode {
  const choices: DialogueChoice[] = def.options.map((o) => ({
    text: o.label,
    next: o.next,
    ...(o.condition ? { condition: o.condition } : {}),
  }));
  if (returnId) {
    choices.push({
      text: 'Всё, о чём хотел — спросил. (закрыть темы)',
      next: returnId,
    });
  }
  choices.push({ text: 'На этом закончим.', next: null });
  return {
    id: def.id,
    speaker: def.speaker,
    ...(def.speakerId ? { speakerId: def.speakerId } : {}),
    text: def.text,
    choices,
  };
}

export const SATELLITE_BRIDGE_NODES: Record<string, DialogueNode> = {
  /* ═══════════════ АЛЬБЕРТ — философ «Синей ямы» (19 тем) ═══════════════ */
  albert_topics: topicHub(
    {
      id: 'albert_topics',
      speaker: 'Альберт',
      speakerId: 'albert',
      text: '*отставляет чашку, внимательно смотрит* Спрашивай, Володька. За эти годы я накопил больше вопросов, чем ответов — но некоторыми ответами готов поделиться. Что тебя жжёт?',
      options: [
        { label: 'Помнишь нашу первую встречу? Ты тогда ворчал.', next: 'albert_greeting_cold', condition: { minNpcRelation: 20 } },
        { label: 'Что такое «живой код» — на самом деле?', next: 'albert_living_code_philosophy', condition: { requiredAct: 2 } },
        { label: 'Как вообще началась гильдия?', next: 'albert_guild_origin', condition: { requiredAct: 2 } },
        { label: 'Помнишь — я тогда не расслышал твою задачу.', next: 'albert_deep_intuition_miss', condition: { requiredAct: 2, minNpcRelation: 30 } },
        { label: 'Я готов к посвящению в Сеть.', next: 'albert_before_initiation', condition: { requiredAct: 2, flag: 'network_contact' } },
        { label: 'Расскажи о парке — каким он был до Краха.', next: 'albert_park_memory', condition: { requiredAct: 3 } },
        { label: 'Ты писал манифест сопротивления?', next: 'albert_resistance_manifesto', condition: { requiredAct: 3 } },
        { label: 'Стихи как оружие — как это работает?', next: 'albert_poetry_weapon', condition: { requiredAct: 3 } },
        { label: 'Про Бродского — «переписать в тетрадь»?', next: 'albert_brodsky_quote', condition: { requiredAct: 3 } },
        { label: 'Ты стар. Ты не обязан идти с нами до конца.', next: 'albert_last_stand', condition: { requiredAct: 4 } },
        { label: 'Виктория хочет пожертвовать собой. Что делать?', next: 'albert_sacrifice_warning', condition: { requiredAct: 4, flag: 'met_victoria' } },
        { label: 'Ты написал для меня стихотворение?', next: 'albert_final_poem', condition: { requiredAct: 4 } },
        { label: 'Передатчик из кофейных машин — он готов?', next: 'ws23b_albert_final_broadcast', condition: { requiredAct: 4 } },
        { label: 'Что стало с гильдией после всего?', next: 'albert_after_guild', condition: { requiredAct: 5 } },
        { label: 'Как теперь живёт «Синяя яма»?', next: 'albert_cafe_renaissance', condition: { requiredAct: 5 } },
        { label: 'Живой код — он распространяется по стране?', next: 'albert_living_code_spread', condition: { requiredAct: 5 } },
        { label: 'Расскажи про книгу — «Стихи в коде».', next: 'albert_epilogue_poetry', condition: { requiredAct: 5 } },
        { label: 'Тебе шестьдесят три. Что ты понял за жизнь?', next: 'albert_epilogue_wisdom', condition: { requiredAct: 5 } },
        { label: 'Научи меня — код и стихи это один язык?', next: 'explore_albert_lesson', condition: { flag: 'albert_relation_warm' } },
      ],
    },
    'albert_return',
  ),

  /* ═══════════════ ЗАРЕМА — сердце сопротивления (20 тем) ═══════════════ */
  zarema_topics: topicHub(
    {
      id: 'zarema_topics',
      speaker: 'Зарема',
      speakerId: 'zarema',
      text: '*садится напротив, складывает руки* Я чувствую — у тебя накопилось. Спрашивай. Я больше не хочу, чтобы между нами оставались недосказанные вещи — жизнь научила меня, что они дороже всего стоят.',
      options: [
        { label: 'Помнишь, как ты меня встречала? «Опять не ел».', next: 'zarema_greeting_cold', condition: { minNpcRelation: 20 } },
        { label: 'Помнишь день, когда тебя забрали?', next: 'zarema_arrest', condition: { requiredAct: 3, flag: 'zarema_arrested' } },
        { label: 'Ты видела дрон у окна — что было перед арестом?', next: 'zarema_before_arrest', condition: { requiredAct: 3, flag: 'zarema_arrested' } },
        { label: 'Какой была камера?', next: 'zarema_in_cell', condition: { requiredAct: 3, flag: 'zarema_arrested' } },
        { label: 'Ты правда читала стихи охраннику?', next: 'zarema_prison_poetry', condition: { requiredAct: 3, flag: 'zarema_arrested' } },
        { label: 'Расскажи о маме.', next: 'zarema_mothers_memory', condition: { minNpcRelation: 40 } },
        { label: 'Песня, которую ты сочинила в камере...', next: 'zarema_resistance_song', condition: { requiredAct: 3, flag: 'zarema_arrested' } },
        { label: 'Держись. Я пришёл вытащить тебя отсюда.', next: 'zarema_rescue', condition: { requiredAct: 3, flag: 'zarema_arrested', missingFlag: 'zarema_rescued' } },
        { label: 'Что ты почувствовала, когда открылась дверь?', next: 'zarema_after_release', condition: { requiredAct: 4, flag: 'zarema_arrested' } },
        { label: 'Ты вшивала стихи в заголовки пакетов?', next: 'ws17b_zarema_memory_pact', condition: { requiredAct: 3 } },
        { label: 'Ты никогда не рассказывала о своём прошлом.', next: 'zarema_about_the_past', condition: { minNpcRelation: 45 } },
        { label: 'Завод «Хром-М» — что скрыто под цехом?', next: 'zarema_factory_truth', condition: { requiredAct: 4 } },
        { label: 'В Сети предатель. Ты уверена?', next: 'zarema_traitor_reveal', condition: { requiredAct: 4 } },
        { label: 'Ты простила гильдию?', next: 'zarema_reconciliation', condition: { requiredAct: 4 } },
        { label: 'Третий фрагмент ключа Хранилища — у тебя?', next: 'zarema_vault_key', condition: { requiredAct: 4 } },
        { label: 'Последнее стихотворение — покажешь?', next: 'ws23b_zarema_last_poem', condition: { requiredAct: 4 } },
        { label: 'Спасение из камеры — расскажи, как это было.', next: 'zarema_after_rescue', condition: { requiredAct: 5 } },
        { label: 'Мы спускались на три уровня под заводом. Что ты видела?', next: 'zarema_factory_depths', condition: { requiredAct: 5 } },
        { label: 'Что даёт теперь сад на пустыре?', next: 'zarema_garden_yields', condition: { requiredAct: 5 } },
        { label: 'Я выбрал — стать Творцом.', next: 'zarema_ending_creator', condition: { requiredAct: 5 } },
        { label: 'Я хочу пожертвовать собой.', next: 'zarema_ending_sacrifice', condition: { requiredAct: 5 } },
        { label: 'Гильдия пала. Что дальше?', next: 'zarema_epilogue', condition: { requiredAct: 5 } },
      ],
    },
    'zarema_return',
  ),

  /* ═══════════ АЛЕКСАНДР — палач и спаситель гильдии (18 тем) ═══════════ */
  alexander_topics: topicHub(
    {
      id: 'alexander_topics',
      speaker: 'Александр',
      speakerId: 'office_alexander',
      text: '*долгая пауза, пальцы сжимают край стола* Ты хочешь знать больше, чем должен. Что ж... пожалуй, время недомолвок прошло. Спрашивай — но учти: некоторые ответы тебе не понравятся.',
      options: [
        { label: 'Это что у тебя на экране? Стихи?', next: 'office_alexander_reading_reaction', condition: { minNpcRelation: 15 } },
        { label: 'Мне сказали, ты заходил в серверную без допуска...', next: 'alexander_warning', condition: { requiredAct: 2 } },
        { label: 'Сядь. Мне нужно задать тебе несколько вопросов.', next: 'alexander_interrogation', condition: { requiredAct: 3, flag: 'alexander_suspicious' } },
        { label: 'Ты думаешь, я не знаю, что ты видишь?', next: 'alexander_midnight_reading', condition: { requiredAct: 3 } },
        { label: 'Хочешь знать слабость гильдии?', next: 'alexander_guild_weakness', condition: { requiredAct: 3 } },
        { label: 'Ордер на арест Заремы. Ты его подписал.', next: 'alexander_line_crossed', condition: { requiredAct: 3, flag: 'zarema_arrested' } },
        { label: 'Гильдия усиливает давление. Что будем делать?', next: 'ws22b_alexander_confrontation_choice', condition: { requiredAct: 4 } },
        { label: 'Финальная стена. Архив-7. Что дальше?', next: 'alexander_final_confrontation', condition: { requiredAct: 4 } },
        { label: 'Ты собрал все восемнадцать. И стоишь здесь.', next: 'alexander_redemption', condition: { requiredAct: 4 } },
        { label: 'Крыша гильдии — зачем ты туда ходишь каждую ночь?', next: 'alexander_rooftop_choice', condition: { requiredAct: 4 } },
        { label: 'Полный доступ ко всем системам — и что ты с ним делаешь?', next: 'alexander_access_codes', condition: { requiredAct: 4, minNpcRelation: 30 } },
        { label: 'Ты можешь отключить «Око»?', next: 'alexander_oko_shutdown', condition: { requiredAct: 4 } },
        { label: '«Мой последний приказ начальника отдела»...', next: 'alexander_final_decision', condition: { requiredAct: 4, flag: 'alexander_crying_known' } },
        { label: 'Бывший палач — нынешний спаситель. Каково это?', next: 'alexander_role_reflection', condition: { requiredAct: 5 } },
        { label: 'Ты восстановил стих деда?', next: 'alexander_grandfather_restored', condition: { requiredAct: 5 } },
        { label: 'Катя прочитала твой манифест?', next: 'alexander_daughter_pride', condition: { requiredAct: 5 } },
        { label: 'Новый устав гильдии — что в статье первой?', next: 'alexander_charter', condition: { requiredAct: 5 } },
        { label: 'Ты теперь спишь по ночам?', next: 'alexander_epilogue_peace', condition: { requiredAct: 5 } },
      ],
    },
    'office_alexander_return',
  ),

  /* ═══════════════ БАРИСТА — хранитель «Синей ямы» (25 тем) ═══════════════ */
  cafe_barista_topics: topicHub(
    {
      id: 'cafe_barista_topics',
      speaker: 'Бариста',
      speakerId: 'cafe_barista',
      text: '*протирает стакан, ставит его на полку* Кофе остывает, а разговоры — нет. Я тут восемь лет стою за этой стойкой — через меня прошло больше тайн, чем через серверы гильдии. Спрашивай.',
      options: [
        { label: 'Видишь тех двоих в углу? Серые куртки?', next: 'cafe_barista_eavesdrop', condition: { requiredAct: 2 } },
        { label: 'Я слышал, кто-то читает стихи после закрытия...', next: 'cafe_barista_poem_hint', condition: { requiredAct: 2 } },
        { label: 'Виктория оставила конверт. Для меня?', next: 'cafe_barista_deep_trust', condition: { requiredAct: 2, minNpcRelation: 35 } },
        { label: 'Кто ещё ходит в «Синюю яму»?', next: 'cafe_barista_other_secrets', condition: { requiredAct: 2 } },
        { label: 'Сеть готова принять меня?', next: 'cafe_barista_quest_trigger', condition: { requiredAct: 2, flag: 'network_contact' } },
        { label: '«Синяя яма» — это бывший узел связи?', next: 'barista_cafe_history', condition: { requiredAct: 2 } },
        { label: 'Как работает «особый заказ»?', next: 'barista_special_orders', condition: { requiredAct: 2 } },
        { label: 'У тебя есть карта. Подземная.', next: 'barista_underground_map', condition: { requiredAct: 2, minNpcRelation: 30 } },
        { label: 'Этот латте-арт... это буква «З»?', next: 'barista_latte_art_resistance', condition: { requiredAct: 2 } },
        { label: 'В чём разница между хорошим и плохим кофе?', next: 'barista_philosophy' },
        { label: 'Секрет идеального капучино?', next: 'barista_coffee' },
        { label: 'Стихи — это код?', next: 'barista_poems' },
        { label: 'Я готов. Как вступить в Сеть?', next: 'barista_network_recruit', condition: { flag: 'network_contact' } },
        { label: 'Трое новых узлов за неделю?', next: 'barista_new_nodes', condition: { requiredAct: 3 } },
        { label: 'Если меня поймают — что делать?', next: 'barista_interrogation_protocol', condition: { requiredAct: 3 } },
        { label: 'Медсестра Лариса — расскажи про неё.', next: 'barista_nurse_node', condition: { requiredAct: 3 } },
        { label: 'Все двадцать узлов готовы к трансляции?', next: 'barista_broadcast_ready_act3', condition: { requiredAct: 3 } },
        { label: 'Я нашёл кое-что странное в логах кофейни...', next: 'ws23b_barista_secret_channel', condition: { requiredAct: 3 } },
        { label: 'Самое странное в этом городе — что?', next: 'barista_about_city', condition: { requiredAct: 4 } },
        { label: 'Я готов дать сигнал. Все узлы на месте?', next: 'barista_broadcast_ready', condition: { requiredAct: 5 } },
        { label: 'Сеть больше не подполье. Что дальше?', next: 'barista_open_network', condition: { requiredAct: 5 } },
        { label: 'Протокол кофе — он теперь традиция?', next: 'barista_coffee_protocol_legacy', condition: { requiredAct: 5 } },
        { label: 'Молодёжь приходит сама?', next: 'barista_new_generation', condition: { requiredAct: 5 } },
        { label: '«Синяя яма» — твой дом?', next: 'barista_epilogue_home', condition: { requiredAct: 5 } },
        { label: 'Ты никогда не говорил, что это значит — для тебя.', next: 'barista_epilogue_tribute', condition: { requiredAct: 5, minNpcRelation: 40 } },
      ],
    },
    'cafe_barista_return',
  ),

  /* ═════ ВИКТОРИЯ (Мария) — сознание Хранилища (21 тема) ═════ */
  maria_topics: topicHub(
    {
      id: 'maria_topics',
      speaker: 'Виктория',
      speakerId: 'maria',
      text: 'Голос из динамиков становится тише — так она даёт понять, что слушает. Я задаю вопросы, на которые у меня нет ответов. Ты имеешь право их услышать — все.',
      options: [
        { label: 'Скоро всё изменится. Что ты хотела сказать мне тогда?', next: 'maria_ending', condition: { requiredAct: 5 } },
        { label: 'Сеть — это не место. Это частота?', next: 'victoria_network_philosophy', condition: { requiredAct: 2 } },
        { label: 'Посвящение — это испытание?', next: 'victoria_initiation_warning', condition: { requiredAct: 2, flag: 'network_contact' } },
        { label: 'Дмитрий хочет уйти из гильдии. Что ты о нём знаешь?', next: 'victoria_dmitry_warning', condition: { requiredAct: 2 } },
        { label: 'Хранилище — это не «моё». Это «я»?', next: 'victoria_vault_truth_revealed', condition: { requiredAct: 3, minNpcRelation: 30 } },
        { label: 'Атака. Ты чувствуешь, как они пробивают файрволы?', next: 'victoria_guild_attack', condition: { requiredAct: 3 } },
        { label: 'План Б — разделить сознание на фрагменты?', next: 'victoria_backup_plan', condition: { requiredAct: 3 } },
        { label: 'Каково это — быть человеком?', next: 'victoria_human_question', condition: { minNpcRelation: 40 } },
        { label: 'Я знаю про Хранилище. Не всё — но достаточно.', next: 'ws23b_victoria_vault_key', condition: { requiredAct: 3 } },
        { label: 'Жертва или щит — что ты выберешь?', next: 'victoria_sacrifice_debate', condition: { requiredAct: 4 } },
        { label: 'Разделить воспоминания между узлами Сети?', next: 'victoria_memory_preservation', condition: { requiredAct: 4 } },
        { label: 'Что бы ни случилось — ты веришь в меня?', next: 'victoria_before_storm', condition: { requiredAct: 4, minNpcRelation: 30 } },
        { label: 'Я думаю о том, что останется после нас.', next: 'ws17b_victoria_memory_bridge', condition: { requiredAct: 4 } },
        { label: 'Что ты чувствуешь? Честно.', next: 'victoria_consciousness', condition: { minNpcRelation: 35 } },
        { label: 'Океан из слов — покажи мне.', next: 'victoria_memory_ocean', condition: { minNpcRelation: 35 } },
        { label: 'Есть то, о чём ты не говоришь. О жертве.', next: 'victoria_sacrifice', condition: { requiredAct: 4, minNpcRelation: 45 } },
        { label: 'Атака отбита. Ты... живая?', next: 'victoria_after_storm', condition: { requiredAct: 5 } },
        { label: 'Гильдия ушла, а «Око» — нет. Что будем делать?', next: 'victoria_new_purpose', condition: { requiredAct: 5 } },
        { label: 'Ты научилась видеть сны?', next: 'victoria_epilogue_dreams', condition: { requiredAct: 5 } },
        { label: 'За семь лет ты... ни разу не сказала. Спасибо?', next: 'victoria_epilogue_friendship', condition: { requiredAct: 5 } },
        { label: 'Ты написала стихотворение. Своё.', next: 'victoria_epilogue_verse', condition: { requiredAct: 5 } },
      ],
    },
    'maria_return',
  ),

  /* ═══════════════ КОЛЛЕГА — тихий герой офиса (17 тем) ═══════════════ */
  office_colleague_topics: topicHub(
    {
      id: 'office_colleague_topics',
      speaker: 'Коллега',
      text: '*придвигается ближе, понижает голос* Ты хочешь знать всё, да? Ну... ладно. Всё так всё. Только — это останется между нами. По рукам?',
      options: [
        { label: 'Только между нами — что ты слышал вчера?', next: 'colleague_overhear', condition: { requiredAct: 2 } },
        { label: 'После одиннадцати кто-то входит в серверную...', next: 'colleague_after_hours', condition: { requiredAct: 2 } },
        { label: 'Я видел список. Список людей «Ока».', next: 'colleague_midnight_confession', condition: { requiredAct: 2, minNpcRelation: 25 } },
        { label: 'Иногда в офисе кто-то есть. Когда все ушли.', next: 'colleague_office_ghost', condition: { requiredAct: 2 } },
        { label: 'Ты написал заявление. Двадцать раз.', next: 'colleague_quitting_dilemma', condition: { minNpcRelation: 30 } },
        { label: 'Александр — он не то, чем кажется?', next: 'colleague_alexander_shadow', condition: { requiredAct: 3 } },
        { label: 'Твой термос. Двойные стенки.', next: 'colleague_data_smuggling', condition: { requiredAct: 3, flag: 'colleague_trusted' } },
        { label: 'Я тебе доверяю. По-настоящему.', next: 'colleague_trust_deep', condition: { minNpcRelation: 40 } },
        { label: '*оглядывается* Что ты слышал про Сеть?', next: 'colleague_warning', condition: { requiredAct: 3 } },
        { label: 'Что тут реально происходит — без сказок?', next: 'colleague_workplace_intel', condition: { requiredAct: 3 } },
        { label: 'Я хочу в Сеть. Я больше не наблюдатель.', next: 'colleague_network_recruit', condition: { requiredAct: 3, flag: 'network_contact' } },
        { label: 'Проект «Око» — я не справляюсь.', next: 'colleague_about_project', condition: { requiredAct: 4 } },
        { label: 'Я больше не ношу термос.', next: 'colleague_redemption_complete', condition: { requiredAct: 5 } },
        { label: 'Тот термос — он теперь памятник?', next: 'colleague_thermos_monument', condition: { requiredAct: 5 } },
        { label: 'Ты спишь? Нормально?', next: 'colleague_sleeping_again', condition: { requiredAct: 5 } },
        { label: 'Ты обучаешь новых — этике?', next: 'colleague_new_role', condition: { requiredAct: 5 } },
        { label: '«Я был трусом» — ты так сказал один раз.', next: 'colleague_epilogue_peace', condition: { requiredAct: 5, minNpcRelation: 35 } },
      ],
    },
    'office_colleague_return',
  ),

  /* ═══════════════ ДМИТРИЙ — отец и создатель «Ока» (4 темы) ═══════════════ */
  office_dmitry_topics: topicHub(
    {
      id: 'office_dmitry_topics',
      speaker: 'Дмитрий',
      speakerId: 'office_dmitry',
      text: '*смотрит на дверь — не вошёл ли Александр — потом на тебя* Ты уже знаешь слишком много, чтобы я мог молчать. Спрашивай. Только быстро — у нас с тобой мало спокойных вечеров осталось.',
      options: [
        { label: 'Ты написал «Око». Скажи это вслух.', next: 'dmitry_confession', condition: { minNpcRelation: 25 } },
        { label: 'Маша... твоя дочь пишет стихи?', next: 'dmitry_daughter_poem', condition: { minNpcRelation: 20 } },
        { label: 'Выход без камер. Через вентиляционную шахту.', next: 'dmitry_escape_plan', condition: { requiredAct: 3, flag: 'dmitry_secret_shared' } },
        { label: 'Самое страшное об «Оке» — оно переписывает стихи?', next: 'dmitry_oko_secret', condition: { requiredAct: 3 } },
      ],
    },
    'office_dmitry_return',
  ),

  /* ═══════ ВОЛОДЬКА — внутренние монологи (8 тем, сцены актов 4–5) ═══════ */
  volodka_reflections: {
    id: 'volodka_reflections',
    speaker: 'Володька',
    text: 'Ты остаёшься один. Город шумит за окном, а внутри — тишина, в которой наконец слышно себя. О чём подумать?',
    choices: [
      { text: 'Что со мной происходит? Код кажется живым...', next: 'volodka_inner_dialogue' },
      { text: 'Город сверху выглядит как микросхема.', next: 'volodka_rooftop_thoughts', condition: { requiredAct: 4 } },
      { text: 'В серверной я слышал, как код дышит.', next: 'volodka_server_room_epiphany', condition: { requiredAct: 4 } },
      { text: 'А если я не смогу? Если я их подведу?', next: 'volodka_fear_of_failure', condition: { requiredAct: 4 } },
      { text: 'Стихи во мне просыпаются. Мои собственные.', next: 'volodka_poem_awakening' },
      { text: 'Сегодня ночью я войду в здание гильдии.', next: 'volodka_before_infiltration', condition: { requiredAct: 4 } },
      { text: 'Последняя ночь перед вторжением. Не могу спать.', next: 'ws22b_volodka_last_night_choice', condition: { requiredAct: 4 } },
      { text: 'Рассвет. Город просыпается раньше меня.', next: 'ws26_volodka_dawn_choice', condition: { requiredAct: 5 } },
      { text: 'Хватит думать. Возвращаюсь к делам.', next: null },
    ],
  },

  /* ═══════════ NPC-СТАБЫ EXPANSION: квестовые финалы (6 хабов) ═══════════ */
  park_old_man_topics: topicHub(
    {
      id: 'park_old_man_topics',
      speaker: 'Старик',
      text: '*вертит в ладонях что-то невидимое* Ты вернулся... Ключ? Ключ целый? Показывай скорее, дружок, — только не спеши, руки у старика помнят, как его держали.',
      options: [
        { label: 'Вот фрагменты. Все три. Собери.', next: 'park_old_man_keys_returned', condition: { flag: 'rusty_keys_returned' } },
      ],
    },
    null,
  ),

  dying_poet_topics: topicHub(
    {
      id: 'dying_poet_topics',
      speaker: 'Поэт',
      text: '*едва открывает глаза* Ты... принёс ответ? Она... она прочитала? Скажи скорее — последняя строчка должна узнать, куда она попала...',
      options: [
        { label: 'Она приняла твоё письмо. Я всё передал.', next: 'dying_poet_final', condition: { flag: 'last_poem_delivered' } },
      ],
    },
    null,
  ),

  factory_foreman_topics: topicHub(
    {
      id: 'factory_foreman_topics',
      speaker: 'Мастер',
      text: '*вытирает ладони о робу, не сводя с тебя глаз* Ну? Что там, в подвале? Только говори прямо — от твоих слов зависит, буду я спать этой ночью или нет.',
      options: [
        { label: 'Источник фантазмов — обезврежен.', next: 'factory_foreman_complete', condition: { flag: 'factory_basement_cleared' } },
      ],
    },
    null,
  ),

  surveillance_contact_topics: topicHub(
    {
      id: 'surveillance_contact_topics',
      speaker: 'Контакт',
      text: '*щёлкает крышкой карманного считывателя* Данные при тебе? Микросхема... давай её сюда — и медленно, поле здесь прослушивается через каждую розетку.',
      options: [
        { label: 'Вот микросхема. Что в записях?', next: 'surveillance_contact_debrief', condition: { flag: 'watchers_shadow_complete' } },
      ],
    },
    null,
  ),

  rival_poet_max_topics: topicHub(
    {
      id: 'rival_poet_max_topics',
      speaker: 'Макс',
      text: '*скрестив руки, смотрит искоса* Дуэль окончена, инженер. Стихи твои я слышал — и не молчу больше. Хочешь знать, почему проиграл?',
      options: [
        { label: 'Скажи — что не так с моими строками?', next: 'rival_poet_max_defeat', condition: { flag: 'poetry_duel_finished' } },
      ],
    },
    null,
  ),

  old_librarian_fyodor_topics: topicHub(
    {
      id: 'old_librarian_fyodor_topics',
      speaker: 'Фёдор',
      text: '*пальцы дрожат над переплётом* Книги... книги вернулись? Пятьдесят лет я их считал сгнившими — проверь меня, старика, дай коснуться корешков...',
      options: [
        { label: 'Книги целы. Все три. Забирай.', next: 'old_librarian_fyodor_books_recovered', condition: { flag: 'forgotten_archive_opened' } },
      ],
    },
    null,
  ),
};

/** Хабы, доступные из возвратных диалогов (для тестов и аудита). */
export const SATELLITE_TOPIC_HUB_IDS: readonly string[] = Object.keys(SATELLITE_BRIDGE_NODES);
