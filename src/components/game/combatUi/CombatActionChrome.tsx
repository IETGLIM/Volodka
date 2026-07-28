/* Terminal-style combat action buttons + gamepad hint badges. */

import React from 'react';

export function GamepadHint({ label }: { label: string }) {
  return (
    <span className="ml-1 text-[8px] leading-none bg-white/10 rounded px-1 py-px font-mono opacity-60 select-none">
      {label}
    </span>
  );
}

const ACCENT_MAP: Record<
  string,
  { border: string; bg: string; text: string; hoverBg: string; glow: string }
> = {
  cyan: {
    border: 'border-cyan-700/60',
    bg: 'bg-cyan-950/50',
    text: 'text-cyan-400',
    hoverBg: 'hover:bg-cyan-900/40',
    glow: '#06b6d4',
  },
  emerald: {
    border: 'border-emerald-700/60',
    bg: 'bg-emerald-950/50',
    text: 'text-emerald-400',
    hoverBg: 'hover:bg-emerald-900/40',
    glow: '#10b981',
  },
  amber: {
    border: 'border-amber-700/60',
    bg: 'bg-amber-950/50',
    text: 'text-amber-400',
    hoverBg: 'hover:bg-amber-900/40',
    glow: '#f59e0b',
  },
  slate: {
    border: 'border-slate-600/60',
    bg: 'bg-slate-900/50',
    text: 'text-slate-300',
    hoverBg: 'hover:bg-slate-800/40',
    glow: '#94a3b8',
  },
  rose: {
    border: 'border-rose-700/60',
    bg: 'bg-rose-950/50',
    text: 'text-rose-400',
    hoverBg: 'hover:bg-rose-900/40',
    glow: '#f43f5e',
  },
};

export function TerminalButton({
  onClick,
  disabled,
  accentColor,
  children,
  gamepadHint,
}: {
  onClick: () => void;
  disabled: boolean;
  accentColor: string;
  children: React.ReactNode;
  gamepadHint?: string;
}) {
  const c = ACCENT_MAP[accentColor] || ACCENT_MAP.slate;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`relative flex-1 py-2.5 rounded border ${c.border} ${c.bg} ${c.text} ${c.hoverBg} disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-150 text-xs font-mono font-semibold flex items-center justify-center gap-1.5 overflow-hidden group combat-btn-enhanced active:scale-[0.97] active:brightness-110`}
      style={!disabled ? { boxShadow: `0 0 10px ${c.glow}28, inset 0 0 10px ${c.glow}14` } : {}}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,255,0.03) 2px, rgba(0,255,255,0.03) 4px)',
        }}
      />
      {!disabled && (
        <div
          className="absolute inset-x-0 bottom-0 h-px opacity-70 pointer-events-none"
          style={{ background: `linear-gradient(90deg, transparent, ${c.glow}, transparent)` }}
          aria-hidden
        />
      )}
      {gamepadHint && <GamepadHint label={gamepadHint} />}
      <span className="absolute top-0 left-0 text-[8px] leading-none opacity-30">┌</span>
      <span className="absolute bottom-0 right-0 text-[8px] leading-none opacity-30">┘</span>
      {children}
    </button>
  );
}
