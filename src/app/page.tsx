'use client';

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

// ============================================
// ERROR FALLBACK COMPONENT
// ============================================

function GameError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <div className="text-6xl mb-6">🎮</div>
        <h1 className="text-red-400 text-2xl font-bold mb-4">
          Ошибка загрузки игры
        </h1>
        <div className="text-slate-400 text-sm mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
          <code className="break-words">
            {error.message || 'Произошла неизвестная ошибка'}
          </code>
        </div>
        <p className="text-slate-500 text-sm mb-6">
          Попробуйте перезагрузить страницу. Если ошибка повторяется, 
          попробуйте очистить кэш браузера.
        </p>
        <button
          onClick={reset}
          className="px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 
                     hover:from-purple-500 hover:to-pink-500 text-white text-lg 
                     font-semibold rounded-xl transition-all shadow-lg 
                     shadow-purple-500/30 hover:shadow-purple-500/50"
        >
          🔄 Попробовать снова
        </button>
      </motion.div>
    </div>
  );
}

// ============================================
// LOADING COMPONENT
// ============================================

function GameLoading() {
  const [dots, setDots] = useState('');
  const [progress, setProgress] = useState(0);
  
  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.');
    }, 500);
    
    const progressInterval = setInterval(() => {
      setProgress(prev => Math.min(prev + 10, 90));
    }, 200);
    
    return () => {
      clearInterval(dotsInterval);
      clearInterval(progressInterval);
    };
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-5xl mb-6">📜</div>
        <div className="text-slate-400 text-xl mb-2">
          Загрузка{dots}
        </div>
        <div className="text-slate-600 text-sm mb-4">
          Инициализация игрового мира
        </div>
        
        {/* Progress bar */}
        <div className="w-64 h-1 bg-slate-800 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </motion.div>
    </div>
  );
}

// ============================================
// DYNAMIC GAME IMPORT (SSR disabled)
// ============================================

const GameClient = dynamic(() => import('./GameClient'), {
  ssr: false,
  loading: () => <GameLoading />,
});

// ============================================
// MAIN PAGE COMPONENT
// ============================================

export default function Page() {
  const [error, setError] = useState<Error | null>(null);

  // Reset error handler
  const handleReset = () => {
    setError(null);
    // Clear any cached data that might be causing issues
    try {
      localStorage.removeItem('volodka_save');
    } catch {
      // Ignore localStorage errors
    }
    // Force a full page reload
    window.location.reload();
  };

  // Global error handler for uncaught errors
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('Game error:', event.error);
      
      // Don't show error UI for ResizeObserver errors (common and harmless)
      if (event.message?.includes('ResizeObserver')) {
        event.preventDefault();
        return;
      }
      
      // Don't show error UI for WebGL context losses
      if (event.message?.includes('WebGL') || event.message?.includes('webgl')) {
        console.warn('WebGL context error, attempting to recover...');
        event.preventDefault();
        return;
      }
      
      setError(event.error instanceof Error ? event.error : new Error(event.message));
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      console.error('Unhandled rejection:', event.reason);
      
      // Don't show error UI for ResizeObserver errors
      if (event.reason?.message?.includes('ResizeObserver')) {
        event.preventDefault();
        return;
      }
      
      // Don't show error UI for chunk load errors (can happen on slow connections)
      if (event.reason?.message?.includes('ChunkLoadError') || 
          event.reason?.message?.includes('Loading chunk')) {
        console.warn('Chunk load error, reloading...');
        event.preventDefault();
        window.location.reload();
        return;
      }
      
      if (event.reason instanceof Error) {
        setError(event.reason);
      }
    };

    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleRejection);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleRejection);
    };
  }, []);

  // Show error UI if there's an error
  if (error) {
    return <GameError error={error} reset={handleReset} />;
  }

  // Render the game
  return <GameClient />;
}
