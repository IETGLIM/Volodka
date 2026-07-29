import type { SecondaryAction } from '@/components/game/hud/hudTypes';

export function HUDMenuItem({ icon, label, shortcut, onClick, badge }: SecondaryAction) {
  const ariaLabel = shortcut ? `${label}, ${shortcut}` : label;

  return (
    <button
      type="button"
      onClick={() => onClick?.()}
      className="flex items-center gap-3 w-full px-3 py-2 text-left transition-colors duration-200 rounded-sm relative border-l-2 border-l-transparent hover:border-l-stone-400/50 hover:bg-white/[0.03]"
      style={{ color: 'var(--hud-filmic-ink-muted)' }}
      aria-label={ariaLabel}
    >
      <span className="shrink-0 relative opacity-80">
        {icon}
        {badge !== undefined && badge > 0 && (
          <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-stone-400 text-[8px] font-bold text-black flex items-center justify-center">
            {badge > 9 ? '9+' : badge}
          </span>
        )}
      </span>
      <span className="flex-1 text-xs font-medium tracking-wide">{label}</span>
      {shortcut && (
        <kbd className="hud-filmic-kbd">{shortcut}</kbd>
      )}
    </button>
  );
}
