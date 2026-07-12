import { useMemo } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getAffinityLevel } from '@/data/npcGifts';
import {
  buildGiftableItems,
  countGiftableItems,
  getGiftPreferenceCounts,
} from '@/engine/gift/giftDialogPresentation';

/** Read-only gift dialog state derived from store + NPC gift tables. */
export function useGiftDialogData(npcId: string) {
  const inventory = useGameStore((state) => state.playerState.inventory);
  const npcAffinity = useGameStore((state) => state.npcAffinity);

  const giftableItems = useMemo(
    () => buildGiftableItems(inventory, npcId),
    [inventory, npcId],
  );
  const giftPreferenceCounts = useMemo(
    () => getGiftPreferenceCounts(npcId),
    [npcId],
  );

  const currentAffinity = npcAffinity[npcId] ?? 0;
  const affinityLevel = useMemo(
    () => getAffinityLevel(currentAffinity),
    [currentAffinity],
  );

  return {
    giftableItems,
    giftPreferenceCounts,
    currentAffinity,
    affinityLevel,
  };
}

/** Whether the player has any non-quest item to gift. */
export function useHasGiftableItems(): boolean {
  const inventory = useGameStore((state) => state.playerState.inventory);
  return useMemo(() => countGiftableItems(inventory) > 0, [inventory]);
}
