/* ─── Volodka RPG – camera orbit / zoom input ─── */
/* Extracted from FollowCamera: mouse drag, wheel zoom, touch, Shift+R reset. */

import { useEffect, type MutableRefObject } from 'react';
import type { WebGLRenderer } from 'three';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { getSceneConfig } from '@/config/scenes';
import {
  getSceneDefaultDistance,
  MIN_DISTANCE,
  MAX_DISTANCE,
  ZOOM_WHEEL_EXP,
  ZOOM_WHEEL_MIN_STEP,
  FIRST_PERSON_ENABLED,
  FIRST_PERSON_FOV_MIN,
  FIRST_PERSON_FOV_MAX,
} from '@/engine/camera/cameraConstants';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';
import { getVisualSettings } from '@/engine/visualSettings';

const PITCH_MIN = -0.5;
const PITCH_MAX = 1.3;
const ORBIT_SENSITIVITY = 0.004;
const ZOOM_LINE_MULTIPLIER = 40;
const ZOOM_PAGE_MULTIPLIER = 800;

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
  const state = useGameStore.getState();
  const { showStoryOverlay, currentNodeId } = state;
  const mode = readGamePhase(state);
  if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId) || mode === 'cutscene') return true;
  return getInteractionState() === InteractionState.Dialogue;
}

function shouldBlockZoom(): boolean {
  const state = useGameStore.getState();
  const { showStoryOverlay, currentNodeId } = state;
  const mode = readGamePhase(state);
  if (mode !== 'exploration' || isNarrativeMovementLocked(showStoryOverlay, currentNodeId)) return true;
  return getInteractionState() === InteractionState.Dialogue;
}

function isCanvasAreaTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement;
  const isCanvasElement = el.tagName === 'CANVAS';
  return (
    isCanvasElement ||
    !el.closest(
      '[data-exploration-ui], [data-panel], dialog, [role="dialog"], button, a, input, textarea',
    )
  );
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
    fovRef,
  } = refs;

  useEffect(() => {
    const onMouseDown = (e: MouseEvent) => {
      if (shouldBlockOrbit()) return;

      if (e.button === 2 || e.button === 1) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
        e.preventDefault();
      } else if (e.button === 0 && isCanvasAreaTarget(e.target)) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;
      const dx = e.clientX - lastMouseRef.current.x;
      const dy = e.clientY - lastMouseRef.current.y;
      lastMouseRef.current = { x: e.clientX, y: e.clientY };

      const { mouseSensitivity, invertY } = getVisualSettings();
      const sens = ORBIT_SENSITIVITY * mouseSensitivity;
      yawRef.current -= dx * sens;
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + dy * sens * (invertY ? -1 : 1)),
      );
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

      // Multiplicative zoom: scroll up pulls the camera toward the character's back faster
      // than linear deltas, especially when already close.
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

      if (e.touches.length === 1 && isCanvasAreaTarget(e.target)) {
        isDraggingRef.current = true;
        lastMouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      }
    };

    const onTouchMove = (e: TouchEvent) => {
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

    const onTouchEnd = () => {
      isDraggingRef.current = false;
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'KeyR' && e.shiftKey) {
        e.preventDefault();
        const currentSceneId = useGameStore.getState().exploration.currentSceneId;
        const config = getSceneConfig(currentSceneId);
        const sceneDist = getSceneDefaultDistance(currentSceneId);
        yawRef.current = (config.initialRotation ?? 0) + Math.PI;
        pitchRef.current = 0.3;
        distanceRef.current = sceneDist;
        interactionDistanceRef.current = sceneDist;
      }
    };

    const canvasEl = gl.domElement;

    window.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('mousemove', onMouseMove);
    if (canvasEl) {
      canvasEl.addEventListener('wheel', onWheel, { passive: false, capture: true });
    }
    window.addEventListener('wheel', onWheel, { passive: false, capture: true });
    window.addEventListener('contextmenu', onContextMenu);
    window.addEventListener('touchstart', onTouchStart, { passive: true });
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onTouchEnd);
    window.addEventListener('keydown', onKeyDown);

    return () => {
      window.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('mousemove', onMouseMove);
      if (canvasEl) {
        canvasEl.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
      }
      window.removeEventListener('wheel', onWheel, { capture: true } as EventListenerOptions);
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
