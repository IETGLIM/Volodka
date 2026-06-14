
/* ─── Volodka RPG – PanelWrapper ───
 *  Reusable wrapper for all game panels with:
 *  - Smooth slide-in animation from right
 *  - Backdrop blur effect
 *  - Terminal-style header with colored dots
 *  - Close button (X) with hover animation
 *  - Panel title with cyberpunk monospace font
 *  - Subtle glow border that pulses
 *  - Keyboard dismiss on Escape
 *  - Responsive: full-screen on mobile, centered card on desktop
 */

import { useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { FocusTrap } from '@/components/a11y/FocusTrap';
import { usePanelDialog } from '@/components/a11y/usePanelDialog';
import { usePanelId, usePanelStack } from '@/components/game/orchestrator/PanelStackContext';
import { usePanelExitComplete } from '@/components/game/orchestrator/PanelExitContext';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

/* ─── Accent color mapping ─── */
const ACCENT_MAP = {
  cyan: {
    border: 'rgb(var(--cyber-cyan-rgb) / 0.25)',
    glow: 'rgb(var(--cyber-cyan-rgb) / 0.06)',
    headerBg: 'rgb(var(--cyber-cyan-rgb) / 0.04)',
    dotColor: 'rgb(var(--cyber-cyan-rgb) / 0.30)',
    textGlow: '0 0 8px rgb(var(--cyber-cyan-rgb) / 0.3)',
    pulseBorder: '0 0 15px rgb(var(--cyber-cyan-rgb) / 0.08)',
  },
  emerald: {
    border: 'rgba(52,211,153,0.25)',
    glow: 'rgba(52,211,153,0.06)',
    headerBg: 'rgba(52,211,153,0.04)',
    dotColor: 'rgba(52,211,153,0.30)',
    textGlow: '0 0 8px rgba(52,211,153,0.3)',
    pulseBorder: '0 0 15px rgba(52,211,153,0.08)',
  },
  amber: {
    border: 'rgba(251,191,36,0.25)',
    glow: 'rgba(251,191,36,0.06)',
    headerBg: 'rgba(251,191,36,0.04)',
    dotColor: 'rgba(251,191,36,0.30)',
    textGlow: '0 0 8px rgba(251,191,36,0.3)',
    pulseBorder: '0 0 15px rgba(251,191,36,0.08)',
  },
  fuchsia: {
    border: 'rgba(217,70,239,0.25)',
    glow: 'rgba(217,70,239,0.06)',
    headerBg: 'rgba(217,70,239,0.04)',
    dotColor: 'rgba(217,70,239,0.30)',
    textGlow: '0 0 8px rgba(217,70,239,0.3)',
    pulseBorder: '0 0 15px rgba(217,70,239,0.08)',
  },
} as const;

export type AccentColor = keyof typeof ACCENT_MAP;

/* ─── Layout variants ─── */
export type PanelLayout = 'centered' | 'sidebar';

interface PanelWrapperProps {
  /** Whether the panel is open */
  open: boolean;
  /** Close handler */
  onClose: () => void;
  /** Panel title (displayed in header) */
  title: string;
  /** URL-like path shown in terminal header (e.g. "volodka://inventory") */
  urlPath?: string;
  /** Accent color for borders/glow */
  accentColor?: AccentColor;
  /** Layout mode: centered card or right sidebar */
  layout?: PanelLayout;
  /** Max width for centered layout */
  maxWidth?: string;
  /** Panel content */
  children: ReactNode;
  /** Optional icon rendered before title */
  icon?: ReactNode;
  /** Optional keyboard shortcut label */
  shortcutLabel?: string;
  /** Additional header content (right side) */
  headerExtra?: ReactNode;
  /** Optional footer content */
  footer?: ReactNode;
  /** Playwright / e2e hook */
  testId?: string;
}

/* ══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ══════════════════════════════════════════════════════════════ */
export function PanelWrapper({
  open,
  onClose,
  title,
  urlPath,
  accentColor = 'cyan',
  layout = 'centered',
  maxWidth = 'max-w-2xl',
  children,
  icon,
  shortcutLabel,
  headerExtra,
  footer,
  testId,
}: PanelWrapperProps) {
  const reducedMotion = useEffectiveReducedMotion();
  const { closeButtonRef, dialogProps, titleProps } = usePanelDialog();
  const accent = ACCENT_MAP[accentColor];
  const panelId = usePanelId();
  const { isTopPanel } = usePanelStack();
  const isTop = panelId == null || isTopPanel(panelId);
  const notifyPanelExit = usePanelExitComplete();

  /* Accent color for corner brackets (matches panel accent) */
  const cornerBorderColor = accentColor === 'emerald'
    ? 'rgba(52,211,153,0.25)'
    : accentColor === 'amber'
      ? 'rgba(251,191,36,0.25)'
      : accentColor === 'fuchsia'
        ? 'rgba(217,70,239,0.25)'
        : 'rgb(var(--cyber-cyan-rgb) / 0.25)';

  /* ── Escape key handler ── */
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open || !isTop) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        handleClose();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, isTop, handleClose]);

  const motionDuration = (seconds: number) => (reducedMotion ? 0 : seconds);

  /* ── Animation variants based on layout ── */
  const backdropInitial = reducedMotion ? false : { opacity: 0 };
  const backdropAnimate = { opacity: 1 };
  const backdropExit = reducedMotion ? undefined : { opacity: 0 };

  const panelVariants = reducedMotion
    ? {
        initial: false as const,
        animate: { x: 0, opacity: 1, scale: 1, y: 0 },
        exit: { opacity: 0 },
        transition: { duration: 0 },
      }
    : layout === 'sidebar'
      ? {
          initial: { x: '100%', opacity: 0.5 },
          animate: { x: 0, opacity: 1 },
          exit: { x: '100%', opacity: 0.5 },
          transition: { type: 'spring' as const, damping: 25, stiffness: 200 },
        }
      : {
          initial: { scale: 0.95, opacity: 0, y: 10 },
          animate: { scale: 1, opacity: 1, y: 0 },
          exit: { scale: 0.95, opacity: 0, y: 10 },
          transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] as [number, number, number, number] },
        };

  const resolvedUrl = urlPath ?? `volodka://${title.toLowerCase().replace(/\s+/g, '')}`;

  return (
    <AnimatePresence initial={false} onExitComplete={() => notifyPanelExit?.()}>
      {open && (
        <motion.div
          initial={backdropInitial}
          animate={backdropAnimate}
          exit={backdropExit}
          transition={{ duration: motionDuration(0.2) }}
          className={`fixed inset-0 ${layout === 'sidebar' ? '' : 'flex items-center justify-center'}`}
          style={{
            zIndex: panelId != null ? 1 : UI_LAYERS.PANEL,
            pointerEvents: isTop ? 'auto' : 'none',
            willChange: 'opacity',
          }}
        >
          {/* Backdrop — only the topmost panel dims the scene */}
          {isTop && (
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
            aria-hidden="true"
          />
          )}

          {/* Panel container */}
          <FocusTrap initialFocusRef={closeButtonRef}>
          <motion.div
            initial={panelVariants.initial}
            animate={panelVariants.animate}
            exit={panelVariants.exit}
            transition={panelVariants.transition}
            {...dialogProps}
            data-testid={testId}
            className={`
              relative z-10 overflow-hidden panel-slide-in digital-noise edge-glow
              ${layout === 'sidebar'
                ? 'fixed top-0 right-0 bottom-0 w-full sm:w-[34rem] h-full'
                : `w-full ${maxWidth} mx-4 max-h-[90vh] flex flex-col`
              }
            `}
            style={{
              willChange: 'transform, opacity',
              background: layout === 'sidebar'
                ? 'linear-gradient(180deg, rgba(8,12,28,0.97) 0%, rgba(4,8,18,0.98) 100%)'
                : 'linear-gradient(180deg, rgba(2,6,23,0.97) 0%, rgba(15,23,42,0.95) 50%, rgba(2,6,23,0.97) 100%)',
              borderLeft: layout === 'sidebar' ? `1px solid ${accent.border}` : 'none',
              border: layout === 'centered' ? `1px solid ${accent.border}` : undefined,
              borderRadius: layout === 'centered' ? '8px' : undefined,
              boxShadow: layout === 'sidebar'
                ? `-20px 0 40px rgba(0,0,0,0.5), inset 1px 0 0 ${accent.glow}`
                : `0 0 30px ${accent.glow}, 0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 ${accent.glow}`,
            }}
          >
            {/* Glow pulse — disabled when reduced motion is active */}
            {reducedMotion ? (
              <div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                style={{ boxShadow: `inset 0 0 8px ${accent.glow}`, opacity: 0.5 }}
              />
            ) : (
              <motion.div
                className="absolute inset-0 pointer-events-none rounded-[inherit]"
                animate={{ opacity: [0.35, 0.7, 0.35] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                style={{ boxShadow: `inset 0 0 8px ${accent.glow}` }}
              />
            )}

            {/* Data stream background pattern */}
            <div className="absolute inset-0 data-stream-bg hex-grid-bg pointer-events-none rounded-[inherit]" />

            {/* Scanline overlay */}
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] panel-scanlines" />

            {/* Corner bracket decorations */}
            <div className="corner-bracket corner-bracket-tl" style={{ borderTopColor: cornerBorderColor, borderLeftColor: cornerBorderColor }} />
            <div className="corner-bracket corner-bracket-tr" style={{ borderTopColor: cornerBorderColor, borderRightColor: cornerBorderColor }} />
            <div className="corner-bracket corner-bracket-bl" style={{ borderBottomColor: cornerBorderColor, borderLeftColor: cornerBorderColor }} />
            <div className="corner-bracket corner-bracket-br" style={{ borderBottomColor: cornerBorderColor, borderRightColor: cornerBorderColor }} />

            {/* Terminal header bar with holographic shimmer */}
            <div className="relative flex items-center gap-2 border-b bg-black/40 px-3 py-1.5 shrink-0" style={{ borderColor: `${accent.border}` }}>
              <div className="absolute inset-0 holo-shimmer pointer-events-none" />
              {/* Circuit trace line at header bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-px circuit-trace-line" />
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-amber-400/80" />
              <span className="h-1.5 w-1.5 rounded-full bg-red-500/80" />
              <span className="ml-2 font-mono text-[8px] uppercase tracking-[0.2em]" style={{ color: accent.dotColor }}>
                {resolvedUrl}
              </span>
            </div>

            {/* Header with title */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b shrink-0 relative"
              style={{
                borderColor: `${accent.border}`,
                background: 'rgba(0,0,0,0.3)',
              }}
            >
              <h2 {...titleProps} className="text-lg font-semibold text-slate-100 flex items-center gap-2 font-mono">
                {icon}
                <span style={{ textShadow: accent.textGlow }}>{title}</span>
              </h2>
              <div className="flex items-center gap-2">
                {headerExtra}
                {shortcutLabel && (
                  <span className="text-xs text-slate-600 font-mono hidden sm:block">[{shortcutLabel}]</span>
                )}
                <button
                  ref={closeButtonRef}
                  type="button"
                  onClick={handleClose}
                  className="close-btn-glow w-7 h-7 rounded-md flex items-center justify-center text-slate-400 hover:text-white transition-all duration-150 hover:rotate-90"
                  aria-label="Закрыть"
                >
                  <X className="size-4" />
                </button>
              </div>
            </div>

            {/* Content area */}
            <div className={`flex-1 overflow-hidden ${layout === 'sidebar' ? 'overflow-y-auto custom-scrollbar' : ''}`}>
              {children}
            </div>

            {/* Footer */}
            {footer && (
              <div
                className="px-4 py-2 border-t bg-black/20 shrink-0"
                style={{ borderColor: `${accent.border}` }}
              >
                {footer}
              </div>
            )}
          </motion.div>
          </FocusTrap>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
