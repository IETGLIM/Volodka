"use client";

import { Component, ErrorInfo, ReactNode } from 'react';
import { motion } from 'framer-motion';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Clear any cached data that might be causing issues
    try {
      localStorage.removeItem('volodka_save_v3');
      localStorage.removeItem('volodka_local');
    } catch {
      // Ignore localStorage errors
    }
    // Force reload
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      // Custom fallback provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full"
          >
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-2xl font-bold text-red-400 mb-2">
                Произошла ошибка
              </h1>
              <p className="text-slate-400">
                Что-то пошло не так. Попробуйте перезагрузить страницу.
              </p>
            </div>

            {/* Error details (collapsible) */}
            {this.state.error && (
              <details className="mb-6">
                <summary className="cursor-pointer text-slate-500 text-sm hover:text-slate-400 mb-2">
                  Показать детали ошибки
                </summary>
                <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 overflow-auto max-h-48">
                  <code className="text-xs text-red-400 break-words">
                    {this.state.error.message}
                  </code>
                  {this.state.error.stack && (
                    <pre className="text-xs text-slate-500 mt-2 whitespace-pre-wrap">
                      {this.state.error.stack}
                    </pre>
                  )}
                </div>
              </details>
            )}

            {/* Actions */}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleRetry}
                className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 
                           hover:from-purple-500 hover:to-pink-500 text-white 
                           font-semibold rounded-lg transition-all shadow-lg 
                           shadow-purple-500/30"
              >
                🔄 Перезагрузить
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 
                           text-white font-semibold rounded-lg transition-all"
              >
                На главную
              </button>
            </div>

            {/* Help text */}
            <p className="text-center text-slate-500 text-xs mt-6">
              Если ошибка повторяется, попробуйте очистить кэш браузера или 
              использовать другой браузер.
            </p>
          </motion.div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
