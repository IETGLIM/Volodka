import type { StoryNode } from '@/shared/types/game';
import { CHK_STORY_NODES } from '../chkTolpa/storyNodes';
import { STORY_NODES_ACT1 } from './act1';
import { STORY_NODES_ACT2 } from './act2';
import { STORY_NODES_ACT3 } from './act3';
import { STORY_NODES_ACT4 } from './act4';
import { STORY_NODES_ACT5 } from './act5';
import { STORY_NODES_ACT6 } from './act6';
import { STORY_NODES_ACT7 } from './act7';

export const STORY_NODES: Record<string, StoryNode> = {
  ...STORY_NODES_ACT1,
  ...STORY_NODES_ACT2,
  ...STORY_NODES_ACT3,
  ...STORY_NODES_ACT4,
  ...STORY_NODES_ACT5,
  ...STORY_NODES_ACT6,
  ...STORY_NODES_ACT7,
  ...CHK_STORY_NODES,
};
