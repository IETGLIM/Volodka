
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { readGamePhase } from '@/shared/gamePhase';
import { eventBus, EventBusPriority } from '@/engine/EventBus';
import { withHmrCleanup } from '@/shared/dev/hmrDispose';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { startCombat } from '@/engine/CombatSystem';
import { getItemDefinition } from '@/data/items';
import { audioEngine } from '@/engine/audio/AudioEngine';
import { pickEnemyForCurrentState } from '@/engine/combat/enemies';
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

          startCombat(enemyType, { encounterSource: 'arena' });
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

    scope.on('combat:hit', ({ isPlayerHit, damage }) => {
      audioEngine.playSfx('combat_hit');
      triggerCameraShake(isPlayerHit ? 0.14 : 0.08, isPlayerHit ? 6 : 4);
      if (damage >= 20) {
        triggerCameraShake(0.12, 8);
      }
    }, EventBusPriority.FX);

    return withHmrCleanup(() => scope.dispose());
  }, []);

  return { startCombatFromStory };
}
