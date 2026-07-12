import { useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cyberGlowText } from '@/components/game/CyberpunkTheme';
import type { ActivePowerNotification } from '@/components/game/poemPowerEffect/usePoemPowerEffectController';
import {
  generateMatrixRainColumns,
  generatePowerParticles,
  getDecorativeLineMotion,
  getOverlayEnterTransition,
  getSubtitleMotion,
  getTitleMotion,
  hexToRgba,
} from '@/engine/poemPower/poemPowerEffectPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

type PoemPowerEffectViewProps = {
  notification: ActivePowerNotification | null;
  reducedMotion: boolean;
  powerActivatedLabel: string;
};

function MatrixRain({
  notificationId,
  color,
  reducedMotion,
}: {
  notificationId: string;
  color: string;
  reducedMotion: boolean;
}) {
  const rainColumns = useMemo(
    () => generateMatrixRainColumns(color),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [color, notificationId],
  );

  if (reducedMotion) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none"
      style={{ opacity: 0.2, mixBlendMode: 'screen' as const }}
    >
      {rainColumns.map((col) => (
        <motion.div
          key={col.id}
          style={{
            position: 'absolute',
            left: col.x,
            top: '-10%',
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", monospace',
            fontSize: '13px',
            lineHeight: '15px',
          }}
          initial={{ y: 0, opacity: 0.8 }}
          animate={{ y: '110vh', opacity: 0 }}
          transition={{
            duration: col.duration,
            delay: col.delay,
            ease: 'linear',
          }}
        >
          {col.chars.map((char, ci) => (
            <div
              key={ci}
              style={{
                color: ci === col.charCount - 1 ? '#ffffff' : col.color,
                opacity:
                  ci === col.charCount - 1
                    ? 1
                    : Math.max(0.15, 1 - (col.charCount - 1 - ci) * 0.08),
                textShadow:
                  ci === col.charCount - 1 ? `0 0 8px ${col.color}` : 'none',
              }}
            >
              {char}
            </div>
          ))}
        </motion.div>
      ))}
    </div>
  );
}

function ParticleBurst({
  notificationId,
  color,
  reducedMotion,
}: {
  notificationId: string;
  color: string;
  reducedMotion: boolean;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
  const particles = useMemo(() => generatePowerParticles(), [notificationId]);

  if (reducedMotion) return null;

  return (
    <div aria-hidden="true" className="absolute inset-0 flex items-center justify-center">
      {particles.map((p) => (
        <motion.div
          key={`particle-${notificationId}-${p.id}`}
          className="absolute rounded-full"
          style={{
            width: p.size,
            height: p.size,
            background: hexToRgba(color, 0.9),
            boxShadow: `0 0 ${p.size * 2}px ${hexToRgba(color, 0.6)}`,
          }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
          animate={{
            x: Math.cos((p.angle * Math.PI) / 180) * p.distance,
            y: Math.sin((p.angle * Math.PI) / 180) * p.distance,
            opacity: 0,
            scale: 0.1,
          }}
          transition={{ duration: 1.3, delay: p.delay, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

export function PoemPowerEffectView({
  notification,
  reducedMotion,
  powerActivatedLabel,
}: PoemPowerEffectViewProps) {
  const color = notification?.color ?? '#00ffee';
  const colorRgba = (alpha: number) => hexToRgba(color, alpha);
  const titleMotion = getTitleMotion(reducedMotion);
  const actMotion = getSubtitleMotion(reducedMotion, 0.1);
  const subtitleMotion = getSubtitleMotion(reducedMotion, 0.15);
  const descriptionMotion = getSubtitleMotion(reducedMotion, 0.4);
  const lineMotion = getDecorativeLineMotion(reducedMotion);
  const overlayTransition = getOverlayEnterTransition(reducedMotion);

  return (
    <>
      <AnimatePresence>
        {notification && (
          <motion.div
            key={`overlay-${notification.id}`}
            aria-hidden="true"
            initial={{ opacity: reducedMotion ? 1 : 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={overlayTransition}
            className="fixed inset-0 pointer-events-none overflow-hidden"
            style={{ zIndex: UI_LAYERS.POEM_POWER_EFFECT }}
          >
            {!reducedMotion ? (
              <>
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0.9 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.6, ease: 'easeOut' }}
                  style={{
                    background: `radial-gradient(ellipse at center, ${colorRgba(0.35)} 0%, ${colorRgba(0.12)} 40%, transparent 70%)`,
                  }}
                />
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0.5 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 2.0, ease: 'easeOut' }}
                  style={{
                    background: `radial-gradient(ellipse at center, ${colorRgba(0.1)} 0%, transparent 60%)`,
                  }}
                />
                <motion.div
                  className="absolute inset-0"
                  initial={{ opacity: 0.6 }}
                  animate={{ opacity: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  style={{
                    background: `repeating-linear-gradient(0deg, transparent, transparent 2px, ${colorRgba(0.06)} 2px, ${colorRgba(0.06)} 4px)`,
                  }}
                />
              </>
            ) : (
              <div
                className="absolute inset-0"
                style={{
                  background: `radial-gradient(ellipse at center, ${colorRgba(0.12)} 0%, transparent 65%)`,
                }}
              />
            )}

            <MatrixRain
              notificationId={notification.id}
              color={notification.color}
              reducedMotion={reducedMotion}
            />
            <ParticleBurst
              notificationId={notification.id}
              color={notification.color}
              reducedMotion={reducedMotion}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {notification && (
          <motion.div
            key={`text-${notification.id}`}
            role="status"
            aria-live="polite"
            aria-atomic="true"
            className="fixed inset-0 flex items-center justify-center pointer-events-none"
            style={{ zIndex: UI_LAYERS.POEM_POWER_EFFECT_LABEL }}
          >
            <span className="sr-only">{notification.screenReaderMessage}</span>
            <div className="relative text-center px-8" aria-hidden="true">
              {!reducedMotion && (
                <motion.div
                  className="absolute inset-0 -m-16 rounded-2xl pointer-events-none"
                  style={{
                    background: `radial-gradient(ellipse, ${colorRgba(0.08)} 0%, transparent 70%)`,
                    filter: 'blur(30px)',
                  }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.5 }}
                />
              )}

              <motion.p
                className="font-mono text-[10px] sm:text-xs tracking-[0.4em] uppercase mb-3"
                style={{ color: colorRgba(0.5) }}
                initial={actMotion.initial}
                animate={actMotion.animate}
                exit={actMotion.exit}
                transition={actMotion.transition}
              >
                {notification.actLabel}
              </motion.p>

              <motion.p
                className="font-mono text-[10px] sm:text-xs tracking-[0.2em] uppercase mb-2"
                style={{ color: colorRgba(0.6) }}
                initial={subtitleMotion.initial}
                animate={subtitleMotion.animate}
                exit={subtitleMotion.exit}
                transition={subtitleMotion.transition}
              >
                {powerActivatedLabel}
              </motion.p>

              <motion.h2
                className="font-mono text-3xl sm:text-5xl md:text-6xl font-black tracking-[0.05em] leading-tight"
                style={{
                  color: notification.color,
                  textShadow: cyberGlowText(notification.color),
                }}
                initial={titleMotion.initial}
                animate={titleMotion.animate}
                exit={titleMotion.exit}
                transition={titleMotion.transition}
              >
                {notification.powerName}
              </motion.h2>

              <motion.div
                className="mt-4 h-[1px] mx-auto"
                style={{
                  background: `linear-gradient(90deg, transparent, ${colorRgba(0.5)}, transparent)`,
                }}
                initial={lineMotion.initial}
                animate={lineMotion.animate}
                exit={lineMotion.exit}
                transition={lineMotion.transition}
              />

              <motion.p
                className="font-mono text-xs sm:text-sm mt-3 max-w-sm mx-auto"
                style={{ color: colorRgba(0.55) }}
                initial={descriptionMotion.initial}
                animate={descriptionMotion.animate}
                exit={descriptionMotion.exit}
                transition={descriptionMotion.transition}
              >
                {notification.powerDescription}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
