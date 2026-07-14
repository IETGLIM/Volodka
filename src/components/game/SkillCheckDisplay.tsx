'use client';

/* ─── Skill Check Display — cyberpunk skill check result overlay ─── */

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { eventBus } from '@/engine/EventBus';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import type { TrainablePlayerSkill } from '@/shared/types/definitions/skills';

/** Auto-dismiss timeout in ms. */
const AUTO_DISMISS_MS = 3000;

/** Maximum displayed skill level for the bar width calculation. */
const MAX_DISPLAY_LEVEL = 10;

/** Bar fill animation duration in seconds. */
const FILL_DURATION_S = 0.6;

interface SkillCheckData {
  skill: TrainablePlayerSkill;
  skillLabel: string;
  required: number;
  actual: number;
  passed: boolean;
  key: number;
}

/**
 * Displays a cyberpunk-styled skill check result when the player attempts
 * an interaction that requires a specific skill level.
 *
 * Listens to `skill:check` on the EventBus.
 * Shows: skill name, required level, player's current level, pass/fail.
 * Bar fills from left to right, then shows the result.
 * Auto-dismisses after 3 seconds.
 */
export function SkillCheckDisplay() {
  const reducedMotion = useEffectiveReducedMotion();
  const [check, setCheck] = useState<SkillCheckData | null>(null);
  const keyCounter = useRef(0);
  const dismissTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [barReady, setBarReady] = useState(false);

  const clearDismissTimer = useCallback(() => {
    if (dismissTimerRef.current != null) {
      clearTimeout(dismissTimerRef.current);
      dismissTimerRef.current = null;
    }
  }, []);

  const dismiss = useCallback(() => {
    clearDismissTimer();
    setCheck(null);
    setBarReady(false);
  }, [clearDismissTimer]);

  const showCheck = useCallback(
    (payload: { skill: TrainablePlayerSkill; skillLabel: string; required: number; actual: number; passed: boolean }) => {
      clearDismissTimer();
      keyCounter.current += 1;
      setBarReady(false);
      setCheck({ ...payload, key: keyCounter.current });

      // Trigger bar fill animation after mount
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setBarReady(true);
        });
      });
    },
    [clearDismissTimer],
  );

  /* ── Auto-dismiss ── */
  useEffect(() => {
    if (!check || !barReady) return;
    dismissTimerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearDismissTimer();
  }, [check, barReady, dismiss, clearDismissTimer]);

  /* ── Listen to EventBus ── */
  useEffect(() => {
    const unsub = eventBus.on('ui:skill_check', (payload) => {
      showCheck(payload);
    });
    return unsub;
  }, [showCheck]);

  if (!check) return null;

  const passColor = '#22d3ee'; /* cyan for pass */
  const failColor = '#ef4444'; /* red for fail */
  const accentColor = check.passed ? passColor : failColor;
  const barWidth = Math.min(check.actual / MAX_DISPLAY_LEVEL, 1) * 100;
  const thresholdPosition = Math.min(check.required / MAX_DISPLAY_LEVEL, 1) * 100;

  return (
    <AnimatePresence>
      {check && (
        <motion.div
          key={`skill-check-${check.key}`}
          data-testid="skill-check-display"
          className="fixed left-0 right-0 flex justify-center pointer-events-none px-4"
          style={{ zIndex: UI_LAYERS.TOASTS + 1, top: '18%' }}
          initial={reducedMotion ? false : { opacity: 0, y: -20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={reducedMotion ? { opacity: 0 } : { opacity: 0, y: -12 }}
          transition={{ duration: reducedMotion ? 0 : 0.3, ease: 'easeOut' }}
        >
          <div
            className={`relative w-full max-w-[360px] rounded-lg p-4 ${!check.passed ? 'cyber-damage-flash active' : ''}`}
            style={{
              background: 'rgba(8, 12, 20, 0.85)',
              backdropFilter: 'blur(12px)',
              border: `1px solid ${accentColor}40`,
              boxShadow: `0 0 24px ${accentColor}15, inset 0 0 24px ${accentColor}08`,
            }}
          >
            {/* ── Header ── */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-mono tracking-wider" style={{ color: accentColor }}>
                {check.passed ? '✓ ПРОВЕРКА ПРОЙДЕНА' : '✗ ПРОВЕРКА НЕ ПРОЙДЕНА'}
              </span>
              <span className="text-xs font-mono text-slate-500">SKILL.CHECK</span>
            </div>

            {/* ── Skill name ── */}
            <p className="text-sm font-mono text-slate-200 mb-1">{check.skillLabel}</p>
            <p className="text-xs font-mono text-slate-500 mb-3">
              Уровень: {check.actual} / требуется: {check.required}
            </p>

            {/* ── Bar ── */}
            <div
              className="relative h-3 rounded-full overflow-visible"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              {/* Fill bar */}
              <motion.div
                className="absolute top-0 left-0 h-full rounded-full"
                style={{
                  background: check.passed
                    ? `linear-gradient(90deg, ${passColor}80, ${passColor})`
                    : `linear-gradient(90deg, ${failColor}80, ${failColor})`,
                  boxShadow: `0 0 8px ${accentColor}40`,
                }}
                initial={reducedMotion ? { width: `${barWidth}%` } : { width: '0%' }}
                animate={{ width: `${barWidth}%` }}
                transition={{
                  duration: reducedMotion ? 0 : FILL_DURATION_S,
                  ease: 'easeOut',
                  delay: reducedMotion ? 0 : 0.15,
                }}
              />
              {/* Threshold marker */}
              <div
                className="absolute top-[-3px] h-[calc(100%+6px)] w-0.5"
                style={{
                  left: `${thresholdPosition}%`,
                  backgroundColor: '#ffffff90',
                  boxShadow: '0 0 4px rgba(255,255,255,0.3)',
                }}
              />
            </div>

            {/* ── Threshold label ── */}
            <div className="flex justify-end mt-1">
              <span
                className="text-[10px] font-mono"
                style={{ color: 'rgba(255,255,255,0.35)', marginRight: `calc(${100 - thresholdPosition}% - 12px)` }}
              >
                ▼ порог
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}