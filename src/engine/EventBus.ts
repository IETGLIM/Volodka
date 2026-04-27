// ============================================
// EVENT BUS — Re-export from engine/events
// ============================================
// Обратная совместимость: `@/engine/EventBus` и `@/engine/events/EventBus`.

export {
  eventBus,
  type EventBusEvent,
  type EventMap,
  type EventHandler,
  type EventPayload,
  type PreEmitMiddleware,
  type PostEmitMiddleware,
  type StatBusId,
  type SfxBusType,
  type UiPriority,
  type UiEventMeta,
} from '@/engine/events/EventBus';
