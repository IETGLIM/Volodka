import { motion } from 'framer-motion';
import { karmaStroke } from '@/components/game/hud/hudPresentation';

interface KarmaRingProps {
  karma: number;
}

export function KarmaRing({ karma }: KarmaRingProps) {
  const radius = 14;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (karma / 100) * circumference;
  const color = karmaStroke(karma);

  return (
    <div className="relative breathe-glow karma-ring-outer" aria-hidden="true">
      <motion.svg
        width="36"
        height="36"
        viewBox="0 0 36 36"
        className="shrink-0"
      >
        <circle cx="18" cy="18" r={radius} fill="none" stroke="rgba(100,116,139,0.25)" strokeWidth="3" />
        <circle
          cx="18"
          cy="18"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 18 18)"
          style={{
            transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
            filter: `drop-shadow(0 0 4px ${color}60)`,
          }}
        />
        <text
          x="18"
          y="20"
          textAnchor="middle"
          fontSize="12"
          fill={color}
          className="select-none"
          style={{ filter: 'drop-shadow(0 0 3px currentColor)', transition: 'fill 0.5s ease' }}
        >
          ☯
        </text>
      </motion.svg>
      <motion.div
        className="absolute inset-0 rounded-full pointer-events-none"
        animate={{
          boxShadow: [`0 0 0px ${color}00`, `0 0 12px ${color}40`, `0 0 0px ${color}00`],
        }}
        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  );
}
