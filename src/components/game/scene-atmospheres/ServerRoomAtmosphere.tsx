'use client';

import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import { TerminalWindowOverlay } from './TerminalWindowOverlay';

export const ServerRoomAtmosphere = memo(function ServerRoomAtmosphere() {
  const terminalLines = useMemo(() => [
    '> ssh root@node-7',
    '> Authentication OK',
    '> sysctl -w net.ipv4.forward=1',
    '> docker ps -a | grep api',
    '> api_server    Up 3 days   0.0.0.0:8080',
    '> tail -f /var/log/syslog',
    '> [UFW BLOCK] SRC=10.0.0.42',
    '> ping gateway -c 4',
    '> 64 bytes: icmp_seq=1 ttl=64',
    '> systemctl status nginx',
    '> active (running) since Mon',
    '> crontab -l | head -5',
  ], []);

  const leds = useMemo(() =>
    Array.from({ length: 24 }, (_, i) => ({
      id: i,
      x: 65 + (i % 6) * 4.5,
      y: 10 + Math.floor(i / 6) * 22,
      delay: Math.random() * 2,
      duration: 0.5 + Math.random() * 3,
      color: i % 4 === 0 ? '#ff8c00' : '#00ff41',
    })),
  []);

  return (
    <>
      {/* Terminal window overlay */}
      <TerminalWindowOverlay
        lines={terminalLines}
        x={3}
        y={15}
        width={200}
        height={200}
        borderColor="rgba(0,255,41,0.2)"
        textColor="rgba(0,255,41,0.35)"
        headerText="ROOT@SERVER-7"
      />

      {/* LED indicators - server rack */}
      {leds.map(led => (
        <motion.div
          key={led.id}
          className="absolute rounded-full"
          style={{
            left: `${led.x}%`,
            top: `${led.y}%`,
            width: 3,
            height: 3,
            background: led.color,
            boxShadow: `0 0 3px ${led.color}, 0 0 6px ${led.color}`,
          }}
          animate={{
            opacity: [0.2, 1, 0.2],
          }}
          transition={{
            duration: led.duration,
            delay: led.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Server rack vertical lines */}
      {[68, 73, 78, 83].map((x, i) => (
        <div
          key={i}
          className="absolute"
          style={{
            left: `${x}%`,
            top: '8%',
            width: 1,
            height: '80%',
            background: 'linear-gradient(180deg, rgba(0,255,41,0.04), rgba(0,255,41,0.02), rgba(0,255,41,0.04))',
          }}
        />
      ))}

      {/* Green ambient glow */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 75% 40%, rgba(0,255,41,0.04) 0%, transparent 50%)',
        }}
        animate={{ opacity: [1, 0.6, 1] }}
        transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* CRT scanlines */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,41,0.01) 2px, rgba(0,255,41,0.01) 4px)',
        }}
      />
    </>
  );
});
