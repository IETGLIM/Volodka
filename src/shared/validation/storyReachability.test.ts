import { describe, it, expect } from 'vitest';
import { computeStoryReachability } from './storyReachability';
import { buildStoryNodes } from '@/data/story/buildStoryNodes';

/**
 * P2-7 — story reachability CI gate.
 *
 * Gates:
 *  - broken refs (choices.next / visitStoryNode / zone / quest channels
 *    pointing at non-existent ids) must always be zero;
 *  - unreachable nodes (no delivery channel at all) must never GROW beyond
 *    the documented backlog below. New content must ship reachable, or
 *    wired through one of the delivery channels (hub entry, zone link,
 *    quest link, exploration dialogue, visitStoryNode).
 *
 * The unreachable `*_exp_*` nodes are expansion wave side-chains (act2:10,
 * act4:20, act5:20, act6:20, act7:19) authored as flag-sequenced hub meshes
 * whose entry choices were never wired into the act hubs. They are authored,
 * proofread content — the backlog is to wire them wave-by-wave, NOT to
 * delete. Tracked in worklog / narrative plan.
 *
 * Wave history: act3 (43 nodes) was wired in v4.50.0 via 20 one-time zones
 * in narrativeExpansionTriggerZones.ts — see the WAVE W1 block there.
 */
const KNOWN_UNREACHABLE: ReadonlySet<string> = new Set([
  // act2 expansion (10)
  'act2_exp_chk_basement_archive', 'act2_exp_chk_campfire', 'act2_exp_chk_elis_song',
  'act2_exp_colleague_warning', 'act2_exp_dmitry_guilt', 'act2_exp_office_old_terminal',
  'act2_exp_office_server_room', 'act2_exp_pier_dawn', 'act2_exp_pier_fishing_night',
  'act2_exp_pier_sunrise_poem',
  // act3 expansion — WIRED in v4.50.0 (W1 wave, 20 zones) — no longer in backlog
  // act4 expansion (20)
  'act4_exp_albert_last_stand', 'act4_exp_alexander_choice', 'act4_exp_barista_coffee_code',
  'act4_exp_cafe_closed', 'act4_exp_chk_defense_plan', 'act4_exp_chk_night_meeting',
  'act4_exp_city_square_poster', 'act4_exp_colleague_betrayal_hint',
  'act4_exp_factory_baba_zina_call', 'act4_exp_factory_glimpse',
  'act4_exp_peaceful_march_prep', 'act4_exp_quiet_zarema_night',
  'act4_exp_rooftop_antenna', 'act4_exp_rooftop_city_view', 'act4_exp_street_crowd',
  'act4_exp_street_neon_blackout', 'act4_exp_street_winter_walk',
  'act4_exp_victoria_last_words', 'act4_exp_victoria_sacrifice_prep',
  'act4_exp_zarema_deleted_files',
  // act5 expansion (20)
  'act5_exp_alexander_last_contact', 'act5_exp_bunker_anya_radio',
  'act5_exp_bunker_code_poem', 'act5_exp_bunker_escape_route',
  'act5_exp_bunker_first_night', 'act5_exp_bunker_library',
  'act5_exp_chk_based_strategy', 'act5_exp_chk_elis_underground_song',
  'act5_exp_chk_underground', 'act5_exp_factory_baba_zina_tea',
  'act5_exp_factory_machine_dream', 'act5_exp_factory_memory_fragment',
  'act5_exp_factory_welder_poem', 'act5_exp_factory_zarya_awakening',
  'act5_exp_factory_zarya_hum', 'act5_exp_solnysh_old_poet',
  'act5_exp_solnysh_refuge', 'act5_exp_street_empty',
  'act5_exp_victoria_guild_report', 'act5_exp_zhek_rooftop_watch',
  // act6 expansion (20)
  'act6_exp_alexander_defection', 'act6_exp_bunker_attack_prep',
  'act6_exp_bunker_comms_up', 'act6_exp_bunker_medical',
  'act6_exp_bunker_poetry_wall', 'act6_exp_bunker_traitor_reveal',
  'act6_exp_chk_based_speech', 'act6_exp_chk_last_campfire',
  'act6_exp_city_under_curfew', 'act6_exp_colleague_confession',
  'act6_exp_defector_rescue_night', 'act6_exp_factory_baba_zina_command',
  'act6_exp_factory_sabotage', 'act6_exp_factory_zarya_defense',
  'act6_exp_guild_headquarters_glimpse', 'act6_exp_resistance_cell_contact',
  'act6_exp_resistance_final_plan', 'act6_exp_street_smoke_signals',
  'act6_exp_victoria_underground_return', 'act6_exp_volodka_resolve',
  // act7 expansion (19)
  'act7_exp_albert_network_alive', 'act7_exp_alexander_atonement',
  'act7_exp_bunker_decommission', 'act7_exp_cafe_reopening',
  'act7_exp_chk_campfire_celebration', 'act7_exp_city_dawn_choice',
  'act7_exp_colleague_new_role', 'act7_exp_dawn_after_battle',
  'act7_exp_factory_zarya_singing', 'act7_exp_kate_revelation',
  'act7_exp_letters_received', 'act7_exp_library_archive_open',
  'act7_exp_library_reading_hall', 'act7_exp_park_monument_restored',
  'act7_exp_pier_final_view', 'act7_exp_room_home',
  'act7_exp_street_alive', 'act7_exp_victoria_new_beginning',
  'act7_exp_zarema_published',
]);

describe('story reachability (P2-7)', () => {
  const report = computeStoryReachability({ storyNodes: buildStoryNodes() });

  it('has no broken references in any delivery channel', () => {
    if (report.brokenRefs.length > 0) {
      const lines = report.brokenRefs
        .map(
          (b) =>
            `[${b.kind}] ${b.fromId} → "${b.target}" (channel ${b.channelId})`,
        )
        .join('\n');
      throw new Error(
        `${report.brokenRefs.length} broken story reference(s):\n${lines}`,
      );
    }
    expect(report.brokenRefs).toHaveLength(0);
  });

  it('does not introduce NEW unreachable story nodes', () => {
    const novel = report.unreachable.filter((id) => !KNOWN_UNREACHABLE.has(id));
    if (novel.length > 0) {
      throw new Error(
        `${novel.length} NEW unreachable story node(s) — wire them through a ` +
          `delivery channel (choice.next, visitStoryNode, hub entryNodeIds, ` +
          `zone linkedStoryNodeId, quest link, exploration dialogue):\n` +
          novel.join('\n'),
      );
    }
    expect(novel).toHaveLength(0);
  });

  it('keeps the documented expansion backlog shrinking (progress ratchet)', () => {
    const knownButReachable = [...KNOWN_UNREACHABLE].filter(
      (id) =>
        report.coreReachable.includes(id) || report.externalOnly.includes(id),
    );
    // Not a hard gate yet — logs progress of the wiring waves.
    if (knownButReachable.length > 0) {
      // eslint-disable-next-line no-console -- progress log is intentional here
      console.log(
        `[reachability] progress: ${knownButReachable.length} backlog node(s) ` +
          `became reachable — remove them from KNOWN_UNREACHABLE:\n` +
          knownButReachable.join('\n'),
      );
    }
    expect(report.totalStoryNodes).toBeGreaterThan(0);
  });

  it('reports audit summary (informational)', () => {
    // eslint-disable-next-line no-console
    console.log(
      [
        `[reachability] story nodes: ${report.totalStoryNodes}`,
        `core: ${report.coreReachable.length}`,
        `external-only (playable via hub/zone/quest/exploration channels): ${report.externalOnly.length}`,
        `unreachable total: ${report.unreachable.length}`,
        `documented backlog: ${KNOWN_UNREACHABLE.size}`,
        `external entries: ${report.externalEntries.length}`,
        `broken refs: ${report.brokenRefs.length}`,
      ].join('\n'),
    );
    expect(report.totalStoryNodes).toBeGreaterThan(0);
  });
});
