/* ─── Volodka RPG – Level Up Summary ───
 * Detailed level-up screen with stat diffs and unlock messages.
 * Driven solely by EventBus player:levelup with store snapshot payload.
 */

import { LevelUpSummaryDialog } from '@/components/game/levelUpSummary/LevelUpSummaryDialog';
import { useLevelUpSummary } from '@/components/game/levelUpSummary/useLevelUpSummary';

export function LevelUpSummary() {
  const { summary, reducedMotion, dismiss } = useLevelUpSummary();

  if (!summary) return null;

  return (
    <LevelUpSummaryDialog
      data={summary}
      reducedMotion={reducedMotion}
      onDismiss={() => dismiss(false)}
    />
  );
}
