'use client';

/* ─── Volodka RPG – Minigame Tutorial Overlay ───
 * First-time tooltip/instructions overlay shown before a minigame starts.
 * Each minigame has unique instructions. Persists dismissed state in localStorage.
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import type { MinigameHubGameType } from '@/engine/minigame/hub/minigameHubConstants';

const LS_SEEN_KEY = 'volodka_minigame_tutorials_seen';

interface MinigameTutorialStep {
  icon: string;
  instruction: string;
  detail?: string;
}

/** Per-minigame tutorial instructions. */
const MINIGAME_TUTORIALS: Record<MinigameHubGameType, MinigameTutorialStep[]> = {
  codebreaker: [
    { icon: '🔢', instruction: 'Угадайте секретный код из цифр', detail: 'После каждой попытки вы получите подсказки: 🟢 — верная цифра на верном месте, 🟡 — верная цифра на другом месте.' },
    { icon: '⏱️', instruction: 'Ограниченное число попыток', detail: 'Чем быстрее разгадаете — тем выше награда.' },
  ],
  openstack_terminal: [
    { icon: '☁️', instruction: 'Управляйте облачной инфраструктурой', detail: 'Вводите команды OpenStack для решения задач серверной administración.' },
    { icon: '💻', instruction: 'Читайте запросы внимательно', detail: 'Каждая задача требует правильной последовательности команд.' },
  ],
  bash_terminal: [
    { icon: '⌨️', instruction: 'Выполняйте команды Linux', detail: 'Используйте команды терминала для решения системных задач.' },
    { icon: '🔍', instruction: 'Комбинируйте утилиты', detail: 'Многие задачи требуют цепочек команд с pipe (|).' },
  ],
  poetry: [
    { icon: '✨', instruction: 'Составьте стихи из предложенных слов', detail: 'Выбирайте слова в правильном порядке, чтобы создать стихотворение.' },
    { icon: '🎭', instruction: 'Тематика имеет значение', detail: 'Стихи, соответствующие контексту, приносят больше очков.' },
  ],
  hacking: [
    { icon: '🔓', instruction: 'Пройдите через сетевые узлы к серверу', detail: 'Двигайтесь по узлам сети, избегая сканеров безопасности.' },
    { icon: '📡', instruction: 'Собирайте данные по пути', detail: 'Собранные данные увеличивают награду. Бонус за скорость.' },
  ],
  memory: [
    { icon: '🧠', instruction: 'Запомните паттерн нейронной сети', detail: 'Клетки загорятся в определённой последовательности. Повторите её.' },
    { icon: '📈', instruction: 'Сложность растёт', detail: 'Каждый успешный раунд удлиняет паттерн на одну клетку.' },
  ],
  quiz: [
    { icon: '📡', instruction: 'Ответьте на вопросы о кибер-мире', detail: 'Выберите правильный ответ из нескольких вариантов.' },
    { icon: '⏱️', instruction: 'Скорость приносит бонус', detail: 'Быстрые правильные ответы дают больше очков.' },
  ],
  rhythm: [
    { icon: '🎵', instruction: 'Нажимайте клавиши в такт', detail: 'Когда ноты достигают зоны попадания, нажимайте соответствующую клавишу.' },
    { icon: '🔥', instruction: 'Серии combo увеличивают множитель', detail: 'Поддерживайте непрерывные попадания для максимального счёта.' },
  ],
};

function getSeenSet(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(LS_SEEN_KEY);
    if (raw) return new Set(JSON.parse(raw));
  } catch {
    /* ignore */
  }
  return new Set();
}

function markSeen(gameType: MinigameHubGameType): void {
  const seen = getSeenSet();
  seen.add(gameType);
  try {
    localStorage.setItem(LS_SEEN_KEY, JSON.stringify([...seen]));
  } catch {
    /* quota */
  }
}

export function hasSeenMinigameTutorial(gameType: MinigameHubGameType): boolean {
  return getSeenSet().has(gameType);
}

type Props = {
  gameType: MinigameHubGameType;
  /** Called when the tutorial is dismissed or skipped. */
  onDismiss: () => void;
  /** Force-show even if previously seen (for help/re-access). */
  forceShow?: boolean;
};

export function MinigameTutorialOverlay({ gameType, onDismiss, forceShow = false }: Props) {
  const reducedMotion = useEffectiveReducedMotion();
  const gamepadConnected = useGamepadConnected();
  const [visible, setVisible] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [dontShowAgain, setDontShowAgain] = useState(false);
  const dismissRef = useRef(onDismiss);
  dismissRef.current = onDismiss;

  const steps = MINIGAME_TUTORIALS[gameType] ?? [];

  useEffect(() => {
    if (forceShow) {
      setVisible(true);
      return;
    }
    if (!hasSeenMinigameTutorial(gameType)) {
      setVisible(true);
    }
  }, [gameType, forceShow]);

  const handleDismiss = useCallback(() => {
    if (dontShowAgain) {
      markSeen(gameType);
    }
    setVisible(false);
    dismissRef.current();
  }, [gameType, dontShowAgain]);

  // Keyboard controls
  useEffect(() => {
    if (!visible) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleDismiss();
      }
      if (e.key === 'ArrowRight' && stepIndex < steps.length - 1) {
        e.preventDefault();
        setStepIndex((i) => i + 1);
      }
      if (e.key === 'ArrowLeft' && stepIndex > 0) {
        e.preventDefault();
        setStepIndex((i) => i - 1);
      }
    };
    window.addEventListener('keydown', onKeyDown, true);
    return () => window.removeEventListener('keydown', onKeyDown, true);
  }, [visible, handleDismiss, stepIndex, steps.length]);

  if (!visible || steps.length === 0) return null;

  const step = steps[stepIndex];

  return (
    <AnimatePresence>
      <motion.div
        className="minigame-tutorial-overlay"
        initial={reducedMotion ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={reducedMotion ? { opacity: 0 } : { opacity: 0 }}
        transition={{ duration: reducedMotion ? 0 : 0.2 }}
        role="dialog"
        aria-modal="true"
        aria-label={`Подсказка: ${gameType}`}
      >
        <motion.div
          className="minigame-tutorial-card"
          initial={reducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: reducedMotion ? 0 : 0.25 }}
        >
          {/* Step indicator */}
          <div className="minigame-tutorial-header">
            <div className="minigame-tutorial-dots" aria-label={`Шаг ${stepIndex + 1} из ${steps.length}`}>
              {steps.map((_, i) => (
                <div
                  key={i}
                  className="minigame-tutorial-dot"
                  style={{
                    background: i === stepIndex
                      ? 'rgba(6, 182, 212, 0.8)'
                      : i < stepIndex
                        ? 'rgba(148, 163, 184, 0.3)'
                        : 'rgba(100, 116, 139, 0.15)',
                  }}
                />
              ))}
            </div>
            <span className="minigame-tutorial-counter">
              {stepIndex + 1}/{steps.length}
            </span>
          </div>

          {/* Step content */}
          <div className="minigame-tutorial-content" role="status" aria-live="polite">
            <span className="minigame-tutorial-icon" aria-hidden="true">{step.icon}</span>
            <p className="minigame-tutorial-instruction">{step.instruction}</p>
            {step.detail && (
              <p className="minigame-tutorial-detail">{step.detail}</p>
            )}
          </div>

          {/* Actions */}
          <div className="minigame-tutorial-footer">
            <label className="minigame-tutorial-noshow">
              <input
                type="checkbox"
                checked={dontShowAgain}
                onChange={(e) => setDontShowAgain(e.target.checked)}
                className="minigame-tutorial-noshow-check"
              />
              <span className="minigame-tutorial-noshow-text">Больше не показывать</span>
            </label>

            <div className="minigame-tutorial-actions">
              {stepIndex > 0 && (
                <button
                  type="button"
                  className="minigame-tutorial-btn minigame-tutorial-btn--ghost"
                  onClick={() => setStepIndex((i) => i - 1)}
                  aria-label="Предыдущий шаг"
                >
                  ←
                </button>
              )}

              {stepIndex < steps.length - 1 ? (
                <button
                  type="button"
                  className="minigame-tutorial-btn minigame-tutorial-btn--primary"
                  onClick={() => setStepIndex((i) => i + 1)}
                  aria-label="Следующий шаг"
                >
                  Далее →
                </button>
              ) : (
                <button
                  type="button"
                  className="minigame-tutorial-btn minigame-tutorial-btn--primary"
                  onClick={handleDismiss}
                  aria-label="Начать игру"
                  autoFocus
                >
                  Начать
                </button>
              )}
            </div>
          </div>

          {/* Keyboard/gamepad hint */}
          <div className="minigame-tutorial-hint" aria-hidden="true">
            <kbd className="minigame-tutorial-hint-key">Enter</kbd>
            <span className="minigame-tutorial-hint-text">
              {gamepadConnected ? 'A — продолжить' : '— продолжить'}
            </span>
            <kbd className="minigame-tutorial-hint-key" style={{ marginLeft: 12 }}>Esc</kbd>
            <span className="minigame-tutorial-hint-text">— пропустить</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
