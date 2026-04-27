// ============================================
// TYPED EVENT BUS — Строго типизованная шина событий v2
// ============================================
// Канонический модуль: импорты вида `@/engine/events/EventBus`.
// `src/shared/engine/EventBus.ts` — тонкий shim для обратной совместимости.
//
// Улучшения по сравнению с v1:
// - Добавлены middleware (pre/post emit hooks)
// - Type-safe emit/on с автокомплитом
// - Улучшенная отладка: getLog, getLastEvent, getEventStats, setDebug(true)
//
// --- Правило границ (чтобы не превратить шину в «спагетти») ---
// `emit` / `on` — только там, где нужно связать **разные слои** без прямой зависимости:
//   • 3D / обход → DOM (тосты, оверлеи)
//   • движок / стор → UI-подписчики (уведомления, фазы, аудио-хук)
// Внутри **одной** подсистемы (квесты, навыки, один модуль) — вызывайте функции/методы стора
// напрямую; не дублируйте логику вторым `emit` «ради порядка».
//
// Отладка: `eventBus.setDebug(true)` в dev — в консоль уйдут имя события и payload.

import type { PlayerPath, SceneId, PlayerState, PlayerSkills } from '@/data/types';
import type { StreamingChunkId } from '@/data/streamingChunkId';

// ============================================
// Строгие идентификаторы в payload (не «произвольная строка»)
// ============================================

/** Поля `PlayerState` с числом — то, что реально уходит в `stat:changed`. */
type NumericPlayerStateKeys = {
  [K in keyof PlayerState]: PlayerState[K] extends number ? K : never;
}[keyof PlayerState];

/** Имя стата в шине: кор статы + навыки (как в StatsEngine.getStatValue). */
export type StatBusId = NumericPlayerStateKeys | keyof PlayerSkills;

/** Звуки из `sound:play` / `AudioEngine.playSfx` (известные + шаги `footstep_*`). */
export type SfxBusType =
  | 'loot'
  | 'skill'
  | 'ui'
  | 'radio_static'
  | `footstep_${string}`;

// ============================================
// UI priority (расширяемо: cinematic interrupts, blocking UI, boss events)
// ============================================

/** Приоритет UI на шине — подписчики пока не сортируются; поле в payload для будущей маршрутизации. */
export type UiPriority = 'low' | 'normal' | 'high';

export interface UiEventMeta {
  priority?: UiPriority;
}

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

  /**
   * Стриминг чанков 3D-обхода — жизненный цикл React↔Rapier (`docs/scene-streaming-spec.md`).
   * `*_requested` — координатор → UI; `*_activated` / `*_deactivated` — подтверждение от React после тел в мире / после снятия тел.
   */
  'streaming:chunk_activation_requested': { chunkId: StreamingChunkId; sceneId: SceneId };
  'streaming:chunk_activated': { chunkId: StreamingChunkId; sceneId?: SceneId; rapierBodyCount?: number };
  'streaming:chunk_deactivation_requested': { chunkId: StreamingChunkId; sceneId: SceneId };
  'streaming:chunk_deactivated': { chunkId: StreamingChunkId; sceneId?: SceneId };
  /** Prefetch: координатор снял цель с очереди и вызвал `retainGltfModelUrl` для перечисленных URL (см. `drainPrefetchHeadApplyRetain`). */
  'streaming:prefetch_warm_applied': { targetSceneId: SceneId; urls: readonly string[] };

  // Изменение характеристик
  'stat:changed': {
    stat: StatBusId;
    oldValue: number;
    newValue: number;
    delta: number;
  };

  // Квесты
  'quest:activated': { questId: string };
  'quest:completed': { questId: string };
  'quest:objective_updated': { questId: string; objectiveId: string; value: number };

  /**
   * Сюжетный выбор с `StoryChoice.cutsceneId` — `useGameRuntime` дожимает `AnimeCutscene`,
   * затем переводит узел (`setCurrentNode` + `pushChoiceLog`).
   */
  'cinematic:story_after_choice': {
    cutsceneId: string;
    nextNodeId: string;
    fromNodeId: string;
    choiceText: string;
  };

  /**
   * Любое закрытие полноэкранного `AnimeCutscene` в `useGameRuntime.completeCutscene`.
   * `completionKey` — внутренний маркер (в т.ч. `cinematic::quest::…`); для `__transient__::` в `cutscenesCompletedRef` не добавляется.
   */
  'cinematic:ended': { completionKey: string | null; cutsceneId: string | null };

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
  'game:saved': { timestamp: number; source?: 'auto' | 'manual' };
  'game:loaded': { timestamp: number };

  /** Шаг игрока в исследовании (следы на земле, отладка). */
  'exploration:footstep': { x: number; y: number; z: number; yaw: number; timestamp: number };

  /**
   * Только detection (InteractionSystem). Разбор цели и побочные эффекты — в gameplay по `on()`.
   */
  'exploration:interaction_detected': {
    sceneId: SceneId;
    candidateObjectIds: string[];
  };

  /**
   * После gameplay resolve — готовая пара объект+действие; execution (диалог, квест) подписывается отдельно.
   */
  'exploration:interaction_resolved': {
    sceneId: SceneId;
    objectId: string;
    interactionId: string;
  };

  // Путь персонажа
  'path:changed': { oldPath: PlayerPath; newPath: PlayerPath };

  // Проверка навыков
  'skill:check': { skill: string; difficulty: number; success: boolean; roll: number };

  /** Короткое сообщение поверх исследования (тост / эффект). */
  'ui:exploration_message': { text: string };

  /** Тактиальный маркер взаимодействия E (подписчики: камера, звук, HUD). */
  'ui:interaction_feedback': { kind: 'success' | 'fail'; timestamp: number };

  /** Короткий системный буллет над игрой (`showEffectNotif`, без канала exploration_message — меньше спама рядом с локальными тостами). */
  'ui:effect_notif': {
    text: string;
    type: 'poem' | 'stat' | 'quest' | 'flag' | 'energy' | 'system';
    durationMs?: number;
  } & UiEventMeta;

  /** Звук UI / мира (см. AudioEngine / обработчики). */
  'sound:play': { type: SfxBusType; volume?: number };

  /** Взаимодействие с объектом из радиального меню и др. */
  'object:interact': { objectId: string; action: string };

  'loot:reward': { itemId: string; name: string; rarity: string };
  'skill:level_up': { skill: string; level: number };

  /** Уровень персонажа вырос после начисления XP (`gameStore.addExperience`). */
  'player:level_up': { newLevel: number; levelsGained: number; source?: string };

  /** Стресс впервые достиг порога «высокий» (≥80). */
  'player:stress_high': { stress: number; previousStress: number };
  /** Режим паники включён (stress ≥ 100). */
  'player:panic_enter': { stress: number };
  /** Режим паники выключен. */
  'player:panic_leave': { stress: number };
  /** Энергия пересекла порог вниз (вошла в низкий запас). */
  'player:low_energy': { energy: number; threshold: number };

  /** Полноэкранная краткая вспышка «ИБ / хак» (DOM, без второго `EffectComposer`). */
  'ui:it_glitch_pulse': { durationMs: number };
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
