'use client';

import { useState, useCallback } from 'react';
import {
  FAMILY_WELCOME_STORAGE_KEY,
  familyWelcomeParagraphs,
  familyWelcomeTitle,
} from '@/data/familyWelcome';

/**
 * Спокойный первый экран для близких: без «кибер»-стилистики, крупные кнопки.
 * Повторный показ отключается на этом устройстве по желанию.
 */
export function FamilyWelcomeGate({ children }: { children: React.ReactNode }) {
  const [showGate, setShowGate] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(FAMILY_WELCOME_STORAGE_KEY) !== '1';
  });
  const [rememberSkip, setRememberSkip] = useState(true);

  const continueIn = useCallback(() => {
    if (rememberSkip) {
      try {
        localStorage.setItem(FAMILY_WELCOME_STORAGE_KEY, '1');
      } catch {
        /* private mode */
      }
    }
    setShowGate(false);
  }, [rememberSkip]);

  if (!showGate) {
    return <>{children}</>;
  }

  return (
    <div
      className="fixed inset-0 z-[300] flex flex-col items-center justify-center overflow-y-auto bg-gradient-to-b from-zinc-900 via-zinc-950 to-black px-5 py-10 text-zinc-100"
      role="dialog"
      aria-labelledby="family-welcome-title"
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-700/80 bg-zinc-900/90 p-6 shadow-2xl backdrop-blur sm:p-8">
        <h1
          id="family-welcome-title"
          className="text-center font-serif text-xl font-semibold leading-snug tracking-tight text-amber-50 sm:text-2xl"
        >
          {familyWelcomeTitle}
        </h1>
        <div className="mt-6 space-y-4 text-left text-sm leading-relaxed text-zinc-300 sm:text-base">
          {familyWelcomeParagraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-lg border border-zinc-700/60 bg-zinc-950/50 p-3 text-sm text-zinc-400">
          <input
            type="checkbox"
            className="mt-1 h-4 w-4 shrink-0 rounded border-zinc-600 bg-zinc-800 text-amber-600 focus:ring-amber-500/40"
            checked={rememberSkip}
            onChange={(e) => setRememberSkip(e.target.checked)}
          />
          <span>Не показывать этот экран снова на этом устройстве (можно сбросить, очистив данные сайта в браузере).</span>
        </label>
        <button
          type="button"
          onClick={continueIn}
          className="mt-8 w-full rounded-xl bg-amber-600/90 px-4 py-3.5 text-center text-base font-semibold text-zinc-950 transition hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-400/50 active:scale-[0.99]"
        >
          Войти в историю
        </button>
      </div>
    </div>
  );
}
