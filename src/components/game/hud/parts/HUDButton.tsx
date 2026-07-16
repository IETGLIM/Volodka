import type { ReactNode } from 'react';

interface HUDButtonProps {
  icon: ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  disabled?: boolean;
  tooltip?: string;
}

export function HUDButton({
  icon,
  label,
  onClick,
  active = false,
  disabled = false,
  tooltip,
}: HUDButtonProps) {
  const ariaLabel = tooltip ?? label;

  const handleClick = () => {
    if (!disabled) onClick?.();
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      aria-disabled={disabled || undefined}
      aria-label={ariaLabel}
      title={ariaLabel}
      data-tooltip={tooltip}
      className={`group w-11 h-11 sm:w-9 sm:h-9 flex items-center justify-center rounded-md text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/60 focus-visible:ring-offset-1 focus-visible:ring-offset-black transition-all duration-200 relative overflow-hidden hud-btn-shimmer cyber-hover-glow ${active ? 'bg-cyan-950/40 text-cyan-300' : ''} ${tooltip ? 'cyber-tooltip' : ''} ${disabled ? 'opacity-40 pointer-events-none' : ''}`}
    >
      <div
        className="absolute inset-0 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
        style={{ boxShadow: 'inset 0 0 12px rgb(var(--cyber-cyan-rgb) / 0.15), 0 0 8px rgb(var(--cyber-cyan-rgb) / 0.1)' }}
      />
      <div className="absolute inset-0 rounded-md opacity-0 group-active:opacity-100 transition-opacity duration-100 pointer-events-none bg-cyan-500/10" />
      {!disabled && (
        <div className="absolute inset-0 rounded-md overflow-hidden pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(105deg, transparent 40%, rgb(var(--cyber-cyan-rgb) / 0.12) 50%, transparent 60%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2s ease-in-out infinite',
            }}
          />
        </div>
      )}
      <span className="relative z-10">{icon}</span>
    </button>
  );
}