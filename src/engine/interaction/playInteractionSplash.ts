import { isEffectiveReducedMotion } from '@/engine/accessibility/accessibilitySettings';
import type { ControllerSession } from '@/engine/controller/ControllerSession';
import {
  completeCinematicTimeline,
  startCinematicTimeline,
} from '@/engine/cinematic/cinematicTimelineOrchestrator';
import { resolvedSplashToTimeline } from '@/engine/cinematic/splashToTimeline';
import type { ResolvedInteractionSplash } from '@/engine/interaction/resolveInteractionSplash';

export interface InteractionSplashEmitOptions {
  anchorIsNpc?: boolean;
  npcId?: string;
}

export function emitInteractionSplashStart(
  splash: ResolvedInteractionSplash,
  options?: InteractionSplashEmitOptions,
): void {
  const def = resolvedSplashToTimeline(splash);
  startCinematicTimeline({
    def,
    options: {
      anchor: splash.anchorPosition,
      npcId: options?.anchorIsNpc ? options.npcId : undefined,
    },
  });
}

export function emitInteractionSplashEnd(
  splash: ResolvedInteractionSplash,
  _options?: InteractionSplashEmitOptions,
): void {
  completeCinematicTimeline(splashTimelineId(splash));
}

export function splashTimelineId(splash: ResolvedInteractionSplash): string {
  return `splash_${splash.presetId}`;
}

export function playInteractionSplash(
  splash: ResolvedInteractionSplash,
  onComplete: () => void,
  session: ControllerSession,
  options?: InteractionSplashEmitOptions,
): void {
  if (isEffectiveReducedMotion()) {
    onComplete();
    return;
  }

  emitInteractionSplashStart(splash, options);

  session.schedule(() => {
    if (session.isDisposed()) return;
    emitInteractionSplashEnd(splash, options);
    onComplete();
  }, splash.durationMs);
}
