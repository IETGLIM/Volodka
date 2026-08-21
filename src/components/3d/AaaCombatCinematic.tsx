/* ─── AAA Combat Cinematic — hit pause, camera kick, chromatic burst ───
 * Listens to combat:action / combat:hit / combat:bullet_time and
 * emits luxurious camera effects. No extra geometry, pure event-driven.
 */

import { useEffect } from 'react';
import { eventBus } from '@/engine/EventBus';
import { triggerCameraShake } from '@/engine/camera/cameraShake';

export function AaaCombatCinematic() {
  useEffect(() => {
    const unsubs = [
      eventBus.on('combat:action', ({ isCritical, comboCount, damageChannel }) => {
        // Differentiated shake: crit 0.8, super-effective 0.55, combo 0.35, normal 0.22
        const base = isCritical ? 0.78 : (comboCount ?? 0) >= 3 ? 0.38 : damageChannel === 'affinity_super' ? 0.52 : 0.22;
        triggerCameraShake(base, base > 0.5 ? 4.2 : 6.5);

        // Slight chromatic kick for crits — handled in postfx via stress factor already,
        // but we also emit a custom event for HUDChromaticEdge to catch
        if (isCritical) {
          eventBus.emit('fx:chromatic_burst', { intensity: 0.65, duration: 220 });
        }
      }),
      eventBus.on('combat:hit', ({ isPlayerHit, damage }) => {
        if (isPlayerHit) {
          // Player takes damage — heavier, downward shake
          const intensity = Math.min(0.85, 0.25 + (damage ?? 0) * 0.018);
          triggerCameraShake(intensity, 5.2);
          eventBus.emit('fx:screen_flash', { color: 'rgba(180,40,40,0.12)', duration: 180 });
        } else {
          // Enemy hit — light punch
          triggerCameraShake(0.16, 7);
        }
      }),
      eventBus.on('combat:bullet_time' as any, ({ intensity }) => {
        // Bullet time already slows game via ScreenEffects, add camera FOV punch
        if (intensity > 0.4) {
          triggerCameraShake(intensity * 0.35, 3.5);
        }
      }),
    ];
    return () => unsubs.forEach(u => u());
  }, []);

  return null;
}
