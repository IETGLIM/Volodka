import { memo, useMemo } from 'react';
import {
  buildMatrixColumnSpecs,
  getMatrixColumnCount,
} from '@/engine/matrixQuote/matrixQuotePresentation';
import { useDeviceTier } from '@/hooks/useDeviceTier';
import { useViewportWidth } from '@/hooks/useViewportWidth';

type MatrixRainColumnsProps = {
  color: string;
};

export const MatrixRainColumns = memo(function MatrixRainColumns({ color }: MatrixRainColumnsProps) {
  const viewportWidth = useViewportWidth();
  const tier = useDeviceTier();

  const columns = useMemo(() => {
    const count = getMatrixColumnCount(viewportWidth, tier);
    return buildMatrixColumnSpecs(count);
  }, [viewportWidth, tier]);

  return (
    <div
      className="absolute inset-0 overflow-hidden pointer-events-none"
      style={{ opacity: 0.15, mixBlendMode: 'screen' }}
      aria-hidden="true"
    >
      {columns.map((col) => (
        <div
          key={col.id}
          className="matrix-rain-quote-column"
          style={{
            position: 'absolute',
            left: col.x,
            top: '-100%',
            animation: `matrixFallQuote ${col.duration}s linear ${col.delay}s infinite`,
            whiteSpace: 'nowrap',
            fontFamily: '"Courier New", monospace',
            fontSize: '14px',
            lineHeight: '14px',
          }}
        >
          {col.chars.map((char, ci) => (
            <div
              key={ci}
              style={{
                color: ci === col.chars.length - 1 ? '#ffffff' : color,
                opacity: ci === col.chars.length - 1 ? 1 : Math.max(0.1, 1 - (col.chars.length - 1 - ci) * 0.07),
                textShadow: ci === col.chars.length - 1 ? `0 0 8px ${color}` : 'none',
              }}
            >
              {char}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
});
