import { useEffect } from 'react';
import { useGameStore } from '@/store/gameStore';
import { SCENE_CONFIG } from '@/config/scenes';
import { readGamePhase } from '@/shared/gamePhase';
import { getCombatState } from '@/engine/CombatSystem';

/**
 * Dev-only consistency sentinel — logs drift between store slices every 30s.
 * No-op in production builds.
 */
export function useGameIntegrityGuard(enabled: boolean): void {
  useEffect(() => {
    if (!enabled || !import.meta.env.DEV) return;

    const interval = setInterval(() => {
      const state = useGameStore.getState();
      const issues: string[] = [];

      const sceneId = state.exploration.currentSceneId;
      if (!SCENE_CONFIG[sceneId]) {
        issues.push(`unknown sceneId: ${sceneId}`);
      }

      const phase = readGamePhase(state);
      if (phase === 'combat' && !state.combatActive) {
        issues.push('phase combat but combatActive=false');
      }
      if (phase === 'exploration' && state.combatActive) {
        issues.push('exploration phase but combatActive=true');
      }
      if (state.combatActive && !getCombatState()) {
        issues.push('combatActive=true but CombatSystem has no session');
      }
      if (!state.combatActive && getCombatState()?.status === 'active') {
        issues.push('combatActive=false but CombatSystem session is active');
      }

      if (state.currentNodeId.trim().length === 0) {
        issues.push('empty currentNodeId');
      }

      const pos = state.exploration.playerPosition;
      if (!Number.isFinite(pos[0]) || !Number.isFinite(pos[1]) || !Number.isFinite(pos[2])) {
        issues.push('invalid playerPosition');
      }

      if (issues.length > 0) {
        console.warn('[GameIntegrityGuard]', issues.join('; '));
      }
    }, 30_000);

    return () => clearInterval(interval);
  }, [enabled]);
}
