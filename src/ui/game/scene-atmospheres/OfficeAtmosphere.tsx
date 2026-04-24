'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TerminalWindowOverlay } from './TerminalWindowOverlay';

export const OfficeAtmosphere = memo(function OfficeAtmosphere() {
  const terminalLines = useMemo(() => [
    'SYS: auth_check [OK]',
    'NET: node_7 responding... 23ms',
    'DB: query_pool 12/20 active',
    'LOG: [INFO] backup_sync complete',
    'SYS: mem_alloc 2.4GB / 8GB',
    'NET: packet_loss 0.02%',
    'API: rate_limit 847/1000',
    'LOG: [WARN] latency spike 340ms',
    'SYS: cron_job midnight_backup OK',
    'NET: ssl_cert expires 47d',
    'DB: replica_lag 0.3s',
    'LOG: [INFO] rotation complete',
  ], []);

  const ledBlinks = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      x: 75 + (i % 7) * 3.5,
      y: 15 + Math.floor(i / 7) * 30,
      delay: Math.random() * 3,
      duration: 0.8 + Math.random() * 2,
      color: i % 3 === 0 ? '#22c55e' : i % 3 === 1 ? '#ff8c00' : '#00ffff',
    })),
  []);

  return (
    <>
      {/* Blue fluorescent light flicker */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 10%, rgba(148,163,184,0.08) 0%, transparent 60%)' }}
        animate={{ opacity: [1, 0.7, 1, 0.9, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Terminal window overlay - left side */}
      <TerminalWindowOverlay
        lines={terminalLines}
        x={3}
        y={20}
        width={220}
        height={180}
        borderColor="rgba(0,255,255,0.2)"
        textColor="rgba(0,255,255,0.35)"
        headerText="SYS_MONITOR"
      />

      {/* Terminal window overlay - right side */}
      <TerminalWindowOverlay
        lines={terminalLines.slice().reverse()}
        x={-3}
        y={45}
        width={180}
        height={140}
        borderColor="rgba(0,255,41,0.15)"
        textColor="rgba(0,255,41,0.3)"
        headerText="NET_STATUS"
        align="right"
      />

      {/* Server rack LED blinks */}
      {ledBlinks.map(led => (
        <motion.div
          key={led.id}
          className="absolute rounded-full"
          style={{
            left: `${led.x}%`,
            top: `${led.y}%`,
            width: 3,
            height: 3,
            background: led.color,
            boxShadow: `0 0 4px ${led.color}, 0 0 8px ${led.color}`,
          }}
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: led.duration,
            delay: led.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Fluorescent light bar at top */}
      <motion.div
        className="absolute top-0 left-[15%] right-[15%] h-[2px]"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.3), rgba(148,163,184,0.5), rgba(148,163,184,0.3), transparent)',
          boxShadow: '0 0 20px rgba(148,163,184,0.2), 0 0 40px rgba(148,163,184,0.1)',
        }}
        animate={{ opacity: [1, 0.6, 1, 0.85, 1] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Scanline overlay for digital feel */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(148,163,184,0.015) 3px, rgba(148,163,184,0.015) 6px)',
        }}
      />
    </>
  );
});
