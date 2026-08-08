/* ─── Volodka RPG – per-scene dynamic (pushable) physics props ─── */

import type { SceneId } from '@/shared/types/game';

export type DynamicPropKind = 'can' | 'bottle' | 'box' | 'barrel';

export interface DynamicPropDef {
  id: string;
  kind: DynamicPropKind;
  /** Spawn position (y = resting height offset is added by the renderer) */
  position: [number, number, number];
  /** Initial Y rotation */
  rotation?: number;
}

/** Pushable clutter per scene — kicked around by the player (KCC impulses).
 *  Keep counts low (≤6 per scene): each prop is one dynamic rigid body. */
export const DYNAMIC_PROPS: Partial<Record<SceneId, DynamicPropDef[]>> = {
  volodka_room: [
    // Lived-in clutter on and around the desk — teaches the player that
    // objects are interactive and makes the room feel inhabited.
    { id: 'vr_can_1', kind: 'can', position: [0.6, 0, -2.1], rotation: 0.3 },
    { id: 'vr_can_2', kind: 'can', position: [-0.4, 0, -2.3], rotation: 1.7 },
    { id: 'vr_bottle_1', kind: 'bottle', position: [1.1, 0, -1.8], rotation: 0.8 },
    // WS18-B — +2 props for thin-coverage scene (was 3)
    { id: 'vr_box_1', kind: 'box', position: [-1.5, 0, -1.2], rotation: 0.5 },
    { id: 'vr_can_3', kind: 'can', position: [2.2, 0, 1.4], rotation: -0.9 },
  ],
  street_night: [
    { id: 'sn_can_1', kind: 'can', position: [2.4, 0, 3.6], rotation: 0.4 },
    { id: 'sn_can_2', kind: 'can', position: [-2.1, 0, -7.4], rotation: 1.2 },
    { id: 'sn_can_3', kind: 'can', position: [1.6, 0, 1.9], rotation: 2.1 },
    { id: 'sn_bottle_1', kind: 'bottle', position: [-3.8, 0, -0.9], rotation: 0.8 },
    { id: 'sn_box_1', kind: 'box', position: [3.4, 0, 0.6], rotation: 0.3 },
  ],
  abandoned_factory: [
    { id: 'af_box_1', kind: 'box', position: [-3.2, 0, -2.4], rotation: 0.5 },
    { id: 'af_box_2', kind: 'box', position: [2.8, 0, -4.6], rotation: 1.7 },
    { id: 'af_barrel_1', kind: 'barrel', position: [4.5, 0, 1.8], rotation: 0 },
    { id: 'af_can_1', kind: 'can', position: [-1.4, 0, 2.2], rotation: 2.6 },
    // WS26-B — +3 props for thin-coverage scene (was 4)
    { id: 'ws26_af_can_rustpool', kind: 'can', position: [-2.0, 0, 3.5], rotation: 1.2 },
    { id: 'ws26_af_barrel_dented', kind: 'barrel', position: [-4.5, 0, -3.5], rotation: 0.5 },
    { id: 'ws26_af_bottle_acid', kind: 'bottle', position: [1.5, 0, 3.0], rotation: -0.8 },
  ],
  park_day: [
    { id: 'pd_can_1', kind: 'can', position: [3.6, 0, -2.4], rotation: 1.1 },
    { id: 'pd_bottle_1', kind: 'bottle', position: [7.5, 0, 3.6], rotation: 0.2 },
    // AAA: kickable litter in the park — makes nature hub feel lived-in and tactile
    { id: 'pd_can_2', kind: 'can', position: [-2.8, 0, 4.1], rotation: 0.9 },
    { id: 'pd_bottle_2', kind: 'bottle', position: [5.2, 0, -5.8], rotation: -1.4 },
    { id: 'pd_box_park', kind: 'box', position: [-4.1, 0, 1.9], rotation: 0.4 },
  ],
  chk_forest_zorge: [
    { id: 'chk_bottle_1', kind: 'bottle', position: [2.6, 0, 2.2], rotation: 0.9 },
    { id: 'chk_bottle_2', kind: 'bottle', position: [-2.4, 0, 1.6], rotation: 2.3 },
    // AAA: forest campsite tactile props — cans + crate near fire for living CHK world
    { id: 'chk_can_camp', kind: 'can', position: [0.9, 0, -0.8], rotation: 1.3 },
    { id: 'chk_crate', kind: 'box', position: [-1.8, 0, 3.1], rotation: -0.7 },
  ],
  rooftop_edge: [
    { id: 're_can_1', kind: 'can', position: [-1.8, 0, 1.4], rotation: 0.6 },
    { id: 're_can_2', kind: 'can', position: [2.6, 0, 0.8], rotation: 1.9 },
    // AAA: skyline litter + industrial clutter — kickables on the edge for living rooftop feel
    { id: 're_bottle_edge', kind: 'bottle', position: [0.9, 0, -2.1], rotation: 0.8 },
    { id: 're_can_edge', kind: 'can', position: [-3.4, 0, 2.8], rotation: -1.5 },
    { id: 're_box_roof', kind: 'box', position: [4.1, 0, -1.6], rotation: 0.3 },
  ],
  river_pier: [
    { id: 'rp_bottle_1', kind: 'bottle', position: [1.1, 0, -3.2], rotation: 0.4 },
    { id: 'rp_bottle_2', kind: 'bottle', position: [-2.3, 0, -1.8], rotation: 1.8 },
    { id: 'rp_can_1', kind: 'can', position: [3.2, 0, -4.4], rotation: 2.5 },
    { id: 'rp_box_1', kind: 'box', position: [-4.2, 0, -0.6], rotation: 0.9 },
    // AAA: more tactile clutter near fire + water — kickable cans + barrel for living pier feel
    { id: 'rp_barrel_fire', kind: 'barrel', position: [0.8, 0, -1.4], rotation: 0.6 },
    { id: 'rp_can_fire1', kind: 'can', position: [-0.9, 0, -1.1], rotation: 1.1 },
    { id: 'rp_can_fire2', kind: 'can', position: [1.6, 0, -0.7], rotation: -0.9 },
  ],
  factory_basement: [
    { id: 'fb_box_1', kind: 'box', position: [2.2, 0, 4.4], rotation: 0.7 },
    { id: 'fb_can_1', kind: 'can', position: [-1.8, 0, 2.6], rotation: 1.3 },
    { id: 'fb_bottle_1', kind: 'bottle', position: [-3.4, 0, 5.2], rotation: 2.2 },
    // WS19-B — +3 props for thin-coverage scene (was 3)
    { id: 'fb_barrel_1', kind: 'barrel', position: [4.1, 0, -1.8], rotation: 0.4 },
    { id: 'fb_can_2', kind: 'can', position: [-0.6, 0, -3.9], rotation: -1.7 },
    { id: 'fb_box_2', kind: 'box', position: [1.5, 0, 0.8], rotation: 2.3 },
  ],
  // AAA: more physical play in key hubs — cans, bottles, boxes everywhere
  cafe_evening: [
    { id: 'ce_can_1', kind: 'can', position: [-2.8, 0, 1.2], rotation: 0.8 },
    { id: 'ce_bottle_1', kind: 'bottle', position: [1.9, 0, -2.1], rotation: 1.4 },
    { id: 'ce_can_2', kind: 'can', position: [3.1, 0, 2.8], rotation: 2.9 },
    // WS18-B — +2 props for thin-coverage scene (was 3)
    { id: 'ce_box_1', kind: 'box', position: [-1.4, 0, -2.6], rotation: 0.6 },
    { id: 'ce_bottle_2', kind: 'bottle', position: [2.4, 0, 0.8], rotation: -1.2 },
    // WS20-B — +2 props for thin-coverage scene (was 5)
    { id: 'ws20b_ce_ashtray', kind: 'can', position: [-0.6, 0, -1.8], rotation: 0.9 },
    { id: 'ws20b_ce_sugar_bowl', kind: 'box', position: [0.3, 0, -0.5], rotation: -0.3 },
  ],
  office_day: [
    { id: 'od_box_1', kind: 'box', position: [1.4, 0, -3.2], rotation: 0.4 },
    { id: 'od_can_1', kind: 'can', position: [-2.1, 0, 1.8], rotation: 1.1 },
    { id: 'od_bottle_1', kind: 'bottle', position: [4.2, 0, -1.6], rotation: 0.6 },
    // WS18-B — +2 props for thin-coverage scene (was 3)
    { id: 'od_can_2', kind: 'can', position: [-3.6, 0, -2.4], rotation: 2.0 },
    { id: 'od_barrel_1', kind: 'barrel', position: [0.5, 0, 2.2], rotation: 0 },
    // WS26-B — +3 props for thin-coverage scene (was 5)
    { id: 'ws26_od_can_coffee', kind: 'can', position: [-1.0, 0, -2.5], rotation: 0.9 },
    { id: 'ws26_od_box_paper', kind: 'box', position: [3.5, 0, 1.5], rotation: 0.3 },
    { id: 'ws26_od_bottle_water', kind: 'bottle', position: [-4.5, 0, 1.5], rotation: -1.4 },
  ],
  library_day: [
    { id: 'ld_box_1', kind: 'box', position: [-1.6, 0, 2.9], rotation: 1.8 },
    { id: 'ld_can_1', kind: 'can', position: [3.3, 0, -2.4], rotation: 0.2 },
    // WS17-B: +2 props for thin-coverage scene (was 2)
    { id: 'ld_bottle_1', kind: 'bottle', position: [-2.8, 0, -1.5], rotation: 0.7 },
    { id: 'ld_can_2', kind: 'can', position: [0.5, 0, 4.1], rotation: -1.3 },
    // WS26-B — +2 props for thin-coverage scene (was 4)
    { id: 'ws26_ld_can_dust', kind: 'can', position: [2.5, 0, 3.5], rotation: 0.6 },
    { id: 'ws26_ld_box_returns', kind: 'box', position: [-3.5, 0, 1.5], rotation: 1.1 },
  ],
  factory_roof: [
    { id: 'fr_can_1', kind: 'can', position: [-3.1, 0, 1.8], rotation: 2.3 },
    { id: 'fr_barrel_1', kind: 'barrel', position: [2.4, 0, -2.9], rotation: 0.9 },
    // WS17-B: +2 props for thin-coverage scene (was 2)
    { id: 'fr_bottle_1', kind: 'bottle', position: [1.0, 0, 3.5], rotation: 1.4 },
    { id: 'fr_box_1', kind: 'box', position: [-4.5, 0, -1.2], rotation: 0.6 },
    // WS23-B — +3 props for thin-coverage scene (was 4)
    { id: 'ws23b_fr_can_rust', kind: 'can', position: [5.2, 0, -0.8], rotation: -1.4 },
    { id: 'ws23b_fr_barrel_cable', kind: 'barrel', position: [-2.0, 0, -3.5], rotation: 0.2 },
    { id: 'ws23b_fr_box_tools', kind: 'box', position: [3.7, 0, 2.1], rotation: 1.6 },
  ],
  home_evening: [
    { id: 'he_can_1', kind: 'can', position: [0.8, 0, -1.9], rotation: 0.5 },
    { id: 'he_bottle_1', kind: 'bottle', position: [-1.3, 0, 1.4], rotation: 1.7 },
    // WS17-B: +2 props for thin-coverage scene (was 2)
    { id: 'he_box_1', kind: 'box', position: [2.2, 0, -0.6], rotation: 0.9 },
    { id: 'he_can_2', kind: 'can', position: [-0.4, 0, -3.1], rotation: -1.1 },
  ],
  underground_bunker: [
    { id: 'ub_box_1', kind: 'box', position: [1.1, 0, 3.8], rotation: 0.3 },
    { id: 'ub_can_1', kind: 'can', position: [-2.9, 0, -1.2], rotation: 2.1 },
    // WS17-B: +2 props for thin-coverage scene (was 2)
    { id: 'ub_barrel_1', kind: 'barrel', position: [-4.2, 0, 2.5], rotation: 0.8 },
    { id: 'ub_bottle_1', kind: 'bottle', position: [3.0, 0, -3.4], rotation: -0.6 },
  ],
  guild_mainframe: [
    { id: 'gm_can_1', kind: 'can', position: [-1.7, 0, 2.3], rotation: 1.5 },
    { id: 'gm_bottle_1', kind: 'bottle', position: [2.6, 0, -3.1], rotation: 0.7 },
    // WS17-B: +2 props for thin-coverage scene (was 2)
    { id: 'gm_box_1', kind: 'box', position: [0.8, 0, 1.5], rotation: 1.2 },
    { id: 'gm_can_2', kind: 'can', position: [-3.4, 0, -2.0], rotation: 0.3 },
    // WS21-B — +3 props for thin-coverage scene (was 4)
    { id: 'ws21b_gm_barrel_cable', kind: 'barrel', position: [3.8, 0, 2.1], rotation: 0.5 },
    { id: 'ws21b_gm_can_antistatic', kind: 'can', position: [-0.5, 0, -3.8], rotation: -1.6 },
    { id: 'ws21b_gm_box_spare', kind: 'box', position: [1.9, 0, -1.0], rotation: 2.1 },
    // WS23-B — +2 props for thin-coverage scene (was 7)
    { id: 'ws23b_gm_barrel_backup', kind: 'barrel', position: [-4.1, 0, -4.2], rotation: 0.8 },
    { id: 'ws23b_gm_can_tape', kind: 'can', position: [4.5, 0, 0.3], rotation: -2.0 },
  ],
  // AAA: tactile living pier — pushable clutter near water + fire (evening variant)
  pier_evening: [
    { id: 'pe_bottle_1', kind: 'bottle', position: [1.4, 0, -2.9], rotation: 0.5 },
    { id: 'pe_can_1', kind: 'can', position: [-1.1, 0, -1.6], rotation: 1.8 },
    { id: 'pe_can_2', kind: 'can', position: [2.1, 0, -0.9], rotation: -1.2 },
    { id: 'pe_barrel', kind: 'barrel', position: [-0.6, 0, -0.4], rotation: 0.3 },
    // WS22-B — +3 props for thin-coverage scene (was 4)
    { id: 'ws22b_pe_box_bait', kind: 'box', position: [2.8, 0, -3.6], rotation: 0.7 },
    { id: 'ws22b_pe_can_rust', kind: 'can', position: [-2.4, 0, -2.1], rotation: 1.3 },
    { id: 'ws22b_pe_bottle_glow', kind: 'bottle', position: [0.6, 0, 1.2], rotation: -0.8 },
  ],
  // AAA: dusty library basement tactile props — kickable cans + crates in stale air (pairs with volumetric shafts)
  library_basement: [
    { id: 'lb_can_1', kind: 'can', position: [1.8, 0, 2.4], rotation: 0.8 },
    { id: 'lb_can_2', kind: 'can', position: [-2.1, 0, -1.9], rotation: -1.3 },
    { id: 'lb_box_books', kind: 'box', position: [3.4, 0, 0.7], rotation: 0.2 },
    { id: 'lb_barrel_old', kind: 'barrel', position: [-0.7, 0, 3.6], rotation: 1.1 },
  ],
  // AAA: post-combat tactile world — debris cans/boxes/barrel after battle (makes combat hub feel lived-in)
  battle: [
    { id: 'bt_can_1', kind: 'can', position: [-2.8, 0, 3.1], rotation: 0.7 },
    { id: 'bt_can_2', kind: 'can', position: [3.4, 0, -2.6], rotation: -1.1 },
    { id: 'bt_box_shell', kind: 'box', position: [-1.2, 0, -4.2], rotation: 0.4 },
    { id: 'bt_barrel_debris', kind: 'barrel', position: [4.1, 0, 1.8], rotation: 1.6 },
    // WS22-B — +2 props for thin-coverage scene (was 4)
    { id: 'ws22b_bt_bottle_shattered', kind: 'bottle', position: [-3.6, 0, -1.4], rotation: 0.9 },
    { id: 'ws22b_bt_box_ammo', kind: 'box', position: [1.8, 0, 3.4], rotation: -0.6 },
  ],
  // AAA Phase A/C: intimate lived-in clutter for cozy domestic rooms (kickable cans/bottles/boxes — makes them feel inhabited, show-don't-tell)
  albert_backroom: [
    { id: 'ab_can_1', kind: 'can', position: [1.4, 0, -0.8], rotation: 0.6 },
    { id: 'ab_bottle_1', kind: 'bottle', position: [-0.9, 0, 1.2], rotation: -0.8 },
    { id: 'ab_box_1', kind: 'box', position: [0.7, 0, 2.1], rotation: 0.3 },
    // WS19-B — +2 props for thin-coverage scene (was 3)
    { id: 'ab_barrel_1', kind: 'barrel', position: [-2.4, 0, -1.6], rotation: 0.2 },
    { id: 'ab_can_2', kind: 'can', position: [2.8, 0, 1.4], rotation: -1.3 },
  ],
  solnysh_room: [
    { id: 'sr_can_1', kind: 'can', position: [-1.6, 0, 1.8], rotation: 1.2 },
    { id: 'sr_bottle_1', kind: 'bottle', position: [2.1, 0, -1.4], rotation: -0.5 },
    { id: 'sr_can_2', kind: 'can', position: [0.4, 0, -2.3], rotation: 0.9 },
    // WS19-B — +3 props for thin-coverage scene (was 3)
    { id: 'sr_box_1', kind: 'box', position: [-2.2, 0, -0.6], rotation: 0.8 },
    { id: 'sr_bottle_2', kind: 'bottle', position: [1.3, 0, 2.6], rotation: 1.4 },
    { id: 'sr_can_3', kind: 'can', position: [-0.8, 0, -1.9], rotation: -2.1 },
  ],
  zarema_albert_room: [
    { id: 'zar_can_1', kind: 'can', position: [-0.8, 0, 1.5], rotation: 0.4 },
    { id: 'zar_bottle_1', kind: 'bottle', position: [1.9, 0, -0.7], rotation: 1.7 },
    { id: 'zar_box_1', kind: 'box', position: [-1.3, 0, -1.9], rotation: -0.6 },
    // WS20-B — +3 props for thin-coverage scene (was 3)
    { id: 'ws20b_zar_book_stack', kind: 'box', position: [0.5, 0, -2.4], rotation: 0.2 },
    { id: 'ws20b_zar_teacup', kind: 'can', position: [-0.3, 0, 0.8], rotation: 1.1 },
    { id: 'ws20b_zar_photo_frame', kind: 'box', position: [1.4, 0, -1.2], rotation: -0.5 },
  ],
  zarema_room: [
    { id: 'zr_can_1', kind: 'can', position: [1.1, 0, 0.9], rotation: -1.1 },
    { id: 'zr_bottle_1', kind: 'bottle', position: [-2.4, 0, 1.6], rotation: 0.7 },
    { id: 'zr_can_2', kind: 'can', position: [0.6, 0, -2.0], rotation: 1.4 },
    // WS21-B — +3 props for thin-coverage scene (was 3)
    { id: 'ws21b_zr_box_books', kind: 'box', position: [-1.8, 0, -1.5], rotation: 0.4 },
    { id: 'ws21b_zr_can_pencil', kind: 'can', position: [0.3, 0, 1.8], rotation: -0.8 },
    { id: 'ws21b_zr_bottle_ink', kind: 'bottle', position: [2.1, 0, -0.6], rotation: 1.2 },
  ],
  // AAA Phase A: ethereal "memory fragments" in the dream — kickable cans/bottles/boxes as poetic remnants of the past.
  // They float in the galaxy dream and give tactile "show-don't-tell" storytelling when interacted with.
  sleep_dream: [
    { id: 'sd_memory_can', kind: 'can', position: [-1.8, 1.2, 2.4], rotation: 0.5 },
    { id: 'sd_memory_bottle', kind: 'bottle', position: [2.3, 2.1, -1.6], rotation: -1.2 },
    { id: 'sd_memory_box', kind: 'box', position: [0.4, 0.8, -3.1], rotation: 0.9 },
    { id: 'sd_faded_can', kind: 'can', position: [-3.1, 3.4, 0.7], rotation: 1.8 },
  ],
  // AAA: tactile campsite around the CHK fire — cans, bottles, crates near warmth (living world + props + shafts already rich)
  chk_campfire_night: [
    { id: 'chkc_can_1', kind: 'can', position: [1.4, 0, 1.1], rotation: 0.8 },
    { id: 'chkc_bottle_1', kind: 'bottle', position: [-1.2, 0, -0.9], rotation: -0.6 },
    { id: 'chkc_crate', kind: 'box', position: [2.8, 0, -2.1], rotation: 0.3 },
    { id: 'chkc_can_2', kind: 'can', position: [-0.7, 0, 2.5], rotation: 1.5 },
    // WS22-B — +3 props for thin-coverage scene (was 4)
    { id: 'ws22b_chkc_box_firewood', kind: 'box', position: [3.6, 0, 0.4], rotation: -0.9 },
    { id: 'ws22b_chkc_barrel_rain', kind: 'barrel', position: [-2.8, 0, 1.8], rotation: 0.4 },
    { id: 'ws22b_chkc_can_ash', kind: 'can', position: [0.2, 0, -2.3], rotation: 2.1 },
  ],
  // WS15-C: dynamic props for thin-coverage scenes
  volodka_corridor: [
    { id: 'vc_can_1', kind: 'can', position: [1.2, 0, -3.5], rotation: 0.4 },
    { id: 'vc_box_1', kind: 'box', position: [-0.8, 0, -1.2], rotation: 1.1 },
    { id: 'vc_bottle_1', kind: 'bottle', position: [2.4, 0, -5.0], rotation: -0.7 },
    // WS20-B — +3 props for thin-coverage scene (was 3)
    { id: 'ws20b_vc_wet_boot_tray', kind: 'box', position: [-1.5, 0, 4.2], rotation: 0.3 },
    { id: 'ws20b_vc_coat_hook', kind: 'bottle', position: [0.8, 0, 5.5], rotation: 1.5 },
    { id: 'ws20b_vc_cable_bundle', kind: 'barrel', position: [3.1, 0, -2.8], rotation: -0.4 },
  ],
  street_winter: [
    { id: 'sw_can_1', kind: 'can', position: [1.8, 0, 2.4], rotation: 0.6 },
    { id: 'sw_bottle_1', kind: 'bottle', position: [-2.5, 0, -1.8], rotation: 1.3 },
    { id: 'sw_barrel_1', kind: 'barrel', position: [3.6, 0, -3.2], rotation: 0 },
    { id: 'sw_box_1', kind: 'box', position: [-1.4, 0, 4.1], rotation: 0.9 },
    // WS23-B — +3 props for thin-coverage scene (was 4)
    { id: 'ws23b_sw_can_snowdrift', kind: 'can', position: [4.2, 0, -1.5], rotation: -0.7 },
    { id: 'ws23b_sw_box_ice', kind: 'box', position: [-3.8, 0, 2.7], rotation: 0.4 },
    { id: 'ws23b_sw_bottle_frozen', kind: 'bottle', position: [0.5, 0, -4.6], rotation: 1.8 },
  ],
  city_square: [
    { id: 'cs_barrel_1', kind: 'barrel', position: [-3.8, 0, 1.6], rotation: 0.2 },
    { id: 'cs_box_1', kind: 'box', position: [2.1, 0, -2.8], rotation: 1.4 },
    { id: 'cs_can_1', kind: 'can', position: [4.5, 0, 3.2], rotation: -0.5 },
    { id: 'cs_bottle_1', kind: 'bottle', position: [-1.6, 0, -4.4], rotation: 0.8 },
    // WS21-B — +2 props for thin-coverage scene (was 4)
    { id: 'ws21b_cs_can_pigeon_feed', kind: 'can', position: [0.5, 0, 1.0], rotation: 0.9 },
    { id: 'ws21b_cs_box_fountain_debris', kind: 'box', position: [-2.2, 0, -1.5], rotation: -0.3 },
  ],
  forest_clearing: [
    { id: 'fc_bottle_1', kind: 'bottle', position: [-2.4, 0, 1.8], rotation: 1.2 },
    { id: 'fc_can_1', kind: 'can', position: [1.6, 0, -3.2], rotation: -0.9 },
    // WS17-B: +2 props for thin-coverage scene (was 2)
    { id: 'fc_box_1', kind: 'box', position: [3.8, 0, 2.2], rotation: 0.5 },
    { id: 'fc_can_2', kind: 'can', position: [-0.6, 0, -1.5], rotation: 1.7 },
  ],
};
