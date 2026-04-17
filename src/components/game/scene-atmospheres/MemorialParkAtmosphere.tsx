'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { NeonSign } from './NeonSign';

export const MemorialParkAtmosphere = memo(function MemorialParkAtmosphere() {
  const fireflies = useMemo(() =>
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: 10 + Math.random() * 80,
      y: 20 + Math.random() * 60,
      size: 2 + Math.random() * 2,
      duration: 4 + Math.random() * 5,
      delay: Math.random() * 6,
    })),
  []);

  return (
    <>
      {/* Fog between trees - bottom */}
      <motion.div
        className="absolute bottom-0 left-[-10%] right-[-10%] h-[40%]"
        style={{
          background: 'linear-gradient(to top, rgba(100,140,100,0.08), rgba(80,120,80,0.04) 40%, transparent)',
          filter: 'blur(10px)',
        }}
        animate={{
          x: ['-2%', '2%', '-1%', '3%', '-2%'],
          opacity: [0.8, 1, 0.7, 0.9, 0.8],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Second fog layer */}
      <motion.div
        className="absolute bottom-[-5%] left-[-15%] right-[-15%] h-[30%]"
        style={{
          background: 'linear-gradient(to top, rgba(80,120,80,0.06), transparent 60%)',
          filter: 'blur(15px)',
        }}
        animate={{
          x: ['3%', '-3%', '2%', '-1%', '3%'],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Moonlight shaft from top-right */}
      <div
        className="absolute top-0 right-[10%] w-[25%] h-[70%]"
        style={{
          background: 'linear-gradient(160deg, rgba(180,200,220,0.04) 0%, rgba(180,200,220,0.02) 30%, transparent 60%)',
          clipPath: 'polygon(30% 0, 70% 0, 100% 100%, 0% 100%)',
        }}
      />

      {/* Firefly particles */}
      {fireflies.map(ff => (
        <motion.div
          key={ff.id}
          className="absolute rounded-full"
          style={{
            left: `${ff.x}%`,
            top: `${ff.y}%`,
            width: ff.size,
            height: ff.size,
            background: 'radial-gradient(circle, rgba(150,255,100,0.5) 0%, rgba(150,255,100,0.1) 50%, transparent 70%)',
            boxShadow: '0 0 4px rgba(150,255,100,0.3)',
          }}
          animate={{
            opacity: [0, 0.8, 0.3, 0.7, 0],
            x: [0, 8, -5, 3, 0],
            y: [0, -5, 3, -8, 0],
          }}
          transition={{
            duration: ff.duration,
            delay: ff.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </>
  );
});
