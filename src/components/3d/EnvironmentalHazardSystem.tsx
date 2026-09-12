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
import { audioEngine } from '@/engine/AudioEngine';
import { useGamePhase } from '@/store/selectors';
import { useMobileVisualPerf } from '@/hooks/use-mobile';
import { HazardZoneMarker } from './HazardZoneMarker';
import {
  getEnabledHazardsForScene,
  getHazardLabel,
  HAZARD_KIND_SFX,
  isInsideHazard,
  pickStrongestHazard,
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
  // FIX (v4.20): аккумулятор тика — ПРЕДЗОННЫЙ (Map<hazardId, seconds>):
  // наложение зон тикает независимо с интервалом каждой, а переход
  // A→B больше не наследует накопленное время A (раньше первый тик B
  // мог выстрелить мгновенно — аккумулятор был один на все зоны).
  const tickAccumulators = useRef<Map<string, number>>(new Map());
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

  // Смена сцены/фазы — сброс накопителей и HUD-канала, иначе индикатор
  // завис бы на зоне прошлой сцены. Тосты входа перезаряжаются: вернувшись
  // в сцену позже, игрок снова получит предупреждение (один раз за вход
  // в сцену, не за сессию — раньше Set не чистился никогда).
  useEffect(() => {
    activeHazardId.current = null;
    tickAccumulators.current.clear();
    shownToasts.current.clear();
    clearHazardStatus();
  }, [currentSceneId, mode]);

  useFrameTick('misc', (info) => {
    // Only run during exploration — combat has its own damage model.
    if (mode !== 'exploration') return;
    if (!livePlayerPositionRef.current) return;

    const dt = info.delta;
    const pos = livePlayerPositionRef.current;

    // Все зоны, в которых стоит игрок (не только первая — наложения
    // тикают независимо, см. tickAccumulators).
    const inside = enabledHazards.filter(
      (h) => isInsideHazard(h, pos.x, pos.y, pos.z),
    );

    if (inside.length > 0) {
      // Одноразовые тосты входа (перезаряжаются при смене сцены).
      for (const h of inside) {
        if (h.enterToast && !shownToasts.current.has(h.id)) {
          shownToasts.current.add(h.id);
          eventBus.emit('game:notification', {
            title: getHazardLabel(h.kind),
            subtitle: h.enterToast,
            type: 'info',
          });
        }
      }

      // HUD показывает сильнейшую зону (стресс за тик → урон → id).
      const primary = pickStrongestHazard(inside);
      if (primary && activeHazardId.current !== primary.id) {
        activeHazardId.current = primary.id;
        emitHazardFx(primary.kind);
        audioEngine.playSfx(HAZARD_KIND_SFX[primary.kind]);
        setHazardStatus({
          hazardId: primary.id,
          kind: primary.kind,
          label: getHazardLabel(primary.kind),
          stressPerTick: resolveHazardStressPerTick(primary),
          tickInterval: resolveHazardTickInterval(primary),
        });
      }

      // Незадействованные аккумуляторы чистим (выход из зоны A при
      // стоянии в B не должен хранить прогресс A — повторный вход
      // стартует заново).
      for (const id of [...tickAccumulators.current.keys()]) {
        if (!inside.some((h) => h.id === id)) tickAccumulators.current.delete(id);
      }

      // Независимые тики зон — интервал каждой из данных дизайнера.
      let primaryTicked = false;
      for (const h of inside) {
        const interval = resolveHazardTickInterval(h);
        const acc = (tickAccumulators.current.get(h.id) ?? 0) + dt;
        if (acc >= interval) {
          tickAccumulators.current.set(h.id, 0);
          applyStressDamage(h);
          audioEngine.playSfx(HAZARD_KIND_SFX[h.kind]);
          if (primary && h.id === primary.id) primaryTicked = true;
        } else {
          tickAccumulators.current.set(h.id, acc);
        }
      }
      // HUD-таймер синхронизируем с тиком показанной (сильнейшей) зоны;
      // тики фоновых зон его не сбрасывают.
      if (primaryTicked) markHazardTick();
    } else {
      // Reset when leaving all hazards.
      if (activeHazardId.current) {
        activeHazardId.current = null;
        tickAccumulators.current.clear();
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
    case 'static':
      // Белый шум: лёгкая хроматика + холодная вспышка — давление на
      // восприятие без «физического» удара (зона психологическая).
      eventBus.emit('fx:flash', { color: '#cfe8ff', opacity: 0.18, duration: 260 });
      eventBus.emit('fx:chromatic', { intensity: 2, duration: 800 });
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
