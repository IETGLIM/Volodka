
/* ─── Volodka RPG – Reusable Error Boundary ─── */
/* Catches rendering errors in child components and displays
 * a Russian-language fallback UI instead of crashing the whole app. */

import { Component, type ReactNode } from 'react';

interface ErrorBoundaryProps {
  name: string;
  fallback?: ReactNode;
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
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
    console.error(`[ErrorBoundary:${this.props.name}]`, error, errorInfo);
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
