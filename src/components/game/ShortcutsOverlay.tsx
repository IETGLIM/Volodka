
/* ─── Volodka RPG – Keyboard Shortcuts Help Overlay ─── */
/* Enhanced with combat/camera groups, slide-down animation,
 * gamepad detection, and neon cyberpunk styling. */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Keyboard, Gamepad2 } from 'lucide-react';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ─── Shortcut definitions ─── */

interface ShortcutEntry {
  keys: string[];
  desc: string;
}

interface ShortcutGroup {
  title: string;
  shortcuts: ShortcutEntry[];
}

const KEYBOARD_GROUPS: ShortcutGroup[] = [
  {
    title: 'Движение',
    shortcuts: [
      { keys: ['W', 'A', 'S', 'D'], desc: 'Движение' },
      { keys: ['Shift'], desc: 'Бег' },
      { keys: ['Space'], desc: 'Прыжок' },
    ],
  },
  {
    title: 'Взаимодействие',
    shortcuts: [
      { keys: ['E'], desc: 'Взаимодействие с NPC / объектами' },
      { keys: ['Esc'], desc: 'Меню паузы / закрыть' },
    ],
  },
  {
    title: 'Панели',
    shortcuts: [
      { keys: ['I'], desc: 'Инвентарь' },
      { keys: ['J'], desc: 'Журнал' },
      { keys: ['Q'], desc: 'Задания' },
      { keys: ['Shift', 'P'], desc: 'Книга стихов' },
      { keys: ['M'], desc: 'Карта мира' },
      { keys: ['F'], desc: 'Быстрый переход' },
      { keys: ['C'], desc: 'Профиль персонажа' },
      { keys: ['N'], desc: 'Отношения с NPC' },
      { keys: ['K'], desc: 'Кодекс' },
      { keys: ['L'], desc: 'История диалогов' },
      { keys: ['H'], desc: 'Достижения' },
      { keys: ['T'], desc: 'Дерево навыков' },
      { keys: ['V'], desc: 'Черты (перки)' },
      { keys: ['B'], desc: 'Доска заданий' },
      { keys: ['Shift', 'T'], desc: 'Торговля' },
      { keys: ['G'], desc: 'Крафт' },
      { keys: ['R'], desc: 'Отдых (в комнате)' },
      { keys: ['Tab'], desc: 'Инвентарь' },
    ],
  },
  {
    title: 'Бой',
    shortcuts: [
      { keys: ['1'], desc: 'Атака' },
      { keys: ['2'], desc: 'Защита' },
      { keys: ['3'], desc: 'Побег' },
      { keys: ['4'], desc: 'Стихотворение' },
    ],
  },
  {
    title: 'Камера',
    shortcuts: [
      { keys: ['Мышь ↕'], desc: 'Вращение камеры' },
      { keys: ['Scroll'], desc: 'Приближение / отдаление' },
      { keys: ['Shift', 'R'], desc: 'Сброс камеры' },
    ],
  },
  {
    title: 'Прочее',
    shortcuts: [
      { keys: ['F1', '?'], desc: 'Эта справка' },
      { keys: ['F3'], desc: 'Панель разработчика' },
    ],
  },
];

const GAMEPAD_GROUPS: ShortcutGroup[] = [
  {
    title: 'Геймпад — движение',
    shortcuts: [
      { keys: ['Левый стик'], desc: 'Движение' },
      { keys: ['LB'], desc: 'Бег' },
      { keys: ['B'], desc: 'Прыжок' },
    ],
  },
  {
    title: 'Геймпад — взаимодействие',
    shortcuts: [
      { keys: ['A'], desc: 'Взаимодействие' },
      { keys: ['Menu'], desc: 'Меню паузы / закрыть' },
    ],
  },
  {
    title: 'Геймпад — камеры',
    shortcuts: [
      { keys: ['Правый стик'], desc: 'Камера' },
      { keys: ['LT / RT'], desc: 'Приближение / отдаление' },
    ],
  },
  {
    title: 'Геймпад — панели',
    shortcuts: [
      { keys: ['Y'], desc: 'Инвентарь' },
      { keys: ['X'], desc: 'Задания' },
      { keys: ['View'], desc: 'Журнал' },
    ],
  },
  {
    title: 'Геймпад — бой',
    shortcuts: [
      { keys: ['A'], desc: 'Атака' },
      { keys: ['B'], desc: 'Защита' },
      { keys: ['X'], desc: 'Побег' },
      { keys: ['Y'], desc: 'Стихотворение' },
      { keys: ['LB / RB'], desc: 'Выбор стиха' },
      { keys: ['LT'], desc: 'Использовать стих' },
    ],
  },
];

/* ─── Gamepad detection hook ─── */

function useGamepadConnected(): boolean {
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    let rafId = 0;

    const check = () => {
      if (typeof navigator === 'undefined' || !navigator.getGamepads) {
        setConnected(false);
        return;
      }
      const pads = navigator.getGamepads();
      let found = false;
      for (let i = 0; i < pads.length; i++) {
        if (pads[i]?.connected) {
          found = true;
          break;
        }
      }
      setConnected(found);
      rafId = requestAnimationFrame(check);
    };

    rafId = requestAnimationFrame(check);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => {
      // Re-check after a tick (another pad might still be connected)
      setTimeout(() => {
        if (typeof navigator !== 'undefined' && navigator.getGamepads) {
          const pads = navigator.getGamepads();
          let found = false;
          for (let i = 0; i < pads.length; i++) {
            if (pads[i]?.connected) { found = true; break; }
          }
          setConnected(found);
        }
      }, 100);
    };

    window.addEventListener('gamepadconnected', onConnect);
    window.addEventListener('gamepaddisconnected', onDisconnect);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('gamepadconnected', onConnect);
      window.removeEventListener('gamepaddisconnected', onDisconnect);
    };
  }, []);

  return connected;
}

/* ─── Component ─── */

interface ShortcutsOverlayProps {
  open: boolean;
  onClose: () => void;
}

export function ShortcutsOverlay({ open, onClose }: ShortcutsOverlayProps) {
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const gamepadConnected = useGamepadConnected();

  // Combine keyboard + gamepad groups
  const allGroups = gamepadConnected
    ? [...KEYBOARD_GROUPS, ...GAMEPAD_GROUPS]
    : KEYBOARD_GROUPS;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 flex items-start justify-center pt-[5vh] sm:pt-[8vh]"
          style={{ zIndex: UI_LAYERS.MENU }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Content — slide down from top */}
          <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            className="relative z-10 w-full max-w-2xl mx-4"
            initial={{ y: -60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -40, opacity: 0 }}
            transition={{ duration: 0.35, ease: [0.25, 0.46, 0.45, 0.94] }}
            {...dialogProps}
          >
            <div
              className="relative rounded-lg border border-cyan-500/20 overflow-hidden hex-grid-bg edge-glow"
              style={{
                background: 'linear-gradient(180deg, rgba(8,12,18,0.97) 0%, rgba(5,8,14,0.98) 100%)',
                boxShadow: '0 0 40px rgb(var(--cyber-cyan-rgb) / 0.08), 0 8px 32px rgba(0, 0, 0, 0.6)',
              }}
            >
              {/* Corner bracket decorations */}
              <div className="corner-bracket-sm corner-bracket-sm-tl" />
              <div className="corner-bracket-sm corner-bracket-sm-tr" />
              <div className="corner-bracket-sm corner-bracket-sm-bl" />
              <div className="corner-bracket-sm corner-bracket-sm-br" />

              {/* Scan-line sweep animation */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none z-10">
                <div
                  className="absolute inset-x-0 h-16"
                  style={{
                    background:
                      'linear-gradient(180deg, transparent 0%, rgb(var(--cyber-cyan-rgb) / 0.04) 40%, rgb(var(--cyber-cyan-rgb) / 0.08) 50%, rgb(var(--cyber-cyan-rgb) / 0.04) 60%, transparent 100%)',
                    animation: 'scanline-overlay 6s linear infinite',
                  }}
                />
              </div>

              {/* Header */}
              <div className="relative z-20 flex items-center justify-between px-5 py-4 border-b border-cyan-500/15">
                <div className="flex items-center gap-3">
                  <Keyboard className="size-5 text-cyan-400/70" />
                  <h2 {...titleProps} className="text-lg font-semibold text-slate-100 tracking-wide">
                    Управление
                  </h2>
                  {gamepadConnected && (
                    <Gamepad2 className="size-4 text-emerald-400/70" />
                  )}
                </div>
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-md text-slate-400 hover:text-slate-200 hover:bg-white/5 transition-colors close-btn-glow"
                  aria-label="Закрыть"
                >
                  <X className="size-4" />
                </button>
              </div>

              {/* Body */}
              <div className="relative z-20 px-5 py-4 max-h-[70vh] overflow-y-auto game-scrollbar">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  {allGroups.map((group) => (
                    <div key={group.title}>
                      <h3 className="text-xs font-semibold text-cyan-400/60 uppercase tracking-[0.15em] mb-2.5 flex items-center gap-2">
                        {group.title.startsWith('Геймпад') && (
                          <Gamepad2 className="size-3 text-emerald-400/60" />
                        )}
                        {group.title}
                      </h3>
                      <div className="flex flex-col gap-1.5">
                        {group.shortcuts.map((shortcut) => (
                          <div key={shortcut.keys.join('+')} className="flex items-center justify-between gap-3">
                            <span className="text-sm text-slate-300/80">{shortcut.desc}</span>
                            <div className="flex items-center gap-1 shrink-0">
                              {shortcut.keys.map((key, i) => (
                                <span key={i}>
                                  {i > 0 && <span className="text-slate-600 text-xs">+</span>}
                                  <kbd
                                    className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded border text-xs font-mono transition-all duration-200 hover:border-cyan-400/50 hover:text-cyan-300 hover:shadow-[0_0_8px_rgba(0,229,255,0.3),0_0_16px_rgba(0,229,255,0.1)]"
                                    style={{
                                      background: 'rgba(15, 23, 42, 0.6)',
                                      borderColor: 'rgba(100, 116, 139, 0.25)',
                                      color: 'rgba(203, 213, 225, 0.8)',
                                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.03)',
                                    }}
                                  >
                                    {key}
                                  </kbd>
                                </span>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="relative z-20 px-5 py-3 border-t border-slate-800/50 flex items-center justify-between">
                <span className="text-[10px] text-slate-500/50 font-mono tracking-wider">
                  volodka://controls
                </span>
                <span className="text-[10px] text-slate-500/40 font-mono">
                  Esc / F1 — закрыть
                </span>
              </div>
            </div>
          </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
