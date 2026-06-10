/**
 * Minimal client-side error/perf logging — structured console + optional window hook.
 * No external SDK required. Hosts can attach `window.__volodkaLog` for telemetry bridges.
 */

export type ClientLogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface ClientLogEntry {
  level: ClientLogLevel;
  message: string;
  timestamp: string;
  context?: string;
  details?: unknown;
}

declare global {
  interface Window {
    /** Optional sink — e.g. Sentry breadcrumb or custom analytics. */
    __volodkaLog?: (entry: ClientLogEntry) => void;
    /** Ring buffer of recent entries (dev/support). */
    __volodkaLogs?: ClientLogEntry[];
  }
}

const LOG_RING_MAX = 50;
let handlersInstalled = false;

function pushRing(entry: ClientLogEntry): void {
  if (typeof window === 'undefined') return;
  const ring = window.__volodkaLogs ?? [];
  ring.push(entry);
  while (ring.length > LOG_RING_MAX) ring.shift();
  window.__volodkaLogs = ring;
  window.__volodkaLog?.(entry);
}

function formatPrefix(context?: string): string {
  return context ? `[Volodka:${context}]` : '[Volodka]';
}

export function clientLog(
  level: ClientLogLevel,
  message: string,
  options?: { context?: string; details?: unknown },
): void {
  const entry: ClientLogEntry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    context: options?.context,
    details: options?.details,
  };

  pushRing(entry);

  const prefix = formatPrefix(options?.context);
  switch (level) {
    case 'debug':
      if (import.meta.env.DEV) console.debug(prefix, message, options?.details ?? '');
      break;
    case 'info':
      console.info(prefix, message, options?.details ?? '');
      break;
    case 'warn':
      console.warn(prefix, message, options?.details ?? '');
      break;
    case 'error':
      console.error(prefix, message, options?.details ?? '');
      break;
    default: {
      const _exhaustive: never = level;
      console.log(prefix, message, _exhaustive);
    }
  }
}

export function clientLogError(
  error: unknown,
  options?: { context?: string; details?: Record<string, unknown> },
): void {
  const message = error instanceof Error ? error.message : String(error);
  const details = {
    ...options?.details,
    stack: error instanceof Error ? error.stack : undefined,
  };
  clientLog('error', message, { context: options?.context, details });
}

/** One-time global handlers for uncaught errors and unhandled rejections. */
export function installClientErrorHandlers(): void {
  if (handlersInstalled || typeof window === 'undefined') return;
  handlersInstalled = true;

  window.addEventListener('error', (event) => {
    clientLogError(event.error ?? event.message, {
      context: 'window.error',
      details: { filename: event.filename, lineno: event.lineno, colno: event.colno },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    clientLogError(event.reason, { context: 'unhandledrejection' });
  });
}
