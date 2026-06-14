import { useGameStore, useGamePrimitive, useGameSelector } from '@/store/gameStore';

export function usePerksPanelData() {
  const perkPoints = useGamePrimitive((state) => state.playerState.progression.perkPoints);
  const level = useGamePrimitive((state) => state.playerState.progression.level);
  const unlockedPerks = useGameSelector((state) => state.playerState.progression.unlockedPerks);
  const acquirePerk = useGameStore((state) => state.acquirePerk);
  const canAcquirePerk = useGameStore((state) => state.canAcquirePerk);

  return {
    perkPoints,
    level,
    unlockedPerks,
    acquirePerk,
    canAcquirePerk,
  };
}
