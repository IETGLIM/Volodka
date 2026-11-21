import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useLoadingShellTransition } from '@/components/game/loadingShellMotion';

/* ─── WebGL context lost overlay (FIX v4.65.0) ───
 *
 * Репорт игрока: GL_OUT_OF_MEMORY (D3D11 Texture2D) на iGPU →
 * CONTEXT_LOST_WEBGL → белый экран без объяснений. CanvasGuardSystem
 * (RPGGameCanvas) ловит событие и эмитит canvas:context-lost на eventBus,
 * но до сих пор НИКТО не показывал игроку UI: рендер мёртв, канвас
 * заливается белым (alpha:false + потерянный backbuffer).
 *
 * Оверлей: честное сообщение + кнопка перезагрузки страницы (контекст
 * WebGL после OOM в D3D11 не восстанавливается — терминальное состояние,
 * restore-событие не приедет). Подписка одноразовая, поверх HUD-слоёв.
 */

const overlayButtonClass =
  'border px-4 py-2 text-[11px] tracking-[0.12em] uppercase transition-colors';

export function WebglContextLostOverlay() {
  const [lost, setLost] = useState(false);

  useEffect(() => {
    const onLost = () => setLost(true);
    const onRestored = () => setLost(false);
    const unsubLost = eventBus.on('canvas:context-lost', onLost);
    const unsubRestored = eventBus.on('canvas:context-restored', onRestored);
    return () => {
      unsubLost();
      unsubRestored();
    };
  }, []);

  const { duration, ease } = useLoadingShellTransition();

  return (
    <AnimatePresence>
      {lost ? (
        <motion.div
          key="webgl-context-lost"
          className="fixed inset-0 flex items-center justify-center bg-black/80 px-4"
          style={{ zIndex: UI_LAYERS.HUD + 50 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration, ease }}
          role="alertdialog"
          aria-modal="true"
          aria-label="Видеопамять исчерпана"
        >
          <div className="max-w-sm rounded border border-amber-500/30 bg-black/90 px-6 py-5 text-center font-mono shadow-lg backdrop-blur-sm">
            <p className="mb-2 text-sm tracking-wide text-amber-400">
              СБРОЙ ГРАФИКИ
            </p>
            <p className="mb-1 text-[11px] leading-relaxed text-slate-300">
              Видеопамять исчерпана — графический контекст браузера потерян.
            </p>
            <p className="mb-4 text-[11px] leading-relaxed text-slate-500">
              Перезагрузи страницу. Если повторится — снизь качество
              графики в настройках (Esc → Настройки → Качество).
            </p>
            <button
              type="button"
              autoFocus
              onClick={() => window.location.reload()}
              className={`${overlayButtonClass} border-amber-400/50 text-amber-400/90 hover:border-amber-400 hover:text-amber-300`}
            >
              Перезагрузить
            </button>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
