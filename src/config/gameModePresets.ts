import { DEFAULT_ACTIVE_QUEST_IDS } from '@/config/defaultActiveQuests';
import { VERTICAL_SLICE_ENTRY_NODE_ID } from '@/data/verticalSliceStoryNodes';

export type SessionGamePreset = 'fullStory' | 'arcadeSlice';

export const FULL_STORY_SAVE_KEY = 'volodka_save_v3';
export const ARCADE_SLICE_SAVE_KEY = 'volodka_save_demo_v1';

export interface SessionPresetConfig {
  id: SessionGamePreset;
  label: string;
  entryNodeId: string;
  activeQuestIds: readonly string[];
  introCompact: boolean;
  saveKey: string;
  menuHint: string;
}

export const SESSION_GAME_PRESETS: Record<SessionGamePreset, SessionPresetConfig> = {
  fullStory: {
    id: 'fullStory',
    label: 'Полная история',
    entryNodeId: 'explore_hub_welcome',
    activeQuestIds: DEFAULT_ACTIVE_QUEST_IDS,
    introCompact: false,
    saveKey: FULL_STORY_SAVE_KEY,
    menuHint: 'Первый маршрут ведёт в комнату Володьки: ночь, мониторы, стол, тишина между сменами.',
  },
  arcadeSlice: {
    id: 'arcadeSlice',
    label: 'Демо · Глава 1',
    entryNodeId: VERTICAL_SLICE_ENTRY_NODE_ID,
    activeQuestIds: ['exploration_volodka_rack', 'exploration_zarema_tv_feed'],
    introCompact: true,
    saveKey: ARCADE_SLICE_SAVE_KEY,
    menuHint: 'Короткая ночная смена: стойка, коридор, соседи — аркада и reflex-биты (~1–2 ч).',
  },
};

export function getSessionPreset(id: SessionGamePreset): SessionPresetConfig {
  return SESSION_GAME_PRESETS[id];
}

export function resolveSessionPresetFromSaveMeta(raw: unknown): SessionGamePreset {
  if (raw === 'arcadeSlice' || raw === 'fullStory') return raw;
  return 'fullStory';
}
