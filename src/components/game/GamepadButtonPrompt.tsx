'use client';

/* ─── Volodka RPG – Gamepad Button Prompt ───
 * Renders a contextual gamepad button icon + label.
 * Replaces keyboard prompts when gamepad is active.
 * Usage: <GamepadButtonPrompt action="attack" /> → shows "A — Атака" (gamepad) or "E — Взаимодействие" (keyboard)
 */

import { useGamepadConnected } from '@/hooks/useGamepadConnected';

type GamepadAction =
  | 'attack'
  | 'defend'
  | 'interact'
  | 'confirm'
  | 'cancel'
  | 'back'
  | 'menu'
  | 'inventory'
  | 'quests'
  | 'journal'
  | 'run'
  | 'next'
  | 'prev';

interface PromptConfig {
  gamepadButton: string;
  keyboardKey: string;
  label: string;
}

const PROMPTS: Record<GamepadAction, PromptConfig> = {
  attack: { gamepadButton: 'A', keyboardKey: 'E', label: 'Атака' },
  defend: { gamepadButton: 'B', keyboardKey: 'Q', label: 'Защита' },
  interact: { gamepadButton: 'A', keyboardKey: 'E', label: 'Взаимодействие' },
  confirm: { gamepadButton: 'A', keyboardKey: 'Enter', label: 'Подтвердить' },
  cancel: { gamepadButton: 'B', keyboardKey: 'Esc', label: 'Отмена' },
  back: { gamepadButton: 'B', keyboardKey: 'Esc', label: 'Назад' },
  menu: { gamepadButton: '▶', keyboardKey: 'Esc', label: 'Меню' },
  inventory: { gamepadButton: 'Y', keyboardKey: 'I', label: 'Инвентарь' },
  quests: { gamepadButton: 'X', keyboardKey: 'Q', label: 'Задания' },
  journal: { gamepadButton: '◁', keyboardKey: 'J', label: 'Журнал' },
  run: { gamepadButton: 'LB', keyboardKey: '⇧', label: 'Бег' },
  next: { gamepadButton: 'RB', keyboardKey: '→', label: 'Далее' },
  prev: { gamepadButton: 'LB', keyboardKey: '←', label: 'Назад' },
};

type Props = {
  action: GamepadAction;
  className?: string;
  /** Override the label text */
  labelOverride?: string;
  /** Hide the label text, show only the key */
  keyOnly?: boolean;
};

export function GamepadButtonPrompt({ action, className = '', labelOverride, keyOnly = false }: Props) {
  const gamepadConnected = useGamepadConnected();
  const config = PROMPTS[action];

  if (!config) return null;

  const key = gamepadConnected ? config.gamepadButton : config.keyboardKey;
  const label = labelOverride ?? config.label;
  const isGamepadStyle = gamepadConnected;

  return (
    <span
      className={`gamepad-button-prompt ${isGamepadStyle ? 'gamepad-button-prompt--gamepad' : 'gamepad-button-prompt--keyboard'} ${className}`}
      aria-label={`${label} (${key})`}
    >
      <kbd className="gamepad-button-prompt-key">{key}</kbd>
      {!keyOnly && (
        <span className="gamepad-button-prompt-label">{label}</span>
      )}
    </span>
  );
}

/** Button letter only — no label. Used inline in compact UI. */
export function GamepadButtonIcon({ action, className = '' }: { action: GamepadAction; className?: string }) {
  return <GamepadButtonPrompt action={action} className={className} keyOnly />;
}
