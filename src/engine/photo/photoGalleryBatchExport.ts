/** Light sequential batch download of Photo Mode gallery entries. */

import {
  downloadPhotoStill,
  type PhotoExportResult,
} from '@/engine/photo/photoModePresentation';
import type { PhotoCaptureHistoryEntry } from '@/engine/photo/photoCaptureHistory';

export type GalleryBatchExportResult = {
  attempted: number;
  downloaded: number;
  failed: number;
};

const BATCH_STAGGER_MS = 180;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

/**
 * Download gallery entries newest-first (capped). Staggers clicks so browsers
 * don't collapse multiple downloads into one.
 */
export async function exportPhotoGalleryBatch(
  entries: readonly PhotoCaptureHistoryEntry[],
  max = 6,
): Promise<GalleryBatchExportResult> {
  const slice = entries.slice(0, Math.max(1, max));
  let downloaded = 0;
  let failed = 0;

  for (let i = 0; i < slice.length; i += 1) {
    const entry = slice[i];
    const result: PhotoExportResult = downloadPhotoStill(entry.dataUrl, entry.filter);
    if (result.ok) downloaded += 1;
    else failed += 1;
    if (i < slice.length - 1) {
      await sleep(BATCH_STAGGER_MS);
    }
  }

  return { attempted: slice.length, downloaded, failed };
}
