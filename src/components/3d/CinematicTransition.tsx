'use client';

/* ─── Volodka RPG – Cinematic Transition Controller ───
 *  Handles camera freeze events during scene transitions.
 *  Does NOT render a visual overlay — SceneTransitionOverlay handles
 *  the visual transition (cyberpunk wipe). This component only:
 *
 *  1. Listens for `scene:enter` events
 *  2. Emits `camera:cinematic_transition` phase events for camera freeze
 *  3. Renders nothing visually (returns null)
 *
 *  Previously, this component also rendered a black fade overlay,
 *  but it conflicted with SceneTransitionOverlay at the same z-index.
 *  Now it's a pure event controller.
 */

import { useEffect, useRef, useCallback } from 'react';
import { eventBus } from '@/engine/EventBus';
import { CINEMATIC_PHASES } from '@/shared/constants/transitionTimings';

export function CinematicTransition() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // ── Listen for scene:enter to trigger camera freeze ──
  useEffect(() => {
    const unsub = eventBus.on('scene:enter', ({ sceneId }) => {
      // Cancel any in-progress transition
      clearTimer();

      // Emit camera freeze — fade-out phase
      eventBus.emit('camera:cinematic_transition', { phase: 'fadeOut', sceneId });

      // Schedule hold phase
      timerRef.current = setTimeout(() => {
        eventBus.emit('camera:cinematic_transition', { phase: 'hold', sceneId });

        // Schedule fade-in phase (camera unfreeze)
        timerRef.current = setTimeout(() => {
          eventBus.emit('camera:cinematic_transition', { phase: 'fadeIn', sceneId });

          // Schedule return to idle (no event needed — camera is unfrozen)
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
          }, CINEMATIC_PHASES.FADE_IN_DURATION * 1000);
        }, CINEMATIC_PHASES.HOLD_DURATION * 1000);
      }, CINEMATIC_PHASES.FADE_OUT_DURATION * 1000);
    });

    return () => {
      unsub();
      clearTimer();
    };
  }, [clearTimer]);

  // No visual output — SceneTransitionOverlay handles the visual transition
  return null;
}
