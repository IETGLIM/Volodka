/* ─── Volodka RPG – Virtual Analog Joystick for Touch Devices ───
 *
 * Floating joystick on the left side of the screen.
 * - Inner thumb follows the finger within a circular boundary.
 * - Outputs normalized X/Y (-1 to 1) via joystickStore.
 * - CSS transition spring-back to center on release.
 * - Semi-transparent cyberpunk aesthetic (cyan/neon glass morphism).
 * - Hidden on desktop; visible only on touch devices.
 * - Multi-touch safe: tracks only the pointer that initiated the drag.
 * - z-index: 42 (UI_LAYERS.MOBILE_CONTROLS).
 * - All touch targets >= 44px (Apple HIG).
 */

'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { joystickStore } from '@/hooks/useVirtualJoystick';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { CYBER_CYAN_RGB } from '@/shared/constants/cyberPalette';
import { hapticLight } from '@/shared/utils/hapticFeedback';

/* ─── Constants ─── */

/** Outer ring diameter (px) — visual + touch surface */
const OUTER_SIZE = 140;
/** Inner thumb diameter (px) */
const INNER_SIZE = 56;
/** Max displacement of thumb center from ring center (px) */
const MAX_DISPLACEMENT = (OUTER_SIZE - INNER_SIZE) / 2;
/** Dead-zone radius: tiny movements below this are clamped to 0 */
const DEAD_ZONE_PX = 4;

/* ─── Styles ─── */

const outerRingBaseStyle: React.CSSProperties = {
  position: 'relative',
  width: OUTER_SIZE,
  height: OUTER_SIZE,
  borderRadius: '50%',
  border: `2px solid rgba(${CYBER_CYAN_RGB}, 0.35)`,
  background: `radial-gradient(circle, rgba(${CYBER_CYAN_RGB}, 0.06) 0%, rgba(0, 10, 20, 0.55) 100%)`,
  backdropFilter: 'blur(8px)',
  WebkitBackdropFilter: 'blur(8px)',
  touchAction: 'none',
  userSelect: 'none',
  WebkitTapHighlightColor: 'transparent',
};

function getThumbStyle(offsetX: number, offsetY: number, active: boolean): React.CSSProperties {
  const glowIntensity = active ? 0.5 : 0.2;
  return {
    position: 'absolute',
    width: INNER_SIZE,
    height: INNER_SIZE,
    borderRadius: '50%',
    left: '50%',
    top: '50%',
    transform: `translate(calc(-50% + ${offsetX}px), calc(-50% + ${offsetY}px))`,
    border: `2px solid rgba(${CYBER_CYAN_RGB}, ${active ? 0.6 : 0.3})`,
    background: `radial-gradient(circle at 35% 35%, rgba(${CYBER_CYAN_RGB}, ${glowIntensity}) 0%, rgba(0, 20, 30, 0.7) 70%)`,
    boxShadow: `0 0 ${active ? 18 : 10}px rgba(${CYBER_CYAN_RGB}, ${glowIntensity}), 0 0 ${active ? 40 : 20}px rgba(${CYBER_CYAN_RGB}, ${glowIntensity * 0.3})`,
    // Transition is managed directly on the DOM for spring-back control
    transition: 'box-shadow 0.15s ease, border-color 0.15s ease',
    pointerEvents: 'none',
  };
}



/* ─── Component ─── */

export function VirtualJoystick() {
  const isTouchDevice = useTouchDevice();

  // Refs for pointer tracking
  const containerRef = useRef<HTMLDivElement>(null);
  const activePointerId = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });

  // Thumb offset state — used only for the initial render / reset.
  // During drag, we write directly to the thumb DOM ref for zero-lag.
  const [thumbOffset, setThumbOffset] = useState({ x: 0, y: 0 });
  const [active, setActive] = useState(false);
  const thumbRef = useRef<HTMLDivElement>(null);

  // ── Apply thumb offset directly to DOM (avoids re-render during drag) ──
  const applyThumbOffset = useCallback((dx: number, dy: number) => {
    if (thumbRef.current) {
      thumbRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
    }
  }, []);

  // ── Compute center of the outer ring ──
  const updateCenter = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    centerRef.current = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    };
  }, []);

  // ── Process pointer position → normalized joystick output ──
  const processPointer = useCallback((clientX: number, clientY: number) => {
    const cx = centerRef.current.x;
    const cy = centerRef.current.y;

    let dx = clientX - cx;
    let dy = clientY - cy;

    // Clamp to circular boundary
    const dist = Math.hypot(dx, dy);
    if (dist > MAX_DISPLACEMENT) {
      const scale = MAX_DISPLACEMENT / dist;
      dx *= scale;
      dy *= scale;
    }

    // Apply dead zone
    if (dist < DEAD_ZONE_PX) {
      dx = 0;
      dy = 0;
    }

    // Normalize to -1..1 range
    const nx = dx / MAX_DISPLACEMENT;
    const ny = -dy / MAX_DISPLACEMENT; // invert Y: screen-down → negative (backward)

    // Direct DOM update for zero-lag (no transition during drag)
    if (thumbRef.current) {
      thumbRef.current.style.transition = 'box-shadow 0.15s ease, border-color 0.15s ease';
    }
    applyThumbOffset(dx, dy);

    joystickStore.set(nx, ny, true);
  }, [applyThumbOffset]);

  // ── Release handler — spring-back to center with CSS transition ──
  const releaseJoystick = useCallback(() => {
    activePointerId.current = null;
    setActive(false);
    setThumbOffset({ x: 0, y: 0 });
    joystickStore.reset();

    // Two-frame spring-back: add transition first, then animate to center.
    // This ensures the browser sees the transition before the transform change.
    if (thumbRef.current) {
      const thumb = thumbRef.current;
      // Frame 1: enable spring-back transition
      thumb.style.transition =
        'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.2s ease, border-color 0.2s ease';
      // Frame 2: animate to center
      requestAnimationFrame(() => {
        thumb.style.transform = 'translate(-50%, -50%)';
      });
    }
  }, []);

  // ── Pointer down on outer ring ──
  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      // Multi-touch safety: only track one pointer
      if (activePointerId.current !== null) return;

      e.preventDefault();
      e.stopPropagation();

      const el = containerRef.current;
      if (!el) return;

      el.setPointerCapture(e.pointerId);
      activePointerId.current = e.pointerId;

      updateCenter();
      setActive(true);
      processPointer(e.clientX, e.clientY);

      hapticLight();
    },
    [updateCenter, processPointer],
  );

  // ── Pointer move ──
  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerId.current === null) return;
      if (e.pointerId !== activePointerId.current) return;
      e.preventDefault();
      processPointer(e.clientX, e.clientY);
    },
    [processPointer],
  );

  // ── Pointer up / cancel ──
  const handlePointerEnd = useCallback(
    (e: React.PointerEvent) => {
      if (activePointerId.current === null) return;
      if (e.pointerId !== activePointerId.current) return;
      e.preventDefault();
      const el = containerRef.current;
      if (el && el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      releaseJoystick();
    },
    [releaseJoystick],
  );

  const handleLostPointerCapture = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerId === activePointerId.current) {
        releaseJoystick();
      }
    },
    [releaseJoystick],
  );

  // ── Reset on blur / visibility change ──
  useEffect(() => {
    const onBlur = () => releaseJoystick();
    const onVisibility = () => {
      if (document.hidden) releaseJoystick();
    };
    window.addEventListener('blur', onBlur);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', onBlur);
      document.removeEventListener('visibilitychange', onVisibility);
      releaseJoystick();
    };
  }, [releaseJoystick]);

  // ── Hidden on desktop ──
  if (!isTouchDevice) return null;

  // Thumb always renders from React state; during drag the DOM is
  // updated directly for zero-lag, so the React style is just the fallback.

  return (
    <div
      className="fixed inset-0"
      style={{
        zIndex: UI_LAYERS.MOBILE_CONTROLS,
        pointerEvents: 'none',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
      data-testid="virtual-joystick-layer"
      aria-hidden="true"
    >
      <div
        ref={containerRef}
        style={{
          position: 'absolute',
          bottom: 24,
          left: 24,
          pointerEvents: 'auto',
          touchAction: 'none',
          animation: active ? 'none' : 'vj-pulse 3s ease-in-out infinite',
          boxShadow: `0 0 20px rgba(${CYBER_CYAN_RGB}, 0.12), inset 0 0 24px rgba(${CYBER_CYAN_RGB}, 0.05)`,
          ...outerRingBaseStyle,
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onLostPointerCapture={handleLostPointerCapture}
        role="slider"
        aria-label="Виртуальный джойстик — управление перемещением"
        aria-valuetext={active
          ? `Направление: X ${joystickStore.getState().x.toFixed(1)}, Y ${joystickStore.getState().y.toFixed(1)}`
          : 'Центр'
        }
        aria-valuemin={-1}
        aria-valuemax={1}
        tabIndex={-1}
        data-testid="virtual-joystick"
      >
        {/* Inner thumb */}
        <div
          ref={thumbRef}
          style={getThumbStyle(thumbOffset.x, thumbOffset.y, active)}
          aria-hidden="true"
        />

        {/* Directional indicators (subtle crosshair arrows) */}
        {!active && (
          <svg
            className="absolute inset-0 pointer-events-none"
            viewBox={`0 0 ${OUTER_SIZE} ${OUTER_SIZE}`}
            fill="none"
            aria-hidden="true"
          >
            {/* Forward (up) */}
            <path
              d={`M ${OUTER_SIZE / 2} 14 L ${OUTER_SIZE / 2 - 6} 24 L ${OUTER_SIZE / 2 + 6} 24 Z`}
              fill={`rgba(${CYBER_CYAN_RGB}, 0.25)`}
            />
            {/* Backward (down) */}
            <path
              d={`M ${OUTER_SIZE / 2} ${OUTER_SIZE - 14} L ${OUTER_SIZE / 2 - 6} ${OUTER_SIZE - 24} L ${OUTER_SIZE / 2 + 6} ${OUTER_SIZE - 24} Z`}
              fill={`rgba(${CYBER_CYAN_RGB}, 0.15)`}
            />
            {/* Left */}
            <path
              d={`M 14 ${OUTER_SIZE / 2} L 24 ${OUTER_SIZE / 2 - 6} L 24 ${OUTER_SIZE / 2 + 6} Z`}
              fill={`rgba(${CYBER_CYAN_RGB}, 0.15)`}
            />
            {/* Right */}
            <path
              d={`M ${OUTER_SIZE - 14} ${OUTER_SIZE / 2} L ${OUTER_SIZE - 24} ${OUTER_SIZE / 2 - 6} L ${OUTER_SIZE - 24} ${OUTER_SIZE / 2 + 6} Z`}
              fill={`rgba(${CYBER_CYAN_RGB}, 0.15)`}
            />
          </svg>
        )}
      </div>
    </div>
  );
}

/* ─── Keyframe Animation (injected once) ─── */

if (typeof document !== 'undefined' && !document.getElementById('vj-keyframes')) {
  const style = document.createElement('style');
  style.id = 'vj-keyframes';
  style.textContent = `
    @keyframes vj-pulse {
      0%, 100% {
        box-shadow: 0 0 20px rgba(${CYBER_CYAN_RGB}, 0.10), inset 0 0 24px rgba(${CYBER_CYAN_RGB}, 0.04);
        border-color: rgba(${CYBER_CYAN_RGB}, 0.30);
      }
      50% {
        box-shadow: 0 0 32px rgba(${CYBER_CYAN_RGB}, 0.22), inset 0 0 30px rgba(${CYBER_CYAN_RGB}, 0.08);
        border-color: rgba(${CYBER_CYAN_RGB}, 0.50);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      @keyframes vj-pulse {
        0%, 100% { opacity: 1; }
      }
    }
  `;
  document.head.appendChild(style);
}
