import { DIALOGUE_NODES } from '@/data/dialogueNodes';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { ALL_NPC_DEFINITIONS } from '@/data/allNpcDefinitions';
import { SCENE_DEFINITIONS, type SceneId } from '@/config/sceneDefinitions';
import { POEMS } from '@/data/poems';
import { EXPANSION_POEM_IDS } from '@/data/expansion/expansionPoemStubs';
import { getAllItemDefinitions } from '@/data/items';
import { INITIAL_LORE_ENTRIES } from '@/data/loreEntries';
import { QUEST_ITEM_DEFINITIONS } from '@/data/questItems';
import { ENEMY_TYPE_IDS } from '@/data/enemyTypeIds';
import { NPC_ID_ALIASES, STORY_NODE_ALIASES } from '@/data/goldenPath';
import type { StoryNodeValidationRegistry } from '@/shared/validation/storyNodeValidation';

/** Build cross-reference sets for story-node validation (no STORY_NODES import — avoids barrel cycles). */
export function buildStoryNodeValidationRegistry(
  storyNodeIds: Iterable<string>,
): StoryNodeValidationRegistry {
  return {
    storyNodeIds: new Set(storyNodeIds),
    dialogueNodeIds: new Set(Object.keys(DIALOGUE_NODES)),
    questIds: new Set(QUEST_DEFINITIONS.map((q) => q.id)),
    npcIds: new Set(ALL_NPC_DEFINITIONS.map((n) => n.id)),
    sceneIds: new Set(Object.keys(SCENE_DEFINITIONS) as SceneId[]),
    poemIds: new Set([...POEMS.map((p) => p.id), ...EXPANSION_POEM_IDS]),
    itemIds: new Set([
      ...getAllItemDefinitions().map((i) => i.id),
      ...Object.keys(QUEST_ITEM_DEFINITIONS),
    ]),
    loreIds: new Set(INITIAL_LORE_ENTRIES.map((l) => l.id)),
    enemyTypes: new Set(ENEMY_TYPE_IDS),
    storyNodeAliases: STORY_NODE_ALIASES,
    npcIdAliases: NPC_ID_ALIASES,
  };
}
