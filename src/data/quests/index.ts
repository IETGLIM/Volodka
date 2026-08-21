import type { QuestDefinition } from '@/shared/types/game';
import { CHK_QUESTS } from '../chkTolpa/quests';
import { QUESTS_SOLNYSH } from './solnyshQuests';
import { QUESTS_ACT1 } from './act1';
import { QUESTS_ACT2 } from './act2';
import { QUESTS_ACT3 } from './act3';
import { QUESTS_ACT4 } from './act4';
import { QUESTS_ACT5 } from './act5';
import { QUESTS_ACT6 } from './act6';
import { QUESTS_ACT7 } from './act7';
import { QUESTS_SIDE } from './sideQuests';
import { QUESTS_PHASE5_SIDE } from './phase5SideQuests';
import { AAA_EXPANSION_QUESTS } from './aaaExpansionQuests';
import { EXPANSION_QUEST_STUBS } from '../expansion/expansionQuestStubs';
import { EXPANSION_HUB_QUESTS } from '../expansion/expansionHubQuests';
import { QUESTS_ACT4_NEW } from './act4_newQuests';

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  ...QUESTS_ACT1,
  ...QUESTS_SOLNYSH,
  ...QUESTS_ACT2,
  ...QUESTS_ACT3,
  ...QUESTS_ACT4,
  ...QUESTS_ACT5,
  ...QUESTS_ACT6,
  ...QUESTS_ACT7,
  ...QUESTS_SIDE,
  ...QUESTS_PHASE5_SIDE,
  ...AAA_EXPANSION_QUESTS,
  ...EXPANSION_QUEST_STUBS,
  ...EXPANSION_HUB_QUESTS,
  ...QUESTS_ACT4_NEW,
  ...CHK_QUESTS,
];
