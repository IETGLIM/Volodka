'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { NeonSign } from './NeonSign';

export const CafeEveningAtmosphere = memo(function CafeEveningAtmosphere() {
  const musicNotes = useMemo(() =>
    Array.from({ length: 6 }, (_, i) => ({
      id: i,
      x: 30 + Math.random() * 40,
      y: 40 + Math.random() * 30,
      duration: 5 + Math.random() * 5,
      delay: Math.random() * 8,
      symbol: ['\u266A', '\u266B', '\u2669'][i % 3],
    })),
  []);

  return (
    <>
      {/* Warm amber spotlight from above */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 20%, rgba(217,119,6,0.1) 0%, rgba(217,119,6,0.03) 40%, transparent 70%)',
        }}
        animate={{ opacity: [1, 0.8, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Candle glow spots */}
      {[
        { x: '25%', y: '65%', size: 40, opacity: 0.06 },
        { x: '60%', y: '60%', size: 30, opacity: 0.05 },
        { x: '45%', y: '70%', size: 35, opacity: 0.04 },
      ].map((candle, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            left: candle.x,
            top: candle.y,
            width: candle.size,
            height: candle.size,
            background: `radial-gradient(circle, rgba(255,180,50,${candle.opacity}) 0%, transparent 70%)`,
          }}
          animate={{
            scale: [1, 1.1, 0.95, 1.05, 1],
            opacity: [1, 0.8, 1, 0.9, 1],
          }}
          transition={{
            duration: 2 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Neon sign - CAFE name */}
      <NeonSign
        text="СИНЯЯ ЯМА"
        x={12}
        y={8}
        color="#ff8c00"
        fontSize={14}
        flickerSpeed={5}
      />

      {/* Neon sign - OPEN */}
      <NeonSign
        text="ОТКРЫТО"
        x={70}
        y={12}
        color="#00ffff"
        fontSize={10}
        flickerSpeed={7}
      />

      {/* Floating music note particles */}
      {musicNotes.map(note => (
        <motion.div
          key={note.id}
          className="absolute text-amber-600/15 select-none"
          style={{
            left: `${note.x}%`,
            top: `${note.y}%`,
            fontSize: 12,
          }}
          animate={{
            y: [0, -30, -60],
            x: [0, 5, -3],
            opacity: [0, 0.4, 0],
            rotate: [0, 10, -5],
          }}
          transition={{
            duration: note.duration,
            delay: note.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        >
          {note.symbol}
        </motion.div>
      ))}

      {/* Soft ambient glow */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(to top, rgba(217,119,6,0.03), transparent 50%)',
        }}
      />
    </>
  );
});
