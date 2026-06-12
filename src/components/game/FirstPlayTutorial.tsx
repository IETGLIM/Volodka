
/* ─── Volodka RPG – First-Play Tutorial Overlay ─── */
/* Progressive 5-step tutorial shown on first game start.
 * Cyberpunk terminal aesthetic with scanlines, glow effects,
 * and AnimatePresence transitions between steps. */

'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { hasVisitedNode } from '@/store/visitedNodesIndex';
import { useGamePhase, useTutorialFlags } from '@/store/selectors';
import {
  Gamepad2,
  ScrollText,
  Sparkles,
  Keyboard,
  ChevronRight,
} from 'lucide-react';

/* ── Key cap component ── */
function KeyCap({ children, wide }: { children: React.ReactNode; wide?: boolean }) {
  return (
    <span
      className={`
        inline-flex items-center justify-center rounded border text-xs font-bold font-mono
        select-none transition-all duration-200
        ${wide ? 'px-2.5 h-8' : 'w-8 h-8'}
      `}
      style={{
        background: 'rgba(15, 23, 42, 0.7)',
        borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
        color: 'rgb(var(--cyber-cyan-rgb) / 0.9)',
        boxShadow:
          '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.15), inset 0 1px 0 rgba(255,255,255,0.04), inset 0 -2px 0 rgba(0,0,0,0.3)',
        textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.5)',
      }}
    >
      {children}
    </span>
  );
}

/* ── WASD key layout ── */
function WASDLayout() {
  return (
    <div className="flex flex-col items-center gap-1">
      <KeyCap>W</KeyCap>
      <div className="flex gap-1">
        <KeyCap>A</KeyCap>
        <KeyCap>S</KeyCap>
        <KeyCap>D</KeyCap>
      </div>
    </div>
  );
}

/* ── Quest marker mini-visual ── */
function QuestMarkerVisual() {
  return (
    <div className="flex items-center justify-center gap-6 py-2">
      {/* Yellow ! — available quest */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: 'rgba(250, 204, 21, 0.15)',
            border: '2px solid rgba(250, 204, 21, 0.5)',
            color: '#facc15',
            textShadow: '0 0 8px rgba(250, 204, 21, 0.6)',
            boxShadow: '0 0 12px rgba(250, 204, 21, 0.2)',
          }}
        >
          !
        </div>
        <span className="text-[10px] text-yellow-400/70 font-mono">Доступно</span>
      </div>
      {/* Blue ? — active quest */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: 'rgba(96, 165, 250, 0.15)',
            border: '2px solid rgba(96, 165, 250, 0.5)',
            color: '#60a5fa',
            textShadow: '0 0 8px rgba(96, 165, 250, 0.6)',
            boxShadow: '0 0 12px rgba(96, 165, 250, 0.2)',
          }}
        >
          ?
        </div>
        <span className="text-[10px] text-blue-400/70 font-mono">Активно</span>
      </div>
      {/* Green ✓ — completable */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: 'rgba(74, 222, 128, 0.15)',
            border: '2px solid rgba(74, 222, 128, 0.5)',
            color: '#4ade80',
            textShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
            boxShadow: '0 0 12px rgba(74, 222, 128, 0.2)',
          }}
        >
          ✓
        </div>
        <span className="text-[10px] text-green-400/70 font-mono">Сдать</span>
      </div>
    </div>
  );
}

/* ── Shortcut row ── */
function ShortcutRow({ keys, label }: { keys: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="shrink-0 flex items-center gap-1 min-w-[80px] justify-end">
        {keys}
      </div>
      <span className="text-sm text-slate-300/80">{label}</span>
    </div>
  );
}

/* ── Tutorial step data ── */
interface TutorialStep {
  icon: React.ReactNode;
  title: string;
  content: React.ReactNode;
  buttonLabel: string;
}

const STEPS: TutorialStep[] = [
  /* Step 1: Welcome */
  {
    icon: <Sparkles className="size-6 text-amber-400" style={{ filter: 'drop-shadow(0 0 6px rgba(251,191,36,0.5))' }} />,
    title: 'Добро пожаловать в ВОЛОДЬКА',
    content: (
      <p className="text-base leading-relaxed" style={{ color: 'rgba(251, 191, 36, 0.9)' }}>
        Город, где код — закон, а поэзия — преступление.
        <br />
        <span className="text-slate-300/70">Вы — </span>
        <span style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.9)', textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)' }}>
          Володька
        </span>
        <span className="text-slate-300/70">, техник IT-гильдии.</span>
      </p>
    ),
    buttonLabel: 'Далее',
  },

  /* Step 2: Movement */
  {
    icon: <Gamepad2 className="size-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }} />,
    title: 'Управление',
    content: (
      <div className="space-y-3">
        <div className="flex items-center gap-4">
          <WASDLayout />
          <span className="text-sm text-slate-300/80">Движение</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            <KeyCap wide>⇧ Shift</KeyCap>
          </div>
          <span className="text-sm text-slate-300/80">Бег</span>
        </div>
        <div className="flex items-center gap-3">
          <KeyCap>E</KeyCap>
          <span className="text-sm text-slate-300/80">Взаимодействие</span>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="inline-flex items-center justify-center w-8 h-8 rounded text-xs font-mono"
            style={{
              background: 'rgba(15, 23, 42, 0.7)',
              border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.25)',
              color: 'rgb(var(--cyber-cyan-rgb) / 0.9)',
              textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.5)',
            }}
          >
            🖱
          </span>
          <span className="text-sm text-slate-300/80">Камера</span>
        </div>
      </div>
    ),
    buttonLabel: 'Понятно',
  },

  /* Step 3: Quests */
  {
    icon: <ScrollText className="size-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }} />,
    title: 'Задания',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300/80 leading-relaxed">
          Маркеры над NPC показывают статус заданий:
        </p>
        <QuestMarkerVisual />
      </div>
    ),
    buttonLabel: 'Понятно',
  },

  /* Step 4: Karma & Poetry */
  {
    icon: <Sparkles className="size-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }} />,
    title: 'Карма и Стихи',
    content: (
      <div className="space-y-3">
        <p className="text-sm text-slate-300/80 leading-relaxed">
          <span style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.9)', textShadow: '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.3)' }}>
            Карма
          </span>{' '}
          отражает ваш моральный путь — она определяет доступные концовки.
        </p>
        <p className="text-sm text-slate-300/80 leading-relaxed">
          <span style={{ color: 'rgba(251, 191, 36, 0.9)', textShadow: '0 0 6px rgba(251, 191, 36, 0.3)' }}>
            Стихотворения
          </span>{' '}
          дают особые способности и открывают закрытые пути.
        </p>
      </div>
    ),
    buttonLabel: 'Понятно',
  },

  /* Step 5: Key Shortcuts */
  {
    icon: <Keyboard className="size-6 text-cyan-400" style={{ filter: 'drop-shadow(0 0 6px rgba(0,229,255,0.5))' }} />,
    title: 'Быстрые клавиши',
    content: (
      <div className="space-y-0.5">
        <ShortcutRow keys={<KeyCap>Q</KeyCap>} label="Задания" />
        <ShortcutRow keys={<KeyCap>I</KeyCap>} label="Инвентарь" />
        <ShortcutRow
          keys={
            <>
              <KeyCap wide>⇧ Shift</KeyCap>
              <span className="text-slate-600 text-xs">+</span>
              <KeyCap>P</KeyCap>
            </>
          }
          label="Стихи"
        />
        <ShortcutRow keys={<KeyCap>J</KeyCap>} label="Журнал" />
        <ShortcutRow keys={<KeyCap wide>Esc</KeyCap>} label="Меню" />
      </div>
    ),
    buttonLabel: 'Начать игру',
  },
];

/* ── Scanline overlay CSS (injected once) ── */
const SCANLINE_STYLE_ID = 'first-play-tutorial-scanlines';

function injectScanlineStyles() {
  if (typeof document === 'undefined') return;
  if (document.getElementById(SCANLINE_STYLE_ID)) return;

  const style = document.createElement('style');
  style.id = SCANLINE_STYLE_ID;
  style.textContent = `
    @keyframes fps-scanline-sweep {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(100vh); }
    }
    @keyframes fps-scanline-lines {
      0% { background-position: 0 0; }
      100% { background-position: 0 4px; }
    }
  `;
  document.head.appendChild(style);
}

/* ── Step transition variants ── */
const stepVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
    scale: 0.96,
  }),
  center: {
    x: 0,
    opacity: 1,
    scale: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
    scale: 0.96,
  }),
};

/** Defer first-play tutorial until the player makes a hub choice or visits the corridor. */
const ACT1_TUTORIAL_READY_NODES = [
  'room_table',
  'room_bookshelf',
  'corridor_door',
  'corridor_explore_mode',
] as const;

function isAct1TutorialReady(visitedNodes: readonly string[]): boolean {
  return ACT1_TUTORIAL_READY_NODES.some((nodeId) => hasVisitedNode(visitedNodes, nodeId));
}

/* ── Main component ── */
export function FirstPlayTutorial() {
  const mode = useGamePhase();
  const tutorialFlags = useTutorialFlags();
  const visitedNodes = useGameStore((s) => s.playerState.visitedNodes);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dismissed, setDismissed] = useState(false);

  // First play only — wait until after explore hub choice or corridor visit (not during wake VN).
  const shouldShow =
    !dismissed &&
    mode === 'exploration' &&
    !tutorialFlags.tutorialsDisabled &&
    !tutorialFlags.tutorialsCompleted &&
    isAct1TutorialReady(visitedNodes);

  // Inject scanline animation styles
  if (typeof window !== 'undefined') {
    injectScanlineStyles();
  }

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      // Tutorial complete — mark all flags and close
      useGameStore.setState({
        tutorialFlags: {
          ...useGameStore.getState().tutorialFlags,
          tutorialsCompleted: true,
          tutorial_seen_movement: true,
          tutorial_seen_interact: true,
          tutorial_seen_controls: true,
        },
      });
      setDismissed(true);
    }
  }, [currentStep]);

  const handleSkip = useCallback(() => {
    useGameStore.setState({
      tutorialFlags: {
        ...useGameStore.getState().tutorialFlags,
        tutorialsCompleted: true,
        tutorial_seen_movement: true,
        tutorial_seen_interact: true,
        tutorial_seen_controls: true,
      },
    });
    setDismissed(true);
  }, []);

  const step = STEPS[currentStep];

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-auto"
          style={{ zIndex: UI_LAYERS.MENU + 1 }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4 }}
        >
          {/* Dark backdrop with scanlines */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(2, 6, 12, 0.92)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          >
            {/* Static scanline pattern */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent, transparent 2px, rgb(var(--cyber-cyan-rgb) / 0.015) 2px, rgb(var(--cyber-cyan-rgb) / 0.015) 4px)',
                animation: 'fps-scanline-lines 0.3s linear infinite',
              }}
            />
            {/* Sweeping scanline bar */}
            <div
              className="absolute inset-x-0 h-20 pointer-events-none"
              style={{
                background:
                  'linear-gradient(180deg, transparent 0%, rgb(var(--cyber-cyan-rgb) / 0.03) 30%, rgb(var(--cyber-cyan-rgb) / 0.06) 50%, rgb(var(--cyber-cyan-rgb) / 0.03) 70%, transparent 100%)',
                animation: 'fps-scanline-sweep 5s linear infinite',
              }}
            />
          </div>

          {/* Tutorial card */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: 0.5, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="relative rounded-lg border overflow-hidden"
              style={{
                background: 'linear-gradient(180deg, rgba(8, 12, 20, 0.98) 0%, rgba(4, 8, 16, 0.99) 100%)',
                borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.2)',
                boxShadow:
                  '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.08), 0 0 80px rgb(var(--cyber-cyan-rgb) / 0.04), 0 8px 32px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 pointer-events-none" style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.4)' }} />
              <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 pointer-events-none" style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.4)' }} />
              <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 pointer-events-none" style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.4)' }} />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 pointer-events-none" style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.4)' }} />

              {/* Header with step indicator */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.1)' }}
              >
                <div className="flex items-center gap-3">
                  {step.icon}
                  <h2
                    className="text-base font-semibold tracking-wide font-mono"
                    style={{
                      color: 'rgb(var(--cyber-cyan-rgb) / 0.95)',
                      textShadow: '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3)',
                    }}
                  >
                    {step.title}
                  </h2>
                </div>
                {/* Step indicator + skip */}
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono px-2 py-0.5 rounded border"
                    style={{
                      color: 'rgb(var(--cyber-cyan-rgb) / 0.6)',
                      borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
                      background: 'rgb(var(--cyber-cyan-rgb) / 0.05)',
                    }}
                  >
                    {currentStep + 1}/{STEPS.length}
                  </span>
                  <button
                    onClick={handleSkip}
                    aria-label="Пропустить обучение"
                    className="flex items-center justify-center w-6 h-6 rounded border text-slate-400 hover:text-white transition-colors"
                    style={{
                      borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.15)',
                      background: 'rgba(0,0,0,0.3)',
                    }}
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-0.5 w-full" style={{ background: 'rgb(var(--cyber-cyan-rgb) / 0.08)' }}>
                <motion.div
                  className="h-full"
                  style={{
                    background: 'linear-gradient(90deg, rgb(var(--cyber-cyan-rgb) / 0.6), rgb(var(--cyber-cyan-rgb) / 0.3))',
                    boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.4)',
                  }}
                  initial={false}
                  animate={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                />
              </div>

              {/* Step content with slide animation */}
              <div className="relative px-5 py-6 overflow-hidden min-h-[180px] flex items-center">
                <AnimatePresence mode="wait" custom={direction}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.25 },
                    }}
                    className="w-full"
                  >
                    {step.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer with action button */}
              <div
                className="flex items-center justify-between px-5 py-3 border-t"
                style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.1)' }}
              >
                {/* Step dots */}
                <div className="flex items-center gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 rounded-full transition-all duration-300"
                      style={{
                        background:
                          i === currentStep
                            ? 'rgb(var(--cyber-cyan-rgb) / 0.8)'
                            : i < currentStep
                              ? 'rgb(var(--cyber-cyan-rgb) / 0.3)'
                              : 'rgba(100, 116, 139, 0.3)',
                        boxShadow:
                          i === currentStep
                            ? '0 0 6px rgb(var(--cyber-cyan-rgb) / 0.5)'
                            : 'none',
                      }}
                    />
                  ))}
                </div>

                {/* Action button */}
                <button
                  onClick={handleNext}
                  className="group flex items-center gap-1.5 px-5 py-2 rounded text-sm font-semibold font-mono tracking-wider transition-all duration-200"
                  style={{
                    background: 'rgb(var(--cyber-cyan-rgb) / 0.1)',
                    border: '1px solid rgb(var(--cyber-cyan-rgb) / 0.3)',
                    color: 'rgb(var(--cyber-cyan-rgb) / 0.95)',
                    textShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgb(var(--cyber-cyan-rgb) / 0.2)';
                    e.currentTarget.style.borderColor = 'rgb(var(--cyber-cyan-rgb) / 0.5)';
                    e.currentTarget.style.boxShadow = '0 0 16px rgb(var(--cyber-cyan-rgb) / 0.2)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgb(var(--cyber-cyan-rgb) / 0.1)';
                    e.currentTarget.style.borderColor = 'rgb(var(--cyber-cyan-rgb) / 0.3)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  {step.buttonLabel}
                  <ChevronRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    style={{ filter: 'drop-shadow(0 0 4px rgb(var(--cyber-cyan-rgb) / 0.4))' }}
                  />
                </button>
              </div>

              {/* Bottom decoration: terminal label */}
              <div
                className="px-5 py-1.5 border-t"
                style={{ borderColor: 'rgb(var(--cyber-cyan-rgb) / 0.05)' }}
              >
                <span
                  className="text-[10px] font-mono tracking-wider"
                  style={{ color: 'rgb(var(--cyber-cyan-rgb) / 0.25)' }}
                >
                  volodka://tutorial/step_{currentStep + 1}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
