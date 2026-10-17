import { useEffect, useMemo, useRef, useState } from 'react';
import { Waves } from 'lucide-react';
import { UI_LAYERS } from '@/shared/constants/uiLayers';
import {
  isExplorationHudProfile,
  useGameplayPresentationProfile,
} from '@/hooks/useGameplayPresentationProfile';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useHudFocusMode } from '@/hooks/useHudFocusMode';
import { useHudQuietStyle } from '@/hooks/useHudQuiet';
import { resolveAmbientPresentation } from '@/engine/audio/ambientPlayContext';
import { useAtmosphereCaptionState } from '@/store/selectors';
import type { SceneId } from '@/config/sceneDefinitions';

/** v4.57.0 («Тихий HUD»): каптион атмосферы — транзиент, а не постоянная
 *  вывеска. Показывается 9с после смены сцены/варианта подачи, затем тает;
 *  тихий режим (6с без ввода) приглушает его до призрака. */
const CAPTION_VISIBLE_MS = 9000;

/** Visual + screen-reader caption for the active procedural ambient bed (exploration only). */
export function AmbientAtmosphereCaption() {
  const profile = useGameplayPresentationProfile();
  const reducedMotion = useEffectiveReducedMotion();
  const focusMode = useHudFocusMode();
  const quietStyle = useHudQuietStyle();
  /* Этап 100: одна shallow-подписка вместо пяти отдельных. */
  const {
    sceneId,
    timeOfDay,
    showStoryOverlay,
    currentNodeId,
    diegeticNarrative,
  } = useAtmosphereCaptionState();
  const typedSceneId = sceneId as SceneId;

  const presentation = useMemo(
    () => resolveAmbientPresentation(typedSceneId, timeOfDay, showStoryOverlay, currentNodeId),
    [typedSceneId, timeOfDay, showStoryOverlay, currentNodeId],
  );

  /* v4.57.0: TTL каптиона — ключ сцены/подачи перезапускает окно видимости. */
  const presentationKey = presentation.resolved ? `${sceneId}:${timeOfDay}:${presentation.label}` : '';
  const [visible, setVisible] = useState(false);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (!presentationKey) {
      setVisible(false);
      return;
    }
    setVisible(true);
    hideTimerRef.current = setTimeout(() => setVisible(false), CAPTION_VISIBLE_MS);
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, [presentationKey]);

  // Hide the ambient caption while a diegetic dialogue plate is open — it sits at
  // bottom-left and would overlap the dialogue plate. Pure visibility guard.
  // v4.57.0: плюс режим фокуса (осмотр/катсцена/story) и TTL — мир важнее подписи.
  if (!isExplorationHudProfile(profile) || !presentation.resolved) return null;
  if (diegeticNarrative != null || focusMode || !visible) return null;

  return (
    <div
      className="pointer-events-none fixed left-3 bottom-24 max-w-xs transition-opacity duration-700"
      style={{ zIndex: UI_LAYERS.HUD + 1, ...quietStyle }}
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
            : 'flex items-start gap-2 rounded-md border border-cyan-500/25 bg-slate-950/75 px-2.5 py-1.5 backdrop-blur-sm shadow-[0_0_12px_rgba(157,179,200,0.15)]'
        }
      >
        <Waves className="size-3.5 shrink-0 text-cyan-400/90 mt-0.5" aria-hidden />
        <div className="min-w-0">
          <p className="text-[10px] font-mono uppercase tracking-wider text-cyan-300/80">
            {presentation.label}
          </p>
          <p className="sr-only">{presentation.accessibilityDescription}</p>
          <p
            className="text-[11px] leading-snug text-slate-200/90"
            style={{
              // Accessibility: scale ambient caption with the --subtitle-scale CSS var
              // set by AccessibilityManager on <html> (default 1 = no scaling). Base
              // size is 0.6875rem (Tailwind text-[11px]) so scale=1 preserves the
              // original compact look.
              fontSize: 'calc(0.6875rem * var(--subtitle-scale, 1))',
            }}
            aria-hidden
          >
            {presentation.accessibilityDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
