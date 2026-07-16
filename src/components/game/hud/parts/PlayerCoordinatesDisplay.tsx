/* ─── Volodka RPG – Player Coordinates Display ───
 * Shows X and Z world coordinates formatted to 1 decimal place
 * with a subtle CRT flicker effect and a crosshair label.
 */

import { Crosshair } from 'lucide-react';
import { usePlayerPosition } from '@/store/selectors/explorationSelectors';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';

export function PlayerCoordinatesDisplay() {
  const quietStyle = useHudQuietStyle();
  const playerPos = usePlayerPosition();

  const x = (playerPos?.[0] ?? 0).toFixed(1);
  const z = (playerPos?.[2] ?? 0).toFixed(1);

  return (
    <div
      className="player-coords relative flex items-center gap-1.5 rounded-md px-2 py-1 select-none pointer-events-none"
      style={{
        background: 'rgba(2, 6, 23, 0.7)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        border: '1px solid rgba(100, 116, 139, 0.15)',
        ...quietStyle,
      }}
      aria-label={`Координаты: X ${x}, Z ${z}`}
    >
      {/* Crosshair label icon */}
      <Crosshair
        size={8}
        style={{ color: 'rgba(100, 116, 139, 0.5)', flexShrink: 0 }}
      />

      {/* Coordinate text with CRT flicker */}
      <span
        className="coordinates-flicker font-mono text-[9px] tabular-nums"
        style={{
          color: 'rgba(100, 116, 139, 0.65)',
          letterSpacing: '0.05em',
        }}
      >
        X:{x} Z:{z}
      </span>
    </div>
  );
}