/* ─── Volodka RPG – Fairmath relation curve ─── */
/* Diminishing returns for 0–100 reputation-style values. */

/** Apply diminishing returns to a relation/reputation change. */
export function applyFairmathRelation(current: number, change: number): number {
  if (change === 0) return current;
  if (change >= 0) {
    const gain = Math.round(change * (100 - current) / 100);
    return Math.min(100, current + Math.max(gain, 1));
  }
  const loss = Math.round(Math.abs(change) * current / 100);
  return Math.max(0, current - Math.max(loss, 1));
}
