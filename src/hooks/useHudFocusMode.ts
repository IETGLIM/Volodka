import { useSyncExternalStore } from 'react';
import {
  isExamineOverlayOpen,
  subscribeOverlayGate,
} from '@/engine/assets/gltfPreloadOverlayGate';
import { useGameStore } from '@/store/gameStore';

/**
 * Режим фокуса «мир важнее HUD» (v4.57.0, «Тихий HUD»).
 *
 * Игрок читает мир или наррацию: открыта панель осмотра (ExaminePanel),
 * диегетическая плашка («Голос» / диалог), story-оверлей или идёт катсцена.
 * В этот момент ВЕСЬ транзиентный HUD-шум (каптионы атмосферы, лор-тосты,
 * квест-карточки, event-попапы, ачивки, мысли Володьки, барки NPC, погода,
 * режиссёрские хинты первых минут) обязан замолчать — экран принадлежит
 * одному тексту за раз, как в Oblivion/Gothic, а не газете из 12 блоков.
 *
 * Источники:
 *  - осмотр: модульный гейт gltfPreloadOverlayGate (реактивный, useSyncExternalStore);
 *  - наррация/катсцена: играющий стор (diegeticNarrative / showStoryOverlay /
 *    activeCutsceneId).
 *
 * Контракт сознательно «return null»-совместимый: компоненты используют его
 * как ранний return, состояние очередей не теряется (глохнет показ, не логика).
 */
export function useHudFocusMode(): boolean {
  const examineOpen = useSyncExternalStore(
    subscribeOverlayGate,
    isExamineOverlayOpen,
    isExamineOverlayOpen,
  );
  const diegeticOpen = useGameStore((s) => s.diegeticNarrative != null);
  const storyOverlayOpen = useGameStore((s) => s.showStoryOverlay);
  const cutsceneActive = useGameStore((s) => s.activeCutsceneId != null);
  return examineOpen || diegeticOpen || storyOverlayOpen || cutsceneActive;
}
