// ============================================
// EVENT BUS — Re-export from shared/engine
// ============================================
// Обратная совместимость: старые импорты
// `@/engine/EventBus` продолжают работать.

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
} from '@/shared/engine/EventBus';
