'use client';

/* ══════════════════════════════════════════════════════════════════════════════
   Volodka RPG — Enhanced Tooltip System
   Mouse-following · variant colors · glass morphism · keyboard accessible
   ══════════════════════════════════════════════════════════════════════════════ */

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ReactNode,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

/* ── Variant types & colors ────────────────────────────────────────────────── */

export type TooltipVariant = 'info' | 'warning' | 'danger' | 'success' | 'lore';

interface VariantStyle {
  accent: string;
  accentRgb: string;
  border: string;
  tagBg: string;
}

const VARIANT_STYLES: Record<TooltipVariant, VariantStyle> = {
  info:    { accent: '#00e5ff', accentRgb: '0,229,255',   border: 'rgba(0,229,255,0.2)',   tagBg: 'rgba(0,229,255,0.1)' },
  warning: { accent: '#fbbf24', accentRgb: '251,191,36',  border: 'rgba(251,191,36,0.2)',  tagBg: 'rgba(251,191,36,0.1)' },
  danger:  { accent: '#f87171', accentRgb: '248,113,113', border: 'rgba(248,113,113,0.2)', tagBg: 'rgba(248,113,113,0.1)' },
  success: { accent: '#34d399', accentRgb: '52,211,153',  border: 'rgba(52,211,153,0.2)',  tagBg: 'rgba(52,211,153,0.1)' },
  lore:    { accent: '#c084fc', accentRgb: '192,132,252', border: 'rgba(192,132,252,0.2)', tagBg: 'rgba(192,132,252,0.1)' },
};

/* ── Tooltip content shape ─────────────────────────────────────────────────── */

export interface TooltipContent {
  title?: string;
  description?: string;
  icon?: ReactNode;
  tags?: string[];
}

/* ── Props ─────────────────────────────────────────────────────────────────── */

export interface EnhancedTooltipProps {
  content: TooltipContent;
  variant?: TooltipVariant;
  /** Trigger element; the tooltip appears on hover/focus of this element. */
  children: ReactNode;
  /** Offset from cursor in px (default 12) */
  offset?: number;
  /** Max width in px (default 280) */
  maxWidth?: number;
  /** Whether to show directional arrow toward trigger */
  showArrow?: boolean;
  /** Disable the tooltip */
  disabled?: boolean;
}

/* ── Placement helpers ─────────────────────────────────────────────────────── */

type Placement = 'top' | 'bottom' | 'left' | 'right';

function computePlacement(
  mouseX: number,
  mouseY: number,
  tipWidth: number,
  tipHeight: number,
  offset: number,
): Placement {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const spaceRight = vw - mouseX;
  const spaceLeft = mouseX;
  const spaceBottom = vh - mouseY;
  const spaceTop = mouseY;

  const fitsRight = spaceRight >= tipWidth + offset;
  const fitsLeft = spaceLeft >= tipWidth + offset;
  const fitsBottom = spaceBottom >= tipHeight + offset;
  const fitsTop = spaceTop >= tipHeight + offset;

  if (fitsBottom && tipWidth <= spaceRight - offset) return 'bottom';
  if (fitsTop && tipWidth <= spaceRight - offset) return 'top';
  if (fitsRight) return 'right';
  if (fitsLeft) return 'left';
  if (fitsBottom) return 'bottom';
  return 'top';
}

function placementOffset(placement: Placement, offset: number, tipW: number, tipH: number) {
  switch (placement) {
    case 'top':    return { x: -tipW / 2, y: -tipH - offset };
    case 'bottom': return { x: -tipW / 2, y: offset };
    case 'left':   return { x: -tipW - offset, y: -tipH / 2 };
    case 'right':  return { x: offset, y: -tipH / 2 };
  }
}

/* ── Arrow component ───────────────────────────────────────────────────────── */

function Arrow({ placement, accent }: { placement: Placement; accent: string }) {
  const size = 6;
  const rot: Record<Placement, number> = { top: 180, bottom: 0, left: -90, right: 90 };

  return (
    <div
      className="absolute pointer-events-none"
      style={{
        width: size * 2,
        height: size * 2,
        left: placement === 'left' ? -size : placement === 'right' ? '100%' : 'calc(50% - ' + size + 'px)',
        top: placement === 'top' ? '100%' : placement === 'bottom' ? -size * 2 : 'calc(50% - ' + size + 'px)',
        transform: `rotate(${rot[placement]}deg)`,
      }}
    >
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderBottom: `${size}px solid rgba(0,8,16,0.85)`,
        }}
      />
      <div
        className="absolute"
        style={{
          top: 1,
          left: -size,
          width: 0,
          height: 0,
          borderLeft: `${size}px solid transparent`,
          borderRight: `${size}px solid transparent`,
          borderBottom: `${size}px solid ${accent}`,
          opacity: 0.3,
        }}
      />
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */

export function EnhancedTooltip({
  content,
  variant = 'info',
  children,
  offset = 12,
  maxWidth = 280,
  showArrow = true,
  disabled = false,
}: EnhancedTooltipProps) {
  const [visible, setVisible] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [placement, setPlacement] = useState<Placement>('bottom');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tipRef = useRef<HTMLDivElement>(null);
  const vs = VARIANT_STYLES[variant];

  const show = useCallback(() => { if (!disabled) setVisible(true); }, [disabled]);
  const hide = useCallback(() => setVisible(false), []);

  /* Mouse move → follow cursor */
  useEffect(() => {
    if (!visible) return;
    const onMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', onMove, { passive: true });
    return () => window.removeEventListener('mousemove', onMove);
  }, [visible]);

  /* Recompute placement on mouse move */
  useEffect(() => {
    if (!visible || !tipRef.current) return;
    const rect = tipRef.current.getBoundingClientRect();
    setPlacement(computePlacement(mousePos.x, mousePos.y, rect.width, rect.height, offset));
  }, [visible, mousePos, offset]);

  const tipPos = placementOffset(placement, offset, maxWidth, 120);

  const hasContent = content.title || content.description || content.tags?.length || content.icon;

  return (
    <>
      {/* Trigger */}
      <div
        ref={triggerRef}
        onMouseEnter={show}
        onMouseLeave={hide}
        onFocus={show}
        onBlur={hide}
        style={{ display: 'inline-flex' }}
      >
        {children}
      </div>

      {/* Tooltip portal */}
      <AnimatePresence>
        {visible && hasContent && (
          <motion.div
            ref={tipRef}
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="fixed pointer-events-none"
            style={{
              left: mousePos.x + tipPos.x,
              top: mousePos.y + tipPos.y,
              zIndex: UI_LAYERS.TOOLTIP,
              maxWidth,
            }}
            role="tooltip"
          >
            <div
              className="rounded-md p-3"
              style={{
                background: 'rgba(0,8,16,0.85)',
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${vs.border}`,
                boxShadow: `0 0 16px rgba(${vs.accentRgb},0.08), 0 4px 20px rgba(0,0,0,0.5), inset 0 0 12px rgba(0,0,0,0.3)`,
              }}
            >
              {/* Accent line top */}
              <div
                className="absolute top-0 left-3 right-3 h-px"
                style={{ background: `linear-gradient(90deg, transparent, rgba(${vs.accentRgb},0.3), transparent)` }}
              />

              {/* Header row (icon + title) */}
              {(content.title || content.icon) && (
                <div className="flex items-start gap-2 mb-1.5">
                  {content.icon && (
                    <div className="shrink-0 mt-0.5" style={{ color: vs.accent }}>
                      {content.icon}
                    </div>
                  )}
                  {content.title && (
                    <span
                      className="text-sm font-semibold leading-tight"
                      style={{
                        color: vs.accent,
                        textShadow: `0 0 8px rgba(${vs.accentRgb},0.3)`,
                      }}
                    >
                      {content.title}
                    </span>
                  )}
                </div>
              )}

              {/* Description */}
              {content.description && (
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'rgba(203,213,225,0.85)' }}
                >
                  {content.description}
                </p>
              )}

              {/* Tags */}
              {content.tags && content.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {content.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-1.5 py-0.5 rounded text-[10px] font-mono tracking-wider"
                      style={{
                        background: vs.tagBg,
                        color: vs.accent,
                        border: `1px solid ${vs.border}`,
                      }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Arrow */}
              {showArrow && <Arrow placement={placement} accent={vs.border} />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
