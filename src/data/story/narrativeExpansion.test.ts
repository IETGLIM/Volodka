import { describe, expect, it } from 'vitest';
import { SCENE_DEFINITIONS, SCENE_IDS } from '@/config/sceneDefinitions';
import { SCENE_DERIVED_FROM, resolveDerivedSceneId } from '@/config/sceneInheritance';
import { STORY_NODES, validateStoryNodes } from '@/data/story';
import { buildStoryNodeValidationRegistry } from '@/shared/validation/storyNodeValidationRegistry';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';

const EXTENSION_SCENE_IDS = [
  'chk_campfire_night',
  'pier_evening',
  'factory_roof',
  'library_basement',
  'city_square',
  'underground_bunker',
  'guild_mainframe',
  'zarema_room',
  'albert_backroom',
] as const;

const SIDE_QUEST_IDS = [
  'pier_midnight_fishing',
  'pier_ritka_strings',
  'library_lost_archive',
  'library_katya_research',
  'factory_zarya_memory',
  'factory_baba_zina_tea',
  'resistance_safehouse',
  'resistance_defector_rescue',
  'chk_portwine_delivery',
  'chk_guitar_strings',
  'epilogue_letters',
  'epilogue_monument',
] as const;

describe('AAA narrative expansion', () => {
  it('registers all 9 extension scenes', () => {
    for (const id of EXTENSION_SCENE_IDS) {
      expect(SCENE_DEFINITIONS[id], id).toBeTruthy();
      expect(SCENE_IDS).toContain(id);
    }
    expect(SCENE_IDS.length).toBeGreaterThanOrEqual(26);
  });

  it('extension scenes inherit from parent visuals', () => {
    for (const [variant, parent] of Object.entries(SCENE_DERIVED_FROM)) {
      expect(resolveDerivedSceneId(variant as (typeof EXTENSION_SCENE_IDS)[number])).toBe(parent);
    }
  });

  it('story graph has no broken choice links', () => {
    const errors = validateStoryNodes(
      STORY_NODES,
      buildStoryNodeValidationRegistry(Object.keys(STORY_NODES)),
    );
    expect(errors, errors.join('\n')).toEqual([]);
  });

  it('side quests are registered with story entry nodes', () => {
    for (const questId of SIDE_QUEST_IDS) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === questId);
      expect(quest, questId).toBeTruthy();
      if (quest?.linkedStoryNodeId) {
        expect(STORY_NODES[quest.linkedStoryNodeId], quest.linkedStoryNodeId).toBeTruthy();
      }
    }
  });

  it('explore hubs exist for new locations', () => {
    const hubScenes = new Set(SCENE_EXPLORE_HUB_DEFS.map((d) => d.sceneId));
    expect(hubScenes.has('pier_evening')).toBe(true);
    expect(hubScenes.has('library_basement')).toBe(true);
    expect(hubScenes.has('underground_bunker')).toBe(true);
    expect(hubScenes.has('city_square')).toBe(true);
  });

  it('act4 quiet hour hub overrides act4 with more branches', () => {
    const hub = STORY_NODES.act4_quiet_hour;
    expect(hub.choices.length).toBeGreaterThan(6);
    expect(hub.choices.some((c) => c.next === 'act4_quiet_pier_trofim')).toBe(true);
  });

  it('act6 showdown uses factory_roof scene', () => {
    expect(STORY_NODES.act6_rooftop_showdown.sceneId).toBe('factory_roof');
    expect(STORY_NODES.act6_final_confrontation.sceneId).toBe('factory_roof');
  });

  it('key side-story intros have accessibility metadata', () => {
    for (const id of [
      'pier_story_intro',
      'library_story_intro',
      'factory_story_intro',
      'resistance_story_intro',
      'epilogue_hub',
    ] as const) {
      expect(STORY_NODES[id]?.accessibilityAnnounce, id).toBeTruthy();
    }
  });
});
