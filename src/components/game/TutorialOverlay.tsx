
/* ─── Volodka RPG – Tutorial tips overlay (enhanced) ─── */

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { X, Gamepad2, Eye, Hand, Backpack, Scroll, BookOpen, Notebook, Moon, LayoutGrid, LogOut } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useGamePhase } from '@/store/selectors';
import { Checkbox } from '@/components/ui/checkbox';

type TutorialType = 'movement' | 'interact' | 'controls';

const LS_KEY = 'volodka_tutorial_disabled';

function isTutorialDisabled(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(LS_KEY) === 'true';
}

function persistTutorialDisabled(): void {
  try { localStorage.setItem(LS_KEY, 'true'); } catch { /* ignore */ }
}

/* ── Key cap component ── */
function KeyCap({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center justify-center rounded-md text-xs font-bold font-mono
        border shadow-sm select-none
        ${wide ? 'px-2 h-7' : 'w-7 h-7'}
        bg-slate-800/80 border-slate-600/50 text-slate-300 shadow-black/20
      `}
      style={{
        boxShadow: 'inset 0 -2px 0 rgba(0,0,0,0.3)',
      }}
    >
      {children}
    </span>
  );
}

/* ── WASD key layout ── */
function WASDLayout() {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <KeyCap>W</KeyCap>
      <div className="flex gap-0.5">
        <KeyCap>A</KeyCap>
        <KeyCap>S</KeyCap>
        <KeyCap>D</KeyCap>
      </div>
    </div>
  );
}

/* ── Control hint row ── */
function ControlHint({ keys, label, icon }: { keys: React.ReactNode; label: string; icon?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-1">
      <div className="shrink-0 flex items-center gap-0.5 min-w-[60px] justify-center">
        {keys}
      </div>
      <span className="text-xs text-slate-400 flex-1">{label}</span>
      {icon && <span className="shrink-0 text-cyan-400/70">{icon}</span>}
    </div>
  );
}

const TUTORIALS: Record<TutorialType, { icon: React.ReactNode; title: string; content: React.ReactNode }> = {
  movement: {
    icon: <Gamepad2 className="size-5 text-cyan-400" />,
    title: 'Передвижение',
    content: (
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <WASDLayout />
          <span className="text-xs text-slate-400">— движение</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <KeyCap>⇧</KeyCap>
          </div>
          <span className="text-xs text-slate-400">— бег</span>
        </div>
        <div className="flex items-center gap-2">
          <KeyCap>Space</KeyCap>
          <span className="text-xs text-slate-400">— прыжок</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="size-4 text-cyan-500/50 shrink-0" />
          <span className="text-xs text-slate-400">— мышь: обзор камеры</span>
        </div>
      </div>
    ),
  },
  interact: {
    icon: <Hand className="size-5 text-cyan-400" />,
    title: 'Взаимодействие',
    content: (
      <div className="space-y-1">
        <ControlHint keys={<KeyCap>E</KeyCap>} label="Взаимодействовать с объектами и NPC" icon={<Hand className="size-3.5" />} />
        <p className="text-xs text-slate-400 mt-1">Подойди ближе к объекту и нажми E</p>
      </div>
    ),
  },
  controls: {
    icon: <LayoutGrid className="size-5 text-cyan-400" />,
    title: 'Управление',
    content: (
      <div className="space-y-0.5 divide-y divide-slate-800/50">
        <ControlHint
          keys={<KeyCap>I</KeyCap>}
          label="Инвентарь и экипировка"
          icon={<Backpack className="size-3.5" />}
        />
        <ControlHint
          keys={<KeyCap>Q</KeyCap>}
          label="Журнал заданий"
          icon={<Scroll className="size-3.5" />}
        />
        <ControlHint
          keys={<KeyCap>P</KeyCap>}
          label="Книга стихов"
          icon={<BookOpen className="size-3.5" />}
        />
        <ControlHint
          keys={<KeyCap>J</KeyCap>}
          label="Дневник и заметки"
          icon={<Notebook className="size-3.5" />}
        />
        <ControlHint
          keys={<KeyCap>R</KeyCap>}
          label="Отдых (дома)"
          icon={<Moon className="size-3.5" />}
        />
        <ControlHint
          keys={<KeyCap wide>Tab</KeyCap>}
          label="Инвентарь (альтернатива)"
          icon={<Backpack className="size-3.5" />}
        />
        <ControlHint
          keys={<KeyCap wide>Esc</KeyCap>}
          label="Меню / пауза"
          icon={<LogOut className="size-3.5" />}
        />
      </div>
    ),
  },
};

export function TutorialOverlay() {
  const mode = useGamePhase();
  const tutorialFlags = useGameStore((s) => s.tutorialFlags);

  const [dismissed, setDismissed] = useState<Set<TutorialType>>(new Set());
  const [dontShowAgain, setDontShowAgain] = useState(isTutorialDisabled);

  // Determine which tutorial to show (sequential: movement → interact → controls)
  const activeTutorial: TutorialType | null = (() => {
    if (tutorialFlags.tutorialsDisabled || isTutorialDisabled()) return null;
    if (mode !== 'exploration') return null;
    // Don't show contextual tips if the first-play tutorial hasn't been completed yet
    if (!tutorialFlags.tutorialsCompleted) return null;

    if (!tutorialFlags.tutorial_seen_movement && !dismissed.has('movement')) {
      return 'movement';
    }
    if (!tutorialFlags.tutorial_seen_interact && !dismissed.has('interact')) {
      return 'interact';
    }
    if (!tutorialFlags.tutorial_seen_controls && !dismissed.has('controls')) {
      return 'controls';
    }
    return null;
  })();

  const handleDismiss = useCallback(() => {
    if (!activeTutorial) return;

    if (dontShowAgain) {
      // Permanently disable all tutorials — persist to localStorage and store
      persistTutorialDisabled();
      useGameStore.setState({
        tutorialFlags: { ...useGameStore.getState().tutorialFlags, tutorialsDisabled: true },
      });
    } else {
      // Mark this specific tutorial as seen in the store
      const flagKey = `tutorial_seen_${activeTutorial}`;
      useGameStore.setState({
        tutorialFlags: { ...useGameStore.getState().tutorialFlags, [flagKey]: true },
      });
    }

    setDismissed((prev) => new Set(prev).add(activeTutorial));
  }, [activeTutorial, dontShowAgain]);

  // Auto-dismiss after 7 seconds (reduced from 10s to not block gameplay too long)
  useEffect(() => {
    if (!activeTutorial) return;
    const timer = setTimeout(() => {
      handleDismiss();
    }, 7000);
    return () => clearTimeout(timer);
  }, [activeTutorial, handleDismiss]);

  return (
    <AnimatePresence>
      {activeTutorial && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.98 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="fixed bottom-24 left-3 sm:bottom-28 sm:left-4 pointer-events-auto"
          style={{ zIndex: UI_LAYERS.HUD }}
        >
          <div className="relative bg-slate-950/95 border border-cyan-900/40 rounded-lg p-3 max-w-[260px] sm:max-w-xs backdrop-blur-md shadow-xl shadow-black/40">
            {/* Subtle gradient accent */}
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-cyan-500/[0.03] to-transparent pointer-events-none" />

            <div className="flex items-start gap-3 relative">
              {/* Icon */}
              <div className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-md bg-slate-800/80 border border-slate-700/30">
                {TUTORIALS[activeTutorial].icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-slate-100 mb-1.5 font-mono tracking-wider uppercase">
                  {TUTORIALS[activeTutorial].title}
                </h3>
                {TUTORIALS[activeTutorial].content}
              </div>
              <button
                onClick={handleDismiss}
                className="shrink-0 w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-white hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 transition-colors"
                aria-label="Закрыть"
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Don't show again checkbox */}
            <div className="mt-2 pt-1.5 border-t border-slate-800/50 flex items-center gap-2">
              <Checkbox
                id="tutorial-dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                className="size-3.5 border-slate-600 data-[state=checked]:bg-slate-600 data-[state=checked]:border-slate-500"
              />
              <label
                htmlFor="tutorial-dont-show"
                className="text-[11px] text-slate-400 cursor-pointer hover:text-slate-300 transition-colors"
              >
                Больше не показывать
              </label>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
