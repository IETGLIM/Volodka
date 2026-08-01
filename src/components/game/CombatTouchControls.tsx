/* ─── Volodka RPG – Mobile combat touch controls ───
 * Large tap targets (≥48px) for attack / defend / poem / flee.
 * Visible only on touch devices; desktop keeps TerminalButton row.
 */

import { useCallback, useRef, type ReactNode, type TouchEvent } from 'react';
import { LogOut, Shield, Sparkles, Sword } from 'lucide-react';

interface CombatTouchControlsProps {
  disabled: boolean;
  poemDisabled: boolean;
  poemOpen: boolean;
  onAttack: () => void;
  onDefend: () => void;
  onPoemToggle: () => void;
  onFlee: () => void;
  /** Cycle poem powers left/right when submenu is open */
  onPoemSwipe?: (direction: -1 | 1) => void;
}

function TouchActionButton({
  label,
  icon,
  accent,
  disabled,
  onPress,
}: {
  label: string;
  icon: ReactNode;
  accent: string;
  disabled: boolean;
  onPress: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onPress}
      aria-label={label}
      className="flex flex-col items-center justify-center gap-1 min-h-12 min-w-12 flex-1 rounded-xl border font-mono text-[10px] uppercase tracking-wider transition-transform active:scale-95 disabled:opacity-40 disabled:pointer-events-none combat-action-button"
      style={{
        background: `color-mix(in srgb, ${accent} 18%, rgba(2,6,23,0.92))`,
        borderColor: `color-mix(in srgb, ${accent} 45%, transparent)`,
        color: accent,
        boxShadow: `0 0 16px color-mix(in srgb, ${accent} 20%, transparent)`,
        touchAction: 'manipulation',
      }}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export function CombatTouchControls({
  disabled,
  poemDisabled,
  poemOpen,
  onAttack,
  onDefend,
  onPoemToggle,
  onFlee,
  onPoemSwipe,
}: CombatTouchControlsProps) {
  const touchStartX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (e: TouchEvent) => {
      if (touchStartX.current == null || !onPoemSwipe || !poemOpen) {
        touchStartX.current = null;
        return;
      }
      const endX = e.changedTouches[0]?.clientX;
      if (endX == null) {
        touchStartX.current = null;
        return;
      }
      const delta = endX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(delta) < 40) return;
      onPoemSwipe(delta < 0 ? 1 : -1);
    },
    [onPoemSwipe, poemOpen],
  );

  return (
    <div
      className="mb-2 flex gap-2 pointer-events-auto"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      data-testid="combat-touch-controls"
    >
      <TouchActionButton
        label="Атака"
        icon={<Sword className="size-5" aria-hidden />}
        accent="#22d3ee"
        disabled={disabled}
        onPress={onAttack}
      />
      <TouchActionButton
        label="Защита"
        icon={<Shield className="size-5" aria-hidden />}
        accent="#34d399"
        disabled={disabled}
        onPress={onDefend}
      />
      <TouchActionButton
        label={poemOpen ? 'Стих ▲' : 'Стих'}
        icon={<Sparkles className="size-5" aria-hidden />}
        accent="#fbbf24"
        disabled={disabled || poemDisabled}
        onPress={onPoemToggle}
      />
      <TouchActionButton
        label="Бежать"
        icon={<LogOut className="size-5" aria-hidden />}
        accent="#fb7185"
        disabled={disabled}
        onPress={onFlee}
      />
    </div>
  );
}
