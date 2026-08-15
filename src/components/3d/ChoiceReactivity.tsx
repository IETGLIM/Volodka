
/* ─── Volodka RPG – Choice Reactivity ─── */
/* Visual feedback system: moral choices trigger 3D world reactions.
 * When karma changes significantly, a colored point light pulses.
 * Positive karma → cyan pulse; negative karma → red pulse.
 * Also emits a glitch effect for dramatic impact. */

import { useRef, useEffect } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { MathUtils, PointLight } from 'three';
import { eventBus } from '@/engine/EventBus';

/** Duration of the pulse animation in seconds */
const PULSE_DURATION = 2.0;

/** Oscillation frequency for the light intensity */
const PULSE_FREQUENCY = 4;

/** Maximum light intensity during pulse peak */
const PULSE_MAX_INTENSITY = 3;

export function ChoiceReactivity() {
  const pulseActiveRef = useRef(false);
  const pulseColorRef = useRef('#ffffff');
  const pulseRef = useRef<PointLight>(null);
  const timerRef = useRef(0);

  useEffect(() => {
    const unsub = eventBus.on('choice:made', ({ karmaChange, npcId, relationChange }) => {
      if (Math.abs(karmaChange) >= 5) {
        pulseColorRef.current = karmaChange > 0 ? '#00ffcc' : '#ff4444';
        pulseActiveRef.current = true;
        timerRef.current = 0;
        if (pulseRef.current) {
          pulseRef.current.color.set(pulseColorRef.current);
        }

        const glitchIntensity = Math.min(Math.abs(karmaChange) / 20, 0.5);
        eventBus.emit('fx:glitch', { intensity: glitchIntensity, duration: 500 });
      }

      if (npcId && relationChange && Math.abs(relationChange) >= 5) {
        pulseColorRef.current = relationChange > 0 ? '#ffcc44' : '#8844ff';
        pulseActiveRef.current = true;
        timerRef.current = 0;
        if (pulseRef.current) {
          pulseRef.current.color.set(pulseColorRef.current);
        }
      }
    });
    return unsub;
  }, []);

  useFrameTick('misc', ({ delta }) => {
    const light = pulseRef.current;
    if (!light) return;

    if (pulseActiveRef.current) {
      timerRef.current += delta;
      if (timerRef.current > PULSE_DURATION) {
        pulseActiveRef.current = false;
      } else {
        const t = timerRef.current;
        const decay = 1 - (t / PULSE_DURATION);
        light.intensity = Math.sin(t * PULSE_FREQUENCY) * PULSE_MAX_INTENSITY * decay + 0.5;
        return;
      }
    }

    light.intensity = MathUtils.lerp(light.intensity, 0, 0.1);
  });

  return (
    <pointLight
      ref={pulseRef}
      position={[0, 3, 0]}
      color={pulseColorRef.current}
      intensity={0}
      distance={15}
      decay={2}
    />
  );
}
