import { useEffect, useState } from 'react';
import { eventBus } from '@/engine/EventBus';
import { getAccessibilitySettings } from '@/engine/accessibility/accessibilitySettings';
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
    return eventBus.on('accessibility:changed', ({ changedKey, settings }) => {
      if (changedKey === 'all' || changedKey === 'subtitleScale') {
        setSubtitleScale(settings.subtitleScale);
      }
      if (changedKey === 'all' || changedKey === 'textSpeed') {
        setTextSpeed(settings.textSpeed);
      }
    });
  }, []);

  const speed = resolveNarrativeTypewriterSpeed(reducedMotion, subtitleScale, baseMs, textSpeed);
  const { displayed, done, skip } = useTypewriter(text, speed);

  useEffect(() => {
    if (reducedMotion && text) skip();
  }, [reducedMotion, text, skip]);

  return { displayed, done, skip, reducedMotion, subtitleScale, textSpeed };
}
