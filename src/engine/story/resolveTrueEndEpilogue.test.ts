import { describe, expect, it } from 'vitest';
import { MAIN_POEM_IDS } from '@/data/poemCollectionMeta';
import {
  appendTrueEndEpilogueReflection,
  buildTrueEndEpilogueReflection,
} from '@/engine/story/resolveTrueEndEpilogue';

describe('resolveTrueEndEpilogue', () => {
  it('returns empty when no flags or poems match', () => {
    expect(
      buildTrueEndEpilogueReflection({ flags: {}, collectedPoems: [] }),
    ).toBe('');
  });

  it('includes poet ending and full main poem collection', () => {
    const reflection = buildTrueEndEpilogueReflection({
      flags: { ending_true_poet: true },
      collectedPoems: [...MAIN_POEM_IDS],
    });
    expect(reflection).toContain('поэзию');
    expect(reflection).toContain('двадцать одна');
  });

  it('caps reflection at three lines', () => {
    const reflection = buildTrueEndEpilogueReflection({
      flags: {
        ending_true_poet: true,
        zarema_rescued: true,
        dmitry_forgiven: true,
        maria_truth_accepted: true,
        tolpa_honorary_chekist: true,
      },
      collectedPoems: [...MAIN_POEM_IDS],
    });
    expect(reflection.split('\n').length).toBe(3);
  });

  it('appends reflection to base text with paragraph break', () => {
    const result = appendTrueEndEpilogueReflection('Финал.', {
      flags: { ending_true_guardian: true },
      collectedPoems: [],
    });
    expect(result).toBe('Финал.\n\nТы восстановил гильдию — устав написан стихами и кодом.');
  });

  it('prefers forgiveness over traitor scar when both flags exist', () => {
    const reflection = buildTrueEndEpilogueReflection({
      flags: { traitor_revealed: true, dmitry_forgiven: true },
      collectedPoems: [],
    });
    expect(reflection).toContain('прощение');
    expect(reflection).not.toContain('Предательство');
  });

  it('prefers exile scar over generic traitor when Dmitry was banished', () => {
    const reflection = buildTrueEndEpilogueReflection({
      flags: { traitor_revealed: true, dmitry_exiled: true },
      collectedPoems: [],
    });
    expect(reflection).toContain('изгнан');
    expect(reflection).not.toContain('Предательство');
  });

  it('includes guild restored and peace path reflections', () => {
    const reflection = buildTrueEndEpilogueReflection({
      flags: { ending_true_guardian: true, guild_restored: true, peace_chosen: true },
      collectedPoems: [],
    });
    expect(reflection).toContain('гильдию');
  });
});
