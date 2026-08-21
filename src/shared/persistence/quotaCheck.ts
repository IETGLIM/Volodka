import { devWarn } from '@/shared/utils/devLog';
/**
 * localStorage quota utilities.
 *
 * Browsers don't expose a reliable storage quota API (the StorageManager
 * `estimate()` method is available in Chrome/Edge but not Firefox/Safari).
 * These helpers use a write-probe approach and heuristic byte counting.
 *
 * `checkStorageQuota()` — writes a test string and catches QuotaExceeded errors.
 * `getStorageUsage()`   — iterates all keys and sums approximate byte sizes.
 * `warnIfStorageNearLimit()` — shows a Russian toast when usage > 80 % of 5 MB.
 */

/** Heuristic quota ceiling. Most browsers enforce ~5 MB per origin. */
const ESTIMATED_QUOTA_BYTES = 5 * 1024 * 1024;

/** Warn when usage exceeds this fraction of the estimated quota. */
const WARN_THRESHOLD = 0.8;

let quotaWarningShown = false;

/**
 * Try to write a test value. Returns `true` when storage appears healthy,
 * `false` when a QuotaExceeded / NS_ERROR_DOM_QUOTA_REACHED error is caught.
 */
export function checkStorageQuota(): boolean {
  try {
    const testKey = '__volodka_quota_probe__';
    const testValue = 'x'.repeat(1024); // 1 KB probe
    localStorage.setItem(testKey, testValue);
    localStorage.removeItem(testKey);
    return true;
  } catch (err: unknown) {
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        // Firefox
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        // Some browsers
        (err as DOMException).code === 22 ||
        (err as DOMException).code === 1014);
    return !isQuotaError;
  }
}

/**
 * Approximate total bytes stored in localStorage.
 * Counts each key + value pair (UTF-16 ≈ 2 bytes per char).
 */
export function getStorageUsage(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key == null) continue;
      // key.length + value.length chars × 2 bytes per UTF-16 code unit
      const value = localStorage.getItem(key) ?? '';
      total += (key.length + value.length) * 2;
    }
  } catch {
    // Storage may be disabled or inaccessible
  }
  return total;
}

/**
 * If localStorage usage exceeds 80 % of the estimated 5 MB quota,
 * show a one-shot Russian-language warning toast.
 *
 * Returns `true` if the warning was emitted this call.
 */
export function warnIfStorageNearLimit(): boolean {
  if (quotaWarningShown) return false;

  const usage = getStorageUsage();
  const warnBytes = ESTIMATED_QUOTA_BYTES * WARN_THRESHOLD;

  if (usage >= warnBytes) {
    quotaWarningShown = true;

    const usageKb = (usage / 1024).toFixed(0);
    const quotaMb = (ESTIMATED_QUOTA_BYTES / (1024 * 1024)).toFixed(0);
    const message = `Хранилище почти заполнено (${usageKb} КБ / ${quotaMb} МБ). Рекомендуется удалить старые сохранения.`;

    // Lazy-import toastManager to avoid pulling engine/EventBus into
    // the persistence module's static import graph.
    import('@/engine/ToastManager').then(({ toastManager }) => {
      toastManager.addToast('energy', message);
    }).catch(() => {
      devWarn(`[quotaCheck] ${message}`);
    });

    return true;
  }

  return false;
}

/** Reset the one-shot flag (useful in tests or after clearing storage). */
export function resetQuotaWarningFlag(): void {
  quotaWarningShown = false;
}
