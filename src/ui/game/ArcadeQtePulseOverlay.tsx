'use client';

import { memo } from 'react';
import { useArcadeQteHudStore } from '@/state/arcadeQteHudStore';
import { useSessionPresetStore } from '@/state/sessionPresetStore';
import { useIsMobile } from '@/hooks/use-mobile';

/** Плавающая кнопка QTE поверх VN/оверлея (мобилка + грубый указатель). */
export const ArcadeQtePulseOverlay = memo(function ArcadeQtePulseOverlay() {
  const preset = useSessionPresetStore((s) => s.preset);
  const active = useArcadeQteHudStore((s) => s.active);
  const label = useArcadeQteHudStore((s) => s.label);
  const fire = useArcadeQteHudStore((s) => s.fire);
  const coarse = useIsMobile();

  if (preset !== 'arcadeSlice' || !active) return null;

  return (
    <div
      className={`pointer-events-none fixed inset-x-0 z-[45] flex justify-center ${
        coarse ? 'bottom-[max(5.5rem,env(safe-area-inset-bottom))]' : 'bottom-8'
      }`}
    >
      <button
        type="button"
        className="pointer-events-auto min-h-[56px] min-w-[min(92vw,20rem)] touch-manipulation rounded border border-emerald-400/60 bg-emerald-950/75 px-6 font-mono text-sm uppercase tracking-wider text-emerald-100 shadow-[0_0_28px_rgba(52,211,153,0.35)] active:scale-[0.98]"
        aria-label="QTE — поймать момент"
        onPointerDown={(e) => {
          e.preventDefault();
          fire();
        }}
      >
        ▶ {label}
      </button>
    </div>
  );
});
