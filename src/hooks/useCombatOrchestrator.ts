
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { startCombat } from '@/engine/CombatSystem';
import { getItemDefinition } from '@/data/items';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { pickEnemyForCurrentState, rollEncounterWave } from '@/engine/combat/enemies';
import { gamepadRumbleDanger } from '@/shared/utils/gamepadRumble';
import type { EnemyType } from '@/shared/types/game';

/**
 * Sub-orchestrator that handles all combat-related EventBus subscriptions:
 * - Starting combat from battle scene entry or story effects
 * - Processing combat victory (loot notifications; XP/karma applied in CombatSystem)
 * - Processing combat defeat (energy/karma loss notification)
 * - Camera shake on combat hits
 *
 * P1-3.7 FIX: Replaced dynamic import() with static imports.
 * Dynamic imports in event handlers created a window between event emission
 * and chunk loading — if mode changed during that window, combat could start
 * in an invalid state (race condition). CombatSystem and items are small enough
 * that code-splitting here provides no benefit.
 *
 * Task 4-b: Enemy selection now considers act progression and player level,
 * not just karma. Uses pickEnemyForCurrentState() for act-aware selection.
 */
export function useCombatOrchestrator() {
  const startCombatFromStory = useCallback((enemyType: EnemyType) => {
    startCombat(enemyType, { encounterSource: 'story' });
  }, []);

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('scene:enter', ({ sceneId }) => {
      if (sceneId === 'battle') {
        const store = useGameStore.getState();
        if (readGamePhase(store) === 'exploration') {
          // Task 4-b: Use act+level-aware enemy selection instead of karma-only
          const enemyType = pickEnemyForCurrentState();

          // v4.7.8 «Волна из двух врагов»: на акте 3+ арена-бой может
          // подкрепиться вторым врагом (шанс 15–35% по актам). Отдельный
          // бросок Math.random — волна не обязана быть детерминированной
          // (в отличие от основного пика, влияющего на баланс сейвскама).
          const snapshot = store;
          const waveEnemy = rollEncounterWave(
            snapshot.playerState.progression.currentAct,
            snapshot.playerState.progression.level,
            snapshot.playerState.karma,
            Math.random(),
            enemyType,
          );

          startCombat(enemyType, {
            encounterSource: 'arena',
            pendingEnemies: waveEnemy ? [waveEnemy] : [],
          });
        }
      }
    });

    scope.on('combat:victory', ({ lootItemId }) => {
      if (lootItemId) {
        const def = getItemDefinition(lootItemId);
        useGameStore.getState().pushNotification('quest', `Найден предмет: ${def?.name ?? lootItemId}`);
      }
    }, EventBusPriority.Orchestrator);

    scope.on('combat:defeat', ({ energyLost, karmaLost }) => {
      useGameStore.getState().pushNotification('energy', `Поражение: -${energyLost} энергии, -${karmaLost} кармы`);
    }, EventBusPriority.Orchestrator);

    scope.on('combat:start', () => {
      audioEngine.playSfx('combat_start');
    }, EventBusPriority.FX);

    scope.on('combat:hit', ({ isPlayerHit, source, isCritical }) => {
      // Differentiated combat impact SFX (Task 3.3-b1): player hits enemy /
      // enemy hits player / critical / super-effective (affinity ×2) / enemy
      // special — each has its own preset instead of one combat_hit for all.
      if (isPlayerHit) {
        audioEngine.playSfx(source === 'enemy_special' ? 'combat_special_hit' : 'combat_hit_player');
      } else if (isCritical || source === 'critical_hit') {
        audioEngine.playSfx('combat_crit');
      } else if (source === 'affinity_super') {
        audioEngine.playSfx('combat_super');
      } else {
        audioEngine.playSfx('combat_hit');
      }
      // NOTE: Camera shake is handled exclusively by AaaCombatCinematic, which
      // listens to combat:action + combat:hit + combat:bullet_time with
      // differentiated intensities (crit / super-effective / combo / normal).
      // Duplicating the shake here stacked 2-3 shakes per hit and felt jarring.
    }, EventBusPriority.FX);

    // Short triumph stinger on combat victory (fires right when the outcome
    // is known — combat:end follows ~3s later and also fires on flee, so
    // victory/defeat are the precise hooks).
    scope.on('combat:victory', () => {
      audioEngine.playStinger('victory');
    }, EventBusPriority.FX);

    // Low minor stinger on defeat.
    scope.on('combat:defeat', () => {
      audioEngine.playStinger('defeat');
    }, EventBusPriority.FX);

    // Telegraph: the enemy began charging a special — alarm cue for the
    // one-turn counter-window («Готовит: …!»).
    scope.on('combat:telegraph', () => {
      audioEngine.playStinger('danger');
      // Haptic: нарастающая «зарядка» — двойной гул, сильнее обычного удара.
      gamepadRumbleDanger();
    }, EventBusPriority.FX);

    // v4.7.8 «Волна из двух врагов»: первый пал — второй вступает.
    // Mystery-стингер + тяжёлая вибрация: бой не кончился, цель сменилась.
    scope.on('combat:wave_swap', () => {
      audioEngine.playStinger('mystery');
      gamepadRumbleDanger();
    }, EventBusPriority.FX);

    // Boss phase transition (100/60/30) — danger sting + the combat log's
    // «… переходит в фазу …» beat.
    scope.on('combat:boss_phase', () => {
      audioEngine.playStinger('danger');
      // Haptic: фазовый переход босса — тяжёлый двойной удар (и-фрейсы).
      gamepadRumbleDanger();
    }, EventBusPriority.FX);

    return withHmrCleanup(() => scope.dispose());
  }, []);

  return { startCombatFromStory };
}
