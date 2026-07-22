
/* ─── Volodka RPG – Bash Terminal mini-game ─── */

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';

/* ─── Types ─── */

type GamePhase = 'investigate' | 'trace' | 'recover';
type GameStatus = 'playing' | 'won' | 'lost';

interface TerminalLine {
  text: string;
  type: 'command' | 'output' | 'error' | 'narrative' | 'system';
}

interface PhaseConfig {
  id: GamePhase;
  title: string;
  prompt: string;
  options: CommandOption[];
}

interface CommandOption {
  command: string;
  correct: boolean;
  output?: string[];
  errorOutput?: string[];
}

/* ─── Phase Data ─── */

const PHASES: PhaseConfig[] = [
  {
    id: 'investigate',
    title: 'ФАЗА 1: РАССЛЕДОВАНИЕ',
    prompt: 'Банковская система упала. Узнай, что произошло.',
    options: [
      {
        command: 'ls -la /var/log/bank/',
        correct: true,
        output: [
          'drwxr-x---  3 bankd bankd  4096 Mar  5 02:14 .',
          'drwxr-xr-x 10 root  root   4096 Feb 28 11:30 ..',
          '-rw-r-----  1 bankd bankd  284K Mar  5 02:14 transactions.log',
          '-rw-r-----  1 bankd bankd  512K Mar  5 02:13 crash.log',
          '-rw-------  1 bankd bankd  1.2K Mar  5 02:13 .shadow_trace',
          '',
          '► Обнаружены подозрительные файлы логов. Продолжай расследование.',
        ],
      },
      {
        command: 'ps aux | grep banking',
        correct: false,
        errorOutput: [
          'bankd    4102  0.0  0.0      0     0 ?        Z    02:13   0:00 [bankd] <defunct>',
          'volodka  4210  0.0  0.0  14228  1080 pts/0    S+   02:15   0:00 grep banking',
          '',
          'bash: процесс bankd — зомби. Нужен другой подход.',
        ],
      },
      {
        command: 'netstat -tulpn | grep 443',
        correct: false,
        errorOutput: [
          '(No info could be read for "-p": geteuid()=1000 but you need root.)',
          '',
          'bash: порт 443 не прослушивается. Сервис упал.',
        ],
      },
    ],
  },
  {
    id: 'trace',
    title: 'ФАЗА 2: ОТСЛЕЖИВАНИЕ',
    prompt: 'Найди источник атаки в логах транзакций.',
    options: [
      {
        command: 'grep -i "error" transactions.log',
        correct: true,
        output: [
          '02:11:03 ERROR SQL syntax violation from 185.22.xx.xx',
          '02:11:47 ERROR Auth bypass attempt from 185.22.xx.xx',
          '02:12:15 ERROR Buffer overflow in tx_handler pid=4102',
          '02:13:01 FATAL Segfault — core dumped to /var/log/bank/crash.log',
          '',
          '► Атака с IP 185.22.xx.xx. SQL-инъекция → переполнение буфера → крушение.',
        ],
      },
      {
        command: 'df -h',
        correct: false,
        errorOutput: [
          'Filesystem      Size  Used Avail Use% Mounted on',
          '/dev/sda1       120G   48G   72G  40% /',
          'tmpfs           3.9G  284M  3.6G   8% /tmp',
          '',
          'bash: диск не переполнен. Проблема не в месте.',
        ],
      },
      {
        command: 'tail -n 50 crash.log',
        correct: false,
        errorOutput: [
          'Signal 11 (SIGSEGV) received by pid 4102',
          'Registers: RIP=0x7f3a2c1b8d40 RSP=0x7ffe4c2a1e00',
          'Backtrace: tx_handler() → parse_sql() → ??()',
          '[50 lines truncated...]',
          '',
          'bash: стек-трейс не показывает источник. Нужны логи транзакций.',
        ],
      },
    ],
  },
  {
    id: 'recover',
    title: 'ФАЗА 3: ВОССТАНОВЛЕНИЕ',
    prompt: 'Перезапусти банковский демон и верни систему в строй.',
    options: [
      {
        command: 'systemctl restart bankd',
        correct: true,
        output: [
          'Stopping bankd (zombie)... [  OK  ]',
          'Starting bankd...',
          'Loading transaction database... [  OK  ]',
          'Binding to 0.0.0.0:443... [  OK  ]',
          'Integrity check... PASSED (last clean state: 02:10:44)',
          '',
          '● bankd.service — Banking Daemon',
          '   Active: active (running) since 2025-03-05 02:16:22 UTC',
          '   Main PID: 5501',
          '',
          '► СИСТЕМА ВОССТАНОВЛЕНА. Банковский демон работает.',
        ],
      },
      {
        command: 'journalctl -u bankd --since "1 hour ago"',
        correct: false,
        errorOutput: [
          '-- Logs begin at 2025-03-05 01:15:00 --',
          'Mar 05 02:11 bankd[4102]: ERROR SQL syntax violation',
          'Mar 05 02:13 bankd[4102]: FATAL Segfault',
          'Mar 05 02:13 systemd[1]: bankd.service: Failed with result \'signal\'.',
          '',
          'bash: логи не перезапустят сервис. Нужна команда восстановления.',
        ],
      },
      {
        command: 'systemctl status bankd',
        correct: false,
        errorOutput: [
          '● bankd.service — Banking Daemon',
          '   Loaded: loaded (/etc/systemd/system/bankd.service)',
          '   Active: failed (Result: signal)',
          '   Main PID: 4102 (code=killed, signal=SEGV)',
          '',
          'bash: статус не исправит проблему. Перезапусти сервис!',
        ],
      },
    ],
  },
];

/* ─── Constants ─── */

const TIME_LIMIT = 45; // seconds
const PROMPT_PREFIX = 'volodka@bank-srv:~$ ';

/* ─── Component ─── */

interface BashTerminalGameProps {
  onClose: () => void;
}

export function BashTerminalGame({ onClose }: BashTerminalGameProps) {
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState(0);
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>(() => [
    { text: '╔══════════════════════════════════════════════════════╗', type: 'system' },
    { text: '║   БАНКОВСКАЯ СИСТЕМА — КРИТИЧЕСКИЙ СБОЙ            ║', type: 'system' },
    { text: '║   СЕРВЕР: bank-srv.nevalenka.bank                   ║', type: 'system' },
    { text: '║   СТАТУС: OFFLINE                                   ║', type: 'error' },
    { text: '╚══════════════════════════════════════════════════════╝', type: 'system' },
    { text: '', type: 'output' },
    { text: 'Соединение с сервером установлено. Терминал активен.', type: 'narrative' },
    { text: `Время: ${TIME_LIMIT} сек. Выбери правильные команды для расследования.`, type: 'narrative' },
    { text: '', type: 'output' },
  ]);

  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPhase = PHASES[currentPhaseIndex];

  /* ─── Scroll to bottom ─── */
  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLines]);

  /* ─── Completed flag (avoids stale closure in timer) ─── */
  const completedRef = useRef(false);

  /* ─── Handle game over ─── */
  const handleGameOver = useCallback(
    (success: boolean) => {
      if (completedRef.current) return;
      completedRef.current = true;

      setGameStatus(success ? 'won' : 'lost');

      if (success) {
        useGameStore.getState().addSkill('coding', 4);
        useGameStore.getState().addSkill('logic', 2);
        useGameStore.getState().addKarma(5);
        useGameStore.getState().setFlag('bash_terminal_solved', true);
        eventBus.emit('minigame:complete', {
          gameType: 'bash_terminal',
          success: true,
          reward: [
            { type: 'addSkill' as const, skill: 'coding' as const, value: 4 },
            { type: 'addSkill' as const, skill: 'logic' as const, value: 2 },
            { type: 'addKarma' as const, value: 5 },
          ],
        });
      } else {
        useGameStore.getState().addStress(5);
        useGameStore.getState().setFlag('bash_terminal_failed', true);
        eventBus.emit('minigame:complete', {
          gameType: 'bash_terminal',
          success: false,
        });
      }

      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  /* ─── Timer ─── */
  useEffect(() => {
    if (gameStatus !== 'playing') return;

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          handleGameOver(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [gameStatus, handleGameOver]);



  /* ─── Execute command ─── */
  const executeCommand = useCallback(
    (optionIndex: number) => {
      if (gameStatus !== 'playing' || isProcessing) return;

      const phase = PHASES[currentPhaseIndex];
      const option = phase.options[optionIndex];

      setIsProcessing(true);
      setSelectedOption(optionIndex);

      // Add the command line
      const newLines: TerminalLine[] = [
        ...terminalLines,
        { text: `${PROMPT_PREFIX}${option.command}`, type: 'command' },
      ];

      // Add output with a small delay simulation
      const outputLines = option.correct ? (option.output ?? []) : (option.errorOutput ?? []);
      const typedLines: TerminalLine[] = outputLines.map((line) => ({
        text: line,
        type: option.correct ? 'output' : 'error',
      }));

      // Add narrative line for correct answer
      if (option.correct) {
        const narrativeLine = currentPhaseIndex < PHASES.length - 1
          ? { text: '', type: 'output' as const }
          : { text: '', type: 'output' as const };
        typedLines.push(narrativeLine);
      }

      const allNewLines = [...newLines, ...typedLines];
      setTerminalLines(allNewLines);

      // Process result after showing output
      setTimeout(() => {
        if (option.correct) {
          if (currentPhaseIndex < PHASES.length - 1) {
            // Advance to next phase
            const nextPhaseIdx = currentPhaseIndex + 1;
            const nextPhase = PHASES[nextPhaseIdx];
            setTerminalLines((prev) => [
              ...prev,
              { text: `─── ${nextPhase.title} ───`, type: 'system' },
              { text: nextPhase.prompt, type: 'narrative' },
              { text: '', type: 'output' },
            ]);
            setCurrentPhaseIndex(nextPhaseIdx);
          } else {
            // Won the game!
            setTerminalLines((prev) => [
              ...prev,
              { text: '', type: 'output' },
              { text: '╔══════════════════════════════════════════════════════╗', type: 'system' },
              { text: '║   СИСТЕМА ВОССТАНОВЛЕНА — ЗАДАНИЕ ВЫПОЛНЕНО        ║', type: 'system' },
              { text: '╚══════════════════════════════════════════════════════╝', type: 'system' },
            ]);
            handleGameOver(true);
          }
        } else {
          // Wrong command — add hint
          setTerminalLines((prev) => [
            ...prev,
            { text: '  ⚠ Неправильная команда. Попробуй другую.', type: 'error' },
            { text: '', type: 'output' },
          ]);
        }

        setSelectedOption(null);
        setIsProcessing(false);
      }, 600);
    },
    [gameStatus, isProcessing, currentPhaseIndex, terminalLines, handleGameOver],
  );

  /* ─── Keyboard support ─── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (gameStatus !== 'playing' || isProcessing) return;

      if (e.key === '1') executeCommand(0);
      else if (e.key === '2') executeCommand(1);
      else if (e.key === '3') executeCommand(2);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStatus, isProcessing, executeCommand, onClose]);

  /* ─── Auto-close after win/loss ─── */
  useEffect(() => {
    if (gameStatus === 'won' || gameStatus === 'lost') {
      const timeout = setTimeout(onClose, 3500);
      return () => clearTimeout(timeout);
    }
  }, [gameStatus, onClose]);

  /* ─── Timer bar color ─── */
  const timerColor =
    timeLeft > 30 ? '#00ff41' : timeLeft > 15 ? '#ffcc00' : '#ff4444';
  const timerPercent = (timeLeft / TIME_LIMIT) * 100;

  return (
    <AnimatePresence mode="wait">
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
        className="absolute inset-0 bg-black/85 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Terminal panel */}
      <div
        className="relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 8, 2, 0.98), rgba(2, 12, 4, 0.98))',
          borderColor: 'rgba(0, 255, 65, 0.3)',
          boxShadow: '0 0 40px rgba(0, 255, 65, 0.08), inset 0 0 40px rgba(0, 255, 65, 0.02)',
        }}
      >
        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,65,0.02) 2px, rgba(0,255,65,0.02) 4px)',
          }}
        />

        {/* CRT flicker */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            animation: 'crtFlicker 0.15s infinite alternate',
            background: 'transparent',
          }}
        />

        {/* Header bar */}
        <div
          className="px-4 py-2.5 flex items-center justify-between"
          style={{
            borderBottom: '1px solid rgba(0, 255, 65, 0.2)',
            background: 'rgba(0, 255, 65, 0.04)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: '#00ff41', fontSize: '14px' }}>&#9608;</span>
            <h2
              className="text-xs font-bold tracking-widest uppercase"
              style={{ color: '#00ff41', fontFamily: 'monospace' }}
            >
              BASH TERMINAL
            </h2>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <div
              className="w-20 h-1.5 rounded-full overflow-hidden"
              style={{ background: 'rgba(0, 255, 65, 0.1)' }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: timerColor }}
                animate={{ width: `${timerPercent}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <span
              className="text-xs font-mono font-bold"
              style={{ color: timerColor, minWidth: '2ch', textAlign: 'right' }}
            >
              {timeLeft}
            </span>
            <button
              onClick={onClose}
              className="text-slate-600 hover:text-slate-300 transition-colors text-sm font-mono ml-1"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Phase indicator */}
        <div
          className="px-4 py-1.5 flex items-center gap-2"
          style={{
            borderBottom: '1px solid rgba(0, 255, 65, 0.1)',
            background: 'rgba(0, 255, 65, 0.02)',
          }}
        >
          {PHASES.map((phase, idx) => (
            <div key={phase.id} className="flex items-center gap-1.5">
              <div
                className="w-2 h-2 rounded-full transition-all duration-300"
                style={{
                  background:
                    idx < currentPhaseIndex
                      ? '#00ff41'
                      : idx === currentPhaseIndex && gameStatus === 'playing'
                        ? 'rgba(0, 255, 65, 0.8)'
                        : 'rgba(0, 255, 65, 0.15)',
                  boxShadow:
                    idx === currentPhaseIndex && gameStatus === 'playing'
                      ? '0 0 6px rgba(0, 255, 65, 0.5)'
                      : 'none',
                }}
              />
              <span
                className="text-[10px] font-mono uppercase tracking-wider"
                style={{
                  color:
                    idx < currentPhaseIndex
                      ? '#00ff41'
                      : idx === currentPhaseIndex && gameStatus === 'playing'
                        ? 'rgba(0, 255, 65, 0.8)'
                        : 'rgba(0, 255, 65, 0.25)',
                }}
              >
                {phase.id === 'investigate' ? 'РАССЛ.' : phase.id === 'trace' ? 'СЛЕД' : 'ВОССТ.'}
              </span>
              {idx < PHASES.length - 1 && (
                <span style={{ color: 'rgba(0, 255, 65, 0.15)' }}>→</span>
              )}
            </div>
          ))}
        </div>

        {/* Terminal output area */}
        <div
          className="px-4 py-3 max-h-64 overflow-y-auto"
          style={{
            fontFamily: 'monospace',
            fontSize: '11px',
            lineHeight: '1.5',
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(0,255,65,0.2) transparent',
          }}
        >
          <AnimatePresence>
            {terminalLines.map((line, i) => (
              <motion.div
                key={`line-${i}`}
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.1 }}
                style={{
                  color:
                    line.type === 'command'
                      ? '#00ff41'
                      : line.type === 'output'
                        ? '#33aa55'
                        : line.type === 'error'
                          ? '#ff5544'
                          : line.type === 'narrative'
                            ? '#88ddaa'
                            : '#00ff41',
                  fontWeight: line.type === 'system' ? 'bold' : 'normal',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all',
                }}
              >
                {line.text || '\u00A0'}
              </motion.div>
            ))}
          </AnimatePresence>
          <div ref={terminalEndRef} />
        </div>

        {/* Command options */}
        <div
          className="px-4 py-3"
          style={{
            borderTop: '1px solid rgba(0, 255, 65, 0.15)',
            background: 'rgba(0, 255, 65, 0.02)',
          }}
        >
          {gameStatus === 'playing' && (
            <>
              <p
                className="text-[10px] font-mono mb-2"
                style={{ color: 'rgba(0, 255, 65, 0.5)' }}
              >
                {currentPhase.title} — выбери команду:
              </p>
              <div className="space-y-1.5">
                {currentPhase.options.map((option, idx) => {
                  const isSelected = selectedOption === idx;
                  return (
                    <motion.button
                      key={`${currentPhaseIndex}-${idx}`}
                      onClick={() => executeCommand(idx)}
                      disabled={isProcessing}
                      className="w-full text-left px-3 py-2 rounded font-mono text-xs transition-all duration-150 flex items-center gap-2"
                      style={{
                        background: isSelected
                          ? 'rgba(0, 255, 65, 0.12)'
                          : 'rgba(0, 255, 65, 0.04)',
                        border: `1px solid ${isSelected ? 'rgba(0, 255, 65, 0.4)' : 'rgba(0, 255, 65, 0.15)'}`,
                        color: '#00ff41',
                        opacity: isProcessing && !isSelected ? 0.4 : 1,
                        cursor: isProcessing ? 'wait' : 'pointer',
                      }}
                      whileHover={
                        !isProcessing
                          ? {
                              background: 'rgba(0, 255, 65, 0.1)',
                              borderColor: 'rgba(0, 255, 65, 0.35)',
                            }
                          : {}
                      }
                      whileTap={!isProcessing ? { scale: 0.98 } : {}}
                    >
                      <span
                        className="inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold flex-shrink-0"
                        style={{
                          background: 'rgba(0, 255, 65, 0.1)',
                          border: '1px solid rgba(0, 255, 65, 0.3)',
                          color: '#00ff41',
                        }}
                      >
                        {idx + 1}
                      </span>
                      <span className="truncate">{option.command}</span>
                    </motion.button>
                  );
                })}
              </div>
              <p
                className="text-[9px] font-mono mt-2"
                style={{ color: 'rgba(0, 255, 65, 0.3)' }}
              >
                Клавиши: [1] [2] [3] — выбрать · [Esc] — закрыть
              </p>
            </>
          )}

          {/* Win state */}
          {gameStatus === 'won' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-3"
            >
              <p className="text-sm font-bold font-mono" style={{ color: '#00ff41' }}>
                &#9608; СИСТЕМА ВОССТАНОВЛЕНА
              </p>
              <div className="mt-2 space-y-0.5">
                <p className="text-xs font-mono" style={{ color: '#88ddaa' }}>
                  +4 программирование · +2 логика · +5 карма
                </p>
              </div>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: 'rgba(0, 255, 65, 0.15)',
                  border: '1px solid rgba(0, 255, 65, 0.4)',
                  color: '#00ff41',
                }}
              >
                Закрыть
              </button>
            </motion.div>
          )}

          {/* Lose state */}
          {gameStatus === 'lost' && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="text-center py-3"
            >
              <p className="text-sm font-bold font-mono" style={{ color: '#ff5544' }}>
                &#9608; ВРЕМЯ ВЫШЛО — СБОЙ НЕ УСТРАНЁН
              </p>
              <p className="text-xs font-mono mt-1" style={{ color: '#aa6644' }}>
                +5 стресс
              </p>
              <button
                onClick={onClose}
                className="mt-3 px-4 py-1.5 rounded text-xs font-mono transition-all"
                style={{
                  background: 'rgba(255, 85, 68, 0.15)',
                  border: '1px solid rgba(255, 85, 68, 0.3)',
                  color: '#ff5544',
                }}
              >
                Закрыть
              </button>
            </motion.div>
          )}
        </div>

        {/* CSS animations */}
        <style>{`
          @keyframes crtFlicker {
            0% { opacity: 0.97; }
            50% { opacity: 1; }
            100% { opacity: 0.98; }
          }
        `}</style>
      </div>
    </motion.div>
    </AnimatePresence>
  );
}
