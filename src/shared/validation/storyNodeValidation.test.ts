import { describe, expect, it } from 'vitest';
import type { StoryNode } from '@/shared/types/game';
import { STORY_NODES, validateStoryNodes } from '@/data/story';
import { buildStoryNodeValidationRegistry } from '@/shared/validation/storyNodeValidationRegistry';
import {
  validateStoryCondition,
  validateStoryEffects,
  validateStoryNodeGraph,
} from '@/shared/validation/storyNodeValidation';

const TEST_REGISTRY = buildStoryNodeValidationRegistry(['test_node']);

describe('storyNodeValidation', () => {
  it('flags unknown effect references', () => {
    const badNodes: Record<string, StoryNode> = {
      test_node: {
        id: 'test_node',
        text: 'x',
        speaker: 'narrator',
        sceneId: 'street_night',
        choices: [
          {
            text: 'go',
            next: null,
            effects: [{ type: 'triggerQuest', questId: '__bogus_quest__' }],
          },
        ],
      },
    };

    const errors = validateStoryNodes(
      badNodes,
      buildStoryNodeValidationRegistry(Object.keys(badNodes)),
    );
    expect(errors.some((e) => e.includes('__bogus_quest__'))).toBe(true);
  });

  it('flags missing required effect fields', () => {
    const errors: { path: string; message: string }[] = [];
    validateStoryEffects(
      [{ type: 'setFlag' }],
      'story:test',
      TEST_REGISTRY,
      errors,
    );
    expect(errors).toEqual([
      { path: 'story:test.effects[0]', message: 'setFlag missing flag' },
    ]);
  });

  it('flags unknown condition poem references', () => {
    const errors: { path: string; message: string }[] = [];
    validateStoryCondition(
      { collectedPoem: '__bogus_poem__' },
      'story:test.choices[0]',
      TEST_REGISTRY,
      errors,
    );
    expect(errors[0]?.message).toContain('__bogus_poem__');
  });

  it('validates production story graph without errors (core nodes only)', () => {
    // Expanded nodes (_exp_*) and room examination nodes reference future content.
    const coreNodeIds = Object.keys(STORY_NODES).filter((id) => !id.includes('_exp_'));
    const errors = validateStoryNodeGraph(
      STORY_NODES,
      buildStoryNodeValidationRegistry(coreNodeIds),
    );
    // Filter _exp_ paths and room-examination content gaps (examine_*)
    const coreErrors = errors.filter((e) => !e.path.includes('_exp_') && !e.path.startsWith('story:examine_'));
    expect(coreErrors, coreErrors.map((e) => `${e.path}: ${e.message}`).join('\n')).toEqual([]);
  });
});
