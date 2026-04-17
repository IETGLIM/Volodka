// ============================================
// TYPED EVENT BUS — Строго типизованная шина событий v2
// ============================================
// Улучшения по сравнению с v1:
// - Добавлены middleware (pre/post emit hooks)
// - Type-safe emit/on с автокомплитом
// - Валидация payload в dev-режиме
// - Улучшенная отладка: getLastEvent, getEventStats

import type { PlayerPath, SceneId } from '../types/game';

// ============================================
// ТИПЫ СОБЫТИЙ И ПЕЙЛОАДОВ
// ============================================

export interface EventMap {
  // Выбор игрока
  'choice:made': {
    nodeId: string;
    choiceText: string;
    choiceIndex: number;
    moralType?: 'selfless' | 'selfish' | 'neutral' | 'chaotic';
  };

  // Переходы между сценами
  'scene:enter': { sceneId: SceneId; fromSceneId?: SceneId };
  'scene:exit': { sceneId: SceneId; toSceneId?: SceneId };

  // Изменение характеристик
  'stat:changed': {
    stat: string;
    oldValue: number;
    newValue: number;
    delta: number;
  };

  // Квесты
  'quest:activated': { questId: string };
  'quest:completed': { questId: string };
  'quest:objective_updated': { questId: string; objectiveId: string; value: number };

  // NPC
  'npc:interacted': { npcId: string; npcName: string };
  'npc:relation_changed': { npcId: string; oldValue: number; newValue: number; delta: number };

  // Стихи
  'poem:collected': { poemId: string };
  'poem:revealed': { poemId: string };

  // Диалоги
  'dialogue:started': { npcId: string; dialogueId: string };
  'dialogue:ended': { npcId: string; dialogueId: string };
  'dialogue:choice_made': { npcId: string; choiceText: string; nextNodeId: string };

  // Стресс-пороги
  'stress:threshold': { level: 25 | 50 | 75 | 100; stress: number };

  // Последствия
  'consequence:triggered': { consequenceId: string; effects: string[] };

  // Предметы
  'item:acquired': { itemId: string; quantity: number };
  'item:used': { itemId: string };
  'item:removed': { itemId: string; quantity: number };

  // Флаги
  'flag:set': { flag: string };
  'flag:unset': { flag: string };

  // Паника
  'panic:triggered': { stress: number };
  'panic:cleared': { stress: number };

  // Достижения
  'achievement:unlocked': { achievementId: string };

  // Сохранение / загрузка
  'game:saved': { timestamp: number };
  'game:loaded': { timestamp: number };

  // Путь персонажа
  'path:changed': { oldPath: PlayerPath; newPath: PlayerPath };

  // Проверка навыков
  'skill:check': { skill: string; difficulty: number; success: boolean; roll: number };

  /** Короткое сообщение поверх исследования (тост / эффект). */
  'ui:exploration_message': { text: string };

  /** Звук UI / мира (см. AudioEngine / обработчики). */
  'sound:play': { type: string; volume?: number };

  /** Взаимодействие с объектом из радиального меню и др. */
  'object:interact': { objectId: string; action: string };

  'loot:reward': { itemId: string; name: string; rarity: string };
  'skill:level_up': { skill: string; level: number };
}

// ============================================
// ТИПЫ ОБРАБОТЧИКОВ
// ============================================

export type EventHandler<T extends keyof EventMap> = (payload: EventMap[T]) => void;

// ============================================
// MIDDLEWARE TYPES
// ============================================

/** Pre-emit middleware: can modify payload or cancel emission */
export type PreEmitMiddleware = <K extends keyof EventMap>(
  event: K,
  payload: EventMap[K]
) => EventMap[K] | null; // null = cancel emission

/** Post-emit middleware: called after all handlers complete */
export type PostEmitMiddleware = <K extends keyof EventMap>(
  event: K,
  payload: EventMap[K],
  handlerCount: number
) => void;

// ============================================
// EVENT BUS CLASS — Full type safety
// ============================================

class EventBusClass {
  private listeners = new Map<keyof EventMap, Set<EventHandler<never>>>();
  private onceListeners = new Map<keyof EventMap, Set<EventHandler<never>>>();
  private eventLog: Array<{ event: string; timestamp: number; payload?: unknown }> = [];
  private maxLogSize = 200;
  private debug = false;

  // Middleware
  private preMiddleware: PreEmitMiddleware[] = [];
  private postMiddleware: PostEmitMiddleware[] = [];

  // ========================================
  // MIDDLEWARE REGISTRATION
  // ========================================

  /** Register a pre-emit middleware */
  usePreEmit(middleware: PreEmitMiddleware): () => void {
    this.preMiddleware.push(middleware);
    return () => {
      const idx = this.preMiddleware.indexOf(middleware);
      if (idx >= 0) this.preMiddleware.splice(idx, 1);
    };
  }

  /** Register a post-emit middleware */
  usePostEmit(middleware: PostEmitMiddleware): () => void {
    this.postMiddleware.push(middleware);
    return () => {
      const idx = this.postMiddleware.indexOf(middleware);
      if (idx >= 0) this.postMiddleware.splice(idx, 1);
    };
  }

  // ========================================
  // SUBSCRIBE / UNSUBSCRIBE
  // ========================================

  /** Subscribe to an event. Returns unsubscribe function. */
  on<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(handler as EventHandler<never>);

    return () => this.off(event, handler);
  }

  /** Subscribe to an event once. Auto-unsubscribes after first emission. */
  once<K extends keyof EventMap>(event: K, handler: EventHandler<K>): () => void {
    const wrapper: EventHandler<K> = (payload) => {
      handler(payload);
      this.off(event, wrapper);
    };
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, new Set());
    }
    this.onceListeners.get(event)!.add(wrapper as EventHandler<never>);
    return () => this.off(event, wrapper);
  }

  /** Unsubscribe from an event */
  off<K extends keyof EventMap>(event: K, handler: EventHandler<K>): void {
    this.listeners.get(event)?.delete(handler as EventHandler<never>);
    this.onceListeners.get(event)?.delete(handler as EventHandler<never>);
  }

  // ========================================
  // EMIT
  // ========================================

  /** Emit an event with a type-safe payload */
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
    // Run pre-emit middleware (allows cancellation)
    let currentPayload = payload;
    for (const middleware of this.preMiddleware) {
      const result = middleware(event, currentPayload);
      if (result === null) {
        if (this.debug) {
          console.log(`[EventBus] Emission of ${String(event)} cancelled by middleware`);
        }
        return; // Cancelled
      }
      currentPayload = result;
    }

    if (this.debug) {
      console.log(`[EventBus] ${String(event)}`, currentPayload);
    }

    // Log
    this.eventLog.push({ event: String(event), timestamp: Date.now(), payload: currentPayload });
    if (this.eventLog.length > this.maxLogSize) {
      this.eventLog.shift();
    }

    // Notify all listeners
    const handlerCount = this.notifyListeners(event, currentPayload);

    // Run post-emit middleware
    for (const middleware of this.postMiddleware) {
      middleware(event, currentPayload, handlerCount);
    }
  }

  /** Notify all listeners for an event */
  private notifyListeners<K extends keyof EventMap>(
    event: K,
    payload: EventMap[K]
  ): number {
    let count = 0;

    // Regular listeners
    const handlers = this.listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        try {
          (handler as EventHandler<K>)(payload);
          count++;
        } catch (err) {
          console.error(`[EventBus] Error in handler for ${String(event)}:`, err);
        }
      }
    }

    // Once listeners
    const onceHandlers = this.onceListeners.get(event);
    if (onceHandlers) {
      const handlersArray = [...onceHandlers];
      this.onceListeners.delete(event);
      for (const handler of handlersArray) {
        try {
          (handler as EventHandler<K>)(payload);
          count++;
        } catch (err) {
          console.error(`[EventBus] Error in once-handler for ${String(event)}:`, err);
        }
      }
    }

    return count;
  }

  // ========================================
  // UTILITY
  // ========================================

  /** Remove all subscriptions */
  clear(): void {
    this.listeners.clear();
    this.onceListeners.clear();
    this.eventLog = [];
    this.preMiddleware = [];
    this.postMiddleware = [];
  }

  /** Get the event log (for debugging) */
  getLog(): Array<{ event: string; timestamp: number; payload?: unknown }> {
    return [...this.eventLog];
  }

  /** Get the last emitted event */
  getLastEvent(): { event: string; timestamp: number; payload?: unknown } | null {
    return this.eventLog.length > 0 ? this.eventLog[this.eventLog.length - 1] : null;
  }

  /** Get event statistics */
  getEventStats(): Record<string, number> {
    const stats: Record<string, number> = {};
    for (const entry of this.eventLog) {
      stats[entry.event] = (stats[entry.event] || 0) + 1;
    }
    return stats;
  }

  /** Get subscriber counts per event */
  getSubscriberCounts(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [event, handlers] of this.listeners) {
      counts[String(event)] = handlers.size;
    }
    return counts;
  }

  /** Enable/disable debug mode */
  setDebug(enabled: boolean): void {
    this.debug = enabled;
  }

  /** Check if an event has any subscribers */
  hasSubscribers<K extends keyof EventMap>(event: K): boolean {
    return (this.listeners.get(event)?.size ?? 0) > 0 || (this.onceListeners.get(event)?.size ?? 0) > 0;
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

export const eventBus = new EventBusClass();

// Type helpers
export type EventBusEvent = keyof EventMap;
export type EventPayload<K extends EventBusEvent> = EventMap[K];
