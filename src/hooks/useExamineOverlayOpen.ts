import { useSyncExternalStore } from 'react';
import {
  isExamineOverlayOpen,
  subscribeOverlayGate,
} from '@/engine/assets/gltfPreloadOverlayGate';

/** Реактивный флаг открытой панели осмотра (ExaminePanel).
 *
 *  Источник истины — модульный гейт `gltfPreloadOverlayGate`, который
 *  синхронизируется оркестратором взаимодействия (`useInteractionOrchestrator`)
 *  на каждое открытие/закрытие осмотра.
 *
 *  FIX (v4.22): пока осмотр открыт, нижне-центральные подсказки
 *  ([E]-промпт, кроссхейр-промпт, «Вы сбились с пути», контекстные хинты)
 *  скрываются — раньше они продолжали висеть над панелью осмотра и
 *  перекрывали её (стопка тултипов внизу экрана). */
export function useExamineOverlayOpen(): boolean {
  return useSyncExternalStore(
    subscribeOverlayGate,
    isExamineOverlayOpen,
    isExamineOverlayOpen,
  );
}
