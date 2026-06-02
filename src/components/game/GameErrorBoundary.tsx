'use client';

import React from 'react';

interface GameErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface GameErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary that wraps the entire game UI.
 * Catches render crashes in any game component (HUD, CombatUI, panels, etc.)
 * and shows a recovery screen instead of blank-whiting the page.
 */
export class GameErrorBoundary extends React.Component<
  GameErrorBoundaryProps,
  GameErrorBoundaryState
> {
  constructor(props: GameErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): GameErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[GameErrorBoundary] Caught render error:', error, info.componentStack);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
  };

  handleRestart = () => {
    // Clear save and reload fresh
    try {
      localStorage.removeItem('volodka_save');
    } catch {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="fixed inset-0 bg-black flex items-center justify-center z-[9999]">
          <div className="max-w-md text-center p-8">
            <div className="text-5xl mb-4 animate-pulse">&#9888;</div>
            <h1 className="text-xl font-bold text-rose-400 mb-2">
              Критическая ошибка
            </h1>
            <p className="text-sm text-slate-400 mb-4">
              Что-то пошло не так. Попробуйте перезагрузить или начать заново.
            </p>
            {this.state.error && (
              <pre className="text-xs text-slate-600 bg-slate-900/50 p-3 rounded mb-4 max-h-32 overflow-auto text-left">
                {this.state.error.message}
              </pre>
            )}
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReload}
                className="px-4 py-2 rounded border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 text-sm transition-colors"
              >
                Попробовать снова
              </button>
              <button
                onClick={this.handleRestart}
                className="px-4 py-2 rounded border border-rose-800/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/30 text-sm transition-colors"
              >
                Начать заново
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
