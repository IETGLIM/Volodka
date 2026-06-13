import { useEffect, useState } from 'react';
import {
  ACCESSIBILITY_SETTINGS_CHANGED,
  getAccessibilitySettings,
} from '@/engine/accessibility/accessibilitySettings';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { resolveNarrativeTypewriterSpeed } from '@/hooks/narrativePresentation';
import { useTypewriter } from '@/hooks/useTypewriter';

/** Typewriter with reduced-motion instant text and subtitle-scale speed. */
export function useNarrativeTypewriter(text: string, baseMs = 28) {
  const reducedMotion = useEffectiveReducedMotion();
  const [subtitleScale, setSubtitleScale] = useState(
    () => getAccessibilitySettings().subtitleScale,
  );
  const [textSpeed, setTextSpeed] = useState(
    () => getAccessibilitySettings().textSpeed,
  );

  useEffect(() => {
    const sync = () => {
      const settings = getAccessibilitySettings();
      setSubtitleScale(settings.subtitleScale);
      setTextSpeed(settings.textSpeed);
    };
    window.addEventListener(ACCESSIBILITY_SETTINGS_CHANGED, sync);
    return () => window.removeEventListener(ACCESSIBILITY_SETTINGS_CHANGED, sync);
  }, []);

  const speed = resolveNarrativeTypewriterSpeed(reducedMotion, subtitleScale, baseMs, textSpeed);
  const { displayed, done, skip } = useTypewriter(text, speed);

  useEffect(() => {
    if (reducedMotion && text) skip();
  }, [reducedMotion, text, skip]);

  return { displayed, done, skip, reducedMotion, subtitleScale, textSpeed };
}
