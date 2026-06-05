
/* ─── Volodka RPG – Examine Panel ───
 *  When the player interacts with an object that has examineData, this panel shows:
 *  - Object name and description
 *  - A 3D-like rotating view (styled card with CSS transforms)
 *  - Flavor text about the object
 *  - "Continue" button to trigger linked content (dialogue/story/minigame)
 *  - Close via Escape, backdrop click, or header X (PanelWrapper)
 */

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight } from 'lucide-react';
import type { ExamineData } from '@/shared/types/game';
import { PanelWrapper } from './PanelWrapper';

interface ExaminePanelProps {
  open: boolean;
  data: ExamineData | null;
  onClose: () => void;
  /** Whether this object has a linked dialogue/story (shows "Continue" button) */
  hasLinkedContent?: boolean;
  /** Callback to trigger the linked content when user clicks "Continue" or presses E */
  onContinue?: () => void;
}

export function ExaminePanel({ open, data, onClose, hasLinkedContent, onContinue }: ExaminePanelProps) {
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
        rotationRef.current += (delta / 30) * 0.5;
        setRotation(rotationRef.current);
      }
      lastTime = timestamp;
      rafId = requestAnimationFrame(animate);
    };
    rafId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafId);
  }, [open]);

  // E key for Continue — capture phase so 3D interaction system does not re-fire
  useEffect(() => {
    if (!open || !hasLinkedContent || !onContinue) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return;
      e.preventDefault();
      e.stopPropagation();
      (window as Window & { __volodka_ekey_consumed?: boolean }).__volodka_ekey_consumed = true;
      setTimeout(() => {
        (window as Window & { __volodka_ekey_consumed?: boolean }).__volodka_ekey_consumed = false;
      }, 300);
      onContinue();
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, hasLinkedContent, onContinue]);

  // ESC: consume before GameOrchestrator pause-menu handler (React 19 sync flush race)
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.code !== 'Escape') return;
      e.preventDefault();
      e.stopImmediatePropagation();
      onClose();
    };
    window.addEventListener('keydown', handleKey, true);
    return () => window.removeEventListener('keydown', handleKey, true);
  }, [open, onClose]);

  if (!data) return null;

  const icon = data.icon || '🔍';

  return (
    <PanelWrapper
      open={open}
      onClose={onClose}
      title={data.title}
      urlPath="volodka://inspect"
      accentColor="cyan"
      maxWidth="max-w-md"
      shortcutLabel="ESC"
      icon={<span className="text-lg leading-none">{icon}</span>}
      footer={
        <div className="flex flex-col gap-2">
          {hasLinkedContent && onContinue && (
            <motion.button
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: 0.1 }}
              onClick={onContinue}
              className="group w-full relative text-left px-4 py-2.5 rounded-lg border border-cyan-500/40 bg-cyan-950/30 hover:border-cyan-400/60 hover:bg-cyan-900/30 transition-all duration-200 overflow-hidden cursor-pointer"
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-2">
                <ChevronRight className="size-4 text-cyan-400" />
                <span className="text-sm font-medium text-cyan-300 font-mono">Продолжить</span>
                <span className="ml-auto text-xs font-mono text-cyan-500/60">[E]</span>
              </div>
            </motion.button>
          )}
          <p className="text-center text-[10px] text-slate-600 font-mono">[ESC] закрыть · клик по фону</p>
        </div>
      }
    >
      <div className="px-5 py-5 overflow-y-auto custom-scrollbar max-h-[60vh]">
        {/* 3D-like rotating card */}
        <div className="flex justify-center mb-5">
          <div style={{ perspective: '600px' }}>
            <div
              className="flex items-center justify-center text-5xl rounded-xl border border-cyan-500/20"
              style={{
                transform: `rotateY(${Math.sin(rotation * 0.02) * 15}deg) rotateX(${Math.cos(rotation * 0.015) * 8}deg)`,
                width: '140px',
                height: '140px',
                background: 'linear-gradient(135deg, rgba(34,211,238,0.1), rgba(34,211,238,0.02))',
                boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 0 20px rgba(34,211,238,0.06)',
              }}
            >
              {icon}
            </div>
          </div>
        </div>

        <p className="text-center text-sm text-slate-300 mb-4 leading-relaxed font-mono">
          {data.description}
        </p>

        <div className="h-px mb-4 bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />

        <p className="text-sm text-slate-400 leading-relaxed italic font-mono">
          {data.detailText}
        </p>
      </div>
    </PanelWrapper>
  );
}
