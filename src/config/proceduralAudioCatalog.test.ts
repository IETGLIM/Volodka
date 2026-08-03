import { describe, expect, it } from 'vitest';
import { SCENE_DEFINITIONS, SCENE_IDS } from '@/config/sceneDefinitions';
import { SCENE_DERIVED_FROM, resolveDerivedSceneId } from '@/config/sceneInheritance';
import { QUATERNIUS_STORY_NPC_SLOT_IDS } from '@/config/quaterniusNpcSlots';
import {
  SCENE_AUDIO_PROFILES,
  CHARACTER_MOTIFS,
  STORY_NPCS_WITHOUT_DEDICATED_MOTIFS,
  deriveCharacterMotifFromNpcId,
  getCharacterMotif,
  getSceneAudioProfile,
  getSceneMusicMood,
  getSceneReverbPreset,
  hasDedicatedCharacterMotif,
} from '@/config/proceduralAudioCatalog';

const EXTENSION_SCENE_IDS = [
  'chk_campfire_night',
  'pier_evening',
  'factory_roof',
  'library_basement',
  'city_square',
  'underground_bunker',
  'guild_mainframe',
  'zarema_room',
  'albert_backroom',
] as const;

describe('proceduralAudioCatalog', () => {
  it('registers explicit audio profiles for all 9 extension scenes', () => {
    for (const sceneId of EXTENSION_SCENE_IDS) {
      const profile = SCENE_AUDIO_PROFILES[sceneId];
      expect(profile, sceneId).toBeTruthy();
      expect(profile?.sceneId).toBe(sceneId);
      expect(profile?.reverbPreset).toBeTruthy();
      expect(profile?.musicMood).toBeTruthy();
    }
  });

  it('every shipped scene has a catalog entry or documented inherit rule', () => {
    // FIX S13-14: forest_clearing added as 29th scene — derives audio profile
    // from chk_forest_zorge via SCENE_DERIVED_FROM (sceneInheritance.ts).
    expect(SCENE_IDS.length).toBe(29);

    for (const sceneId of SCENE_IDS) {
      const direct = SCENE_AUDIO_PROFILES[sceneId];
      const resolved = getSceneAudioProfile(sceneId);
      const parentId = resolveDerivedSceneId(sceneId);

      expect(
        direct ?? resolved ?? parentId,
        `${sceneId}: missing profile and no resolvable parent`,
      ).toBeTruthy();

      if (!direct) {
        expect(
          SCENE_DERIVED_FROM[sceneId],
          `${sceneId} has no direct profile — must inherit via SCENE_DERIVED_FROM`,
        ).toBeTruthy();
      }
    }
  });

  it('extension profiles match parent mood/reverb from scene inheritance', () => {
    const expected: Record<(typeof EXTENSION_SCENE_IDS)[number], { parent: string }> = {
      chk_campfire_night: { parent: 'chk_forest_zorge' },
      pier_evening: { parent: 'river_pier' },
      factory_roof: { parent: 'rooftop_edge' },
      library_basement: { parent: 'library_day' },
      city_square: { parent: 'street_night' },
      underground_bunker: { parent: 'factory_basement' },
      guild_mainframe: { parent: 'office_day' },
      zarema_room: { parent: 'zarema_albert_room' },
      albert_backroom: { parent: 'cafe_evening' },
    };

    for (const [variant, { parent }] of Object.entries(expected)) {
      const variantProfile = getSceneAudioProfile(variant)!;
      const parentProfile = getSceneAudioProfile(parent)!;
      expect(variantProfile.reverbPreset, variant).toBe(parentProfile.reverbPreset);
      expect(variantProfile.musicMood, variant).toBe(parentProfile.musicMood);
    }
  });

  it('getSceneReverbPreset and getSceneMusicMood resolve for all scenes', () => {
    for (const sceneId of Object.keys(SCENE_DEFINITIONS)) {
      expect(getSceneReverbPreset(sceneId), sceneId).toBeTruthy();
      expect(getSceneMusicMood(sceneId), sceneId).toBeTruthy();
    }
  });

  it('getCharacterMotif always returns synth params for any npc id', () => {
    for (const npcId of QUATERNIUS_STORY_NPC_SLOT_IDS) {
      const motif = getCharacterMotif(npcId);
      expect(motif.intervals.length).toBeGreaterThan(0);
      expect(motif.rootMidi).toBeGreaterThan(0);
      expect(motif.stinger).toBeTruthy();
    }
  });

  it('deriveCharacterMotifFromNpcId is stable for the same npc id', () => {
    const first = deriveCharacterMotifFromNpcId('fisherman_trofim');
    const second = deriveCharacterMotifFromNpcId('fisherman_trofim');
    expect(second).toEqual(first);
  });

  it('hero hub scenes have distinct reverb presets (pier / CHK / factory)', () => {
    expect(getSceneReverbPreset('river_pier')).toBe('large_space');
    expect(getSceneReverbPreset('chk_forest_zorge')).toBe('nature');
    expect(getSceneReverbPreset('abandoned_factory')).toBe('corridor');
    expect(getSceneMusicMood('river_pier')).toBe('noir_street');
    expect(getSceneMusicMood('chk_forest_zorge')).toBe('nature');
    expect(getSceneMusicMood('abandoned_factory')).toBe('tension');
  });

  it('lists story NPCs still on hash-derived fallback stubs', () => {
    for (const npcId of STORY_NPCS_WITHOUT_DEDICATED_MOTIFS) {
      expect(hasDedicatedCharacterMotif(npcId)).toBe(false);
      expect(getCharacterMotif(npcId).npcId).toBe(npcId);
    }
    expect(CHARACTER_MOTIFS.chk_ru).toBeTruthy();
  });
});
