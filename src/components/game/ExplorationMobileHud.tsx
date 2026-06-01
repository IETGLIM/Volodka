'use client';

/* ─── Volodka RPG – Touch controls for mobile (enhanced) ─── */

import { useCallback, useState } from 'react';
import { Package } from 'lucide-react';
import { useVirtualControlsRef } from '@/engine/VirtualControlsState';
import type { VirtualControls } from '@/hooks/useGamePhysics';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface ExplorationMobileHudProps {
  onInteractPress?: () => void;
  onOpenInventory?: () => void;
}

export function ExplorationMobileHud({ onInteractPress, onOpenInventory }: ExplorationMobileHudProps) {
  // P0-2.7 FIX: Use React Context instead of prop drilling for shared ref
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
    // CRITICAL FIX: Mobile has no keyboard, so the E-key interaction system
    // (InteractiveTriggers, SceneExitIndicator, NPCSystem) never fires.
    // Dispatch a synthetic KeyE event so all keydown listeners pick it up.
    // This makes the "Action" button work for: opening doors, examining objects,
    // talking to NPCs, and transitioning between scenes.
    try {
      window.dispatchEvent(new KeyboardEvent('keydown', {
        code: 'KeyE',
        key: 'e',
        bubbles: true,
        cancelable: true,
      }));
      // Auto-release after a frame so interact state resets properly
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

  /* Base button class: 44px+ touch targets, focus-visible ring, active state */
  const btnBase =
    'flex items-center justify-center rounded-full border-2 border-white/20 bg-black/50 text-white select-none touch-manipulation active:bg-white/25 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/70 focus-visible:ring-offset-2 focus-visible:ring-offset-black transition-all duration-100 backdrop-blur-sm';

  return (
    <div
      className="fixed bottom-0 left-0 right-0 pointer-events-none"
      data-exploration-ui
      style={{ zIndex: UI_LAYERS.DIALOGUE + 5, paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
    >
      <div className="flex items-end justify-between px-3 pb-3 sm:px-4 sm:pb-4">

        {/* ── D-pad (left) ── */}
        <div className="pointer-events-auto" style={{ touchAction: 'none' }}>
          {/* Movement label */}
          <div className="text-center mb-1">
            <span className="text-[9px] text-slate-400 font-mono uppercase tracking-widest">
              Передвижение
            </span>
          </div>
          <div className="flex flex-col items-center gap-1">
            {/* Up */}
            <button
              className={`${btnBase} w-[52px] h-[52px] text-xl`}
              aria-label="Двигаться вперёд"
              onTouchStart={(e) => { e.preventDefault(); startControl('forward'); }}
              onTouchEnd={(e) => { e.preventDefault(); stopControl('forward'); }}
              onTouchCancel={(e) => { e.preventDefault(); stopControl('forward'); }}
            >
              ▲
            </button>
            <div className="flex gap-1">
              {/* Left */}
              <button
                className={`${btnBase} w-[52px] h-[52px] text-xl`}
                aria-label="Двигаться влево"
                onTouchStart={(e) => { e.preventDefault(); startControl('left'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('left'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('left'); }}
              >
                ◀
              </button>
              {/* Down */}
              <button
                className={`${btnBase} w-[52px] h-[52px] text-xl`}
                aria-label="Двигаться назад"
                onTouchStart={(e) => { e.preventDefault(); startControl('backward'); }}
                onTouchEnd={(e) => { e.preventDefault(); stopControl('backward'); }}
                onTouchCancel={(e) => { e.preventDefault(); stopControl('backward'); }}
              >
                ▼
              </button>
              {/* Right */}
              <button
                className={`${btnBase} w-[52px] h-[52px] text-xl`}
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

        {/* ── Action buttons (right) ── */}
        <div className="pointer-events-auto flex flex-col items-center gap-1.5" style={{ touchAction: 'none' }}>
          {/* Inventory button */}
          {onOpenInventory && (
            <div className="flex flex-col items-center gap-0.5">
              <button
                className={`${btnBase} w-12 h-12 text-sm font-medium border-amber-500/40 bg-amber-950/40`}
                aria-label="Инвентарь"
                onTouchStart={(e) => { e.preventDefault(); onOpenInventory(); }}
              >
                <Package className="size-5 text-amber-400" />
              </button>
              <span className="text-[8px] text-slate-400 font-mono">Инв.</span>
            </div>
          )}

          {/* E interact — primary action, largest button */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              className={`${btnBase} w-14 h-14 text-sm font-bold border-cyan-500/50 bg-cyan-950/30`}
              aria-label="Взаимодействовать"
              onTouchStart={(e) => { e.preventDefault(); handleInteract(); }}
            >
              E
            </button>
            <span className="text-[8px] text-slate-400 font-mono">Действие</span>
          </div>

          {/* Jump */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              className={`${btnBase} w-11 h-11 text-base`}
              aria-label="Прыжок"
              onTouchStart={(e) => { e.preventDefault(); startControl('jump'); }}
              onTouchEnd={(e) => { e.preventDefault(); stopControl('jump'); }}
              onTouchCancel={(e) => { e.preventDefault(); stopControl('jump'); }}
            >
              ⬆
            </button>
            <span className="text-[8px] text-slate-400 font-mono">Прыжок</span>
          </div>

          {/* Run toggle */}
          <div className="flex flex-col items-center gap-0.5">
            <button
              className={`${btnBase} w-10 h-10 text-[9px] font-semibold ${
                runToggled ? 'border-amber-500/60 bg-amber-900/50 text-amber-300' : ''
              }`}
              aria-label={runToggled ? 'Бег выключен' : 'Бег включён'}
              onTouchStart={(e) => { e.preventDefault(); toggleRun(); }}
            >
              БГН
            </button>
            <span className="text-[8px] text-slate-400 font-mono">Бег</span>
          </div>
        </div>
      </div>
    </div>
  );
}
