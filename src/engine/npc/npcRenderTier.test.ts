import { describe, it, expect } from 'vitest';
import type { NPCDefinition } from '@/shared/types/game';
import {
  npcTierHasHeadTracking,
  resolveNpcActivityForTier,
  resolveNpcRenderTier,
} from './npcRenderTier';

const crowdFiller: NPCDefinition = {
  id: 'street_extra_01',
  name: 'Прохожий',
  defaultPosition: [0, 0, 0],
};

// Не-геройский диалоговый NPC: street_poet с 8083b508 повышен до 'hero',
// поэтому для проверки «диалоговые NPC не падают в background» берём другого.
const storyNpc: NPCDefinition = {
  id: 'street_musician',
  name: 'Уличный музыкант',
  defaultPosition: [0, 0, 0],
  dialogueNodeId: 'street_musician_greeting',
};

describe('npcRenderTier', () => {
  it('defaults crowd filler in act5 districts to background', () => {
    expect(resolveNpcRenderTier(crowdFiller, 'street_night')).toBe('background');
    expect(resolveNpcRenderTier(crowdFiller, 'guild_mainframe')).toBe('background');
  });

  it('keeps dialogue NPCs interactive in crowd scenes', () => {
    expect(resolveNpcRenderTier(storyNpc, 'street_night')).toBe('interactive');
  });

  it('background tier skips head tracking and simplifies activity', () => {
    expect(npcTierHasHeadTracking('background')).toBe(false);
    expect(resolveNpcActivityForTier('walk', 'background', false)).toBe('idle');
    expect(resolveNpcActivityForTier('walk', 'background', true)).toBe('walk');
  });
});
