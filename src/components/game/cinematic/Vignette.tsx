import { memo } from 'react';

export interface VignetteProps {
  intensity?: number;
  zIndex?: number;
}

export const Vignette = memo(function Vignette({ intensity = 0.85, zIndex = 50 }: VignetteProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex,
        background: `radial-gradient(ellipse at center, transparent 20%, rgba(0, 0, 0, ${intensity}) 100%)`,
      }}
    />
  );
});
