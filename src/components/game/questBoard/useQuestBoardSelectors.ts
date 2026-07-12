import { useGameSelector, useGamePrimitive } from '@/store/selectors/hooks';
import { useGameStore } from '@/store/gameStore';
import type { AcceptedDailyMission } from '@/shared/types/game';

export function useQuestBoardStoreActions() {
  const acceptDailyMission = useGameStore((s) => s.acceptDailyMission);
  const abandonDailyMission = useGameStore((s) => s.abandonDailyMission);
  const claimDailyMissionReward = useGameStore((s) => s.claimDailyMissionReward);
  return { acceptDailyMission, abandonDailyMission, claimDailyMissionReward };
}

export function useAcceptedDailyMissions() {
  return useGameSelector((s) => s.acceptedDailyMissions);
}

export function usePlayerLevel() {
  return useGamePrimitive((s) => s.playerState.progression.level);
}

export function useAcceptedDailyMission(missionId: string): AcceptedDailyMission | undefined {
  return useGameSelector((s) => s.acceptedDailyMissions.find((entry) => entry.missionId === missionId));
}
