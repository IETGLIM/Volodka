import { memo, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import type { PoemSlotView } from '@/engine/karmaPoem/karmaPoemPresentation';

const POEM_VIRTUALIZE_THRESHOLD = 40;
const POEM_ROW_HEIGHT = 44;
const POEM_COLUMN_COUNT = 7;

interface PoemSlotGridProps {
  slots: PoemSlotView[];
}

const PoemSlot = memo(function PoemSlot({ slot }: { slot: PoemSlotView }) {
  return (
    <div
      tabIndex={slot.collected ? 0 : -1}
      title={slot.collected ? slot.title : 'Не найден'}
      aria-label={slot.collected ? `Стих: ${slot.title}` : `Слот ${slot.index}, не найден`}
      className={`aspect-square flex items-center justify-center rounded text-[10px] font-mono outline-none transition-colors focus-visible:ring-1 focus-visible:ring-emerald-500/50 ${
        slot.collected
          ? 'bg-emerald-950/30 border border-emerald-700/40 text-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.12)] hover:bg-emerald-950/45'
          : 'bg-slate-900/40 border border-slate-700/30 text-slate-600'
      }`}
    >
      {slot.collected ? '📜' : slot.index}
    </div>
  );
});

export function PoemSlotGrid({ slots }: PoemSlotGridProps) {
  const parentRef = useRef<HTMLDivElement>(null);
  const rowCount = Math.ceil(slots.length / POEM_COLUMN_COUNT);
  const useVirtual = slots.length >= POEM_VIRTUALIZE_THRESHOLD;

  const rowVirtualizer = useVirtualizer({
    count: useVirtual ? rowCount : 0,
    getScrollElement: () => parentRef.current,
    estimateSize: () => POEM_ROW_HEIGHT,
    overscan: 3,
  });

  if (useVirtual) {
    return (
      <div ref={parentRef} className="max-h-64 overflow-y-auto pr-1">
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, position: 'relative', width: '100%' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const rowStart = virtualRow.index * POEM_COLUMN_COUNT;
            const rowSlots = slots.slice(rowStart, rowStart + POEM_COLUMN_COUNT);
            return (
              <div
                key={virtualRow.key}
                className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2 absolute left-0 w-full"
                style={{
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
              >
                {rowSlots.map((slot) => (
                  <PoemSlot key={slot.id} slot={slot} />
                ))}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 gap-2">
      {slots.map((slot) => (
        <PoemSlot key={slot.id} slot={slot} />
      ))}
    </div>
  );
}
