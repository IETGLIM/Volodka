import { memo } from 'react';

const GRAIN_SVG = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`;

export interface FilmGrainProps {
  opacity?: number;
  zIndex?: number;
}

/** Film grain overlay — menu, intro, cutscenes. */
export const FilmGrain = memo(function FilmGrain({ opacity = 0.04, zIndex = 55 }: FilmGrainProps) {
  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        zIndex,
        opacity,
        backgroundImage: GRAIN_SVG,
        backgroundSize: '128px 128px',
        mixBlendMode: 'overlay',
        animation: 'cinematic-grain 0.4s steps(8) infinite',
      }}
    />
  );
});
