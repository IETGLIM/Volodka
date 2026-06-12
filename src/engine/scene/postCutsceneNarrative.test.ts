import { describe, expect, it } from 'vitest';
import { resolvePostCutsceneNarrativeNode } from './postCutsceneNarrative';

describe('resolvePostCutsceneNarrativeNode', () => {
  it('promotes corridor_door to corridor_explore_mode', () => {
    expect(resolvePostCutsceneNarrativeNode('corridor_door')).toBe('corridor_explore_mode');
  });

  it('keeps hub nodes unchanged', () => {
    expect(resolvePostCutsceneNarrativeNode('corridor_explore_mode')).toBe('corridor_explore_mode');
  });
});
