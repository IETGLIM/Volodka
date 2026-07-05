import { useEffect } from 'react';
import { useEffectiveReducedMotion } from '@/hooks/useEffectiveReducedMotion';
import { useAccessibilitySettings } from '@/hooks/useAccessibilitySettings';
import { resolveNarrativeTypewriterSpeed } from '@/hooks/narrativePresentation';
import { useTypewriter } from '@/hooks/useTypewriter';

/** Typewriter with reduced-motion instant text and subtitle-scale speed. */
export function useNarrativeTypewriter(text: string, baseMs = 28) {
  const reducedMotion = useEffectiveReducedMotion();
  const { subtitleScale, textSpeed } = useAccessibilitySettings();

  const speed = resolveNarrativeTypewriterSpeed(reducedMotion, subtitleScale, baseMs, textSpeed);
  const { displayed, done, skip } = useTypewriter(text, speed);

  useEffect(() => {
    if (reducedMotion && text) skip();
  }, [reducedMotion, text, skip]);

  return { displayed, done, skip, reducedMotion, subtitleScale, textSpeed };
}
