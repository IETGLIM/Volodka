import type { SceneId } from '@/config/sceneDefinitions';
import { SCENE_CONFIG } from '@/config/scenes';
import {
  PHOTO_FLASH_DURATION_MS,
  PHOTO_MODE_LABELS,
} from '@/engine/photo/photoModeConstants';

export type CanvasCaptureResult =
  | { ok: true; dataUrl: string }
  | { ok: false; reason: 'missing_canvas' | 'tainted_canvas' | 'unknown' };

export function resolveSceneDisplayName(sceneId: SceneId): string {
  return SCENE_CONFIG[sceneId]?.name ?? `${PHOTO_MODE_LABELS.unknownScene} (${sceneId})`;
}

export function formatGameTimeOfDay(timeOfDay: number): string {
  const hours = Math.floor(timeOfDay).toString().padStart(2, '0');
  const minutes = ((timeOfDay % 1) * 60 | 0).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

export function formatRealClockTime(date = new Date()): string {
  return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
}

export function captureWebGlCanvasScreenshot(): CanvasCaptureResult {
  try {
    const canvas = document.querySelector('canvas');
    if (!canvas) {
      return { ok: false, reason: 'missing_canvas' };
    }
    const dataUrl = canvas.toDataURL('image/png');
    return { ok: true, dataUrl };
  } catch {
    return { ok: false, reason: 'tainted_canvas' };
  }
}

export function getPhotoOverlayTransition(reducedMotion: boolean) {
  return reducedMotion ? { duration: 0 } : { duration: 0.3, ease: 'easeOut' as const };
}

export function getPhotoHintTransition(reducedMotion: boolean) {
  return reducedMotion
    ? { duration: 0 }
    : { duration: 0.4, delay: 0.2 };
}

export function getPhotoPreviewTransition(reducedMotion: boolean) {
  return reducedMotion
    ? { duration: 0 }
    : { duration: 0.3, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] };
}

export function getBlinkDotMotion(reducedMotion: boolean) {
  if (reducedMotion) {
    return { animate: undefined, transition: { duration: 0 } };
  }
  return {
    animate: { opacity: [1, 0.2, 1] },
    transition: { duration: 1.5, repeat: Infinity, ease: 'easeInOut' as const },
  };
}

export function getFlashOverlayTransition(reducedMotion: boolean) {
  if (reducedMotion) {
    return { duration: 0 };
  }
  return { duration: PHOTO_FLASH_DURATION_MS / 1000, ease: 'easeOut' as const };
}

export function getCaptureFailureMessage(): string {
  return PHOTO_MODE_LABELS.captureFailed;
}

export function getPhotoFilterTitle(filter: 'neon' | 'noir'): string {
  return filter === 'noir' ? PHOTO_MODE_LABELS.titleNoir : PHOTO_MODE_LABELS.title;
}

/**
 * Bake a noir grade into a captured PNG data URL (grayscale + contrast + vignette).
 * Safe no-op on failure — resolves with the original dataUrl.
 */
export function applyNoirGradeToDataUrl(dataUrl: string): Promise<string> {
  if (typeof document === 'undefined') return Promise.resolve(dataUrl);

  return new Promise((resolve) => {
    try {
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }
          const w = img.naturalWidth || img.width;
          const h = img.naturalHeight || img.height;
          if (!w || !h) {
            resolve(dataUrl);
            return;
          }
          canvas.width = w;
          canvas.height = h;
          ctx.filter = 'grayscale(1) contrast(1.22) brightness(0.9)';
          ctx.drawImage(img, 0, 0);
          ctx.filter = 'none';

          const gradient = ctx.createRadialGradient(
            w * 0.5,
            h * 0.5,
            Math.min(w, h) * 0.25,
            w * 0.5,
            h * 0.5,
            Math.max(w, h) * 0.72,
          );
          gradient.addColorStop(0, 'rgba(0,0,0,0)');
          gradient.addColorStop(1, 'rgba(0,0,0,0.45)');
          ctx.fillStyle = gradient;
          ctx.fillRect(0, 0, w, h);

          resolve(canvas.toDataURL('image/png'));
        } catch {
          resolve(dataUrl);
        }
      };
      img.onerror = () => resolve(dataUrl);
      img.src = dataUrl;
    } catch {
      resolve(dataUrl);
    }
  });
}

/** Capture WebGL canvas and optionally bake noir grade into the still. */
export async function capturePhotoStill(
  filter: 'neon' | 'noir',
): Promise<CanvasCaptureResult> {
  const result = captureWebGlCanvasScreenshot();
  if (!result.ok || filter !== 'noir') return result;
  return { ok: true, dataUrl: await applyNoirGradeToDataUrl(result.dataUrl) };
}
