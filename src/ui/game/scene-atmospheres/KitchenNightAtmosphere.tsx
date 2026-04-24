'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';

export const KitchenNightAtmosphere = memo(function KitchenNightAtmosphere() {
  const steamParticles = useMemo(() =>
    Array.from({ length: 8 }, (_, i) => ({
      id: i,
      x: 38 + Math.random() * 8,
      startY: 55,
      size: 3 + Math.random() * 6,
      duration: 3 + Math.random() * 3,
      delay: Math.random() * 4,
    })),
  []);

  return (
    <>
      {/* Blue monitor glow from left */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 20% 40%, rgba(100,150,255,0.08) 0%, transparent 50%)',
        }}
        animate={{ opacity: [1, 0.7, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Cold window light from right */}
      <div
        className="absolute top-[5%] right-[5%] w-[30%] h-[50%]"
        style={{
          background: 'linear-gradient(180deg, rgba(80,120,180,0.06), transparent)',
          clipPath: 'polygon(10% 0, 90% 0, 100% 100%, 0% 100%)',
        }}
      />

      {/* Steam rising from cup */}
      {steamParticles.map(p => (
        <motion.div
          key={p.id}
          className="absolute rounded-full"
          style={{
            left: `${p.x}%`,
            top: `${p.startY}%`,
            width: p.size,
            height: p.size,
            background: 'radial-gradient(circle, rgba(180,180,200,0.12) 0%, transparent 70%)',
          }}
          animate={{
            y: [0, -40, -80],
            x: [0, 3, -2],
            opacity: [0, 0.3, 0],
            scale: [0.5, 1.5, 2],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'easeOut',
          }}
        />
      ))}

      {/* Cup indicator - faint warm spot */}
      <div
        className="absolute"
        style={{
          top: '55%',
          left: '40%',
          width: 12,
          height: 6,
          background: 'rgba(180,140,80,0.08)',
          borderRadius: '0 0 50% 50%',
          boxShadow: '0 0 15px rgba(180,140,80,0.05)',
        }}
      />

      {/* Sound wave indicator - faint */}
      <div className="absolute bottom-[20%] right-[15%] flex gap-[2px] items-end">
        {[0.4, 0.7, 1, 0.6, 0.3].map((h, i) => (
          <motion.div
            key={i}
            className="rounded-full"
            style={{
              width: 1.5,
              height: 6,
              background: 'rgba(100,150,255,0.12)',
            }}
            animate={{ scaleY: [h * 0.5, h, h * 0.5] }}
            transition={{
              duration: 1.5,
              delay: i * 0.15,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>

      {/* Scanline */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 4px, rgba(100,150,255,0.01) 4px, rgba(100,150,255,0.01) 8px)',
        }}
      />
    </>
  );
});
