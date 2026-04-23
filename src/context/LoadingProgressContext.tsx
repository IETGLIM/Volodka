'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

export interface LoadingProgress {
  progress: number; // 0–100
  message: string;
  setProgress: (p: number, msg?: string) => void;
}

const noop = () => {};

const LoadingProgressContext = createContext<LoadingProgress>({
  progress: 0,
  message: 'ИНИЦИАЛИЗАЦИЯ',
  setProgress: noop,
});

export const useLoadingProgress = () => useContext(LoadingProgressContext);

export function LoadingProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgressState] = useState(0);
  const [message, setMessage] = useState('ИНИЦИАЛИЗАЦИЯ');

  const setProgress = useCallback((p: number, msg?: string) => {
    const next = Math.min(100, Math.max(0, Number.isFinite(p) ? p : 0));
    setProgressState(next);
    if (msg !== undefined && msg !== '') setMessage(msg);
  }, []);

  return (
    <LoadingProgressContext.Provider value={{ progress, message, setProgress }}>
      {children}
    </LoadingProgressContext.Provider>
  );
}
