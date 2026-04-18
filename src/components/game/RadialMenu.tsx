'use client';

import { memo, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

export type RadialMenuAction = 'inspect' | 'take' | 'use' | 'drop';

export interface RadialMenuProps {
  open: boolean;
  anchorLabel?: string;
  onClose: () => void;
  onSelect: (action: RadialMenuAction) => void;
}

const ITEMS: { id: RadialMenuAction; label: string }[] = [
  { id: 'inspect', label: 'Осмотреть' },
  { id: 'take', label: 'Взять' },
  { id: 'use', label: 'Использовать' },
  { id: 'drop', label: 'Выбросить' },
];

export const RadialMenu = memo(function RadialMenu({ open, anchorLabel, onClose, onSelect }: RadialMenuProps) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('pointerdown', onDoc, { capture: true });
    return () => {
      document.removeEventListener('pointerdown', onDoc, { capture: true });
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={rootRef}
          className="fixed inset-0 z-[95] flex items-center justify-center bg-black/45 backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 320, damping: 24 }}
            className="game-fm-layer game-fm-layer-promote intro-recall-frame grid w-[min(92vw,300px)] grid-cols-2 gap-2 rounded-xl border border-cyan-500/40 bg-slate-950/95 p-4 pb-[max(1rem,calc(1rem+env(safe-area-inset-bottom)))] pt-[max(1rem,env(safe-area-inset-top))] shadow-2xl touch-manipulation"
          >
            {anchorLabel && (
              <div className="col-span-2 text-center font-mono text-[10px] text-cyan-200/80">{anchorLabel}</div>
            )}
            {ITEMS.map((item, i) => (
              <motion.button
                key={item.id}
                type="button"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="min-h-11 rounded-lg border border-fuchsia-500/30 bg-black/60 px-2 py-3 font-mono text-[11px] text-fuchsia-100 hover:border-cyan-400/55 hover:text-cyan-100 touch-manipulation"
                onClick={() => {
                  onSelect(item.id);
                  onClose();
                }}
              >
                {item.label}
              </motion.button>
            ))}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
});
