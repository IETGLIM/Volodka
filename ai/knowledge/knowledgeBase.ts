// ============================================
// KNOWLEDGE BASE
// ============================================
// Тегированная база знаний об игре.
// Содержит информацию о механиках, сюжете, сценах и коде.
// Используется агентами для принятия контекстных решений.

import type { KnowledgeEntry } from '../agents/types';

// ============================================
// НАЧАЛЬНЫЕ ЗНАНИЯ ОБ ИГРЕ
// ============================================

const INITIAL_KNOWLEDGE: KnowledgeEntry[] = [
  // --- Механики ---
  {
    type: 'mechanic',
    content: `Система Kernel Panic: при стрессе=100 игрок не может выбирать действия.
Нужно снизить стресс (отдых, письмо, разговор). Визуально: красный оверлей, глитч, scanlines.
CoreLoop переходит в состояние PROCESSING_CONSEQUENCES.`,
    tags: ['stress', 'panic', 'core-loop', 'visual-effects'],
  },
  {
    type: 'mechanic',
    content: `Стихи как механики: при сборе стиха игрок получает:
1) Поэтическое озарение — бафф к статам/навыкам на основе тем
2) Разблокировка диалогов — новые опции с NPC через флаги
3) Атмосферный эффект — визуальные изменения на сцене
40+ тематических бонусов (одиночество, любовь, смерть, надежда, космос и т.д.)`,
    tags: ['poems', 'mechanics', 'npc', 'visual-effects'],
  },
  {
    type: 'mechanic',
    content: `Статы: mood(0-100), creativity(0-100), stability(0-100), energy(0-10),
karma(0-100), selfEsteem(0-100), stress(0-100).
Взаимосвязи: стресс >50 → штраф, selfEsteem <25 → блок социальных действий,
creativity >70 → бонус к стиховым выборам, energy ≤2 → блок действий.`,
    tags: ['stats', 'balance', 'psychology'],
  },
  {
    type: 'mechanic',
    content: `Система последствий: каждый выбор имеет отложенный эффект.
ConsequencesSystem слушает события EventBus и проверяет условия.
Поддерживает: once (одноразовые), deferred (отложенные), priority (приоритет).
Пример: betrayal_memory_stress — при посещении friends_betrayal снижает selfEsteem и повышает stress.`,
    tags: ['consequences', 'events', 'game-design'],
  },
  {
    type: 'mechanic',
    content: `Квест-система: ChoiceCondition поддерживает questActive, questCompleted, questNotStarted, questNotCompleted, minQuestCount.
Это позволяет квестам влиять на доступные выборы в сюжете. Примеры:
- ending_creator: { questCompleted: 'first_words', minQuestCount: 2 }
- career_choice: { minQuestCount: 3 } — IT-карьерный путь
- call_victoria_act3: { questCompleted: 'maria_connection' }
- prepare_for_reading: { questCompleted: 'first_words' }
6 концовок: creator, reconciliation, observer, seeker, stone, technologist(mentor).`,
    tags: ['quests', 'conditions', 'endings', 'content-unlock'],
  },

  // --- Сюжет ---
  {
    type: 'story',
    content: `Протагонист: Владимир, 33 года, 12 лет в IT-поддержке.
10 лет отношений с девушкой → она ушла к его лучшему другу Андрею.
8 лет одиночества. Пишет стихи, которые никто не читает.
Акт 1: Офис → обед → дом → воспоминания → одиночество.
Акт 2: Встреча с Марией в кафе → первые шаги к связи.
Акт 3: Финал — зависит от выборов игрока.`,
    tags: ['protagonist', 'story', 'acts', 'maria'],
  },
  {
    type: 'story',
    content: `Виктория — ключевая NPC (id: maria, имя: Виктория). Появляется в кафе "Синяя Яма" после чтения стихов.
Тоже пережила потерю (муж ушёл к другой). Развитие отношений зависит от selfEsteem и karma.
Флаг met_victoria открывает её ветку. victoria_opened_up — глубокая связь.
Если selfEsteem <30 — упускает возможность сближения.
Квест maria_connection: talk_maria → learn_past → share_story → exchange_contacts.`,
    tags: ['victoria', 'npc', 'romance', 'self-esteem', 'maria'],
  },
  {
    type: 'story',
    content: `Стихи Владимира Лебедева: 18 стихов, темы от одиночества до надежды.
Ключевые: "Смерть есть лишь начало" (экзистенциальное), "В свете уличных фонарей" (городское),
"Крылатые дети" (мечта), "Зелёная дверь" (город/одиночество).
Стихи НЕИЗМЕНЯЕМЫ — это реальные произведения.`,
    tags: ['poems', 'content', 'immutable'],
  },

  // --- Сцены ---
  {
    type: 'scene',
    content: `20 сцен: kitchen_night, kitchen_dawn, home_morning, home_evening,
office_morning, server_room, rooftop_night, dream, battle, street_winter,
street_night, cafe_evening, gallery_opening, underground_club, old_library,
abandoned_factory, psychologist_office, train_station, memorial_park, library, blue_pit.
Каждая сцена: CSS-градиент, overlay, ambient color, music key, atmosphere animation.`,
    tags: ['scenes', 'visual', 'locations'],
  },

  // --- Код ---
  {
    type: 'code',
    content: `Архитектура: EventBus (типизованная шина) → все системы общаются через события.
Zustand store — единый источник истины (playerState, npcRelations, inventory, quests, factions).
Engine модули = чистый TS (no React). UI = React-компоненты.
GameOrchestrator — главный компонент, делегирует суб-компонентам.`,
    tags: ['architecture', 'event-bus', 'zustand', 'separation'],
  },
  {
    type: 'code',
    content: `Типы: StoryNode (id, type, text, choices, scene, effects),
DialogueNode (id, text, choices, conditions, effects),
StoryChoice (text, next, effect, condition, skillCheck, moralType).
Conditions: hasFlag, notFlag, hasItem, minRelation, minSkill, visitedNode.
Effects: mood, creativity, stability, stress, karma, setFlag, npcRelation, skillGains.`,
    tags: ['types', 'typescript', 'data-model'],
  },
];

// ============================================
// RUNTIME KNOWLEDGE BASE
// ============================================

let knowledgeBase: KnowledgeEntry[] = [...INITIAL_KNOWLEDGE];

/** Добавить знание в базу */
export function addKnowledge(entry: KnowledgeEntry): void {
  knowledgeBase.push(entry);
}

/** Добавить несколько знаний */
export function addKnowledgeBatch(entries: KnowledgeEntry[]): void {
  knowledgeBase.push(...entries);
}

/** Получить все знания */
export function getAllKnowledge(): KnowledgeEntry[] {
  return [...knowledgeBase];
}

/** Получить знания по типу */
export function getKnowledgeByType(type: KnowledgeEntry['type']): KnowledgeEntry[] {
  return knowledgeBase.filter(k => k.type === type);
}

/** Получить знания по тегу */
export function getKnowledgeByTag(tag: string): KnowledgeEntry[] {
  return knowledgeBase.filter(k => k.tags.includes(tag));
}

/** Поиск знаний по тексту */
export function searchKnowledge(query: string, limit: number = 10): KnowledgeEntry[] {
  const queryTokens = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);

  const scored = knowledgeBase.map(entry => {
    const text = entry.content.toLowerCase();
    const tagText = entry.tags.join(' ').toLowerCase();
    const fullText = `${text} ${tagText}`;

    const score = queryTokens.reduce((acc, token) => {
      return acc + (fullText.includes(token) ? 1 : 0);
    }, 0);

    return { entry, score };
  });

  scored.sort((a, b) => b.score - a.score);

  return scored
    .filter(s => s.score > 0)
    .slice(0, limit)
    .map(s => s.entry);
}

/** Очистить пользовательские знания (оставить начальные) */
export function resetKnowledge(): void {
  knowledgeBase = [...INITIAL_KNOWLEDGE];
}
