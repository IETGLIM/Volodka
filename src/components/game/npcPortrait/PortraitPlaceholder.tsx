import type { CSSProperties } from 'react';
import { buildPortraitAccessibleLabel } from '@/engine/portrait/npcPortraitPresentation';

type PortraitPlaceholderProps = {
  initial: string;
  glowColor: string;
  name: string;
  sizeClass: string;
  frameStyle: CSSProperties;
  decorative?: boolean;
  className?: string;
};

/** SSR-safe SVG placeholder — same footprint as the canvas portrait (no layout shift). */
export function PortraitPlaceholder({
  initial,
  glowColor,
  name,
  sizeClass,
  frameStyle,
  decorative = false,
  className,
}: PortraitPlaceholderProps) {
  const label = decorative ? undefined : buildPortraitAccessibleLabel(name);

  return (
    <div
      className={`${sizeClass} relative shrink-0 overflow-hidden border ${className ?? ''}`}
      style={frameStyle}
      role={decorative ? undefined : 'img'}
      aria-label={label}
      aria-hidden={decorative ? true : undefined}
    >
      <svg
        viewBox="0 0 256 256"
        className="h-full w-full"
        aria-hidden="true"
        focusable="false"
      >
        <defs>
          <radialGradient id="portrait-ph-glow" cx="50%" cy="42%" r="58%">
            <stop offset="0%" stopColor={glowColor} stopOpacity="0.22" />
            <stop offset="100%" stopColor="#04060a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="256" height="256" fill="#04060a" />
        <rect width="256" height="256" fill="url(#portrait-ph-glow)" />
        <ellipse cx="128" cy="102" rx="44" ry="48" fill="#1a2233" stroke={glowColor} strokeOpacity="0.65" strokeWidth="2" />
        <path
          d="M44 256 Q44 168 128 150 Q212 168 212 256 Z"
          fill="#1a2233"
          stroke={glowColor}
          strokeOpacity="0.45"
          strokeWidth="2"
        />
        <text
          x="20"
          y="236"
          fill={glowColor}
          fillOpacity="0.92"
          fontFamily="Geist Mono, Courier New, monospace"
          fontSize="44"
          fontWeight="700"
        >
          {initial}
        </text>
      </svg>
    </div>
  );
}
