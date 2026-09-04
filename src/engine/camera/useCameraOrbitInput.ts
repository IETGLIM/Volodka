/* ─── Volodka RPG – camera orbit / zoom input ─── */
/* Extracted from FollowCamera: mouse drag, wheel zoom, touch, Shift+R reset. */

import { useEffect, type MutableRefObject } from 'react';
import type { WebGLRenderer } from 'three';
import { getGameSnapshot } from '@/engine/GameActionDispatcher';
import { getSceneConfig } from '@/config/scenes';
import {
  getSceneDefaultDistance,
  MIN_DISTANCE,
  MAX_DISTANCE,
  ZOOM_WHEEL_EXP,
  ZOOM_WHEEL_MIN_STEP,
  FIRST_PERSON_FOV_MIN,
  FIRST_PERSON_FOV_MAX,
  CAMERA_INERTIA_GAIN,
  CAMERA_INERTIA_DECAY,
} from '@/engine/camera/cameraConstants';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { getVisualSettings } from '@/engine/visualSettings';
import { isCanvasAreaTarget } from '@/engine/input/domUtils';
import { isCinematicTimelineActive } from '@/engine/cinematic/cinematicTimelineOrchestrator';

const PITCH_MIN = -0.5;
const PITCH_MAX = 1.3;
const ORBIT_SENSITIVITY = 0.004;
/**
 * Pinch-zoom (2 пальца): экспонента чувствительности на пиксель изменения
 * размаха. 0.008 → размах 200px ≈ exp(-1.6) ≈ 0.2x дистанции (5x зум-ин).
 * Согласовано по ощущению с ZOOM_WHEEL_EXP (колесо).
 */
const PINCH_ZOOM_EXP = 0.008;
/** Clamp for the rAF inertia dt — tab switches / rAF throttling must not
 *  teleport the camera or blow up the decay math. */
const INERTIA_DT_MAX_S = 0.1;
/** _inertia*Vel is accumulated per mouse event as a "per 60Hz frame" delta —
 *  converting to seconds needs the 60Hz reference rate. */
const INERTIA_REF_FPS = 60;

// ── Rotation inertia state (module-level, persists across effect re-runs) ──
let _inertiaYawVel = 0;
let _inertiaPitchVel = 0;
const ZOOM_LINE_MULTIPLIER = 40;
const ZOOM_PAGE_MULTIPLIER = 800;
/** Match InteractiveTriggers — short LMB click = interact, drag = look (FP). */
const LMB_LOOK_DRAG_THRESHOLD_PX = 12;

export interface CameraOrbitInputRefs {
  yawRef: MutableRefObject<number>;
  pitchRef: MutableRefObject<number>;
  distanceRef: MutableRefObject<number>;
  interactionDistanceRef: MutableRefObject<number>;
  isDraggingRef: MutableRefObject<boolean>;
  lastMouseRef: MutableRefObject<{ x: number; y: number }>;
  /** Set to 1 on wheel — FollowCamera snaps the spring toward the new distance. */
  zoomSnapRef: MutableRefObject<number>;
  /** When true, wheel adjusts FOV instead of orbit distance. */
  firstPersonRef?: MutableRefObject<boolean>;
  fovRef?: MutableRefObject<number>;
}

function shouldBlockOrbit(): boolean {
  const { showStoryOverlay, currentNodeId, mode } = getGameSnapshot();
  // Session 12-B: also block during the 'intro' phase (intro wake cinematic).
  // The timeline owns the camera during intro, so any user drag/touch/gamepad
  // orbit input would silently mutate the yaw/pitch refs — confusing because
  // the camera doesn't visibly move (timeline overrides), and the mutated refs
  // would carry into the post-cinematic exploration pose. `isCinematicTimelineActive()`
  // is the robust gate (catches ANY active timeline, not just intro) — but we
  // also keep the explicit `mode === 'intro'` check for the brief window where
  // the timeline hasn't started yet but the intro phase is already set (e.g.
  // the 200ms settle delay before startCinematicTimeline).
  if (
    isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '')
    || mode === 'cutscene'
    || mode === 'combat'
    || mode === 'intro'
    || isCinematicTimelineActive()
  ) {
    return true;
  }
  return getInteractionState() === InteractionState.Dialogue;
}

function shouldBlockZoom(): boolean {
  const { showStoryOverlay, currentNodeId, mode } = getGameSnapshot();
  // Session 12-B: block zoom during any active cinematic timeline. The
  // `mode !== 'exploration'` check already covers the 'intro' phase (since
  // intro is a distinct phase from exploration), so we only add the
  // isCinematicTimelineActive() gate here for the timeline-active-but-mode-
  // not-yet-cutscene race window.
  if (
    mode !== 'exploration'
    || isNarrativeMovementLocked(showStoryOverlay, currentNodeId ?? '')
    || isCinematicTimelineActive()
  ) return true;
  return getInteractionState() === InteractionState.Dialogue;
}

function tryRequestPointerLock(canvasEl: HTMLCanvasElement | null): void {
  if (!canvasEl) return;
  const { pointerLockEnabled } = getVisualSettings();
  if (!pointerLockEnabled) return;
  if (document.pointerLockElement === canvasEl) return;
  void canvasEl.requestPointerLock();
}

function exitPointerLockIfOurs(canvasEl: HTMLCanvasElement | null): void {
  if (!canvasEl) return;
  if (document.pointerLockElement === canvasEl) {
    document.exitPointerLock();
  }
}

/** Wire DOM listeners that mutate orbit refs (yaw, pitch, distance). */
export function useCameraOrbitInput(
  gl: WebGLRenderer,
  refs: CameraOrbitInputRefs,
): void {
  const {
    yawRef,
    pitchRef,
    distanceRef,
    interactionDistanceRef,
    isDraggingRef,
    lastMouseRef,
    zoomSnapRef,
    firstPersonRef,
    fovRef } = refs;

  useEffect(() => {
    let lmbDown = false;
    let rmbDown = false;
    let mmbDown = false;
    let lmbStart = { x: 0, y: 0 };
    let lmbLookActive = false;
    const canvasEl = gl.domElement;

    const syncDraggingFlag = () => {
      isDraggingRef.current = lmbLookActive || rmbDown || mmbDown;
    };

    const applyOrbitDelta = (dx: number, dy: number, sensScale = 1, applyInertia = false) => {
      const { mouseSensitivity, invertY } = getVisualSettings();
      const sens = ORBIT_SENSITIVITY * sensScale * mouseSensitivity;
      const rawYawDelta = -dx * sens;
      const rawPitchDelta = dy * sens * (invertY ? -1 : 1);
      yawRef.current += rawYawDelta;
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + rawPitchDelta),
      );
      // Accumulate inertia velocity (used for momentum continue)
      if (applyInertia) {
        _inertiaYawVel += rawYawDelta * CAMERA_INERTIA_GAIN;
        _inertiaPitchVel += rawPitchDelta * CAMERA_INERTIA_GAIN;
        ensureInertiaLoop();
      }
    };

    // ── Inertia update loop: apply decaying angular velocity each frame ──
    // Audit 2-b P1: previously the decay assumed a fixed dt of 1/60 — on high
    // refresh monitors (144Hz) the rotation ran 2.4× faster and decayed 2.4×
    // faster. Now the real rAF timestamp delta drives both the applied step
    // (velocity is "per 60Hz frame", scaled by dt·60) and the exponential
    // decay, so the feel matches across 60/120/144Hz displays. dt is clamped
    // to [0, INERTIA_DT_MAX_S] so a background tab doesn't snap the camera.
    // The loop also (re)starts on new drag input — previously it stopped for
    // good once the velocity decayed, so momentum never applied after that.
    let _inertiaRaf = 0;
    // Pinch-zoom состояние (живёт в замыкании эффекта, сбрасывается на blur/unmount)
    let _isPinching = false;
    let _pinchLastDist = 0;
    let _inertiaPrevTime = 0;
    let _inertiaLoopActive = false;
    const updateInertia = (now: number) => {
      const prev = _inertiaPrevTime;
      _inertiaPrevTime = now;
      if (
        prev > 0
        && (Math.abs(_inertiaYawVel) > 1e-6 || Math.abs(_inertiaPitchVel) > 1e-6)
      ) {
        const dt = Math.min(Math.max((now - prev) / 1000, 0), INERTIA_DT_MAX_S);
        const step = dt * INERTIA_REF_FPS;
        yawRef.current += _inertiaYawVel * step;
        pitchRef.current = Math.max(
          PITCH_MIN,
          Math.min(PITCH_MAX, pitchRef.current + _inertiaPitchVel * step),
        );
        const decay = 1 - Math.exp(-CAMERA_INERTIA_DECAY * dt);
        _inertiaYawVel *= (1 - decay);
        _inertiaPitchVel *= (1 - decay);
      }
      if (Math.abs(_inertiaYawVel) > 1e-6 || Math.abs(_inertiaPitchVel) > 1e-6) {
        _inertiaRaf = requestAnimationFrame(updateInertia);
      } else {
        _inertiaYawVel = 0;
        _inertiaPitchVel = 0;
        _inertiaLoopActive = false;
      }
    };
    const ensureInertiaLoop = () => {
      if (_inertiaLoopActive) return;
      _inertiaLoopActive = true;
      _inertiaPrevTime = 0; // dt baseline resets on (re)start
      _inertiaRaf = requestAnimationFrame(updateInertia);
    };
    // Start inertia loop on mount
    ensureInertiaLoop();

    const onMouseDown = (e: MouseEvent) => {
      if (shouldBlockOrbit()) return;

      // LMB drag-to-orbit — drag threshold preserves click-to-interact.
      if (e.button === 0 && isCanvasAreaTarget(e.target)) {
        lmbDown = true;
        lmbLookActive = false;
        lmbStart = { x: e.clientX, y: e.clientY };
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        return;
      }

      if (e.button === 2 || e.button === 1) {
        if (e.button === 2) rmbDown = true;
        if (e.button === 1) mmbDown = true;
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        // Max Payne freelook: RMB + pointer lock when enabled (TP and FP).
        if (e.button === 2 && isCanvasAreaTarget(e.target)) {
          tryRequestPointerLock(canvasEl);
        }
        e.preventDefault();
      }
    };

    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) {
        lmbDown = false;
        lmbLookActive = false;
      }
      if (e.button === 2) {
        rmbDown = false;
        exitPointerLockIfOurs(canvasEl);
      }
      if (e.button === 1) {
        mmbDown = false;
      }
      syncDraggingFlag();
    };

    const onBlur = () => {
      lmbDown = false;
      rmbDown = false;
      mmbDown = false;
      lmbLookActive = false;
      isDraggingRef.current = false;
      // Pinch-состояние тоже сбрасываем — иначе «залипший» pinch заблокирует
      // одиночный орбит после alt-tab посреди жеста.
      _isPinching = false;
      _pinchLastDist = 0;
      exitPointerLockIfOurs(canvasEl);
    };

    const onMouseMove = (e: MouseEvent) => {
      // Pointer-lock freelook (RMB hold or FP) — movementX/Y owns look.
      if (
        canvasEl
        && document.pointerLockElement === canvasEl
        && (e.movementX !== 0 || e.movementY !== 0)
      ) {
        if (firstPersonRef?.current || rmbDown) {
          applyOrbitDelta(e.movementX, e.movementY, 1, true);
          isDraggingRef.current = true;
          return;
        }
      }

      if (lmbDown) {
        if (!lmbLookActive) {
          const dx0 = e.clientX - lmbStart.x;
          const dy0 = e.clientY - lmbStart.y;
          if (dx0 * dx0 + dy0 * dy0 < LMB_LOOK_DRAG_THRESHOLD_PX * LMB_LOOK_DRAG_THRESHOLD_PX) {
            return;
          }
          if (firstPersonRef?.current) {
            tryRequestPointerLock(canvasEl);
          }
          lmbLookActive = true;
          // Critical: suppress soft auto-follow while LMB-orbiting.
          isDraggingRef.current = true;
          lastMouseRef.current = { x: e.clientX, y: e.clientY };
        }
        const dx = e.clientX - lastMouseRef.current.x;
        const dy = e.clientY - lastMouseRef.current.y;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        applyOrbitDelta(dx, dy, 1, true);
        return;
      }

      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };
      applyOrbitDelta(dx, dy, 1, true);
    };

    const onWheel = (e: WheelEvent) => {
      if (shouldBlockZoom()) return;

      e.preventDefault();
      e.stopPropagation();

      let normalizedDelta = e.deltaY;
      if (e.deltaMode === 1) {
        normalizedDelta *= ZOOM_LINE_MULTIPLIER;
      } else if (e.deltaMode === 2) {
        normalizedDelta *= ZOOM_PAGE_MULTIPLIER;
      }

      if (firstPersonRef?.current && fovRef) {
        const fovDelta = -normalizedDelta * 0.035;
        fovRef.current = Math.max(
          FIRST_PERSON_FOV_MIN,
          Math.min(FIRST_PERSON_FOV_MAX, fovRef.current + fovDelta),
        );
        zoomSnapRef.current = 1;
        return;
      }

      const factor = Math.exp(normalizedDelta * ZOOM_WHEEL_EXP);
      let newDist = distanceRef.current * factor;
      const linearFallback = normalizedDelta * ZOOM_WHEEL_MIN_STEP;
      if (Math.abs(newDist - distanceRef.current) < ZOOM_WHEEL_MIN_STEP * 0.5) {
        newDist = distanceRef.current + linearFallback;
      }
      newDist = Math.max(MIN_DISTANCE, Math.min(MAX_DISTANCE, newDist));
      distanceRef.current = newDist;
      interactionDistanceRef.current = newDist;
      zoomSnapRef.current = 1;
    };

    const onContextMenu = (e: Event) => {
      e.preventDefault();
    };

    const onTouchStart = (e: TouchEvent) => {
      if (shouldBlockOrbit()) return;

      // ── PINCH-ZOOM (AAA-мобилки): 2 пальца на canvas → зум камеры.
      // Раньше pinch отсутствовал (только 1-палец орбит) — мобильные игроки
      // не могли приблизить/отдалить камеру. ──
      if (e.touches.length === 2 && isCanvasAreaTarget(e.target)) {
        isDraggingRef.current = false; // орбит одиночным пальцем отключается
        _isPinching = true;
        _pinchLastDist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        return;
      }

      if (e.touches.length === 1 && isCanvasAreaTarget(e.target)) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      // ── Pinch: инкрементальный зум как у колеса (exp-фактор) ──
      if (_isPinching && e.touches.length === 2) {
        const dist = Math.hypot(
          e.touches[0].clientX - e.touches[1].clientX,
          e.touches[0].clientY - e.touches[1].clientY,
        );
        const delta = dist - _pinchLastDist;
        _pinchLastDist = dist;
        if (Math.abs(delta) < 0.5) return;

        if (firstPersonRef?.current && fovRef) {
          // Как у колеса: pinch наружу (delta>0) → FOV меньше → визуальный зум-ин.
          fovRef.current = Math.max(
            FIRST_PERSON_FOV_MIN,
            Math.min(FIRST_PERSON_FOV_MAX, fovRef.current - delta * 0.035),
          );
        } else {
          // Pinch наружу (delta>0) → камера ближе: exp(-delta·k) < 1.
          const factor = Math.exp(-delta * PINCH_ZOOM_EXP);
          const newDist = Math.max(
            MIN_DISTANCE,
            Math.min(MAX_DISTANCE, distanceRef.current * factor),
          );
          distanceRef.current = newDist;
          interactionDistanceRef.current = newDist;
        }
        zoomSnapRef.current = 1;
        return;
      }

      if (!isDraggingRef.current || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - lastMouseRef.current.x;
      const dy = e.touches[0].clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };

      const { mouseSensitivity, invertY } = getVisualSettings();
      const sens = ORBIT_SENSITIVITY * 1.5 * mouseSensitivity;
      yawRef.current -= dx * sens;
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + dy * sens * (invertY ? -1 : 1)),
      );
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (_isPinching) {
        if (e.touches.length < 2) {
          _isPinching = false;
          _pinchLastDist = 0;
        }
        // Остался ровно 1 палец → бесшовно переармим орбит без рывка:
        // lastMouse должен прыгнуть на позицию оставшегося пальца.
        if (e.touches.length === 1 && !shouldBlockOrbit() && isCanvasAreaTarget(e.target)) {
          isDraggingRef.current = true;
          lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        } else if (e.touches.length === 0) {
          isDraggingRef.current = false;
        }
        return;
      }
      isDraggingRef.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && e.shiftKey) {
        // FIX: гейт shouldBlockOrbit() — раньше Shift+R мутировал yaw/pitch
        // во время кат-сцен/диалогов/таймлайнов, и смещённые рефы протекали
        // в пост-катсценную позу камеры.
        if (shouldBlockOrbit()) return;
        e.preventDefault();
        const currentSceneId = getGameSnapshot().exploration.currentSceneId;
        const config = getSceneConfig(currentSceneId);
        const sceneDist = getSceneDefaultDistance(currentSceneId);
        yawRef.current = (config.initialRotation ?? 0) + Math.PI;
        pitchRef.current = 0.3;
        distanceRef.current = sceneDist;
        interactionDistanceRef.current = sceneDist;
      }
    };

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('blur', onBlur);
    if (canvasEl) {
      canvasEl.addEventListener('wheel', onWheel, { passive: false, capture: true });
    }
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      cancelAnimationFrame(_inertiaRaf);
      _inertiaLoopActive = false;
      _inertiaYawVel = 0;
      _inertiaPitchVel = 0;
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('blur', onBlur);
      if (canvasEl) {
        canvasEl.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
      }
      window.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('touchstart', onTouchStart);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onTouchEnd);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [
    gl,
    yawRef,
    pitchRef,
    distanceRef,
    interactionDistanceRef,
    isDraggingRef,
    lastMouseRef,
    zoomSnapRef,
    firstPersonRef,
    fovRef,
  ]);
}
