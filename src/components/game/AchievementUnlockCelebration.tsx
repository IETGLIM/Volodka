'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useGameStore } from '@/store/gameStore';
import type { TrophyNotification } from '@/store/slices/achievementSlice';
import type { TrophyCategory } from '@/data/achievements';
import { AriaLiveRegion } from '@/components/a11y/AriaLiveRegion';

const AUTO_DISMISS_MS = 5000;

const CATEGORY_META: Record<TrophyCategory, { label: string; color: string }> = {
  story:       { label: 'Сюжет',       color: '#a78bfa' },
  combat:      { label: 'Бой',         color: '#f87171' },
  exploration: { label: 'Исследование', color: '#34d399' },
  poetry:      { label: 'Поэзия',      color: '#fbbf24' },
  social:      { label: 'Социальные',  color: '#60a5fa' },
};

/* ─── Particle burst (CSS-only) ─── */

function ParticleBurst({ color }: { color: string }) {
  const particles = Array.from({ length: 18 }, (_, i) => ({
    id: i,
    angle: (i / 18) * 360,
    delay: Math.random() * 0.3,
    size: 3 + Math.random() * 4,
    dist: 60 + Math.random() * 80,
  }));

  return (
    <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
      {particles.map((p) => (
        <span
          key={p.id}
          className="achievement-particle"
          style={{
            '--p-angle': `${p.angle}deg`,
            '--p-delay': `${p.delay}s`,
            '--p-size': `${p.size}px`,
            '--p-dist': `${p.dist}px`,
            '--p-color': color,
          } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* ─── Single celebration overlay ─── */

function CelebrationCard({
  notification,
  onDismiss,
}: {
  notification: TrophyNotification;
  onDismiss: () => void;
}) {
  const [dismissed, setDismissed] = useState(false);
  const trophy = notification.trophy;
  const meta = CATEGORY_META[trophy.category] ?? CATEGORY_META.story;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissed(true);
      setTimeout(onDismiss, 400);
    }, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const handleClick = useCallback(() => {
    setDismissed(true);
    setTimeout(onDismiss, 400);
  }, [onDismiss]);

  return (
    <>
      <AriaLiveRegion
        message={`Достижение разблокировано: ${trophy.name}. ${trophy.description}`}
        priority="assertive"
      />
      <motion.div
        className="fixed inset-0 flex items-center justify-center cursor-pointer"
        style={{ zIndex: UI_LAYERS.CINEMATIC_TRANSITION }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        onClick={handleClick}
        role="dialog"
        aria-label="Достижение разблокировано"
      >
        <div className="absolute inset-0 bg-black/60 backdrop-blur-sm achievement-celebration-overlay" />

        <motion.div
          className="relative flex flex-col items-center gap-4 px-8 py-6 rounded-2xl border glass-celebration"
          style={{
            borderColor: `${meta.color}55`,
            background: 'linear-gradient(145deg, rgba(15,23,42,0.92) 0%, rgba(0,0,0,0.95) 100%)',
            maxWidth: 'min(420px, 90vw)',
            boxShadow: `0 0 60px ${meta.color}20, 0 0 120px ${meta.color}10, 0 25px 60px rgba(0,0,0,0.6)`,
          }}
          initial={{ scale: 0.7, y: 30 }}
          animate={dismissed ? { scale: 0.85, opacity: 0, y: -20 } : { scale: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        >
          <ParticleBurst color={meta.color} />

          <div className="relative flex items-center justify-center">
            <div
              className="absolute w-24 h-24 rounded-full achievement-glow-burst"
              style={{ background: `radial-gradient(circle, ${meta.color}40 0%, transparent 70%)` }}
            />
            <div
              className="relative w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
              style={{
                background: `linear-gradient(135deg, ${meta.color}25 0%, ${meta.color}08 100%)`,
                boxShadow: `0 0 24px ${meta.color}30, inset 0 0 12px ${meta.color}15`,
                border: `1px solid ${meta.color}40`,
              }}
            >
              {trophy.icon}
            </div>
          </div>

          <div className="text-center">
            <div
              className="text-[10px] font-mono uppercase tracking-[0.25em] mb-1"
              style={{ color: `${meta.color}aa` }}
            >
              Достижение разблокировано!
            </div>
            <div
              className="text-xl font-bold font-mono"
              style={{ color: meta.color, textShadow: `0 0 12px ${meta.color}60` }}
            >
              {trophy.name}
            </div>
          </div>

          <div
            className="px-3 py-0.5 rounded-full text-[10px] font-mono uppercase tracking-wider"
            style={{
              background: `${meta.color}18`,
              border: `1px solid ${meta.color}30`,
              color: `${meta.color}cc`,
            }}
          >
            {meta.label}
          </div>

          <p className="text-sm text-slate-300 text-center max-w-xs leading-relaxed">
            {trophy.description}
          </p>

          <div className="text-[10px] text-slate-500 font-mono tracking-wider achievement-dismiss-hint">
            Нажмите чтобы закрыть
          </div>
        </motion.div>
      </motion.div>
    </>
  );
}

/* ─── Main export ─── */

export function AchievementUnlockCelebration() {
  const trophyNotifications = useGameStore((s) => s.trophyNotifications);
  const dismissTrophyNotification = useGameStore((s) => s.dismissTrophyNotification);

  const latest = trophyNotifications[trophyNotifications.length - 1] ?? null;

  const handleDismiss = useCallback(() => {
    if (latest) dismissTrophyNotification(latest.id);
  }, [latest, dismissTrophyNotification]);

  return (
    <AnimatePresence>
      {latest && (
        <CelebrationCard key={latest.id} notification={latest} onDismiss={handleDismiss} />
      )}
    </AnimatePresence>
  );
}
