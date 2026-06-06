/* ─── Volodka RPG – camera orbit / zoom input ─── */
/* Extracted from FollowCamera: mouse drag, wheel zoom, touch, Shift+R reset. */

import { useEffect, type MutableRefObject } from 'react';
import type { WebGLRenderer } from 'three';
import { useGameStore } from '@/store/gameStore';
import { getSceneConfig } from '@/config/scenes';
import { getSceneDefaultDistance, MIN_DISTANCE, MAX_DISTANCE } from '@/engine/camera/cameraConstants';
import { getInteractionState } from '@/components/3d/InteractionSystemBridge';
import { InteractionState } from '@/engine/interaction/interactionMachine';
import { isNarrativeMovementLocked } from '@/shared/exploreHubNodes';

const PITCH_MIN = -0.5;
const PITCH_MAX = 1.3;
const ORBIT_SENSITIVITY = 0.004;
const ZOOM_SENSITIVITY = 0.002;
const ZOOM_LINE_MULTIPLIER = 40;
const ZOOM_PAGE_MULTIPLIER = 800;
const ZOOM_PIXEL_STEP = 0.15;

export interface CameraOrbitInputRefs {
  yawRef: MutableRefObject<number>;
  pitchRef: MutableRefObject<number>;
  distanceRef: MutableRefObject<number>;
  interactionDistanceRef: MutableRefObject<number>;
  isDraggingRef: MutableRefObject<boolean>;
  lastMouseRef: MutableRefObject<{ x: number; y: number }>;
}

function shouldBlockOrbit(): boolean {
  const { mode, showStoryOverlay, currentNodeId } = useGameStore.getState();
  if (isNarrativeMovementLocked(showStoryOverlay, currentNodeId) || mode === 'cutscene') return true;
  return getInteractionState() === InteractionState.Dialogue;
}

function shouldBlockZoom(): boolean {
  const { mode, showStoryOverlay, currentNodeId } = useGameStore.getState();
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

      yawRef.current -= dx * ORBIT_SENSITIVITY;
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + dy * ORBIT_SENSITIVITY),
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

      let rawChange = normalizedDelta * ZOOM_SENSITIVITY;
      if (Math.abs(rawChange) < ZOOM_PIXEL_STEP && Math.abs(rawChange) > 0.001) {
        rawChange = rawChange > 0 ? ZOOM_PIXEL_STEP : -ZOOM_PIXEL_STEP;
      }

      const newDist = Math.max(
        MIN_DISTANCE,
        Math.min(MAX_DISTANCE, distanceRef.current + rawChange),
      );
      distanceRef.current = newDist;
      interactionDistanceRef.current = newDist;
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

      yawRef.current -= dx * ORBIT_SENSITIVITY * 1.5;
      pitchRef.current = Math.max(
        PITCH_MIN,
        Math.min(PITCH_MAX, pitchRef.current + dy * ORBIT_SENSITIVITY * 1.5),
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
  ]);
}
