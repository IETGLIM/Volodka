import { motion } from 'framer-motion';
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
      className="fixed inset-0 flex items-center justify-center z-[60]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Об авторе"
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" aria-hidden="true" />
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-md mx-4 border border-cyan-500/20 bg-black/90 backdrop-blur-md overflow-hidden"
        style={{
          clipPath: 'polygon(0 0, calc(100% - 10px) 0, 100% 10px, 100% 100%, 10px 100%, 0 calc(100% - 10px))',
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center gap-2 border-b border-cyan-500/15 bg-black/40 px-4 py-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500/80" />
          <span className="h-2 w-2 rounded-full bg-amber-400/80" />
          <span className="h-2 w-2 rounded-full bg-red-500/80" />
          <span className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em] text-cyan-500/30">volodka://about</span>
        </div>

        <div className="p-6 space-y-4">
          <h2 className="text-xl font-mono tracking-wider text-cyan-300/90">Об авторе</h2>
          <div className="space-y-3 text-sm text-slate-300/80 font-mono leading-relaxed">
            <p>
              <span className="text-cyan-400/70">&gt;</span> ВОЛОДЬКА — интерактивная поэтическая RPG, где код встречается со стихами.
            </p>
            <p>
              <span className="text-amber-400/70">&gt;</span> Игра вдохновлена поэзией Владимира Лебедева.
            </p>
            <p>
              <span className="text-fuchsia-400/70">&gt;</span> Каждый персонаж — метафора. Каждая сцена — строфа.
            </p>
          </div>
          <p className="font-serif text-xs italic text-slate-400/50">&ldquo;Между сменами — сказка. Между строками — правда.&rdquo;</p>
          <div className="flex items-center gap-3 pt-2">
            <span className="font-mono text-[9px] text-slate-600">v{APP_VERSION}</span>
            <span className="font-mono text-[9px] text-slate-600/70">© 2026</span>
          </div>
        </div>

        <div className="border-t border-cyan-500/10 px-4 py-3 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            aria-label="Закрыть панель об авторе"
            className="px-4 py-1.5 font-mono text-xs uppercase tracking-wider border border-cyan-500/25 hover:border-cyan-400/50 bg-cyan-950/20 text-cyan-300/70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-cyan-400/70"
          >
            Закрыть [ESC]
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
