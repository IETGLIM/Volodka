import { motion } from 'framer-motion';

export interface CyberSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  unit?: string;
}

/** Settings-style cyber slider — shared across panels. */
export function CyberSlider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit = '',
}: CyberSliderProps) {
  const pct = ((value - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-slate-300/80 tracking-wide">{label}</span>
        <span className="font-mono text-xs text-cyan-400/70 tabular-nums">
          {value}
          {unit}
        </span>
      </div>
      <div className="relative h-5 flex items-center group">
        <div className="absolute left-0 right-0 h-1.5 rounded-full" style={{ background: 'rgba(30, 41, 59, 0.8)' }} />
        <motion.div
          className="absolute left-0 h-1.5 rounded-full"
          style={{
            width: `${pct}%`,
            background: 'linear-gradient(90deg, rgb(var(--cyber-cyan-rgb) / 0.4), rgb(var(--cyber-cyan-rgb) / 0.8))',
            boxShadow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
          }}
          layout
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        />
        <motion.div
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-cyan-400/80 cursor-grab active:cursor-grabbing"
          style={{
            left: `calc(${pct}% - 7px)`,
            background: 'rgb(var(--cyber-cyan-rgb) / 0.9)',
            boxShadow: '0 0 10px rgb(var(--cyber-cyan-rgb) / 0.5), 0 0 20px rgb(var(--cyber-cyan-rgb) / 0.2)',
          }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.95 }}
        />
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          aria-label={label}
        />
      </div>
    </div>
  );
}
