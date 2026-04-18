// ============================================
// CONSEQUENCES SYSTEM — Система последствий
// ============================================
// Каждое действие игрока имеет последствия.
// Последствия проверяются при событиях и применяют эффекты.

import { eventBus, type EventBusEvent } from './EventBus';
import type {
  StoryEffect,
  PlayerState,
  NPCRelation,
  ChoiceCondition,
} from '@/data/types';

// ============================================
// ТИПЫ
// ============================================

export interface ConsequenceEffect {
  // Изменение характеристик
  statChange?: Partial<Pick<StoryEffect, 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem' | 'stress'>>;

  // Флаги
  setFlag?: string;
  unsetFlag?: string;

  // NPC-отношения
  npcRelationChange?: { npcId: string; delta: number };

  // Навыки
  skillChange?: Record<string, number>;

  // Разблокировка/блокировка контента
  unlockQuest?: string;
  lockChoice?: { nodeId: string; choiceIndex: number };
  unlockChoice?: { nodeId: string; choiceIndex: number };

  // Смена пути
  pathShift?: string;

  // Уведомление
  message?: string;
}

export interface ConsequenceCondition {
  // Флаги
  hasFlag?: string;
  notFlag?: string;

  // Характеристики
  minStat?: { stat: keyof Pick<PlayerState, 'mood' | 'creativity' | 'stability' | 'karma' | 'selfEsteem' | 'stress'>; value: number };
  maxStat?: { stat: keyof Pick<PlayerState, 'mood' | 'creativity' | 'stability' | 'karma' | 'selfEsteem' | 'stress'>; value: number };

  // NPC-отношения
  minRelation?: { npcId: string; value: number };

  // Квесты
  questActive?: string;
  questCompleted?: string;

  // Инвентарь
  hasItem?: string;

  // Посещённые узлы
  visitedNode?: string;

  // Условие ChoiceCondition (для совместимости)
  choiceCondition?: ChoiceCondition;
}

export interface ConsequenceDefinition {
  id: string;
  triggerEvent: EventBusEvent;
  conditions: ConsequenceCondition[];
  effects: ConsequenceEffect[];
  priority: number; // Чем выше — тем раньше применяется
  once?: boolean;   // Сработать только один раз
  deferred?: boolean; // Отложенное — проверяется при каждом событии
}

// ============================================
// РЕЕСТР ПОСЛЕДСТВИЙ
// ============================================

const consequences: Map<string, ConsequenceDefinition> = new Map();
const firedConsequences: Set<string> = new Set();

// ============================================
// РЕГИСТРАЦИЯ ПОСЛЕДСТВИЙ
// ============================================

export function registerConsequence(definition: ConsequenceDefinition): void {
  consequences.set(definition.id, definition);
}

/** Зарегистрировать массив последствий */
export function registerConsequences(definitions: ConsequenceDefinition[]): void {
  definitions.forEach(registerConsequence);
}

// ============================================
// ПРОВЕРКА УСЛОВИЙ
// ============================================

function checkCondition(
  condition: ConsequenceCondition,
  state: ConsequenceEvaluationContext
): boolean {
  // Флаги
  if (condition.hasFlag && !state.flags[condition.hasFlag]) return false;
  if (condition.notFlag && state.flags[condition.notFlag]) return false;

  // Характеристики
  if (condition.minStat) {
    const val = state.playerState[condition.minStat.stat];
    if (typeof val === 'number' && val < condition.minStat.value) return false;
  }
  if (condition.maxStat) {
    const val = state.playerState[condition.maxStat.stat];
    if (typeof val === 'number' && val > condition.maxStat.value) return false;
  }

  // NPC-отношения
  if (condition.minRelation) {
    const npc = state.npcRelations.find(
      (r) => r.id === condition.minRelation!.npcId
    );
    if (!npc || npc.value < condition.minRelation.value) return false;
  }

  // Квесты
  if (condition.questActive && !state.activeQuestIds.includes(condition.questActive)) return false;
  if (condition.questCompleted && !state.completedQuestIds.includes(condition.questCompleted)) return false;

  // Инвентарь
  if (condition.hasItem && !state.inventory.includes(condition.hasItem)) return false;

  // Посещённые узлы
  if (condition.visitedNode && !state.visitedNodes.includes(condition.visitedNode)) return false;

  return true;
}

function checkAllConditions(
  conditions: ConsequenceCondition[],
  state: ConsequenceEvaluationContext
): boolean {
  return conditions.every((c) => checkCondition(c, state));
}

// ============================================
// КОНТЕКСТ ОЦЕНКИ
// ============================================

export interface ConsequenceEvaluationContext {
  playerState: PlayerState;
  npcRelations: NPCRelation[];
  flags: Record<string, boolean>;
  activeQuestIds: string[];
  completedQuestIds: string[];
  inventory: string[];
  visitedNodes: string[];
}

// ============================================
// ОЦЕНКА ПОСЛЕДСТВИЙ
// ============================================

export function evaluateConsequences(
  event: EventBusEvent,
  context: ConsequenceEvaluationContext
): ConsequenceEffect[] {
  const triggeredEffects: ConsequenceEffect[] = [];

  const sortedConsequences = Array.from(consequences.values())
    .filter((c) => c.triggerEvent === event || c.deferred)
    .sort((a, b) => b.priority - a.priority);

  for (const consequence of sortedConsequences) {
    // Проверяем однократность
    if (consequence.once && firedConsequences.has(consequence.id)) continue;

    // Проверяем условия
    if (!checkAllConditions(consequence.conditions, context)) continue;

    // Применяем
    firedConsequences.add(consequence.id);
    triggeredEffects.push(...consequence.effects);

    // Оповещаем
    eventBus.emit('consequence:triggered', {
      consequenceId: consequence.id,
      effects: consequence.effects.map((e) => e.message || e.setFlag || 'stat_change'),
    });
  }

  return triggeredEffects;
}

// ============================================
// ПРИМЕНЕНИЕ ЭФФЕКТОВ К STORE
// ============================================

export function applyConsequenceEffects(
  effects: ConsequenceEffect[],
  storeActions: {
    addStat: (stat: 'mood' | 'creativity' | 'stability' | 'energy' | 'karma' | 'selfEsteem', amount: number) => void;
    addStress: (amount: number) => void;
    reduceStress: (amount: number) => void;
    setFlag: (flag: string) => void;
    unsetFlag: (flag: string) => void;
    updateNPCRelation: (npcId: string, change: number) => void;
    addSkill: (skill: string, amount: number) => void;
    activateQuest: (questId: string) => void;
  }
): void {
  for (const effect of effects) {
    // Характеристики
    if (effect.statChange) {
      const sc = effect.statChange;
      if (sc.mood) storeActions.addStat('mood', sc.mood);
      if (sc.creativity) storeActions.addStat('creativity', sc.creativity);
      if (sc.stability) storeActions.addStat('stability', sc.stability);
      if (sc.energy) storeActions.addStat('energy', sc.energy);
      if (sc.karma) storeActions.addStat('karma', sc.karma);
      if (sc.selfEsteem) storeActions.addStat('selfEsteem', sc.selfEsteem);
      if (sc.stress) {
        if (sc.stress > 0) storeActions.addStress(sc.stress);
        else storeActions.reduceStress(-sc.stress);
      }
    }

    // Флаги
    if (effect.setFlag) storeActions.setFlag(effect.setFlag);
    if (effect.unsetFlag) storeActions.unsetFlag(effect.unsetFlag);

    // NPC-отношения
    if (effect.npcRelationChange) {
      storeActions.updateNPCRelation(
        effect.npcRelationChange.npcId,
        effect.npcRelationChange.delta
      );
    }

    // Навыки
    if (effect.skillChange) {
      for (const [skill, amount] of Object.entries(effect.skillChange)) {
        storeActions.addSkill(skill, amount);
      }
    }

    // Квесты
    if (effect.unlockQuest) storeActions.activateQuest(effect.unlockQuest);
  }
}

// ============================================
// СТАНДАРТНЫЕ ПОСЛЕДСТВИЯ ИГРЫ
// ============================================

export function registerDefaultConsequences(): void {
  registerConsequences([
    // ---- Предательство друга: долгосрочные последствия ----
    {
      id: 'betrayal_memory_stress',
      triggerEvent: 'choice:made',
      conditions: [
        { visitedNode: 'friends_betrayal' },
        { notFlag: 'betrayal_processed' },
      ],
      effects: [
        {
          statChange: { selfEsteem: -10, stress: 15 },
          setFlag: 'betrayal_processed',
          message: 'Воспоминание о предательстве навсегда изменило тебя',
        },
      ],
      priority: 10,
      once: true,
    },

    // ---- Чтение стихов на публике — рост самооценки ----
    {
      id: 'public_reading_selfesteem',
      triggerEvent: 'choice:made',
      conditions: [
        { hasFlag: 'read_at_cafe' },
        { notFlag: 'reading_boost_applied' },
      ],
      effects: [
        {
          statChange: { selfEsteem: 15, mood: 5 },
          setFlag: 'reading_boost_applied',
          message: 'Публичное чтение укрепило веру в себя',
        },
      ],
      priority: 20,
      once: true,
    },

    // ---- Высокий стресс влияет на самооценку ----
    {
      id: 'stress_destroys_selfesteem',
      triggerEvent: 'stress:threshold',
      conditions: [
        { minStat: { stat: 'stress', value: 75 } },
      ],
      effects: [
        {
          statChange: { selfEsteem: -5 },
          message: 'Стресс подтачивает твою самооценку',
        },
      ],
      priority: 5,
    },

    // ---- Низкая самооценка блокирует выборы ----
    {
      id: 'low_selfesteem_blocks_social',
      triggerEvent: 'choice:made',
      conditions: [
        { maxStat: { stat: 'selfEsteem', value: 20 } },
      ],
      effects: [
        {
          statChange: { mood: -3 },
          message: 'Неуверенность мешает тебе решиться',
        },
      ],
      priority: 15,
    },

    // ---- Знакомство с Марией — первый шаг к связи ----
    {
      id: 'maria_connection_opens',
      triggerEvent: 'npc:interacted',
      conditions: [
        { hasFlag: 'read_at_cafe' },
        { notFlag: 'maria_path_opened' },
      ],
      effects: [
        {
          setFlag: 'maria_path_opened',
          npcRelationChange: { npcId: 'maria', delta: 5 },
          message: 'Встреча с Марией открыла новую дорогу',
        },
      ],
      priority: 20,
      once: true,
    },

    // ---- Стихотворение "Смерть есть лишь начало" — особый эффект ----
    {
      id: 'first_poem_selfesteem',
      triggerEvent: 'poem:collected',
      conditions: [
        { notFlag: 'first_poem_effect' },
      ],
      effects: [
        {
          statChange: { selfEsteem: 5, creativity: 3 },
          setFlag: 'first_poem_effect',
          message: 'Первое стихотворение — первый шаг к себе',
        },
      ],
      priority: 25,
      once: true,
    },

    // ---- Паника обнуляет самооценку временно ----
    {
      id: 'panic_destroys_selfesteem',
      triggerEvent: 'panic:triggered',
      conditions: [],
      effects: [
        {
          statChange: { selfEsteem: -15 },
          message: 'Kernel Panic — ты не веришь в себя вообще',
        },
      ],
      priority: 50,
    },

    // ---- Сбор 5 стихов — творческий подъём ----
    {
      id: 'five_poems_creative_boost',
      triggerEvent: 'poem:collected',
      conditions: [
        { minStat: { stat: 'creativity', value: 40 } },
        { notFlag: 'five_poem_boost' },
      ],
      effects: [
        {
          statChange: { selfEsteem: 10, creativity: 10 },
          setFlag: 'five_poem_boost',
          unlockQuest: 'poetry_collection',
          message: 'Творческий подъём — ты чувствуешь в себе силу',
        },
      ],
      priority: 15,
      once: true,
    },

    // ---- Извинение вместо сближения — упущенная возможность ----
    {
      id: 'missed_maria_connection',
      triggerEvent: 'dialogue:choice_made',
      conditions: [
        { hasFlag: 'maria_path_opened' },
        { notFlag: 'maria_deep_connection' },
        { maxStat: { stat: 'selfEsteem', value: 30 } },
      ],
      effects: [
        {
          statChange: { mood: -5 },
          message: 'Неуверенность заставила отступить',
        },
      ],
      priority: 10,
    },

    // ---- Отложенное: когда самооценка восстановлена — открывается путь примирения ----
    {
      id: 'selfesteem_reconciliation_unlock',
      triggerEvent: 'stat:changed',
      conditions: [
        { minStat: { stat: 'selfEsteem', value: 60 } },
        { notFlag: 'reconciliation_unlocked' },
        { visitedNode: 'friends_betrayal' },
      ],
      effects: [
        {
          setFlag: 'reconciliation_unlocked',
          statChange: { stability: 10 },
          message: 'Ты достаточно силён, чтобы простить',
        },
      ],
      priority: 30,
      once: true,
      deferred: true,
    },
  ]);
}

// ============================================
// ИНИЦИАЛИЗАЦИЯ — ПОДПИСКА НА СОБЫТИЯ
// ============================================

let initialized = false;

/** Отписки от `eventBus` — обязательно вызывать в `resetConsequences`, иначе повторный init дублирует обработчики (утечка + двойные эффекты). */
let consequenceBusUnsubs: Array<() => void> = [];

export function initConsequencesSystem(
  getContext: () => ConsequenceEvaluationContext,
  storeActions: Parameters<typeof applyConsequenceEffects>[1]
): void {
  if (initialized) return;
  initialized = true;

  registerDefaultConsequences();

  // Слушаем все ключевые события и оцениваем последствия
  const listenedEvents: EventBusEvent[] = [
    'choice:made',
    'scene:enter',
    'stat:changed',
    'quest:activated',
    'quest:completed',
    'npc:interacted',
    'poem:collected',
    'dialogue:choice_made',
    'stress:threshold',
    'panic:triggered',
    'item:acquired',
    'flag:set',
  ];

  consequenceBusUnsubs = listenedEvents.map((eventName) =>
    eventBus.on(eventName, () => {
      const context = getContext();
      const effects = evaluateConsequences(eventName, context);
      if (effects.length > 0) {
        applyConsequenceEffects(effects, storeActions);
      }
    }),
  );
}

// Сброс для тестов
export function resetConsequences(): void {
  for (const unsub of consequenceBusUnsubs) {
    try {
      unsub();
    } catch {
      // ignore
    }
  }
  consequenceBusUnsubs = [];
  consequences.clear();
  firedConsequences.clear();
  initialized = false;
}
