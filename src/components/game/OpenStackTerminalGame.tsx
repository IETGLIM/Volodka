
/* ─── Volodka RPG – OpenStack Terminal mini-game ─── */

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { completeMinigame } from '@/engine/minigame/claimMinigameRewards';

/* ─── Types ─── */

type GamePhase = 'alert' | 'diagnose' | 'isolate' | 'repair' | 'success' | 'failure';
type TerminalLine = {
  text: string;
  color: string; // CSS color
  isCommand?: boolean;
};

interface PhaseConfig {
  id: 'diagnose' | 'isolate' | 'repair';
  title: string;
  prompt: string;
  options: Array<{
    command: string;
    isCorrect: boolean;
    successOutput?: string;
    errorOutput?: string;
  }>;
}

/* ─── Phase Definitions ─── */

const PHASES: PhaseConfig[] = [
  {
    id: 'diagnose',
    title: 'ДИАГНОСТИКА',
    prompt: 'Обнаружена критическая ошибка сервера. Запустите команду диагностики:',
    options: [
      {
        command: 'nova list',
        isCorrect: true,
        successOutput:
          '+----+----------+--------+------------+-------------+----------+\n' +
          '| ID | Name     | Status | Task State | Power State | Networks |\n' +
          '+----+----------+--------+------------+-------------+----------+\n' +
          '| 1  | srv-prod | ERROR  | -          | Running     | int-net  |\n' +
          '| 2  | srv-back | ACTIVE | -          | Running     | int-net  |\n' +
          '+----+----------+--------+------------+-------------+----------+\n' +
          '>>> Сервер srv-prod в состоянии ERROR. Требуется проверка.',
        errorOutput: '',
      },
      {
        command: 'glance image-list',
        isCorrect: false,
        errorOutput:
          'ERROR: glance — Образы не помогут диагностировать сбой сервера.\n' +
          '>>> Неверная команда. Нужна диагностика вычислительных ресурсов.',
      },
      {
        command: 'cinder list',
        isCorrect: false,
        errorOutput:
          'ERROR: cinder — Томы данных не связаны с текущим сбоем.\n' +
          '>>> Неверная команда. Проверьте состояние инстансов.',
      },
    ],
  },
  {
    id: 'isolate',
    title: 'ИЗОЛЯЦИЯ',
    prompt: 'Сервер srv-prod в состоянии ERROR. Определите причину сбоя:',
    options: [
      {
        command: 'neutron net-list',
        isCorrect: false,
        errorOutput:
          'ERROR: neutron — Сеть работает исправно. Проблема не в сети.\n' +
          '>>> Неверная команда. Проверьте детали сервера.',
      },
      {
        command: 'openstack server show srv-prod',
        isCorrect: true,
        successOutput:
          '  OS-EXT-SRV-ATTR: hypervisor_hostname  :  kvm-node-03\n' +
          '  fault.message    :  Virtualization driver crash\n' +
          '  fault.code       :  500\n' +
          '  status           :  ERROR\n' +
          '  vm_state         :  error\n' +
          '>>> Причина: краш драйвера виртуализации на kvm-node-03.\n' +
          '>>> Рекомендация: перезагрузка инстанса.',
      },
      {
        command: 'openstack network create',
        isCorrect: false,
        errorOutput:
          'ERROR: Создание сети не решит проблему сервера.\n' +
          '>>> Неверная команда. Нужно определить причину сбоя.',
      },
      {
        command: 'openstack server delete srv-prod',
        isCorrect: false,
        errorOutput:
          'ERROR: Удаление продакшн-сервера?! Вы с ума сошли?!\n' +
          '>>> Неверная команда. Нужно диагностировать, а не уничтожать.',
      },
    ],
  },
  {
    id: 'repair',
    title: 'ВОССТАНОВЛЕНИЕ',
    prompt: 'Причина найдена: краш драйвера виртуализации. Выполните ремонт:',
    options: [
      {
        command: 'nova reboot srv-prod',
        isCorrect: true,
        successOutput:
          'Request to reboot server srv-prod has been accepted.\n' +
          '... ожидание ...\n' +
          '+----+----------+--------+------------+-------------+----------+\n' +
          '| ID | Name     | Status | Task State | Power State | Networks |\n' +
          '+----+----------+--------+------------+-------------+----------+\n' +
          '| 1  | srv-prod | ACTIVE | -          | Running     | int-net  |\n' +
          '| 2  | srv-back | ACTIVE | -          | Running     | int-net  |\n' +
          '+----+----------+--------+------------+-------------+----------+\n' +
          '>>> Сервер srv-prod успешно перезагружен. Статус: ACTIVE.\n' +
          '>>> Кризис предотвращён!',
      },
      {
        command: 'openstack server delete srv-prod',
        isCorrect: false,
        errorOutput:
          'ERROR: Удаление продакшн-сервера — это катастрофа!\n' +
          '>>> Неверная команда. Нужна перезагрузка, не удаление!',
      },
      {
        command: 'openstack network create fallback',
        isCorrect: false,
        errorOutput:
          'ERROR: Создание новой сети не починит краш драйвера.\n' +
          '>>> Неверная команда. Перезагрузите инстанс!',
      },
    ],
  },
];

/* ─── Constants ─── */

const TIME_LIMIT = 60;
const ALERT_DURATION = 2500; // ms to show the alert screen before phase 1

/* ─── Component ─── */

interface OpenStackTerminalGameProps {
  onClose: () => void;
}

export function OpenStackTerminalGame({ onClose }: OpenStackTerminalGameProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const [phase, setPhase] = useState<GamePhase>('alert');
  const [terminalLines, setTerminalLines] = useState<TerminalLine[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIME_LIMIT);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phaseIndex, setPhaseIndex] = useState(0);
  const terminalRef = useRef<HTMLDivElement>(null);
  const completedRef = useRef(false);

  /* ── Add a line to the terminal ── */
  const addTerminalLine = useCallback(
    (text: string, color: string, isCommand = false) => {
      setTerminalLines((prev) => [...prev, { text, color, isCommand }]);
    },
    [],
  );

  /* ── Add multiple lines (split by \n) ── */
  const addTerminalLines = useCallback(
    (text: string, color: string, isCommand = false) => {
      const lines = text.split('\n');
      setTerminalLines((prev) => [
        ...prev,
        ...lines.map((line) => ({ text: line, color, isCommand })),
      ]);
    },
    [],
  );

  /* ── Handle failure ── */
  const handleFailure = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('failure');
    completeMinigame({
      gameType: 'openstack_terminal',
      success: false,
      rewards: [
        { type: 'addStat', stat: 'stress', value: 3 },
        { type: 'setFlag', flag: 'openstack_terminal_failed', flagValue: true },
      ],
    });
  }, []);

  /* ── Handle success ── */
  const handleSuccess = useCallback(() => {
    if (completedRef.current) return;
    completedRef.current = true;
    setPhase('success');
    completeMinigame({
      gameType: 'openstack_terminal',
      success: true,
      rewards: [
        { type: 'addSkill', skill: 'coding', value: 5 },
        { type: 'addKarma', value: 3 },
        { type: 'setFlag', flag: 'openstack_terminal_solved', flagValue: true },
      ],
    });
  }, []);

  /* ── Timer ── */
  useEffect(() => {
    if (phase === 'alert' || phase === 'success' || phase === 'failure') return;
    if (timeLeft <= 0) {
      setTimeout(() => handleFailure(), 0);
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [phase, timeLeft, handleFailure]);

  /* ── Scroll terminal to bottom ── */
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalLines]);

  /* ── Auto-advance from alert to first phase ── */
  useEffect(() => {
    if (phase !== 'alert') return;
    const timer = setTimeout(() => {
      setPhase('diagnose');
      addTerminalLine('root@openstack-controller:~# ', '#44ff88', true);
      addTerminalLine(PHASES[0].prompt, '#88ccaa');
    }, ALERT_DURATION);
    return () => clearTimeout(timer);
  }, [phase, addTerminalLine]);

  /* ── Handle option selection ── */
  const selectOption = useCallback(
    (optionIndex: number) => {
      if (phase !== 'diagnose' && phase !== 'isolate' && phase !== 'repair') return;
      if (isProcessing || selectedOption !== null) return;

      const currentPhase = PHASES[phaseIndex];
      if (!currentPhase) return;
      const option = currentPhase.options[optionIndex];
      if (!option) return;

      setSelectedOption(optionIndex);
      setIsProcessing(true);

      // Show the command being typed
      addTerminalLine(`root@openstack-controller:~# ${option.command}`, '#44ff88', true);

      // Simulate processing delay
      setTimeout(() => {
        if (option.isCorrect) {
          addTerminalLines(option.successOutput ?? '', '#44ff88');
          addTerminalLine('', '#44ff88'); // blank line

          // Advance to next phase or success
          const nextPhaseIdx = phaseIndex + 1;
          if (nextPhaseIdx < PHASES.length) {
            setTimeout(() => {
              setPhaseIndex(nextPhaseIdx);
              setPhase(PHASES[nextPhaseIdx].id);
              addTerminalLine('', '#44ff88');
              addTerminalLine(
                `─── ФАЗА ${nextPhaseIdx + 1}: ${PHASES[nextPhaseIdx].title} ───`,
                '#ffcc00',
              );
              addTerminalLine(PHASES[nextPhaseIdx].prompt, '#88ccaa');
              addTerminalLine('root@openstack-controller:~# ', '#44ff88', true);
              setSelectedOption(null);
              setIsProcessing(false);
            }, 800);
          } else {
            setTimeout(() => {
              handleSuccess();
            }, 800);
          }
        } else {
          addTerminalLines(option.errorOutput ?? '', '#ff4444');
          addTerminalLine('', '#ff4444');
          // Allow retry
          setTimeout(() => {
            addTerminalLine('root@openstack-controller:~# ', '#44ff88', true);
            setSelectedOption(null);
            setIsProcessing(false);
          }, 600);
        }
      }, 700);
    },
    [phase, phaseIndex, isProcessing, selectedOption, addTerminalLine, addTerminalLines, handleSuccess],
  );

  /* ── Keyboard support ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      // Number keys 1-4 to select options
      const num = parseInt(e.key, 10);
      if (num >= 1 && num <= 4) {
        selectOption(num - 1);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectOption]);

  /* ── Time display color ── */
  const timeColor = timeLeft > 30 ? '#44ff88' : timeLeft > 15 ? '#ffcc00' : '#ff4444';

  /* ── Current phase config ── */
  const currentPhaseConfig = PHASES[phaseIndex];

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
        className="relative z-10 w-full max-w-lg mx-4 rounded-lg border overflow-hidden"
        style={{
          background: 'linear-gradient(135deg, rgba(0, 5, 2, 0.98), rgba(0, 12, 6, 0.98))',
          borderColor: 'rgba(68, 255, 136, 0.25)',
          boxShadow: '0 0 30px rgba(68, 255, 136, 0.08), inset 0 0 30px rgba(68, 255, 136, 0.02)',
        }}
        {...dialogProps}
      >
        {/* Header */}
        <div
          className="px-5 py-3 flex items-center justify-between"
          style={{
            borderBottom: '1px solid rgba(68, 255, 136, 0.15)',
            background: 'rgba(68, 255, 136, 0.03)',
          }}
        >
          <div className="flex items-center gap-2">
            <span style={{ color: '#44ff88', fontSize: '18px' }} aria-hidden="true">🖥</span>
            <h2
              {...titleProps}
              className="text-sm font-bold tracking-widest uppercase"
              style={{ color: '#44ff88', fontFamily: 'monospace' }}
            >
              OPENSTACK ТЕРМИНАЛ
            </h2>
          </div>
          <div className="flex items-center gap-3">
            {/* Timer */}
            {(phase === 'diagnose' || phase === 'isolate' || phase === 'repair') && (
              <span
                className="text-sm font-bold font-mono"
                style={{ color: timeColor }}
              >
                ⏱ {timeLeft}с
              </span>
            )}
            {/* Phase indicator */}
            {(phase === 'diagnose' || phase === 'isolate' || phase === 'repair') && (
              <span
                className="text-[10px] font-mono px-2 py-0.5 rounded"
                style={{
                  color: '#ffcc00',
                  background: 'rgba(255, 204, 0, 0.1)',
                  border: '1px solid rgba(255, 204, 0, 0.25)',
                }}
              >
                {phaseIndex + 1}/3
              </span>
            )}
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
        </div>

        {/* Scanlines overlay */}
        <div
          className="absolute inset-0 pointer-events-none z-20"
          style={{
            background:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(68,255,136,0.015) 2px, rgba(68,255,136,0.015) 4px)',
          }}
        />

        <div className="relative z-10">
          {/* Alert screen */}
          <AnimatePresence mode="wait">
            {phase === 'alert' && (
              <motion.div
                key="alert"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                >
                  <div
                    className="text-3xl font-bold font-mono mb-3"
                    style={{
                      color: '#ff4444',
                      textShadow: '0 0 20px rgba(255, 68, 68, 0.5)',
                    }}
                  >
                    ⚠ КРИТИЧЕСКАЯ ОШИБКА СЕРВЕРА ⚠
                  </div>
                  <div
                    className="text-sm font-mono mb-2"
                    style={{ color: '#ff6644' }}
                  >
                    OpenStack Nova: инстанс srv-prod — статус ERROR
                  </div>
                  <div
                    className="text-xs font-mono"
                    style={{ color: '#6a8a9a' }}
                  >
                    Инициализация терминала диагностики...
                  </div>
                </motion.div>
                <motion.div
                  className="mt-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0, 1, 0.5, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <span className="text-xs font-mono" style={{ color: '#44ff88' }}>
                    ▌
                  </span>
                </motion.div>
              </motion.div>
            )}

            {/* Terminal + options screen */}
            {(phase === 'diagnose' || phase === 'isolate' || phase === 'repair') && (
              <motion.div
                key={`phase-${phaseIndex}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {/* Terminal output */}
                <div
                  ref={terminalRef}
                  className="p-4 max-h-52 overflow-y-auto"
                  style={{
                    fontFamily: 'monospace',
                    fontSize: '11px',
                    lineHeight: '1.5',
                    borderBottom: '1px solid rgba(68, 255, 136, 0.1)',
                    scrollbarWidth: 'thin',
                    scrollbarColor: 'rgba(68, 255, 136, 0.2) transparent',
                  }}
                >
                  {terminalLines.map((line, i) => (
                    <div
                      key={`line-${i}`}
                      style={{ color: line.color }}
                      className={line.isCommand ? 'font-bold' : ''}
                    >
                      {line.text || '\u00A0'}
                    </div>
                  ))}
                  {isProcessing && (
                    <motion.span
                      style={{ color: '#44ff88' }}
                      animate={{ opacity: [1, 0] }}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      ▌
                    </motion.span>
                  )}
                </div>

                {/* Command options */}
                <div className="p-4">
                  <div
                    className="text-[10px] font-mono mb-2 uppercase tracking-wider"
                    style={{ color: '#6a8a9a' }}
                  >
                    Доступные команды:
                  </div>
                  <div className="space-y-2">
                    {currentPhaseConfig.options.map((option, i) => {
                      const isSelected = selectedOption === i;
                      const keyLabel = `${i + 1}`;
                      return (
                        <button
                          key={`opt-${i}`}
                          onClick={() => selectOption(i)}
                          disabled={isProcessing}
                          className="w-full flex items-center gap-3 px-3 py-2 rounded text-left font-mono text-xs transition-all duration-100"
                          style={{
                            background: isSelected
                              ? option.isCorrect
                                ? 'rgba(68, 255, 136, 0.15)'
                                : 'rgba(255, 68, 68, 0.15)'
                              : 'rgba(68, 255, 136, 0.04)',
                            border: `1px solid ${
                              isSelected
                                ? option.isCorrect
                                  ? 'rgba(68, 255, 136, 0.5)'
                                  : 'rgba(255, 68, 68, 0.5)'
                                : 'rgba(68, 255, 136, 0.15)'
                            }`,
                            color: isSelected
                              ? option.isCorrect
                                ? '#44ff88'
                                : '#ff4444'
                              : '#44ff88',
                            opacity: isProcessing && !isSelected ? 0.4 : 1,
                            cursor: isProcessing ? 'wait' : 'pointer',
                          }}
                          onMouseEnter={(e) => {
                            if (!isProcessing) {
                              e.currentTarget.style.background = 'rgba(68, 255, 136, 0.1)';
                              e.currentTarget.style.borderColor = 'rgba(68, 255, 136, 0.35)';
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!isSelected && !isProcessing) {
                              e.currentTarget.style.background = 'rgba(68, 255, 136, 0.04)';
                              e.currentTarget.style.borderColor = 'rgba(68, 255, 136, 0.15)';
                            }
                          }}
                        >
                          {/* Key number */}
                          <span
                            className="flex items-center justify-center w-5 h-5 rounded text-[10px] font-bold shrink-0"
                            style={{
                              background: 'rgba(68, 255, 136, 0.1)',
                              border: '1px solid rgba(68, 255, 136, 0.3)',
                              color: '#44ff88',
                            }}
                          >
                            {keyLabel}
                          </span>
                          {/* Command */}
                          <span className="font-bold">{option.command}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Keyboard hint */}
                  <div
                    className="text-[9px] font-mono mt-3 text-center"
                    style={{ color: '#4a6a5a' }}
                  >
                    Нажмите 1-{currentPhaseConfig.options.length} для выбора · Esc — выход
                  </div>
                </div>
              </motion.div>
            )}

            {/* Success screen */}
            {phase === 'success' && (
              <motion.div
                key="success"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  className="text-3xl mb-3"
                >
                  ✅
                </motion.div>
                <p
                  className="text-lg font-bold font-mono mb-2"
                  style={{
                    color: '#44ff88',
                    textShadow: '0 0 15px rgba(68, 255, 136, 0.4)',
                  }}
                >
                  КРИЗИС ПРЕДОТВРАЩЁН!
                </p>
                <p className="text-xs font-mono mb-1" style={{ color: '#88ccaa' }}>
                  Сервер srv-prod восстановлен. Статус: ACTIVE
                </p>
                <div className="flex items-center justify-center gap-4 mt-3 mb-4">
                  <span
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      color: '#44ff88',
                      background: 'rgba(68, 255, 136, 0.1)',
                      border: '1px solid rgba(68, 255, 136, 0.25)',
                    }}
                  >
                    +5 программирование
                  </span>
                  <span
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      color: '#ffcc00',
                      background: 'rgba(255, 204, 0, 0.1)',
                      border: '1px solid rgba(255, 204, 0, 0.25)',
                    }}
                  >
                    +3 карма
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded text-xs font-mono font-bold transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(68, 255, 136, 0.15)',
                    border: '1px solid rgba(68, 255, 136, 0.4)',
                    color: '#44ff88',
                  }}
                >
                  Закрыть
                </button>
              </motion.div>
            )}

            {/* Failure screen */}
            {phase === 'failure' && (
              <motion.div
                key="failure"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="p-6 text-center"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 12, delay: 0.1 }}
                  className="text-3xl mb-3"
                >
                  💀
                </motion.div>
                <p
                  className="text-lg font-bold font-mono mb-2"
                  style={{
                    color: '#ff4444',
                    textShadow: '0 0 15px rgba(255, 68, 68, 0.4)',
                  }}
                >
                  ВРЕМЯ ВЫШЛО!
                </p>
                <p className="text-xs font-mono mb-1" style={{ color: '#ff6644' }}>
                  Сервер srv-prod не восстановлен. Кризис продолжается.
                </p>
                <div className="flex items-center justify-center mt-3 mb-4">
                  <span
                    className="text-xs font-mono px-2 py-1 rounded"
                    style={{
                      color: '#ff4444',
                      background: 'rgba(255, 68, 68, 0.1)',
                      border: '1px solid rgba(255, 68, 68, 0.25)',
                    }}
                  >
                    +3 стресс
                  </span>
                </div>
                <button
                  onClick={onClose}
                  className="px-5 py-2 rounded text-xs font-mono font-bold transition-all duration-150 hover:scale-105 active:scale-95"
                  style={{
                    background: 'rgba(255, 68, 68, 0.15)',
                    border: '1px solid rgba(255, 68, 68, 0.3)',
                    color: '#ff4444',
                  }}
                >
                  Закрыть
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </FocusTrap>
    </motion.div>
  );
}
