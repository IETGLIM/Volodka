import { describe, expect, it } from 'vitest';
import { STORY_NODES_ACT7 } from '@/data/story/act7';
import { GOLDEN_PATH_BRANCH_HINTS } from '@/data/goldenPath';
import { NPC_ID_ALIASES } from '@/shared/npcIdAliases';

describe('Act 7 story presentation', () => {
  it('all act 7 nodes have accessibility context', () => {
    for (const [id, node] of Object.entries(STORY_NODES_ACT7)) {
      expect(node.contextNote, id).toBeTruthy();
    }
  });

  it('emotional finales have ambient sound and announce', () => {
    expect(STORY_NODES_ACT7.act7_rooftop_recital.ambientSound).toBeTruthy();
    expect(STORY_NODES_ACT7.act7_rooftop_recital.musicCue).toBe('emotional');
    expect(STORY_NODES_ACT7.act7_rooftop_recital.accessibilityAnnounce).toContain('крыше');
    expect(STORY_NODES_ACT7.act7_nadzor_dies.accessibilityAnnounce).toContain('Надзор');
    expect(STORY_NODES_ACT7.act7_true_end.ambientSound).toBeTruthy();
    expect(STORY_NODES_ACT7.act7_true_end.musicCue).toBe('emotional');
    expect(STORY_NODES_ACT7.act7_library_archive.accessibilityAnnounce).toContain('архив');
  });

  it('act7_maria_future has karma variants, autosave and act5 path branches', () => {
    const node = STORY_NODES_ACT7.act7_maria_future;
    expect(node.autoSave).toBe(true);
    expect(node.textVariants?.highKarma).toBeTruthy();
    expect(node.karmaThresholds).toEqual({ high: 70, low: 35 });
    expect(node.choices.find((c) => c.condition?.flag === 'poet_chosen')?.next).toBe('act7_ending_poet_legacy');
    expect(node.choices.find((c) => c.condition?.flag === 'creator_chosen')?.next).toBe('act7_ending_guardian');
    expect(node.choices.find((c) => c.condition?.flag === 'exile_chosen')?.next).toBe('act7_ending_wanderer');
    expect(node.choices.find((c) => c.condition?.flag === 'machine_chosen')?.next).toBe('act7_ending_guardian');
  });

  it('critical nodes autosave before endings', () => {
    const ids = [
      'act7_maria_future',
      'act7_ending_poet_legacy',
      'act7_ending_guardian',
      'act7_ending_wanderer',
      'act7_true_end',
      'act7_rooftop_recital',
      'act7_core_battle',
      'act7_nadzor_dies',
    ] as const;
    for (const id of ids) {
      expect(STORY_NODES_ACT7[id].autoSave, id).toBe(true);
    }
  });

  it('final poem nodes collect poems and relieve stress', () => {
    const creation = STORY_NODES_ACT7.act7_final_poem_creation;
    expect(creation.choices[0]?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_29' });
    expect(creation.choices[0]?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_act7_01' });
    expect(creation.choices[0]?.effects).toContainEqual({ type: 'addStat', stat: 'stress', value: -10 });
    const published = STORY_NODES_ACT7.act7_poem_published;
    expect(published.choices[0]?.effects).toContainEqual({ type: 'collectPoem', poemId: 'poem_27' });
  });

  it('legacy mirrors cover act5 paths and CHK', () => {
    const poet = STORY_NODES_ACT7.act7_poet_legacy_mirror;
    expect(poet.choices.some((c) => c.condition?.flag === 'creator_chosen')).toBe(true);
    expect(poet.choices.some((c) => c.condition?.flag === 'poet_chosen')).toBe(true);
    expect(poet.choices.some((c) => c.condition?.flag === 'heard_machine_confession')).toBe(true);
    expect(poet.choices.some((c) => c.condition?.flag === 'tolpa_honorary_chekist')).toBe(true);
    expect(STORY_NODES_ACT7.act7_guardian_legacy_mirror).toBeTruthy();
    expect(STORY_NODES_ACT7.act7_wanderer_legacy_mirror).toBeTruthy();
    const guardian = STORY_NODES_ACT7.act7_ending_guardian.choices.find(
      (c) => c.next === 'act7_guardian_legacy_mirror',
    );
    const wanderer = STORY_NODES_ACT7.act7_ending_wanderer.choices.find(
      (c) => c.next === 'act7_wanderer_legacy_mirror',
    );
    expect(guardian).toBeTruthy();
    expect(wanderer).toBeTruthy();
  });

  it('npc aliases resolve for act 7 NPCs', () => {
    expect(NPC_ID_ALIASES.npc_sergey).toBe('sergey');
    expect(NPC_ID_ALIASES.npc_katya).toBe('kate');
    expect(NPC_ID_ALIASES.npc_alina).toBe('solnysh');
    expect(NPC_ID_ALIASES.npc_viktoria).toBe('maria');
  });

  it('guidance uses npc_* ids for Victoria and allies', () => {
    expect(STORY_NODES_ACT7.act7_final_walk.guidanceNpcId).toBe('npc_viktoria');
    expect(STORY_NODES_ACT7.act7_charter_drafting.guidanceNpcId).toBe('npc_sergey');
    expect(STORY_NODES_ACT7.act7_community_voice.effects).toBeUndefined();
    const community = STORY_NODES_ACT7.act7_community_voice.choices[0];
    expect(community?.effects).toContainEqual({
      type: 'npcChange',
      npcId: 'npc_alina',
      npcChange: { relation: 5 },
    });
  });

  it('act7 endings share karma thresholds and scene labels', () => {
    const endings = [
      STORY_NODES_ACT7.act7_ending_poet_legacy,
      STORY_NODES_ACT7.act7_ending_guardian,
      STORY_NODES_ACT7.act7_ending_wanderer,
    ];
    for (const node of endings) {
      expect(node.karmaThresholds).toEqual({ high: 70, low: 35 });
      expect(node.guidanceSceneLabel, node.id).toBeTruthy();
      expect(node.musicCue, node.id).toBeTruthy();
      expect(node.autoSave, node.id).toBe(true);
    }
    expect(STORY_NODES_ACT7.act7_ending_wanderer.sceneId).toBe('street_winter');
    expect(STORY_NODES_ACT7.act7_ending_poet_legacy.sceneId).toBe('cafe_evening');
    expect(STORY_NODES_ACT7.act7_ending_guardian.sceneId).toBe('library_day');
  });

  it('key act 7 nodes have golden path hints', () => {
    const ids = [
      'act7_bridge',
      'act7_library_archive',
      'act7_rooftop_recital',
      'act7_maria_future',
      'act7_true_end',
      'act7_poet_legacy_mirror',
    ] as const;
    for (const id of ids) {
      expect(GOLDEN_PATH_BRANCH_HINTS[id], id).toBeTruthy();
    }
  });

  it('act7_true_end leaves to free roam, epilogue, or new game — never null soft-lock', () => {
    const node = STORY_NODES_ACT7.act7_true_end;
    const nexts = new Set(node.choices.map((c) => c.next));
    expect(nexts.has('explore_mode')).toBe(true);
    expect(nexts.has('epilogue_hub')).toBe(true);
    expect(nexts.has('start')).toBe(true);
    expect(node.choices.every((c) => c.next !== null)).toBe(true);
    const roam = node.choices.find((c) => c.next === 'explore_mode');
    expect(roam?.goldenPath).toBe(true);
    expect(roam?.effects).toContainEqual({
      type: 'setFlag',
      flag: 'game_completed',
      flagValue: true,
    });
    const epi = node.choices.find((c) => c.next === 'epilogue_hub');
    expect(epi?.condition?.flag).toBe('volodka_legacy_complete');
  });

  it('act7_bridge leaves to rooftop explore — not forced overlay only', () => {
    const bridge = STORY_NODES_ACT7.act7_bridge;
    expect(bridge.effects).toContainEqual({
      type: 'setFlag',
      flag: 'act7_bridge_open',
      flagValue: true,
    });
    expect(bridge.choices.some((c) => c.next === 'rooftop_explore_mode')).toBe(true);
    const descend = bridge.choices.find((c) => c.next === 'act7_guild_rebuilding');
    expect(descend?.goldenPath).toBe(true);
    expect(descend?.effects).toContainEqual({
      type: 'setFlag',
      flag: 'act7_bridge_resolved',
      flagValue: true,
    });
  });

  it('ending + mirror nodes leave to explore hubs before true_end', () => {
    expect(
      STORY_NODES_ACT7.act7_ending_poet_legacy.choices.some((c) => c.next === 'cafe_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES_ACT7.act7_poet_legacy_mirror.choices.some((c) => c.next === 'cafe_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES_ACT7.act7_ending_guardian.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES_ACT7.act7_guardian_legacy_mirror.choices.some(
        (c) => c.next === 'library_explore_mode',
      ),
    ).toBe(true);
    expect(
      STORY_NODES_ACT7.act7_ending_wanderer.choices.some(
        (c) => c.next === 'street_winter_explore_mode',
      ),
    ).toBe(true);
    expect(
      STORY_NODES_ACT7.act7_wanderer_legacy_mirror.choices.some(
        (c) => c.next === 'street_winter_explore_mode',
      ),
    ).toBe(true);
  });

  it('act7_exp_epilogue_vision leaves to square roam / explore / epilogue — never null', async () => {
    const { ACT7_STORY_EXPANDED_NODES } = await import('./act7-story-expanded');
    const node = ACT7_STORY_EXPANDED_NODES.act7_exp_epilogue_vision;
    expect(node.choices.every((c) => c.next !== null)).toBe(true);
    const nexts = new Set(node.choices.map((c) => c.next));
    expect(nexts.has('city_square_explore_mode')).toBe(true);
    expect(nexts.has('explore_mode')).toBe(true);
    expect(nexts.has('epilogue_hub')).toBe(true);
  });
});
