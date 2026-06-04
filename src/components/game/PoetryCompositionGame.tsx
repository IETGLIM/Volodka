
/* ─── Volodka RPG – Poetry Composition mini-game (Cyberpunk "Mad Libs") ─── */

import { useState, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/* ─── Accent colors ─── */
const ACCENT_RGB = '168, 85, 247';
const ACCENT_COLOR = `rgba(${ACCENT_RGB}, 0.9)`;
const ACCENT_GLOW = `rgba(${ACCENT_RGB}, 0.3)`;

/* ─── Types ─── */
interface WordOption {
  word: string;
  quality: number; // 1=basic, 2=good, 3=perfect
}

interface BlankDef {
  correctCategory: string;
  options: WordOption[];
}

interface PoemLine {
  text: string; // "И в ___ ночи горит ___ свет"
  blanks: BlankDef[];
}

interface PoemTemplate {
  id: string;
  title: string;
  theme: string;
  lines: PoemLine[];
}

interface PoetryCompositionGameProps {
  onClose: () => void;
}

/* ─── 6 Poem Templates ─── */
const TEMPLATES: PoemTemplate[] = [
  {
    id: 'city_lights',
    title: 'Городские огни',
    theme: 'город',
    lines: [
      {
        text: 'И в ___ ночи горит ___ свет',
        blanks: [
          {
            correctCategory: 'adjective_dark',
            options: [
              { word: 'холодной', quality: 1 },
              { word: 'бессонной', quality: 2 },
              { word: 'неоновой', quality: 3 },
            ],
          },
          {
            correctCategory: 'noun_light',
            options: [
              { word: 'тусклый', quality: 1 },
              { word: 'мерцающий', quality: 2 },
              { word: 'пульсирующий', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Провода ___ как вены города',
        blanks: [
          {
            correctCategory: 'verb_pulsing',
            options: [
              { word: 'гудят', quality: 1 },
              { word: 'дрожат', quality: 2 },
              { word: 'пульсируют', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'А я иду сквозь ___ туман',
        blanks: [
          {
            correctCategory: 'adjective_urban',
            options: [
              { word: 'серый', quality: 1 },
              { word: 'цифровой', quality: 2 },
              { word: 'электрический', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'lonely_coder',
    title: 'Одинокий кодер',
    theme: 'одиночество',
    lines: [
      {
        text: 'Монитор — мой ___ спутник',
        blanks: [
          {
            correctCategory: 'adjective_companion',
            options: [
              { word: 'верный', quality: 1 },
              { word: 'молчаливый', quality: 2 },
              { word: 'единственный', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Строки кода — как ___ мысли',
        blanks: [
          {
            correctCategory: 'adjective_thoughts',
            options: [
              { word: 'чужие', quality: 1 },
              { word: 'потерянные', quality: 2 },
              { word: 'ошмётки', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'А в ___ комнате лишь шум кулера',
        blanks: [
          {
            correctCategory: 'adjective_room',
            options: [
              { word: 'пустой', quality: 1 },
              { word: 'тёмной', quality: 2 },
              { word: 'безжизненной', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'between_lines',
    title: 'Между строк',
    theme: 'надежда',
    lines: [
      {
        text: 'Между строк ___ текста',
        blanks: [
          {
            correctCategory: 'adjective_text',
            options: [
              { word: 'чужого', quality: 1 },
              { word: 'исходного', quality: 2 },
              { word: 'машинного', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Я нахожу ___ смысл',
        blanks: [
          {
            correctCategory: 'adjective_meaning',
            options: [
              { word: 'новый', quality: 1 },
              { word: 'скрытый', quality: 2 },
              { word: 'запретный', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'electric_verse',
    title: 'Электрический стих',
    theme: 'поэзия',
    lines: [
      {
        text: '___ ток бежит по проводам',
        blanks: [
          {
            correctCategory: 'adjective_current',
            options: [
              { word: 'Быстрый', quality: 1 },
              { word: 'Скрытый', quality: 2 },
              { word: 'Поэтический', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'И каждый бит — ___ слово',
        blanks: [
          {
            correctCategory: 'adjective_word',
            options: [
              { word: 'новое', quality: 1 },
              { word: 'живое', quality: 2 },
              { word: 'незаменимое', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'В ___ сети рождаются стихи',
        blanks: [
          {
            correctCategory: 'adjective_network',
            options: [
              { word: 'глобальной', quality: 1 },
              { word: 'нейронной', quality: 2 },
              { word: 'бесконечной', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'light_in_wires',
    title: 'Свет в проводах',
    theme: 'свет',
    lines: [
      {
        text: 'В ___ проводах горит надежда',
        blanks: [
          {
            correctCategory: 'adjective_wires',
            options: [
              { word: 'старых', quality: 1 },
              { word: 'оптоволоконных', quality: 2 },
              { word: 'оборванных', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Как ___ искра среди тьмы',
        blanks: [
          {
            correctCategory: 'noun_spark',
            options: [
              { word: 'маленькая', quality: 1 },
              { word: 'последняя', quality: 2 },
              { word: 'незримая', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
  {
    id: 'digital_soul',
    title: 'Цифровая душа',
    theme: 'душа',
    lines: [
      {
        text: 'Моя душа — ___ файл',
        blanks: [
          {
            correctCategory: 'adjective_file',
            options: [
              { word: 'скрытый', quality: 1 },
              { word: 'зашифрованный', quality: 2 },
              { word: 'повреждённый', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'В ___ папке мироздания',
        blanks: [
          {
            correctCategory: 'adjective_folder',
            options: [
              { word: 'большой', quality: 1 },
              { word: 'корневой', quality: 2 },
              { word: 'заброшенной', quality: 3 },
            ],
          },
        ],
      },
      {
        text: 'Ищу ___ среди нулей',
        blanks: [
          {
            correctCategory: 'noun_meaning',
            options: [
              { word: 'смысл', quality: 1 },
              { word: 'ответ', quality: 2 },
              { word: 'себя', quality: 3 },
            ],
          },
        ],
      },
    ],
  },
];

/* ─── Quality labels ─── */
function getQualityRating(totalScore: number): { label: string; color: string } {
  if (totalScore >= 24) return { label: 'Мастер слова', color: `rgba(${ACCENT_RGB}, 1)` };
  if (totalScore >= 18) return { label: 'Поэт', color: '#ffcc00' };
  return { label: 'Новичок', color: '#6a8a9a' };
}

/* ─── Parse template line into renderable segments ─── */
interface TextSegment {
  type: 'text' | 'blank';
  content: string; // text content or blank id
  blankIndex?: number; // index in the flat blanks array
}

function parseLine(text: string, blankStartIndex: number): { segments: TextSegment[]; blankCount: number } {
  const segments: TextSegment[] = [];
  let blankCount = 0;
  let remaining = text;
  let currentBlankIndex = blankStartIndex;

  while (remaining.length > 0) {
    const blankPos = remaining.indexOf('___');
    if (blankPos === -1) {
      segments.push({ type: 'text', content: remaining });
      break;
    }

    if (blankPos > 0) {
      segments.push({ type: 'text', content: remaining.substring(0, blankPos) });
    }

    segments.push({ type: 'blank', content: `blank-${currentBlankIndex}`, blankIndex: currentBlankIndex });
    currentBlankIndex++;
    blankCount++;

    remaining = remaining.substring(blankPos + 3);
  }

  return { segments, blankCount };
}

/* ─── Shuffled array utility ─── */
function shuffleArray<T>(arr: T[]): T[] {
  const shuffled = [...arr];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/* ─── Main Component ─── */
export function PoetryCompositionGame({ onClose }: PoetryCompositionGameProps) {
  const TOTAL_ROUNDS = 3;

  // Pick 3 random templates
  const [selectedTemplates] = useState<PoemTemplate[]>(() => {
    const shuffled = shuffleArray(TEMPLATES);
    return shuffled.slice(0, TOTAL_ROUNDS);
  });

  const [round, setRound] = useState(0); // 0-indexed
  const [score, setScore] = useState(0);
  const [roundScores, setRoundScores] = useState<number[]>([]);
  const [gameState, setGameState] = useState<'playing' | 'results'>('playing');

  // Current template
  const template = selectedTemplates[round];

  // Build flat blanks array for the current template
  const blanks = useMemo(() => {
    const result: BlankDef[] = [];
    for (const line of template.lines) {
      for (const blank of line.blanks) {
        result.push(blank);
      }
    }
    return result;
  }, [template]);

  // Build all word options (shuffled) for the current template
  const allWordOptions = useMemo(() => {
    const options: (WordOption & { blankIndex: number })[] = [];
    blanks.forEach((blank, idx) => {
      blank.options.forEach((opt) => {
        options.push({ ...opt, blankIndex: idx });
      });
    });
    return shuffleArray(options);
  }, [blanks]);

  // State: which blank is currently selected for input
  const [selectedBlank, setSelectedBlank] = useState<number | null>(null);

  // State: filled blanks — map from blank index to chosen word
  const [filledBlanks, setFilledBlanks] = useState<Map<number, WordOption>>(new Map());

  // Track which word options have been used
  const usedWords = useMemo(() => {
    const used = new Set<string>();
    filledBlanks.forEach((opt) => used.add(opt.word));
    return used;
  }, [filledBlanks]);

  // Parse all lines into segments
  const parsedLines = useMemo(() => {
    const result: { segments: TextSegment[] }[] = [];
    let blankCounter = 0;
    for (const line of template.lines) {
      const { segments, blankCount } = parseLine(line.text, blankCounter);
      result.push({ segments });
      blankCounter += blankCount;
    }
    return result;
  }, [template]);

  // Check if all blanks are filled
  const allBlanksFilled = useMemo(() => {
    return blanks.every((_, idx) => filledBlanks.has(idx));
  }, [blanks, filledBlanks]);

  // Handle clicking a blank
  const handleBlankClick = useCallback((blankIndex: number) => {
    if (filledBlanks.has(blankIndex)) {
      // Clear the blank
      setFilledBlanks((prev) => {
        const next = new Map(prev);
        next.delete(blankIndex);
        return next;
      });
    } else {
      setSelectedBlank(blankIndex);
    }
  }, [filledBlanks]);

  // Handle clicking a word from the bank
  const handleWordClick = useCallback((word: WordOption, blankIndex: number) => {
    if (usedWords.has(word.word)) return; // already used

    // If no blank is selected, and there's a first empty blank, auto-select it
    let targetBlank = selectedBlank;
    if (targetBlank === null) {
      const firstEmpty = blanks.findIndex((_, idx) => !filledBlanks.has(idx));
      if (firstEmpty !== -1) {
        targetBlank = firstEmpty;
      } else {
        return;
      }
    }

    // If the selected blank is already filled, find next empty
    if (filledBlanks.has(targetBlank)) {
      const nextEmpty = blanks.findIndex((_, idx) => !filledBlanks.has(idx) && idx !== targetBlank);
      if (nextEmpty !== -1) {
        targetBlank = nextEmpty;
      } else {
        return;
      }
    }

    setFilledBlanks((prev) => {
      const next = new Map(prev);
      next.set(targetBlank!, word);
      return next;
    });

    // Auto-advance to next empty blank
    const nextEmpty = blanks.findIndex((_, idx) => !filledBlanks.has(idx) && idx !== targetBlank);
    setSelectedBlank(nextEmpty !== -1 ? nextEmpty : null);
  }, [selectedBlank, blanks, filledBlanks, usedWords]);

  // Calculate round score
  const calculateRoundScore = useCallback(() => {
    let roundScore = 0;
    filledBlanks.forEach((opt) => {
      roundScore += opt.quality;
    });
    return roundScore;
  }, [filledBlanks]);

  // Handle "Завершить раунд" button
  const handleFinishRound = useCallback(() => {
    const roundScore = calculateRoundScore();
    setScore((prev) => prev + roundScore);
    setRoundScores((prev) => [...prev, roundScore]);

    if (round + 1 >= TOTAL_ROUNDS) {
      setGameState('results');
    } else {
      // Advance to next round
      setRound((prev) => prev + 1);
      setSelectedBlank(null);
      setFilledBlanks(new Map());
    }
  }, [round, calculateRoundScore]);

  // Handle game completion — apply rewards
  const handleClaimRewards = useCallback(() => {
    const totalScore = score;
    const store = useGameStore.getState();

    // XP reward: score * 2 (5-15 range)
    const xpReward = Math.min(15, Math.max(5, totalScore));
    store.addXp(xpReward);

    // Karma bonus: 2-8 based on quality
    const karmaReward = Math.min(8, Math.max(2, Math.floor(totalScore / 3)));
    store.addKarma(karmaReward);

    // Writing skill +1 for completing all 3 rounds
    store.addSkill('writing', 1);

    // Set completion flag
    store.setFlag('poetry_composition_complete', true);

    eventBus.emit('minigame:complete', {
      gameType: 'poetry',
      success: true,
      reward: [
        { type: 'addKarma', value: karmaReward },
      ],
    });

    onClose();
  }, [score, onClose]);

  // ESC to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  /* ─── Render ─── */
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
      />

      {/* Game panel */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(5, 8, 15, 0.97), rgba(15, 10, 25, 0.97))',
          borderColor: `rgba(${ACCENT_RGB}, 0.25)`,
          boxShadow: `0 0 30px rgba(${ACCENT_RGB}, 0.08), inset 0 0 30px rgba(${ACCENT_RGB}, 0.02)`,
        }}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderBottom: `1px solid rgba(${ACCENT_RGB}, 0.15)`,
            background: `rgba(${ACCENT_RGB}, 0.03)`,
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: ACCENT_COLOR, fontSize: '18px' }}>✨</span>
            <h2
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: ACCENT_COLOR, fontFamily: 'monospace' }}
            >
              ПОЭТИЧЕСКИЙ ТРАНС
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Round counter */}
            <span
              className="text-xs font-mono"
              style={{ color: `rgba(${ACCENT_RGB}, 0.6)` }}
            >
              {round + 1}/{TOTAL_ROUNDS}
            </span>
            {/* Score */}
            <div className="flex items-center gap-1">
              <span className="text-xs font-mono" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                Очки:
              </span>
              <motion.span
                key={score}
                initial={{ scale: 1.3, color: ACCENT_COLOR }}
                animate={{ scale: 1, color: `rgba(${ACCENT_RGB}, 0.9)` }}
                transition={{ duration: 0.3 }}
                className="text-sm font-bold font-mono"
                style={{ color: ACCENT_COLOR }}
              >
                {score}
              </motion.span>
            </div>
            <button
              onClick={onClose}
              className="text-slate-500 hover:text-slate-300 transition-colors text-lg font-mono"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background: `repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(${ACCENT_RGB}, 0.015) 2px, rgba(${ACCENT_RGB}, 0.015) 4px)`,
          }}
        />

        <div className="relative z-10 p-5 max-h-[75vh] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">
            {gameState === 'playing' ? (
              <motion.div
                key={`round-${round}`}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.3 }}
              >
                {/* Template title and theme */}
                <div className="text-center mb-4">
                  <h3
                    className="text-lg font-bold font-mono tracking-wide"
                    style={{ color: ACCENT_COLOR }}
                  >
                    {template.title}
                  </h3>
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em]"
                    style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
                  >
                    тема: {template.theme}
                  </span>
                </div>

                {/* Poem lines */}
                <div
                  className="rounded-md p-4 mb-4 space-y-3"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
                  }}
                >
                  {parsedLines.map((lineData, lineIdx) => (
                    <p
                      key={`line-${lineIdx}`}
                      className="font-mono text-sm leading-relaxed text-center"
                      style={{ color: 'rgba(200, 200, 220, 0.85)' }}
                    >
                      {lineData.segments.map((seg, segIdx) => {
                        if (seg.type === 'text') {
                          return (
                            <span key={`seg-${lineIdx}-${segIdx}`}>{seg.content}</span>
                          );
                        }

                        // Blank segment
                        const blankIdx = seg.blankIndex!;
                        const isFilled = filledBlanks.has(blankIdx);
                        const isSelected = selectedBlank === blankIdx;
                        const filledWord = filledBlanks.get(blankIdx);

                        return (
                          <motion.span
                            key={`blank-${blankIdx}`}
                            onClick={() => handleBlankClick(blankIdx)}
                            className="inline-block cursor-pointer mx-0.5 transition-all duration-200"
                            style={{
                              borderBottom: isFilled
                                ? `2px solid rgba(${ACCENT_RGB}, 0.5)`
                                : isSelected
                                  ? `2px solid rgba(${ACCENT_RGB}, 0.8)`
                                  : `2px solid rgba(${ACCENT_RGB}, 0.2)`,
                              padding: '1px 6px',
                              background: isFilled
                                ? `rgba(${ACCENT_RGB}, 0.12)`
                                : isSelected
                                  ? `rgba(${ACCENT_RGB}, 0.08)`
                                  : `rgba(${ACCENT_RGB}, 0.02)`,
                              boxShadow: isSelected
                                ? `0 0 12px rgba(${ACCENT_RGB}, 0.2)`
                                : 'none',
                              borderRadius: '3px',
                              color: isFilled
                                ? ACCENT_COLOR
                                : `rgba(${ACCENT_RGB}, 0.3)`,
                              minWidth: '60px',
                              textAlign: 'center' as const,
                            }}
                            whileHover={{ scale: 1.02 }}
                            animate={
                              isSelected
                                ? { boxShadow: [`0 0 8px rgba(${ACCENT_RGB}, 0.15)`, `0 0 16px rgba(${ACCENT_RGB}, 0.3)`, `0 0 8px rgba(${ACCENT_RGB}, 0.15)`] }
                                : {}
                            }
                            transition={isSelected ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' } : {}}
                          >
                            {isFilled ? filledWord!.word : '___'}
                          </motion.span>
                        );
                      })}
                    </p>
                  ))}
                </div>

                {/* Word bank */}
                <div className="mb-4">
                  <span
                    className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
                    style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
                  >
                    Слово: банк
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {allWordOptions.map((opt, idx) => {
                      const isUsed = usedWords.has(opt.word);
                      return (
                        <motion.button
                          key={`word-${idx}`}
                          onClick={() => handleWordClick(opt, opt.blankIndex)}
                          disabled={isUsed}
                          className="px-3 py-1.5 rounded-md font-mono text-xs transition-all duration-150"
                          style={{
                            background: isUsed
                              ? 'rgba(0, 0, 0, 0.2)'
                              : `rgba(${ACCENT_RGB}, 0.06)`,
                            border: isUsed
                              ? '1px solid rgba(100, 116, 139, 0.1)'
                              : `1px solid rgba(${ACCENT_RGB}, 0.2)`,
                            color: isUsed
                              ? 'rgba(100, 116, 139, 0.25)'
                              : `rgba(${ACCENT_RGB}, 0.85)`,
                            cursor: isUsed ? 'default' : 'pointer',
                            textDecoration: isUsed ? 'line-through' : 'none',
                          }}
                          whileHover={!isUsed ? { scale: 1.05 } : {}}
                          whileTap={!isUsed ? { scale: 0.95 } : {}}
                          onMouseEnter={(e) => {
                            if (!isUsed) {
                              e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
                              e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.5)`;
                              e.currentTarget.style.boxShadow = `0 0 12px rgba(${ACCENT_RGB}, 0.15)`;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isUsed) {
                              e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.06)`;
                              e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.2)`;
                              e.currentTarget.style.boxShadow = 'none';
                            }
                          }}
                        >
                          {opt.word}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Instruction text */}
                <p className="text-[10px] font-mono mb-3" style={{ color: 'rgba(148, 163, 184, 0.4)' }}>
                  {selectedBlank !== null
                    ? 'Выберите слово из банка для заполнения пропуска'
                    : 'Нажмите на пропуск, затем выберите слово'}
                </p>

                {/* Complete round button */}
                <AnimatePresence>
                  {allBlanksFilled && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      transition={{ duration: 0.2 }}
                      onClick={handleFinishRound}
                      className="w-full py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
                      style={{
                        background: `rgba(${ACCENT_RGB}, 0.15)`,
                        border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
                        color: ACCENT_COLOR,
                        boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
                        e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.7)`;
                        e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
                        e.currentTarget.style.borderColor = `rgba(${ACCENT_RGB}, 0.4)`;
                        e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
                      }}
                    >
                      {round + 1 < TOTAL_ROUNDS ? 'Следующий раунд →' : 'Завершить'}
                    </motion.button>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              /* ─── Results screen ─── */
              <motion.div
                key="results"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
                className="text-center py-4"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                  className="text-3xl mb-3"
                >
                  ✨
                </motion.div>

                <h3
                  className="text-lg font-bold font-mono tracking-widest uppercase mb-2"
                  style={{ color: ACCENT_COLOR }}
                >
                  Стихотворение завершено
                </h3>

                {/* Total score */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="mb-4"
                >
                  <span className="text-xs font-mono block" style={{ color: 'rgba(148, 163, 184, 0.5)' }}>
                    Итого очков
                  </span>
                  <motion.span
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
                    className="text-3xl font-bold font-mono"
                    style={{ color: ACCENT_COLOR, textShadow: `0 0 20px rgba(${ACCENT_RGB}, 0.4)` }}
                  >
                    {score}
                  </motion.span>
                </motion.div>

                {/* Quality rating */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="mb-4"
                >
                  {(() => {
                    const rating = getQualityRating(score);
                    return (
                      <span
                        className="px-3 py-1 rounded-full font-mono text-xs font-bold tracking-wider uppercase"
                        style={{
                          background: `rgba(${ACCENT_RGB}, 0.1)`,
                          border: `1px solid rgba(${ACCENT_RGB}, 0.3)`,
                          color: rating.color,
                        }}
                      >
                        {rating.label}
                      </span>
                    );
                  })()}
                </motion.div>

                {/* Round breakdown */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-4 space-y-1"
                >
                  {roundScores.map((rs, idx) => (
                    <div
                      key={`round-score-${idx}`}
                      className="flex items-center justify-center gap-2 text-xs font-mono"
                      style={{ color: 'rgba(148, 163, 184, 0.5)' }}
                    >
                      <span>Раунд {idx + 1}</span>
                      <span style={{ color: ACCENT_COLOR }}>{rs}</span>
                      <span>очков</span>
                    </div>
                  ))}
                </motion.div>

                {/* Rewards */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                  className="rounded-md p-3 mb-4"
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    border: `1px solid rgba(${ACCENT_RGB}, 0.1)`,
                  }}
                >
                  <span
                    className="block text-[10px] font-mono uppercase tracking-[0.15em] mb-2"
                    style={{ color: `rgba(${ACCENT_RGB}, 0.4)` }}
                  >
                    Награды
                  </span>
                  <div className="flex items-center justify-center gap-4 text-xs font-mono">
                    <span style={{ color: '#00ffee' }}>
                      +{Math.min(15, Math.max(5, score))} XP
                    </span>
                    <span style={{ color: '#ffcc00' }}>
                      +{Math.min(8, Math.max(2, Math.floor(score / 3)))} карма
                    </span>
                    <span style={{ color: ACCENT_COLOR }}>
                      +1 письмо
                    </span>
                  </div>
                </motion.div>

                {/* Claim button */}
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7 }}
                  onClick={handleClaimRewards}
                  className="px-6 py-2.5 rounded-md font-mono text-xs tracking-[0.15em] uppercase font-bold transition-all duration-200"
                  style={{
                    background: `rgba(${ACCENT_RGB}, 0.15)`,
                    border: `1px solid rgba(${ACCENT_RGB}, 0.4)`,
                    color: ACCENT_COLOR,
                    boxShadow: `0 0 15px rgba(${ACCENT_RGB}, 0.1)`,
                  }}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.25)`;
                    e.currentTarget.style.boxShadow = `0 0 25px rgba(${ACCENT_RGB}, 0.2)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `rgba(${ACCENT_RGB}, 0.15)`;
                    e.currentTarget.style.boxShadow = `0 0 15px rgba(${ACCENT_RGB}, 0.1)`;
                  }}
                >
                  Забрать награды
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div
          className="px-5 py-2 border-t flex items-center justify-center"
          style={{ borderColor: `rgba(${ACCENT_RGB}, 0.1)` }}
        >
          <div className="flex items-center gap-1.5">
            <kbd
              className="inline-flex items-center justify-center px-1.5 h-5 rounded border font-mono text-[10px]"
              style={{
                background: 'rgba(15, 23, 42, 0.6)',
                borderColor: 'rgba(100, 116, 139, 0.25)',
                color: 'rgba(148, 163, 184, 0.5)',
              }}
            >
              Esc
            </kbd>
            <span className="font-mono text-[10px] text-slate-500/40 tracking-wide">
              выйти
            </span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
