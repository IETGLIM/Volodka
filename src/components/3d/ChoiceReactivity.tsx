
/* ─── Volodka RPG – Choice Reactivity ─── */
/* Visual feedback system: moral choices trigger 3D world reactions.
 * When karma changes significantly, a colored point light pulses.
 * Positive karma → cyan pulse; negative karma → red pulse.
 * Also emits a glitch effect for dramatic impact. */

import { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { eventBus } from '@/engine/EventBus';

/** Duration of the pulse animation in seconds */
const PULSE_DURATION = 2.0;

/** Oscillation frequency for the light intensity */
const PULSE_FREQUENCY = 4;

/** Maximum light intensity during pulse peak */
const PULSE_MAX_INTENSITY = 3;

export function ChoiceReactivity() {
  const [pulseActive, setPulseActive] = useState(false);
  const [pulseColor, setPulseColor] = useState('#ffffff');
  const pulseRef = useRef<THREE.PointLight>(null);
  const timerRef = useRef(0);

  useEffect(() => {
    const unsub = eventBus.on('choice:made', ({ karmaChange, npcId, relationChange }) => {
      if (Math.abs(karmaChange) >= 5) {
        // Positive karma → cyan, negative → red
        setPulseColor(karmaChange > 0 ? '#00ffcc' : '#ff4444');
        setPulseActive(true);
        timerRef.current = 0;

        // Also emit a glitch effect proportional to the karma change magnitude
        const glitchIntensity = Math.min(Math.abs(karmaChange) / 20, 0.5);
        eventBus.emit('fx:glitch', { intensity: glitchIntensity, duration: 500 });
      }

      // NPC relation changes get a subtler effect
      if (npcId && relationChange && Math.abs(relationChange) >= 5) {
        // Warm pulse for positive relation, cold for negative
        setPulseColor(relationChange > 0 ? '#ffcc44' : '#8844ff');
        setPulseActive(true);
        timerRef.current = 0;
      }
    });
    return unsub;
  }, []);

  useFrame((_, delta) => {
    if (pulseActive) {
      timerRef.current += delta;
      if (timerRef.current > PULSE_DURATION) {
        setPulseActive(false);
      }
    }
    if (pulseRef.current) {
      if (pulseActive) {
        // Sinusoidal pulse with exponential decay
        const t = timerRef.current;
        const decay = 1 - (t / PULSE_DURATION);
        pulseRef.current.intensity = Math.sin(t * PULSE_FREQUENCY) * PULSE_MAX_INTENSITY * decay + 0.5;
      } else {
        // Smoothly fade to 0
        pulseRef.current.intensity = THREE.MathUtils.lerp(pulseRef.current.intensity, 0, 0.1);
      }
    }
  });

  return (
    <pointLight
      ref={pulseRef}
      position={[0, 3, 0]}
      color={pulseColor}
      intensity={0}
      distance={15}
      decay={2}
    />
  );
}
