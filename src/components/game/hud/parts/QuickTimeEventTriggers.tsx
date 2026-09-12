/* ─────────────────────────────────────────────────────────────────────────────
   Volodka RPG – Quick Time Event Triggers (v4.31)

   Маунт-компонент контентного слоя QTE (паттерн PoemRevealHost —
   always-mounted, без рендера): навешивает слушатели сценарных триггеров
   engine/qte/qteTriggers.ts на время геймплея:

   - хак-гейт терминалов (TriggerZone.linkedQte → QTE перед миниигрой);
   - финишер-усилитель (combat:creep_finished → бонусный QTE).

   Анмаунт снимает слушатели и чистит контексты сессий.
────────────────────────────────────────────────────────────────────────────── */

'use client';

import { useEffect } from 'react';
import {
  attachQteTriggerListeners,
  detachQteTriggerListeners,
} from '@/engine/qte/qteTriggers';

/** Точка монтирования QTE-триггеров — рендерит null, только lifecycle. */
export function QuickTimeEventTriggers() {
  useEffect(() => {
    attachQteTriggerListeners();
    return () => detachQteTriggerListeners();
  }, []);

  return null;
}

export default QuickTimeEventTriggers;
