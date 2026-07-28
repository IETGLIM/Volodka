/** Light IndexedDB persistence for Photo Mode session gallery. */

import {
  PHOTO_CAPTURE_HISTORY_MAX,
  type PhotoCaptureHistoryEntry,
} from '@/engine/photo/photoCaptureHistory';

const DB_NAME = 'volodka-photo-gallery';
const DB_VERSION = 1;
const STORE = 'captures';
const KEY = 'gallery';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

/** Load newest-first gallery (capped). Returns [] on any failure. */
export async function loadPersistedPhotoGallery(
  max = PHOTO_CAPTURE_HISTORY_MAX,
): Promise<PhotoCaptureHistoryEntry[]> {
  try {
    const db = await openDb();
    const entries = await new Promise<PhotoCaptureHistoryEntry[]>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(KEY);
      req.onsuccess = () => {
        const raw = req.result;
        resolve(Array.isArray(raw) ? (raw as PhotoCaptureHistoryEntry[]) : []);
      };
      req.onerror = () => reject(req.error ?? new Error('IndexedDB read failed'));
    });
    db.close();
    return entries.slice(0, Math.max(1, max));
  } catch {
    return [];
  }
}

/** Persist newest-first gallery (capped). No-op on failure. */
export async function persistPhotoGallery(
  entries: readonly PhotoCaptureHistoryEntry[],
  max = PHOTO_CAPTURE_HISTORY_MAX,
): Promise<void> {
  try {
    const capped = entries.slice(0, Math.max(1, max));
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put([...capped], KEY);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('IndexedDB write failed'));
    });
    db.close();
  } catch {
    /* optional persist — ignore quota / private mode */
  }
}
