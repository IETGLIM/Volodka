'use client';

/* ─── Volodka RPG – Touch controls for mobile (responsive) ───
   Responsive layout that works in both portrait and landscape:
   - Portrait: D-pad left, action buttons right (standard layout)
   - Landscape: D-pad left, action buttons right but more compact vertically
   - Buttons scale down on narrow screens to prevent overflow
   - All buttons use onTouchStart for zero-delay response
*/

import { useCallback, useState } from 'react';
import { Package, Hand, ArrowUp, Zap } from 'lucide-react';
import { useVirtualControlsRef } from '@/engine/VirtualControlsState';
import type { VirtualControls } from '@/hooks/useGamePhysics';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface ExplorationMobileHudProps {
  onInteractPress?: () => void;
  onOpenInventory?: () => void;
}

export function ExplorationMobileHud({ onInteractPress, onOpenInventory }: ExplorationMobileHudProps) {
  const virtualControlsRef = useVirtualControlsRef();
  const [runToggled, setRunToggled] = useState(false);

  const startControl = useCallback(
    (key: keyof VirtualControls) => {
      virtualControlsRef.current[key] = 1;
    },
    [virtualControlsRef],
  );

  const stopControl = useCallback(
    (key: keyof VirtualControls) => {
      virtualControlsRef.current[key] = 0;
    },
    [virtualControlsRef],
  );

  const toggleRun = useCallback(() => {
    setRunToggled((prev) => {
      const next = !prev;
      virtualControlsRef.current.run = next ? 1 : 0;
      return next;
    });
  }, [virtualControlsRef]);

  const handleInteract = useCallback(() => {
    onInteractPress?.();
    // CRITICAL: Mobile has no keyboard, so the E-key interaction system
    // (InteractiveTriggers, SceneExitIndicator, NPCSystem) never fires.
    // Dispatch a synthetic KeyE event so all keydown listeners pick it up.
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyE',
        key: 'e',
        bubbles: true,
        cancelable: true,
      }));
      requestAnimationFrame(() => {
        window.dispatchEvent(new KeyboardEvent('keyup', {
          code: 'KeyE',
          key: 'e',
          bubbles: true,
          cancelable: true,
        }));
      });
    } catch { /* ignore on SSR */ }
  }, [onInteractPress]);

  /* Base button class — 44px minimum touch target, active feedback */
  const btnBase =
    'flex items-center justify-center rounded-full border-2 border-white/20 bg-black/50 text-white select-none touch-manipulation active:bg-white/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 transition-all duration-100 backdrop-blur-sm';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none"
      data-exploration-ui
      style={{ zIndex: UI_LAYERS.DIALOGUE + 5, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-end justify-between px-2 pb-2 landscape:px-4 landscape:pb-2">

        {/* ── D-pad (left side) ── */}
        <div className="pointer-events-auto flex-shrink-0" style={{ touchAction: 'none' }}>
          <div className="flex flex-col items-center gap-[3px] landscape:gap-1">
            {/* Up */}
            <button
              className={`${btnBase} w-11 h-11 landscape:w-12 landscape:h-12 text-lg landscape:text-xl`}
              aria-label="Двигаться вперёд"
              onTouchStart={(e) => { e.preventDefault(); startControl('forward'); }}
              onTouchEnd={(e) => { e.preventDefault(); stopControl('forward'); }}
              onTouchCancel={(e) => { e.preventDefault(); stopControl('forward'); }}
            >
              ▲
            </button>
            <div className="flex gap-[3px] landscape:gap-1">
              {/* Left */}
              <button
                className={`${btnBase} w-11 h-11 landscape:w-12 landscape:h-12 text-lg landscape:text-xl`}
                aria-label="Двигаться влево"
                onTouchStart={(e) => { e.preventDefault(); startControl('left'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('left'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('left'); }}
              >
                ◀
              </button>
              {/* Down */}
              <button
                className={`${btnBase} w-11 h-11 landscape:w-12 landscape:h-12 text-lg landscape:text-xl`}
                aria-label="Двигаться назад"
                onTouchStart={(e) => { e.preventDefault(); startControl('backward'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('backward'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('backward'); }}
              >
                ▼
              </button>
              {/* Right */}
              <button
                className={`${btnBase} w-11 h-11 landscape:w-12 landscape:h-12 text-lg landscape:text-xl`}
                aria-label="Двигаться вправо"
                onTouchStart={(e) => { e.preventDefault(); startControl('right'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('right'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('right'); }}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* ── Action buttons (right side) ── */}
        <div className="pointer-events-auto flex-shrink-0 flex flex-col items-center gap-1 landscape:gap-1.5" style={{ touchAction: 'none' }}>
          {/* Interact — primary action, largest button */}
          <button
            className={`${btnBase} w-14 h-14 landscape:w-16 landscape:h-16 text-base font-bold border-cyan-500/50 bg-cyan-950/30`}
            aria-label="Взаимодействовать"
            onTouchStart={(e) => { e.preventDefault(); handleInteract(); }}
          >
            <Hand className="size-6 landscape:size-7 text-cyan-400" />
          </button>

          {/* Secondary actions row (horizontal in landscape, vertical in portrait) */}
          <div className="flex gap-1 landscape:gap-1.5">
            {/* Inventory */}
            {onOpenInventory && (
              <button
                className={`${btnBase} w-10 h-10 landscape:w-11 landscape:h-11 border-amber-500/40 bg-amber-950/40`}
                aria-label="Инвентарь"
                onTouchStart={(e) => { e.preventDefault(); onOpenInventory(); }}
              >
                <Package className="size-4 landscape:size-5 text-amber-400" />
              </button>
            )}

            {/* Jump */}
            <button
              className={`${btnBase} w-10 h-10 landscape:w-11 landscape:h-11`}
              aria-label="Прыжок"
              onTouchStart={(e) => { e.preventDefault(); startControl('jump'); }}
              onTouchEnd={(e) => { e.preventDefault(); stopControl('jump'); }}
              onTouchCancel={(e) => { e.preventDefault(); stopControl('jump'); }}
            >
              <ArrowUp className="size-4 landscape:size-5" />
            </button>

            {/* Run toggle */}
            <button
              className={`${btnBase} w-10 h-10 landscape:w-11 landscape:h-11 ${
                runToggled ? 'border-amber-500/60 bg-amber-900/50 text-amber-300' : ''
              }`}
              aria-label={runToggled ? 'Бег выключен' : 'Бег включён'}
              onTouchStart={(e) => { e.preventDefault(); toggleRun(); }}
            >
              <Zap className="size-4 landscape:size-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
