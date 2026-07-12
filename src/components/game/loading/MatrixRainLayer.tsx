import { memo } from 'react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { CanvasMatrixRain } from '@/components/game/shared/CanvasMatrixRain';

function MatrixRainFallback() {
  return (
    <div
      className="absolute inset-0 bg-black"
      aria-hidden
      data-testid="matrix-rain-fallback"
    />
  );
}

export const MatrixRainLayer = memo(function MatrixRainLayer() {
  return (
    <div className="absolute inset-0 z-[1]">
      <ErrorBoundary name="loading-matrix-rain" fallback={<MatrixRainFallback />}>
        <CanvasMatrixRain />
      </ErrorBoundary>
    </div>
  );
});
