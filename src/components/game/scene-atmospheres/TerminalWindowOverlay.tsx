'use client';

import { memo, useMemo, useEffect, useRef } from 'react';

interface TerminalWindowOverlayProps {
  lines: string[];
  x: number; // percentage from left (negative = from right)
  y: number; // px from top
  width: number;
  height: number;
  borderColor: string;
  textColor: string;
  headerText: string;
  align?: 'left' | 'right';
}

export const TerminalWindowOverlay = memo(function TerminalWindowOverlay({
  lines,
  x,
  y,
  width,
  height,
  borderColor,
  textColor,
  headerText,
  align = 'left',
}: TerminalWindowOverlayProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  // scrollOffset was unused; removed broken useRef(0).current destructuring that caused TypeError

  // Auto-scroll effect
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    const interval = setInterval(() => {
      if (container.scrollTop < container.scrollHeight - container.clientHeight) {
        container.scrollTop += 1;
      } else {
        container.scrollTop = 0;
      }
    }, 120);

    return () => clearInterval(interval);
  }, []);

  const positionStyle = align === 'right'
    ? { right: `${Math.abs(x)}%`, top: y }
    : { left: `${x}%`, top: y };

  // Duplicate lines for continuous scroll
  const displayLines = useMemo(() => [...lines, ...lines], [lines]);

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        ...positionStyle,
        width,
        height,
        border: `1px solid ${borderColor}`,
        background: 'rgba(0,0,0,0.4)',
        backdropFilter: 'blur(2px)',
        clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
      }}
    >
      {/* Header bar */}
      <div
        className="flex items-center gap-1 px-2 py-1"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <div className="flex gap-1">
          <div className="w-[5px] h-[5px] rounded-full bg-red-500/40" />
          <div className="w-[5px] h-[5px] rounded-full bg-yellow-500/40" />
          <div className="w-[5px] h-[5px] rounded-full bg-green-500/40" />
        </div>
        <span
          className="text-[8px] ml-2 uppercase tracking-wider"
          style={{ color: textColor, fontFamily: 'var(--font-geist-mono), monospace' }}
        >
          {headerText}
        </span>
      </div>

      {/* Scrolling content */}
      <div
        ref={scrollRef}
        className="overflow-hidden px-2 py-1"
        style={{ height: height - 24 }}
      >
        {displayLines.map((line, i) => (
          <div
            key={i}
            className="text-[8px] leading-[12px] whitespace-nowrap"
            style={{
              color: textColor,
              fontFamily: 'var(--font-geist-mono), monospace',
            }}
          >
            {line}
          </div>
        ))}
      </div>
    </div>
  );
});
