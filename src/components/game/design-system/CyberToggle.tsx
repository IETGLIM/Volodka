import { motion } from 'framer-motion';

export interface CyberToggleProps {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function CyberToggle({ label, checked, onChange }: CyberToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between gap-3 py-1 group"
    >
      <span className="font-mono text-xs text-slate-300/80 tracking-wide group-hover:text-slate-200 transition-colors">
        {label}
      </span>
      <div
        className="relative w-10 h-5 rounded-full transition-all duration-300"
        style={{
          background: checked ? 'rgb(var(--cyber-cyan-rgb) / 0.25)' : 'rgba(30, 41, 59, 0.8)',
          border: checked ? '1px solid rgb(var(--cyber-cyan-rgb) / 0.5)' : '1px solid rgba(71, 85, 105, 0.4)',
          boxShadow: checked ? '0 0 12px rgb(var(--cyber-cyan-rgb) / 0.3), inset 0 0 6px rgb(var(--cyber-cyan-rgb) / 0.15)' : 'none',
        }}
      >
        <motion.div
          className="absolute top-0.5 w-3.5 h-3.5 rounded-full"
          animate={{
            left: checked ? '22px' : '2px',
            background: checked ? 'rgb(var(--cyber-cyan-rgb) / 0.95)' : 'rgba(100, 116, 139, 0.6)',
            boxShadow: checked ? '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.6)' : 'none',
          }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        />
      </div>
    </button>
  );
}
