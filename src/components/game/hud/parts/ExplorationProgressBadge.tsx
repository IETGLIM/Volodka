/* ─── Volodka RPG – Exploration Progress Badge ───
 * Shows discovered scenes vs total as a circular SVG progress ring
 * with percentage center text and a subtle CSS breathing animation.
 */

import { useMemo } from 'react';
import { CORE_SCENE_IDS } from '@/config/sceneIds';
import { useDiscoveredScenes } from '@/store/selectors/explorationSelectors';

export function ExplorationProgressBadge() {
  const discoveredScenes = useDiscoveredScenes();
  const totalScenes = CORE_SCENE_IDS.length;

  const discoveredCount = useMemo(() => {
    if (!discoveredScenes) return 0;
    const coreSet = new Set(CORE_SCENE_IDS as unknown as readonly string[]);
    return discoveredScenes.filter((id: string) => coreSet.has(id)).length;
  }, [discoveredScenes]);

  const pct = totalScenes > 0 ? Math.round((discoveredCount / totalScenes) * 100) : 0;

  /* SVG ring geometry — simple circle inside a small viewBox */
  const radius = 16;
  const strokeWidth = 2.5;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;
  const size = 44;
  const center = size / 2;
  const ringColor = 'rgba(0, 255, 100, 0.6)'; // matrix green #00ff64 at 60% opacity

  return (
    <div className="exploration-progress-badge flex flex-col items-center gap-0.5 select-none" aria-label={`Исследовано ${discoveredCount} из ${totalScenes} локаций`}>
      <div
        key={`badge-glow-${pct}`}
        className="relative hud-filmic-badge-fill-glow"
        style={{
          width: size,
          height: size,
        }}
      >
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="exploration-ring-breathe"
        >
          {/* Background track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="rgba(100, 116, 139, 0.2)"
            strokeWidth={strokeWidth}
          />
          {/* Progress arc */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={ringColor}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${center} ${center})`}
            style={{
              transition: 'stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)',
              filter: `drop-shadow(0 0 3px rgba(0, 255, 100, 0.3))`,
            }}
          />
          {/* Center percentage text */}
          <text
            x={center}
            y={center + 1}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="11"
            fill={ringColor}
            fontFamily="monospace"
            style={{ filter: 'drop-shadow(0 0 3px rgba(0, 255, 100, 0.25))' }}
          >
            {pct}%
          </text>
        </svg>
      </div>
      {/* Label */}
      <span
        className="font-mono tracking-[0.12em] uppercase"
        style={{
          fontSize: '8px',
          color: 'rgba(0, 255, 100, 0.45)',
          lineHeight: 1,
        }}
      >
        ИССЛЕДОВАНО
      </span>
      {/* Scene count */}
      <span
        className="font-mono"
        style={{
          fontSize: '7px',
          color: 'rgba(148, 163, 184, 0.4)',
          lineHeight: 1,
        }}
      >
        {discoveredCount}/{totalScenes} локаций
      </span>
    </div>
  );
}