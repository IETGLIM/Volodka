/** UI overlays, toasts, and generic notifications. */
import type { SceneId } from '@/shared/types/game';
import type { TrainablePlayerSkill } from '@/shared/types/definitions/skills';

export interface UiEvents {
  'ui:exploration_message': { text: string };
  'ui:open_panel': { panel: string; loreId?: string; questId?: string; sceneId?: SceneId };
  /** Focus a scene node on the world map (quest journal → map). */
  'worldmap:focus_scene': { sceneId: SceneId };
  'ui:music_volume': { volume: number };
  'ui:music_enabled': { enabled: boolean; sceneId: SceneId };
  'game:notification': { title: string; subtitle?: string; type: 'combat' | 'scene' | 'achievement' | 'quest' | 'info' };
  /** Brief pulse on the HUD poem badge after a new poem is collected. */
  'ui:highlight_poem_badge': { poemId?: string };
  'toast:add': { id: string; type: 'karma' | 'energy' | 'stress' | 'skill' | 'poem' | 'quest' | 'crafting' | 'achievement' | 'lore' | 'system' | 'warning'; message: string; delta?: number; timestamp: number };
  'ui:loot_notification': {
    type: 'item' | 'skill' | 'karma' | 'poem' | 'combat' | 'xp';
    label: string;
    detail?: string;
    rarity?: 'common' | 'uncommon' | 'rare' | 'legendary';
  };
  /** Volodka's inner monologue / thought bubble overlay. */
  'volodka:thought': { text: string; duration?: number };
  /** Skill check result — shown by SkillCheckDisplay component. */
  'ui:skill_check': {
    skill: TrainablePlayerSkill;
    skillLabel: string;
    required: number;
    actual: number;
    passed: boolean;
  };
  /** Data terminal hacking mini-game — shown by DataTerminalOverlay. */
  'ui:data_terminal': {
    difficulty: 'easy' | 'medium' | 'hard';
    title: string;
    reward?: string;
  };
}