/* Combat log scroll panel extracted from CombatUI facade. */

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';
import type { CombatLogEntry } from '@/shared/types/game';
import { CombatLogLine } from '@/components/game/combatUi/CombatLogLine';

/** v4.60.0: сколько последних строк показывать. Лог в сторе ограничен 50 —
 *  для человека это простыня, из-за которой панель читается как «каша»
 *  (репорт со скриншотом: наложение строк). 12 последних строк = весь
 *  последний обмен ударами, читается мгновенно. */
const VISIBLE_LOG_LINES = 12;

export function CombatLogPanel({
  log,
  isActive,
  logEndRef,
}: {
  log: CombatLogEntry[];
  isActive: boolean;
  logEndRef: RefObject<HTMLDivElement | null>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const visibleLog = log.length > VISIBLE_LOG_LINES ? log.slice(-VISIBLE_LOG_LINES) : log;

  // v4.60.0: авто-скролл контейнера к последней строке при каждом обновлении.
  // Раньше scrollIntoView дёргался из контроллера и скроллил ВСЮ страницу,
  // а не панель лога — новые строки уходили под сгиб, поверх них рисовались
  // флоат-числа. Также убран мигающий typing-cursor с каждой строки — при
  // 12 строках это 12 мигающих курсоров (визуальный шум).
  useEffect(() => {
    const el = containerRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [log.length]);

  return (
    <div
      ref={containerRef}
      aria-live={isActive ? 'off' : 'polite'}
      aria-label="Боевой журнал"
      className="glass-panel-dark scrollbar-cyber max-h-28 overflow-y-auto bg-black/70 border border-slate-800/30 rounded-lg p-2 font-mono"
      style={{ scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent' }}
    >
      {visibleLog.map((entry, i) => (
        <CombatLogLine
          key={`log-${i}-${entry.turn}-${entry.type}-${entry.text.slice(0, 20)}`}
          entry={entry}
        />
      ))}
      <div ref={logEndRef} />
    </div>
  );
}
