import { eventBus } from '@/engine/EventBus';
import type { ControllerSession } from '@/engine/controller/ControllerSession';
import {
  setCinematicHoldActive,
  setCinematicPresentationMode,
} from '@/engine/camera/cinematicPresentation';
import type { ResolvedInteractionSplash } from '@/engine/interaction/resolveInteractionSplash';

export interface InteractionSplashEmitOptions {
  anchorIsNpc?: boolean;
  npcId?: string;
}

function finishSplashPresentation(): void {
  setCinematicHoldActive(false);
  setCinematicPresentationMode('first_person');
  eventBus.emit('camera:recenter', {});
}

export function emitInteractionSplashStart(
  splash: ResolvedInteractionSplash,
  options?: InteractionSplashEmitOptions,
): void {
  setCinematicPresentationMode('third_person');
  setCinematicHoldActive(true);

  eventBus.emit('camera:interaction_splash_start', {
    splashId: splash.presetId,
    waypoints: splash.waypoints,
    anchorPosition: splash.anchorPosition,
    anchorIsNpc: options?.anchorIsNpc ?? false,
    npcId: options?.npcId,
  });

  if (splash.letterboxStyle !== 'none') {
    eventBus.emit('cutscene:overlay', {
      text: splash.textOverlay ?? '',
      subtitle: splash.subtitle,
      accentColor: splash.textAccentColor ?? '#44ffff',
      durationMs: splash.durationMs,
      type: splash.textOverlay ? 'character_intro' : 'story_moment',
      letterboxStyle: splash.letterboxStyle,
      showEmbers: false,
      glitchIntensity: 0,
    });
  }
}

export function emitInteractionSplashEnd(
  splash: ResolvedInteractionSplash,
  options?: InteractionSplashEmitOptions,
): void {
  eventBus.emit('camera:interaction_splash_end', {
    splashId: splash.presetId,
    npcId: options?.npcId,
  });
  eventBus.emit('cutscene:overlay_end', {});
  finishSplashPresentation();
}

export function playInteractionSplash(
  splash: ResolvedInteractionSplash,
  onComplete: () => void,
  session: ControllerSession,
  options?: InteractionSplashEmitOptions,
): void {
  emitInteractionSplashStart(splash, options);

  session.schedule(() => {
    if (session.isDisposed()) return;
    emitInteractionSplashEnd(splash, options);
    onComplete();
  }, splash.durationMs);
}
