#!/usr/bin/env node
/**
 * Split monolithic storyNodes / quests / dialogueNodes into act/part modules.
 * Run once: node scripts/split-narrative-data.mjs
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

function readLines(relPath) {
  return readFileSync(join(root, relPath), 'utf8').split(/\r?\n/);
}

function writeFile(relPath, content) {
  const full = join(root, relPath);
  mkdirSync(dirname(full), { recursive: true });
  writeFileSync(full, content, 'utf8');
  console.log(`  wrote ${relPath}`);
}

function sliceLines(lines, start, end) {
  return lines.slice(start - 1, end).join('\n');
}

/** Split storyNodes.ts into act modules. */
function splitStory() {
  const lines = readLines('src/data/storyNodes.ts');
  const acts = [
    { file: 'act1.ts', export: 'STORY_NODES_ACT1', start: 7, end: 575 },
    { file: 'act2.ts', export: 'STORY_NODES_ACT2', start: 576, end: 1230 },
    { file: 'act3.ts', export: 'STORY_NODES_ACT3', start: 1231, end: 2051 },
    { file: 'act4.ts', export: 'STORY_NODES_ACT4', start: 2052, end: 2655 },
    { file: 'act5.ts', export: 'STORY_NODES_ACT5', start: 2656, end: 3432 },
    { file: 'act6.ts', export: 'STORY_NODES_ACT6', start: 3433, end: 3920 },
    { file: 'act7.ts', export: 'STORY_NODES_ACT7', start: 3921, end: 4294 },
  ];

  for (const act of acts) {
    const body = sliceLines(lines, act.start, act.end);
    writeFile(
      `src/data/story/${act.file}`,
      `import type { StoryNode } from '@/shared/types/game';

export const ${act.export}: Record<string, StoryNode> = {
${body}
};
`,
    );
  }

  writeFile(
    'src/data/story/index.ts',
    `import type { StoryNode } from '@/shared/types/game';
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
`,
  );

  writeFile(
    'src/data/storyNodes.ts',
    `/* Barrel — story content lives in ./story/act*.ts */
export { STORY_NODES } from './story';
`,
  );
}

/** Split quests.ts into act modules. */
function splitQuests() {
  const lines = readLines('src/data/quests.ts');
  const acts = [
    { file: 'act1.ts', export: 'QUESTS_ACT1', start: 7, end: 368 },
    { file: 'act2.ts', export: 'QUESTS_ACT2', start: 369, end: 626 },
    { file: 'act3.ts', export: 'QUESTS_ACT3', start: 627, end: 786 },
    { file: 'act4.ts', export: 'QUESTS_ACT4', start: 787, end: 1642 },
    { file: 'act5.ts', export: 'QUESTS_ACT5', start: 1643, end: 1858 },
    { file: 'act6.ts', export: 'QUESTS_ACT6', start: 1859, end: 2154 },
    { file: 'act7.ts', export: 'QUESTS_ACT7', start: 2155, end: 2398 },
  ];

  for (const act of acts) {
    const body = sliceLines(lines, act.start, act.end);
    writeFile(
      `src/data/quests/${act.file}`,
      `import type { QuestDefinition } from '@/shared/types/game';

export const ${act.export}: QuestDefinition[] = [
${body}
];
`,
    );
  }

  writeFile(
    'src/data/quests/index.ts',
    `import type { QuestDefinition } from '@/shared/types/game';
import { CHK_QUESTS } from '../chkTolpa/quests';
import { QUESTS_ACT1 } from './act1';
import { QUESTS_ACT2 } from './act2';
import { QUESTS_ACT3 } from './act3';
import { QUESTS_ACT4 } from './act4';
import { QUESTS_ACT5 } from './act5';
import { QUESTS_ACT6 } from './act6';
import { QUESTS_ACT7 } from './act7';

export const QUEST_DEFINITIONS: QuestDefinition[] = [
  ...QUESTS_ACT1,
  ...QUESTS_ACT2,
  ...QUESTS_ACT3,
  ...QUESTS_ACT4,
  ...QUESTS_ACT5,
  ...QUESTS_ACT6,
  ...QUESTS_ACT7,
  ...CHK_QUESTS,
];
`,
  );

  writeFile(
    'src/data/quests.ts',
    `/* Barrel — quest content lives in ./quests/act*.ts */
export { QUEST_DEFINITIONS } from './quests/index';
`,
  );
}

/** Split dialogueNodes.ts into part modules (by major section blocks). */
function splitDialogue() {
  const lines = readLines('src/data/dialogueNodes.ts');
  const parts = [
    { file: 'part1-albert.ts', export: 'DIALOGUE_PART1', start: 9, end: 1765 },
    { file: 'part2-npcs.ts', export: 'DIALOGUE_PART2', start: 1766, end: 2404 },
    { file: 'part3-mid.ts', export: 'DIALOGUE_PART3', start: 2405, end: 3121 },
    { file: 'part4-late.ts', export: 'DIALOGUE_PART4', start: 3122, end: 3938 },
    { file: 'part5-final.ts', export: 'DIALOGUE_PART5', start: 3939, end: 4507 },
  ];

  for (const part of parts) {
    const body = sliceLines(lines, part.start, part.end);
    writeFile(
      `src/data/dialogue/${part.file}`,
      `import type { DialogueNode } from '@/shared/types/game';

export const ${part.export}: Record<string, DialogueNode> = {
${body}
};
`,
    );
  }

  writeFile(
    'src/data/dialogue/index.ts',
    `import type { DialogueNode } from '@/shared/types/game';
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
`,
  );

  writeFile(
    'src/data/dialogueNodes.ts',
    `/* Barrel — dialogue content lives in ./dialogue/part*.ts */
export { DIALOGUE_NODES } from './dialogue';
`,
  );
}

console.log('Splitting narrative data…');
splitStory();
splitQuests();
splitDialogue();
console.log('Done.');
