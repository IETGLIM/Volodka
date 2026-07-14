import type { SecondaryAction } from '@/components/game/hud/hudTypes';

export function HUDMenuItem({ icon, label, shortcut, onClick, badge }: SecondaryAction) {
  const ariaLabel = shortcut ? `${label}, ${shortcut}` : label;

  return (
    <button
      type="button"
      onClick={() => onClick?.()}
      className="flex items-center gap-3 w-full px-3 py-2 text-left text-slate-300 hover:text-cyan-300 hover:bg-cyan-950/30 transition-colors duration-150 rounded-md relative"
      aria-label={ariaLabel}
    >
      <span className="shrink-0 relative">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-amber-500 text-[8px] font-bold text-black flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="flex-1 text-xs font-medium">{label}</span>
      {shortcut && (
        <kbd className="cyber-keyboard-hint">{shortcut}</kbd>
      )}
    </button>
  );
}
