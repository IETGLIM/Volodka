
/* ─── Volodka RPG – System alerts (save/load failures, recovery) ─── */

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Save, RotateCcw } from 'lucide-react';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { bottomCraftingToastPx } from '@/shared/constants/hudLayout';
import { useNotificationSlot, NOTIFY_PRIORITY } from '@/hooks/useNotificationSlot';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useGamePhase } from '@/store/selectors';
import { useMobileDetection } from './orchestrator/useMobileDetection';
import {
  getSystemAlertDurationMs,
  getSystemAlertTitle,
  type SystemAlertKind,
} from '@/engine/system/systemPresentation';

interface SystemAlertData {
  id: string;
  kind: SystemAlertKind;
  message: string;
}

const ACCENT: Record<SystemAlertKind, { primary: string; border: string; bg: string; glow: string }> = {
  save_failed: {
    primary: '#fb7185',
    border: 'rgba(251, 113, 133, 0.35)',
    bg: 'rgba(30, 12, 16, 0.88)',
    glow: 'rgba(251, 113, 133, 0.12)',
  },
  load_failed: {
    primary: '#f87171',
    border: 'rgba(248, 113, 113, 0.35)',
    bg: 'rgba(28, 10, 10, 0.88)',
    glow: 'rgba(248, 113, 113, 0.12)',
  },
  load_recovered: {
    primary: '#fbbf24',
    border: 'rgba(251, 191, 36, 0.35)',
    bg: 'rgba(20, 16, 8, 0.88)',
    glow: 'rgba(251, 191, 36, 0.12)',
  },
};

let nextId = 0;

function AlertIcon({ kind, color }: { kind: SystemAlertKind; color: string }) {
  switch (kind) {
    case 'save_failed':
      return <Save className="size-4" style={{ color }} />;
    case 'load_failed':
      return <AlertTriangle className="size-4" style={{ color }} />;
    case 'load_recovered':
      return <RotateCcw className="size-4" style={{ color }} />;
    default: {
      const _exhaustive: never = kind;
      return _exhaustive;
    }
  }
}

export function GameSystemToast() {
  const [alert, setAlert] = useState<SystemAlertData | null>(null);
  const reducedMotion = useEffectiveReducedMotion();
  const isMobile = useMobileDetection();
  const mode = useGamePhase();
  const slotGranted = useNotificationSlot('system', NOTIFY_PRIORITY.system, alert !== null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const dismiss = useCallback(() => {
    setAlert(null);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const unsub = eventBus.on('game:system_alert', (payload) => {
      const id = `system-alert-${++nextId}`;
      setAlert({ id, kind: payload.kind, message: payload.message });
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(dismiss, getSystemAlertDurationMs(payload.kind));
    }, EventBusPriority.UI);
    return () => {
      unsub();
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [dismiss]);

  if (mode === 'menu' || mode === 'intro') return null;
  if (!slotGranted || !alert) return null;

  const accent = ACCENT[alert.kind];
  const durationMs = getSystemAlertDurationMs(alert.kind);

  return (
    <div
      className="fixed left-3 sm:left-4 pointer-events-none"
      data-exploration-ui
      data-testid="game-system-toast"
      style={{ bottom: bottomCraftingToastPx(isMobile) + 56, zIndex: UI_LAYERS.TOASTS }}
    >
      <AnimatePresence mode="wait">
        <motion.div
          key={alert.id}
          role="alert"
          className="pointer-events-auto relative overflow-hidden max-w-[320px]"
          style={{
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            background: accent.bg,
            border: `1px solid ${accent.border}`,
            borderRadius: '8px',
            boxShadow: `0 0 12px ${accent.glow}`,
          }}
          initial={reducedMotion ? false : { opacity: 0, x: -48, scale: 0.94 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={reducedMotion ? undefined : { opacity: 0, x: -32, scale: 0.94 }}
          transition={{ duration: reducedMotion ? 0 : 0.35 }}
          onClick={dismiss}
        >
          <div className="flex items-start gap-3 px-4 py-3">
            <div
              className="flex items-center justify-center w-8 h-8 shrink-0 rounded"
              style={{ background: `${accent.primary}18` }}
            >
              <AlertIcon kind={alert.kind} color={accent.primary} />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-mono font-bold tracking-wide" style={{ color: accent.primary }}>
                {getSystemAlertTitle(alert.kind)}
              </p>
              <p className="text-[10px] font-mono text-slate-400 mt-0.5 leading-relaxed">
                {alert.message}
              </p>
            </div>
          </div>
          <motion.div
            className="absolute bottom-0 left-0 h-[2px]"
            style={{ background: accent.primary }}
            initial={{ width: '100%' }}
            animate={{ width: reducedMotion ? '0%' : '0%' }}
            transition={{ duration: reducedMotion ? 0 : durationMs / 1000, ease: 'linear' }}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
