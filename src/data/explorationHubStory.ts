/**
 * Узлы «3D-хаба»: свободный обход; сюжетная сцена узла не должна перетирать `exploration.currentSceneId`.
 */
export const EXPLORATION_HUB_STORY_NODE_IDS = ['explore_mode', 'explore_hub_welcome'] as const;

export type ExplorationHubStoryNodeId = (typeof EXPLORATION_HUB_STORY_NODE_IDS)[number];

export function isExplorationHubStoryNodeId(id: string): id is ExplorationHubStoryNodeId {
  return (EXPLORATION_HUB_STORY_NODE_IDS as readonly string[]).includes(id);
}
