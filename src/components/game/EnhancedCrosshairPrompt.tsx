'use client';

/* ─── Volodka RPG – Enhanced Crosshair Interaction Prompt ───
   Glowing ring, context-aware icons, distance fade, mobile version. */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, Hand, DoorOpen, Eye } from 'lucide-react';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamepadConnected } from '@/hooks/useGamepadConnected';
import { useTouchDevice } from '@/hooks/useTouchDevice';
import { formatInteractionHintKey } from '@/engine/exploration/explorationUxPresentation';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

function truncateLabel(label: string, max = 22): string {
  const trimmed = label.trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max - 1)}…`;
}

/** Map interaction type to icon class + component */
function ContextIcon({ type, size = 14 }: { type: string; size?: number }) {
  const cls = type === 'npc' ? 'eip-icon-npc'
    : type === 'item' ? 'eip-icon-item'
    : type === 'exit' ? 'eip-icon-door'
    : 'eip-icon-examine';

  const Icon = type === 'npc' ? MessageCircle
    : type === 'item' ? Hand
    : type === 'exit' ? DoorOpen
    : Eye;

  return (
    <div className={`eip-context-icon ${cls}`}>
      <Icon size={size} color="currentColor" />
    </div>
  );
}

export function EnhancedCrosshairPrompt() {
  const [visible, setVisible] = useState(false);
  const [promptKey, setPromptKey] = useState('E');
  const [label, setLabel] = useState<string | null>(null);
  const [hintType, setHintType] = useState<string>('npc');
  const [distance, setDistance] = useState(1);
  const reducedMotion = useEffectiveReducedMotion();
  const gamepadConnected = useGamepadConnected();
  const isTouchDevice = useTouchDevice();

  // Distance-based opacity: fade in from 4m, full at 2m
  const distanceOpacity = useMemo(() => {
    if (distance <= 2) return 1;
    if (distance >= 4) return 0.3;
    return 1 - ((distance - 2) / 2) * 0.7;
  }, [distance]);

  const ariaLabel = label ? `${promptKey} — ${label}` : `${promptKey} — взаимодействовать`;

  useEffect(() => {
    const unsubHint = eventBus.on('interaction:hint', (payload) => {
      setPromptKey(formatInteractionHintKey(payload.key, {
        gamepadConnected,
        touchDevice: isTouchDevice,
      }));
      setLabel(payload.label ? truncateLabel(payload.label) : null);
      setHintType(payload.type ?? 'npc');
      setDistance(payload.distance ?? 1);
      setVisible(true);
    });
    const unsubEnd = eventBus.on('interaction:end', () => setVisible(false));
    const unsubStart = eventBus.on('interaction:start', () => setVisible(false));
    return () => { unsubHint(); unsubEnd(); unsubStart(); };
  }, [gamepadConnected, isTouchDevice]);

  const isMobile = isTouchDevice;
  const showTouchHint = promptKey === 'touch';
  const labelMaxW = isMobile ? '10rem' : '9rem';
  const labelSize = isMobile ? 'text-sm' : 'text-[11px]';

  return (
    <div
      className="absolute top-1/2 left-1/2 pointer-events-none"
      style={{
        transform: `translate(-50%, ${isMobile ? 60 : 36}px)`,
        zIndex: UI_LAYERS.HUD,
      }}
      role="status"
      aria-live="polite"
      aria-label={visible ? ariaLabel : undefined}
    >
      <AnimatePresence>
        {visible && (
          <motion.div
            key="enhanced-interaction-prompt"
            initial={reducedMotion ? { opacity: 1 } : { opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: distanceOpacity, y: 0, scale: 1 }}
            exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: 6, scale: 0.97 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`relative ${isMobile ? 'eip-mobile-touch' : ''}`}
          >
            {/* Glowing ring */}
            {!reducedMotion && (
              <div className="eip-glow-ring" aria-hidden="true" />
            )}
            {!reducedMotion && (
              <div className="eip-glow-ring-sweep" aria-hidden="true" />
            )}

            {/* Content card */}
            <div
              className={`relative flex items-center gap-2.5 px-3 py-2 rounded-lg backdrop-blur-md border ${isMobile ? 'min-w-[180px]' : 'min-w-[7rem]'}`}
              style={{
                background: 'rgba(0, 0, 0, 0.75)',
                borderColor: 'rgba(0, 229, 255, 0.12)',
                boxShadow: '0 0 16px rgba(0, 229, 255, 0.06), 0 4px 12px rgba(0, 0, 0, 0.4)',
              }}
            >
              {/* Context icon */}
              <ContextIcon type={hintType} size={isMobile ? 18 : 14} />

              {/* Key badge */}
              <span
                className="font-mono text-xs font-bold text-cyan-400"
                style={{ textShadow: '0 0 8px rgba(0, 229, 255, 0.5)' }}
              >
                {showTouchHint ? '▲' : `[${promptKey}]`}
              </span>

              {/* Label */}
              {label ? (
                <span
                  className={`text-slate-200 ${labelSize} font-mono truncate`}
                  style={{ fontStyle: 'italic', maxWidth: labelMaxW }}
                >
                  {label}
                </span>
              ) : null}
            </div>

            {/* Bottom glow line */}
            <div
              className="absolute bottom-0 left-[20%] right-[20%] h-[1px]"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(0, 229, 255, 0.3), transparent)',
              }}
              aria-hidden="true"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
