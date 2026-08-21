import { useCallback, useEffect, useRef, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import type { LevelUpSummaryData } from '@/engine/levelUp/levelUpSummaryPresentation';
import { toLevelUpSummaryData } from '@/engine/levelUp/levelUpSummaryPresentation';
import { levelUpSummaryTelemetry } from '@/engine/levelUp/levelUpSummaryTelemetry';
import { useLevelUpSkipInput } from '@/components/game/levelUp/useLevelUpEffect';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';

import { devWarn } from '@/shared/utils/devLog';
export function useLevelUpSummary() {
  const reducedMotion = useEffectiveReducedMotion();
  const [summary, setSummary] = useState<LevelUpSummaryData | null>(null);
  const sequenceRef = useRef(0);

  const dismiss = useCallback((skipped = false) => {
    setSummary((current) => {
      if (current) {
        levelUpSummaryTelemetry.trackDismissed(current, skipped, reducedMotion);
      }
      return null;
    });
  }, [reducedMotion]);

  const showSummary = useCallback((payload: Parameters<typeof toLevelUpSummaryData>[0]) => {
    sequenceRef.current += 1;
    const id = `levelup-summary-${Date.now()}-${sequenceRef.current}-${payload.newLevel}`;
    const data = toLevelUpSummaryData(payload, id);
    if (!data) {
      devWarn('[LevelUpSummary] Incomplete level-up payload — snapshot fields missing');
      return;
    }
    setSummary(data);
    levelUpSummaryTelemetry.trackShown(data, reducedMotion);
  }, [reducedMotion]);

  useEffect(() => {
    const unsub = eventBus.on('player:levelup', (payload) => {
      showSummary(payload);
    });
    return unsub;
  }, [showSummary]);

  useLevelUpSkipInput(!!summary, () => dismiss(true));

  return {
    summary,
    reducedMotion,
    dismiss,
  };
}
