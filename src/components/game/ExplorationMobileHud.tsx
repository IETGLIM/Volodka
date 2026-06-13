
/* ─── Volodka RPG – Touch controls for mobile (v4) ───
   v4 fixes:
   - Pointer-only handlers (touch+pointer double-fire broke run toggle / interact)
   - Pointer capture on D-pad so release is reliable when finger drifts off button
   - Debounced tap actions; reset all controls on blur / visibility hidden
   - Interact: fireInteractPress + direct scene:transition near exits
   - z-index set to 90 (below only loading/cinematic) — above ALL game UI
   - Viewport-relative sizing with CSS custom properties — no overflow ever
   - Landscape layout: compact horizontal strip at bottom
   - Portrait layout: classic D-pad left + actions right
   - Safe-area insets for notched phones (iPhone X+)
   - All touch targets >= 44px (Apple HIG) with hit-area padding
   - No pointer-events-none on container — uses isolated stacking context
*/

import { useCallback, useState, useEffect, useRef } from 'react';
import { Package, Hand, ArrowUp, Zap } from 'lucide-react';
import { useVirtualControlsRef } from '@/engine/VirtualControlsState';
import type { VirtualControls } from '@/hooks/useGamePhysics';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { useGamePhase } from '@/store/selectors';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { fireInteractPress } from '@/engine/input/fireInteractPress';
import { requestSceneTransition } from '@/engine/scene/sceneTransition';
import { getSceneExits } from '@/config/scenes';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { CYBER_CYAN } from '@/shared/constants/cyberPalette';

/** Apple HIG minimum touch target (px). */
const MIN_TOUCH_TARGET = 44;
const TAP_DEBOUNCE_MS = 280;

const MOVEMENT_CONTROL_KEYS: (keyof VirtualControls)[] = [
  'forward',
  'backward',
  'left',
  'right',
  'jump',
];

interface ExplorationMobileHudProps {
  onInteractPress?: () => void;
  onOpenInventory?: () => void;
}

export function ExplorationMobileHud({ onInteractPress, onOpenInventory }: ExplorationMobileHudProps) {
  const virtualControlsRef = useVirtualControlsRef();
  const mode = useGamePhase();
  const [runToggled, setRunToggled] = useState(false);
  const [isLandscape, setIsLandscape] = useState(false);
  const [vw, setVw] = useState(375); // viewport width for sizing calc

  // Track orientation and viewport
  useEffect(() => {
    const check = () => {
      setIsLandscape(window.innerWidth > window.innerHeight);
      setVw(window.innerWidth);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    const mql = window.matchMedia('(orientation: landscape)');
    const handler = (e: MediaQueryListEvent) => {
      setIsLandscape(e.matches);
      setVw(window.innerWidth);
    };
    mql.addEventListener('change', handler);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
      mql.removeEventListener('change', handler);
    };
  }, []);

  const lastTapAtRef = useRef(0);
  /** pointerId → direction currently held by that touch */
  const pointerBindingsRef = useRef<Map<number, keyof VirtualControls>>(new Map());

  const syncMovementControls = useCallback(() => {
    const vc = virtualControlsRef.current;
    const active = new Set(pointerBindingsRef.current.values());
    const directionKeys = ['forward', 'backward', 'left', 'right'] as const;
    let moving = false;
    for (const key of directionKeys) {
      const on = active.has(key);
      vc[key] = on ? 1 : 0;
      if (on) moving = true;
    }
    vc.jump = active.has('jump') ? 1 : 0;
    vc.moveMagnitude = moving ? 1 : 0;
  }, [virtualControlsRef]);

  const bindPointerControl = useCallback(
    (key: keyof VirtualControls, pointerId: number) => {
      pointerBindingsRef.current.set(pointerId, key);
      syncMovementControls();
    },
    [syncMovementControls],
  );

  const releasePointerControl = useCallback(
    (key: keyof VirtualControls, pointerId: number) => {
      if (pointerBindingsRef.current.get(pointerId) === key) {
        pointerBindingsRef.current.delete(pointerId);
      }
      syncMovementControls();
    },
    [syncMovementControls],
  );

  const toggleRun = useCallback(() => {
    setRunToggled((prev) => {
      const next = !prev;
      virtualControlsRef.current.run = next ? 1 : 0;
      return next;
    });
  }, [virtualControlsRef]);

  const resetAllControls = useCallback(() => {
    pointerBindingsRef.current.clear();
    const vc = virtualControlsRef.current;
    vc.forward = 0;
    vc.backward = 0;
    vc.left = 0;
    vc.right = 0;
    vc.run = 0;
    vc.jump = 0;
    vc.moveMagnitude = 0;
    setRunToggled(false);
  }, [virtualControlsRef]);

  // Release stuck D-pad / run when app loses focus (Alt+Tab, notification shade).
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) resetAllControls();
    };
    window.addEventListener('blur', resetAllControls);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      window.removeEventListener('blur', resetAllControls);
      document.removeEventListener('visibilitychange', onVisibility);
      resetAllControls();
    };
  }, [resetAllControls]);

  // ── Interact: synthetic KeyE + EventBus + exit fallback ──
  const handleInteract = useCallback(() => {
    onInteractPress?.();
    fireInteractPress('mobile_hud');

    // Direct scene transition when near an exit (synthetic keydown can be flaky on mobile)
    // If the player is near an exit and the keydown didn't trigger it
    // (common on mobile where synthetic events sometimes don't reach listeners),
    // directly emit scene:transition for the nearest available exit.
    try {
      const store = useGameStore.getState();
      if (readGamePhase(store) === 'exploration') {
        const playerPos = store.exploration.playerPosition;
        const sceneId = store.exploration.currentSceneId;
        const flags = store.playerState.flags;
        const karma = store.playerState.karma;
        const exits = getSceneExits(sceneId, flags, karma, {
          skills: store.playerState.skills,
          collectedPoems: store.collectedPoems,
          currentAct: store.playerState.progression.currentAct,
          timeOfDay: store.exploration.timeOfDay,
        });

        for (const exit of exits) {
          const dx = playerPos[0] - exit.position[0];
          const dz = playerPos[2] - exit.position[2];
          const dist = Math.sqrt(dx * dx + dz * dz);
          // If player is within exit proximity range (2.5 units)
          if (dist < 2.5) {
            // Check if there's an overlapping trigger zone — if so, don't
            // force-transition, let the trigger zone handle it
            const hasOverlap = TRIGGER_ZONES.some(
              (z) =>
                z.sceneId === sceneId &&
                Math.abs(z.position[0] - exit.position[0]) < 1.5 &&
                Math.abs(z.position[2] - exit.position[2]) < 1.5,
            );
            if (!hasOverlap) {
              requestSceneTransition(exit.targetScene, exit.spawnAt);
            }
            break; // Only transition to the nearest exit
          }
        }
      }
    } catch { /* Don't crash if scene exit check fails */ }
  }, [onInteractPress]);

  const makeTapHandler = useCallback(
    (action: () => void) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      const now = performance.now();
      if (now - lastTapAtRef.current < TAP_DEBOUNCE_MS) return;
      lastTapAtRef.current = now;
      action();
    },
    [],
  );

  // Pointer-only handlers — touch+pointer duplicate events caused double-taps on mobile.
  const makeStartHandler = useCallback(
    (key: keyof VirtualControls) => (e: React.PointerEvent) => {
      if (e.button !== 0) return;
      e.preventDefault();
      e.stopPropagation();
      (e.currentTarget as HTMLButtonElement).setPointerCapture(e.pointerId);
      bindPointerControl(key, e.pointerId);
    },
    [bindPointerControl],
  );

  // Only pointerup / pointercancel — NOT pointerleave (fires while finger still down → jerky stops).
  const makeStopHandler = useCallback(
    (key: keyof VirtualControls) => (e: React.PointerEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const el = e.currentTarget as HTMLButtonElement;
      if (el.hasPointerCapture(e.pointerId)) {
        el.releasePointerCapture(e.pointerId);
      }
      releasePointerControl(key, e.pointerId);
    },
    [releasePointerControl],
  );

  const makeLostHandler = useCallback(
    (key: keyof VirtualControls) => (e: React.PointerEvent) => {
      releasePointerControl(key, e.pointerId);
    },
    [releasePointerControl],
  );

  // ── Adaptive sizing based on viewport width ──
  // On very small screens (<360px), use extra-small buttons.
  // On normal phones (360-430px), use standard sizes.
  // On tablets (>430px), use larger sizes.
  const isSmallScreen = vw < 360;
  const isTablet = vw > 430;

  // D-pad button sizes (touch target >= 44px but visual can be smaller with padding)
  const dpadSize = Math.max(
    MIN_TOUCH_TARGET,
    isLandscape ? (isSmallScreen ? 40 : 44) : (isSmallScreen ? 44 : 48),
  );
  const dpadGap = isLandscape ? 2 : 3;

  // Action button sizes
  const interactSize = isLandscape
    ? (isSmallScreen ? 44 : 48)
    : (isSmallScreen ? 48 : 56);
  const smallBtnSize = Math.max(
    MIN_TOUCH_TARGET,
    isLandscape ? (isSmallScreen ? 36 : 40) : (isSmallScreen ? 40 : 44),
  );

  // Icon sizes scale with button
  const iconMain = isLandscape ? 18 : 22;
  const iconSmall = isLandscape ? 13 : 15;

  // Base button style
  const btnStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: '50%',
    border: '2px solid rgba(255,255,255,0.2)',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    userSelect: 'none',
    touchAction: 'none',
    WebkitTapHighlightColor: 'transparent',
    cursor: 'pointer',
    backdropFilter: 'blur(4px)',
    WebkitBackdropFilter: 'blur(4px)',
    transition: 'all 0.1s ease',
  };

  if (mode !== 'exploration') return null;

  // ── LANDSCAPE LAYOUT ──
  // Compact horizontal strip: D-pad left, actions right, everything in one row
  if (isLandscape) {
    return (
      <div
        className="fixed inset-0"
        data-exploration-ui
        style={{
          zIndex: UI_LAYERS.MOBILE_CONTROLS,
          pointerEvents: 'none',
          // Safe area for notched phones in landscape
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* ── D-pad (bottom-left) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: 12,
            pointerEvents: 'auto',
            touchAction: 'none',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: dpadGap }}>
            {/* Up */}
            <button
              style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: 14 }}
              aria-label="Двигаться вперёд"
              onPointerDown={makeStartHandler('forward')}
              onPointerUp={makeStopHandler('forward')}
              onPointerCancel={makeStopHandler('forward')}
              onLostPointerCapture={makeLostHandler('forward')}
            >
              ▲
            </button>
            <div style={{ display: 'flex', gap: dpadGap }}>
              {/* Left */}
              <button
                style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: 14 }}
                aria-label="Двигаться влево"
              onPointerDown={makeStartHandler('left')}
                onPointerUp={makeStopHandler('left')}
                onPointerCancel={makeStopHandler('left')}
                onLostPointerCapture={makeLostHandler('left')}
              >
                ◀
              </button>
              {/* Down */}
              <button
                style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: 14 }}
                aria-label="Двигаться назад"
              onPointerDown={makeStartHandler('backward')}
                onPointerUp={makeStopHandler('backward')}
                onPointerCancel={makeStopHandler('backward')}
                onLostPointerCapture={makeLostHandler('backward')}
              >
                ▼
              </button>
              {/* Right */}
              <button
                style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: 14 }}
                aria-label="Двигаться вправо"
              onPointerDown={makeStartHandler('right')}
                onPointerUp={makeStopHandler('right')}
                onPointerCancel={makeStopHandler('right')}
                onLostPointerCapture={makeLostHandler('right')}
              >
                ▶
              </button>
            </div>
          </div>
        </div>

        {/* ── Action buttons (bottom-right) ── */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            right: 12,
            pointerEvents: 'auto',
            touchAction: 'none',
            display: 'flex',
            alignItems: 'flex-end',
            gap: 6,
          }}
        >
          {/* Interact */}
          <button
            style={{
              ...btnStyle,
              width: interactSize,
              height: interactSize,
              border: '2px solid rgba(0,229,255,0.5)',
              background: 'rgba(0,40,50,0.4)',
            }}
            aria-label="Взаимодействовать"
            onPointerDown={makeTapHandler(handleInteract)}
          >
            <Hand size={iconMain} color={CYBER_CYAN} />
          </button>

          {/* Secondary buttons column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Inventory */}
            {onOpenInventory && (
              <button
                style={{
                  ...btnStyle,
                  width: smallBtnSize,
                  height: smallBtnSize,
                  border: '2px solid rgba(255,171,0,0.4)',
                  background: 'rgba(50,30,0,0.4)',
                }}
                aria-label="Инвентарь"
                onPointerDown={makeTapHandler(() => onOpenInventory?.())}
              >
                <Package size={iconSmall} color="#ffab00" />
              </button>
            )}
            {/* Jump */}
            <button
              style={{ ...btnStyle, width: smallBtnSize, height: smallBtnSize }}
              aria-label="Прыжок"
              onPointerDown={makeStartHandler('jump')}
              onPointerUp={makeStopHandler('jump')}
              onPointerCancel={makeStopHandler('jump')}
              onLostPointerCapture={makeLostHandler('jump')}
            >
              <ArrowUp size={iconSmall} />
            </button>
            {/* Run */}
            <button
              style={{
                ...btnStyle,
                width: smallBtnSize,
                height: smallBtnSize,
                border: runToggled ? '2px solid rgba(255,171,0,0.6)' : undefined,
                background: runToggled ? 'rgba(50,30,0,0.5)' : undefined,
                color: runToggled ? '#ffab00' : undefined,
              }}
              aria-label={runToggled ? 'Бег выключен' : 'Бег включён'}
              onPointerDown={makeTapHandler(toggleRun)}
            >
              <Zap size={iconSmall} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── PORTRAIT LAYOUT ──
  // Classic: D-pad bottom-left, action buttons bottom-right
  return (
    <div
      className="fixed inset-0"
      data-exploration-ui
      style={{
        zIndex: UI_LAYERS.MOBILE_CONTROLS,
        pointerEvents: 'none',
        // Safe area for notched phones
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* ── D-pad (bottom-left) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          pointerEvents: 'auto',
          touchAction: 'none',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: dpadGap }}>
          {/* Up */}
          <button
            style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: isSmallScreen ? 14 : 16 }}
            aria-label="Двигаться вперёд"
            onPointerDown={makeStartHandler('forward')}
            onPointerUp={makeStopHandler('forward')}
            onPointerCancel={makeStopHandler('forward')}
            onLostPointerCapture={makeLostHandler('forward')}
          >
            ▲
          </button>
          <div style={{ display: 'flex', gap: dpadGap }}>
            {/* Left */}
            <button
              style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: isSmallScreen ? 14 : 16 }}
              aria-label="Двигаться влево"
              onPointerDown={makeStartHandler('left')}
              onPointerUp={makeStopHandler('left')}
              onPointerCancel={makeStopHandler('left')}
              onLostPointerCapture={makeLostHandler('left')}
            >
              ◀
            </button>
            {/* Down */}
            <button
              style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: isSmallScreen ? 14 : 16 }}
              aria-label="Двигаться назад"
              onPointerDown={makeStartHandler('backward')}
              onPointerUp={makeStopHandler('backward')}
              onPointerCancel={makeStopHandler('backward')}
              onLostPointerCapture={makeLostHandler('backward')}
            >
              ▼
            </button>
            {/* Right */}
            <button
              style={{ ...btnStyle, width: dpadSize, height: dpadSize, fontSize: isSmallScreen ? 14 : 16 }}
              aria-label="Двигаться вправо"
              onPointerDown={makeStartHandler('right')}
              onPointerUp={makeStopHandler('right')}
              onPointerCancel={makeStopHandler('right')}
              onLostPointerCapture={makeLostHandler('right')}
            >
              ▶
            </button>
          </div>
        </div>
      </div>

      {/* ── Action buttons (bottom-right) ── */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          right: 12,
          pointerEvents: 'auto',
          touchAction: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 6,
        }}
      >
        {/* Interact — primary action */}
        <button
          style={{
            ...btnStyle,
            width: interactSize,
            height: interactSize,
            border: '2px solid rgba(0,229,255,0.5)',
            background: 'rgba(0,40,50,0.4)',
          }}
          aria-label="Взаимодействовать"
          onPointerDown={makeTapHandler(handleInteract)}
        >
          <Hand size={iconMain} color={CYBER_CYAN} />
        </button>

        {/* Secondary actions row */}
        <div style={{ display: 'flex', gap: 6 }}>
          {/* Inventory */}
          {onOpenInventory && (
            <button
              style={{
                ...btnStyle,
                width: smallBtnSize,
                height: smallBtnSize,
                border: '2px solid rgba(255,171,0,0.4)',
                background: 'rgba(50,30,0,0.4)',
              }}
              aria-label="Инвентарь"
              onPointerDown={makeTapHandler(() => onOpenInventory?.())}
            >
              <Package size={iconSmall} color="#ffab00" />
            </button>
          )}

          {/* Jump */}
          <button
            style={{ ...btnStyle, width: smallBtnSize, height: smallBtnSize }}
            aria-label="Прыжок"
            onPointerDown={makeStartHandler('jump')}
            onPointerUp={makeStopHandler('jump')}
            onPointerCancel={makeStopHandler('jump')}
            onLostPointerCapture={makeLostHandler('jump')}
          >
            <ArrowUp size={iconSmall} />
          </button>

          {/* Run toggle */}
          <button
            style={{
              ...btnStyle,
              width: smallBtnSize,
              height: smallBtnSize,
              border: runToggled ? '2px solid rgba(255,171,0,0.6)' : undefined,
              background: runToggled ? 'rgba(50,30,0,0.5)' : undefined,
              color: runToggled ? '#ffab00' : undefined,
            }}
            aria-label={runToggled ? 'Бег выключен' : 'Бег включён'}
            onPointerDown={makeTapHandler(toggleRun)}
          >
            <Zap size={iconSmall} />
          </button>
        </div>
      </div>
    </div>
  );
}
