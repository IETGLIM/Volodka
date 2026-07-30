
/* ─── Volodka RPG – First-Play Tutorial Overlay ─── */
/* Progressive 5-step tutorial shown only on handheld/touch starts.
 * Uses the restrained filmic HUD language rather than terminal chrome. */

'use client';

import { useState, useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { completeTutorial } from '@/store/actions/tutorialActions';
import { useTutorialFlags, useTutorialReady } from '@/store/selectors';
import { useGameStore } from '@/store/gameStore';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import {
  isExplorationHudProfile,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';
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
        hud-filmic-kbd inline-flex items-center justify-center select-none
        ${wide ? 'px-2.5 h-7' : 'w-7 h-7'}
      `}
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
            border: '1px solid rgba(252, 211, 165, 0.32)',
            color: 'var(--hud-filmic-warn)',
          }}
        >
          !
        </div>
        <span className="hud-filmic-kicker">Доступно</span>
      </div>
      {/* Blue ? — active quest */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: 'rgba(96, 165, 250, 0.15)',
            border: '1px solid var(--hud-filmic-border)',
            color: 'var(--hud-filmic-accent)',
          }}
        >
          ?
        </div>
        <span className="hud-filmic-kicker">Активно</span>
      </div>
      {/* Green ✓ — completable */}
      <div className="flex flex-col items-center gap-1">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
          style={{
            background: 'rgba(74, 222, 128, 0.15)',
            border: '1px solid rgba(196, 181, 160, 0.32)',
            color: 'var(--hud-filmic-ink)',
          }}
        >
          ✓
        </div>
        <span className="hud-filmic-kicker">Сдать</span>
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
      <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>{label}</span>
    </div>
  );
}

/* ── Movement + input tutorial (keyboard / gamepad) ── */
function ControlsTutorialContent() {
  const gamepadConnected = useGamepadConnected();

  return (
    <div className="space-y-3">
      {gamepadConnected ? (
        <>
          <div className="flex items-center gap-3">
            <KeyCap wide>Левый стик</KeyCap>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Движение</span>
          </div>
          <div className="flex items-center gap-3">
            <KeyCap wide>LB</KeyCap>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Бег</span>
          </div>
          <div className="flex items-center gap-3">
            <KeyCap>A</KeyCap>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Взаимодействие</span>
          </div>
          <div className="flex items-center gap-3">
            <KeyCap wide>Правый стик</KeyCap>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Камера</span>
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-4">
            <WASDLayout />
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Движение</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              <KeyCap wide>⇧ Shift</KeyCap>
            </div>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Бег</span>
          </div>
          <div className="flex items-center gap-3">
            <KeyCap>E</KeyCap>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Взаимодействие</span>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="hud-filmic-kbd inline-flex items-center justify-center w-7 h-7"
            >
              М
            </span>
            <span className="hud-filmic-body text-[13px]" style={{ textAlign: 'left' }}>Камера</span>
          </div>
        </>
      )}
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
    icon: <Sparkles className="size-5" style={{ color: 'var(--hud-filmic-warn)' }} />,
    title: 'Добро пожаловать в ВОЛОДЬКА',
    content: (
      <p className="hud-filmic-body text-base leading-relaxed">
        Город, где код — закон, а поэзия — преступление.
        <br />
        <span style={{ color: 'var(--hud-filmic-ink-muted)' }}>Вы — </span>
        <span className="text-emerald-400/95">
          Володька
        </span>
        <span style={{ color: 'var(--hud-filmic-ink-muted)' }}>, техник IT-гильдии.</span>
      </p>
    ),
    buttonLabel: 'Далее',
  },

  /* Step 2: Movement */
  {
    icon: <Gamepad2 className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
    title: 'Управление',
    content: <ControlsTutorialContent />,
    buttonLabel: 'Понятно',
  },

  /* Step 3: Quests */
  {
    icon: <ScrollText className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
    title: 'Задания',
    content: (
      <div className="space-y-3">
        <p className="hud-filmic-body text-[13px] leading-relaxed">
          Маркеры над NPC показывают статус заданий:
        </p>
        <QuestMarkerVisual />
      </div>
    ),
    buttonLabel: 'Понятно',
  },

  /* Step 4: Karma & Poetry */
  {
    icon: <Sparkles className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
    title: 'Карма и Стихи',
    content: (
      <div className="space-y-3">
        <p className="hud-filmic-body text-[13px] leading-relaxed" style={{ textAlign: 'left' }}>
          <span style={{ color: 'var(--hud-filmic-accent)' }}>
            Карма
          </span>{' '}
          отражает ваш моральный путь — она определяет доступные концовки.
        </p>
        <p className="hud-filmic-body text-[13px] leading-relaxed" style={{ textAlign: 'left' }}>
          <span style={{ color: 'var(--hud-filmic-warn)' }}>
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
    icon: <Keyboard className="size-5" style={{ color: 'var(--hud-filmic-accent)' }} />,
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

/* ── Animation timing ── */
const STEP_TRANSITION_DURATION = 0.25;
const OVERLAY_FADE_DURATION = 0.4;
const CARD_ENTER_DURATION = 0.5;

function handlesOwnEnterOrSpace(activeElement: Element | null): boolean {
  const tag = (activeElement?.tagName ?? '').toLowerCase();
  return tag === 'button' || tag === 'a' || tag === 'input' || tag === 'textarea';
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

/* ── Main component ── */
export function FirstPlayTutorial() {
  const reducedMotion = useEffectiveReducedMotion();
  const profile = useGameplayPresentationProfile();
  const isTouchDevice = useTouchDevice();
  const tutorialFlags = useTutorialFlags();
  const tutorialReady = useTutorialReady();
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const activeCutsceneId = useGameStore((s) => s.activeCutsceneId);

  const [currentStep, setCurrentStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [dismissed, setDismissed] = useState(false);
  const [overlayReady, setOverlayReady] = useState(false);

  const currentStepRef = useRef(currentStep);
  const nextButtonRef = useRef<HTMLButtonElement>(null);
  const skipButtonRef = useRef<HTMLButtonElement>(null);
  const stepContentRef = useRef<HTMLDivElement>(null);
  const overlayVisibleRef = useRef(false);

  currentStepRef.current = currentStep;

  const shouldShow =
    !dismissed &&
    isExplorationHudProfile(profile) &&
    isTouchDevice &&
    !tutorialFlags.tutorialsDisabled &&
    !tutorialFlags.tutorialsCompleted &&
    tutorialReady &&
    !showStoryOverlay &&
    !activeCutsceneId;

  useEffect(() => {
    overlayVisibleRef.current = shouldShow;
    if (!shouldShow) {
      setOverlayReady(false);
      return;
    }
    if (reducedMotion) {
      setOverlayReady(true);
    }
  }, [shouldShow, reducedMotion]);

  const handleOverlayAnimationComplete = useCallback(() => {
    if (overlayVisibleRef.current) {
      setOverlayReady(true);
    }
  }, []);

  const finishTutorial = useCallback(() => {
    completeTutorial();
    setDismissed(true);
  }, []);

  const handleNext = useCallback(() => {
    if (currentStep < STEPS.length - 1) {
      setDirection(1);
      setCurrentStep((s) => s + 1);
    } else {
      finishTutorial();
    }
  }, [currentStep, finishTutorial]);

  const handleSkip = useCallback(() => {
    finishTutorial();
  }, [finishTutorial]);

  const callbacksRef = useRef({ handleNext, handleSkip });

  useLayoutEffect(() => {
    callbacksRef.current = { handleNext, handleSkip };
  }, [handleNext, handleSkip]);

  useEffect(() => {
    if (!shouldShow) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const activeElement = document.activeElement;

      if (event.key === 'Escape') {
        event.preventDefault();
        callbacksRef.current.handleSkip();
        return;
      }

      if (event.key === 'Enter' || event.key === ' ') {
        if (
          handlesOwnEnterOrSpace(activeElement) ||
          activeElement === nextButtonRef.current ||
          activeElement === skipButtonRef.current
        ) {
          return;
        }
        event.preventDefault();
        callbacksRef.current.handleNext();
        return;
      }

      if (event.key === 'ArrowRight') {
        event.preventDefault();
        const step = currentStepRef.current;
        if (step < STEPS.length - 1) {
          setDirection(1);
          setCurrentStep(step + 1);
        }
        return;
      }

      if (event.key === 'ArrowLeft' && currentStepRef.current > 0) {
        event.preventDefault();
        setDirection(-1);
        setCurrentStep((s) => s - 1);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [shouldShow]);

  useEffect(() => {
    if (!shouldShow || !overlayReady) return;
    stepContentRef.current?.focus({ preventScroll: true });
  }, [currentStep, shouldShow, overlayReady]);

  const step = STEPS[currentStep];
  if (!step) return null;

  const stepTransitionDuration = reducedMotion ? 0 : STEP_TRANSITION_DURATION;
  const overlayFadeDuration = reducedMotion ? 0 : OVERLAY_FADE_DURATION;
  const cardEnterDuration = reducedMotion ? 0 : CARD_ENTER_DURATION;
  const progressWidth = `${((currentStep + 1) / STEPS.length) * 100}%`;
  const nextStepTitle = STEPS[currentStep + 1]?.title;
  const nextButtonAriaLabel =
    currentStep < STEPS.length - 1
      ? `Перейти к шагу: ${nextStepTitle}`
      : 'Завершить обучение';

  return (
    <AnimatePresence mode="wait">
      {shouldShow && (
        <motion.div
          className="fixed inset-0 flex items-center justify-center pointer-events-auto"
          style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: overlayFadeDuration }}
          onAnimationComplete={handleOverlayAnimationComplete}
          role="dialog"
          aria-modal="true"
          aria-label="Обучение игре"
        >
          {/* Quiet handheld onboarding backdrop */}
          <div
            className="absolute inset-0"
            style={{
              background: 'rgba(2, 4, 8, 0.86)',
              backdropFilter: 'blur(4px)',
              WebkitBackdropFilter: 'blur(4px)',
            }}
          />

          {/* Tutorial card */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4"
            initial={{ scale: 0.9, opacity: 0, y: 30 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 30 }}
            transition={{ duration: cardEnterDuration, ease: [0.25, 0.46, 0.45, 0.94] }}
          >
            <div
              className="relative hud-filmic-plate overflow-hidden"
            >
              {/* Header with step indicator */}
              <div
                className="flex items-center justify-between px-5 py-3 border-b"
                style={{ borderColor: 'var(--hud-filmic-border)' }}
              >
                <div className="flex items-center gap-3">
                  {step.icon}
                  <h2
                    id="tutorial-title"
                    className="hud-filmic-kicker text-[11px]"
                    style={{ color: 'var(--hud-filmic-ink-muted)' }}
                  >
                    {step.title}
                  </h2>
                </div>
                {/* Step indicator + skip */}
                <div className="flex items-center gap-2">
                  <span
                    className="hud-filmic-kbd px-2 py-0.5"
                    aria-label={`Шаг ${currentStep + 1} из ${STEPS.length}`}
                  >
                    {currentStep + 1}/{STEPS.length}
                  </span>
                  <button
                    ref={skipButtonRef}
                    type="button"
                    onClick={handleSkip}
                    aria-label="Пропустить обучение"
                    className="hud-filmic-icon-btn flex items-center justify-center w-6 h-6 rounded-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-px w-full" style={{ background: 'var(--hud-filmic-border)' }}>
                {reducedMotion ? (
                  <div
                    className="h-full"
                    style={{
                      width: progressWidth,
                      background: 'var(--hud-filmic-accent)',
                    }}
                  />
                ) : (
                  <motion.div
                    className="h-full"
                    style={{
                      background: 'var(--hud-filmic-accent)',
                    }}
                    initial={false}
                    animate={{ width: progressWidth }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                  />
                )}
              </div>

              {/* Step content with slide animation */}
              <div
                ref={stepContentRef}
                className="relative px-5 py-6 overflow-hidden min-h-[180px] flex items-center"
                data-tutorial-step-content
                tabIndex={-1}
                role="status"
                aria-live="polite"
                aria-atomic="true"
                aria-labelledby="tutorial-title"
              >
                <AnimatePresence custom={direction} initial={false}>
                  <motion.div
                    key={currentStep}
                    custom={direction}
                    variants={stepVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={
                      reducedMotion
                        ? { duration: 0 }
                        : {
                            x: { type: 'spring', stiffness: 300, damping: 30 },
                            opacity: { duration: stepTransitionDuration },
                            scale: { duration: stepTransitionDuration },
                          }
                    }
                    className="w-full"
                  >
                    {step.content}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer with action button */}
              <div
                className="flex items-center justify-between px-5 py-3 border-t"
                style={{ borderColor: 'var(--hud-filmic-border)' }}
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
                            ? 'var(--hud-filmic-accent)'
                            : i < currentStep
                              ? 'var(--hud-filmic-ink-dim)'
                              : 'rgba(100, 116, 139, 0.3)',
                      }}
                    />
                  ))}
                </div>

                {/* Action button */}
                <motion.button
                  ref={nextButtonRef}
                  type="button"
                  onClick={handleNext}
                  aria-label={nextButtonAriaLabel}
                  className="group flex items-center gap-1.5 px-5 py-2 rounded-sm text-sm font-semibold font-mono tracking-wider"
                  style={{
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid var(--hud-filmic-border)',
                    color: 'var(--hud-filmic-ink)',
                  }}
                  whileHover={
                    reducedMotion
                      ? undefined
                      : {
                          background: 'rgba(255,255,255,0.07)',
                          borderColor: 'rgba(196, 181, 160, 0.3)',
                        }
                  }
                  transition={{ duration: 0.2 }}
                >
                  {step.buttonLabel}
                  <ChevronRight
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  />
                </motion.button>
              </div>

              {/* Bottom decoration: terminal label */}
              <div
                className="px-5 py-1.5 border-t"
                style={{ borderColor: 'var(--hud-filmic-border)' }}
              >
                <span
                  className="hud-filmic-kicker"
                  style={{ letterSpacing: '0.12em' }}
                >
                  ШАГ {currentStep + 1} / {STEPS.length}
                </span>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
