/** UI overlays, toasts, and generic notifications. */
import type { SceneId } from '@/shared/types/game';

export interface UiEvents {
  'ui:exploration_message': { text: string };
  'ui:open_panel': { panel: string; loreId?: string; questId?: string };
  'ui:music_volume': { volume: number };
  'ui:music_enabled': { enabled: boolean; sceneId: SceneId };
  'game:notification': { title: string; subtitle?: string; type: 'combat' | 'scene' | 'achievement' | 'quest' | 'info' };
  /** Brief pulse on the HUD poem badge after a new poem is collected. */
  'ui:highlight_poem_badge': { poemId?: string };
  'toast:add': { id: string; type: 'karma' | 'energy' | 'stress' | 'skill' | 'poem' | 'quest'; message: string; delta?: number; timestamp: number };
  'ui:loot_notification': {
    type: 'item' | 'skill' | 'karma' | 'poem' | 'combat' | 'xp';
    label: string;
    detail?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  };
  /** Volodka's inner monologue / thought bubble overlay. */
  'volodka:thought': { text: string; duration?: number };
}
