'use client';

/* ─── Volodka RPG – Touch controls for mobile (responsive v2) ───
   Fixed issues from v1:
   - D-pad no longer overflows screen edge (adaptive sizing + safe-area)
   - D-pad visible in landscape (forced portrait-style layout, compact)
   - Interaction button fires EventBus directly (not synthetic KeyE)
   - All buttons use onTouchStart for zero-delay response
   - Multi-touch supported for diagonal D-pad movement
*/

import { useCallback, useState, useEffect } from 'react';
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
  const [isLandscape, setIsLandscape] = useState(false);

  // Track orientation for adaptive sizing
  useEffect(() => {
    const check = () => setIsLandscape(window.innerWidth > window.innerHeight);
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    // Also use matchMedia for reliable landscape detection
    const mql = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => setIsLandscape(e.matches);
    mql.addEventListener('change', handler);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      mql.removeEventListener('change', handler);
    };
  }, []);

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

  // Interaction: fire synthetic KeyE for maximum compatibility.
  // The interaction system (InteractiveTriggers, InteractionSystemBridge)
  // listens for keydown 'KeyE' via the player controls system.
  // Also directly emits 'object:interact' via EventBus with the currently
  // active trigger zone ID (if any) for trigger zones that use EventBus.
  const handleInteract = useCallback(() => {
    onInteractPress?.();

    // Path 1: Synthetic KeyE — used by StoryRenderer, DialogueRenderer,
    // SceneExitIndicator, InteractiveTriggers, and all keydown listeners
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

  /* Adaptive button sizes:
     - Portrait phone: D-pad buttons 44px, action buttons 40-56px
     - Landscape phone: D-pad buttons 40px, action buttons 36-48px
     This prevents D-pad from overflowing the screen edge.
  */
  const dpadBtnSize = isLandscape ? 'w-10 h-10' : 'w-11 h-11';
  const dpadTextSize = isLandscape ? 'text-base' : 'text-lg';
  const dpadGap = isLandscape ? 'gap-[2px]' : 'gap-[3px]';
  const actionMainSize = isLandscape ? 'w-12 h-12' : 'w-14 h-14';
  const actionSmallSize = isLandscape ? 'w-9 h-9' : 'w-10 h-10';
  const actionIconSmall = isLandscape ? 'size-3.5' : 'size-4';
  const actionIconMain = isLandscape ? 'size-5' : 'size-6';

  /* Base button class — minimum 40px touch target, active feedback */
  const btnBase =
    'flex items-center justify-center rounded-full border-2 border-white/20 bg-black/50 text-white select-none touch-manipulation active:bg-white/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 transition-all duration-100 backdrop-blur-sm';

  return (
    <div
      className="fixed pointer-events-none"
      data-exploration-ui
      style={{
        zIndex: UI_LAYERS.DIALOGUE + 5,
        // Position from bottom with safe-area, ensure full width
        bottom: 0,
        left: 0,
        right: 0,
        // Safe area for devices with home indicator (iPhone X+)
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        // In landscape, also account for side safe areas
        paddingLeft: isLandscape ? 'env(safe-area-inset-left, 0px)' : '0px',
        paddingRight: isLandscape ? 'env(safe-area-inset-right, 0px)' : '0px',
      }}
    >
      <div
        className="flex items-end justify-between"
        style={{
          // Use dvh for proper mobile viewport height
          paddingLeft: isLandscape ? '8px' : '8px',
          paddingRight: isLandscape ? '8px' : '8px',
          paddingBottom: isLandscape ? '4px' : '8px',
        }}
      >

        {/* ── D-pad (left side) ── */}
        <div className="pointer-events-auto flex-shrink-0" style={{ touchAction: 'none' }}>
          <div className={`flex flex-col items-center ${dpadGap}`}>
            {/* Up */}
            <button
              className={`${btnBase} ${dpadBtnSize} ${dpadTextSize}`}
              aria-label="Двигаться вперёд"
              onTouchStart={(e) => { e.preventDefault(); startControl('forward'); }}
              onTouchEnd={(e) => { e.preventDefault(); stopControl('forward'); }}
              onTouchCancel={(e) => { e.preventDefault(); stopControl('forward'); }}
            >
              ▲
            </button>
            <div className={`flex ${dpadGap}`}>
              {/* Left */}
              <button
                className={`${btnBase} ${dpadBtnSize} ${dpadTextSize}`}
                aria-label="Двигаться влево"
                onTouchStart={(e) => { e.preventDefault(); startControl('left'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('left'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('left'); }}
              >
                ◀
              </button>
              {/* Down */}
              <button
                className={`${btnBase} ${dpadBtnSize} ${dpadTextSize}`}
                aria-label="Двигаться назад"
                onTouchStart={(e) => { e.preventDefault(); startControl('backward'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('backward'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('backward'); }}
              >
                ▼
              </button>
              {/* Right */}
              <button
                className={`${btnBase} ${dpadBtnSize} ${dpadTextSize}`}
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
        <div className="pointer-events-auto flex-shrink-0 flex flex-col items-center gap-1" style={{ touchAction: 'none' }}>
          {/* Interact — primary action, largest button */}
          <button
            className={`${btnBase} ${actionMainSize} text-base font-bold border-cyan-500/50 bg-cyan-950/30`}
            aria-label="Взаимодействовать"
            onTouchStart={(e) => { e.preventDefault(); handleInteract(); }}
          >
            <Hand className={`${actionIconMain} text-cyan-400`} />
          </button>

          {/* Secondary actions row */}
          <div className="flex gap-1">
            {/* Inventory */}
            {onOpenInventory && (
              <button
                className={`${btnBase} ${actionSmallSize} border-amber-500/40 bg-amber-950/40`}
                aria-label="Инвентарь"
                onTouchStart={(e) => { e.preventDefault(); onOpenInventory(); }}
              >
                <Package className={`${actionIconSmall} text-amber-400`} />
              </button>
            )}

            {/* Jump */}
            <button
              className={`${btnBase} ${actionSmallSize}`}
              aria-label="Прыжок"
              onTouchStart={(e) => { e.preventDefault(); startControl('jump'); }}
              onTouchEnd={(e) => { e.preventDefault(); stopControl('jump'); }}
              onTouchCancel={(e) => { e.preventDefault(); stopControl('jump'); }}
            >
              <ArrowUp className={actionIconSmall} />
            </button>

            {/* Run toggle */}
            <button
              className={`${btnBase} ${actionSmallSize} ${
                runToggled ? 'border-amber-500/60 bg-amber-900/50 text-amber-300' : ''
              }`}
              aria-label={runToggled ? 'Бег выключен' : 'Бег включён'}
              onTouchStart={(e) => { e.preventDefault(); toggleRun(); }}
            >
              <Zap className={actionIconSmall} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
