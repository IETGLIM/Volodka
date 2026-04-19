'use client';

import dynamic from 'next/dynamic';
import { Component, type ReactNode } from 'react';

// Dynamic import with SSR disabled
const GameClient = dynamic(() => import('./GameClient'), {
  ssr: false,
  loading: () => <LoadingFallback />,
});

// Error Boundary
class GameErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-8">
          <div className="max-w-md text-center">
            <div className="text-6xl mb-6">💥</div>
            <h1 className="text-2xl font-bold text-white mb-4">
              Что-то пошло не так...
            </h1>
            <p className="text-slate-400 mb-6">
              {this.state.error?.message || 'Неизвестная ошибка'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-lg transition-colors"
            >
              Перезапустить
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// Loading screen
function LoadingFallback() {
  return (
    <div className="fixed inset-0 z-[100] flex h-svh min-h-0 w-screen flex-col items-center justify-center bg-[#030308] font-mono text-white">
      <div className="text-center px-6">
        <div className="mb-4 text-3xl tracking-[0.2em] text-cyan-400/90 animate-pulse">ЗАГРУЗКА</div>
        <div className="text-sm uppercase tracking-[0.35em] text-cyan-500/50">ВОЛОДЬКА // ядро</div>
        <p className="mt-6 text-xs text-slate-500">Rapier · Three · сцена</p>
      </div>
    </div>
  );
}

// Main page
export default function Home() {
  return (
    <GameErrorBoundary>
      <GameClient />
    </GameErrorBoundary>
  );
}
