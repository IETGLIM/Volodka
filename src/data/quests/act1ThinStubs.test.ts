import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { TRIGGER_ZONES } from '@/data/triggerZones';
import { EXPANDED_DIALOGUE_NODES } from '@/data/expandedDialogueNodes';
import { SCENE_EXPLORE_HUB_DEFS } from '@/shared/sceneExploreHubRegistry';

const THICKENED = [
  'alberts_lesson',
  'corridor_letter',
  'pier_midnight_fishing',
  'morning_ritual',
  'pier_ritka_strings',
  'library_lost_archive',
  'chk_portwine_delivery',
  'library_katya_research',
  'chk_guitar_strings',
  'factory_zarya_memory',
  'factory_baba_zina_tea',
] as const;

describe('Act 1–2 thin stub → multi-beat conversion', () => {
  it('targets have ≥5 objectives with wired story entry nodes', () => {
    for (const id of THICKENED) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === id);
      expect(quest, id).toBeTruthy();
      expect(quest!.objectives.length, id).toBeGreaterThanOrEqual(5);
      expect(quest!.linkedStoryNodeId, id).toBeTruthy();
      expect(STORY_NODES[quest!.linkedStoryNodeId!], quest!.linkedStoryNodeId).toBeTruthy();
      for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
        expect(STORY_NODES[nodeId], nodeId).toBeTruthy();
      }
    }
  });

  it('pier midnight fishing spans sit → bass → key beats', () => {
    expect(STORY_NODES.pier_midnight_fishing_sit).toBeTruthy();
    expect(STORY_NODES.pier_midnight_fishing_bass).toBeTruthy();
    expect(STORY_NODES.pier_midnight_fishing_key).toBeTruthy();
    const start = STORY_NODES.pier_midnight_fishing_start;
    expect(start.choices[0]?.next).toBe('pier_midnight_fishing_sit');
  });

  it('albert lesson inserts napkin beat before riddle', () => {
    const intro = STORY_NODES.cafe_albert_lesson_intro;
    expect(intro.choices[0]?.next).toBe('cafe_albert_napkin');
    expect(STORY_NODES.cafe_albert_napkin.choices[0]?.next).toBe('cafe_albert_riddle');
  });

  it('morning_ritual spans bookshelf → tea → kitchen window flags', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'morning_ritual')!;
    expect(quest.objectives.map((o) => o.id)).toEqual([
      'ritual_terminal',
      'ritual_wardrobe',
      'ritual_bookshelf',
      'ritual_intercom',
      'ritual_tea',
      'ritual_window',
    ]);
  });

  it('pier ritka strings spans elis → office → pack → song', () => {
    expect(STORY_NODES.pier_ritka_elis_ask).toBeTruthy();
    expect(STORY_NODES.pier_ritka_office_string).toBeTruthy();
    expect(STORY_NODES.pier_ritka_elis_pack).toBeTruthy();
    const promise = STORY_NODES.pier_ritka_strings_promise;
    expect(promise.guidanceNpcId).toBe('chk_elis');
    const delivered = STORY_NODES.pier_ritka_strings_delivered;
    const effects = delivered.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'pier_ritka_song_heard')).toBe(true);
  });

  it('library lost archive spans fund key → gate → digitize', () => {
    expect(STORY_NODES.library_archive_fund_key).toBeTruthy();
    expect(STORY_NODES.library_archive_descent).toBeTruthy();
    expect(STORY_NODES.library_archive_gate).toBeTruthy();
    expect(STORY_NODES.library_archive_digitize).toBeTruthy();
    const start = STORY_NODES.library_lost_archive_start;
    expect(start.choices[0]?.next).toBe('library_archive_fund_key');
    const digitize = STORY_NODES.library_archive_digitize;
    const effects = digitize.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'library_lost_archive_done')).toBe(true);
  });

  it('library_lost_archive leave + mid-resume splits descent→gate→found', () => {
    expect(
      STORY_NODES.library_archive_descent.choices.some((c) => c.next === 'library_basement_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.library_archive_gate.choices.some((c) => c.next === 'library_basement_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.library_lost_archive_found.choices.some((c) => c.next === 'library_basement_explore_mode'),
    ).toBe(true);

    const library = STORY_NODES.library_explore_mode;
    const descent = library.choices.find((c) => c.next === 'library_archive_descent');
    expect(descent?.condition?.flag).toBe('library_archive_key_found');
    expect(descent?.condition?.missingFlag).toBe('library_basement_entered');

    const basement = STORY_NODES.library_basement_explore_mode;
    expect(basement.choices.some((c) => c.next === 'library_archive_gate')).toBe(true);
    expect(basement.choices.some((c) => c.next === 'library_lost_archive_found')).toBe(true);
    expect(basement.choices.some((c) => c.next === 'library_archive_digitize')).toBe(true);

    expect(TRIGGER_ZONES.find((z) => z.id === 'library_archive_key_descent')?.hiddenWhenFlag).toBe(
      'library_basement_entered',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_basement_archive_found')?.linkedStoryNodeId).toBe(
      'library_lost_archive_found',
    );
  });

  it('library_katya_research leave + mid-resume splits schema→crossref→night→marat', () => {
    expect(
      STORY_NODES.library_katya_schema.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.library_katya_crossref.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.library_katya_night.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.library_katya_marat_hit.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);

    const library = STORY_NODES.library_explore_mode;
    expect(library.choices.some((c) => c.next === 'library_katya_schema')).toBe(true);
    expect(library.choices.some((c) => c.next === 'library_katya_marat_hit')).toBe(true);
    expect(library.choices.some((c) => c.next === 'library_katya_research_done')).toBe(true);

    expect(TRIGGER_ZONES.find((z) => z.id === 'library_katya_schema_mid')?.linkedStoryNodeId).toBe(
      'library_katya_schema',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_katya_marat_mid')?.hiddenWhenFlag).toBe(
      'library_katya_marat_node',
    );
  });

  it('pier_midnight_fishing leave + mid-resume splits sit→bass→key', () => {
    expect(
      STORY_NODES.pier_midnight_fishing_start.choices.some((c) => c.next === 'pier_evening_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.pier_midnight_fishing_sit.choices.some((c) => c.next === 'pier_evening_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.pier_midnight_fishing_bass.choices.some((c) => c.next === 'pier_evening_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.pier_midnight_fishing_key.choices.some(
        (c) =>
          c.next === 'pier_evening_explore_mode'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'pier_midnight_fishing_done',
          ),
      ),
    ).toBe(true);

    const pier = STORY_NODES.pier_evening_explore_mode;
    const start = pier.choices.find((c) => c.next === 'pier_midnight_fishing_start');
    expect(start?.condition?.missingFlag).toBe('pier_fishing_float_taken');
    expect(pier.choices.some((c) => c.next === 'pier_midnight_fishing_sit')).toBe(true);
    expect(pier.choices.some((c) => c.next === 'pier_midnight_fishing_key')).toBe(true);

    expect(TRIGGER_ZONES.find((z) => z.id === 'pier_evening_fishing_sit')?.linkedStoryNodeId).toBe(
      'pier_midnight_fishing_sit',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'pier_evening_fishing_key')?.hiddenWhenFlag).toBe(
      'pier_midnight_fishing_done',
    );
  });

  it('pier_ritka office/elis leave + hub/zone/dialogue mid-resume', () => {
    expect(
      STORY_NODES.pier_ritka_office_string.choices.some(
        (c) =>
          c.next === 'office_explore_mode'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'pier_ritka_get_strings_done',
          ),
      ),
    ).toBe(true);
    expect(
      STORY_NODES.pier_ritka_elis_pack.choices.some(
        (c) =>
          c.next === 'chk_campfire_night_explore_mode'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'pier_ritka_elis_pack_ready',
          ),
      ),
    ).toBe(true);

    const office = STORY_NODES.office_explore_mode;
    const camp = STORY_NODES.chk_campfire_night_explore_mode;
    const chk = STORY_NODES.chk_explore_mode;
    expect(office.choices.some((c) => c.next === 'pier_ritka_office_string')).toBe(true);
    expect(camp.choices.some((c) => c.next === 'pier_ritka_elis_pack')).toBe(true);
    expect(chk.choices.some((c) => c.next === 'pier_ritka_elis_pack')).toBe(true);

    expect(TRIGGER_ZONES.find((z) => z.id === 'office_ritka_string')?.linkedStoryNodeId).toBe(
      'pier_ritka_office_string',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_ritka_string')?.hiddenWhenFlag).toBe(
      'pier_ritka_get_strings_done',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'chk_campfire_ritka_pack')?.linkedStoryNodeId).toBe(
      'pier_ritka_elis_pack',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'chk_campfire_ritka_pack')?.hiddenWhenFlag).toBe(
      'pier_ritka_elis_pack_ready',
    );
  });

  it('pier_ritka office colleague dialogue mid-resume', async () => {
    const { DIALOGUE_PART2 } = await import('@/data/dialogue/part2-npcs');
    expect(
      DIALOGUE_PART2.office_colleague_dialogue.choices.some(
        (c) => c.next === 'pier_ritka_office_string',
      ),
    ).toBe(true);
    expect(
      DIALOGUE_PART2.office_colleague_return.choices.some(
        (c) => c.next === 'pier_ritka_office_string',
      ),
    ).toBe(true);
  });

  it('Act 4 bank_transfer / digital_ghost / night_watch leave + hub mid-resume', () => {
    expect(
      STORY_NODES.bank_transfer_trace.choices.some((c) => c.next === 'zarema_room_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.bank_transfer_culprit.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.digital_ghost_traces.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.digital_ghost_firewall.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.night_watch_child.choices.some((c) => c.next === 'street_winter_explore_mode'),
    ).toBe(true);

    const zarema = STORY_NODES.zarema_room_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const winter = STORY_NODES.street_winter_explore_mode;
    expect(zarema.choices.some((c) => c.next === 'bank_transfer_trace')).toBe(true);
    expect(office.choices.some((c) => c.next === 'bank_transfer_culprit')).toBe(true);
    expect(office.choices.some((c) => c.next === 'digital_ghost_traces')).toBe(true);
    expect(office.choices.some((c) => c.next === 'digital_ghost_firewall')).toBe(true);
    expect(winter.choices.some((c) => c.next === 'night_watch_child')).toBe(true);
  });

  it('banking_crash_verify / last_poem_compose leave + hub mid-resume', () => {
    expect(
      STORY_NODES.banking_crash_verify.choices.some(
        (c) =>
          c.next === 'home_evening_explore_mode'
          && c.condition?.missingFlag === 'banking_system_recovered',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.banking_crash_verify.choices.some((c) => c.next === 'kitchen_table'),
    ).toBe(true);
    expect(
      STORY_NODES.last_poem_compose.choices.some(
        (c) =>
          c.next === 'rooftop_explore_mode' && c.condition?.missingFlag === 'poem_composed',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.last_poem_compose.choices.some((c) => c.next === 'last_poem_recite'),
    ).toBe(true);

    const home = STORY_NODES.home_evening_explore_mode;
    const rooftop = STORY_NODES.rooftop_explore_mode;
    const verify = home.choices.find((c) => c.next === 'banking_crash_verify');
    expect(verify?.condition?.flag).toBe('bash_terminal_solved');
    expect(verify?.condition?.missingFlag).toBe('banking_system_recovered');
    const poem = rooftop.choices.find((c) => c.next === 'last_poem_approach');
    expect(poem?.condition?.flag).toBe('all_poems_collected');
    expect(poem?.condition?.missingFlag).toBe('poem_composed');
    expect(TRIGGER_ZONES.find((z) => z.id === 'home_banking_verify')?.linkedStoryNodeId).toBe(
      'banking_crash_verify',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'rooftop_last_poem_ledge')?.linkedStoryNodeId).toBe(
      'last_poem_approach',
    );
    expect(
      SCENE_EXPLORE_HUB_DEFS.find((d) => d.hubId === 'rooftop_explore_mode')?.entryNodeIds,
    ).toEqual(expect.arrayContaining(['last_poem_compose', 'last_poem_approach', 'last_poem_recite']));
  });

  it('chk portwine delivery spans albert → street → toast', () => {
    expect(STORY_NODES.chk_portwine_promise).toBeTruthy();
    expect(STORY_NODES.chk_portwine_albert_ask).toBeTruthy();
    expect(STORY_NODES.chk_portwine_street).toBeTruthy();
    expect(STORY_NODES.chk_portwine_toast).toBeTruthy();
    const start = STORY_NODES.chk_portwine_delivery_start;
    expect(start.choices[0]?.next).toBe('chk_portwine_promise');
    const toast = STORY_NODES.chk_portwine_toast;
    const effects = toast.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'chk_portwine_toast_shared')).toBe(true);
  });

  it('library katya research spans schema → night → marat → printout', () => {
    expect(STORY_NODES.library_katya_schema).toBeTruthy();
    expect(STORY_NODES.library_katya_crossref).toBeTruthy();
    expect(STORY_NODES.library_katya_night).toBeTruthy();
    expect(STORY_NODES.library_katya_marat_hit).toBeTruthy();
    const start = STORY_NODES.library_katya_research_start;
    expect(start.choices[0]?.next).toBe('library_katya_schema');
    const done = STORY_NODES.library_katya_research_done;
    const effects = done.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'library_katya_research_done')).toBe(true);
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'marat_trace_found')).toBe(true);
  });

  it('chk guitar strings spans office → return → blind song without skipping Ritka pack', () => {
    expect(STORY_NODES.chk_guitar_strings_brief).toBeTruthy();
    expect(STORY_NODES.chk_guitar_office_pickup).toBeTruthy();
    expect(STORY_NODES.chk_guitar_return_elis).toBeTruthy();
    expect(STORY_NODES.chk_guitar_blind_song).toBeTruthy();
    const start = STORY_NODES.chk_guitar_strings_start;
    expect(start.choices[0]?.next).toBe('chk_guitar_strings_brief');
    const found = STORY_NODES.chk_guitar_strings_found;
    expect(found.choices.some((c) => c.next === 'pier_ritka_strings_delivered')).toBe(false);
    const thank = found.choices.find((c) => c.next === 'chk_explore_mode');
    const thankEffects = thank?.effects ?? [];
    expect(thankEffects.some((e) => e.type === 'setFlag' && e.flag === 'pier_ritka_elis_pack_ready')).toBe(
      false,
    );
    expect(thankEffects.some((e) => e.type === 'setFlag' && e.flag === 'chk_guitar_strings_done')).toBe(true);
  });

  it('phase5 neon archive sets chk_neon_archive_done', () => {
    expect(STORY_NODES.quest_act2_chk_neon_archive_hack).toBeTruthy();
    const start = STORY_NODES.quest_act2_chk_neon_archive_start;
    expect(start.choices[0]?.next).toBe('quest_act2_chk_neon_archive_hack');
    const hack = STORY_NODES.quest_act2_chk_neon_archive_hack;
    const effects = hack.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'chk_neon_archive_done')).toBe(true);
  });

  it('Act 2 server poem hunt + neon archive leave to hubs + mid-resume', () => {
    expect(STORY_NODES.quest_act2_server_poem_office).toBeTruthy();
    expect(STORY_NODES.quest_act2_server_poem_pier).toBeTruthy();
    expect(STORY_NODES.quest_act2_server_poem_chk).toBeTruthy();
    expect(STORY_NODES.quest_act2_server_poem_hunt_start.choices[0]?.next).toBe(
      'quest_act2_server_poem_office',
    );
    expect(
      STORY_NODES.quest_act2_server_poem_office.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act2_server_poem_pier.choices.some(
        (c) => c.next === 'pier_evening_explore_mode',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act2_server_poem_chk.choices.some((c) => c.next === 'chk_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act2_chk_neon_archive_hack.choices.some(
        (c) => c.next === 'cafe_explore_mode' && !(c.effects ?? []).length,
      ),
    ).toBe(true);
    expect(
      STORY_NODES.office_explore_mode.choices.some(
        (c) => c.next === 'quest_act2_server_poem_office',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.pier_evening_explore_mode.choices.some(
        (c) => c.next === 'quest_act2_server_poem_pier',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.chk_explore_mode.choices.some((c) => c.next === 'quest_act2_server_poem_chk'),
    ).toBe(true);
    expect(
      STORY_NODES.cafe_explore_mode.choices.some(
        (c) => c.next === 'quest_act2_chk_neon_archive_hack',
      ),
    ).toBe(true);
    const poemQuest = QUEST_DEFINITIONS.find((q) => q.id === 'quest_act2_server_poem_hunt');
    expect(poemQuest?.objectives.every((o) => o.type === 'flag_set')).toBe(true);
    expect(poemQuest?.linkedStoryNodeIds).toEqual([
      'quest_act2_server_poem_hunt_start',
      'quest_act2_server_poem_office',
      'quest_act2_server_poem_pier',
      'quest_act2_server_poem_chk',
    ]);
  });

  it('chk_act7_farewell leaves to forest hub — not room explore_mode', () => {
    const farewell = STORY_NODES.chk_act7_farewell;
    expect(farewell.choices.every((c) => c.next === 'chk_explore_mode')).toBe(true);
    expect(farewell.choices.some((c) => c.next === 'explore_mode')).toBe(false);
    expect(
      (farewell.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'tolpa_act7_farewell_heard',
      ),
    ).toBe(true);
    const chk = STORY_NODES.chk_explore_mode;
    const resume = chk.choices.find((c) => c.next === 'chk_act7_farewell');
    expect(resume?.condition?.requiredAct).toBe(7);
    expect(resume?.condition?.missingFlag).toBe('tolpa_act7_farewell_heard');
  });

  it('factory zarya memory spans snow → storm → photo → restore', () => {
    expect(STORY_NODES.factory_zarya_snow).toBeTruthy();
    expect(STORY_NODES.factory_zarya_storm).toBeTruthy();
    expect(STORY_NODES.factory_zarya_photo).toBeTruthy();
    const start = STORY_NODES.factory_zarya_memory_start;
    expect(start.choices[0]?.next).toBe('factory_zarya_snow');
    const restore = STORY_NODES.factory_zarya_memory_restore;
    const effects = restore.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'factory_zarya_memory_done')).toBe(true);
  });

  it('factory_zarya mid-resume: leave on snow/storm/photo + hub split', () => {
    expect(
      STORY_NODES.factory_zarya_snow.choices.some((c) => c.next === 'factory_roof_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.factory_zarya_storm.choices.some((c) => c.next === 'basement_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.factory_zarya_photo.choices.some((c) => c.next === 'basement_explore_mode'),
    ).toBe(true);
    const roof = STORY_NODES.factory_roof_explore_mode;
    const snow = roof.choices.find((c) => c.next === 'factory_zarya_snow');
    expect(snow?.condition?.flag).toBe('factory_zarya_memory_active');
    expect(snow?.condition?.missingFlag).toBe('factory_zarya_snow_done');
    const basement = STORY_NODES.basement_explore_mode;
    const storm = basement.choices.find((c) => c.next === 'factory_zarya_storm');
    expect(storm?.condition?.flag).toBe('factory_zarya_snow_done');
    expect(storm?.condition?.missingFlag).toBe('factory_zarya_storm_done');
    const photo = basement.choices.find((c) => c.next === 'factory_zarya_photo');
    expect(photo?.condition?.flag).toBe('factory_zarya_storm_done');
    expect(photo?.condition?.missingFlag).toBe('factory_zarya_photo_done');
    const restore = basement.choices.find((c) => c.next === 'factory_zarya_memory_restore');
    expect(restore?.condition?.flag).toBe('factory_zarya_photo_done');
    expect(restore?.condition?.missingFlag).toBe('factory_zarya_memory_done');
  });

  it('factory baba zina tea spans kettle → mint → hum → history → done', () => {
    expect(STORY_NODES.factory_baba_zina_tea_kettle).toBeTruthy();
    expect(STORY_NODES.factory_baba_zina_tea_mint).toBeTruthy();
    expect(STORY_NODES.factory_baba_zina_tea_hum).toBeTruthy();
    expect(STORY_NODES.factory_baba_zina_tea_history).toBeTruthy();
    const start = STORY_NODES.factory_baba_zina_tea_start;
    expect(start.choices[0]?.next).toBe('factory_baba_zina_tea_kettle');
    const done = STORY_NODES.factory_baba_zina_tea_done;
    const effects = done.choices[0]?.effects ?? [];
    expect(effects.some((e) => e.type === 'setFlag' && e.flag === 'factory_baba_zina_tea_done')).toBe(true);
  });

  it('factory_baba_zina_tea mid-resume: leave on mid-beats + hub/dialogue split', () => {
    expect(
      STORY_NODES.factory_baba_zina_tea_kettle.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.factory_baba_zina_tea_mint.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.factory_baba_zina_tea_hum.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.factory_baba_zina_tea_history.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    const factory = STORY_NODES.factory_explore_mode;
    const kettle = factory.choices.find((c) => c.next === 'factory_baba_zina_tea_kettle');
    expect(kettle?.condition?.flag).toBe('factory_baba_zina_tea_active');
    expect(kettle?.condition?.missingFlag).toBe('factory_baba_zina_tea_kettle');
    const mint = factory.choices.find((c) => c.next === 'factory_baba_zina_tea_mint');
    expect(mint?.condition?.flag).toBe('factory_baba_zina_tea_kettle');
    expect(mint?.condition?.missingFlag).toBe('factory_baba_zina_tea_mint');
    const hum = factory.choices.find((c) => c.next === 'factory_baba_zina_tea_hum');
    expect(hum?.condition?.flag).toBe('factory_baba_zina_tea_mint');
    expect(hum?.condition?.missingFlag).toBe('factory_baba_zina_tea_hum');
    const history = factory.choices.find((c) => c.next === 'factory_baba_zina_tea_history');
    expect(history?.condition?.flag).toBe('factory_baba_zina_tea_hum');
    expect(history?.condition?.missingFlag).toBe('factory_baba_zina_tea_done');
    // Hub text/structure parity — Тишина must map to nadzor_dies (not Память).
    expect(
      factory.choices.find((c) => c.next === 'act7_nadzor_dies')?.text,
    ).toContain('Тишина');
    expect(
      factory.choices.find((c) => c.next === 'quest_act5_factory_zarya_memory_restore_start')?.text,
    ).toContain('Память');
  });

  it('phase5 park bloom / samizdat / zarya fragments / rooftop / evidence set completion flags', () => {
    const bloomGamma = STORY_NODES.quest_act3_park_cyber_bloom_gamma;
    expect(
      (bloomGamma.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'park_cyber_bloom_gamma_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act3_park_cyber_bloom_alpha.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'park_cyber_bloom_alpha_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act4_street_samizdat_pier.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'samizdat_pier_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act4_street_samizdat_library.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'samizdat_library_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act5_zarya_fragment_3.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'zarya_memory_fragment_3_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act4_rooftop_broadcast_repair.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act4_rooftop_broadcast_setup_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act3_zarema_evidence_secure.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act3_zarema_evidence_run_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act5_bunker_poem_key.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'bunker_poem_key_found',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act5_bunker_code_break.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act5_bunker_code_poem_break_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act6_defector_free_cell.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'defector_freed_from_cell',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act6_defector_escape_sewers.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act6_defector_rescue_expanded_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act7_poets_monument_inscribe.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act7_poets_monument_inscription_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act7_poets_monument_plate.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act7_poets_monument_plate_cleared',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act7_poets_monument_recall.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act7_poets_monument_names_recalled',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.quest_act7_poets_monument_carve.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'quest_act7_poets_monument_carved',
      ),
    ).toBe(true);
    for (const startId of [
      'quest_act3_park_cyber_bloom_start',
      'quest_act4_street_samizdat_start',
      'quest_act5_factory_zarya_memory_restore_start',
      'quest_act4_rooftop_broadcast_setup_start',
      'quest_act3_zarema_evidence_run_start',
      'quest_act5_bunker_code_poem_break_start',
      'quest_act6_defector_rescue_expanded_start',
      'quest_act7_poets_monument_inscription_start',
    ] as const) {
      const effects = STORY_NODES[startId].choices[0]?.effects ?? [];
      expect(
        effects.some((e) => e.type === 'triggerQuest'),
        `${startId} should triggerQuest`,
      ).toBe(true);
    }
  });

  it('Act 4 samizdat + rooftop antenna leave to hubs + mid-resume', () => {
    expect(
      STORY_NODES.quest_act4_street_samizdat_pier.choices.some(
        (c) => c.next === 'pier_evening_explore_mode',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act4_street_samizdat_chk.choices.some((c) => c.next === 'chk_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act4_street_samizdat_library.choices.some(
        (c) => c.next === 'library_explore_mode',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act4_rooftop_broadcast_repair.choices.some(
        (c) => c.next === 'rooftop_explore_mode' && !(c.effects ?? []).length,
      ),
    ).toBe(true);
    expect(
      STORY_NODES.pier_evening_explore_mode.choices.some(
        (c) => c.next === 'quest_act4_street_samizdat_pier',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.chk_explore_mode.choices.some((c) => c.next === 'quest_act4_street_samizdat_chk'),
    ).toBe(true);
    expect(
      STORY_NODES.library_explore_mode.choices.some(
        (c) => c.next === 'quest_act4_street_samizdat_library',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.rooftop_explore_mode.choices.some(
        (c) => c.next === 'quest_act4_rooftop_broadcast_repair',
      ),
    ).toBe(true);
  });

  it('resistance safehouse + defector rescue are multi-beat Act 6 cases', () => {
    for (const id of ['resistance_safehouse', 'resistance_defector_rescue'] as const) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === id);
      expect(quest, id).toBeTruthy();
      expect(quest!.objectives.length, id).toBeGreaterThanOrEqual(5);
      for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
        expect(STORY_NODES[nodeId], nodeId).toBeTruthy();
      }
    }
    expect(STORY_NODES.resistance_safehouse_start.choices[0]?.next).toBe(
      'resistance_safehouse_filters',
    );
    expect(
      (STORY_NODES.resistance_safehouse_done.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'resistance_safehouse_done',
      ),
    ).toBe(true);
    expect(STORY_NODES.resistance_defector_rescue_start.choices[0]?.next).toBe(
      'resistance_defector_tunnel',
    );
    expect(STORY_NODES.resistance_defector_poem_stun).toBeTruthy();
    expect(
      (STORY_NODES.resistance_defector_rescued.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'resistance_defector_rescue_done',
      ),
    ).toBe(true);
  });

  it('resistance_defector_rescue leave + mid-resume splits tunnel→stun→extract', () => {
    expect(
      STORY_NODES.resistance_defector_rescue_start.choices.some((c) => c.next === 'bunker_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.resistance_defector_tunnel.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    expect(
      STORY_NODES.resistance_defector_poem_stun.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    expect(
      STORY_NODES.resistance_defector_extract.choices.some(
        (c) =>
          c.next === 'street_bench_view'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'resistance_defector_rescue_done',
          ),
      ),
    ).toBe(true);

    const hub = STORY_NODES.resistance_bunker_hub;
    const poem = hub.choices.find((c) => c.next === 'resistance_defector_poem_stun');
    expect(poem?.condition?.flag).toBe('resistance_defector_tunnel');
    expect(poem?.condition?.missingFlag).toBe('resistance_defector_poem_stun');
    const extract = hub.choices.find((c) => c.next === 'resistance_defector_extract');
    expect(extract?.condition?.flag).toBe('resistance_defector_poem_stun');
    expect(extract?.condition?.missingFlag).toBe('resistance_defector_rescue_done');

    const bunker = STORY_NODES.bunker_explore_mode;
    expect(bunker.choices.some((c) => c.next === 'resistance_defector_rescue_start')).toBe(true);
    expect(bunker.choices.some((c) => c.next === 'resistance_defector_poem_stun')).toBe(true);
    expect(bunker.choices.some((c) => c.next === 'resistance_defector_extract')).toBe(true);

    const street = STORY_NODES.street_bench_view;
    expect(street.choices.some((c) => c.next === 'resistance_defector_poem_stun')).toBe(true);
    expect(street.choices.some((c) => c.next === 'resistance_defector_extract')).toBe(true);

    expect(TRIGGER_ZONES.find((z) => z.id === 'bunker_defector_rescue_start')?.linkedStoryNodeId).toBe(
      'resistance_defector_rescue_start',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_defector_poem_stun')?.hiddenWhenFlag).toBe(
      'resistance_defector_poem_stun',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_defector_extract')?.linkedStoryNodeId).toBe(
      'resistance_defector_extract',
    );
  });

  it('quest_act7 poets monument spans plate → recall → carve → inscribe', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'quest_act7_poets_monument_inscription');
    expect(quest).toBeTruthy();
    expect(quest!.objectives.length).toBeGreaterThanOrEqual(5);
    expect(STORY_NODES.quest_act7_poets_monument_inscription_start.choices[0]?.next).toBe(
      'quest_act7_poets_monument_plate',
    );
    expect(STORY_NODES.quest_act7_poets_monument_plate.choices[0]?.next).toBe(
      'quest_act7_poets_monument_recall',
    );
    expect(STORY_NODES.quest_act7_poets_monument_recall.choices[0]?.next).toBe(
      'quest_act7_poets_monument_carve',
    );
    expect(STORY_NODES.quest_act7_poets_monument_carve.choices[0]?.next).toBe(
      'quest_act7_poets_monument_inscribe',
    );
  });

  it('act6_secret_archive wires never-set decode/save/seal flags across 5 beats', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'act6_secret_archive');
    expect(quest).toBeTruthy();
    expect(quest!.objectives.length).toBeGreaterThanOrEqual(5);
    expect(quest!.linkedStoryNodeId).toBe('act6_secret_archive_start');
    for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
      expect(STORY_NODES[nodeId], nodeId).toBeTruthy();
    }
    expect(
      (STORY_NODES.act6_secret_archive_door.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act6_secret_archive_opened',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.act6_secret_archive_decode.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act6_secret_archive_decoded',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.act6_secret_archive_extract.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act6_secret_archive_saved',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.act6_secret_archive_seal.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act6_secret_archive_sealed',
      ),
    ).toBe(true);
    expect(STORY_NODES.act6_secret_archive_approach.choices.some((c) => c.next === 'act6_secret_archive_door')).toBe(
      true,
    );
  });

  it('act6_secret_archive mid-resume splits hatch→door→decode→extract→seal on hub/zones', () => {
    const factory = STORY_NODES.factory_explore_mode;
    const approach = factory.choices.find((c) => c.next === 'act6_secret_archive_approach');
    expect(approach?.condition?.missingFlag).toBe('act6_secret_archive_active');
    const door = factory.choices.find((c) => c.next === 'act6_secret_archive_door');
    expect(door?.condition?.flag).toBe('act6_secret_archive_active');
    expect(door?.condition?.missingFlag).toBe('act6_secret_archive_opened');
    const decode = factory.choices.find((c) => c.next === 'act6_secret_archive_decode');
    expect(decode?.condition?.flag).toBe('act6_secret_archive_opened');
    expect(decode?.condition?.missingFlag).toBe('act6_secret_archive_decoded');
    const extract = factory.choices.find((c) => c.next === 'act6_secret_archive_extract');
    expect(extract?.condition?.flag).toBe('act6_secret_archive_decoded');
    expect(extract?.condition?.missingFlag).toBe('act6_secret_archive_saved');
    const seal = factory.choices.find((c) => c.next === 'act6_secret_archive_seal');
    expect(seal?.condition?.flag).toBe('act6_secret_archive_saved');
    expect(seal?.condition?.missingFlag).toBe('act6_secret_archive_sealed');
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_secret_archive_hatch')?.hiddenWhenFlag).toBe(
      'act6_secret_archive_active',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_secret_archive_door')?.linkedStoryNodeId).toBe(
      'act6_secret_archive_door',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_secret_archive_seal')?.hiddenWhenFlag).toBe(
      'act6_secret_archive_sealed',
    );
    expect(
      STORY_NODES.act6_secret_archive_door.choices.some(
        (c) => c.next === 'act6_secret_archive_decode' && c.condition?.flag === 'act6_secret_archive_opened',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.act6_secret_archive_decode.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
  });

  it('bank_transfer wires never-set trace/culprit/moral flags', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'bank_transfer');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('bank_transfer_approach');
    for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
      expect(STORY_NODES[nodeId], nodeId).toBeTruthy();
    }
    expect(
      (STORY_NODES.bank_transfer_trace.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'traced_bank_transfer',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.bank_transfer_culprit.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'identified_bank_culprit',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.bank_transfer_moral.choices.every((c) =>
        (c.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'bank_moral_choice_made'),
      ),
    ).toBe(true);
  });

  it('digital_ghost wires never-set traces/firewall/fragment flags', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'digital_ghost');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('digital_ghost_approach');
    expect(
      (STORY_NODES.digital_ghost_traces.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'detected_ai_traces',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.digital_ghost_firewall.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'firewall_bypassed',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.digital_ghost_recover.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'ai_fragment_recovered',
      ),
    ).toBe(true);
  });

  it('banking_crash / voice / night / poem / factory mid-flags are settable', () => {
    expect(
      (STORY_NODES.banking_crash_verify.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'banking_system_recovered',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.voice_of_the_past_listen_1.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'listened_recording_1',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.voice_of_the_past_listen_final.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'listened_recording_final',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.night_watch_child.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'found_lost_child',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.night_watch_friend.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'met_old_friend_night',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.poem_undercover_extract.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'extracted_network_intel',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.voices_of_factory_protect.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'dmitry_factory_protect',
      ),
    ).toBe(true);
  });

  it('zarema/office/cafe hubs offer bank/AI/undercover mid-resume', () => {
    const zarema = STORY_NODES.zarema_room_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const cafe = STORY_NODES.cafe_explore_mode;
    const home = STORY_NODES.home_evening_explore_mode;
    expect(zarema.choices.some((c) => c.next === 'bank_transfer_trace')).toBe(true);
    expect(office.choices.some((c) => c.next === 'bank_transfer_culprit')).toBe(true);
    expect(home.choices.some((c) => c.next === 'bank_transfer_moral')).toBe(true);
    expect(office.choices.some((c) => c.next === 'digital_ghost_traces')).toBe(true);
    expect(office.choices.some((c) => c.next === 'digital_ghost_firewall')).toBe(true);
    expect(office.choices.some((c) => c.next === 'digital_ghost_recover')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'poem_undercover_infiltrate')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'poem_undercover_identify')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'poem_undercover_extract')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'office_bank_culprit_terminal')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'home_bank_moral_choice')).toBe(true);
    expect(
      STORY_NODES.bank_transfer_moral.choices.every((c) => c.next === 'home_evening_explore_mode'),
    ).toBe(true);
  });

  it('old_code sets found_living_code + decoded_poetic_code for secrets quest', () => {
    expect(
      (STORY_NODES.old_code.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'found_living_code',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.old_code.choices[1]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'found_living_code',
      ),
    ).toBe(true);
    expect(STORY_NODES.old_code.choices[1]?.next).toBe('cafe_explore_mode');
    expect(STORY_NODES.old_code.choices[2]?.next).toBe('cafe_explore_mode');
    expect(
      STORY_NODES.old_code.choices.some(
        (c) =>
          c.next === 'old_code_read'
          && c.condition?.flag === 'found_living_code'
          && c.condition?.missingFlag === 'decoded_poetic_code',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.old_code_read.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'decoded_poetic_code',
      ),
    ).toBe(true);
    expect(STORY_NODES.old_code_read.choices.some((c) => c.next === 'cafe_explore_mode')).toBe(true);
  });

  it('secrets_of_old_code cafe mid-resume splits find→decode on hub/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'secrets_of_old_code');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('old_code');
    expect(quest!.linkedStoryNodeIds).toEqual(expect.arrayContaining(['old_code', 'old_code_read']));
    const cafe = STORY_NODES.cafe_explore_mode;
    const find = cafe.choices.find((c) => c.next === 'old_code');
    expect(find?.condition?.flag).toBe('cafe_safehouse_established');
    expect(find?.condition?.missingFlag).toBe('found_living_code');
    const decode = cafe.choices.find((c) => c.next === 'old_code_read');
    expect(decode?.condition?.flag).toBe('found_living_code');
    expect(decode?.condition?.missingFlag).toBe('decoded_poetic_code');
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_old_code_terminal')?.linkedStoryNodeId).toBe(
      'old_code',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_old_code_terminal')?.hiddenWhenFlag).toBe(
      'found_living_code',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_old_code_decode')?.linkedStoryNodeId).toBe(
      'old_code_read',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_old_code_decode')?.hiddenWhenFlag).toBe(
      'decoded_poetic_code',
    );
  });

  it('openstack_crisis office terminal hides after solve', () => {
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_openstack_terminal')?.hiddenWhenFlag).toBe(
      'openstack_terminal_solved',
    );
  });

  it('roof_of_the_world wires never-set roof_ending_chosen', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'roof_of_the_world');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('roof_of_the_world_approach');
    for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
      expect(STORY_NODES[nodeId], nodeId).toBeTruthy();
    }
    expect(
      STORY_NODES.roof_of_the_world_ending.choices.every((c) =>
        (c.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'roof_ending_chosen'),
      ),
    ).toBe(true);
  });

  it('last_poem wires never-set poem_composed / final_poem_recited', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'last_poem');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('last_poem_approach');
    expect(
      (STORY_NODES.last_poem_compose.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'poem_composed',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.last_poem_recite.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'final_poem_recited',
      ),
    ).toBe(true);
  });

  it('blind_spot wires never-set mole_identified + mole_confronted', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'blind_spot');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('blind_spot_approach');
    for (const nodeId of quest!.linkedStoryNodeIds ?? []) {
      expect(STORY_NODES[nodeId], nodeId).toBeTruthy();
    }
    expect(
      (STORY_NODES.blind_spot_identify.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'mole_identified',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.blind_spot_confront.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'mole_confronted',
      ),
    ).toBe(true);
    expect(quest!.objectives.some((o) => o.id === 'confront_mole' && o.type === 'flag_set' && o.target === 'mole_confronted')).toBe(
      true,
    );
  });

  it('voices_of_factory mid-resume splits poem → protect', () => {
    const poem = STORY_NODES.voices_of_factory_poem;
    const protect = STORY_NODES.voices_of_factory_protect;
    expect(poem.choices.some((c) => c.next === 'voices_of_factory_protect' && c.condition?.missingFlag === 'read_factory_poem')).toBe(
      true,
    );
    expect(poem.choices.some((c) => c.next === 'voices_of_factory_protect' && c.condition?.flag === 'read_factory_poem')).toBe(
      true,
    );
    expect(
      (protect.choices[0]?.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'dmitry_factory_protect'),
    ).toBe(true);
    const basement = STORY_NODES.basement_explore_mode;
    const poemChoice = basement.choices.find((c) => c.next === 'voices_of_factory_poem');
    expect(poemChoice?.condition?.missingFlag).toBe('read_factory_poem');
    const protectChoice = basement.choices.find((c) => c.next === 'voices_of_factory_protect');
    expect(protectChoice?.condition?.flag).toBe('read_factory_poem');
    expect(protectChoice?.condition?.missingFlag).toBe('dmitry_factory_protect');
    expect(TRIGGER_ZONES.find((z) => z.id === 'basement_zarya_poem_read')?.hiddenWhenFlag).toBe('read_factory_poem');
    expect(TRIGGER_ZONES.some((z) => z.id === 'basement_zarya_protect')).toBe(true);
  });

  it('archive_of_forgotten mid-resume splits meet → vault → save', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'archive_of_forgotten');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('archive_forgotten_approach');
    expect(
      (STORY_NODES.archive_forgotten_save.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'archive_poems_saved',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.archive_forgotten_meet.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'archive_of_forgotten_active',
      ),
    ).toBe(true);
    const library = STORY_NODES.library_explore_mode;
    const meet = library.choices.find((c) => c.next === 'archive_forgotten_meet');
    expect(meet?.condition?.missingFlag).toBe('archive_of_forgotten_active');
    const approach = library.choices.find((c) => c.next === 'archive_forgotten_approach');
    expect(approach?.condition?.flag).toBe('archive_of_forgotten_active');
    expect(approach?.condition?.missingFlag).toBe('archive_vault_accessed');
    const save = library.choices.find((c) => c.next === 'archive_forgotten_save');
    expect(save?.condition?.flag).toBe('archive_vault_accessed');
    expect(save?.condition?.missingFlag).toBe('archive_poems_saved');
    expect(
      STORY_NODES.archive_forgotten_approach.choices.some(
        (c) =>
          c.next === 'library_explore_mode'
          && c.condition?.flag === 'archive_of_forgotten_active'
          && c.condition?.missingFlag === 'archive_vault_accessed',
      ),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_solnysh_archive')?.linkedStoryNodeId).toBe(
      'archive_forgotten_meet',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_solnysh_archive')?.hiddenWhenFlag).toBe(
      'archive_of_forgotten_active',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_forgotten_vault')?.hiddenWhenFlag).toBe(
      'archive_vault_accessed',
    );
    expect(
      TRIGGER_ZONES.find((z) => z.id === 'library_forgotten_vault')?.effects?.some(
        (e) => e.type === 'setFlag' && e.flag === 'archive_vault_accessed',
      ),
    ).toBeFalsy();
    expect(TRIGGER_ZONES.some((z) => z.id === 'library_forgotten_mid_resume')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_forgotten_mid_resume')?.hiddenWhenFlag).toBe(
      'archive_vault_accessed',
    );
  });

  it('rooftop/cafe/library hubs offer Act 4 mid-resume for roof/poem/mole/archive', () => {
    const rooftop = STORY_NODES.rooftop_explore_mode;
    const cafe = STORY_NODES.cafe_explore_mode;
    const library = STORY_NODES.library_explore_mode;
    const roofApproach = rooftop.choices.find((c) => c.next === 'roof_of_the_world_approach');
    expect(roofApproach?.condition?.flag).toBe('rooftop_unlocked');
    expect(roofApproach?.condition?.missingFlag).toBe('confronted_alexander_roof');
    const roofEnding = rooftop.choices.find((c) => c.next === 'roof_of_the_world_ending');
    expect(roofEnding?.condition?.flag).toBe('confronted_alexander_roof');
    expect(roofEnding?.condition?.missingFlag).toBe('roof_ending_chosen');
    const compose = rooftop.choices.find((c) => c.next === 'last_poem_approach');
    expect(compose?.condition?.flag).toBe('all_poems_collected');
    expect(compose?.condition?.missingFlag).toBe('poem_composed');
    const recite = rooftop.choices.find((c) => c.next === 'last_poem_recite');
    expect(recite?.condition?.flag).toBe('poem_composed');
    expect(recite?.condition?.missingFlag).toBe('final_poem_recited');
    expect(cafe.choices.some((c) => c.next === 'blind_spot_approach')).toBe(true);
    expect(library.choices.some((c) => c.next === 'archive_forgotten_meet')).toBe(true);
    expect(library.choices.some((c) => c.next === 'archive_forgotten_approach')).toBe(true);
    expect(library.choices.some((c) => c.next === 'archive_forgotten_save')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'rooftop_alexander_ending')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'rooftop_last_poem_recite')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_poetry_reading')?.hiddenWhenFlag).toBe(
      'infiltrated_poetry_reading',
    );
    expect(TRIGGER_ZONES.some((z) => z.id === 'cafe_poetry_identify')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'cafe_poetry_extract')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_recordings')?.hiddenWhenFlag).toBe(
      'listened_recording_1',
    );
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_recordings_2')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_recordings_final')).toBe(true);
  });

  it('banking_crash bash zones hide after solve; verify mid-resume stays', () => {
    expect(TRIGGER_ZONES.find((z) => z.id === 'home_banking_laptop')?.hiddenWhenFlag).toBe(
      'bash_terminal_solved',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_bash_terminal')?.hiddenWhenFlag).toBe(
      'bash_terminal_solved',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'home_banking_verify')?.linkedStoryNodeId).toBe(
      'banking_crash_verify',
    );
    const home = STORY_NODES.home_evening_explore_mode;
    const verify = home.choices.find((c) => c.next === 'banking_crash_verify');
    expect(verify?.condition?.flag).toBe('bash_terminal_solved');
    expect(verify?.condition?.missingFlag).toBe('banking_system_recovered');
  });

  it('night_watch street_winter hub entry nodes cover child→friend mid-resume', () => {
    const winter = STORY_NODES.street_winter_explore_mode;
    const child = winter.choices.find((c) => c.next === 'night_watch_child');
    expect(child?.condition?.flag).toBe('spotted_mugger_alley');
    expect(child?.condition?.missingFlag).toBe('found_lost_child');
    const friend = winter.choices.find((c) => c.next === 'night_watch_friend');
    expect(friend?.condition?.flag).toBe('found_lost_child');
    expect(friend?.condition?.missingFlag).toBe('met_old_friend_night');
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_winter_lost_child')?.linkedStoryNodeId).toBe(
      'night_watch_child',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_winter_old_friend')?.linkedStoryNodeId).toBe(
      'night_watch_friend',
    );
  });

  it('voice_of_the_past mid-resume splits listen 1→2→final on factory hub/zones', () => {
    const factory = STORY_NODES.factory_explore_mode;
    const listen1 = factory.choices.find((c) => c.next === 'voice_of_the_past_listen_1');
    expect(listen1?.condition?.flag).toBe('found_vladimir_recordings');
    expect(listen1?.condition?.missingFlag).toBe('listened_recording_1');
    const listen2 = factory.choices.find((c) => c.next === 'voice_of_the_past_listen_2');
    expect(listen2?.condition?.flag).toBe('listened_recording_1');
    expect(listen2?.condition?.missingFlag).toBe('listened_recording_2');
    const listenFinal = factory.choices.find((c) => c.next === 'voice_of_the_past_listen_final');
    expect(listenFinal?.condition?.flag).toBe('listened_recording_2');
    expect(listenFinal?.condition?.missingFlag).toBe('listened_recording_final');
    expect(
      STORY_NODES.voice_of_the_past_listen_1.choices.some(
        (c) => c.next === 'voice_of_the_past_listen_2' && c.condition?.missingFlag === 'listened_recording_1',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.voice_of_the_past_listen_2.choices.some(
        (c) => c.next === 'voice_of_the_past_listen_final' && c.condition?.flag === 'listened_recording_2',
      ),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_recordings_2')?.linkedStoryNodeId).toBe(
      'voice_of_the_past_listen_2',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_recordings_final')?.hiddenWhenFlag).toBe(
      'listened_recording_final',
    );
  });

  it('poem_undercover mid-resume splits infiltrate→identify→extract', () => {
    const cafe = STORY_NODES.cafe_explore_mode;
    const infiltrate = cafe.choices.find((c) => c.next === 'poem_undercover_infiltrate');
    expect(infiltrate?.condition?.flag).toBe('spotted_network_reading');
    expect(infiltrate?.condition?.missingFlag).toBe('infiltrated_poetry_reading');
    const identify = cafe.choices.find((c) => c.next === 'poem_undercover_identify');
    expect(identify?.condition?.flag).toBe('infiltrated_poetry_reading');
    expect(identify?.condition?.missingFlag).toBe('identified_network_agents');
    const extract = cafe.choices.find((c) => c.next === 'poem_undercover_extract');
    expect(extract?.condition?.flag).toBe('identified_network_agents');
    expect(extract?.condition?.missingFlag).toBe('extracted_network_intel');
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_poetry_identify')?.linkedStoryNodeId).toBe(
      'poem_undercover_identify',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_poetry_extract')?.hiddenWhenFlag).toBe(
      'extracted_network_intel',
    );
    expect(
      STORY_NODES.poem_undercover_infiltrate.choices.some(
        (c) => c.next === 'poem_undercover_identify' && c.condition?.flag === 'infiltrated_poetry_reading',
      ),
    ).toBe(true);
  });

  it('office hub/zone offers blind_spot confront mid-resume', () => {
    const office = STORY_NODES.office_explore_mode;
    const confront = office.choices.find((c) => c.next === 'blind_spot_confront');
    expect(confront?.condition?.flag).toBe('mole_identified');
    expect(confront?.condition?.missingFlag).toBe('mole_confronted');
    expect(TRIGGER_ZONES.some((z) => z.id === 'office_blind_spot_confront')).toBe(true);
    expect(
      STORY_NODES.blind_spot_approach.choices.some(
        (c) => c.next === 'blind_spot_confront' && c.condition?.flag === 'mole_identified',
      ),
    ).toBe(true);
  });

  it('park_explore_mode offers Act 7 monument start + mid-resume', () => {
    const hub = STORY_NODES.park_explore_mode;
    expect(hub).toBeTruthy();
    const nexts = new Set(hub.choices.map((c) => c.next).filter(Boolean));
    expect(nexts.has('quest_act7_poets_monument_inscription_start')).toBe(true);
    expect(nexts.has('quest_act7_poets_monument_plate')).toBe(true);
    expect(nexts.has('quest_act7_poets_monument_recall')).toBe(true);
    expect(nexts.has('quest_act7_poets_monument_carve')).toBe(true);
    expect(nexts.has('quest_act7_poets_monument_inscribe')).toBe(true);
    expect(nexts.has('epilogue_monument_start')).toBe(true);
    expect(nexts.has('epilogue_monument_done')).toBe(true);
    const monumentStart = hub.choices.find((c) => c.next === 'epilogue_monument_start');
    expect(monumentStart?.condition?.flag).toBe('volodka_legacy_complete');
    expect(monumentStart?.condition?.missingFlag).toBe('epilogue_monument_started');
    const monumentMid = hub.choices.find((c) => c.next === 'epilogue_monument_done');
    expect(monumentMid?.condition?.flag).toBe('epilogue_monument_started');
    expect(monumentMid?.condition?.missingFlag).toBe('epilogue_monument_done');
    const recall = hub.choices.find((c) => c.next === 'quest_act7_poets_monument_recall');
    expect(recall?.condition?.flag).toBe('quest_act7_poets_monument_plate_cleared');
    expect(recall?.condition?.missingFlag).toBe('quest_act7_poets_monument_names_recalled');
    const carve = hub.choices.find((c) => c.next === 'quest_act7_poets_monument_carve');
    expect(carve?.condition?.flag).toBe('quest_act7_poets_monument_names_recalled');
    expect(carve?.condition?.missingFlag).toBe('quest_act7_poets_monument_carved');
    const inscribe = hub.choices.find((c) => c.next === 'quest_act7_poets_monument_inscribe');
    expect(inscribe?.condition?.flag).toBe('quest_act7_poets_monument_carved');
    expect(inscribe?.condition?.missingFlag).toBe('quest_act7_poets_monument_inscription_done');
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_poets_monument_mid_recall')?.linkedStoryNodeId).toBe(
      'quest_act7_poets_monument_recall',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_poets_monument_mid_carve')?.linkedStoryNodeId).toBe(
      'quest_act7_poets_monument_carve',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_poets_monument_mid_inscribe')?.hiddenWhenFlag).toBe(
      'quest_act7_poets_monument_inscription_done',
    );
  });

  it('epilogue_letters / epilogue_monument mid-resume leave + hub/zone split', () => {
    expect(
      STORY_NODES.epilogue_letters_start.choices.some((c) => c.next === 'explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.epilogue_letters_done.choices.some((c) => c.next === 'explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.epilogue_monument_start.choices.some((c) => c.next === 'park_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.epilogue_monument_done.choices.some((c) => c.next === 'park_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.epilogue_letters_done.choices.every((c) => c.next !== 'epilogue_hub'),
    ).toBe(true);
    expect(
      STORY_NODES.epilogue_monument_done.choices.every((c) => c.next !== 'epilogue_hub'),
    ).toBe(true);
    expect(
      (STORY_NODES.epilogue_letters_start.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'epilogue_letters_started',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.epilogue_monument_start.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'epilogue_monument_started',
      ),
    ).toBe(true);
    const room = STORY_NODES.explore_mode;
    const lettersStart = room.choices.find((c) => c.next === 'epilogue_letters_start');
    expect(lettersStart?.condition?.flag).toBe('volodka_legacy_complete');
    expect(lettersStart?.condition?.missingFlag).toBe('epilogue_letters_started');
    const lettersMid = room.choices.find((c) => c.next === 'epilogue_letters_done');
    expect(lettersMid?.condition?.flag).toBe('epilogue_letters_started');
    expect(lettersMid?.condition?.missingFlag).toBe('epilogue_letters_done');
    const hub = STORY_NODES.epilogue_hub;
    expect(hub.choices.find((c) => c.next === 'epilogue_letters_start')?.condition?.missingFlag).toBe(
      'epilogue_letters_started',
    );
    expect(hub.choices.find((c) => c.next === 'epilogue_letters_done')?.condition?.flag).toBe(
      'epilogue_letters_started',
    );
    expect(hub.choices.find((c) => c.next === 'epilogue_monument_start')?.condition?.missingFlag).toBe(
      'epilogue_monument_started',
    );
    expect(hub.choices.find((c) => c.next === 'epilogue_monument_done')?.condition?.flag).toBe(
      'epilogue_monument_started',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'room_epilogue_letters')?.hiddenWhenFlag).toBe(
      'epilogue_letters_started',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'room_epilogue_letters_mid')?.linkedStoryNodeId).toBe(
      'epilogue_letters_done',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_epilogue_monument')?.hiddenWhenFlag).toBe(
      'epilogue_monument_started',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_epilogue_monument_mid')?.linkedStoryNodeId).toBe(
      'epilogue_monument_done',
    );
    const lettersQuest = QUEST_DEFINITIONS.find((q) => q.id === 'epilogue_letters');
    expect(lettersQuest?.linkedStoryNodeIds).toEqual(
      expect.arrayContaining(['epilogue_letters_start', 'epilogue_letters_done']),
    );
    const monumentQuest = QUEST_DEFINITIONS.find((q) => q.id === 'epilogue_monument');
    expect(monumentQuest?.linkedStoryNodeIds).toEqual(
      expect.arrayContaining(['epilogue_monument_start', 'epilogue_monument_done']),
    );
    expect(
      EXPANDED_DIALOGUE_NODES.street_poet_greeting.choices.some(
        (c) => c.next === 'epilogue_monument_start',
      ),
    ).toBe(true);
    expect(
      EXPANDED_DIALOGUE_NODES.street_poet_return.choices.some(
        (c) => c.next === 'epilogue_monument_done',
      ),
    ).toBe(true);
  });

  it('volodka_legacy mid-resume splits goodbye→final_walk→maria_future on hubs/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'volodka_legacy');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'act7_legacy_walk',
        'act7_goodbye_zarema',
        'act7_final_walk',
        'act7_maria_future',
      ]),
    );
    expect(
      STORY_NODES.act7_legacy_walk.choices.some((c) => c.next === 'explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_goodbye_zarema.choices.some((c) => c.next === 'home_evening_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_final_walk.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_maria_future.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    const trueEnd = STORY_NODES.act7_true_end;
    expect(trueEnd.choices.some((c) => c.next === 'explore_mode')).toBe(true);
    expect(trueEnd.choices.some((c) => c.next === 'epilogue_hub')).toBe(true);
    expect(trueEnd.choices.some((c) => c.next === 'start')).toBe(true);
    expect(trueEnd.choices.every((c) => c.next !== null)).toBe(true);
    const room = STORY_NODES.explore_mode;
    const walk = room.choices.find((c) => c.next === 'act7_legacy_walk');
    expect(walk?.condition?.flag).toBe('final_poem_published');
    expect(walk?.condition?.missingFlag).toBe('act7_legacy_walk_done');
    const home = STORY_NODES.home_evening_explore_mode;
    const goodbye = home.choices.find((c) => c.next === 'act7_goodbye_zarema');
    expect(goodbye?.condition?.flag).toBe('act7_legacy_walk_done');
    expect(goodbye?.condition?.missingFlag).toBe('act7_goodbye_zarema_done');
    const street = STORY_NODES.street_bench_view;
    const finalWalk = street.choices.find((c) => c.next === 'act7_final_walk');
    expect(finalWalk?.condition?.flag).toBe('act7_goodbye_zarema_done');
    expect(finalWalk?.condition?.missingFlag).toBe('act7_final_walk_done');
    const future = street.choices.find((c) => c.next === 'act7_maria_future');
    expect(future?.condition?.flag).toBe('act7_final_walk_done');
    expect(future?.condition?.missingFlag).toBe('volodka_future_chosen');
    expect(
      (STORY_NODES.act7_legacy_walk.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act7_legacy_walk_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.act7_goodbye_zarema.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act7_goodbye_zarema_done',
      ),
    ).toBe(true);
    expect(
      (STORY_NODES.act7_final_walk.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act7_final_walk_done',
      ),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'room_act7_legacy_walk')?.hiddenWhenFlag).toBe(
      'act7_legacy_walk_done',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'home_act7_goodbye_zarema')?.linkedStoryNodeId).toBe(
      'act7_goodbye_zarema',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_act7_final_walk')?.requiredFlag).toBe(
      'act7_goodbye_zarema_done',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_act7_maria_future')?.hiddenWhenFlag).toBe(
      'volodka_future_chosen',
    );
  });

  it('park_explore_mode gates Act 3 spine + cyber bloom mid-resume', () => {
    const hub = STORY_NODES.park_explore_mode;
    const warn = hub.choices.find((c) => c.next === 'act3_zarema_warning');
    expect(warn?.condition?.missingFlag).toBe('zarema_arrested');
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_start')).toBe(true);
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_alpha')).toBe(true);
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_beta')).toBe(true);
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_gamma')).toBe(true);
    expect(
      STORY_NODES.quest_act3_park_cyber_bloom_alpha.choices.some((c) => c.next === 'park_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act3_park_cyber_bloom_beta.choices.some((c) => c.next === 'park_explore_mode'),
    ).toBe(true);
    const office = STORY_NODES.office_explore_mode;
    expect(office.choices.some((c) => c.next === 'act3_detention_infiltration')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act3_zarema_cell')).toBe(true);
    const rescue = QUEST_DEFINITIONS.find((q) => q.id === 'zarema_rescue');
    expect(rescue?.linkedStoryNodeIds).toContain('act3_detention_infiltration');
    expect(rescue?.linkedStoryNodeIds).toContain('act3_zarema_cell');
  });

  it('Act 3 zarema evidence run leave on secure + library/basement hub mid-resume', () => {
    expect(
      STORY_NODES.quest_act3_zarema_evidence_secure.choices.some(
        (c) =>
          c.next === 'library_basement_explore_mode'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'quest_act3_zarema_evidence_run_done',
          ),
      ),
    ).toBe(true);
    const library = STORY_NODES.library_explore_mode;
    const basement = STORY_NODES.library_basement_explore_mode;
    const start = library.choices.find((c) => c.next === 'quest_act3_zarema_evidence_run_start');
    expect(start?.condition?.requiredAct).toBe(3);
    expect(start?.condition?.missingFlag).toBe('quest_act3_zarema_evidence_run_active');
    const resumeFromLibrary = library.choices.find(
      (c) => c.next === 'quest_act3_zarema_evidence_secure',
    );
    expect(resumeFromLibrary?.condition?.flag).toBe('quest_act3_zarema_evidence_run_active');
    expect(resumeFromLibrary?.condition?.missingFlag).toBe('quest_act3_zarema_evidence_run_done');
    expect(
      (resumeFromLibrary?.effects ?? []).some(
        (e) => e.type === 'transitionScene' && e.sceneId === 'library_basement',
      ),
    ).toBe(true);
    const resumeFromBasement = basement.choices.find(
      (c) => c.next === 'quest_act3_zarema_evidence_secure',
    );
    expect(resumeFromBasement?.condition?.flag).toBe('quest_act3_zarema_evidence_run_active');
    expect(resumeFromBasement?.condition?.missingFlag).toBe('quest_act3_zarema_evidence_run_done');
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_zarema_evidence_start')?.linkedStoryNodeId).toBe(
      'quest_act3_zarema_evidence_run_start',
    );
    expect(
      TRIGGER_ZONES.find((z) => z.id === 'library_basement_zarema_evidence_secure')?.hiddenWhenFlag,
    ).toBe('quest_act3_zarema_evidence_run_done');
  });

  it('factory_explore_mode offers vault_defense mid-resume after rally', () => {
    const factory = STORY_NODES.factory_explore_mode;
    const siege = factory.choices.find((c) => c.next === 'act3_vault_siege');
    expect(siege?.condition?.flag).toBe('rally_defenders_met');
    expect(siege?.condition?.missingFlag).toBe('vault_defense_held');
    const hide = factory.choices.find((c) => c.next === 'act3_hide_network');
    expect(hide?.condition?.flag).toBe('vault_defense_held');
    expect(hide?.condition?.missingFlag).toBe('network_hidden');
    const vault = QUEST_DEFINITIONS.find((q) => q.id === 'vault_defense');
    expect(vault?.linkedStoryNodeIds).toContain('act3_vault_siege');
    expect(vault?.linkedStoryNodeIds).toContain('act3_hide_network');
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_act3_vault_siege')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_act3_hide_network')).toBe(true);
  });

  it('cafe/factory/room hubs offer maria_truth mid-resume', () => {
    const cafe = STORY_NODES.cafe_explore_mode;
    const factory = STORY_NODES.factory_explore_mode;
    const room = STORY_NODES.explore_mode;
    const mystery = cafe.choices.find((c) => c.next === 'act3_maria_mystery');
    expect(mystery?.condition?.flag).toBe('maria_truth_started');
    expect(mystery?.condition?.missingFlag).toBe('found_maria_records');
    const cafeReveal = cafe.choices.find((c) => c.next === 'act3_maria_revelation');
    expect(cafeReveal?.condition?.flag).toBe('found_maria_records');
    expect(cafeReveal?.condition?.missingFlag).toBe('maria_truth_revealed');
    const factoryReveal = factory.choices.find((c) => c.next === 'act3_maria_revelation');
    expect(factoryReveal?.condition?.flag).toBe('found_maria_records');
    expect(factoryReveal?.condition?.missingFlag).toBe('maria_truth_revealed');
    const roomMystery = room.choices.find((c) => c.next === 'act3_maria_mystery');
    expect(roomMystery?.condition?.flag).toBe('maria_truth_started');
    expect(roomMystery?.condition?.missingFlag).toBe('found_maria_records');
    const maria = QUEST_DEFINITIONS.find((q) => q.id === 'maria_truth');
    expect(maria?.linkedStoryNodeIds).toContain('act3_maria_mystery');
    expect(maria?.linkedStoryNodeIds).toContain('act3_maria_revelation');
    expect(maria?.linkedStoryNodeIds).toContain('act3_maria_truth_accepted');
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_act3_maria_revelation')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'cafe_act3_maria_mystery')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'cafe_act3_maria_revelation')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'room_act3_maria_mystery')).toBe(true);
    const mysteryNode = STORY_NODES.act3_maria_mystery;
    expect(
      (mysteryNode.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'maria_truth_started',
      ),
    ).toBe(true);
  });

  it('machine_confession links confession scene + sets mid-beat flags', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'machine_confession');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('machine_confession_scene');
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'machine_confession_approach',
        'machine_confession_scene',
        'machine_confession_scene_familiar',
        'machine_confession_scene_thread',
      ]),
    );
    expect(STORY_NODES.machine_confession_scene).toBeTruthy();
    expect(STORY_NODES.machine_confession_approach).toBeTruthy();
    expect(
      (STORY_NODES.machine_confession_scene.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'heard_machine_confession',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.machine_confession_scene.choices.some(
        (c) =>
          c.next === 'basement_explore_mode'
          && !(c.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'machine_fate_decided'),
      ),
    ).toBe(true);
    expect(
      STORY_NODES.machine_confession_approach.choices.some(
        (c) => c.next === 'machine_confession_scene_thread' && c.condition?.flag === 'thread_18_complete',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.machine_confession_approach.choices.some(
        (c) => c.next === 'machine_confession_scene' && c.condition?.missingFlag === 'machine_fate_decided',
      ),
    ).toBe(true);
    const hub = STORY_NODES.basement_explore_mode;
    const confession = hub.choices.find((c) => c.next === 'machine_confession_scene');
    expect(confession?.condition?.flag).toBe('zarya_confession_requested');
    expect(confession?.condition?.missingFlag).toBe('machine_fate_decided');
  });

  it('CHK/albert/office hubs resume portwine + guitar mid-beats', () => {
    const albert = STORY_NODES.albert_backroom_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const chk = STORY_NODES.chk_explore_mode;
    const camp = STORY_NODES.chk_campfire_night_explore_mode;
    expect(albert.choices.some((c) => c.next === 'chk_portwine_albert_ask')).toBe(true);
    expect(albert.choices.some((c) => c.next === 'chk_portwine_pickup')).toBe(true);
    expect(office.choices.some((c) => c.next === 'chk_guitar_office_pickup')).toBe(true);
    expect(chk.choices.some((c) => c.next === 'chk_portwine_delivery_start')).toBe(true);
    expect(chk.choices.some((c) => c.next === 'chk_guitar_strings_start')).toBe(true);
    expect(camp.choices.some((c) => c.next === 'chk_portwine_toast')).toBe(true);
    expect(camp.choices.some((c) => c.next === 'chk_guitar_return_elis')).toBe(true);
  });

  it('Act 6 main spine hubs resume traitor → resistance → heist mid-beats', () => {
    const factory = STORY_NODES.factory_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const cafe = STORY_NODES.cafe_explore_mode;
    const street = STORY_NODES.street_bench_view;
    const bunker = STORY_NODES.resistance_bunker_hub;
    expect(factory.choices.some((c) => c.next === 'act6_traitor_approach')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_traitor_discovery')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_nadzor_revealed')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act6_office_confrontation')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act6_alliance_formed')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act6_dmitry_exiled')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act6_heist_execution')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'act6_data_heist_planning')).toBe(true);
    expect(street.choices.some((c) => c.next === 'act6_resistance_formed')).toBe(true);
    expect(street.choices.some((c) => c.next === 'act6_resistance_briefing')).toBe(true);
    expect(bunker.choices.some((c) => c.next === 'act6_resistance_formed')).toBe(true);
    expect(bunker.choices.some((c) => c.next === 'act6_data_heist_planning')).toBe(true);
    expect(
      STORY_NODES.act6_factory_investigation.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_traitor_discovery.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_traitor_revealed.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_investigation')?.linkedStoryNodeId).toBe(
      'act6_traitor_approach',
    );
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_act6_traitor_mid_resume')).toBe(true);
  });

  it('Act 6 office traitor mid-resume: leave on confrontation→confession→alliance/exile + zeka', () => {
    expect(
      STORY_NODES.act6_office_confrontation.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_dmitry_confession.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_alliance_formed.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_dmitry_exiled.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_zeka_encounter.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_zeka_story.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_zeka_trust_test.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_zeka_nadzor_origin.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    const confessionForgive = STORY_NODES.act6_dmitry_confession.choices.find(
      (c) => c.next === 'act6_alliance_formed',
    );
    expect(
      (confessionForgive?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act6_dmitry_judgment_pending',
      ),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_act6_confrontation')?.hiddenWhenFlag).toBe(
      'act6_dmitry_judgment_pending',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_act6_alliance')?.linkedStoryNodeId).toBe(
      'act6_alliance_formed',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_act6_exile_chip')?.linkedStoryNodeId).toBe(
      'act6_dmitry_exiled',
    );
  });

  it('data_heist mid-resume: leave on plan/hack/run/chip + zone split', () => {
    expect(
      STORY_NODES.act6_data_heist_planning.choices.some((c) => c.next === 'cafe_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_heist_execution.choices.some((c) => c.next === 'office_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_heist_success.choices.some((c) => c.next === 'corridor_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_escape_success.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    expect(STORY_NODES.office_explore_mode.choices.some((c) => c.next === 'act6_heist_success')).toBe(
      true,
    );
    expect(STORY_NODES.corridor_explore_mode.choices.some((c) => c.next === 'act6_heist_success')).toBe(
      true,
    );
    expect(STORY_NODES.street_bench_view.choices.some((c) => c.next === 'act6_escape_success')).toBe(
      true,
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_act6_heist_terminal')?.hiddenWhenFlag).toBe(
      'mainframe_hacked',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_act6_heist_escape')?.linkedStoryNodeId).toBe(
      'act6_heist_success',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_basement_act6_heist')?.hiddenWhenFlag).toBe(
      'mainframe_hacked',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'street_act6_heist_chip')?.linkedStoryNodeId).toBe(
      'act6_escape_success',
    );
    expect(
      STORY_NODES.resistance_safehouse_filters.choices.some((c) => c.next === 'resistance_bunker_hub'),
    ).toBe(true);
    expect(
      STORY_NODES.resistance_safehouse_radio.choices.some((c) => c.next === 'resistance_bunker_hub'),
    ).toBe(true);
  });

  it('echo_of_vladimir mid-resume splits kate→room→unlock→read on hub/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'echo_of_vladimir');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('vladimir_secret_room');
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'echo_of_vladimir_approach',
        'echo_of_vladimir_kate',
        'vladimir_secret_room',
        'vladimir_secret_room_read',
      ]),
    );
    expect(STORY_NODES.echo_of_vladimir_approach).toBeTruthy();
    expect(STORY_NODES.echo_of_vladimir_kate).toBeTruthy();
    expect(STORY_NODES.vladimir_secret_room_read).toBeTruthy();
    expect(
      (STORY_NODES.vladimir_secret_room.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'echo_secret_room_reached',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.vladimir_secret_room.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);
    // FIX (v4.10.0): флаг final_poem_read перенесён из выбора «Закрыть тетрадь»
    // в visit-эффекты узла — сон больше не блокирует «Эхо Владимира», а тетрадь
    // остаётся доступной для повторного открытия (хуки активации «Мира Снов»).
    expect(
      (STORY_NODES.vladimir_secret_room_read.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'final_poem_read',
      ),
    ).toBe(true);
    const library = STORY_NODES.library_explore_mode;
    const kate = library.choices.find((c) => c.next === 'echo_of_vladimir_kate');
    expect(kate?.condition?.flag).toBe('vladimir_echo_started');
    expect(kate?.condition?.missingFlag).toBe('kate_echo_clue_given');
    const approach = library.choices.find((c) => c.next === 'echo_of_vladimir_approach');
    expect(approach?.condition?.flag).toBe('kate_echo_clue_given');
    expect(approach?.condition?.missingFlag).toBe('final_poem_read');
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_kate_echo')?.hiddenWhenFlag).toBe(
      'kate_echo_clue_given',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_vladimir_unlock')?.linkedMinigame).toBe(
      'poetry',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_vladimir_unlock')?.hiddenWhenFlag).toBe(
      'final_poem_unlocked',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_vladimir_read')?.linkedStoryNodeId).toBe(
      'vladimir_secret_room_read',
    );
    expect(TRIGGER_ZONES.some((z) => z.id === 'library_vladimir_mid_resume')).toBe(true);
  });

  it('night_before_dawn mid-resume splits albert→zarema→maria→dmitry on hubs/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'night_before_dawn');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('night_before_dawn_approach');
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'night_before_dawn_approach',
        'night_before_dawn_albert',
        'night_before_dawn_zarema',
        'night_before_dawn_maria',
        'night_before_dawn_dmitry',
      ]),
    );
    expect(quest!.objectives.find((o) => o.id === 'talk_albert_final')?.type).toBe('flag_set');
    expect(quest!.objectives.find((o) => o.id === 'talk_albert_final')?.target).toBe(
      'albert_final_confirmed',
    );
    expect(STORY_NODES.night_before_dawn_approach).toBeTruthy();
    expect(STORY_NODES.night_before_dawn_albert).toBeTruthy();
    expect(STORY_NODES.night_before_dawn_zarema).toBeTruthy();
    expect(STORY_NODES.night_before_dawn_maria).toBeTruthy();
    expect(STORY_NODES.night_before_dawn_dmitry).toBeTruthy();
    expect(
      STORY_NODES.night_before_dawn_albert.choices.some(
        (c) =>
          (c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'albert_final_confirmed',
          ),
      ),
    ).toBe(true);
    expect(
      STORY_NODES.night_before_dawn_approach.choices.some((c) => c.next === 'rooftop_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act5_dawn.choices.some((c) => c.next === 'night_before_dawn_approach'),
    ).toBe(true);
    const dawnNight = STORY_NODES.act5_dawn.choices.find((c) => c.next === 'night_before_dawn_approach');
    expect(dawnNight?.condition?.flag).toBe('final_code_completed');
    expect(dawnNight?.condition?.missingFlag).toBe('all_allies_confirmed');
    expect(
      (STORY_NODES.act5_dawn.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'night_before_dawn_started',
      ),
    ).toBe(false);
    expect(
      (STORY_NODES.act5_dawn.effects ?? []).some(
        (e) => e.type === 'triggerQuest' && e.questId === 'night_before_dawn',
      ),
    ).toBe(false);
    const albert = STORY_NODES.albert_backroom_explore_mode;
    const zarema = STORY_NODES.zarema_room_explore_mode;
    const cafe = STORY_NODES.cafe_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const roof = STORY_NODES.rooftop_explore_mode;
    const albertChoice = albert.choices.find((c) => c.next === 'night_before_dawn_albert');
    expect(albertChoice?.condition?.flag).toBe('night_before_dawn_started');
    expect(albertChoice?.condition?.missingFlag).toBe('albert_final_confirmed');
    const zaremaChoice = zarema.choices.find((c) => c.next === 'night_before_dawn_zarema');
    expect(zaremaChoice?.condition?.flag).toBe('night_before_dawn_started');
    expect(zaremaChoice?.condition?.missingFlag).toBe('zarema_final_confirmed');
    const mariaChoice = cafe.choices.find((c) => c.next === 'night_before_dawn_maria');
    expect(mariaChoice?.condition?.flag).toBe('night_before_dawn_started');
    expect(mariaChoice?.condition?.missingFlag).toBe('maria_final_confirmed');
    const dmitryChoice = office.choices.find((c) => c.next === 'night_before_dawn_dmitry');
    expect(dmitryChoice?.condition?.flag).toBe('night_before_dawn_started');
    expect(dmitryChoice?.condition?.missingFlag).toBe('dmitry_final_confirmed');
    const approach = roof.choices.find((c) => c.next === 'night_before_dawn_approach');
    expect(approach?.condition?.flag).toBe('final_code_completed');
    expect(approach?.condition?.missingFlag).toBe('all_allies_confirmed');
    expect(TRIGGER_ZONES.some((z) => z.id === 'rooftop_night_before_dawn_mid_resume')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_night_before_dawn_maria')?.linkedStoryNodeId).toBe(
      'night_before_dawn_maria',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_night_before_dawn_dmitry')?.hiddenWhenFlag).toBe(
      'dmitry_final_confirmed',
    );
  });

  it('final_code mid-resume splits rally→virus→core→deploy on hubs/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'final_code');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeId).toBe('final_code_approach');
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'final_code_approach',
        'final_code_rally',
        'final_code_virus',
        'final_code_core',
        'final_code_deploy',
      ]),
    );
    expect(quest!.objectives.find((o) => o.id === 'rally_allies')?.type).toBe('flag_set');
    expect(quest!.objectives.find((o) => o.id === 'rally_allies')?.target).toBe(
      'final_code_allies_rallied',
    );
    expect(quest!.objectives.find((o) => o.id === 'reach_core')?.type).toBe('flag_set');
    expect(quest!.objectives.find((o) => o.id === 'reach_core')?.target).toBe(
      'final_code_core_reached',
    );
    expect(STORY_NODES.final_code_approach).toBeTruthy();
    expect(STORY_NODES.final_code_rally).toBeTruthy();
    expect(STORY_NODES.final_code_virus).toBeTruthy();
    expect(STORY_NODES.final_code_core).toBeTruthy();
    expect(STORY_NODES.final_code_deploy).toBeTruthy();
    expect(
      STORY_NODES.final_code_rally.choices.some(
        (c) =>
          (c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'final_code_allies_rallied',
          ),
      ),
    ).toBe(true);
    expect(
      STORY_NODES.final_code_core.choices.some(
        (c) =>
          (c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'final_code_core_reached',
          ),
      ),
    ).toBe(true);
    expect(
      STORY_NODES.final_code_deploy.choices.some(
        (c) =>
          (c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'freedom_virus_deployed',
          ) &&
          (c.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'survived_shutdown'),
      ),
    ).toBe(true);
    expect(
      STORY_NODES.final_code_approach.choices.some((c) => c.next === 'rooftop_explore_mode'),
    ).toBe(true);
    expect(STORY_NODES.act5_dawn.choices.some((c) => c.next === 'final_code_approach')).toBe(true);
    expect(
      (STORY_NODES.act5_dawn.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'final_code_started',
      ),
    ).toBe(true);
    const albert = STORY_NODES.albert_backroom_explore_mode;
    const cafe = STORY_NODES.cafe_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const roof = STORY_NODES.rooftop_explore_mode;
    const rally = albert.choices.find((c) => c.next === 'final_code_rally');
    expect(rally?.condition?.flag).toBe('final_code_started');
    expect(rally?.condition?.missingFlag).toBe('final_code_allies_rallied');
    const virus = cafe.choices.find((c) => c.next === 'final_code_virus');
    expect(virus?.condition?.flag).toBe('final_code_allies_rallied');
    expect(virus?.condition?.missingFlag).toBe('freedom_virus_written');
    const core = office.choices.find((c) => c.next === 'final_code_core');
    expect(core?.condition?.flag).toBe('freedom_virus_written');
    expect(core?.condition?.missingFlag).toBe('final_code_core_reached');
    const deploy = office.choices.find((c) => c.next === 'final_code_deploy');
    expect(deploy?.condition?.flag).toBe('final_code_core_reached');
    expect(deploy?.condition?.missingFlag).toBe('freedom_virus_deployed');
    const approach = roof.choices.find((c) => c.next === 'final_code_approach');
    expect(approach?.condition?.flag).toBe('final_code_started');
    expect(approach?.condition?.missingFlag).toBe('final_code_completed');
    expect(TRIGGER_ZONES.some((z) => z.id === 'rooftop_final_code_mid_resume')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_final_code_virus')?.linkedMinigame).toBe(
      'openstack_terminal',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_final_code_virus')?.hiddenWhenFlag).toBe(
      'freedom_virus_written',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'office_final_code_deploy')?.linkedStoryNodeId).toBe(
      'final_code_deploy',
    );
  });

  it('quest_act5_factory_zarya_memory_restore mid-resume splits fragment 1→2→3 on hubs/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'quest_act5_factory_zarya_memory_restore');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'quest_act5_factory_zarya_memory_restore_start',
        'quest_act5_zarya_fragment_1',
        'quest_act5_zarya_fragment_2',
        'quest_act5_zarya_fragment_3',
      ]),
    );
    expect(
      STORY_NODES.quest_act5_zarya_fragment_1.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act5_zarya_fragment_2.choices.some((c) => c.next === 'basement_explore_mode'),
    ).toBe(true);
    const factory = STORY_NODES.factory_explore_mode;
    const basement = STORY_NODES.basement_explore_mode;
    const start = factory.choices.find((c) => c.next === 'quest_act5_factory_zarya_memory_restore_start');
    expect(start?.condition?.missingFlag).toBe('quest_act5_factory_zarya_memory_restore_active');
    const frag1 = factory.choices.find((c) => c.next === 'quest_act5_zarya_fragment_1');
    expect(frag1?.condition?.flag).toBe('quest_act5_factory_zarya_memory_restore_active');
    expect(frag1?.condition?.missingFlag).toBe('zarya_memory_fragment_1_done');
    const frag2 = basement.choices.find((c) => c.next === 'quest_act5_zarya_fragment_2');
    expect(frag2?.condition?.flag).toBe('zarya_memory_fragment_1_done');
    expect(frag2?.condition?.missingFlag).toBe('zarya_memory_fragment_2_done');
    const frag3 = factory.choices.find((c) => c.next === 'quest_act5_zarya_fragment_3');
    expect(frag3?.condition?.flag).toBe('zarya_memory_fragment_2_done');
    expect(frag3?.condition?.missingFlag).toBe('zarya_memory_fragment_3_done');
    expect(TRIGGER_ZONES.some((z) => z.id === 'factory_zarya_fragment_1')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'basement_zarya_fragment_2')?.linkedStoryNodeId).toBe(
      'quest_act5_zarya_fragment_2',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_zarya_fragment_3')?.hiddenWhenFlag).toBe(
      'zarya_memory_fragment_3_done',
    );
  });

  it('quest_act5_bunker_code_poem_break mid-resume splits key→break on hubs/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'quest_act5_bunker_code_poem_break');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'quest_act5_bunker_code_poem_break_start',
        'quest_act5_bunker_poem_key',
        'quest_act5_bunker_code_break',
      ]),
    );
    expect(
      STORY_NODES.quest_act5_bunker_poem_key.choices.some((c) => c.next === 'basement_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act5_bunker_code_break.choices.some(
        (c) =>
          c.next === 'bunker_explore_mode'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'quest_act5_bunker_code_poem_break_done',
          ),
      ),
    ).toBe(true);
    const bunker = STORY_NODES.bunker_explore_mode;
    const resistance = STORY_NODES.resistance_bunker_hub;
    const basement = STORY_NODES.basement_explore_mode;
    const start = bunker.choices.find((c) => c.next === 'quest_act5_bunker_code_poem_break_start');
    expect(start?.condition?.missingFlag).toBe('quest_act5_bunker_code_poem_break_active');
    const hubStart = resistance.choices.find((c) => c.next === 'quest_act5_bunker_code_poem_break_start');
    expect(hubStart?.condition?.missingFlag).toBe('quest_act5_bunker_code_poem_break_active');
    const key = basement.choices.find((c) => c.next === 'quest_act5_bunker_poem_key');
    expect(key?.condition?.flag).toBe('quest_act5_bunker_code_poem_break_active');
    expect(key?.condition?.missingFlag).toBe('bunker_poem_key_found');
    const brk = bunker.choices.find((c) => c.next === 'quest_act5_bunker_code_break');
    expect(brk?.condition?.flag).toBe('bunker_poem_key_found');
    expect(brk?.condition?.missingFlag).toBe('quest_act5_bunker_code_poem_break_done');
    expect(TRIGGER_ZONES.some((z) => z.id === 'bunker_code_poem_break_start')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'basement_bunker_poem_key')?.linkedStoryNodeId).toBe(
      'quest_act5_bunker_poem_key',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'bunker_code_poem_break')?.hiddenWhenFlag).toBe(
      'quest_act5_bunker_code_poem_break_done',
    );
  });

  it('quest_act6_defector_rescue_expanded mid-resume splits infiltrate→cell→sewers on hubs/zones', () => {
    const quest = QUEST_DEFINITIONS.find((q) => q.id === 'quest_act6_defector_rescue_expanded');
    expect(quest).toBeTruthy();
    expect(quest!.linkedStoryNodeIds).toEqual(
      expect.arrayContaining([
        'quest_act6_defector_rescue_expanded_start',
        'quest_act6_defector_infiltrate',
        'quest_act6_defector_free_cell',
        'quest_act6_defector_escape_sewers',
      ]),
    );
    expect(
      STORY_NODES.quest_act6_defector_infiltrate.choices.some((c) => c.next === 'bunker_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act6_defector_free_cell.choices.some((c) => c.next === 'bunker_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.quest_act6_defector_escape_sewers.choices.some(
        (c) =>
          c.next === 'bunker_explore_mode'
          && !(c.effects ?? []).some(
            (e) => e.type === 'setFlag' && e.flag === 'quest_act6_defector_rescue_expanded_done',
          ),
      ),
    ).toBe(true);
    const bunker = STORY_NODES.bunker_explore_mode;
    const resistance = STORY_NODES.resistance_bunker_hub;
    const start = bunker.choices.find((c) => c.next === 'quest_act6_defector_rescue_expanded_start');
    expect(start?.condition?.flag).toBe('resistance_defector_rescue_done');
    expect(start?.condition?.missingFlag).toBe('quest_act6_defector_rescue_expanded_active');
    const hubStart = resistance.choices.find(
      (c) => c.next === 'quest_act6_defector_rescue_expanded_start',
    );
    expect(hubStart?.condition?.missingFlag).toBe('quest_act6_defector_rescue_expanded_active');
    const infil = bunker.choices.find((c) => c.next === 'quest_act6_defector_infiltrate');
    expect(infil?.condition?.flag).toBe('quest_act6_defector_rescue_expanded_active');
    expect(infil?.condition?.missingFlag).toBe('defector_infiltrate_done');
    const cell = bunker.choices.find((c) => c.next === 'quest_act6_defector_free_cell');
    expect(cell?.condition?.flag).toBe('defector_infiltrate_done');
    expect(cell?.condition?.missingFlag).toBe('defector_freed_from_cell');
    const sewers = bunker.choices.find((c) => c.next === 'quest_act6_defector_escape_sewers');
    expect(sewers?.condition?.flag).toBe('defector_freed_from_cell');
    expect(sewers?.condition?.missingFlag).toBe('quest_act6_defector_rescue_expanded_done');
    expect(resistance.choices.some((c) => c.next === 'quest_act6_defector_infiltrate')).toBe(true);
    expect(resistance.choices.some((c) => c.next === 'quest_act6_defector_free_cell')).toBe(true);
    expect(resistance.choices.some((c) => c.next === 'quest_act6_defector_escape_sewers')).toBe(true);
    expect(TRIGGER_ZONES.some((z) => z.id === 'bunker_defector_rescue_expanded_start')).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'bunker_defector_infiltrate')?.linkedStoryNodeId).toBe(
      'quest_act6_defector_infiltrate',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'bunker_defector_free_cell')?.hiddenWhenFlag).toBe(
      'defector_freed_from_cell',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'bunker_defector_escape_sewers')?.requiredFlag).toBe(
      'defector_freed_from_cell',
    );
  });

  it('Act 6 infiltration/rooftop hubs resume core → showdown → final mid-beats', () => {
    const factory = STORY_NODES.factory_explore_mode;
    const roof = STORY_NODES.factory_roof_explore_mode;
    expect(factory.choices.some((c) => c.next === 'act6_infiltration_prep')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_nadzor_battle')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_battle_victory')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_core_choice')).toBe(true);
    const prep = factory.choices.find((c) => c.next === 'act6_infiltration_prep');
    expect(prep?.condition?.missingFlag).toBe('act6_nadzor_battle_open');
    const battle = factory.choices.find((c) => c.next === 'act6_nadzor_battle');
    expect(battle?.condition?.flag).toBe('act6_nadzor_battle_open');
    expect(battle?.condition?.missingFlag).toBe('act6_nadzor_battle_resolved');
    expect(roof.choices.some((c) => c.next === 'act6_rooftop_showdown')).toBe(true);
    expect(roof.choices.some((c) => c.next === 'act6_final_confrontation')).toBe(true);
    const rooftopQuest = QUEST_DEFINITIONS.find((q) => q.id === 'rooftop_confrontation');
    expect(rooftopQuest?.linkedStoryNodeIds).toContain('act6_final_confrontation');
  });

  it('system_infiltration mid-resume: leave on nadzor→prep→core→showdown + registry', () => {
    expect(
      STORY_NODES.act6_nadzor_revealed.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_infiltration_prep.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_nadzor_battle.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_core_choice.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_rooftop_showdown.choices.some((c) => c.next === 'factory_roof_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_final_confrontation.choices.some(
        (c) => c.next === 'factory_roof_explore_mode',
      ),
    ).toBe(true);
    expect(
      STORY_NODES.act6_resistance_formed.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    expect(
      STORY_NODES.act6_resistance_briefing.choices.some((c) => c.next === 'street_bench_view'),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_nadzor_core')?.hiddenWhenFlag).toBe(
      'nadzor_truth_revealed',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_infiltration_prep')?.requiredFlag).toBe(
      'nadzor_truth_revealed',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_infiltration_prep')?.hiddenWhenFlag).toBe(
      'act6_nadzor_battle_open',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_nadzor_battle')?.linkedStoryNodeId).toBe(
      'act6_nadzor_battle',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act6_core_choice')?.linkedStoryNodeId).toBe(
      'act6_core_choice',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_roof_act6_showdown')?.hiddenWhenFlag).toBe(
      'rooftop_entity_met',
    );
  });

  it('Act 7 hubs resume guild → archive → shutdown → poem → legacy mid-beats', () => {
    const cafe = STORY_NODES.cafe_explore_mode;
    const library = STORY_NODES.library_explore_mode;
    const factory = STORY_NODES.factory_explore_mode;
    const park = STORY_NODES.park_explore_mode;
    const rooftop = STORY_NODES.rooftop_explore_mode;
    const room = STORY_NODES.explore_mode;
    const home = STORY_NODES.home_evening_explore_mode;
    const street = STORY_NODES.street_bench_view;
    expect(cafe.choices.some((c) => c.next === 'act7_guild_rebuilding')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'act7_charter_drafting')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'act7_community_voice')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'act7_guild_restored')).toBe(true);
    expect(library.choices.some((c) => c.next === 'act7_library_archive')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act7_system_shutdown')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act7_core_battle')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act7_nadzor_dies')).toBe(true);
    expect(park.choices.some((c) => c.next === 'act7_final_poem_creation')).toBe(true);
    expect(park.choices.some((c) => c.next === 'act7_poem_written')).toBe(true);
    expect(rooftop.choices.some((c) => c.next === 'act7_rooftop_recital')).toBe(true);
    expect(rooftop.choices.some((c) => c.next === 'act7_poem_published')).toBe(true);
    expect(room.choices.some((c) => c.next === 'act7_legacy_walk')).toBe(true);
    expect(home.choices.some((c) => c.next === 'act7_goodbye_zarema')).toBe(true);
    expect(street.choices.some((c) => c.next === 'act7_final_walk')).toBe(true);
    expect(street.choices.some((c) => c.next === 'act7_maria_future')).toBe(true);
    for (const id of [
      'rebuild_the_guild',
      'system_takedown',
      'final_poem',
      'volodka_legacy',
    ] as const) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === id);
      expect(quest?.linkedStoryNodeIds?.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('rebuild_the_guild mid-resume splits charter→community→archive on hubs/zones', () => {
    expect(
      STORY_NODES.act7_guild_rebuilding.choices.some((c) => c.next === 'cafe_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_charter_drafting.choices.some((c) => c.next === 'cafe_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_library_archive.choices.some((c) => c.next === 'library_explore_mode'),
    ).toBe(true);
    expect(
      (STORY_NODES.act7_guild_rebuilding.choices[0]?.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'act7_guild_charter_path',
      ),
    ).toBe(true);
    const cafe = STORY_NODES.cafe_explore_mode;
    const rebuild = cafe.choices.find((c) => c.next === 'act7_guild_rebuilding');
    expect(rebuild?.condition?.missingFlag).toBe('act7_guild_rebuild_started');
    const charter = cafe.choices.find((c) => c.next === 'act7_charter_drafting');
    expect(charter?.condition?.flag).toBe('act7_guild_charter_path');
    expect(charter?.condition?.missingFlag).toBe('new_council_elected');
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_act7_guild_rebuild')?.hiddenWhenFlag).toBe(
      'act7_guild_rebuild_started',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_act7_charter_draft')?.linkedStoryNodeId).toBe(
      'act7_charter_drafting',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'library_act7_archive')?.hiddenWhenFlag).toBe(
      'guild_restored',
    );
  });

  it('system_takedown mid-resume splits shutdown→core→dies on hubs/zones', () => {
    expect(
      STORY_NODES.act7_system_shutdown.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_core_battle.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_nadzor_dies.choices.some((c) => c.next === 'factory_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_guild_restored.choices.some((c) => c.next === 'cafe_explore_mode'),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act7_system_shutdown')?.hiddenWhenFlag).toBe(
      'path_to_core_cleared',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act7_core_battle')?.linkedStoryNodeId).toBe(
      'act7_core_battle',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'factory_act7_nadzor_dies')?.hiddenWhenFlag).toBe(
      'nadzor_destroyed',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'cafe_act7_strike_team')?.linkedStoryNodeId).toBe(
      'act7_guild_restored',
    );
  });

  it('final_poem mid-resume splits creation→written→recital→published on hubs/zones', () => {
    expect(
      STORY_NODES.act7_final_poem_creation.choices.some((c) => c.next === 'park_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_poem_written.choices.some((c) => c.next === 'park_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_rooftop_recital.choices.some((c) => c.next === 'rooftop_explore_mode'),
    ).toBe(true);
    expect(
      STORY_NODES.act7_poem_published.choices.some((c) => c.next === 'rooftop_explore_mode'),
    ).toBe(true);
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_act7_final_poem')?.hiddenWhenFlag).toBe(
      'journey_reflected',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'park_act7_poem_written')?.linkedStoryNodeId).toBe(
      'act7_poem_written',
    );
    expect(TRIGGER_ZONES.find((z) => z.id === 'rooftop_act7_poem_published')?.hiddenWhenFlag).toBe(
      'act7_legacy_walk_done',
    );
  });

  it('system_takedown / final_poem objectives match story flags (no orphan minigames)', () => {
    const takedown = QUEST_DEFINITIONS.find((q) => q.id === 'system_takedown');
    const execute = takedown?.objectives.find((o) => o.id === 'execute_shutdown');
    const witness = takedown?.objectives.find((o) => o.id === 'witness_system_death');
    expect(execute?.type).toBe('flag_set');
    expect(execute?.target).toBe('nadzor_shutdown_complete');
    expect(witness?.type).toBe('flag_set');
    expect(witness?.target).toBe('nadzor_destroyed');
    const poem = QUEST_DEFINITIONS.find((q) => q.id === 'final_poem');
    const compose = poem?.objectives.find((o) => o.id === 'compose_masterpiece');
    expect(compose?.type).toBe('flag_set');
    expect(compose?.target).toBe('final_poem_written');
  });

  it('pier/library hubs resume Act 2–5 side mid-beats (fishing, strings, archive, Katya)', () => {
    const pier = STORY_NODES.pier_evening_explore_mode;
    const library = STORY_NODES.library_explore_mode;
    const basement = STORY_NODES.library_basement_explore_mode;
    const chk = STORY_NODES.chk_explore_mode;
    const office = STORY_NODES.office_explore_mode;
    const camp = STORY_NODES.chk_campfire_night_explore_mode;
    expect(pier.choices.some((c) => c.next === 'pier_midnight_fishing_start')).toBe(true);
    expect(pier.choices.some((c) => c.next === 'pier_midnight_fishing_bass')).toBe(true);
    expect(pier.choices.some((c) => c.next === 'pier_ritka_strings_start')).toBe(true);
    expect(pier.choices.some((c) => c.next === 'pier_ritka_strings_delivered')).toBe(true);
    expect(library.choices.some((c) => c.next === 'library_lost_archive_start')).toBe(true);
    expect(library.choices.some((c) => c.next === 'library_archive_descent')).toBe(true);
    expect(library.choices.some((c) => c.next === 'library_katya_research_start')).toBe(true);
    expect(library.choices.some((c) => c.next === 'library_katya_crossref')).toBe(true);
    expect(basement.choices.some((c) => c.next === 'library_archive_gate')).toBe(true);
    expect(basement.choices.some((c) => c.next === 'library_lost_archive_found')).toBe(true);
    expect(basement.choices.some((c) => c.next === 'library_archive_digitize')).toBe(true);
    expect(basement.choices.some((c) => c.next === 'library_marat_echo')).toBe(true);
    expect(chk.choices.some((c) => c.next === 'pier_ritka_elis_ask')).toBe(true);
    expect(office.choices.some((c) => c.next === 'pier_ritka_office_string')).toBe(true);
    expect(camp.choices.some((c) => c.next === 'pier_ritka_elis_pack')).toBe(true);
  });

  it('Act 6 main quests expose linkedStoryNodeIds for mid-chain resume', () => {
    for (const id of [
      'traitor_in_the_guild',
      'underground_resistance',
      'data_heist',
      'system_infiltration',
      'rooftop_confrontation',
    ] as const) {
      const quest = QUEST_DEFINITIONS.find((q) => q.id === id);
      expect(quest, id).toBeTruthy();
      expect(quest!.linkedStoryNodeIds?.length, id).toBeGreaterThanOrEqual(2);
    }
  });

  it('resistance briefing sets defector + network flags before data_heist', () => {
    const briefing = STORY_NODES.act6_resistance_briefing;
    const golden = briefing.choices.find((c) => c.goldenPath);
    expect(golden).toBeTruthy();
    expect(
      (golden!.effects ?? []).some((e) => e.type === 'setFlag' && e.flag === 'three_defectors_recruited'),
    ).toBe(true);
    expect(
      (golden!.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'resistance_network_established',
      ),
    ).toBe(true);
  });
});

describe('Albert portwine dialogue resume', () => {
  it('greeting/return offer «777» ask + pickup mid-beats', async () => {
    const { DIALOGUE_PART1 } = await import('@/data/dialogue/part1-albert');
    for (const nodeId of ['albert_greeting', 'albert_return'] as const) {
      const node = DIALOGUE_PART1[nodeId];
      expect(node, nodeId).toBeTruthy();
      expect(
        node.choices.some(
          (c) =>
            c.condition?.flag === 'chk_portwine_active' &&
            c.condition?.missingFlag === 'chk_portwine_albert_asked',
        ),
        `${nodeId} ask`,
      ).toBe(true);
      expect(
        node.choices.some(
          (c) =>
            c.condition?.flag === 'chk_portwine_albert_asked' &&
            c.condition?.missingFlag === 'chk_portwine_carried',
        ),
        `${nodeId} pickup`,
      ).toBe(true);
    }
  });
});

describe('Maxim/Anya resistance dialogue resume hooks', () => {
  it('greeting/return wire safehouse + defector mid-beats like Baba Zina tea', async () => {
    const { EXPANDED_DIALOGUE_NODES } = await import('@/data/expandedDialogueNodes');
    for (const nodeId of [
      'maxim_greeting',
      'maxim_return',
      'anya_greeting',
      'anya_return',
    ] as const) {
      const node = EXPANDED_DIALOGUE_NODES[nodeId];
      expect(node, nodeId).toBeTruthy();
      const nexts = new Set(node.choices.map((c) => c.next).filter(Boolean));
      expect(nexts.has('resistance_safehouse_filters'), `${nodeId} filters`).toBe(true);
      expect(nexts.has('resistance_defector_rescue_start'), `${nodeId} defector start`).toBe(true);
      expect(nexts.has('resistance_defector_poem_stun'), `${nodeId} poem stun`).toBe(true);
      expect(nexts.has('resistance_defector_extract'), `${nodeId} extract`).toBe(true);
    }
    const maximGreet = EXPANDED_DIALOGUE_NODES.maxim_greeting;
    expect(
      maximGreet.choices.some(
        (c) =>
          c.next === 'resistance_safehouse_start' &&
          (c.effects ?? []).some((e) => e.type === 'triggerQuest' && e.questId === 'resistance_safehouse'),
      ),
    ).toBe(true);
    expect(
      maximGreet.choices.some(
        (c) =>
          c.next === 'resistance_defector_brief' &&
          c.condition?.flag === 'traitor_discovered' &&
          c.condition?.missingFlag === 'resistance_defector_rescue_active',
      ),
    ).toBe(true);
    expect(
      maximGreet.choices.some(
        (c) =>
          c.next === 'quest_act6_defector_rescue_expanded_start' &&
          c.condition?.flag === 'resistance_defector_rescue_done' &&
          c.condition?.missingFlag === 'quest_act6_defector_rescue_expanded_active',
      ),
    ).toBe(true);
    expect(
      maximGreet.choices.some(
        (c) =>
          c.next === 'quest_act6_defector_infiltrate' &&
          c.condition?.flag === 'quest_act6_defector_rescue_expanded_active',
      ),
    ).toBe(true);
    expect(
      maximGreet.choices.some(
        (c) =>
          c.next === 'quest_act6_defector_free_cell' &&
          c.condition?.flag === 'defector_infiltrate_done' &&
          c.condition?.missingFlag === 'defector_freed_from_cell',
      ),
    ).toBe(true);
    expect(
      maximGreet.choices.some(
        (c) =>
          c.next === 'quest_act6_defector_escape_sewers' &&
          c.condition?.flag === 'defector_freed_from_cell' &&
          c.condition?.missingFlag === 'quest_act6_defector_rescue_expanded_done',
      ),
    ).toBe(true);
    const anyaGreet = EXPANDED_DIALOGUE_NODES.anya_greeting;
    expect(
      anyaGreet.choices.some(
        (c) =>
          c.next === 'resistance_safehouse_start' &&
          (c.effects ?? []).some((e) => e.type === 'triggerQuest' && e.questId === 'resistance_safehouse'),
      ),
    ).toBe(true);
  });

  it('greeting/return wire Act 6 spine mid-resume (resistance → heist → nadzor)', async () => {
    const { EXPANDED_DIALOGUE_NODES } = await import('@/data/expandedDialogueNodes');
    for (const nodeId of ['maxim_greeting', 'maxim_return'] as const) {
      const nexts = new Set(EXPANDED_DIALOGUE_NODES[nodeId].choices.map((c) => c.next).filter(Boolean));
      expect(nexts.has('act6_resistance_formed'), `${nodeId} formed`).toBe(true);
      expect(nexts.has('act6_resistance_briefing'), `${nodeId} briefing`).toBe(true);
      expect(nexts.has('act6_data_heist_planning'), `${nodeId} heist plan`).toBe(true);
      expect(nexts.has('act6_rooftop_showdown'), `${nodeId} rooftop`).toBe(true);
      expect(nexts.has('act6_final_confrontation'), `${nodeId} final`).toBe(true);
    }
    for (const nodeId of ['zeka_greeting', 'zeka_return'] as const) {
      const nexts = new Set(EXPANDED_DIALOGUE_NODES[nodeId].choices.map((c) => c.next).filter(Boolean));
      expect(nexts.has('act6_data_heist_planning'), `${nodeId} heist`).toBe(true);
      expect(nexts.has('act6_nadzor_revealed'), `${nodeId} nadzor`).toBe(true);
      expect(nexts.has('act6_core_choice'), `${nodeId} core`).toBe(true);
      expect(nexts.has('act7_system_shutdown'), `${nodeId} shutdown`).toBe(true);
      expect(nexts.has('act7_core_battle'), `${nodeId} core battle`).toBe(true);
      expect(nexts.has('act7_nadzor_dies'), `${nodeId} dies`).toBe(true);
    }
    for (const nodeId of ['anya_greeting', 'anya_return'] as const) {
      const nexts = new Set(EXPANDED_DIALOGUE_NODES[nodeId].choices.map((c) => c.next).filter(Boolean));
      expect(nexts.has('act6_resistance_briefing'), `${nodeId} briefing`).toBe(true);
      expect(nexts.has('act6_data_heist_planning'), `${nodeId} heist`).toBe(true);
      expect(nexts.has('act7_guild_rebuilding'), `${nodeId} guild`).toBe(true);
      expect(nexts.has('act7_charter_drafting'), `${nodeId} charter`).toBe(true);
    }
  });
});

describe('Dmitry traitor confrontation dialogue resume', () => {
  it('greeting/return visit confrontation / alliance / exile mid-beats', async () => {
    const { DIALOGUE_PART1 } = await import('@/data/dialogue/part1-albert');
    const { DIALOGUE_PART2 } = await import('@/data/dialogue/part2-npcs');
    for (const [label, node] of [
      ['dmitry_greeting', DIALOGUE_PART1.dmitry_greeting],
      ['office_dmitry_return', DIALOGUE_PART2.office_dmitry_return],
    ] as const) {
      expect(
        node.choices.some(
          (c) =>
            c.condition?.flag === 'traitor_revealed' &&
            c.condition?.missingFlag === 'act6_dmitry_judgment_pending' &&
            (c.effects ?? []).some(
              (e) => e.type === 'visitStoryNode' && e.nodeId === 'act6_office_confrontation',
            ),
        ),
        `${label} confrontation`,
      ).toBe(true);
      expect(
        node.choices.some(
          (c) =>
            c.condition?.flag === 'dmitry_forgiven' &&
            c.condition?.missingFlag === 'traitor_fate_decided' &&
            (c.effects ?? []).some(
              (e) => e.type === 'visitStoryNode' && e.nodeId === 'act6_alliance_formed',
            ),
        ),
        `${label} alliance`,
      ).toBe(true);
      expect(
        node.choices.some(
          (c) =>
            c.condition?.flag === 'dmitry_exiled' &&
            c.condition?.missingFlag === 'traitor_fate_decided' &&
            (c.effects ?? []).some(
              (e) => e.type === 'visitStoryNode' && e.nodeId === 'act6_dmitry_exiled',
            ),
        ),
        `${label} exile`,
      ).toBe(true);
    }
  });
});
