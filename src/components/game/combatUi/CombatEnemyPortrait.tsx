/* Enemy silhouette portrait — CSS hologram float / hurt shake. */

import { motion } from 'framer-motion';

export function EnemyPortrait({
  emoji,
  hp,
  maxHp,
}: {
  emoji: string;
  hp: number;
  maxHp: number;
}) {
  const hurt = hp / maxHp < 0.3;
  return (
    <div className="ambient-glow-sm relative flex items-center justify-center enemy-hologram">
      <motion.div
        className="text-5xl sm:text-6xl select-none"
        animate={hurt ? { x: [0, -2, 2, -1, 1, 0] } : { y: [0, -4, 0] }}
        transition={
          hurt
            ? { duration: 0.3, repeat: hurt ? 3 : 0 }
            : { duration: 2, repeat: Infinity, ease: 'easeInOut' }
        }
      >
        {emoji}
      </motion.div>
      <div
        className="absolute inset-0 rounded-full opacity-20"
        style={{
          background: `radial-gradient(circle, ${hurt ? '#ef4444' : '#f97316'} 0%, transparent 70%)`,
          filter: 'blur(12px)',
          transform: 'scale(1.5)',
        }}
      />
    </div>
  );
}
