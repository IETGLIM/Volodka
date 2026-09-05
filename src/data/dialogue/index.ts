import type { DialogueNode } from '@/shared/types/game';
import { EXPANDED_DIALOGUE_NODES } from '../expandedDialogueNodes';
import { CHK_DIALOGUE_NODES } from '../chkTolpa/dialogues';
import { EXPLORATION_DIALOGUE_NODES } from '../explorationDialogueNodes';
import { RETURN_DIALOGUE_NODES } from './returnDialogues';
import { MILESTONE_DIALOGUE_NODES } from './milestoneDialogues';
import { DIALOGUE_PART1 } from './part1-albert';
import { ALBERT_EXPANDED_DIALOGUE } from './part1-albert-expanded';
import { DIALOGUE_PART2 } from './part2-npcs';
import { DIALOGUE_PART2_EXPANDED } from './part2-npcs-expanded';
import { DIALOGUE_PART3 } from './part3-mid';
import { DIALOGUE_PART3_EXPANDED } from './part3-mid-expanded';
import { DIALOGUE_PART4 } from './part4-late';
import { DIALOGUE_PART4_EXPANDED } from './part4-late-expanded';
import { DIALOGUE_PART5 } from './part5-final';
import { DIALOGUE_PART5_EXPANDED } from './part5-final-expanded';
import { DIALOGUE_ACT4_NEW } from './act4_newDialogues';
import { DIALOGUE_ACT3_EXPANDED } from './act3_expandedDialogues';
import { DIALOGUE_ACT4_EXPANDED } from './act4_expandedDialogues';

export const DIALOGUE_NODES: Record<string, DialogueNode> = {
  // Сгенерированные return-узлы идут ПЕРВЫМИ как FALLBACK: авторские версии
  // из пак-файлов (part*/expanded/chk) переопределяют их при слиянии.
  // Раньше returnDialogues стоял после пак-файлов и ЗАТИРАЛ 27 авторских
  // return-узлов (в т.ч. albert_return с веткой серьёзного разговора и
  // solnysh_return с хуками act-4 цепочек) двух-выборочными заглушками.
  ...RETURN_DIALOGUE_NODES,
  ...DIALOGUE_PART1,
  ...DIALOGUE_PART2,
  ...DIALOGUE_PART2_EXPANDED,
  ...DIALOGUE_PART3,
  ...DIALOGUE_PART3_EXPANDED,
  ...DIALOGUE_PART4,
  ...DIALOGUE_PART4_EXPANDED,
  ...DIALOGUE_PART5,
  ...DIALOGUE_PART5_EXPANDED,
  ...ALBERT_EXPANDED_DIALOGUE,
  ...EXPANDED_DIALOGUE_NODES,
  ...CHK_DIALOGUE_NODES,
  ...EXPLORATION_DIALOGUE_NODES,
  ...MILESTONE_DIALOGUE_NODES,
  ...DIALOGUE_ACT4_NEW,
  ...DIALOGUE_ACT3_EXPANDED,
  ...DIALOGUE_ACT4_EXPANDED,
};
