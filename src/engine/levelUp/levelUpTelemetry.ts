import { devWarn, devInfo } from '@/shared/utils/devLog';
export type LevelUpTelemetryEvent = {
  action: 'level_up_shown' | 'level_up_dismissed';
  newLevel: number;
  levelsGained: number;
  perkPointsGained: number;
  skipped?: boolean;
  reducedMotion?: boolean;
};

type LevelUpReporter = (event: LevelUpTelemetryEvent) => void;

function getReporter(): LevelUpReporter | undefined {
  return (
    globalThis as typeof globalThis & {
      __volodkaLevelUpTelemetry?: LevelUpReporter;
    }
  ).__volodkaLevelUpTelemetry;
}

export const levelUpTelemetry = {
  track(event: LevelUpTelemetryEvent): void {
    if (import.meta.env.DEV) {
      devInfo('[LevelUpTelemetry]', event);
    }
    try {
      getReporter()?.(event);
    } catch (error) {
      devWarn('[LevelUpTelemetry] Reporter failed:', error);
    }
  },
};
