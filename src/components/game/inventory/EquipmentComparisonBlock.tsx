/* ─── Volodka RPG – Equipment Comparison Block ───
 * v4.8.4: единый UI сравнения экипировки (Cyberpunk-стиль, two-column).
 * Раньше SideBySideComparison жил внутри InventoryTooltip и был недоступен
 * панели деталей предмета. Теперь тултип и панель деталей используют один
 * блок — без дублей разметки и рассинхронизации стилей.
 */

import type { TooltipComparisonDelta, TooltipComparisonRow } from '@/engine/inventory/inventoryTooltipPresentation';
import type { TooltipComparison } from '@/engine/inventory/inventoryTooltipPresentation';

/** Компактная строка дельты «лучше/хуже» (для sr-only-сводки и компактных мест). */
export function ComparisonDelta({ delta }: { delta: TooltipComparisonDelta }) {
  const isPositive = delta.delta > 0;
  // "Beneficial" = positive delta AND positiveIsGood, or negative delta AND !positiveIsGood
  const isBeneficial = isPositive === delta.positiveIsGood;

  const arrow = isPositive ? '↑' : '↓';
  const sign = isPositive ? '+' : '';
  const colorClass = isBeneficial ? 'text-emerald-400 inv-stat-comparison-positive' : 'text-rose-400 inv-stat-comparison-negative';

  return (
    <p className={`font-mono text-xs ${colorClass} inv-stat-comparison-row flex items-center gap-1 break-words`}>
      <span className={isBeneficial ? 'text-emerald-500' : 'text-rose-500'} aria-hidden>▸</span>
      <span aria-hidden>{arrow}</span>
      <span>{delta.label} {sign}{delta.delta}</span>
    </p>
  );
}

/** Строка side-by-side: НОВОЕ │ ЛЕЙБЛ │ НАДЕТО + вердикт (↑/↓/=, дельта). */
export function ComparisonRow({ row }: { row: TooltipComparisonRow }) {
  const isPositive = row.delta > 0;
  const newWins = row.delta !== 0 && isPositive === row.positiveIsGood;
  const equippedWins = row.delta !== 0 && !newWins;
  const sign = isPositive ? '+' : '';

  const newValueClass = newWins ? 'text-emerald-300' : equippedWins ? 'text-rose-300/80' : 'text-slate-300';
  const equippedValueClass = equippedWins ? 'text-emerald-300' : newWins ? 'text-rose-300/80' : 'text-slate-300';
  const deltaClass = row.delta === 0
    ? 'text-slate-600'
    : newWins ? 'text-emerald-400' : 'text-rose-400';
  const verdict = row.delta === 0 ? '=' : isPositive ? '↑' : '↓';

  return (
    <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 font-mono text-[11px] leading-relaxed">
      <span className="text-right tabular-nums break-words" style={{ color: undefined }}>
        <span className={newValueClass}>{row.newValue > 0 ? `+${row.newValue}` : row.newValue}</span>
      </span>
      <span className={equippedWins ? 'text-emerald-500/70' : 'text-slate-700'} aria-hidden>│</span>
      <span className="text-slate-400 truncate">{row.label}</span>
      <span className={newWins ? 'text-emerald-500/70' : 'text-slate-700'} aria-hidden>│</span>
      <span className="tabular-nums">
        <span className={equippedValueClass}>
          {row.equippedValue > 0 ? `+${row.equippedValue}` : row.equippedValue}
        </span>
        <span className={`ml-1.5 ${deltaClass}`} aria-label={`${row.label}: ${sign}${row.delta}`}>
          {verdict}{row.delta !== 0 ? `${sign}${row.delta}` : ''}
        </span>
      </span>
    </div>
  );
}

/* ── Двухколоночное сравнение (Cyberpunk-стиль) ──
 * Полная картина: значение на НОВОМ предмете | на НАДЕТОМ, по каждой
 * строке — вердикт (лучше/хуже/равно). Строки с преимуществом нового
 * подсвечены emerald, проигрышем — rose, равные — приглушённо. */
export function SideBySideComparison({
  comparison,
}: {
  comparison: TooltipComparison;
}) {
  return (
    <div className="rounded-md border border-amber-500/20 bg-amber-950/10 px-2 py-1.5">
      {/* Заголовок колонок: НОВЫЙ (слева, cyan) vs НАДЕТО (справа, dim) */}
      <div className="grid grid-cols-[1fr_auto_auto_auto_1fr] items-center gap-2 font-mono text-[9px] uppercase tracking-wider mb-1">
        <span className="text-right text-cyan-400/90">Новое</span>
        <span aria-hidden />
        <span className="text-amber-500/70 truncate">
          vs {comparison.equippedName}
        </span>
        <span aria-hidden />
        <span className="text-slate-500">Надето</span>
      </div>
      {comparison.rows.map((row) => (
        <ComparisonRow key={row.stat} row={row} />
      ))}
    </div>
  );
}

/**
 * Готовый блок «Сравнение · <слот>» с sr-only сводкой дельт.
 * Используется в панели деталей предмета (v4.8.4).
 */
export function EquipmentComparisonSection({
  comparison,
}: {
  comparison: TooltipComparison;
}) {
  return (
    <div className="space-y-1.5">
      <p className="font-mono text-[10px] uppercase tracking-wider text-amber-500/60 mb-0.5">
        Сравнение · {comparison.slotLabel}
      </p>
      <SideBySideComparison comparison={comparison} />
      {/* Компактная сводка дельт для скрин-ридеров и беглого взгляда */}
      <div className="sr-only">
        {comparison.deltas.map((delta) => (
          <ComparisonDelta key={`sr-${delta.stat}`} delta={delta} />
        ))}
      </div>
    </div>
  );
}
