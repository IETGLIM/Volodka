
/* ─── Volodka RPG – Reusable Error Boundary ─── */
/* Catches rendering errors in child components and displays
 * a Russian-language fallback UI instead of crashing the whole app. */

import { Component, type ReactNode } from 'react';
import { forceDisposeOrphanedWebGLResources } from '@/engine/canvas/canvasRendererRegistry';

interface ErrorBoundaryProps {
  name: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * v4.44: дедупликация — одна и та же ошибка (name + message) логируется
 * не чаще раза в 10 секунд на весь процесс. Раньше цикл ремоунтов
 * (например, 404 модели игрока) спамил консоль и тосты по кругу.
 */
const LAST_LOGGED = new Map<string, number>();
const LOG_DEDUP_INTERVAL_MS = 10_000;

function shouldLogError(name: string, message: string): boolean {
  const key = `${name}::${message}`;
  const now = Date.now();
  const last = LAST_LOGGED.get(key) ?? 0;
  if (now - last < LOG_DEDUP_INTERVAL_MS) return false;
  LAST_LOGGED.set(key, now);
  return true;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    if (shouldLogError(this.props.name, error.message)) {
      console.error(`[ErrorBoundary:${this.props.name}]`, error, errorInfo);
    }
    forceDisposeOrphanedWebGLResources(this.props.name);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      if ('fallback' in this.props) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="text-rose-400 text-sm font-medium mb-1">
            Ошибка: {this.props.name}
          </div>
          <div className="text-slate-500 text-xs mb-2">
            {this.state.error?.message ?? 'Неизвестная ошибка'}
          </div>
          <button
            onClick={this.handleRetry}
            className="text-xs text-cyan-400 hover:text-cyan-300 underline transition-colors"
          >
            Попробовать снова
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
