import { useRef, type RefObject } from 'react';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import * as THREE from 'three';

const PULSE_INTENSITY = 1.8;
const PULSE_DURATION = 0.1; // 100ms
const ALERT_THRESHOLD = 2.0; // zabbix emissiveIntensity above this = "alert on"
const BASE_COLOR = new THREE.Color('#ffe8cc');
const ALERT_COLOR = new THREE.Color('#ff6644');

/**
 * Watches the Zabbix alert LED material. When it transitions to bright (alert on),
 * briefly shifts the given ambient light's color toward red for ~0.1s.
 *
 * Pure-refs — no React re-renders.
 */
export function useZabbixAlertPulse(
  zabbixAlertRef: RefObject<THREE.MeshStandardMaterial | null>,
  ambientLightRef: RefObject<THREE.PointLight | null>,
): void {
  const wasAlertRef = useRef(false);
  const pulseTimerRef = useRef(0);
  const isPulsingRef = useRef(false);
  const tmpColor = useRef(new THREE.Color());

  useFrameTick('misc', ({ delta }) => {
    const light = ambientLightRef.current;
    if (!light) return;

    const led = zabbixAlertRef.current;
    const ledIntensity = led ? led.emissiveIntensity : 0;
    const isAlert = ledIntensity > ALERT_THRESHOLD;

    // Detect rising edge of alert
    if (isAlert && !wasAlertRef.current) {
      isPulsingRef.current = true;
      pulseTimerRef.current = 0;
    }
    wasAlertRef.current = isAlert;

    if (isPulsingRef.current) {
      pulseTimerRef.current += delta;
      const t = Math.min(pulseTimerRef.current / PULSE_DURATION, 1);

      // Instant attack, smooth release
      let blend: number;
      if (t < 0.2) {
        // attack: 0 → 1 in first 20% of duration
        blend = t / 0.2;
      } else {
        // release: 1 → 0 over remaining 80%
        blend = 1 - (t - 0.2) / 0.8;
      }

      const c = tmpColor.current;
      c.copy(BASE_COLOR).lerp(ALERT_COLOR, blend * 0.35); // subtle 35% blend
      light.color.copy(c);
      light.intensity = PULSE_INTENSITY + blend * 0.6;

      if (t >= 1) {
        isPulsingRef.current = false;
        light.color.copy(BASE_COLOR);
        light.intensity = PULSE_INTENSITY;
      }
    }
  });
}