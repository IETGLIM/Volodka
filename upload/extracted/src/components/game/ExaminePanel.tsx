'use client';

/* ─── Volodka RPG – Examine Panel ───
 *  When the player interacts with an object that has examineData, this panel shows:
 *  - Object name and description
 *  - A 3D-like rotating view (styled card with CSS transforms)
 *  - Flavor text about the object
 *  - Hint to press E again for more interaction (dialogue/story)
 *  - Close button (Escape or click)
 */

import { useEffect, useState, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ExamineData } from '@/shared/types/game';
import { UI_LAYERS } from '@/shared/constants/uiLayers';

interface ExaminePanelProps {
  open: boolean;
  data: ExamineData | null;
  onClose: () => void;
  /** Whether this object has a linked dialogue/story (shows "Press E again" hint) */
  hasLinkedContent?: boolean;
}

export function ExaminePanel({ open, data, onClose, hasLinkedContent }: ExaminePanelProps) {
  const [rotation, setRotation] = useState(0);
  const rotationRef = useRef(0);

  // Animate the card rotation with requestAnimationFrame for smooth 60fps
  useEffect(() => {
    if (!open) return;
    let rafId: number;
    let lastTime = 0;

    const animate = (timestamp: number) => {
      if (lastTime > 0) {
        const delta = timestamp - lastTime;
        // 0.5 degrees per 30ms = ~16.67 deg/s
        rotationRef.current += (delta / 30) * 0.5;
        setRotation(rotationRef.current);
      }
      lastTime = timestamp;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  if (!data) return null;

  const icon = data.icon || '🔍';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 flex items-center justify-center"
          style={{ zIndex: UI_LAYERS.EXAMINE }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="relative z-10 w-full max-w-md mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="relative overflow-hidden rounded-lg border"
              style={{
                background: 'linear-gradient(145deg, rgba(10,15,25,0.95) 0%, rgba(5,8,15,0.98) 100%)',
                borderColor: 'rgba(0, 255, 238, 0.2)',
                boxShadow: '0 0 30px rgba(0, 255, 238, 0.08), 0 0 60px rgba(0, 255, 238, 0.04)',
              }}
            >
              {/* Scanline overlay */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{
                  background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,255,238,0.015) 2px, rgba(0,255,238,0.015) 4px)',
                }}
              />

              {/* Top accent line */}
              <div
                className="h-[2px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, #00ffee, transparent)',
                }}
              />

              <div className="p-6">
                {/* 3D-like rotating card */}
                <div className="flex justify-center mb-5">
                  <div
                    style={{
                      perspective: '600px',
                    }}
                  >
                    <div
                      style={{
                        transform: `rotateY(${Math.sin(rotation * 0.02) * 15}deg) rotateX(${Math.cos(rotation * 0.015) * 8}deg)`,
                        transition: 'transform 0.1s ease-out',
                        width: '140px',
                        height: '140px',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(0,255,238,0.08), rgba(0,255,238,0.02))',
                        border: '1px solid rgba(0,255,238,0.15)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '48px',
                        boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(0,255,238,0.05)',
                      }}
                    >
                      {icon}
                    </div>
                  </div>
                </div>

                {/* Title */}
                <h2
                  className="text-center text-xl font-bold mb-2"
                  style={{
                    color: '#00ffee',
                    fontFamily: 'monospace',
                    textShadow: '0 0 10px rgba(0,255,238,0.3)',
                  }}
                >
                  {data.title}
                </h2>

                {/* Description */}
                <p
                  className="text-center text-sm mb-4"
                  style={{
                    color: 'rgba(200,210,220,0.9)',
                    lineHeight: '1.6',
                  }}
                >
                  {data.description}
                </p>

                {/* Divider */}
                <div
                  className="h-[1px] mb-4"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(0,255,238,0.3), transparent)',
                  }}
                />

                {/* Detail text (flavor) */}
                <p
                  className="text-sm leading-relaxed"
                  style={{
                    color: 'rgba(170,185,200,0.8)',
                    fontStyle: 'italic',
                    lineHeight: '1.7',
                  }}
                >
                  {data.detailText}
                </p>

                {/* Close hint */}
                <div className="mt-5 text-center flex flex-col gap-1.5">
                  {hasLinkedContent && (
                    <span
                      className="text-xs"
                      style={{
                        color: 'rgba(0,255,238,0.6)',
                        fontFamily: 'monospace',
                      }}
                    >
                      [E] продолжить взаимодействие
                    </span>
                  )}
                  <span
                    className="text-xs"
                    style={{
                      color: 'rgba(0,255,238,0.4)',
                      fontFamily: 'monospace',
                    }}
                  >
                    [ESC] закрыть
                  </span>
                </div>
              </div>

              {/* Bottom accent line */}
              <div
                className="h-[1px]"
                style={{
                  background: 'linear-gradient(90deg, transparent, #00ffee, transparent)',
                }}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
