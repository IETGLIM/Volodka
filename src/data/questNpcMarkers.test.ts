import { describe, expect, it } from 'vitest';
import {
  getObjectiveNpcHint,
  getObjectiveSceneHint,
  QUEST_OBJECTIVE_NPC_HINTS,
  QUEST_OBJECTIVE_SCENE_HINTS,
} from '@/data/questNpcMarkers';
import { ACT1_SOLNYSH_QUEST_SPINE, GOLDEN_PATH_QUEST_SPINE } from '@/data/goldenPath';

describe('ACT1_SOLNYSH_QUEST_SPINE', () => {
  it('is included in GOLDEN_PATH_QUEST_SPINE after poetry_collection', () => {
    const idx = GOLDEN_PATH_QUEST_SPINE.indexOf('poetry_collection');
    expect(GOLDEN_PATH_QUEST_SPINE.slice(idx + 1, idx + 4)).toEqual(ACT1_SOLNYSH_QUEST_SPINE);
  });
});

describe('questNpcMarkers solnysh', () => {
  it('maps wine search to lyonya and comfort to vera', () => {
    expect(getObjectiveNpcHint('solnysh_roof_wine', 'find_wine')).toBe('lyonya');
    expect(getObjectiveNpcHint('solnysh_comfort', 'comfort_solnysh')).toBe('solnysh');
  });

  it('provides scene hints for corridor and room', () => {
    expect(getObjectiveSceneHint('solnysh_comfort', 'talk_solnysh')?.sceneId).toBe('volodka_corridor');
    expect(getObjectiveSceneHint('solnysh_roof_wine', 'find_wine')?.sceneId).toBe('solnysh_room');
    expect(getObjectiveSceneHint('solnysh_roof_wine', 'roof_toast')?.sceneId).toBe('rooftop_edge');
  });

  it('covers all solnysh quest objectives', () => {
    for (const questId of ACT1_SOLNYSH_QUEST_SPINE) {
      expect(QUEST_OBJECTIVE_NPC_HINTS[questId]).toBeDefined();
    }
  });
});

describe('questNpcMarkers — оживлённые квесты (v4.9.0)', () => {
  it('AAA-пак имеет NPC-подсказки у гиверов', () => {
    expect(getObjectiveNpcHint('aaa_maria_lost_diary', 'accept_lost_diary')).toBe('maria');
    expect(getObjectiveNpcHint('aaa_sewer_echo', 'hear_trofim_whisper')).toBe('fisherman_trofim');
    expect(getObjectiveNpcHint('aaa_boris_poem_smuggling', 'accept_smuggling_brief')).toBe('boris');
    expect(getObjectiveNpcHint('aaa_library_old_photo', 'return_photo_to_tamara')).toBe('tamara');
    expect(getObjectiveNpcHint('aaa_factory_broken_mechanism', 'accept_mechanism_repair')).toBe('baba_zina');
    expect(getObjectiveNpcHint('aaa_trofim_night_philosophy', 'meet_trofim_late_night')).toBe('fisherman_trofim');
    expect(getObjectiveNpcHint('aaa_chk_campfire_legends', 'accept_campfire_duty')).toBe('chk_based');
    expect(getObjectiveNpcHint('aaa_epilogue_last_letter', 'receive_letter_from_albert')).toBe('albert');
  });

  it('NPC-подсказки ссылаются на существующих NPC реестра', async () => {
    const { ALL_NPC_DEFINITIONS } = await import('@/data/allNpcDefinitions');
    const known = new Set(ALL_NPC_DEFINITIONS.map((n) => n.id));
    const aliases = new Set(['vera']); // алиас солныш в маркерах
    for (const [questId, objectives] of Object.entries(QUEST_OBJECTIVE_NPC_HINTS)) {
      for (const npcId of Object.values(objectives)) {
        expect(known.has(npcId) || aliases.has(npcId), `${questId} → ${npcId}`).toBe(true);
      }
    }
  });

  it('сцены-подсказки ссылаются на существующие сцены', async () => {
    const { SCENE_DEFINITIONS } = await import('@/config/sceneDefinitions');
    const sceneIds = new Set(Object.keys(SCENE_DEFINITIONS));
    expect(sceneIds.size).toBeGreaterThan(0);
    for (const [questId, objectives] of Object.entries(QUEST_OBJECTIVE_SCENE_HINTS)) {
      for (const [objectiveId, hint] of Object.entries(objectives)) {
        expect(sceneIds.has(hint.sceneId), `${questId}.${objectiveId} → сцена ${hint.sceneId}`).toBe(true);
      }
    }
  });
});
