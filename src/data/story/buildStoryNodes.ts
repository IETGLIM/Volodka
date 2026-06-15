import type { StoryNode } from '@/shared/types/game';
import { CHK_STORY_NODES } from '../chkTolpa/storyNodes';
import { CHK_STORY_NODES_EXTENDED } from '../chkTolpa/storyNodesExtended';
import { STORY_NODES_SOLNYSH } from './solnyshStory';
import { STORY_NODES_ACT1 } from './act1';
import { STORY_NODES_ACT1_EXTENDED } from './act1Extended';
import { STORY_NODES_ACT1_CAFE_OFFICE } from './act1ExtendedCafeOffice';
import { STORY_NODES_ACT2 } from './act2';
import { STORY_NODES_ACT3 } from './act3';
import { STORY_NODES_ACT4 } from './act4';
import { STORY_NODES_ACT4_QUIET_HOUR } from './act4QuietHour';
import { STORY_NODES_ACT5 } from './act5';
import { STORY_NODES_ACT6 } from './act6';
import { STORY_NODES_ACT7 } from './act7';
import { STORY_NODES_PIER } from './pierStory';
import { STORY_NODES_LIBRARY } from './libraryStory';
import { STORY_NODES_FACTORY } from './factoryStory';
import { STORY_NODES_RESISTANCE } from './resistanceStory';
import { STORY_NODES_SCENE_EXPLORE_HUBS } from './sceneExploreHubs';
import { STORY_NODES_EPILOGUE } from './epilogueStory';

/** Master story node registry with collision detection in dev. */
export function buildStoryNodes(): Record<string, StoryNode> {
  const sources: Array<{ name: string; nodes: Record<string, StoryNode> }> = [
    { name: 'act1', nodes: STORY_NODES_ACT1 },
    { name: 'act1Extended', nodes: STORY_NODES_ACT1_EXTENDED },
    { name: 'act1CafeOffice', nodes: STORY_NODES_ACT1_CAFE_OFFICE },
    { name: 'solnysh', nodes: STORY_NODES_SOLNYSH },
    { name: 'sceneExploreHubs', nodes: STORY_NODES_SCENE_EXPLORE_HUBS },
    { name: 'act2', nodes: STORY_NODES_ACT2 },
    { name: 'act3', nodes: STORY_NODES_ACT3 },
    { name: 'act4', nodes: STORY_NODES_ACT4 },
    { name: 'act4QuietHour', nodes: STORY_NODES_ACT4_QUIET_HOUR },
    { name: 'act5', nodes: STORY_NODES_ACT5 },
    { name: 'act6', nodes: STORY_NODES_ACT6 },
    { name: 'act7', nodes: STORY_NODES_ACT7 },
    { name: 'chkTolpa', nodes: CHK_STORY_NODES },
    { name: 'chkTolpaExtended', nodes: CHK_STORY_NODES_EXTENDED },
    { name: 'pier', nodes: STORY_NODES_PIER },
    { name: 'library', nodes: STORY_NODES_LIBRARY },
    { name: 'factory', nodes: STORY_NODES_FACTORY },
    { name: 'resistance', nodes: STORY_NODES_RESISTANCE },
    { name: 'epilogue', nodes: STORY_NODES_EPILOGUE },
  ];

  const registry: Record<string, StoryNode> = {};
  const collisions: string[] = [];

  for (const source of sources) {
    for (const [id, node] of Object.entries(source.nodes)) {
      if (registry[id]) {
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

export function validateStoryNodes(nodes: Record<string, StoryNode>): string[] {
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
