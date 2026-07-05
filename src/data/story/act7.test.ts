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
});
