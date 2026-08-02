/* Turn-phase / status chrome extracted from CombatUI facade. */

import { Zap } from 'lucide-react';
import { CombatDamageTimeline } from '@/components/game/hud/parts/CombatDamageTimeline';
import { TurnPhaseIndicator } from '@/components/game/hud/parts/TurnPhaseIndicator';

export function CombatPhaseChrome({
  isSilenced,
  fleeAttempts,
}: {
  isSilenced: boolean;
  fleeAttempts: number;
}) {
  return (
    <>
      <div className="mb-1.5 flex flex-col items-center gap-0.5">
        <TurnPhaseIndicator />
        <div className="flex items-center gap-2 text-[9px] font-mono">
          {isSilenced && (
            <span className="text-red-400">🔇 СПОСОБНОСТИ ЗАБЛОКИРОВАНЫ</span>
          )}
          {fleeAttempts > 0 && (
            <span className="text-neon-amber text-amber-400/60">
              <Zap className="inline size-2.5" /> Побег: +{fleeAttempts * 15}%
            </span>
          )}
        </div>
      </div>

      <div className="flex justify-center mb-1.5">
        <CombatDamageTimeline />
      </div>

      <div className="signal-wave mb-1.5">
        <span /><span /><span /><span /><span />
      </div>
    </>
  );
}
