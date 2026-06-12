import { describe, expect, it } from 'vitest';
import { resolvePostCutsceneNarrativeNode } from './postCutsceneNarrative';

describe('resolvePostCutsceneNarrativeNode', () => {
  it('promotes corridor_door to corridor_explore_mode', () => {
    expect(resolvePostCutsceneNarrativeNode('corridor_door')).toBe('corridor_explore_mode');
  });

  it('promotes start to explore_mode after act prologue', () => {
    expect(resolvePostCutsceneNarrativeNode('start')).toBe('explore_mode');
  });

  it('keeps hub nodes unchanged', () => {
    expect(resolvePostCutsceneNarrativeNode('corridor_explore_mode')).toBe('corridor_explore_mode');
  });

  it('keeps act2_transition as a story beat (not street hub)', () => {
    expect(resolvePostCutsceneNarrativeNode('act2_transition')).toBe('act2_transition');
  });
});
