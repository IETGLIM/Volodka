import { useCallback, useEffect, useRef, useState } from 'react';
import { useGameStore } from '@/store/gameStore';
import { getAffinityChange, getGiftReactionText, type GiftPreference } from '@/data/npcGifts';

export type GiftReaction = {
  preference: GiftPreference;
  text: string;
  affinityChange: number;
};

const REACTION_CLEAR_MS = 2500;

export function useGiftAction(npcId: string, npcName: string) {
  const giftItemToNPC = useGameStore((state) => state.giftItemToNPC);
  const [giftingItemId, setGiftingItemId] = useState<string | null>(null);
  const [lastReaction, setLastReaction] = useState<GiftReaction | null>(null);
  const clearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mountedRef = useRef(true);

  const clearPendingTimer = useCallback(() => {
    if (clearTimerRef.current !== null) {
      clearTimeout(clearTimerRef.current);
      clearTimerRef.current = null;
    }
  }, []);

  const resetGiftState = useCallback(() => {
    clearPendingTimer();
    setGiftingItemId(null);
    setLastReaction(null);
  }, [clearPendingTimer]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      clearPendingTimer();
    };
  }, [clearPendingTimer]);

  const gift = useCallback(
    (itemId: string) => {
      clearPendingTimer();
      setGiftingItemId(itemId);

      try {
        const preference = giftItemToNPC(itemId, npcId);
        if (!preference) {
          setGiftingItemId(null);
          return;
        }

        const affinityChange = getAffinityChange(preference);
        setLastReaction({
          preference,
          text: getGiftReactionText(npcName, preference),
          affinityChange,
        });

        clearTimerRef.current = setTimeout(() => {
          if (!mountedRef.current) return;
          setLastReaction(null);
          setGiftingItemId(null);
          clearTimerRef.current = null;
        }, REACTION_CLEAR_MS);
      } catch {
        setGiftingItemId(null);
        setLastReaction(null);
      }
    },
    [clearPendingTimer, giftItemToNPC, npcId, npcName],
  );

  return {
    gift,
    giftingItemId,
    lastReaction,
    resetGiftState,
  };
}
