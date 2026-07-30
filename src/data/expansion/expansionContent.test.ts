import { describe, expect, it } from 'vitest';
import { EXPANSION_POEM_STUBS, EXPANSION_POEM_IDS } from '@/data/expansion/expansionPoemStubs';
import { EXPANSION_LORE_STUBS } from '@/data/expansion/expansionLoreStubs';
import { EXPANSION_HUB_QUESTS } from '@/data/expansion/expansionHubQuests';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { getPoemById } from '@/data/poems';

describe('expansion narrative content', () => {
  it('expansion poems have real literary lines (no stub placeholder)', () => {
    for (const poem of EXPANSION_POEM_STUBS) {
      expect(poem.lines.length, poem.id).toBeGreaterThan(2);
      const joined = poem.lines.join(' ');
      expect(joined, poem.id).not.toContain('Строка ещё не восстановлена');
      expect(joined, poem.id).not.toContain('Когда-нибудь здесь будет полный текст');
    }
  });

  it('all expansion poem ids resolve via unified registry', () => {
    for (const id of EXPANSION_POEM_IDS) {
      expect(getPoemById(id), id).toBeTruthy();
    }
  });

  it('expansion lore entries have substantive Russian bodies', () => {
    for (const entry of EXPANSION_LORE_STUBS) {
      expect(entry.body.length, entry.id).toBeGreaterThan(80);
      expect(entry.body, entry.id).not.toContain('следующем обновлении контента');
    }
  });

  it('hub quests register with valid story entry nodes', () => {
    for (const quest of EXPANSION_HUB_QUESTS) {
      const registered = QUEST_DEFINITIONS.find((q) => q.id === quest.id);
      expect(registered, quest.id).toBeTruthy();
      if (quest.linkedStoryNodeId) {
        expect(STORY_NODES[quest.linkedStoryNodeId], quest.linkedStoryNodeId).toBeTruthy();
      }
    }
  });

  it('expansion quest story nodes link to explore hubs', () => {
    for (const id of [
      'act2_cafe_office_relay_start',
      'act2_street_chk_samizdat_start',
      'act2_pier_cafe_frequency_start',
      'act2_night_city_watch_start',
      'act2_archive_seven_resolve',
    ] as const) {
      expect(STORY_NODES[id], id).toBeTruthy();
    }
  });
});
