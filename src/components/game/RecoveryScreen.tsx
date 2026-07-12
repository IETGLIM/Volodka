import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { ErrorRecoveryContext } from '@/engine/recovery/errorRecoveryTypes';

type RecoveryScreenProps = {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  context: ErrorRecoveryContext;
  onRecover: () => void;
  onRestartScene: () => void;
  onResetSettings: () => void;
  onResetAll: () => void;
};

function formatUptime(ms?: number): string {
  if (ms === undefined) return '—';
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes} мин ${seconds} сек`;
}

export function RecoveryScreen({
  error,
  errorInfo,
  context,
  onRecover,
  onRestartScene,
  onResetSettings,
  onResetAll,
}: RecoveryScreenProps) {
  const primaryButtonRef = useRef<HTMLButtonElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmSettingsReset, setConfirmSettingsReset] = useState(false);

  useEffect(() => {
    primaryButtonRef.current?.focus({ preventScroll: true });
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        if (confirmReset) {
          setConfirmReset(false);
          return;
        }
        if (confirmSettingsReset) {
          setConfirmSettingsReset(false);
          return;
        }
        onRecover();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [confirmReset, confirmSettingsReset, onRecover]);

  const handleResetSettings = useCallback(() => {
    onResetSettings();
    setConfirmSettingsReset(false);
    onRecover();
  }, [onRecover, onResetSettings]);

  const handleResetAll = useCallback(() => {
    onResetAll();
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  }, [onResetAll]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="fixed inset-0 bg-black flex items-center justify-center z-[9999]"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="recovery-title"
      aria-describedby="recovery-description"
    >
      <div
        className="max-w-md w-full text-center p-8"
        role="alert"
        aria-live="assertive"
        aria-atomic="true"
      >
        <div className="text-5xl mb-4" aria-hidden="true">
          ⚠
        </div>
        <h1 id="recovery-title" className="text-xl font-bold text-rose-400 mb-2">
          Произошла ошибка
        </h1>
        <p id="recovery-description" className="text-sm text-slate-400 mb-4">
          Игровой процесс прерван. Попробуйте восстановить сессию без потери прогресса.
        </p>

        <dl className="text-xs text-slate-500 bg-slate-900/40 border border-slate-800/60 rounded p-3 mb-4 text-left space-y-1">
          {context.errorCode ? (
            <div className="flex justify-between gap-3">
              <dt>Код ошибки</dt>
              <dd className="font-mono text-slate-300">{context.errorCode}</dd>
            </div>
          ) : null}
          {context.sceneId ? (
            <div className="flex justify-between gap-3">
              <dt>Сцена</dt>
              <dd className="font-mono text-slate-300">{context.sceneId}</dd>
            </div>
          ) : null}
          <div className="flex justify-between gap-3">
            <dt>Время сессии</dt>
            <dd className="font-mono text-slate-300">{formatUptime(context.sessionUptimeMs)}</dd>
          </div>
          {context.gameVersion ? (
            <div className="flex justify-between gap-3">
              <dt>Версия</dt>
              <dd className="font-mono text-slate-300">{context.gameVersion}</dd>
            </div>
          ) : null}
        </dl>

        {error ? (
          <details className="text-xs text-slate-600 bg-slate-900/50 p-3 rounded mb-4 text-left">
            <summary className="cursor-pointer text-slate-400">Техническая информация</summary>
            <pre className="mt-2 overflow-auto max-h-32 whitespace-pre-wrap">{error.message}</pre>
            {errorInfo?.componentStack ? (
              <pre className="mt-2 overflow-auto max-h-32 whitespace-pre-wrap text-slate-700">
                {errorInfo.componentStack}
              </pre>
            ) : null}
          </details>
        ) : null}

        <div className="flex flex-col gap-2">
          <button
            ref={primaryButtonRef}
            type="button"
            onClick={onRecover}
            className="px-4 py-2 rounded border border-cyan-800/40 bg-cyan-950/30 text-cyan-300 hover:bg-cyan-900/30 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60"
          >
            Попробовать восстановить
          </button>
          <button
            type="button"
            onClick={onRestartScene}
            className="px-4 py-2 rounded border border-slate-700/40 bg-slate-900/30 text-slate-300 hover:bg-slate-800/30 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400/60"
          >
            Перезагрузить сцену
          </button>

          {confirmSettingsReset ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetSettings}
                className="flex-1 px-4 py-2 rounded border border-amber-800/40 bg-amber-950/30 text-amber-200 text-sm"
              >
                Сбросить настройки
              </button>
              <button
                type="button"
                onClick={() => setConfirmSettingsReset(false)}
                className="flex-1 px-4 py-2 rounded border border-slate-700/40 bg-slate-900/30 text-slate-300 text-sm"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmSettingsReset(true)}
              className="px-4 py-2 rounded border border-amber-800/40 bg-amber-950/30 text-amber-200 hover:bg-amber-900/30 text-sm transition-colors"
            >
              Сбросить настройки
            </button>
          )}

          {confirmReset ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleResetAll}
                className="flex-1 px-4 py-2 rounded border border-rose-800/40 bg-rose-950/30 text-rose-300 text-sm"
              >
                Подтвердить полный сброс
              </button>
              <button
                type="button"
                onClick={() => setConfirmReset(false)}
                className="flex-1 px-4 py-2 rounded border border-slate-700/40 bg-slate-900/30 text-slate-300 text-sm"
              >
                Отмена
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 rounded border border-rose-800/40 bg-rose-950/30 text-rose-300 hover:bg-rose-900/30 text-sm transition-colors"
            >
              Сбросить всё (потеря прогресса)
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
