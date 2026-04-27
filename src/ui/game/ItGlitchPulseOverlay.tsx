'use client';

import { useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';

/**
 * Краткая DOM-вспышка по событию `ui:it_glitch_pulse` — дополняет класс `exploration-hack-glitch-flash` на `body`,
 * не добавляет второй `EffectComposer`.
 */
export function ItGlitchPulseOverlay() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    return eventBus.on('ui:it_glitch_pulse', ({ durationMs }) => {
      const ms = Math.min(6000, Math.max(120, durationMs));
      setVisible(true);
      window.setTimeout(() => setVisible(false), ms);
    });
  }, []);

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[140] mix-blend-screen"
      aria-hidden
      style={{
        backgroundImage:
          'repeating-linear-gradient(180deg, transparent 0px, transparent 3px, rgba(34,211,238,0.07) 3px, rgba(34,211,238,0.07) 6px)',
        animation: 'pulse 0.45s ease-out 1',
      }}
    />
  );
}
