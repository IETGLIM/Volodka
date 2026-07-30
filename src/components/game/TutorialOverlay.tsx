
/* ─── Volodka RPG – handheld tutorial tips overlay ─── */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomTutorialTipPx } from '@/shared/constants/hudLayout';
import { X, Gamepad2, Eye, Hand, Backpack, Scroll, BookOpen, Notebook, Moon, LayoutGrid, LogOut, Zap, Swords, ClipboardList } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { useGamePhase, useTutorialFlags } from '@/store/selectors';
import { eventBus } from '@/engine/EventBus';
import { Checkbox } from '@/components/ui/checkbox';
import { useTouchDevice } from '@/hooks/useTouchDevice';

type TutorialType = 'movement' | 'interact' | 'controls' | 'poem_power' | 'combat' | 'quest_board';

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
        hud-filmic-kbd inline-flex items-center justify-center select-none
        ${wide ? 'px-2 h-7' : 'w-7 h-7'}
      `}
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
      <span className="hud-filmic-body text-xs flex-1" style={{ textAlign: 'left' }}>{label}</span>
      {icon && <span className="shrink-0" style={{ color: 'var(--hud-filmic-ink-muted)' }}>{icon}</span>}
    </div>
  );
}

const TUTORIALS: Record<TutorialType, { icon: React.ReactNode; title: string; content: React.ReactNode }> = {
  movement: {
    icon: <Gamepad2 className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
    title: 'Передвижение',
    content: (
      <div className="space-y-1">
        <div className="flex items-center gap-3">
          <WASDLayout />
          <span className="hud-filmic-body text-xs">— движение</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-0.5">
            <KeyCap>⇧</KeyCap>
          </div>
          <span className="hud-filmic-body text-xs">— бег</span>
        </div>
        <div className="flex items-center gap-2">
          <KeyCap>Space</KeyCap>
          <span className="hud-filmic-body text-xs">— прыжок</span>
        </div>
        <div className="flex items-center gap-2">
          <Eye className="size-4 shrink-0" style={{ color: 'var(--hud-filmic-ink-dim)' }} />
          <span className="hud-filmic-body text-xs">— мышь: обзор камеры</span>
        </div>
      </div>
    ),
  },
  interact: {
    icon: <Hand className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
    title: 'Взаимодействие',
    content: (
      <div className="space-y-1">
        <ControlHint keys={<KeyCap>E</KeyCap>} label="Взаимодействовать с объектами и NPC" icon={<Hand className="size-3.5" />} />
        <p className="hud-filmic-body text-xs mt-1" style={{ textAlign: 'left' }}>Подойди ближе к объекту и нажми E</p>
      </div>
    ),
  },
  controls: {
    icon: <LayoutGrid className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
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
  poem_power: {
    icon: <Zap className="size-5" style={{ color: 'var(--hud-filmic-warn)' }} />,
    title: 'Стих-способности',
    content: (
      <div className="space-y-1.5">
        <p className="hud-filmic-body text-xs" style={{ textAlign: 'left' }}>
          Каждый стих даёт уникальную способность с перезарядкой.
        </p>
        <div className="flex items-center gap-2">
          <KeyCap>1</KeyCap><KeyCap>2</KeyCap><KeyCap>3</KeyCap>
          <span className="hud-filmic-body text-xs">— выбор способности</span>
        </div>
        <div className="flex items-center gap-2">
          <KeyCap>F</KeyCap>
          <span className="hud-filmic-body text-xs">— активировать способность</span>
        </div>
        <p className="hud-filmic-kicker mt-1" style={{ color: 'var(--hud-filmic-warn)', letterSpacing: '0.08em' }}>
          После использования способность уходит на перезарядку
        </p>
      </div>
    ),
  },
  combat: {
    icon: <Swords className="size-5" style={{ color: 'var(--hud-filmic-danger)' }} />,
    title: 'Бой',
    content: (
      <div className="space-y-1.5">
        <p className="hud-filmic-body text-xs" style={{ textAlign: 'left' }}>
          В бою используй стих-способности для преимущества!
        </p>
        <div className="flex items-center gap-2">
          <KeyCap>F</KeyCap>
          <span className="hud-filmic-body text-xs">— стих-способность в бою</span>
        </div>
        <div className="flex items-center gap-2">
          <KeyCap>E</KeyCap>
          <span className="hud-filmic-body text-xs">— обычная атака</span>
        </div>
        <p className="hud-filmic-kicker mt-1" style={{ color: 'var(--hud-filmic-danger)', letterSpacing: '0.08em' }}>
          Стих-способности наносят усиленный урон
        </p>
      </div>
    ),
  },
  quest_board: {
    icon: <ClipboardList className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
    title: 'Доска заданий',
    content: (
      <div className="space-y-1.5">
        <p className="hud-filmic-body text-xs" style={{ textAlign: 'left' }}>
          На доске заданий доступны ежедневные и сюжетные миссии.
        </p>
        <div className="flex items-center gap-2">
          <KeyCap>Q</KeyCap>
          <span className="hud-filmic-body text-xs">— открыть журнал заданий</span>
        </div>
        <p className="hud-filmic-kicker mt-1" style={{ color: 'var(--hud-filmic-accent)', letterSpacing: '0.08em' }}>
          Ежедневные задания обновляются каждый игровой день
        </p>
      </div>
    ),
  },
};

export function TutorialOverlay() {
  const mode = useGamePhase();
  const tutorialFlags = useTutorialFlags();
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const isTouchDevice = useTouchDevice();

  const [dismissed, setDismissed] = useState<Set<TutorialType>>(new Set());
  const [dontShowAgain, setDontShowAgain] = useState(isTutorialDisabled);

  // Track contextual tutorial triggers from EventBus
  const poemPowerTriggeredRef = useRef(false);
  const combatTriggeredRef = useRef(false);
  const questBoardTriggeredRef = useRef(false);

  // Listen for poem:power_used — trigger poem power tutorial on first use
  useEffect(() => {
    const unsub = eventBus.on('poem:power_used', () => {
      if (!tutorialFlags.tutorial_seen_poem_power) {
        poemPowerTriggeredRef.current = true;
      }
    });
    return unsub;
  }, [tutorialFlags.tutorial_seen_poem_power]);

  // Listen for combat:start — trigger combat tutorial on first encounter
  useEffect(() => {
    const unsub = eventBus.on('combat:start', () => {
      if (!tutorialFlags.tutorial_seen_combat) {
        combatTriggeredRef.current = true;
      }
    });
    return unsub;
  }, [tutorialFlags.tutorial_seen_combat]);

  // Listen for quest board open — trigger quest board tutorial on first open
  useEffect(() => {
    const unsub = eventBus.on('ui:open_panel', (payload: { panel: string }) => {
      if (payload.panel === 'quests' && !tutorialFlags.tutorial_seen_quest_board) {
        questBoardTriggeredRef.current = true;
      }
    });
    return unsub;
  }, [tutorialFlags.tutorial_seen_quest_board]);

  // Determine which tutorial to show (sequential: movement → interact → controls, then contextual)
  const activeTutorial: TutorialType | null = (() => {
    if (tutorialFlags.tutorialsDisabled || isTutorialDisabled()) return null;
    if (mode !== 'exploration') return null;
    if (!isTouchDevice) return null;
    if (showStoryOverlay) return null;
    // Don't show contextual tips if the first-play tutorial hasn't been completed yet
    if (!tutorialFlags.tutorialsCompleted) return null;

    // First-play tutorials (sequential)
    if (!tutorialFlags.tutorial_seen_movement && !dismissed.has('movement')) {
      return 'movement';
    }
    if (!tutorialFlags.tutorial_seen_interact && !dismissed.has('interact')) {
      return 'interact';
    }
    if (!tutorialFlags.tutorial_seen_controls && !dismissed.has('controls')) {
      return 'controls';
    }

    // Contextual tutorials (triggered by gameplay events)
    if (!tutorialFlags.tutorial_seen_poem_power && poemPowerTriggeredRef.current && !dismissed.has('poem_power')) {
      return 'poem_power';
    }
    if (!tutorialFlags.tutorial_seen_combat && combatTriggeredRef.current && !dismissed.has('combat')) {
      return 'combat';
    }
    if (!tutorialFlags.tutorial_seen_quest_board && questBoardTriggeredRef.current && !dismissed.has('quest_board')) {
      return 'quest_board';
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
          className="fixed left-3 sm:left-4 pointer-events-auto"
          style={{ zIndex: UI_LAYERS.HUD, bottom: bottomTutorialTipPx() }}
        >
          <div className="relative hud-filmic-plate p-3 max-w-[260px] sm:max-w-xs">
            <div className="flex items-start gap-3 relative">
              {/* Icon */}
              <div
                className="shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-sm"
                style={{ border: '1px solid var(--hud-filmic-border)' }}
              >
                {TUTORIALS[activeTutorial].icon}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="hud-filmic-kicker mb-1.5" style={{ color: 'var(--hud-filmic-ink-muted)' }}>
                  {TUTORIALS[activeTutorial].title}
                </h3>
                {TUTORIALS[activeTutorial].content}
              </div>
              <button
                onClick={handleDismiss}
                className="hud-filmic-icon-btn shrink-0 w-6 h-6 flex items-center justify-center rounded-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-stone-400/40 transition-colors"
                aria-label="Закрыть"
              >
                <X className="size-3" />
              </button>
            </div>

            {/* Don't show again checkbox */}
            <div className="mt-2 pt-1.5 border-t flex items-center gap-2" style={{ borderColor: 'var(--hud-filmic-border)' }}>
              <Checkbox
                id="tutorial-dont-show"
                checked={dontShowAgain}
                onCheckedChange={(checked) => setDontShowAgain(checked === true)}
                className="size-3.5 border-stone-600 data-[state=checked]:bg-stone-600 data-[state=checked]:border-stone-500"
              />
              <label
                htmlFor="tutorial-dont-show"
                className="hud-filmic-kicker cursor-pointer hover:text-stone-300 transition-colors"
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
