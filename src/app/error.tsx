'use client';

import { useEffect } from 'react';

/**
 * Граница ошибки сегмента приложения (в т.ч. R3F / динамические чанки).
 * Не перехватывает ошибки в `layout.tsx` корня — для них см. `global-error.tsx`.
 */
export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[AppError]', error);
  }, [error]);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 bg-zinc-950 px-6 text-center text-zinc-100">
      <div className="max-w-md space-y-2">
        <h1 className="text-xl font-semibold tracking-tight">Что-то сломалось</h1>
        <p className="text-sm leading-relaxed text-zinc-400">
          Сцена не загрузилась или произошла внутренняя ошибка. Можно попробовать снова — прогресс в этом браузере
          обычно в сохранении на устройстве.
        </p>
        {process.env.NODE_ENV === 'development' && error.message ? (
          <pre className="mt-4 max-h-32 overflow-auto rounded-md border border-zinc-800 bg-zinc-900/80 p-3 text-left text-xs text-amber-200/90">
            {error.message}
          </pre>
        ) : null}
      </div>
      <button
        type="button"
        onClick={() => reset()}
        className="rounded-lg border border-zinc-600 bg-zinc-800 px-5 py-2.5 text-sm font-medium text-zinc-100 transition hover:bg-zinc-700 focus:outline-none focus:ring-2 focus:ring-cyan-500/40"
      >
        Попробовать снова
      </button>
    </div>
  );
}
