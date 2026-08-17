/* ─── Gate ambient proximity chrome when the scene shouldn't compete ───
 * Quiet-HUD, story/dialogue overlays, open panels, and interaction locks
 * should silence glow/ring/radar so diegetic UI owns the frame.
 */

import { useEffect, useState } from 'react';
import { usePanelStack } from '@/components/game/orchestrator/PanelStackContext';
import { eventBus } from '@/engine/EventBus';
import { isInteractionLocked } from '@/engine/interaction/interactionSession';
import { useHudQuiet } from '@/hooks/useHudQuiet';
import { useInteractionOverlay } from '@/store/selectors';

/** True when center-stack proximity FX (glow/ring/radar/prompt) may render. */
export function useHudProximityFxActive(): boolean {
  const quiet = useHudQuiet();
  const { showStoryOverlay, diegeticNarrativeOpen } = useInteractionOverlay();
  const { stack } = usePanelStack();
  const [interactionLocked, setInteractionLocked] = useState(() => isInteractionLocked());

  useEffect(() => {
    const sync = () => setInteractionLocked(isInteractionLocked());
    sync();
    return eventBus.on('interaction:state_change', sync);
  }, []);

  if (quiet) return false;
  if (showStoryOverlay || diegeticNarrativeOpen) return false;
  if (stack.length > 0) return false;
  if (interactionLocked) return false;
  return true;
}
