/**
 * EnvironmentalHazardSystem — AAA-механика опасных зон окружения.
 *
 * Каждый кадр проверяет позицию игрока против hazard-зон текущей сцены.
 * При нахождении в зоне: повышает stress (exploration-state) с интервалом,
 * показывает toast при первом входе, эмитит screen FX (flash/vignette).
 *
 * Не наносит прямой HP-урон в exploration (HP живёт только в combat),
 * но высокий stress даёт дебаффы в следующем бою — тактическая глубина.
 */
import { useRef } from 'react';
import * as THREE from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/stores/playerStore';
import { eventBus } from '@/engine/EventBus';
import { useGamePhase } from '@/store/selectors';
import { getHazardsForScene, isInsideHazard, type EnvironmentalHazard } from '@/data/environmentalHazards';

const STRESS_PER_TICK = 3;
const HAZARD_TICK_INTERVAL = 1.5; // seconds

export function EnvironmentalHazardSystem({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<THREE.Vector3>;
}) {
  const mode = useGamePhase();
  const currentSceneId = useGameStore((s) => s.exploration.currentSceneId);
  const tickAccumulator = useRef(0);
  const activeHazardId = useRef<string | null>(null);
  const shownToasts = useRef<Set<string>>(new Set());
  const flags = useGameStore((s) => s.playerState.flags);

  useFrameTick('misc', (info) => {
    // Only run during exploration — combat has its own damage model.
    if (mode !== 'exploration') return;
    if (!livePlayerPositionRef.current) return;

    const dt = info.delta;
    const pos = livePlayerPositionRef.current;
    const hazards = getHazardsForScene(currentSceneId);

    // Find the first hazard the player is standing in.
    let current: EnvironmentalHazard | null = null;
    for (const h of hazards) {
      // Gate on flags if specified.
      if (h.requiredFlag && !flags[h.requiredFlag]) continue;
      if (h.disabledWhenFlag && flags[h.disabledWhenFlag]) continue;
      if (isInsideHazard(h, pos.x, pos.y, pos.z)) {
        current = h;
        break;
      }
    }

    if (current) {
      // Show one-time entry toast.
      if (current.enterToast && !shownToasts.current.has(current.id)) {
        shownToasts.current.add(current.id);
        eventBus.emit('game:notification', {
          title: hazardLabel(current.kind),
          subtitle: current.enterToast,
          type: 'info',
        });
      }
      // Visual feedback per kind.
      if (activeHazardId.current !== current.id) {
        activeHazardId.current = current.id;
        emitHazardFx(current.kind);
      }
      // Accumulate tick.
      tickAccumulator.current += dt;
      if (tickAccumulator.current >= HAZARD_TICK_INTERVAL) {
        tickAccumulator.current = 0;
        applyStressDamage(current);
      }
    } else {
      // Reset when leaving the hazard.
      if (activeHazardId.current) {
        activeHazardId.current = null;
        tickAccumulator.current = 0;
      }
    }
  });

  return null;
}

function hazardLabel(kind: EnvironmentalHazard['kind']): string {
  switch (kind) {
    case 'fire': return 'Огонь';
    case 'electric': return 'Электричество';
    case 'toxic': return 'Токсичные пары';
    case 'fall': return 'Край';
    case 'drown': return 'Глубокая вода';
  }
}

function emitHazardFx(kind: EnvironmentalHazard['kind']): void {
  switch (kind) {
    case 'fire':
      eventBus.emit('fx:flash', { color: '#ff6a2a', opacity: 0.2, duration: 400 });
      eventBus.emit('fx:vignette', { intensity: 0.4, duration: 1500 });
      break;
    case 'electric':
      eventBus.emit('fx:flash', { color: '#7fd8ff', opacity: 0.3, duration: 200 });
      eventBus.emit('fx:chromatic', { intensity: 3, duration: 600 });
      break;
    case 'toxic':
      eventBus.emit('fx:vignette', { intensity: 0.35, duration: 2000 });
      break;
    case 'fall':
      eventBus.emit('fx:shake', { intensity: 4, duration: 500 });
      break;
    case 'drown':
      eventBus.emit('fx:vignette', { intensity: 0.3, duration: 2500 });
      break;
  }
}

function applyStressDamage(_hazard: EnvironmentalHazard): void {
  // Increase player stress — high stress gives combat debuffs, creating
  // tactical incentive to avoid hazardous zones before a fight.
  const playerStore = usePlayerStore.getState();
  if (typeof playerStore.addStress === 'function') {
    playerStore.addStress(STRESS_PER_TICK);
  }
  // Emit a subtle damage-number-style floating text via the exploration FX channel.
  eventBus.emit('fx:stat_change', { stat: 'stress', delta: STRESS_PER_TICK, type: 'negative' });
}
