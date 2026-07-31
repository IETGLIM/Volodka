import { describe, expect, it } from 'vitest';
import { QUEST_DEFINITIONS } from '@/data/quests';
import { STORY_NODES } from '@/data/story';
import { TRIGGER_ZONES } from '@/data/triggerZones';

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
    expect(nexts.has('epilogue_monument_start')).toBe(true);
  });

  it('park_explore_mode gates Act 3 spine + cyber bloom mid-resume', () => {
    const hub = STORY_NODES.park_explore_mode;
    const warn = hub.choices.find((c) => c.next === 'act3_zarema_warning');
    expect(warn?.condition?.missingFlag).toBe('zarema_arrested');
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_start')).toBe(true);
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_alpha')).toBe(true);
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_beta')).toBe(true);
    expect(hub.choices.some((c) => c.next === 'quest_act3_park_cyber_bloom_gamma')).toBe(true);
    const office = STORY_NODES.office_explore_mode;
    expect(office.choices.some((c) => c.next === 'act3_detention_infiltration')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act3_zarema_cell')).toBe(true);
    const rescue = QUEST_DEFINITIONS.find((q) => q.id === 'zarema_rescue');
    expect(rescue?.linkedStoryNodeIds).toContain('act3_detention_infiltration');
    expect(rescue?.linkedStoryNodeIds).toContain('act3_zarema_cell');
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
    expect(quest!.linkedStoryNodeIds).toContain('machine_confession_scene');
    expect(STORY_NODES.machine_confession_scene).toBeTruthy();
    expect(
      (STORY_NODES.machine_confession_scene.effects ?? []).some(
        (e) => e.type === 'setFlag' && e.flag === 'heard_machine_confession',
      ),
    ).toBe(true);
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
    expect(factory.choices.some((c) => c.next === 'act6_factory_investigation')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_traitor_discovery')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_nadzor_revealed')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act6_office_confrontation')).toBe(true);
    expect(office.choices.some((c) => c.next === 'act6_heist_execution')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'act6_data_heist_planning')).toBe(true);
    expect(street.choices.some((c) => c.next === 'act6_resistance_formed')).toBe(true);
    expect(street.choices.some((c) => c.next === 'act6_resistance_briefing')).toBe(true);
    expect(bunker.choices.some((c) => c.next === 'act6_resistance_formed')).toBe(true);
    expect(bunker.choices.some((c) => c.next === 'act6_data_heist_planning')).toBe(true);
  });

  it('Act 6 infiltration/rooftop hubs resume core → showdown → final mid-beats', () => {
    const factory = STORY_NODES.factory_explore_mode;
    const roof = STORY_NODES.factory_roof_explore_mode;
    expect(factory.choices.some((c) => c.next === 'act6_infiltration_prep')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act6_core_choice')).toBe(true);
    expect(roof.choices.some((c) => c.next === 'act6_rooftop_showdown')).toBe(true);
    expect(roof.choices.some((c) => c.next === 'act6_final_confrontation')).toBe(true);
    const rooftopQuest = QUEST_DEFINITIONS.find((q) => q.id === 'rooftop_confrontation');
    expect(rooftopQuest?.linkedStoryNodeIds).toContain('act6_final_confrontation');
  });

  it('Act 7 hubs resume guild → archive → shutdown → poem → legacy mid-beats', () => {
    const cafe = STORY_NODES.cafe_explore_mode;
    const library = STORY_NODES.library_explore_mode;
    const factory = STORY_NODES.factory_explore_mode;
    const park = STORY_NODES.park_explore_mode;
    const rooftop = STORY_NODES.rooftop_explore_mode;
    const room = STORY_NODES.explore_mode;
    expect(cafe.choices.some((c) => c.next === 'act7_guild_rebuilding')).toBe(true);
    expect(cafe.choices.some((c) => c.next === 'act7_guild_restored')).toBe(true);
    expect(library.choices.some((c) => c.next === 'act7_library_archive')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act7_system_shutdown')).toBe(true);
    expect(factory.choices.some((c) => c.next === 'act7_core_battle')).toBe(true);
    expect(park.choices.some((c) => c.next === 'act7_final_poem_creation')).toBe(true);
    expect(park.choices.some((c) => c.next === 'act7_poem_written')).toBe(true);
    expect(rooftop.choices.some((c) => c.next === 'act7_rooftop_recital')).toBe(true);
    expect(room.choices.some((c) => c.next === 'act7_legacy_walk')).toBe(true);
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
          c.next === 'quest_act6_defector_infiltrate' &&
          c.condition?.flag === 'quest_act6_defector_rescue_expanded_active',
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
    }
    for (const nodeId of ['anya_greeting', 'anya_return'] as const) {
      const nexts = new Set(EXPANDED_DIALOGUE_NODES[nodeId].choices.map((c) => c.next).filter(Boolean));
      expect(nexts.has('act6_resistance_briefing'), `${nodeId} briefing`).toBe(true);
      expect(nexts.has('act6_data_heist_planning'), `${nodeId} heist`).toBe(true);
      expect(nexts.has('act7_guild_rebuilding'), `${nodeId} guild`).toBe(true);
    }
  });
});

describe('Dmitry traitor confrontation dialogue resume', () => {
  it('greeting/return visit act6_office_confrontation when traitor revealed', async () => {
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
            c.condition?.missingFlag === 'traitor_fate_decided' &&
            (c.effects ?? []).some(
              (e) => e.type === 'visitStoryNode' && e.nodeId === 'act6_office_confrontation',
            ),
        ),
        label,
      ).toBe(true);
    }
  });
});
