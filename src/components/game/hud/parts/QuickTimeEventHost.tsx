/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Quick Time Event Host (v4.30)

   Единственная точка монтирования QTE-оверлея (паттерн PoemRevealHost):
   слушает EventBus-домен `qte:*`, гейтит запуск по занятости экрана,
   ставит/снимает локомоция-гейт и маппит звуковые идентификаторы оверлея
   на пресеты SFX.

   Контракт:
   - `qte:start`  — сценарий/движок просит показать QTE;
   - `qte:resolve`— хост эмитит ровно один раз на принятый start
     (success / failure / timeout / cancelled);
   - пока QTE активен, WASD/прыжок/взаимодействие заморожены через
     setQteLocomotionGate (модальный ввод не просачивается в мир).
────────────────────────────────────────────────────────────────────────────── */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { audioEngine } from '@/engine/audio/AudioEngine';
import {
  isGameplayOverlayLocomotionLocked,
  setQteLocomotionGate,
} from '@/engine/player/playerLocomotionGate';
import type { QteStartPayload } from '@/engine/events/qteEvents';
import type { QTEFinalResult } from '@/engine/qte/qteTypes';
import {
  QuickTimeEventOverlay,
} from './QuickTimeEventOverlay';

/** Маппинг звуковых идентификаторов оверлея на пресеты SFX. */
const QTE_SFX_MAP: Record<string, string> = {
  'qte:start': 'qte_start',
  'qte:press': 'qte_press',
  'qte:near_miss': 'qte_near_miss',
  'qte:success': 'qte_success',
  'qte:failure': 'qte_failure',
  'qte:complete': 'qte_complete',
};

/** Сколько держится экран результата до размонтирования, мс. */
const RESULT_HOLD_MS = 1600;

/** Активная сессия QTE с payload-ом старта. */
type ActiveQte = QteStartPayload;

/**
 * Host-компонент QTE — монтируется один раз в GameplaySharedEffects.
 * Без активного события не рендерит ничего (listener always-mounted).
 */
export function QuickTimeEventHost() {
  const [active, setActive] = useState<ActiveQte | null>(null);
  const activeRef = useRef<ActiveQte | null>(null);
  activeRef.current = active;
  const unmountTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearUnmountTimer = useCallback(() => {
    if (unmountTimerRef.current) {
      clearTimeout(unmountTimerRef.current);
      unmountTimerRef.current = null;
    }
  }, []);

  const handleResolve = useCallback((result: QTEFinalResult) => {
    const current = activeRef.current;
    if (!current) return;
    // Слушатели логики получают итог сразу; экран результата держится
    // RESULT_HOLD_MS (для 'cancelled' — без драматизма, закрытие сразу).
    eventBus.emit('qte:resolve', { id: current.id, result });
    if (result === 'cancelled') {
      setActive(null);
      return;
    }
    clearUnmountTimer();
    unmountTimerRef.current = setTimeout(() => {
      unmountTimerRef.current = null;
      setActive(null);
    }, RESULT_HOLD_MS);
  }, [clearUnmountTimer]);

  useEffect(() => {
    const startListener = eventBus.on('qte:start', (payload) => {
      // Гейт 1: QTE уже активен — повторные start отбрасываются.
      if (activeRef.current) return;
      // Гейт 2: экран занят другой модальной презентацией
      // (диалог/кат-сцена/миниигра/осмотр) — событие молча пропускается.
      // isGameplayOverlayLocomotionLocked покрывает все модальные источники.
      if (isGameplayOverlayLocomotionLocked()) return;
      clearUnmountTimer();
      setActive(payload);
    });

    return () => {
      startListener();
    };
  }, [clearUnmountTimer]);

  // Локомоция-гейт на всё время активного QTE (включая экран результата).
  useEffect(() => {
    if (active) {
      setQteLocomotionGate(true);
      return () => {
        setQteLocomotionGate(false);
      };
    }
  }, [active]);

  // Чистка таймера размонтирования при уходе хоста.
  useEffect(() => {
    return () => {
      clearUnmountTimer();
    };
  }, [clearUnmountTimer]);

  if (!active) return null;

  return (
    <QuickTimeEventOverlay
      key={active.id}
      isActive
      eventType={active.eventType}
      keyBindings={active.keyBindings}
      duration={active.duration}
      difficulty={active.difficulty}
      targetPresses={active.targetPresses}
      onSuccess={handleResolve}
      onFailure={handleResolve}
      onSoundTrigger={(soundId) => audioEngine.playSfx(QTE_SFX_MAP[soundId] ?? 'click')}
    />
  );
}

export default QuickTimeEventHost;
