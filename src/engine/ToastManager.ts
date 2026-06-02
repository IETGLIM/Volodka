/* ─── Volodka RPG – Toast Manager (pub/sub for floating notifications) ───
   Can be called from anywhere: engine code, game logic, UI components.
   Each toast gets a unique ID and timestamp.
*/

/* ─── Types ─── */

export type ToastType = 'karma' | 'energy' | 'stress' | 'skill' | 'poem' | 'quest';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
  delta?: number;
  timestamp: number;
}

type ToastListener = (toast: ToastMessage) => void;

/* ─── Toast Manager class ─── */

class ToastManagerClass {
  private listeners = new Set<ToastListener>();
  private nextId = 0;

  /**
   * Add a toast notification. Can be called from anywhere.
   *
   * @param type    Toast category — determines icon, color, glow
   * @param message Text to display (e.g. "Карма +5")
   * @param delta   Optional numeric delta for display (e.g. +5, -3)
   */
  addToast(type: ToastType, message: string, delta?: number): void {
    const toast: ToastMessage = {
      id: `toast-${this.nextId++}-${Date.now()}`,
      type,
      message,
      delta,
      timestamp: Date.now(),
    };

    for (const listener of this.listeners) {
      try {
        listener(toast);
      } catch (err) {
        console.error('[ToastManager] Error in listener:', err);
      }
    }
  }

  /**
   * Subscribe to new toasts. Returns an unsubscribe function.
   */
  subscribe(listener: ToastListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}

/** Singleton toast manager instance */
export const toastManager = new ToastManagerClass();
