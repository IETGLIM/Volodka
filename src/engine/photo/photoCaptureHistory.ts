/** Session capture history for Photo Mode — in-memory only, no persistence. */

import type { PhotoFilterPreset } from '@/engine/photo/photoModeConstants';

export const PHOTO_CAPTURE_HISTORY_MAX = 6;

export type PhotoCaptureHistoryEntry = {
  id: string;
  dataUrl: string;
  timestamp: number;
  filter: PhotoFilterPreset;
  sceneName: string;
};

/** Newest-first ring buffer. Drops oldest when over max (keeps memory bounded). */
export function pushPhotoCaptureHistory(
  history: readonly PhotoCaptureHistoryEntry[],
  entry: Omit<PhotoCaptureHistoryEntry, 'id'>,
  max = PHOTO_CAPTURE_HISTORY_MAX,
): PhotoCaptureHistoryEntry[] {
  const next: PhotoCaptureHistoryEntry = {
    ...entry,
    id: `cap-${entry.timestamp}-${history.length}`,
  };
  return [next, ...history].slice(0, Math.max(1, max));
}

export function selectPhotoCaptureFromHistory(
  history: readonly PhotoCaptureHistoryEntry[],
  id: string,
): PhotoCaptureHistoryEntry | null {
  return history.find((e) => e.id === id) ?? null;
}
