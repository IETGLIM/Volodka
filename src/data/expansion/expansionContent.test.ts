import { describe, expect, it } from 'vitest';
import { EXPANSION_POEM_STUBS, EXPANSION_POEM_IDS } from '@/data/expansion/expansionPoemStubs';
import { EXPANSION_LORE_STUBS } from '@/data/expansion/expansionLoreStubs';
import { EXPANSION_HUB_QUESTS } from '@/data/expansion/expansionHubQuests';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { getPoemById } from '@/data/poems';
import { NPC_SCHEDULES } from '@/data/npcSchedules';
import type { SceneId } from '@/shared/types/game';
import {
  resolveExploreHubIntroText,
  resolveExploreHubRevisitText,
} from '@/shared/contentTruthManifest';

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

  it('hub connector scenes have first-visit whispers via content truth', () => {
    for (const hubId of ['street_bench_view', 'pier_explore_mode', 'factory_explore_mode'] as const) {
      expect(resolveExploreHubIntroText(hubId), hubId).toBeTruthy();
      expect(resolveExploreHubRevisitText(hubId), hubId).toBeTruthy();
    }
  });

  it('hub cast schedules span connector scenes', () => {
    const hubScenes = new Set<SceneId>(['cafe_evening', 'street_night', 'office_day', 'chk_forest_zorge', 'river_pier']);
    const hubCast = ['albert', 'cafe_barista', 'office_colleague', 'zarema', 'fisherman_trofim', 'chk_based'];
    for (const npcId of hubCast) {
      const schedule = NPC_SCHEDULES.find((s) => s.npcId === npcId);
      expect(schedule, npcId).toBeTruthy();
      const scenes = new Set(schedule!.entries.map((e) => e.sceneId));
      const hits = [...hubScenes].filter((s) => scenes.has(s));
      expect(hits.length, `${npcId} hub coverage`).toBeGreaterThanOrEqual(2);
    }
  });
});
