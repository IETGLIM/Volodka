import { useEffect, useRef, useState } from 'react';
import { BOOT_LINES } from '@/engine/loading/loadingConstants';
import { getBootLineColor, getBootLineShadow } from '@/engine/loading/loadingPresentation';

export function TerminalBootText() {
  const [visibleLines, setVisibleLines] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visibleLines >= BOOT_LINES.length) return;
    const delay = visibleLines < 5 ? 80 : visibleLines < 15 ? 60 : 50;
    const timer = setTimeout(() => {
      setVisibleLines((value) => value + 1);
    }, delay);
    return () => clearTimeout(timer);
  }, [visibleLines]);

  useEffect(() => {
    const element = scrollRef.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, [visibleLines]);

  return (
    <div
      ref={scrollRef}
      className="absolute bottom-0 left-0 right-0 max-h-[35dvh] overflow-x-auto overflow-y-hidden pointer-events-none z-[5] [mask-image:linear-gradient(to_bottom,transparent_0%,black_20%,black_80%,transparent_100%)]"
    >
      <div className="px-4 py-2 font-mono text-[10px] leading-[1.6]">
        {BOOT_LINES.slice(0, visibleLines).map((line, index) => (
          <div
            key={`${index}-${line.slice(0, 12)}`}
            className="whitespace-nowrap"
            style={{
              color: getBootLineColor(line),
              textShadow: getBootLineShadow(line),
            }}
          >
            {line}
          </div>
        ))}
        {visibleLines < BOOT_LINES.length && (
          <span className="inline-block w-1.5 h-3 bg-green-500/60 animate-pulse ml-0.5" />
        )}
      </div>
    </div>
  );
}
