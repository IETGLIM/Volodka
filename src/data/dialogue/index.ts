import type { DialogueNode } from '@/shared/types/game';
import { EXPANDED_DIALOGUE_NODES } from '../expandedDialogueNodes';
import { CHK_DIALOGUE_NODES } from '../chkTolpa/dialogues';
import { EXPLORATION_DIALOGUE_NODES } from '../explorationDialogueNodes';
import { DIALOGUE_PART1 } from './part1-albert';
import { DIALOGUE_PART2 } from './part2-npcs';
import { DIALOGUE_PART3 } from './part3-mid';
import { DIALOGUE_PART4 } from './part4-late';
import { DIALOGUE_PART5 } from './part5-final';

export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  ...DIALOGUE_PART1,
  ...DIALOGUE_PART2,
  ...DIALOGUE_PART3,
  ...DIALOGUE_PART4,
  ...DIALOGUE_PART5,
  ...EXPANDED_DIALOGUE_NODES,
  ...CHK_DIALOGUE_NODES,
  ...EXPLORATION_DIALOGUE_NODES,
};
