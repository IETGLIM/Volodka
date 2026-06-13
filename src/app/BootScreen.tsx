import { useId } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { PipelineLoadingOverlay } from '@/components/game/PipelineLoadingOverlay';
import { useLoadingShellTransition } from '@/components/game/loadingShellMotion';
import { useLoadingPipelineMeta } from '@/hooks/useLoadingPipeline';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

const bootErrorButtonClass =
  'border px-4 py-2 text-xs tracking-[0.15em] uppercase transition-colors';

interface BootErrorProps {
  message: string;
  errorCode?: string;
  onRetry?: () => void;
  onGoToMenu?: () => void;
}

function refreshPage(): void {
  window.location.reload();
}

export function BootError({ message, errorCode, onRetry, onGoToMenu }: BootErrorProps) {
  const errorMessageId = useId();
  const errorCodeId = useId();
  const describedBy = errorCode ? `${errorMessageId} ${errorCodeId}` : errorMessageId;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black p-6 text-center font-mono text-red-400"
      role="alert"
      aria-live="assertive"
    >
      <div className="max-w-md">
        <div className="mb-3 text-2xl" aria-hidden>
          ⚠
        </div>
        <h1 className="mb-2 text-base font-normal">Не удалось загрузить данные игры</h1>
        <p id={errorMessageId} className="mx-auto mb-4 max-w-[420px] text-xs text-slate-400">
          {message}
        </p>
        {errorCode ? (
          <p id={errorCodeId} className="mb-5 text-[10px] tracking-wider text-slate-600">
            Код ошибки:{' '}
            <span className="select-all text-slate-500">{errorCode}</span>
          </p>
        ) : null}
        <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-center sm:gap-3">
          {onRetry ? (
            <button
              type="button"
              autoFocus
              onClick={onRetry}
              aria-describedby={describedBy}
              className={`${bootErrorButtonClass} border-red-400/40 text-red-400/80 hover:border-red-400 hover:text-red-400`}
            >
              Повторить
            </button>
          ) : null}
          <button
            type="button"
            autoFocus={!onRetry}
            onClick={refreshPage}
            aria-describedby={describedBy}
            className={`${bootErrorButtonClass} border-slate-600/50 text-slate-400/80 hover:border-slate-400 hover:text-slate-300`}
          >
            Обновить страницу
          </button>
          {onGoToMenu ? (
            <button
              type="button"
              onClick={onGoToMenu}
              aria-describedby={describedBy}
              className={`${bootErrorButtonClass} border-cyan-800/50 text-cyan-500/70 hover:border-cyan-500/60 hover:text-cyan-400`}
            >
              В главное меню
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

interface BootScreenProps {
  onRetry?: () => void;
  /** Escape hatch when boot fails but shell can open the menu (e.g. partial load). */
  onGoToMenu?: () => void;
  /** Fired when pipeline reaches `playable`. */
  onPlayable?: () => void;
  /** Fired after the loading overlay finishes its exit animation. */
  onComplete?: () => void;
  /** Optional override when pipeline error text is unavailable. */
  errorOverride?: string;
  /** When true, show «Начать» at `playable` instead of auto-dismiss. */
  requireStartConfirm?: boolean;
}

/** Boot shell — pipeline is the source of truth; animated loading / error / playable / done. */
export function BootScreen({
  onRetry,
  onGoToMenu,
  onPlayable,
  onComplete,
  errorOverride,
  requireStartConfirm = false,
}: BootScreenProps) {
  const { stage, message, error, errorCode } = useLoadingPipelineMeta();
  const { duration, ease } = useLoadingShellTransition();
  const isError = stage === 'error';

  return (
    <AnimatePresence mode="wait">
      {isError ? (
        <motion.div
          key="boot-error"
          className="fixed inset-0"
          style={{ zIndex: UI_LAYERS.LOADING }}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration, ease }}
        >
          <BootError
            message={errorOverride ?? error ?? message}
            errorCode={errorCode}
            onRetry={onRetry}
            onGoToMenu={onGoToMenu}
          />
        </motion.div>
      ) : (
        <motion.div
          key="boot-loading"
          className="fixed inset-0"
          style={{ zIndex: UI_LAYERS.LOADING }}
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease }}
        >
          <PipelineLoadingOverlay
            showTitle
            onPlayable={onPlayable}
            onComplete={onComplete}
            requireStartConfirm={requireStartConfirm}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
