/**
 * Extract narrative prose from story act modules into JSON + structure TS files.
 * Run: npx tsx --tsconfig tsconfig.json scripts/extract-story-texts.ts
 */

import { mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { StoryChoice, StoryNode } from '../src/shared/types/game';
import type { ActStoryTexts, StoryNodeTextBlob } from '../src/data/narrative/storyTextTypes';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const textsDir = join(root, 'src/data/story/texts');
const structuresDir = join(root, 'src/data/story/structures');

const ACT_EXPORTS: ReadonlyArray<{ act: number; exportName: string }> = [
  { act: 1, exportName: 'STORY_NODES_ACT1' },
  { act: 2, exportName: 'STORY_NODES_ACT2' },
  { act: 3, exportName: 'STORY_NODES_ACT3' },
  { act: 4, exportName: 'STORY_NODES_ACT4' },
  { act: 5, exportName: 'STORY_NODES_ACT5' },
  { act: 6, exportName: 'STORY_NODES_ACT6' },
  { act: 7, exportName: 'STORY_NODES_ACT7' },
];

function extractNodeTexts(node: StoryNode): StoryNodeTextBlob {
  return {
    text: node.text,
    textVariants: node.textVariants,
    contextNote: node.contextNote,
    accessibilityAnnounce: node.accessibilityAnnounce,
    guidanceHint: node.guidanceHint,
    guidanceSceneLabel: node.guidanceSceneLabel,
    choices: node.choices.map((choice) => choice.text),
  };
}

function stripNodeTexts(node: StoryNode): Omit<StoryNode, 'text'> & { text?: string; choices: StoryChoice[] } {
  const choices = node.choices.map((choice) => ({ ...choice, text: '' }));
  const {
    text: _text,
    textVariants: _textVariants,
    contextNote: _contextNote,
    accessibilityAnnounce: _accessibilityAnnounce,
    guidanceHint: _guidanceHint,
    guidanceSceneLabel: _guidanceSceneLabel,
    ...rest
  } = node;
  return { ...rest, choices };
}

function serializeStructure(nodes: Record<string, ReturnType<typeof stripNodeTexts>>): string {
  const body = JSON.stringify(nodes, null, 2)
    .replace(/"([^"]+)":/g, '$1:')
    .replace(/"/g, "'")
    .replace(/'true'/g, 'true')
    .replace(/'false'/g, 'false')
    .replace(/'null'/g, 'null')
    .replace(/'(\w+)'/g, "'$1'");

  return `import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT${''}_STRUCTURE: Record<string, StoryNodeStructure> = ${body} as Record<string, StoryNodeStructure>;
`;
}

async function processAct(act: number, exportName: string): Promise<void> {
  const mod = await import(`../src/data/story/act${act}.ts`);
  const nodes = mod[exportName] as Record<string, StoryNode>;

  const texts: ActStoryTexts = {};
  const structure: Record<string, ReturnType<typeof stripNodeTexts>> = {};

  for (const [nodeId, node] of Object.entries(nodes)) {
    texts[nodeId] = extractNodeTexts(node);
    structure[nodeId] = stripNodeTexts(node);
  }

  mkdirSync(textsDir, { recursive: true });
  mkdirSync(structuresDir, { recursive: true });

  writeFileSync(join(textsDir, `act${act}.json`), `${JSON.stringify(texts, null, 2)}\n`, 'utf8');

  const structureSource = `import type { StoryNode } from '@/shared/types/game';

type StoryNodeStructure = Omit<StoryNode, 'text'> & { text?: string; choices: StoryNode['choices'] };

export const ACT${act}_STRUCTURE: Record<string, StoryNodeStructure> = ${JSON.stringify(structure, null, 2)} as Record<string, StoryNodeStructure>;
`;
  writeFileSync(join(structuresDir, `act${act}.structure.ts`), structureSource, 'utf8');

  const actSource = `import { applyStoryTexts } from '@/data/narrative/applyStoryTexts';
import { ACT${act}_STRUCTURE } from './structures/act${act}.structure';
import act${act}Texts from './texts/act${act}.json';

export const ${exportName} = applyStoryTexts(ACT${act}_STRUCTURE, act${act}Texts);
`;
  writeFileSync(join(root, `src/data/story/act${act}.ts`), actSource, 'utf8');

  console.log(`[extract-story-texts] act${act}: ${Object.keys(nodes).length} nodes`);
}

async function main(): Promise<void> {
  for (const { act, exportName } of ACT_EXPORTS) {
    await processAct(act, exportName);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
