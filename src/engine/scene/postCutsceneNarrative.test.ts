import { describe, expect, it } from 'vitest';
import {
  resolvePostCutsceneNarrativeNode,
  shouldShowEntryStoryAfterCutscene,
  shouldShowStoryBeatAfterCutscene,
} from './postCutsceneNarrative';

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

describe('shouldShowEntryStoryAfterCutscene', () => {
  it('returns true for act I entry beats that map to explore hubs', () => {
    expect(shouldShowEntryStoryAfterCutscene('start')).toBe(true);
    expect(shouldShowEntryStoryAfterCutscene('corridor_door')).toBe(true);
    expect(shouldShowEntryStoryAfterCutscene('kitchen_table')).toBe(true);
    expect(shouldShowEntryStoryAfterCutscene('street_bench')).toBe(true);
    expect(shouldShowEntryStoryAfterCutscene('cafe_enter')).toBe(true);
    expect(shouldShowEntryStoryAfterCutscene('office_alexander')).toBe(true);
  });

  it('returns false for hub nodes and non-entry story beats', () => {
    expect(shouldShowEntryStoryAfterCutscene('explore_mode')).toBe(false);
    expect(shouldShowEntryStoryAfterCutscene('corridor_explore_mode')).toBe(false);
    expect(shouldShowEntryStoryAfterCutscene('act2_transition')).toBe(false);
    expect(shouldShowEntryStoryAfterCutscene('fix_success')).toBe(false);
  });
});

describe('shouldShowStoryBeatAfterCutscene', () => {
  it('includes act transitions and mid-act title cards', () => {
    expect(shouldShowStoryBeatAfterCutscene('act2_transition')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('act3_transition')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('maria_curious')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('fix_success')).toBe(true);
  });

  it('includes act II explore entry beats', () => {
    expect(shouldShowStoryBeatAfterCutscene('act2_network_initiation')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('abandoned_workshop')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('pier_arrival')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('go_to_cafe')).toBe(true);
  });
});
