'use client';

import { memo, useCallback, useEffect, useRef, type ReactNode } from 'react';
import type { MutableRefObject } from 'react';
import type { PlayerControls } from '@/hooks/useGamePhysics';

interface ExplorationMobileHudProps {
  active: boolean;
  virtualControlsRef: MutableRefObject<Partial<PlayerControls>>;
  onInteract: () => void;
}

type HoldKey = 'forward' | 'backward' | 'left' | 'right' | 'jump' | 'run';

const VirtualPadHoldButton = memo(function VirtualPadHoldButton({
  holdKey,
  className,
  children,
  ariaLabel,
  setKey,
}: {
  holdKey: HoldKey;
  className: string;
  children: ReactNode;
  ariaLabel: string;
  setKey: (k: keyof PlayerControls, v: boolean) => void;
}) {
  const release = useCallback(() => setKey(holdKey, false), [holdKey, setKey]);

  return (
    <button
      type="button"
      className={className}
      aria-label={ariaLabel}
      onPointerDown={(e) => {
        e.preventDefault();
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch {
          /* старые WebView */
        }
        setKey(holdKey, true);
      }}
      onPointerUp={(e) => {
        try {
          if (e.currentTarget.hasPointerCapture(e.pointerId)) {
            e.currentTarget.releasePointerCapture(e.pointerId);
          }
        } catch {
          /* noop */
        }
        release();
      }}
      onPointerCancel={release}
      onPointerLeave={(e) => {
        if (e.buttons === 0) release();
      }}
      onLostPointerCapture={release}
    >
      {children}
    </button>
  );
});

/**
 * Тач-оверлей для режима 3D-обхода: стрелки + прыжок + действие (E).
 * Клавиатура по-прежнему работает; `setPointerCapture` — чтобы палец не «рвал» удержание при микросдвигах.
 */
export const ExplorationMobileHud = memo(function ExplorationMobileHud({
  active,
  virtualControlsRef,
  onInteract,
}: ExplorationMobileHudProps) {
  const lastInteractAt = useRef(0);

  const setKey = useCallback(
    (k: keyof PlayerControls, v: boolean) => {
      if (v) {
        virtualControlsRef.current = { ...virtualControlsRef.current, [k]: true };
      } else {
        const next = { ...virtualControlsRef.current };
        delete next[k];
        virtualControlsRef.current = next;
      }
    },
    [virtualControlsRef],
  );

  const clearAll = useCallback(() => {
    virtualControlsRef.current = {};
  }, [virtualControlsRef]);

  useEffect(() => {
    const onBlur = () => clearAll();
    window.addEventListener('blur', onBlur);
    return () => window.removeEventListener('blur', onBlur);
  }, [clearAll]);

  const fireInteract = useCallback(() => {
    const now = Date.now();
    if (now - lastInteractAt.current < 400) return;
    lastInteractAt.current = now;
    onInteract();
  }, [onInteract]);

  if (!active) return null;

  const padBtn =
    'min-h-[52px] min-w-[52px] sm:min-h-12 sm:min-w-12 touch-manipulation select-none rounded border border-cyan-500/35 bg-black/55 font-mono text-base text-cyan-200/90 active:bg-cyan-950/80';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[14]"
      aria-hidden={false}
    >
      <div
        data-exploration-ui
        className="pointer-events-auto mx-auto flex max-w-lg items-end justify-between gap-2 pl-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2"
      >
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Движение">
          <span className="col-start-2">
            <VirtualPadHoldButton holdKey="forward" className={padBtn} ariaLabel="Вперёд" setKey={setKey}>
              ▲
            </VirtualPadHoldButton>
          </span>
          <VirtualPadHoldButton
            holdKey="left"
            className={`${padBtn} col-start-1 row-start-2`}
            ariaLabel="Влево"
            setKey={setKey}
          >
            ◀
          </VirtualPadHoldButton>
          <VirtualPadHoldButton
            holdKey="right"
            className={`${padBtn} col-start-3 row-start-2`}
            ariaLabel="Вправо"
            setKey={setKey}
          >
            ▶
          </VirtualPadHoldButton>
          <span className="col-start-2 row-start-3">
            <VirtualPadHoldButton holdKey="backward" className={padBtn} ariaLabel="Назад" setKey={setKey}>
              ▼
            </VirtualPadHoldButton>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <VirtualPadHoldButton
            holdKey="run"
            className={`${padBtn} border-fuchsia-500/35 px-2 text-[11px] uppercase tracking-wide text-fuchsia-100/90`}
            ariaLabel="Бег (как Shift)"
            setKey={setKey}
          >
            Run
          </VirtualPadHoldButton>
          <VirtualPadHoldButton
            holdKey="jump"
            className={`${padBtn} px-3 text-xs uppercase tracking-wide`}
            ariaLabel="Прыжок"
            setKey={setKey}
          >
            Jump
          </VirtualPadHoldButton>
          <button
            type="button"
            className="min-h-[52px] min-w-[52px] touch-manipulation select-none rounded border border-amber-500/40 bg-amber-950/50 px-3 font-mono text-xs uppercase tracking-wide text-amber-100/90 active:bg-amber-900/70 sm:min-h-12 sm:min-w-0"
            aria-label="Действие, как клавиша E"
            onPointerDown={(e) => {
              e.preventDefault();
              fireInteract();
            }}
          >
            E · Действие
          </button>
        </div>
      </div>
      <p className="pointer-events-none px-3 pb-[max(0.25rem,env(safe-area-inset-bottom))] text-center font-mono text-[9px] text-cyan-600/50">
        Камера — перетаскивание по экрану вне панелей · Run = бег как Shift
      </p>
    </div>
  );
});
