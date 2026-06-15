import { useMemo } from 'react';
import { Waves } from 'lucide-react';
import { useGameStore } from '@/store/gameStore';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  isExplorationHudProfile,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { resolveAmbientPresentation } from '@/engine/audio/ambientPlayContext';
import type { SceneId } from '@/config/sceneDefinitions';

/** Visual + screen-reader caption for the active procedural ambient bed (exploration only). */
export function AmbientAtmosphereCaption() {
  const profile = useGameplayPresentationProfile();
  const reducedMotion = useEffectiveReducedMotion();
  const sceneId = useGameStore((s) => s.exploration.currentSceneId as SceneId);
  const timeOfDay = useGameStore((s) => s.exploration.timeOfDay);
  const showStoryOverlay = useGameStore((s) => s.showStoryOverlay);
  const currentNodeId = useGameStore((s) => s.currentNodeId);

  const presentation = useMemo(
    () => resolveAmbientPresentation(sceneId, timeOfDay, showStoryOverlay, currentNodeId),
    [sceneId, timeOfDay, showStoryOverlay, currentNodeId],
  );

  if (!isExplorationHudProfile(profile) || !presentation.resolved) return null;

  return (
    <div
      className="pointer-events-none fixed left-3 bottom-24 max-w-xs"
      style={{ zIndex: UI_LAYERS.HUD + 1 }}
      data-testid="ambient-atmosphere-caption"
      role="status"
      aria-live="polite"
      aria-atomic="true"
      aria-label={presentation.accessibilityDescription ?? undefined}
    >
      <div
        className={
          reducedMotion
            ? 'flex items-start gap-2 rounded-md border border-cyan-500/20 bg-slate-950/85 px-2.5 py-1.5'
            : 'flex items-start gap-2 rounded-md border border-cyan-500/25 bg-slate-950/75 px-2.5 py-1.5 backdrop-blur-sm shadow-[0_0_12px_rgba(34,211,238,0.15)]'
        }
      >
        <Waves className="size-3.5 shrink-0 text-cyan-400/90 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/80">
            {presentation.label}
          </p>
          <p className="sr-only">{presentation.accessibilityDescription}</p>
          <p className="text-[11px] leading-snug text-slate-200/90" aria-hidden>
            {presentation.accessibilityDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
