/**
 * Звуковой режиссер пролога — ошеломительно, но не навязчиво.
 * Все SFX через audioEngine, с учетом reducedMotion и musicEnabled.
 */

import { useEffect, useRef } from 'react';
import { audioEngine } from '@/engine/AudioEngine';
import type { ProloguePhase } from './prologuePerfectionConstants';

interface Props {
  phase: ProloguePhase;
  reducedMotion: boolean;
}

export function PrologueAudioDirector({ phase, reducedMotion }: Props) {
  const lastPhase = useRef<ProloguePhase | null>(null);

  useEffect(() => {
    if (reducedMotion) return;
    if (lastPhase.current === phase) return;
    lastPhase.current = phase;

    try {
      switch (phase) {
        case 'boot':
          audioEngine.playSfx('ui_open');
          break;
        case 'breath':
          audioEngine.playSfx('notify');
          break;
        case 'eyeOpen':
          audioEngine.playSfx('ui_open');
          break;
        case 'title':
          audioEngine.playStinger('mystery');
          break;
        case 'handoff':
          audioEngine.playSfx('confirm');
          break;
      }
    } catch {
      // audio может быть не инициализирован — не критично
    }
  }, [phase, reducedMotion]);

  return null;
}
