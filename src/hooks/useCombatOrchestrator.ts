
import { useEffect, useCallback } from 'react';
import { useGameStore } from '@/store/gameStore';
import { eventBus } from '@/engine/EventBus';
import { triggerCameraShake } from '@/engine/camera/cameraShake';
import { startCombat } from '@/engine/CombatSystem';
import { getItemDefinition } from '@/data/items';
import type { EnemyType } from '@/shared/types/game';

/**
 * Sub-orchestrator that handles all combat-related EventBus subscriptions:
 * - Starting combat from battle scene entry or story effects
 * - Processing combat victory (XP, loot notifications)
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
    const unsubs: (() => void)[] = [];

    // Handle combat trigger from entering battle scene
    unsubs.push(
      eventBus.on('scene:enter', ({ sceneId }) => {
        if (sceneId === 'battle') {
          const store = useGameStore.getState();
          if (store.mode === 'exploration') {
            // Random enemy based on karma level
            const karma = store.playerState.karma;
            let enemyType: EnemyType = 'system_daemon';
            if (karma > 65) enemyType = 'shadow_agent';
            else if (karma > 35) enemyType = 'corporate_golem';

            startCombat(enemyType);
          }
        }
      }),
    );

    // Handle combat:victory for loot notifications.
    // XP/karma are applied in CombatSystem.handleVictory — do not addXp here (double reward).
    unsubs.push(
      eventBus.on('combat:victory', ({ lootItemId }) => {
        const store = useGameStore.getState();

        // Push notification for loot
        if (lootItemId) {
          const def = getItemDefinition(lootItemId);
          store.pushNotification('quest', `Найден предмет: ${def?.name ?? lootItemId}`);
        }
      }),
    );

    // Handle combat:defeat
    unsubs.push(
      eventBus.on('combat:defeat', ({ energyLost, karmaLost }) => {
        useGameStore.getState().pushNotification('energy', `Поражение: -${energyLost} энергии, -${karmaLost} кармы`);
      }),
    );

    // Camera shake on combat hit
    unsubs.push(
      eventBus.on('combat:hit', () => {
        triggerCameraShake(0.1, 5);
      }),
    );

    return () => unsubs.forEach((u) => u());
  }, []);

  return { startCombatFromStory };
}
