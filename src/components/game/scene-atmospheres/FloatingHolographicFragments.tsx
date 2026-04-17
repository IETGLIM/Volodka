'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';

interface FloatingFragment {
  id: number;
  text: string;
  x: number;
  y: number;
  duration: number;
  delay: number;
  rotation: number;
}

const FloatingHolographicFragments = memo(function FloatingHolographicFragments({
  fragments,
}: {
  fragments: FloatingFragment[];
}) {
  return (
    <>
      {fragments.map(frag => (
        <motion.div
          key={frag.id}
          className="absolute select-none"
          style={{
            left: `${frag.x}%`,
            top: `${frag.y}%`,
            fontFamily: 'var(--font-geist-mono), monospace',
            fontSize: 10,
            color: 'rgba(168,85,247,0.2)',
            fontStyle: 'italic',
          }}
          animate={{
            y: [0, -25, 10, -15, 0],
            x: [0, 10, -8, 5, 0],
            opacity: [0, 0.5, 0.2, 0.4, 0],
            rotate: [frag.rotation, frag.rotation + 2, frag.rotation - 1, frag.rotation],
          }}
          transition={{
            duration: frag.duration,
            delay: frag.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {frag.text}
        </motion.div>
      ))}
    </>
  );
});
