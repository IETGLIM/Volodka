
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { triggerHitStop, triggerPoemPowerSlowMo } from '@/engine/camera/cinematicCamera';
import { isReducedMotionActive } from '@/shared/accessibility/reducedMotion';
import { sfxEngine } from '@/engine/audio/SfxEngine';
import {
  getEnemyHitPan,
  getPlayerHitPan,
} from '@/engine/audio/combatSpatialSfx';
import { startCombat, getCombatState } from '@/engine/CombatSystem';
import { getItemDefinition } from '@/data/items';
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
 */
export function useCombatOrchestrator() {
  const startCombatFromStory = useCallback((enemyType: EnemyType) => {
    startCombat(enemyType);
  }, []);

  useEffect(() => {
    const scope = eventBus.createScope();

    scope.on('scene:enter', ({ sceneId }) => {
      if (sceneId === 'battle') {
        const store = useGameStore.getState();
        if (readGamePhase(store) === 'exploration') {
          const karma = store.playerState.karma;
          let enemyType: EnemyType = 'system_daemon';
          if (karma > 65) enemyType = 'shadow_agent';
          else if (karma > 35) enemyType = 'corporate_golem';

          startCombat(enemyType);
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

    scope.on('combat:hit', ({ isPlayerHit }) => {
      const enemyType = getCombatState()?.enemy.type;
      if (isPlayerHit) {
        triggerHitStop(80);
        triggerCameraShake(0.2, 6);
        if (enemyType) {
          sfxEngine.playSpatialSfx('combat_hit', getPlayerHitPan(enemyType));
        }
      } else {
        triggerCameraShake(0.14, 5);
        if (enemyType) {
          sfxEngine.playSpatialSfx('combat_hit', getEnemyHitPan(enemyType));
        }
      }
    }, EventBusPriority.FX);

    scope.on('combat:miss', () => {
      const enemyType = getCombatState()?.enemy.type;
      const pan = enemyType ? getEnemyHitPan(enemyType) : 0;
      sfxEngine.playSpatialSfx('combat_miss', pan);
    }, EventBusPriority.FX);

    scope.on('poem:power_used', () => {
      if (isReducedMotionActive()) return;
      triggerPoemPowerSlowMo(100, 0.35);
      triggerCameraShake(0.24, 6);
      sfxEngine.playSpatialSfx('combat_poem_power', 0);
    }, EventBusPriority.FX);

    return withHmrCleanup(() => scope.dispose());
  }, []);

  return { startCombatFromStory };
}
