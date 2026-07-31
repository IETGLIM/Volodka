import { describe, it, expect } from 'vitest';
import { STORY_NODES } from '@/data/story';
import {
  CONTENT_TRUTH,
  resolveExploreHubIntroText,
  resolveExploreHubRevisitText,
  STORY_DEFINED_EXPLORE_HUB_IDS,
} from '@/shared/contentTruthManifest';
import { enrichPoemMechanicsDisplay } from '@/data/unifiedPoemRegistry';
import { getPoemPower } from '@/engine/PoemPowerSystem';
import { POEM_COMBAT_ABILITIES } from '@/engine/combat/actions';

describe('contentTruthManifest', () => {
  it('documents canonical sources for each content domain', () => {
    expect(CONTENT_TRUTH.storyNodes).toContain('narrativePackRegistry');
    expect(CONTENT_TRUTH.poemText).toContain('poems.ts');
    expect(CONTENT_TRUTH.narrativePresentation).toContain('presentNarrativeBeat');
    expect(CONTENT_TRUTH.achievements).toContain('achievements.ts');
  });

  it('resolves story-defined explore hub intros from act JSON, not registry', () => {
    for (const hubId of [
      'explore_mode',
      'corridor_explore_mode',
      'street_bench_view',
      'cafe_explore_mode',
      'office_explore_mode',
      'home_evening_explore_mode',
    ]) {
      expect(STORY_DEFINED_EXPLORE_HUB_IDS.has(hubId)).toBe(true);
      const intro = resolveExploreHubIntroText(hubId, STORY_NODES);
      expect(intro).toBeTruthy();
      expect(intro).toBe(STORY_NODES[hubId]?.hubIntroText);
    }
  });

  it('uses hubRevisitText or contextNote for revisit toasts', () => {
    const revisit = resolveExploreHubRevisitText('explore_mode', STORY_NODES);
    expect(revisit).toBe(STORY_NODES.explore_mode?.hubRevisitText);
  });

  it('derives poem world display from unifiedPoemRegistry', () => {
    const raw = { poemId: 'poem_1', name: 'OLD', description: 'OLD DESC' };
    const enriched = enrichPoemMechanicsDisplay(raw, 'world');
    expect(enriched.name).toBe('Правда Глас');
    expect(enriched.description).toContain('убеждения');
  });

  it('getPoemPower returns unified display metadata', () => {
    const power = getPoemPower('poem_1');
    expect(power?.name).toBe('Правда Глас');
    expect(power?.description).toContain('убеждения');
  });

  it('exports combat abilities with unified display metadata', () => {
    expect(POEM_COMBAT_ABILITIES.poem_1?.name).toBe('Правда Глас');
    expect(POEM_COMBAT_ABILITIES.poem_1?.description).toContain('защиту');
  });
});
