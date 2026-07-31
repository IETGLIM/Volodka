import type { StoryNode } from '@/shared/types/game';
import {
  formatStoryNodeValidationErrors,
  validateStoryNodeGraph,
  type StoryNodeValidationRegistry,
} from '@/shared/validation/storyNodeValidation';
import { CHK_STORY_NODES } from '../chkTolpa/storyNodes';
import { CHK_STORY_NODES_EXTENDED } from '../chkTolpa/storyNodesExtended';
import { STORY_NODES_SOLNYSH } from './solnyshStory';
import { STORY_NODES_ACT1 } from './act1';
import { STORY_NODES_ACT1_EXTENDED } from './act1Extended';
import { STORY_NODES_ACT1_CAFE_OFFICE } from './act1ExtendedCafeOffice';
import { STORY_NODES_ACT1_OFFICE_AFTERMATH } from './act1ExtendedOfficeAftermath';
import { ACT1_ROOM_EXPANDED_NODES } from './act1-room-expanded';
import { STORY_NODES_ACT2 } from './act2';
import { ACT2_STORY_EXPANDED_NODES } from './act2-story-expanded';
import { ACT3_STORY_EXPANDED_NODES } from './act3-story-expanded';
import { STORY_NODES_ACT3 } from './act3';
import { ACT4_STORY_EXPANDED_NODES } from './act4-story-expanded';
import { STORY_NODES_ACT4 } from './act4';
import { STORY_NODES_ACT4_QUIET_HOUR } from './act4QuietHour';
import { ACT5_STORY_EXPANDED_NODES } from './act5-story-expanded';
import { STORY_NODES_ACT5 } from './act5';
import { ACT6_STORY_EXPANDED_NODES } from './act6-story-expanded';
import { STORY_NODES_ACT6 } from './act6';
import { ACT7_STORY_EXPANDED_NODES } from './act7-story-expanded';
import { STORY_NODES_ACT7 } from './act7';
import { STORY_NODES_PIER } from './pierStory';
import { STORY_NODES_LIBRARY } from './libraryStory';
import { STORY_NODES_FACTORY } from './factoryStory';
import { STORY_NODES_RESISTANCE } from './resistanceStory';
import { STORY_NODES_SCENE_EXPLORE_HUBS } from './sceneExploreHubs';
import { STORY_NODES_EPILOGUE } from './epilogueStory';
import { STORY_NODES_PHASE5_QUESTS } from './phase5QuestStory';
import { STORY_NODES_EXPANSION_QUESTS } from './expansionQuestStory';
import { STORY_NODES_ACT4_SIDE_QUESTS } from './act4SideQuestStory';

/** Known pack overrides — later sources intentionally replace earlier spine nodes. */
const INTENTIONAL_STORY_NODE_OVERRIDES: Record<string, readonly string[]> = {
  act1OfficeAftermath: ['form_success', 'office_colleague', 'balcony_thought', 'friday_arrives'],
  phase5Quests: ['vladimir_secret_room'],
};

/** Master story node registry with collision detection in dev. */
export function buildStoryNodes(): Record<string, StoryNode> {
  const sources: Array<{ name: string; nodes: Record<string, StoryNode> }> = [
    { name: 'act1', nodes: STORY_NODES_ACT1 },
    { name: 'act1Extended', nodes: STORY_NODES_ACT1_EXTENDED },
    { name: 'act1CafeOffice', nodes: STORY_NODES_ACT1_CAFE_OFFICE },
    { name: 'act1OfficeAftermath', nodes: STORY_NODES_ACT1_OFFICE_AFTERMATH },
    { name: 'act1RoomExpanded', nodes: ACT1_ROOM_EXPANDED_NODES },
    { name: 'solnysh', nodes: STORY_NODES_SOLNYSH },
    { name: 'sceneExploreHubs', nodes: STORY_NODES_SCENE_EXPLORE_HUBS },
    { name: 'act2', nodes: STORY_NODES_ACT2 },
    { name: 'act2Expanded', nodes: ACT2_STORY_EXPANDED_NODES },
    { name: 'act3', nodes: STORY_NODES_ACT3 },
    { name: 'act3Expanded', nodes: ACT3_STORY_EXPANDED_NODES },
    { name: 'act4', nodes: STORY_NODES_ACT4 },
    { name: 'act4Expanded', nodes: ACT4_STORY_EXPANDED_NODES },
    { name: 'act4QuietHour', nodes: STORY_NODES_ACT4_QUIET_HOUR },
    { name: 'act5', nodes: STORY_NODES_ACT5 },
    { name: 'act5Expanded', nodes: ACT5_STORY_EXPANDED_NODES },
    { name: 'act6', nodes: STORY_NODES_ACT6 },
    { name: 'act6Expanded', nodes: ACT6_STORY_EXPANDED_NODES },
    { name: 'act7', nodes: STORY_NODES_ACT7 },
    { name: 'act7Expanded', nodes: ACT7_STORY_EXPANDED_NODES },
    { name: 'chkTolpa', nodes: CHK_STORY_NODES },
    { name: 'chkTolpaExtended', nodes: CHK_STORY_NODES_EXTENDED },
    { name: 'pier', nodes: STORY_NODES_PIER },
    { name: 'library', nodes: STORY_NODES_LIBRARY },
    { name: 'factory', nodes: STORY_NODES_FACTORY },
    { name: 'resistance', nodes: STORY_NODES_RESISTANCE },
    { name: 'epilogue', nodes: STORY_NODES_EPILOGUE },
    { name: 'phase5Quests', nodes: STORY_NODES_PHASE5_QUESTS },
    { name: 'expansionQuests', nodes: STORY_NODES_EXPANSION_QUESTS },
    { name: 'act4SideQuests', nodes: STORY_NODES_ACT4_SIDE_QUESTS },
  ];

  const registry: Record<string, StoryNode> = {};
  const collisions: string[] = [];

  for (const source of sources) {
    const intentional = new Set(INTENTIONAL_STORY_NODE_OVERRIDES[source.name] ?? []);
    for (const [id, node] of Object.entries(source.nodes)) {
      if (registry[id] && !intentional.has(id)) {
        collisions.push(`"${id}" in "${source.name}" (overrides existing)`);
      }
      registry[id] = node;
    }
  }

  if (collisions.length > 0 && import.meta.env?.DEV) {
    console.warn(
      `[STORY_NODES] ${collisions.length} collision(s) detected:\n${collisions.join('\n')}`,
    );
  }

  return registry;
}

export function validateStoryNodes(
  nodes: Record<string, StoryNode>,
  registry?: StoryNodeValidationRegistry,
): string[] {
  if (registry) {
    return formatStoryNodeValidationErrors(validateStoryNodeGraph(nodes, registry));
  }

  const errors: string[] = [];
  for (const [id, node] of Object.entries(nodes)) {
    for (const choice of node.choices) {
      if (choice.next !== null && !nodes[choice.next]) {
        errors.push(`"${id}" → "${choice.next}" (not found)`);
      }
    }
  }
  return errors;
}
