import { useMemo } from 'react';
import { generateHexDumpLines } from '@/engine/loading/loadingPresentation';

export function HexDumpOverlay() {
  const lines = useMemo(() => generateHexDumpLines(0x7f000001, 12), []);
  if (lines.length === 0) return null;

  return (
    <div
      className="absolute top-0 right-0 w-80 max-w-[40vw] pointer-events-none z-[3] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent_0%,rgba(0,0,0,0.4)_20%,rgba(0,0,0,0.4)_80%,transparent_100%)]"
      suppressHydrationWarning
    >
      <div className="font-mono text-[8px] leading-[1.5] px-2 py-2 whitespace-nowrap overflow-hidden text-[rgba(0,255,65,0.12)]">
        {lines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
      </div>
    </div>
  );
}
