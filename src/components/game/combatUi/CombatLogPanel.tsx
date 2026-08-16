/* Combat log scroll panel extracted from CombatUI facade. */

import type { RefObject } from 'react';
import type { CombatLogEntry } from '@/shared/types/game';
import { CombatLogLine } from '@/components/game/combatUi/CombatLogLine';

export function CombatLogPanel({
  log,
  isActive,
  logEndRef,
}: {
  log: CombatLogEntry[];
  isActive: boolean;
  logEndRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div
      aria-live={isActive ? 'off' : 'polite'}
      aria-label="Боевой журнал"
      className="glass-panel-dark scrollbar-cyber max-h-28 overflow-y-auto bg-black/70 border border-slate-800/30 rounded-lg p-2 font-mono"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
    >
      {log.map((entry, i) => (
        <CombatLogLine
          key={`log-${i}-${entry.turn}-${entry.type}-${entry.text.slice(0, 20)}`}
          entry={entry}
          className="typing-cursor"
        />
      ))}
      <div ref={logEndRef} />
    </div>
  );
}
