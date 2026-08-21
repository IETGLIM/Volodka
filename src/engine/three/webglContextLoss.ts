/**
 * WebGL context loss / restore handler.
 *
 * Installs event listeners on the canvas for 'webglcontextlost' and
 * 'webglcontextrestored'. On loss: pauses the game loop and displays a
 * Russian-language message. On restore: reinitializes GPU resources and
 * resumes the loop.
 *
 * Call `installContextLossHandler(canvas)` once after the WebGL canvas is
 * created. Returns an `uninstall` cleanup function.
 */

import { eventBus } from '@/engine/EventBus';
import { markCanvasFirstFrameSessionLost } from '@/engine/canvas/canvasFirstFrameSession';
import { resetGpuResourceBudgetTracker } from '@/engine/performance/GpuResourceBudgetTracker';
import { disposeAllModuleGeometries } from '@/engine/three/moduleGeometryRegistry';
import { disposeAllModuleMaterials } from '@/engine/three/moduleMaterialRegistry';

import { devWarn, devInfo } from '@/shared/utils/devLog';
const CONTEXT_LOST_MESSAGE = 'Потеряно соединение с видеокартой. Ожидание восстановления...';

let overlayElement: HTMLDivElement | null = null;
let gameLoopPaused = false;

function showOverlay(): void {
  if (overlayElement) return;

  overlayElement = document.createElement('div');
  overlayElement.setAttribute('role', 'alert');
  overlayElement.setAttribute('aria-live', 'assertive');
  overlayElement.textContent = CONTEXT_LOST_MESSAGE;
  Object.assign(overlayElement.style, {
    position: 'fixed',
    inset: '0',
    zIndex: '99999',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(0, 0, 0, 0.85)',
    color: 'rgba(200, 220, 255, 0.9)',
    fontFamily: 'monospace',
    fontSize: '16px',
    letterSpacing: '0.08em',
    textAlign: 'center',
    padding: '24px',
    pointerEvents: 'none',
  });

  document.body.appendChild(overlayElement);
}

function hideOverlay(): void {
  if (overlayElement) {
    overlayElement.remove();
    overlayElement = null;
  }
}

function handleContextLost(event: Event): void {
  event.preventDefault();

  if (gameLoopPaused) return;
  gameLoopPaused = true;

  devWarn('[webglContextLoss] WebGL context lost — pausing game loop');

  markCanvasFirstFrameSessionLost(event.currentTarget as HTMLCanvasElement);
  eventBus.emit('canvas:context-lost', {});
  showOverlay();
}

function handleContextRestored(_event: Event): void {
  if (!gameLoopPaused) return;
  gameLoopPaused = false;

  devInfo('[webglContextLoss] WebGL context restored — reinitializing resources');

  // Reinitialize GPU budget tracker baseline (resource counts are stale after context loss)
  resetGpuResourceBudgetTracker();

  // Module-level geometries and materials are WebGL objects whose GPU
  // handles are gone — Three.js recreates them on next render, but our
  // budget tracker caches byte estimates that no longer correspond to
  // live GPU allocations. Dispose the cache entries so the next scene
  // load re-tracks them accurately.
  try {
    disposeAllModuleGeometries();
    disposeAllModuleMaterials();
  } catch (err) {
    devWarn('[webglContextLoss] error reinitializing module GPU resources:', err);
  }

  eventBus.emit('canvas:context-restored', {});
  hideOverlay();
}

/**
 * Install WebGL context loss / restore handlers on the given canvas.
 *
 * - On `webglcontextlost`: calls `preventDefault()` to allow browser recovery,
 *   marks the first-frame session as lost, emits `canvas:context-lost`,
 *   and shows a Russian-language overlay message.
 *
 * - On `webglcontextrestored`: resets the GPU resource budget tracker,
 *   disposes stale module-level geometry/material caches so they are
 *   re-created on next scene load, emits `canvas:context-restored`,
 *   and hides the overlay.
 *
 * Returns a cleanup function that removes both listeners.
 */
export function installContextLossHandler(canvas: HTMLCanvasElement): () => void {
  const onLost = (e: Event) => handleContextLost(e);
  const onRestored = (e: Event) => handleContextRestored(e);

  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  return () => {
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    hideOverlay();
  };
}
