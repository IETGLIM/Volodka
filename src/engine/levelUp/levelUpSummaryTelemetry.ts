import type { LevelUpSummaryData } from '@/engine/levelUp/levelUpSummaryPresentation';
import { levelUpTelemetry } from '@/engine/levelUp/levelUpTelemetry';

import { devInfo } from '@/shared/utils/devLog';
export type LevelUpSummaryTelemetryEvent = {
  action: 'level_up_summary_shown' | 'level_up_summary_dismissed';
  newLevel: number;
  levelsGained: number;
  perkPointsGained: number;
  skipped?: boolean;
  reducedMotion?: boolean;
};

export const levelUpSummaryTelemetry = {
  trackShown(data: LevelUpSummaryData, reducedMotion: boolean): void {
    levelUpTelemetry.track({
      action: 'level_up_shown',
      newLevel: data.newLevel,
      levelsGained: data.levelsGained,
      perkPointsGained: data.perkPointsGained,
      reducedMotion,
    });
    if (import.meta.env.DEV) {
      devInfo('[LevelUpSummaryTelemetry]', {
        action: 'level_up_summary_shown',
        newLevel: data.newLevel,
      });
    }
  },

  trackDismissed(data: LevelUpSummaryData, skipped: boolean, reducedMotion: boolean): void {
    levelUpTelemetry.track({
      action: 'level_up_dismissed',
      newLevel: data.newLevel,
      levelsGained: data.levelsGained,
      perkPointsGained: data.perkPointsGained,
      skipped,
      reducedMotion,
    });
    if (import.meta.env.DEV) {
      devInfo('[LevelUpSummaryTelemetry]', {
        action: 'level_up_summary_dismissed',
        skipped,
      });
    }
  },
};
