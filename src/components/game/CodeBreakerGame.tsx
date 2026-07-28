
/* ─── Volodka RPG – CodeBreaker mini-game (Mastermind-style) ─── */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { completeMinigame } from '@/engine/minigame/claimMinigameRewards';

/* ─── Constants ─── */
const CODE_LENGTH = 4;
const MAX_ATTEMPTS = 6;
const DIGIT_COLORS = ['#00ffee', '#ff6644', '#ffcc00', '#44ff88', '#ff44aa', '#8844ff', '#44aaff', '#ff8844', '#88ff44', '#ff4488'];

type Feedback = {
  exact: number; // correct digit + correct position
  partial: number; // correct digit + wrong position
};

type GuessRow = {
  guess: number[];
  feedback: Feedback;
};

/** Generate a random 4-digit code (digits 0–9) */
function generateSecretCode(): number[] {
  const code: number[] = [];
  for (let i = 0; i < CODE_LENGTH; i++) {
    code.push(Math.floor(Math.random() * 10));
  }
  return code;
}

/** Compute Mastermind feedback for a guess vs secret */
function computeFeedback(guess: number[], secret: number[]): Feedback {
  let exact = 0;
  let partial = 0;

  const secretRemaining: (number | null)[] = [...secret];
  const guessRemaining: (number | null)[] = [...guess];

  // First pass: exact matches
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guess[i] === secret[i]) {
      exact++;
      secretRemaining[i] = null;
      guessRemaining[i] = null;
    }
  }

  // Second pass: partial matches
  for (let i = 0; i < CODE_LENGTH; i++) {
    if (guessRemaining[i] === null) continue;
    const idx = secretRemaining.indexOf(guessRemaining[i]);
    if (idx !== -1) {
      partial++;
      secretRemaining[idx] = null;
    }
  }

  return { exact, partial };
}

interface CodeBreakerGameProps {
  onClose: () => void;
}

export function CodeBreakerGame({ onClose }: CodeBreakerGameProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [secretCode] = useState(() => generateSecretCode());
  const [currentGuess, setCurrentGuess] = useState<number[]>([]);
  const [guessHistory, setGuessHistory] = useState<GuessRow[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'won' | 'lost'>('playing');
  const [selectedSlot, setSelectedSlot] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDigit = useCallback((digit: number) => {
    if (gameState !== 'playing') return;
    if (currentGuess.length >= CODE_LENGTH) return;

    const newGuess = [...currentGuess, digit];
    setCurrentGuess(newGuess);

    if (newGuess.length === CODE_LENGTH) {
      // Submit guess
      const feedback = computeFeedback(newGuess, secretCode);
      const newRow: GuessRow = { guess: newGuess, feedback };

      setGuessHistory((prev) => [...prev, newRow]);
      setCurrentGuess([]);
      setSelectedSlot(0);

      if (feedback.exact === CODE_LENGTH) {
        setGameState('won');
        completeMinigame({
          gameType: 'codebreaker',
          success: true,
          rewards: [
            { type: 'addKarma', value: 5 },
            { type: 'setFlag', flag: 'codebreaker_solved', flagValue: true },
          ],
        });
      } else if (guessHistory.length + 1 >= MAX_ATTEMPTS) {
        setGameState('lost');
        completeMinigame({
          gameType: 'codebreaker',
          success: false,
        });
      }
    } else {
      setSelectedSlot(newGuess.length);
    }
  }, [currentGuess, gameState, secretCode, guessHistory.length]);

  const handleBackspace = useCallback(() => {
    if (gameState !== 'playing') return;
    if (currentGuess.length === 0) return;
    setCurrentGuess((prev) => prev.slice(0, -1));
    setSelectedSlot(Math.max(0, currentGuess.length - 1));
  }, [currentGuess, gameState]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handleDigit(parseInt(e.key, 10));
      } else if (e.key === 'Backspace') {
        handleBackspace();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleDigit, handleBackspace, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25, ease: 'easeOut' }}
      className="fixed inset-0 flex items-center justify-center"
      style={{ zIndex: UI_LAYERS.MINIGAME }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <FocusTrap initialFocusRef={closeButtonRef}>
      {/* Game panel */}
      <div
        ref={containerRef}
        className="relative z-10 w-full max-w-md mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 8, 15, 0.97), rgba(10, 15, 25, 0.97))',
          borderColor: 'rgba(0, 255, 238, 0.25)',
          boxShadow: '0 0 30px rgba(0, 255, 238, 0.08), inset 0 0 30px rgba(0, 255, 238, 0.02)',
        }}
        {...dialogProps}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderBottom: '1px solid rgba(0, 255, 238, 0.15)',
            background: 'rgba(0, 255, 238, 0.03)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: '#00ffee', fontSize: '18px' }} aria-hidden="true">⚡</span>
            <h2
              {...titleProps}
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: '#00ffee', fontFamily: 'monospace' }}
            >
              ВЗЛОМ КОДА
            </h2>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 transition-colors text-lg font-mono"
            aria-label="Закрыть игру"
          >
            ✕
          </button>
        </div>

        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,238,0.015) 2px, rgba(0,255,238,0.015) 4px)',
          }}
        />

        <div className="relative z-10 p-5">
          {/* Instructions */}
          <p className="text-xs mb-4" style={{ color: '#6a8a9a', fontFamily: 'monospace' }}>
            Угадай 4-значный код. Цифры: 0–9. Попыток: {MAX_ATTEMPTS - guessHistory.length} / {MAX_ATTEMPTS}
          </p>

          {/* Current guess display */}
          <div className="flex items-center justify-center gap-3 mb-5">
            {Array.from({ length: CODE_LENGTH }).map((_, i) => {
              const digit = currentGuess[i];
              const isSelected = i === selectedSlot && gameState === 'playing';
              return (
                <div
                  key={`slot-${i}`}
                  className="flex items-center justify-center w-12 h-14 rounded border-2 font-mono text-2xl font-bold transition-all duration-150"
                  style={{
                    borderColor: isSelected ? '#00ffee' : digit !== undefined ? 'rgba(0, 255, 238, 0.4)' : 'rgba(0, 255, 238, 0.15)',
                    background: isSelected ? 'rgba(0, 255, 238, 0.08)' : 'rgba(5, 10, 20, 0.6)',
                    color: digit !== undefined ? DIGIT_COLORS[digit] : 'rgba(0, 255, 238, 0.2)',
                    boxShadow: isSelected ? '0 0 12px rgba(0, 255, 238, 0.2)' : 'none',
                  }}
                >
                  {digit !== undefined ? digit : '·'}
                </div>
              );
            })}
          </div>

          {/* Guess history */}
          <div className="mb-4 max-h-48 overflow-y-auto space-y-2" style={{ scrollbarWidth: 'thin' }}>
            <AnimatePresence>
              {guessHistory.map((row, rowIdx) => (
                <motion.div
                  key={`row-${rowIdx}`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 px-3 py-1.5 rounded"
                  style={{
                    background: 'rgba(0, 255, 238, 0.03)',
                    border: '1px solid rgba(0, 255, 238, 0.08)',
                  }}
                >
                  {/* Guess digits */}
                  <div className="flex gap-1.5">
                    {row.guess.map((digit, dIdx) => (
                      <span
                        key={dIdx}
                        className="inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold font-mono"
                        style={{
                          color: DIGIT_COLORS[digit],
                          background: 'rgba(0, 0, 0, 0.3)',
                          border: '1px solid rgba(255, 255, 255, 0.06)',
                        }}
                      >
                        {digit}
                      </span>
                    ))}
                  </div>

                  {/* Feedback */}
                  <div className="flex items-center gap-1 ml-2">
                    {/* Exact matches (correct digit + position) */}
                    {Array.from({ length: row.feedback.exact }).map((_, i) => (
                      <span
                        key={`exact-${i}`}
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: '#00ffee', boxShadow: '0 0 4px rgba(0, 255, 238, 0.6)' }}
                      />
                    ))}
                    {/* Partial matches (correct digit, wrong position) */}
                    {Array.from({ length: row.feedback.partial }).map((_, i) => (
                      <span
                        key={`partial-${i}`}
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: '#ffcc00', boxShadow: '0 0 4px rgba(255, 204, 0, 0.4)' }}
                      />
                    ))}
                    {/* Misses */}
                    {Array.from({ length: CODE_LENGTH - row.feedback.exact - row.feedback.partial }).map((_, i) => (
                      <span
                        key={`miss-${i}`}
                        className="inline-block w-2.5 h-2.5 rounded-full"
                        style={{ background: 'rgba(255, 255, 255, 0.1)' }}
                      />
                    ))}
                  </div>

                  {/* Feedback labels */}
                  <span className="text-[10px] font-mono ml-1" style={{ color: '#6a8a9a' }}>
                    {row.feedback.exact > 0 && <span style={{ color: '#00ffee' }}>{row.feedback.exact}✓</span>}
                    {row.feedback.exact > 0 && row.feedback.partial > 0 && ' '}
                    {row.feedback.partial > 0 && <span style={{ color: '#ffcc00' }}>{row.feedback.partial}≅</span>}
                  </span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Digit pad */}
          {gameState === 'playing' && (
            <div className="grid grid-cols-5 gap-1.5 mb-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <button
                  key={`digit-${i}`}
                  onClick={() => handleDigit(i)}
                  className="flex items-center justify-center h-9 rounded font-mono text-sm font-bold transition-all duration-100 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(0, 255, 238, 0.06)',
                    border: '1px solid rgba(0, 255, 238, 0.2)',
                    color: DIGIT_COLORS[i],
                    boxShadow: 'inset 0 0 8px rgba(0, 255, 238, 0.03)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 238, 0.15)';
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 238, 0.5)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 255, 238, 0.06)';
                    e.currentTarget.style.borderColor = 'rgba(0, 255, 238, 0.2)';
                  }}
                >
                  {i}
                </button>
              ))}
            </div>
          )}

          {/* Backspace button */}
          {gameState === 'playing' && currentGuess.length > 0 && (
            <button
              onClick={handleBackspace}
              className="w-full py-1.5 rounded text-xs font-mono transition-all duration-100 mb-3"
              style={{
                background: 'rgba(255, 100, 68, 0.08)',
                border: '1px solid rgba(255, 100, 68, 0.2)',
                color: '#ff6644',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 100, 68, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 100, 68, 0.08)';
              }}
            >
              ← Стереть
            </button>
          )}

          {/* Game over states */}
          {gameState === 'won' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="text-2xl mb-2">🔓</div>
              <p className="text-sm font-bold font-mono" style={{ color: '#00ffee' }}>
                КОД ВЗЛОМАН!
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: '#6a8a9a' }}>
                +5 кармы · Скрытый стих обнаружен
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: 'rgba(0, 255, 238, 0.15)',
                  border: '1px solid rgba(0, 255, 238, 0.4)',
                  color: '#00ffee',
                }}
              >
                Закрыть
              </button>
            </motion.div>
          )}

          {gameState === 'lost' && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-4"
            >
              <div className="text-2xl mb-2">🔒</div>
              <p className="text-sm font-bold font-mono" style={{ color: '#ff6644' }}>
                ДОСТУП ЗАПРЕЩЁН
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: '#6a8a9a' }}>
                Код: {secretCode.join(' ')}
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: 'rgba(255, 100, 68, 0.15)',
                  border: '1px solid rgba(255, 100, 68, 0.3)',
                  color: '#ff6644',
                }}
              >
                Закрыть
              </button>
            </motion.div>
          )}

          {/* Legend */}
          <div className="flex items-center justify-center gap-4 mt-2">
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#00ffee' }} />
              <span className="text-[9px] font-mono" style={{ color: '#6a8a9a' }}>цифра+место</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: '#ffcc00' }} />
              <span className="text-[9px] font-mono" style={{ color: '#6a8a9a' }}>цифра верно</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="inline-block w-2 h-2 rounded-full" style={{ background: 'rgba(255,255,255,0.1)' }} />
              <span className="text-[9px] font-mono" style={{ color: '#6a8a9a' }}>мимо</span>
            </div>
          </div>
        </div>
      </div>
      </FocusTrap>
    </motion.div>
  );
}
