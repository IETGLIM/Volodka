'use client';

import { memo, useCallback, useEffect, useRef } from 'react';
import type { MutableRefObject } from 'react';
import type { PlayerControls } from '@/hooks/useGamePhysics';
import { useIsMobile } from '@/hooks/use-mobile';

interface ExplorationMobileHudProps {
  active: boolean;
  virtualControlsRef: MutableRefObject<Partial<PlayerControls>>;
  onInteract: () => void;
}

/**
 * Тач-оверлей для режима 3D-обхода: стрелки + прыжок + действие (E).
 * Клавиатура по-прежнему работает; на узких экранах дублирует WASD.
 */
export const ExplorationMobileHud = memo(function ExplorationMobileHud({
  active,
  virtualControlsRef,
  onInteract,
}: ExplorationMobileHudProps) {
  const narrow = useIsMobile();
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

  if (!narrow || !active) return null;

  const padBtn =
    'min-h-12 min-w-12 touch-manipulation select-none rounded border border-cyan-500/35 bg-black/55 font-mono text-sm text-cyan-200/90 active:bg-cyan-950/80';

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[14] md:hidden"
      aria-hidden={false}
    >
      <div className="pointer-events-auto mx-auto flex max-w-lg items-end justify-between gap-2 px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-2">
        <div className="grid grid-cols-3 gap-1.5" role="group" aria-label="Движение">
          <span className="col-start-2">
            <button
              type="button"
              className={padBtn}
              aria-label="Вперёд"
              onPointerDown={(e) => {
                e.preventDefault();
                setKey('forward', true);
              }}
              onPointerUp={() => setKey('forward', false)}
              onPointerLeave={() => setKey('forward', false)}
              onPointerCancel={() => setKey('forward', false)}
            >
              ▲
            </button>
          </span>
          <button
            type="button"
            className={`${padBtn} col-start-1 row-start-2`}
            aria-label="Влево"
            onPointerDown={(e) => {
              e.preventDefault();
              setKey('left', true);
            }}
            onPointerUp={() => setKey('left', false)}
            onPointerLeave={() => setKey('left', false)}
            onPointerCancel={() => setKey('left', false)}
          >
            ◀
          </button>
          <button
            type="button"
            className={`${padBtn} col-start-3 row-start-2`}
            aria-label="Вправо"
            onPointerDown={(e) => {
              e.preventDefault();
              setKey('right', true);
            }}
            onPointerUp={() => setKey('right', false)}
            onPointerLeave={() => setKey('right', false)}
            onPointerCancel={() => setKey('right', false)}
          >
            ▶
          </button>
          <span className="col-start-2 row-start-3">
            <button
              type="button"
              className={padBtn}
              aria-label="Назад"
              onPointerDown={(e) => {
                e.preventDefault();
                setKey('backward', true);
              }}
              onPointerUp={() => setKey('backward', false)}
              onPointerLeave={() => setKey('backward', false)}
              onPointerCancel={() => setKey('backward', false)}
            >
              ▼
            </button>
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            className={`${padBtn} px-3 text-xs uppercase tracking-wide`}
            aria-label="Прыжок"
            onPointerDown={(e) => {
              e.preventDefault();
              setKey('jump', true);
            }}
            onPointerUp={() => setKey('jump', false)}
            onPointerLeave={() => setKey('jump', false)}
            onPointerCancel={() => setKey('jump', false)}
          >
            Jump
          </button>
          <button
            type="button"
            className="min-h-12 touch-manipulation select-none rounded border border-amber-500/40 bg-amber-950/50 px-3 font-mono text-xs uppercase tracking-wide text-amber-100/90 active:bg-amber-900/70"
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
      <p className="pointer-events-none px-3 pb-1 text-center font-mono text-[9px] text-cyan-600/50">
        Камера — перетаскивание по экрану (орбита, как мышью)
      </p>
    </div>
  );
});
