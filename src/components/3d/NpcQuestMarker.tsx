/* ─── NPC quest marker component ─── */

'use client';

import { useMemo } from 'react';
import { useQuests } from '@/store/selectors';
import { getNpcQuestMarkerDisplay } from '@/store/questStore';
import { NpcQuestMarkerSprite } from '@/engine/npc/npcWorldSprite';

/** Quest marker (!/?) floating above NPC head with pulse/glow
 *  Three indicator types:
 *  - Yellow ! — Quest available from this NPC
 *  - Blue ?  — Quest in progress with this NPC
 *  - Green ✓ — Quest ready to turn in (all objectives complete) */
export function QuestMarker({ npcId }: { npcId: string }) {
  const quests = useQuests();

  const markerInfo = useMemo(
    () => getNpcQuestMarkerDisplay(npcId),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional stable deps
    [quests, npcId],
  );

  if (!markerInfo) return null;

  return (
    <NpcQuestMarkerSprite
      icon={markerInfo.icon}
      color={markerInfo.color}
      questName={markerInfo.questName}
      pulseSpeed={markerInfo.pulseSpeed}
    />
  );
}
