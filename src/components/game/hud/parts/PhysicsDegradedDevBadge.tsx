import { useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getKccDegradedMetrics } from '@/engine/player/kccDegradedMetrics';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/** DEV-only HUD chip when KCC fallback (direct movement) is active. */
export function PhysicsDegradedDevBadge() {
  if (!import.meta.env.DEV) return null;

  return <PhysicsDegradedDevBadgeInner />;
}

function PhysicsDegradedDevBadgeInner() {
  const [degraded, setDegraded] = useState(false);
  const [reason, setReason] = useState<string | null>(null);
  const [frameCount, setFrameCount] = useState(0);

  useEffect(() => {
    const unsub = eventBus.on('player:physics_degraded', ({ degraded: isDegraded, reason: r }) => {
      setDegraded(isDegraded);
      setReason(r ?? null);
      if (!isDegraded) setFrameCount(0);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!degraded) return;
    const id = window.setInterval(() => {
      setFrameCount(getKccDegradedMetrics().degradedFrameCount);
    }, 500);
    return () => window.clearInterval(id);
  }, [degraded]);

  if (!degraded) return null;

  return (
    <div
      className="pointer-events-none fixed bottom-20 left-2 rounded border border-amber-500/40 bg-amber-950/90 px-2 py-1 font-mono text-[10px] text-amber-200"
      style={{ zIndex: UI_LAYERS.DEV_PANEL }}
      aria-live="polite"
    >
      KCC DEGRADED
      {reason ? ` · ${reason}` : ''}
      {frameCount > 0 ? ` · ${frameCount}fr` : ''}
    </div>
  );
}
