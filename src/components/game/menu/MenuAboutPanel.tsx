import { motion } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { APP_VERSION } from '@/engine/menu/menuConstants';

type MenuAboutPanelProps = {
  onClose: () => void;
};

export function MenuAboutPanel({ onClose }: MenuAboutPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 flex items-center justify-center cinematic-menu-shell"
      style={{ zIndex: UI_LAYERS.MENU }}
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Об авторе"
    >
      <div className="absolute inset-0 bg-black/80" aria-hidden="true" />
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4 cinematic-menu-panel px-6 py-6"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="font-serif text-[11px] tracking-[0.3em] uppercase text-stone-400/55 mb-2 text-center">
          Титульный лист
        </p>
        <h2 className="font-serif text-2xl tracking-[0.12em] text-stone-100/90 text-center mb-5">
          Об авторе
        </h2>
        <div className="space-y-3 text-sm text-stone-300/75 font-serif leading-relaxed">
          <p>ВОЛОДЬКА — интерактивная поэтическая RPG, где код встречается со стихами.</p>
          <p>Игра вдохновлена поэзией Владимира Лебедева.</p>
          <p>Каждый персонаж — метафора. Каждая сцена — строфа.</p>
        </div>
        <p className="font-serif text-xs italic text-stone-400/50 mt-5 text-center">
          &ldquo;Между сменами — сказка. Между строками — правда.&rdquo;
        </p>
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className="font-serif text-[10px] tracking-[0.15em] text-stone-500/55">v{APP_VERSION}</span>
          <span className="font-serif text-[10px] text-stone-500/45">© 2026</span>
        </div>
        <div className="pt-4 flex justify-center">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель об авторе"
            className="cinematic-menu-item cinematic-menu-item--muted"
          >
            Закрыть
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
