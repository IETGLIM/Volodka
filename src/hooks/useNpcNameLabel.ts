/* ─── NPC name label hook — distance-faded floating name ─── */

import { useRef, useState } from 'react';
import { npcTierHasNameLabels, type NpcRenderTier } from '@/engine/npc/npcRenderTier';

/* ─── Name label distance ─── */
const NAME_LABEL_MAX_DISTANCE = 5.0;

interface UseNpcNameLabelParams {
  renderTier: NpcRenderTier;
}

interface UseNpcNameLabelResult {
  nameLabelOpacity: number;
  updateNameLabelFrame: (delta: number, dist: number) => void;
}

export function useNpcNameLabel({
  renderTier,
}: UseNpcNameLabelParams): UseNpcNameLabelResult {
  // Name label distance tracking — ref-based with throttled React state updates
  const [nameLabelOpacity, setNameLabelOpacity] = useState(0);
  const nameLabelOpacityRef = useRef(0);
  const nameLabelUpdateTimerRef = useRef(0);

  const updateNameLabelFrame = (delta: number, dist: number): void => {
    if (!npcTierHasNameLabels(renderTier)) return;

    if (dist < NAME_LABEL_MAX_DISTANCE) {
      const fadeFactor = 1.0 - (dist / NAME_LABEL_MAX_DISTANCE);
      nameLabelOpacityRef.current = Math.min(1, fadeFactor * 1.5);
    } else {
      nameLabelOpacityRef.current = 0;
    }

    // Throttle React state updates to ~10fps for name labels
    nameLabelUpdateTimerRef.current += delta;
    if (nameLabelUpdateTimerRef.current > 0.1) {
      nameLabelUpdateTimerRef.current = 0;
      const newOpacity = nameLabelOpacityRef.current;
      setNameLabelOpacity((prev) => Math.abs(prev - newOpacity) > 0.05 ? newOpacity : prev);
    }
  };

  return { nameLabelOpacity, updateNameLabelFrame };
}
