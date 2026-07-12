import type { KarmaPoemTab } from '@/engine/karmaPoem/karmaPoemPresentation';

interface KarmaPoemTabButtonProps {
  tab: KarmaPoemTab;
  active: boolean;
  label: string;
  panelId: string;
  onClick: (tab: KarmaPoemTab) => void;
}

export function KarmaPoemTabButton({
  tab,
  active,
  label,
  panelId,
  onClick,
}: KarmaPoemTabButtonProps) {
  return (
    <button
      type="button"
      role="tab"
      id={`karma-poem-tab-${tab}`}
      aria-selected={active}
      aria-controls={panelId}
      onClick={() => onClick(tab)}
      className={`flex-1 py-3 text-sm font-mono tracking-wider transition-colors outline-none focus-visible:ring-1 focus-visible:ring-cyan-500/40 ${
        active
          ? 'text-cyan-300 bg-cyan-950/30 border-b-2 border-cyan-400 shadow-[0_0_8px_rgb(var(--cyber-cyan-rgb)/0.15)]'
          : 'text-slate-500 border-b-2 border-transparent hover:text-slate-300'
      }`}
    >
      {label}
    </button>
  );
}
