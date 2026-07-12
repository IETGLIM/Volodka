import { describe, expect, it } from 'vitest';
import { CUTSCENES } from '@/data/cutscenes';
import {
  resolvePostCutsceneNarrativeNode,
  shouldShowEntryStoryAfterCutscene,
  shouldShowStoryBeatAfterCutscene,
} from './postCutsceneNarrative';
import { isAct1DiegeticStoryNode } from '@/engine/narrative/narrativePresentationPolicy';

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
  it('returns false for Act 1 diegetic entry beats (cutscene text only)', () => {
    expect(shouldShowStoryBeatAfterCutscene('start')).toBe(false);
    expect(shouldShowStoryBeatAfterCutscene('corridor_door')).toBe(false);
    expect(shouldShowStoryBeatAfterCutscene('kitchen_table')).toBe(false);
    expect(shouldShowStoryBeatAfterCutscene('cafe_enter')).toBe(false);
    expect(shouldShowStoryBeatAfterCutscene('go_to_cafe')).toBe(false);
  });

  it('includes act transitions and mid-act title cards for Acts 2+', () => {
    expect(shouldShowStoryBeatAfterCutscene('act2_transition')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('act3_transition')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('fix_success')).toBe(false);
    expect(shouldShowStoryBeatAfterCutscene('maria_curious')).toBe(false);
  });

  it('includes act II explore entry beats', () => {
    expect(shouldShowStoryBeatAfterCutscene('act2_network_initiation')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('abandoned_workshop')).toBe(true);
    expect(shouldShowStoryBeatAfterCutscene('pier_arrival')).toBe(true);
  });

  it('covers non-Act1 cutscene trigger nodes', () => {
    for (const def of Object.values(CUTSCENES)) {
      if (isAct1DiegeticStoryNode(def.triggerStoryNode)) continue;
      expect(shouldShowStoryBeatAfterCutscene(def.triggerStoryNode)).toBe(true);
    }
  });

  it('returns false for plain explore hubs without cutscenes', () => {
    expect(shouldShowStoryBeatAfterCutscene('explore_mode')).toBe(false);
    expect(shouldShowStoryBeatAfterCutscene('cafe_explore_mode')).toBe(false);
  });
});
