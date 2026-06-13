import { AnimatePresence, motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useSceneTransitionFailure } from '@/hooks/useSceneTransitionFailure';
import { useLoadingShellTransition } from '@/components/game/loadingShellMotion';

const bannerButtonClass =
  'border px-3 py-1.5 text-[10px] tracking-[0.12em] uppercase transition-colors';

export function SceneTransitionFailureBanner() {
  const { failure, dismiss, retry } = useSceneTransitionFailure();
  const { duration, ease } = useLoadingShellTransition();

  return (
    <AnimatePresence>
      {failure ? (
        <motion.div
          key="scene-transition-failure"
          className="fixed inset-x-0 bottom-6 flex justify-center px-4"
          style={{ zIndex: UI_LAYERS.HUD + 5 }}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8 }}
          transition={{ duration, ease }}
          role="alert"
          aria-live="assertive"
        >
          <div className="max-w-md rounded border border-red-500/30 bg-black/85 px-4 py-3 text-center font-mono shadow-lg backdrop-blur-sm">
            <p className="mb-1 text-xs tracking-wide text-red-400">
              {failure.cancelled ? 'Переход отменён' : 'Не удалось загрузить сцену'}
            </p>
            <p className="mb-3 text-[11px] text-slate-400">{failure.reason}</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {failure.targetScene && !failure.cancelled ? (
                <button
                  type="button"
                  autoFocus
                  onClick={retry}
                  className={`${bannerButtonClass} border-red-400/40 text-red-400/80 hover:border-red-400 hover:text-red-300`}
                >
                  Повторить
                </button>
              ) : null}
              <button
                type="button"
                autoFocus={!failure.targetScene || Boolean(failure.cancelled)}
                onClick={dismiss}
                className={`${bannerButtonClass} border-slate-600/50 text-slate-400/80 hover:border-slate-400 hover:text-slate-300`}
              >
                Закрыть
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
