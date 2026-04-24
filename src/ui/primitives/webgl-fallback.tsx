"use client";

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface WebGLFallbackProps {
  children: React.ReactNode;
}

function isWebGLSupported(): boolean {
  if (typeof window === 'undefined') return true; // SSR assumption
  
  try {
    const canvas = document.createElement('canvas');
    return !!(
      window.WebGLRenderingContext &&
      (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
    );
  } catch {
    return false;
  }
}

export function WebGLFallback({ children }: WebGLFallbackProps) {
  const [webGLSupported, setWebGLSupported] = useState<boolean | null>(null);

  useEffect(() => {
    // Use requestAnimationFrame to defer state update
    requestAnimationFrame(() => {
      setWebGLSupported(isWebGLSupported());
    });
  }, []);

  // During SSR or before mount, render children
  if (webGLSupported === null) {
    return <>{children}</>;
  }

  // WebGL not supported - show fallback
  if (!webGLSupported) {
    return (
      <div className="fixed inset-0 bg-slate-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full text-center"
        >
          <div className="text-6xl mb-6">🎮</div>
          <h1 className="text-2xl font-bold text-cyan-400 mb-4">
            WebGL не поддерживается
          </h1>
          <p className="text-slate-400 mb-6">
            Ваше устройство или браузер не поддерживает WebGL, необходимый для работы 3D-графики.
          </p>
          <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 text-left mb-6">
            <h3 className="text-sm font-semibold text-slate-300 mb-2">
              Попробуйте:
            </h3>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Обновить браузер до последней версии</li>
              <li>• Включить аппаратное ускорение в настройках</li>
              <li>• Использовать Chrome, Firefox или Edge</li>
              <li>• Проверить драйверы видеокарты</li>
            </ul>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-cyan-600 to-purple-600 
                       hover:from-cyan-500 hover:to-purple-500 text-white 
                       font-semibold rounded-lg transition-all"
          >
            Попробовать снова
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}

export default WebGLFallback;
