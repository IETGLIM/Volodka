/**
 * EnvironmentalHazardSystem — AAA-механика опасных зон окружения.
 *
 * Каждый кадр проверяет позицию игрока против hazard-зон текущей сцены.
 * При нахождении в зоне: повышает stress (exploration-state) с интервалом,
 * показывает toast при первом входе, эмитит screen FX (flash/vignette).
 *
 * Не наносит прямой HP-урон в exploration (HP живёт только в combat),
 * но высокий stress даёт дебаффы в следующем бою — тактическая глубина.
 *
 * Data-driven (фикс аудита 3.3-e): величина стресса за тик и интервал
 * берутся из данных дизайнера (damagePerTick/tickInterval в
 * environmentalHazards.ts) — раньше оба поля игнорировались хардкодом
 * 3/1.5с. Крупный урон (край крыши, 25) капится в стресс-эквивалент:
 * HP-часть урона применяется только в бою (см. resolveHazardStressPerTick).
 *
 * Визуальные зоны: каждая активная зона рендерит дешёвый диегетический
 * маркер (HazardZoneMarker) — игрок видит опасность до входа, а не только
 * постфактум. На low-пресете/visualLite маркеры статичны (без пульсации).
 *
 * HUD: вход/выход/тик публикуются в hazardStatusChannel — компактный
 * индикатор (HazardStatusIndicator) подписан напрямую, без eventBus.
 */
import { useEffect, useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { useFrameTick } from '@/engine/frame/useFrameTick';
import { useGameStore } from '@/store/gameStore';
import { usePlayerStore } from '@/store/stores/playerStore';
import { eventBus } from '@/engine/EventBus';
import { useGamePhase } from '@/store/selectors';
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { HazardZoneMarker } from './HazardZoneMarker';
import {
  getEnabledHazardsForScene,
  getHazardLabel,
  isInsideHazard,
  resolveHazardStressPerTick,
  resolveHazardTickInterval,
  type EnvironmentalHazard,
} from '@/data/environmentalHazards';
import {
  clearHazardStatus,
  markHazardTick,
  setHazardStatus,
} from '@/engine/hazard/hazardStatusChannel';

export function EnvironmentalHazardSystem({
  livePlayerPositionRef,
}: {
  livePlayerPositionRef: React.MutableRefObject<Vector3>;
}) {
  const mode = useGamePhase();
  const currentSceneId = useGameStore((s) => s.exploration.currentSceneId);
  const tickAccumulator = useRef(0);
  const activeHazardId = useRef<string | null>(null);
  const shownToasts = useRef<Set<string>>(new Set());
  const flags = useGameStore((s) => s.playerState.flags);
  const { visualLite } = useMobileVisualPerf();

  // Включённые зоны текущей сцены (гейт по флагам) — и для рантайм-тика,
  // и для 3D-маркеров. Мемоизируется: фильтрация не выполняется каждый кадр.
  const enabledHazards = useMemo(
    () => getEnabledHazardsForScene(currentSceneId, flags),
    [currentSceneId, flags],
  );

  // Смена сцены/фазы — сброс накопителя и HUD-канала, иначе индикатор
  // завис бы на зоне прошлой сцены.
  useEffect(() => {
    activeHazardId.current = null;
    tickAccumulator.current = 0;
    clearHazardStatus();
  }, [currentSceneId, mode]);

  useFrameTick('misc', (info) => {
    // Only run during exploration — combat has its own damage model.
    if (mode !== 'exploration') return;
    if (!livePlayerPositionRef.current) return;

    const dt = info.delta;
    const pos = livePlayerPositionRef.current;

    // Find the first hazard the player is standing in.
    let current: EnvironmentalHazard | null = null;
    for (const h of enabledHazards) {
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
          title: getHazardLabel(current.kind),
          subtitle: current.enterToast,
          type: 'info',
        });
      }
      // Visual feedback per kind + публикация в HUD-канал.
      if (activeHazardId.current !== current.id) {
        activeHazardId.current = current.id;
        emitHazardFx(current.kind);
        setHazardStatus({
          hazardId: current.id,
          kind: current.kind,
          label: getHazardLabel(current.kind),
          stressPerTick: resolveHazardStressPerTick(current),
          tickInterval: resolveHazardTickInterval(current),
        });
      }
      // Accumulate tick — интервал тоже из данных дизайнера.
      const interval = resolveHazardTickInterval(current);
      tickAccumulator.current += dt;
      if (tickAccumulator.current >= interval) {
        tickAccumulator.current = 0;
        applyStressDamage(current);
        markHazardTick();
      }
    } else {
      // Reset when leaving the hazard.
      if (activeHazardId.current) {
        activeHazardId.current = null;
        tickAccumulator.current = 0;
        clearHazardStatus();
      }
    }
  });

  // Диегетические маркеры зон: рендерятся всегда, пока зона включена
  // флагами (в т.ч. в кат-сценах — это часть окружения сцены).
  return (
    <group key={`hazards:${currentSceneId}`}>
      {enabledHazards.map((hazard) => (
        <HazardZoneMarker key={hazard.id} hazard={hazard} pulsate={!visualLite} />
      ))}
    </group>
  );
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

function applyStressDamage(hazard: EnvironmentalHazard): void {
  // Стресс за тик — из данных дизайнера (damagePerTick), капнутый до
  // разумного стресс-эквивалента: HP-часть урона применяется только в бою.
  // Высокий стресс даёт дебаффы в следующем бою — тактический стимул
  // обходить опасные зоны перед дракой.
  const stress = resolveHazardStressPerTick(hazard);
  const playerStore = usePlayerStore.getState();
  if (typeof playerStore.addStress === 'function') {
    playerStore.addStress(stress);
  }
  // Emit a subtle damage-number-style floating text via the exploration FX channel.
  eventBus.emit('fx:stat_change', { stat: 'stress', delta: stress, type: 'negative' });
}
