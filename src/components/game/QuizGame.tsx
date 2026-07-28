
/* ─── Volodka RPG – QuizGame (Cyberpunk Trivia Mini-game) ─── */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useSpring } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { completeMinigame } from '@/engine/minigame/claimMinigameRewards';
import { getQuizPool, type QuizQuestion } from '@/data/quizQuestions';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

// ─── Accent color (sky blue) ───
const ACCENT_RGB = '56, 189, 248';
const ACCENT = `rgba(${ACCENT_RGB}, 0.9)`;

// ─── Types ───
interface QuizGameProps {
  onClose: () => void;
}

type GamePhase = 'difficulty' | 'playing' | 'results';
type DifficultyLevel = 1 | 2 | 3;

interface DifficultyOption {
  level: DifficultyLevel;
  name: string;
  description: string;
  timePerQuestion: number;
  accentColor: string;
}

const DIFFICULTY_OPTIONS: DifficultyOption[] = [
  { level: 1, name: 'Новичок', description: 'Лёгкие вопросы, 20 сек на ответ', timePerQuestion: 20, accentColor: 'rgba(52, 211, 153, 0.9)' },
  { level: 2, name: 'Оператор', description: 'Смешанные вопросы, 15 сек на ответ', timePerQuestion: 15, accentColor: 'rgba(56, 189, 248, 0.9)' },
  { level: 3, name: 'Мастер', description: 'Сложные вопросы, 10 сек на ответ', timePerQuestion: 10, accentColor: 'rgba(244, 63, 94, 0.9)' },
];

const QUESTIONS_PER_ROUND = 5;

// ─── Timer Ring (SVG circular progress) ───
function TimerRing({ timeLeft, maxTime }: { timeLeft: number; maxTime: number }) {
  const radius = 38;
  const stroke = 4;
  const normalizedRadius = radius - stroke / 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const progress = timeLeft / maxTime;
  const strokeDashoffset = circumference * (1 - progress);

  const color =
    progress > 0.5 ? 'rgba(52, 211, 153, 0.9)' :
    progress > 0.25 ? 'rgba(251, 191, 36, 0.9)' :
    'rgba(244, 63, 94, 0.9)';

  return (
    <div className="relative w-20 h-20 flex items-center justify-center">
      <svg height={radius * 2} width={radius * 2} className="-rotate-90">
        <circle
          stroke="rgba(100, 116, 139, 0.15)"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
        />
        <motion.circle
          stroke={color}
          fill="transparent"
          strokeWidth={stroke + 1}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          strokeDasharray={`${circumference} ${circumference}`}
          animate={{ strokeDashoffset }}
          transition={{ duration: 0.3, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
        />
      </svg>
      <span
        className="absolute font-mono text-lg font-bold"
        style={{ color }}
      >
        {Math.ceil(timeLeft)}
      </span>
    </div>
  );
}

// ─── Typewriter text ───
function TypewriterText({ text, speed = 25 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState(() => '');
  const indexRef = useRef(0);

  useEffect(() => {
    indexRef.current = 0;
    let current = '';
    const interval = setInterval(() => {
      indexRef.current++;
      if (indexRef.current > text.length) {
        clearInterval(interval);
        return;
      }
      current = text.slice(0, indexRef.current);
      setDisplayed(current);
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      <motion.span
        animate={{ opacity: [1, 0] }}
        transition={{ duration: 0.5, repeat: Infinity }}
        className="inline-block w-[2px] h-[1em] ml-0.5 align-middle"
        style={{ background: ACCENT }}
      />
    </span>
  );
}

// ─── Main Component ───
export function QuizGame({ onClose }: QuizGameProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [phase, setPhase] = useState<GamePhase>('difficulty');
  const [, setDifficulty] = useState<DifficultyLevel>(2);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15);
  const [maxTime, setMaxTime] = useState(15);
  const [fiftyFiftyUsed, setFiftyFiftyUsed] = useState(false);
  const [removedOptions, setRemovedOptions] = useState<number[]>([]);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAnsweredRef = useRef(false);

  // Spring-animated score
  const springScore = useSpring(0, { stiffness: 120, damping: 14 });

  const currentQuestion = questions[currentIdx] ?? null;

  // ── Start game ──
  const startGame = useCallback((level: DifficultyLevel) => {
    const diff = DIFFICULTY_OPTIONS.find((d) => d.level === level)!;
    setDifficulty(level);
    setMaxTime(diff.timePerQuestion);
    const pool = getQuizPool(level, QUESTIONS_PER_ROUND);
    setQuestions(pool);
    setCurrentIdx(0);
    setScore(0);
    springScore.set(0);
    setStreak(0);
    setBestStreak(0);
    setCorrectCount(0);
    setWrongCount(0);
    setSelectedOption(null);
    setIsRevealed(false);
    setTimeLeft(diff.timePerQuestion);
    setFiftyFiftyUsed(false);
    setRemovedOptions([]);
    isAnsweredRef.current = false;
    setPhase('playing');
  }, [springScore]);

  // ── Timer ──
  useEffect(() => {
    if (phase !== 'playing' || isRevealed) return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 0.1) {
          // Time's up — treat as wrong
          if (!isAnsweredRef.current) {
            isAnsweredRef.current = true;
            setIsRevealed(true);
            setStreak(0);
            setWrongCount((w) => w + 1);
          }
          return 0;
        }
        return prev - 0.1;
      });
    }, 100);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [phase, currentIdx, isRevealed]);

  // ── Answer ──
  const handleAnswer = useCallback((optionIndex: number) => {
    if (isAnsweredRef.current || !currentQuestion) return;
    isAnsweredRef.current = true;

    setSelectedOption(optionIndex);
    setIsRevealed(true);

    if (timerRef.current) clearInterval(timerRef.current);

    const isCorrect = optionIndex === currentQuestion.correctIndex;

    if (isCorrect) {
      const timeMultiplier = Math.max(0.1, timeLeft / maxTime);
      const streakMultiplier = 1 + streak * 0.25;
      const points = Math.round(currentQuestion.reward.xp * timeMultiplier * streakMultiplier * 10);
      setScore((s) => s + points);
      springScore.set(score + points);
      setStreak((s) => {
        const newStreak = s + 1;
        setBestStreak((b) => Math.max(b, newStreak));
        return newStreak;
      });
      setCorrectCount((c) => c + 1);
    } else {
      setStreak(0);
      setWrongCount((w) => w + 1);
    }
  }, [currentQuestion, timeLeft, streak, score, springScore, maxTime]);

  // ── 50/50 lifeline ──
  const handleFiftyFifty = useCallback(() => {
    if (fiftyFiftyUsed || !currentQuestion || isAnsweredRef.current) return;

    setFiftyFiftyUsed(true);

    const wrongIndices = [0, 1, 2, 3].filter((i) => i !== currentQuestion.correctIndex);
    // Shuffle wrong indices and remove 2
    const shuffled = [...wrongIndices].sort(() => Math.random() - 0.5);
    setRemovedOptions(shuffled.slice(0, 2));
  }, [fiftyFiftyUsed, currentQuestion]);

  // ── Next question ──
  const handleNext = useCallback(() => {
    if (currentIdx + 1 >= questions.length) {
      setPhase('results');
      return;
    }

    setCurrentIdx((i) => i + 1);
    setSelectedOption(null);
    setIsRevealed(false);
    setTimeLeft(maxTime);
    setRemovedOptions([]);
    isAnsweredRef.current = false;
  }, [currentIdx, questions.length, maxTime]);

  // ── Claim rewards (single apply path — see claimMinigameRewards) ──
  const handleClaimRewards = useCallback(() => {
    const xpReward = Math.round(score / 5) + 20;
    const karmaReward = Math.min(correctCount * 3, 15);

    completeMinigame({
      gameType: 'quiz',
      success: correctCount >= 3,
      rewards: [
        { type: 'addXp', value: xpReward },
        { type: 'addKarma', value: karmaReward },
        { type: 'addSkill', skill: 'logic', value: 1 },
      ],
    });

    onClose();
  }, [score, correctCount, onClose]);

  // ── ESC to close ──
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  // ── Rating ──
  const getRating = (s: number) => {
    if (s >= 60) return { name: 'Архитектор', color: 'rgba(56, 189, 248, 0.9)', icon: '🏆' };
    if (s >= 30) return { name: 'Оператор', color: 'rgba(251, 191, 36, 0.9)', icon: '⚡' };
    return { name: 'Новичок', color: 'rgba(148, 163, 184, 0.7)', icon: '📖' };
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER
  // ═══════════════════════════════════════════════════════════════

  return (
    <motion.div
      className="fixed inset-0 flex items-center justify-center font-mono"
      style={{ zIndex: UI_LAYERS.MENU }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* ── Backdrop ── */}
      <motion.div
        className="absolute inset-0 backdrop-blur-lg"
        style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.92) 0%, rgba(5,8,18,0.96) 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        aria-hidden="true"
      />

      {/* ── Scanlines ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(56, 189, 248, 0.015) 2px, rgba(56, 189, 248, 0.015) 4px)',
        }}
      />

      <FocusTrap initialFocusRef={closeButtonRef}>
      {/* ── Panel ── */}
      <motion.div
        className="relative z-10 w-full max-w-2xl mx-4"
        initial={{ scale: 0.9, opacity: 0, y: 30 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 30 }}
        transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
        {...dialogProps}
      >
        <div
          className="rounded-lg border overflow-hidden"
          style={{
            background:
              'linear-gradient(180deg, rgba(8, 12, 18, 0.98) 0%, rgba(5, 8, 14, 0.99) 100%)',
            borderColor: `rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `0 0 60px rgba(${ACCENT_RGB}, 0.06), 0 8px 40px rgba(0,0,0,0.7), inset 0 1px 0 rgba(${ACCENT_RGB}, 0.05)`,
          }}
        >
          {/* ── Terminal Header ── */}
          <div
            className="flex items-center justify-between px-4 py-2.5 border-b"
            style={{
              borderColor: `rgba(${ACCENT_RGB}, 0.15)`,
              background: 'rgba(0,0,0,0.4)',
            }}
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-amber-400/80" aria-hidden="true" />
              <span className="h-2 w-2 rounded-full bg-red-500/80" aria-hidden="true" />
              <span
                {...titleProps}
                className="ml-2 font-mono text-[9px] uppercase tracking-[0.2em]"
                style={{ color: `rgba(${ACCENT_RGB}, 0.5)` }}
              >
                📡 КИБЕР-ВИКТОРИНА
              </span>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-200 hover:bg-white/5 transition-colors font-mono text-sm"
              aria-label="Закрыть викторину"
            >
              ✕
            </button>
          </div>

          {/* ════════════════════════════════════════════════════════
              DIFFICULTY SELECT
              ════════════════════════════════════════════════════════ */}
          <AnimatePresence mode="wait">
            {phase === 'difficulty' && (
              <motion.div
                key="difficulty"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                <h2
                  className="text-xl font-bold tracking-[0.2em] uppercase text-center mb-2"
                  style={{ color: ACCENT, textShadow: `0 0 20px rgba(${ACCENT_RGB}, 0.3)` }}
                >
                  📡 Кибер-викторина
                </h2>
                <p className="text-center text-xs mb-8" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                  Проверьте свои знания о мире Волodka
                </p>

                <div className="space-y-3">
                  {DIFFICULTY_OPTIONS.map((opt) => (
                    <motion.button
                      key={opt.level}
                      onClick={() => startGame(opt.level)}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center gap-4 p-4 rounded-lg border transition-all duration-200"
                      style={{
                        borderColor: `${opt.accentColor.replace('0.9', '0.2')}`,
                        background: `${opt.accentColor.replace('0.9', '0.06')}`,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.borderColor = opt.accentColor.replace('0.9', '0.5');
                        e.currentTarget.style.background = opt.accentColor.replace('0.9', '0.12');
                        e.currentTarget.style.boxShadow = `0 0 20px ${opt.accentColor.replace('0.9', '0.15')}`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.borderColor = opt.accentColor.replace('0.9', '0.2');
                        e.currentTarget.style.background = opt.accentColor.replace('0.9', '0.06');
                        e.currentTarget.style.boxShadow = 'none';
                      }}
                    >
                      <span className="text-2xl">
                        {opt.level === 1 ? '🟢' : opt.level === 2 ? '🔵' : '🔴'}
                      </span>
                      <div className="text-left flex-1">
                        <div className="font-bold text-sm uppercase tracking-wider" style={{ color: opt.accentColor }}>
                          {opt.name}
                        </div>
                        <div className="text-[11px] mt-0.5" style={{ color: 'rgba(148, 163, 184, 0.55)' }}>
                          {opt.description}
                        </div>
                      </div>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={opt.accentColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </motion.button>
                  ))}
                </div>

                <p className="text-center text-[10px] mt-6" style={{ color: 'rgba(148, 163, 184, 0.3)' }}>
                  {QUESTIONS_PER_ROUND} вопросов за раунд • Удачи!
                </p>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════
                PLAYING PHASE
                ════════════════════════════════════════════════════════ */}
            {phase === 'playing' && currentQuestion && (
              <motion.div
                key={`playing-${currentIdx}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
                className="p-6"
              >
                {/* ── Top bar: timer + score + streak ── */}
                <div className="flex items-center justify-between mb-6">
                  <TimerRing timeLeft={timeLeft} maxTime={maxTime} />

                  <div className="flex-1 text-center">
                    <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}>
                      Вопрос {currentIdx + 1}/{questions.length}
                    </div>
                    <motion.div
                      className="text-2xl font-bold"
                      style={{ color: ACCENT, textShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.3)` }}
                    >
                      {Math.round(springScore.get())}
                    </motion.div>
                  </div>

                  {/* Streak + 50/50 */}
                  <div className="flex flex-col items-end gap-2">
                    {streak > 0 && (
                      <motion.div
                        key={streak}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          background: 'rgba(251, 146, 60, 0.15)',
                          border: '1px solid rgba(251, 146, 60, 0.3)',
                        }}
                      >
                        <span className="text-xs">🔥</span>
                        <span className="text-[11px] font-bold" style={{ color: 'rgba(251, 146, 60, 0.9)' }}>
                          ×{streak}
                        </span>
                      </motion.div>
                    )}
                    {!fiftyFiftyUsed && (
                      <motion.button
                        onClick={handleFiftyFifty}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all"
                        style={{
                          color: 'rgba(251, 191, 36, 0.8)',
                          background: 'rgba(251, 191, 36, 0.08)',
                          border: '1px solid rgba(251, 191, 36, 0.25)',
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.15)';
                          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.5)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = 'rgba(251, 191, 36, 0.08)';
                          e.currentTarget.style.borderColor = 'rgba(251, 191, 36, 0.25)';
                        }}
                        aria-label="Подсказка 50/50"
                      >
                        ⚡ 50/50
                      </motion.button>
                    )}
                    {fiftyFiftyUsed && (
                      <span
                        className="text-[10px] uppercase tracking-wider line-through"
                        style={{ color: 'rgba(148, 163, 184, 0.25)' }}
                      >
                        ⚡ 50/50
                      </span>
                    )}
                  </div>
                </div>

                {/* ── Category badge ── */}
                <div className="flex items-center gap-2 mb-3">
                  <span
                    className="inline-block px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider font-bold"
                    style={{
                      background: `rgba(${ACCENT_RGB}, 0.1)`,
                      color: `rgba(${ACCENT_RGB}, 0.6)`,
                      border: `1px solid rgba(${ACCENT_RGB}, 0.2)`,
                    }}
                  >
                    {currentQuestion.category === 'technology' ? '🔧 Технология' :
                     currentQuestion.category === 'society' ? '👥 Общество' :
                     currentQuestion.category === 'history' ? '📜 История' :
                     currentQuestion.category === 'poetry' ? '✨ Поэзия' :
                     currentQuestion.category === 'hacking' ? '🔓 Хакинг' :
                     '🏙️ Город'}
                  </span>
                  <span
                    className="text-[10px] uppercase tracking-wider"
                    style={{ color: 'rgba(148, 163, 184, 0.3)' }}
                  >
                    {currentQuestion.difficulty === 1 ? 'Легко' : currentQuestion.difficulty === 2 ? 'Средне' : 'Сложно'}
                  </span>
                </div>

                {/* ── Question text ── */}
                <div
                  className="rounded-lg p-4 mb-5"
                  style={{ background: 'rgba(15, 23, 42, 0.5)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
                >
                  <p className="text-sm leading-relaxed" style={{ color: 'rgba(226, 232, 240, 0.9)' }}>
                    <TypewriterText text={currentQuestion.question} speed={18} />
                  </p>
                </div>

                {/* ── Answer options (2×2 grid) ── */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  {currentQuestion.options.map((option, idx) => {
                    const isRemoved = removedOptions.includes(idx);
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQuestion.correctIndex;
                    const isRevealedState = isRevealed;

                    if (isRemoved) return null;

                    let borderColor = `rgba(${ACCENT_RGB}, 0.15)`;
                    let bgColor = `rgba(${ACCENT_RGB}, 0.04)`;
                    let textColor = 'rgba(226, 232, 240, 0.8)';
                    let glow = 'none';
                    let shake = false;

                    if (isRevealedState) {
                      if (isCorrect) {
                        borderColor = 'rgba(52, 211, 153, 0.6)';
                        bgColor = 'rgba(52, 211, 153, 0.12)';
                        textColor = 'rgba(52, 211, 153, 0.95)';
                        glow = '0 0 20px rgba(52, 211, 153, 0.2), inset 0 0 12px rgba(52, 211, 153, 0.05)';
                      } else if (isSelected && !isCorrect) {
                        borderColor = 'rgba(244, 63, 94, 0.6)';
                        bgColor = 'rgba(244, 63, 94, 0.12)';
                        textColor = 'rgba(244, 63, 94, 0.95)';
                        glow = '0 0 20px rgba(244, 63, 94, 0.2)';
                        shake = true;
                      } else {
                        borderColor = 'rgba(100, 116, 139, 0.1)';
                        bgColor = 'rgba(15, 23, 42, 0.3)';
                        textColor = 'rgba(148, 163, 184, 0.3)';
                      }
                    }

                    return (
                      <motion.button
                        key={idx}
                        onClick={() => handleAnswer(idx)}
                        disabled={isRevealedState}
                        animate={shake ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                        transition={shake ? { duration: 0.4 } : {}}
                        whileHover={!isRevealedState ? { scale: 1.02 } : {}}
                        whileTap={!isRevealedState ? { scale: 0.98 } : {}}
                        className="relative flex items-center gap-3 p-3.5 rounded-lg border text-left transition-all duration-200"
                        style={{
                          borderColor,
                          background: bgColor,
                          color: textColor,
                          boxShadow: glow,
                          cursor: isRevealedState ? 'default' : 'pointer',
                        }}
                        onMouseEnter={!isRevealedState ? (e) => {
                          e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.4)`;
                          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.1)`;
                          e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.12)`;
                        } : undefined}
                        onMouseLeave={!isRevealedState ? (e) => {
                          e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.15)`;
                          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.04)`;
                          e.currentTarget.style.boxShadow = 'none';
                        } : undefined}
                      >
                        <span
                          className="inline-flex items-center justify-center w-7 h-7 rounded-md text-[11px] font-bold shrink-0"
                          style={{
                            background: isRevealedState && isCorrect
                              ? 'rgba(52, 211, 153, 0.2)'
                              : isRevealedState && isSelected && !isCorrect
                              ? 'rgba(244, 63, 94, 0.2)'
                              : `rgba(${ACCENT_RGB}, 0.08)`,
                            border: `1px solid ${isRevealedState && isCorrect ? 'rgba(52, 211, 153, 0.3)' : isRevealedState && isSelected && !isCorrect ? 'rgba(244, 63, 94, 0.3)' : `rgba(${ACCENT_RGB}, 0.15)`}`,
                            color: isRevealedState && isCorrect ? 'rgba(52, 211, 153, 0.9)' : isRevealedState && isSelected && !isCorrect ? 'rgba(244, 63, 94, 0.9)' : `rgba(${ACCENT_RGB}, 0.5)`,
                          }}
                        >
                          {String.fromCharCode(65 + idx)}
                        </span>
                        <span className="text-[13px] leading-snug">{option}</span>

                        {/* Correct/wrong icon */}
                        {isRevealedState && isCorrect && (
                          <motion.span
                            initial={{ scale: 0, rotate: -90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-2 right-2 text-emerald-400 text-sm"
                          >
                            ✓
                          </motion.span>
                        )}
                        {isRevealedState && isSelected && !isCorrect && (
                          <motion.span
                            initial={{ scale: 0, rotate: 90 }}
                            animate={{ scale: 1, rotate: 0 }}
                            className="absolute top-2 right-2 text-rose-400 text-sm"
                          >
                            ✗
                          </motion.span>
                        )}
                      </motion.button>
                    );
                  })}
                </div>

                {/* ── Next button (visible after reveal) ── */}
                <AnimatePresence>
                  {isRevealed && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="flex justify-center"
                    >
                      <motion.button
                        onClick={handleNext}
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        className="px-8 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
                        style={{
                          color: ACCENT,
                          background: `rgba(${ACCENT_RGB}, 0.1)`,
                          border: `1px solid rgba(${ACCENT_RGB}, 0.3)`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.2)`;
                          e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.5)`;
                          e.currentTarget.style.boxShadow = `0 0 20px rgba(${ACCENT_RGB}, 0.15)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.1)`;
                          e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.3)`;
                          e.currentTarget.style.boxShadow = 'none';
                        }}
                      >
                        {currentIdx + 1 >= questions.length ? 'Результаты →' : 'Далее →'}
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}

            {/* ════════════════════════════════════════════════════════
                RESULTS PHASE
                ════════════════════════════════════════════════════════ */}
            {phase === 'results' && (
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="p-6"
              >
                {/* ── Rating ── */}
                {(() => {
                  const rating = getRating(score);
                  return (
                    <div className="text-center mb-6">
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.2 }}
                        className="text-5xl mb-3"
                      >
                        {rating.icon}
                      </motion.div>
                      <motion.h2
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="text-2xl font-bold tracking-[0.2em] uppercase"
                        style={{ color: rating.color, textShadow: `0 0 20px ${rating.color}` }}
                      >
                        {rating.name}
                      </motion.h2>
                    </div>
                  );
                })()}

                {/* ── Score ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-center mb-6"
                >
                  <div className="text-[10px] uppercase tracking-wider mb-1" style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}>
                    Итого очков
                  </div>
                  <motion.div
                    className="text-4xl font-bold"
                    style={{ color: ACCENT, textShadow: `0 0 25px rgba(${ACCENT_RGB}, 0.4)` }}
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', stiffness: 150, damping: 10, delay: 0.6 }}
                  >
                    {score}
                  </motion.div>
                </motion.div>

                {/* ── Stats grid ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  className="grid grid-cols-3 gap-3 mb-6"
                >
                  <div
                    className="rounded-lg p-3 text-center"
                    style={{ background: 'rgba(52, 211, 153, 0.06)', border: '1px solid rgba(52, 211, 153, 0.15)' }}
                  >
                    <div className="text-lg font-bold" style={{ color: 'rgba(52, 211, 153, 0.9)' }}>
                      {correctCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(52, 211, 153, 0.5)' }}>
                      Верно
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-3 text-center"
                    style={{ background: 'rgba(244, 63, 94, 0.06)', border: '1px solid rgba(244, 63, 94, 0.15)' }}
                  >
                    <div className="text-lg font-bold" style={{ color: 'rgba(244, 63, 94, 0.9)' }}>
                      {wrongCount}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(244, 63, 94, 0.5)' }}>
                      Неверно
                    </div>
                  </div>
                  <div
                    className="rounded-lg p-3 text-center"
                    style={{ background: 'rgba(251, 146, 60, 0.06)', border: '1px solid rgba(251, 146, 60, 0.15)' }}
                  >
                    <div className="text-lg font-bold" style={{ color: 'rgba(251, 146, 60, 0.9)' }}>
                      {bestStreak}
                    </div>
                    <div className="text-[10px] uppercase tracking-wider" style={{ color: 'rgba(251, 146, 60, 0.5)' }}>
                      Серия
                    </div>
                  </div>
                </motion.div>

                {/* ── Rewards ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="rounded-lg p-4 mb-6"
                  style={{ background: 'rgba(15, 23, 42, 0.5)', border: `1px solid rgba(${ACCENT_RGB}, 0.1)` }}
                >
                  <div className="text-[10px] uppercase tracking-wider mb-3 text-center" style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}>
                    Награды
                  </div>
                  <div className="flex items-center justify-center gap-6">
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: 'rgba(56, 189, 248, 0.9)' }}>
                        +{Math.round(score / 5) + 20} XP
                      </div>
                      <div className="text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Опыт</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: 'rgba(168, 85, 247, 0.9)' }}>
                        +{Math.min(correctCount * 3, 15)} кармы
                      </div>
                      <div className="text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Карма</div>
                    </div>
                    <div className="text-center">
                      <div className="text-sm font-bold" style={{ color: 'rgba(52, 211, 153, 0.9)' }}>
                        +1 логика
                      </div>
                      <div className="text-[10px]" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>Навык</div>
                    </div>
                  </div>
                </motion.div>

                {/* ── Claim button ── */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.0 }}
                  className="flex justify-center"
                >
                  <motion.button
                    onClick={handleClaimRewards}
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    className="px-10 py-3 rounded-md font-mono text-sm tracking-[0.15em] uppercase font-bold transition-all duration-200"
                    style={{
                      color: 'rgba(8, 12, 18, 1)',
                      background: ACCENT,
                      boxShadow: `0 0 25px rgba(${ACCENT_RGB}, 0.3), 0 4px 15px rgba(0,0,0,0.3)`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 35px rgba(${ACCENT_RGB}, 0.5), 0 4px 20px rgba(0,0,0,0.3)`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.3), 0 4px 15px rgba(0,0,0,0.3)`;
                    }}
                  >
                    Забрать награды
                  </motion.button>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Corner glow decorations ── */}
        <div
          className="absolute -top-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `-2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
        />
        <div
          className="absolute -top-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderTop: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.3)`,
            boxShadow: `2px -2px 10px rgba(${ACCENT_RGB}, 0.1)`,
          }}
        />
        <div
          className="absolute -bottom-px -left-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderLeft: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `-2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
        />
        <div
          className="absolute -bottom-px -right-px w-8 h-8 pointer-events-none"
          style={{
            borderBottom: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            borderRight: `2px solid rgba(${ACCENT_RGB}, 0.2)`,
            boxShadow: `2px 2px 10px rgba(${ACCENT_RGB}, 0.05)`,
          }}
        />
      </motion.div>
      </FocusTrap>
    </motion.div>
  );
}
