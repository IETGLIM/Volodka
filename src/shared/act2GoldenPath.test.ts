import { describe, expect, it } from 'vitest';
import { STORY_NODES_SCENE_EXPLORE_HUBS } from '@/data/story/sceneExploreHubs';
import { STORY_NODES_ACT2 } from '@/data/story/act2';

describe('Act II golden path markers', () => {
  it('marks act2_maria_search golden branch to maria introduction', () => {
    const node = STORY_NODES_ACT2.act2_maria_search;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('maria_introduction');
  });

  it('marks act2_transition cafe spine golden branch', () => {
    const node = STORY_NODES_ACT2.act2_transition;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_albert_hint');
  });

  it('marks act2_maria_meeting_place golden branch to network initiation', () => {
    const node = STORY_NODES_ACT2.act2_maria_meeting_place;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_network_initiation');
    expect(golden[0]?.condition?.minKarma).toBe(30);
  });

  it('marks act2_network_initiation golden branch to oath', () => {
    const node = STORY_NODES_ACT2.act2_network_initiation;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_network_oath');
  });

  it('marks act2_vault_revealed golden branch to safehouse agreement', () => {
    const node = STORY_NODES_ACT2.act2_vault_revealed;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_safehouse_agreed');
  });

  it('marks act2_dmitry_contact golden branch to office meeting', () => {
    const node = STORY_NODES_ACT2.act2_dmitry_contact;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_dmitry_office_meeting');
  });

  it('marks act2_dmitry_office_meeting golden branch to cafe evening end', () => {
    const node = STORY_NODES_ACT2.act2_dmitry_office_meeting;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('cafe_evening_end');
  });

  it('marks act2_closing golden branch to act3_transition', () => {
    const node = STORY_NODES_ACT2.act2_closing;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act3_transition');
  });

  it('marks act2_safehouse_agreed golden branch to terminal install', () => {
    const node = STORY_NODES_ACT2.act2_safehouse_agreed;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act2_safehouse_terminal');
  });

  it('office_explore_mode hub golden branch leads to start_diagnosis', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.office_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('start_diagnosis');
  });

  it('street_winter_explore_mode hub golden branch leads to act4_peaceful_march', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.street_winter_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act4_peaceful_march');
  });

  it('rooftop_explore_mode hub golden branch leads to act4_rooftop_broadcast', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.rooftop_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act4_rooftop_broadcast');
  });

  it('chk_explore_mode hub golden branch leads to chk_act5_campfire_dawn', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.chk_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('chk_act5_campfire_dawn');
  });

  it('dream_explore_mode hub golden branch leads to sleep_dream_entrance', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.dream_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('sleep_dream_entrance');
  });

  it('zarema_room_explore_mode hub golden branch leads to zarema_bank_discovery', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.zarema_room_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('zarema_bank_discovery');
  });

  it('library_explore_mode hub golden branch leads to act7_library_archive', () => {
    const node = STORY_NODES_SCENE_EXPLORE_HUBS.library_explore_mode;
    const golden = node.choices.filter((c) => c.goldenPath === true);
    expect(golden).toHaveLength(1);
    expect(golden[0]?.next).toBe('act7_library_archive');
  });
});
